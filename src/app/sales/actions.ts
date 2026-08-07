"use server";

import { InventoryMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getActionErrorMessage, type FormActionState } from "@/lib/action-state";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  assertReturnQuantity,
  calculateReturnLineAmount,
  getSaleStatusAfterReturn,
} from "@/lib/sales/returns";
import { assertPaymentsMatchTotal, calculateSaleTotals } from "@/lib/sales/totals";
import {
  completeSaleSchema,
  createSaleReturnSchema,
  voidSaleSchema,
} from "@/lib/validation/sale";
import { getProductStock } from "@/server/inventory/stock";
import { recordAuditLog } from "@/server/audit/audit-log";

export type SaleFormState = FormActionState & {
  saleId?: string;
  visibleNumber?: number;
};
export type SaleDetailFormState = FormActionState;

function getSaleItemsFromForm(formData: FormData) {
  const productIds = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const unitPrices = formData.getAll("unitPrice").map(String);
  const lineDiscounts = formData.getAll("lineDiscount").map(String);

  return productIds
    .map((productId, index) => ({
      productId,
      quantity: quantities[index] ?? "",
      unitPrice: unitPrices[index] ?? "",
      lineDiscount: lineDiscounts[index] ?? "0",
    }))
    .filter((item) => item.productId || item.quantity || item.unitPrice);
}

function getSalePaymentsFromForm(formData: FormData) {
  const paymentMethodIds = formData.getAll("paymentMethodId").map(String);
  const amounts = formData.getAll("paymentAmount").map(String);
  const references = formData.getAll("paymentReference").map(String);

  return paymentMethodIds
    .map((paymentMethodId, index) => ({
      paymentMethodId,
      amount: amounts[index] ?? "",
      reference: references[index] ?? "",
    }))
    .filter((payment) => payment.paymentMethodId || payment.amount);
}

function getSaleReturnItemsFromForm(formData: FormData) {
  const saleItemIds = formData.getAll("saleItemId").map(String);
  const quantities = formData.getAll("returnQuantity").map(String);

  return saleItemIds.map((saleItemId, index) => ({
    saleItemId,
    quantity: quantities[index] ?? "0",
  }));
}

async function completeSale(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "sales.create");

  const parsed = completeSaleSchema.safeParse({
    notes: formData.get("notes"),
    items: getSaleItemsFromForm(formData),
    payments: getSalePaymentsFromForm(formData),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  return prisma.$transaction(async (tx) => {
    const productIds = parsed.data.items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        averageCost: true,
      },
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    if (products.length !== new Set(productIds).size) {
      throw new Error("Uno o mas productos no estan disponibles para venta.");
    }

    const saleItemsForTotals = parsed.data.items.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error("Producto invalido.");
      }

      if (item.lineDiscount > item.quantity * item.unitPrice) {
        throw new Error(`El descuento de ${product.name} supera el total de la linea.`);
      }

      return {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineDiscount: item.lineDiscount,
        unitCost: product.averageCost,
      };
    });
    const totals = calculateSaleTotals(saleItemsForTotals);
    assertPaymentsMatchTotal({
      payments: parsed.data.payments,
      total: totals.finalTotal,
    });

    const paymentMethodIds = parsed.data.payments.map((payment) => payment.paymentMethodId);
    const paymentMethods = await tx.paymentMethod.findMany({
      where: { id: { in: paymentMethodIds }, active: true },
      select: { id: true, name: true },
    });

    if (paymentMethods.length !== new Set(paymentMethodIds).size) {
      throw new Error("Uno o mas medios de pago no estan disponibles.");
    }

    const cashPaymentMethodIds = new Set(
      paymentMethods
        .filter((paymentMethod) => paymentMethod.name === "Efectivo")
        .map((paymentMethod) => paymentMethod.id),
    );
    const hasCashPayment = parsed.data.payments.some(
      (payment) =>
        cashPaymentMethodIds.has(payment.paymentMethodId) && payment.amount > 0,
    );
    const openCashSession = hasCashPayment
      ? await tx.cashSession.findFirst({
          where: { status: "OPEN" },
          orderBy: { openedAt: "desc" },
          select: { id: true },
        })
      : null;

    if (hasCashPayment && !openCashSession) {
      throw new Error("Debes abrir caja antes de registrar pagos en efectivo.");
    }

    const lastSale = await tx.sale.findFirst({
      orderBy: { visibleNumber: "desc" },
      select: { visibleNumber: true },
    });
    const visibleNumber = (lastSale?.visibleNumber ?? 0) + 1;

    const sale = await tx.sale.create({
      data: {
        visibleNumber,
        userId: currentUser.id,
        status: "COMPLETED",
        grossTotal: totals.grossTotal,
        totalDiscount: totals.totalDiscount,
        finalTotal: totals.finalTotal,
        estimatedCostTotal: totals.estimatedCostTotal,
        estimatedMarginTotal: totals.estimatedMarginTotal,
        cashSessionId: openCashSession?.id,
        notes: parsed.data.notes,
      },
    });

    for (const item of parsed.data.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error("Producto invalido.");
      }

      const previousStock = await getProductStock(item.productId, tx);
      const resultingStock = previousStock - item.quantity;

      if (resultingStock < 0) {
        throw new Error(`Stock insuficiente para ${product.name}.`);
      }

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          originalUnitPrice: item.unitPrice,
          lineDiscount: item.lineDiscount,
          finalUnitPrice: item.unitPrice - Math.round(item.lineDiscount / item.quantity),
          historicalUnitCost: product.averageCost,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: -item.quantity,
          type: InventoryMovementType.SALE,
          userId: currentUser.id,
          sourceEntity: "Sale",
          sourceEntityId: sale.id,
          saleId: sale.id,
          reason: `Venta #${sale.visibleNumber}`,
          previousStock,
          resultingStock,
        },
      });
    }

    for (const payment of parsed.data.payments) {
      await tx.payment.create({
        data: {
          saleId: sale.id,
          paymentMethodId: payment.paymentMethodId,
          amount: payment.amount,
          reference: payment.reference,
          userId: currentUser.id,
          cashSessionId: cashPaymentMethodIds.has(payment.paymentMethodId)
            ? openCashSession?.id
            : undefined,
        },
      });
    }

    return sale;
  });
}

