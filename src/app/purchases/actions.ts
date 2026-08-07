"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InventoryMovementType } from "@prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { getActionErrorMessage, type FormActionState } from "@/lib/action-state";
import { prisma } from "@/lib/db";
import { uniqueConstraintMessage } from "@/lib/db-errors";
import { calculateWeightedAverageCost } from "@/lib/purchases/costing";
import { calculatePurchaseTotals } from "@/lib/purchases/totals";
import {
  addPurchaseItemSchema,
  createPurchaseSchema,
  createSupplierSchema,
  deletePurchaseItemSchema,
  purchaseIdSchema,
  updatePurchaseDraftSchema,
  updatePurchaseItemSchema,
} from "@/lib/validation/purchase";
import { getProductStock } from "@/server/inventory/stock";
import { recordAuditLog } from "@/server/audit/audit-log";

export type SupplierFormState = FormActionState;
export type PurchaseFormState = FormActionState & {
  purchaseId?: string;
};
export type PurchaseDraftFormState = FormActionState;

function parseDate(value: string | undefined) {
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

function getPurchaseItemsFromForm(formData: FormData) {
  const productIds = formData.getAll("productId").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const unitCosts = formData.getAll("unitCost").map(String);

  return productIds
    .map((productId, index) => ({
      productId,
      quantity: quantities[index] ?? "",
      unitCost: unitCosts[index] ?? "",
    }))
    .filter((item) => item.productId || item.quantity || item.unitCost);
}

export async function createSupplierAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "purchases.create");

  const parsed = createSupplierSchema.safeParse({
    name: formData.get("name"),
    documentNumber: formData.get("documentNumber"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const supplier = await prisma.supplier
    .create({ data: parsed.data })
    .catch((error: unknown) => {
      const message = uniqueConstraintMessage(error, {
        name: "Ya existe un proveedor con ese nombre.",
      });
      throw new Error(message ?? "No se pudo crear el proveedor.");
    });

  await recordAuditLog({
    userId: currentUser.id,
    action: "suppliers.create",
    entity: "Supplier",
    entityId: supplier.id,
    nextData: supplier,
  });

  revalidatePath("/purchases");
}

export async function createSupplierFormAction(
  _state: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  try {
    await createSupplierAction(formData);
    return { ok: true, message: "Proveedor creado correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function createPurchase(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "purchases.create");

  const parsed = createPurchaseSchema.safeParse({
    supplierId: formData.get("supplierId"),
    supplierDocumentNumber: formData.get("supplierDocumentNumber"),
    documentDate: formData.get("documentDate"),
    discount: formData.get("discount") ?? "0",
    additionalCosts: formData.get("additionalCosts") ?? "0",
    notes: formData.get("notes"),
    items: getPurchaseItemsFromForm(formData),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const { subtotal, total } = calculatePurchaseTotals({
    items: parsed.data.items,
    discount: parsed.data.discount,
    additionalCosts: parsed.data.additionalCosts,
  });

  const purchase = await prisma.$transaction(async (tx) => {
    const lastPurchase = await tx.purchase.findFirst({
      orderBy: { internalNumber: "desc" },
      select: { internalNumber: true },
    });
    const internalNumber = (lastPurchase?.internalNumber ?? 0) + 1;

    return tx.purchase.create({
      data: {
        internalNumber,
        supplierId: parsed.data.supplierId,
        supplierDocumentNumber: parsed.data.supplierDocumentNumber,
        documentDate: parseDate(parsed.data.documentDate),
        responsibleUserId: currentUser.id,
        status: "DRAFT",
        subtotal,
        discount: parsed.data.discount,
        additionalCosts: parsed.data.additionalCosts,
        total,
        notes: parsed.data.notes,
        items: {
          create: parsed.data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            lineSubtotal: item.quantity * item.unitCost,
          })),
        },
      },
    });
  });

  await recordAuditLog({
    userId: currentUser.id,
    action: "purchases.createDraft",
    entity: "Purchase",
    entityId: purchase.id,
    nextData: purchase,
  });

  revalidatePath("/purchases");
  return purchase;
}

export async function createPurchaseAction(formData: FormData) {
  const purchase = await createPurchase(formData);
  redirect(`/purchases/${purchase.id}`);
}

export async function createPurchaseFormAction(
  _state: PurchaseFormState,
  formData: FormData,
): Promise<PurchaseFormState> {
  try {
    const purchase = await createPurchase(formData);
    return {
      ok: true,
      message: `Compra #${purchase.internalNumber} creada correctamente.`,
      purchaseId: purchase.id,
    };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function assertDraftPurchase(purchaseId: string) {
  const purchase = await prisma.purchase.findUniqueOrThrow({
    where: { id: purchaseId },
    include: { items: true },
  });

  if (purchase.status !== "DRAFT") {
    throw new Error("Solo se pueden editar compras en borrador.");
  }

  return purchase;
}

async function recalculateDraftPurchaseTotals(purchaseId: string) {
  const purchase = await prisma.purchase.findUniqueOrThrow({
    where: { id: purchaseId },
    include: { items: true },
  });
  const { subtotal, total } = calculatePurchaseTotals({
    items: purchase.items,
    discount: purchase.discount,
    additionalCosts: purchase.additionalCosts,
  });

  return prisma.purchase.update({
    where: { id: purchaseId },
    data: { subtotal, total },
  });
}

export async function updatePurchaseDraftAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "purchases.create");

  const parsed = updatePurchaseDraftSchema.safeParse({
    purchaseId: formData.get("purchaseId"),
    supplierId: formData.get("supplierId"),
    supplierDocumentNumber: formData.get("supplierDocumentNumber"),
    documentDate: formData.get("documentDate"),
    discount: formData.get("discount") ?? "0",
    additionalCosts: formData.get("additionalCosts") ?? "0",
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  await assertDraftPurchase(parsed.data.purchaseId);
  const previous = await prisma.purchase.findUniqueOrThrow({
    where: { id: parsed.data.purchaseId },
  });
  const { subtotal, total } = calculatePurchaseTotals({
    items: await prisma.purchaseItem.findMany({
      where: { purchaseId: parsed.data.purchaseId },
      select: { quantity: true, unitCost: true },
    }),
    discount: parsed.data.discount,
    additionalCosts: parsed.data.additionalCosts,
  });
  const updated = await prisma.purchase.update({
    where: { id: parsed.data.purchaseId },
    data: {
      supplierId: parsed.data.supplierId,
      supplierDocumentNumber: parsed.data.supplierDocumentNumber,
      documentDate: parseDate(parsed.data.documentDate),
      discount: parsed.data.discount,
      additionalCosts: parsed.data.additionalCosts,
      subtotal,
      total,
      notes: parsed.data.notes,
    },
  });

  await recordAuditLog({
    userId: currentUser.id,
    action: "purchases.updateDraft",
    entity: "Purchase",
    entityId: updated.id,
    previousData: previous,
    nextData: updated,
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${updated.id}`);
}

export async function updatePurchaseDraftFormAction(
  _state: PurchaseDraftFormState,
  formData: FormData,
): Promise<PurchaseDraftFormState> {
  try {
    await updatePurchaseDraftAction(formData);
    return { ok: true, message: "Borrador actualizado correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function addPurchaseItemAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "purchases.create");

  const parsed = addPurchaseItemSchema.safeParse({
    purchaseId: formData.get("purchaseId"),
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    unitCost: formData.get("unitCost"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  await assertDraftPurchase(parsed.data.purchaseId);
  const item = await prisma.purchaseItem.create({
    data: {
      purchaseId: parsed.data.purchaseId,
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      unitCost: parsed.data.unitCost,
      lineSubtotal: parsed.data.quantity * parsed.data.unitCost,
    },
  });
  const updated = await recalculateDraftPurchaseTotals(parsed.data.purchaseId);

  await recordAuditLog({
    userId: currentUser.id,
    action: "purchaseItems.create",
    entity: "PurchaseItem",
    entityId: item.id,
    nextData: item,
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${updated.id}`);
}

export async function addPurchaseItemFormAction(
  _state: PurchaseDraftFormState,
  formData: FormData,
): Promise<PurchaseDraftFormState> {
  try {
    await addPurchaseItemAction(formData);
    return { ok: true, message: "Linea agregada correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function updatePurchaseItemAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "purchases.create");

  const parsed = updatePurchaseItemSchema.safeParse({
    purchaseItemId: formData.get("purchaseItemId"),
    quantity: formData.get("quantity"),
    unitCost: formData.get("unitCost"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const previous = await prisma.purchaseItem.findUniqueOrThrow({
    where: { id: parsed.data.purchaseItemId },
    include: { purchase: true },
  });
  await assertDraftPurchase(previous.purchaseId);

  const item = await prisma.purchaseItem.update({
    where: { id: parsed.data.purchaseItemId },
    data: {
      quantity: parsed.data.quantity,
      unitCost: parsed.data.unitCost,
      lineSubtotal: parsed.data.quantity * parsed.data.unitCost,
    },
  });
  const updated = await recalculateDraftPurchaseTotals(previous.purchaseId);

  await recordAuditLog({
    userId: currentUser.id,
    action: "purchaseItems.update",
    entity: "PurchaseItem",
    entityId: item.id,
    previousData: previous,
    nextData: item,
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${updated.id}`);
}

export async function updatePurchaseItemFormAction(
  _state: PurchaseDraftFormState,
  formData: FormData,
): Promise<PurchaseDraftFormState> {
  try {
    await updatePurchaseItemAction(formData);
    return { ok: true, message: "Linea actualizada correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function deletePurchaseItemAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "purchases.create");

  const parsed = deletePurchaseItemSchema.safeParse({
    purchaseItemId: formData.get("purchaseItemId"),
  });

  if (!parsed.success) {
    throw new Error("Linea de compra invalida.");
  }

  const previous = await prisma.purchaseItem.findUniqueOrThrow({
    where: { id: parsed.data.purchaseItemId },
    include: { purchase: { include: { items: true } } },
  });
  await assertDraftPurchase(previous.purchaseId);

  if (previous.purchase.items.length <= 1) {
    throw new Error("La compra debe mantener al menos una linea.");
  }

  await prisma.purchaseItem.delete({
    where: { id: parsed.data.purchaseItemId },
  });
  const updated = await recalculateDraftPurchaseTotals(previous.purchaseId);

  await recordAuditLog({
    userId: currentUser.id,
    action: "purchaseItems.deleteDraft",
    entity: "PurchaseItem",
    entityId: previous.id,
    previousData: previous,
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${updated.id}`);
}

export async function deletePurchaseItemFormAction(
  _state: PurchaseDraftFormState,
  formData: FormData,
): Promise<PurchaseDraftFormState> {
  try {
    await deletePurchaseItemAction(formData);
    return { ok: true, message: "Linea eliminada correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function receivePurchaseAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "purchases.receive");

  const parsed = purchaseIdSchema.safeParse({ purchaseId: formData.get("purchaseId") });
  if (!parsed.success) {
    throw new Error("Compra invalida.");
  }

  const purchase = await prisma.$transaction(async (tx) => {
    const currentPurchase = await tx.purchase.findUniqueOrThrow({
      where: { id: parsed.data.purchaseId },
      include: { items: { include: { product: true } } },
    });

    if (currentPurchase.status !== "DRAFT") {
      throw new Error("Solo se pueden recibir compras en borrador.");
    }

    const received = await tx.purchase.update({
      where: { id: currentPurchase.id },
      data: {
        status: "RECEIVED",
        receivedAt: new Date(),
      },
    });

    for (const item of currentPurchase.items) {
      const previousStock = await getProductStock(item.productId, tx);
      const resultingStock = previousStock + item.quantity;
      const averageCost = calculateWeightedAverageCost({
        currentStock: previousStock,
        currentAverageCost: item.product.averageCost,
        incomingQuantity: item.quantity,
        incomingUnitCost: item.unitCost,
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: InventoryMovementType.PURCHASE_RECEIVED,
          userId: currentUser.id,
          sourceEntity: "Purchase",
          sourceEntityId: currentPurchase.id,
          purchaseId: currentPurchase.id,
          reason: `Recepcion compra #${currentPurchase.internalNumber}`,
          previousStock,
          resultingStock,
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          lastPurchaseCost: item.unitCost,
          averageCost,
        },
      });
    }

    return received;
  });

  await recordAuditLog({
    userId: currentUser.id,
    action: "purchases.receive",
    entity: "Purchase",
    entityId: purchase.id,
    nextData: purchase,
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${purchase.id}`);
  revalidatePath("/products");
  revalidatePath("/inventory/movements");
}

export async function receivePurchaseFormAction(
  _state: PurchaseDraftFormState,
  formData: FormData,
): Promise<PurchaseDraftFormState> {
  try {
    await receivePurchaseAction(formData);
    return { ok: true, message: "Compra recibida correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function voidPurchaseAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "purchases.void");

  const parsed = purchaseIdSchema.safeParse({ purchaseId: formData.get("purchaseId") });
  if (!parsed.success) {
    throw new Error("Compra invalida.");
  }

  const purchase = await prisma.$transaction(async (tx) => {
    const currentPurchase = await tx.purchase.findUniqueOrThrow({
      where: { id: parsed.data.purchaseId },
      include: { items: true, inventoryMovements: true },
    });

    if (currentPurchase.status === "VOID") {
      throw new Error("La compra ya esta anulada.");
    }

    if (currentPurchase.status === "DRAFT") {
      return tx.purchase.update({
        where: { id: currentPurchase.id },
        data: { status: "VOID" },
      });
    }

    if (currentPurchase.status !== "RECEIVED") {
      throw new Error("Solo se pueden anular compras en borrador o recibidas.");
    }

    for (const item of currentPurchase.items) {
      const previousStock = await getProductStock(item.productId, tx);
      const resultingStock = previousStock - item.quantity;

      if (resultingStock < 0) {
        throw new Error("No se puede anular porque dejaria stock negativo.");
      }

      const originalMovement = currentPurchase.inventoryMovements.find(
        (movement) =>
          movement.productId === item.productId &&
          movement.type === InventoryMovementType.PURCHASE_RECEIVED,
      );

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: -item.quantity,
          type: InventoryMovementType.PURCHASE_VOID,
          userId: currentUser.id,
          sourceEntity: "Purchase",
          sourceEntityId: currentPurchase.id,
          purchaseId: currentPurchase.id,
          reason: `Anulacion compra #${currentPurchase.internalNumber}`,
          previousStock,
          resultingStock,
          reversedMovementId: originalMovement?.id,
        },
      });
    }

    return tx.purchase.update({
      where: { id: currentPurchase.id },
      data: { status: "VOID" },
    });
  });

  await recordAuditLog({
    userId: currentUser.id,
    action: "purchases.void",
    entity: "Purchase",
    entityId: purchase.id,
    nextData: purchase,
  });

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${purchase.id}`);
  revalidatePath("/products");
  revalidatePath("/inventory/movements");
}

export async function voidPurchaseFormAction(
  _state: PurchaseDraftFormState,
  formData: FormData,
): Promise<PurchaseDraftFormState> {
  try {
    await voidPurchaseAction(formData);
    return { ok: true, message: "Compra anulada correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}