export async function completeSaleFormAction(
  _state: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  try {
    const sale = await completeSale(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: "sales.complete",
      entity: "Sale",
      entityId: sale.id,
      nextData: sale,
    });
    revalidatePath("/sales");
    revalidatePath("/products");
    revalidatePath("/inventory/movements");
    revalidatePath("/dashboard");
    revalidatePath("/cash");
    return {
      ok: true,
      message: `Venta #${sale.visibleNumber} completada correctamente.`,
      saleId: sale.id,
      visibleNumber: sale.visibleNumber,
    };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function voidSale(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "sales.void");

  const parsed = voidSaleSchema.safeParse({
    saleId: formData.get("saleId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUniqueOrThrow({
      where: { id: parsed.data.saleId },
      include: {
        items: {
          include: {
            returnItems: true,
          },
        },
        inventoryMovements: true,
      },
    });

    if (sale.status === "VOID") {
      throw new Error("La venta ya esta anulada.");
    }

    if (sale.status !== "COMPLETED") {
      throw new Error("Solo se puede anular una venta completada sin devoluciones previas.");
    }

    const hasReturns = sale.items.some((item) => item.returnItems.length > 0);

    if (hasReturns) {
      throw new Error("No se puede anular una venta con devoluciones previas.");
    }

    const saleReturn = await tx.saleReturn.create({
      data: {
        saleId: sale.id,
        userId: currentUser.id,
        type: "VOID",
        reason: parsed.data.reason,
        totalAmount: sale.finalTotal,
      },
    });

    for (const item of sale.items) {
      const previousStock = await getProductStock(item.productId, tx);
      const resultingStock = previousStock + item.quantity;
      const originalMovement = sale.inventoryMovements.find(
        (movement) =>
          movement.productId === item.productId &&
          movement.type === InventoryMovementType.SALE,
      );

      await tx.saleReturnItem.create({
        data: {
          saleReturnId: saleReturn.id,
          saleItemId: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unitAmount: item.finalUnitPrice,
          historicalUnitCost: item.historicalUnitCost,
          lineAmount: calculateReturnLineAmount({
            quantity: item.quantity,
            unitAmount: item.finalUnitPrice,
          }),
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: InventoryMovementType.SALE_VOID,
          userId: currentUser.id,
          sourceEntity: "SaleReturn",
          sourceEntityId: saleReturn.id,
          saleId: sale.id,
          reason: `Anulacion venta #${sale.visibleNumber}: ${parsed.data.reason}`,
          previousStock,
          resultingStock,
          reversedMovementId: originalMovement?.id,
        },
      });
    }

    const updatedSale = await tx.sale.update({
      where: { id: sale.id },
      data: { status: "VOID" },
    });

    return { sale: updatedSale, saleReturn };
  });
}

export async function voidSaleFormAction(
  _state: SaleDetailFormState,
  formData: FormData,
): Promise<SaleDetailFormState> {
  try {
    const { sale, saleReturn } = await voidSale(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: "sales.void",
      entity: "Sale",
      entityId: sale.id,
      nextData: { sale, saleReturn },
      reason: saleReturn.reason,
    });
    revalidatePath("/sales");
    revalidatePath(`/sales/${sale.id}`);
    revalidatePath("/products");
    revalidatePath("/inventory/movements");
    revalidatePath("/dashboard");
    return { ok: true, message: `Venta #${sale.visibleNumber} anulada correctamente.` };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function createSaleReturn(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "sales.void");

  const parsed = createSaleReturnSchema.safeParse({
    saleId: formData.get("saleId"),
    reason: formData.get("reason"),
    items: getSaleReturnItemsFromForm(formData),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUniqueOrThrow({
      where: { id: parsed.data.saleId },
      include: {
        items: {
          include: {
            returnItems: true,
          },
        },
      },
    });

    if (sale.status === "VOID") {
      throw new Error("No se pueden registrar devoluciones en una venta anulada.");
    }

    if (sale.status === "RETURNED") {
      throw new Error("La venta ya fue devuelta completamente.");
    }

    if (sale.status !== "COMPLETED" && sale.status !== "PARTIALLY_RETURNED") {
      throw new Error("La venta no admite devoluciones.");
    }

    const itemMap = new Map(sale.items.map((item) => [item.id, item]));
    let totalAmount = 0;

    for (const returnItem of parsed.data.items) {
      const item = itemMap.get(returnItem.saleItemId);

      if (!item) {
        throw new Error("Linea de venta invalida.");
      }

      assertReturnQuantity(item, returnItem.quantity);
      totalAmount += calculateReturnLineAmount({
        quantity: returnItem.quantity,
        unitAmount: item.finalUnitPrice,
      });
    }

    const saleReturn = await tx.saleReturn.create({
      data: {
        saleId: sale.id,
        userId: currentUser.id,
        type: "CUSTOMER_RETURN",
        reason: parsed.data.reason,
        totalAmount,
      },
    });

    for (const returnItem of parsed.data.items) {
      const item = itemMap.get(returnItem.saleItemId);

      if (!item) {
        throw new Error("Linea de venta invalida.");
      }

      const lineAmount = calculateReturnLineAmount({
        quantity: returnItem.quantity,
        unitAmount: item.finalUnitPrice,
      });
      const previousStock = await getProductStock(item.productId, tx);
      const resultingStock = previousStock + returnItem.quantity;

      await tx.saleReturnItem.create({
        data: {
          saleReturnId: saleReturn.id,
          saleItemId: item.id,
          productId: item.productId,
          quantity: returnItem.quantity,
          unitAmount: item.finalUnitPrice,
          historicalUnitCost: item.historicalUnitCost,
          lineAmount,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: returnItem.quantity,
          type: InventoryMovementType.CUSTOMER_RETURN,
          userId: currentUser.id,
          sourceEntity: "SaleReturn",
          sourceEntityId: saleReturn.id,
          saleId: sale.id,
          reason: `Devolucion venta #${sale.visibleNumber}: ${parsed.data.reason}`,
          previousStock,
          resultingStock,
        },
      });
    }

    const updatedItems = await tx.saleItem.findMany({
      where: { saleId: sale.id },
      include: { returnItems: true },
    });
    const status = getSaleStatusAfterReturn(updatedItems);
    const updatedSale = await tx.sale.update({
      where: { id: sale.id },
      data: { status },
    });

    return { sale: updatedSale, saleReturn };
  });
}

export async function createSaleReturnFormAction(
  _state: SaleDetailFormState,
  formData: FormData,
): Promise<SaleDetailFormState> {
  try {
    const { sale, saleReturn } = await createSaleReturn(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: "sales.return",
      entity: "SaleReturn",
      entityId: saleReturn.id,
      nextData: saleReturn,
      reason: saleReturn.reason,
    });
    revalidatePath("/sales");
    revalidatePath(`/sales/${sale.id}`);
    revalidatePath("/products");
    revalidatePath("/inventory/movements");
    revalidatePath("/dashboard");
    return { ok: true, message: "Devolucion registrada correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}
