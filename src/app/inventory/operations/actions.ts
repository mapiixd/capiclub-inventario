"use server";

import { InventoryMovementType, ProductType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getActionErrorMessage, type FormActionState } from "@/lib/action-state";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  calculateInventoryDifference,
  getInventoryCountMovementType,
} from "@/lib/inventory/counts";
import { inventoryQuantityForMovement } from "@/lib/inventory/movement-quantity";
import {
  calculateProductOpeningLineCost,
  calculateProductOpeningTotal,
} from "@/lib/inventory/openings";
import {
  approveInventoryCountSchema,
  createInventoryCountSchema,
  createProductOpeningSchema,
  createSpecialInventoryMovementSchema,
  voidInventoryCountSchema,
} from "@/lib/validation/special-operations";
import { recordAuditLog } from "@/server/audit/audit-log";
import { getProductStock } from "@/server/inventory/stock";

export type SpecialOperationFormState = FormActionState & {
  entityId?: string;
};

function getInventoryCountItemsFromForm(formData: FormData) {
  const productIds = formData.getAll("countProductId").map(String);
  const countedStocks = formData.getAll("countedStock").map(String);
  const reasons = formData.getAll("countReason").map(String);

  return productIds
    .map((productId, index) => ({
      productId,
      countedStock: countedStocks[index] ?? "",
      reason: reasons[index] ?? "",
    }))
    .filter((item) => item.productId || item.countedStock || item.reason);
}

function getProductOpeningOutputsFromForm(formData: FormData) {
  const productIds = formData.getAll("outputProductId").map(String);
  const quantities = formData.getAll("outputQuantity").map(String);
  const unitCosts = formData.getAll("outputUnitCost").map(String);

  return productIds
    .map((productId, index) => ({
      productId,
      quantity: quantities[index] ?? "",
      unitCost: unitCosts[index] ?? "",
    }))
    .filter((item) => item.productId || item.quantity || item.unitCost);
}

function assertUniqueIds(ids: string[], message: string) {
  if (new Set(ids).size !== ids.length) {
    throw new Error(message);
  }
}

async function createSpecialInventoryMovement(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "inventory.specialMovement.create");

  const parsed = createSpecialInventoryMovementSchema.safeParse({
    productId: formData.get("productId"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: parsed.data.productId, status: "ACTIVE" },
      select: { id: true },
    });

    if (!product) {
      throw new Error("El producto seleccionado no esta disponible.");
    }

    const previousStock = await getProductStock(parsed.data.productId, tx);
    const signedQuantity = inventoryQuantityForMovement(
      parsed.data.type,
      parsed.data.quantity,
    );
    const resultingStock = previousStock + signedQuantity;

    if (resultingStock < 0) {
      throw new Error("El movimiento dejaria stock negativo.");
    }

    return tx.inventoryMovement.create({
      data: {
        productId: parsed.data.productId,
        quantity: signedQuantity,
        type: parsed.data.type,
        userId: currentUser.id,
        sourceEntity: "SpecialInventoryOperation",
        reason: parsed.data.reason,
        notes: parsed.data.notes,
        previousStock,
        resultingStock,
      },
    });
  });
}

export async function createSpecialInventoryMovementFormAction(
  _state: SpecialOperationFormState,
  formData: FormData,
): Promise<SpecialOperationFormState> {
  try {
    const movement = await createSpecialInventoryMovement(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: "inventory.specialMovement.create",
      entity: "InventoryMovement",
      entityId: movement.id,
      nextData: movement,
      reason: movement.reason,
    });
    revalidatePath("/inventory/operations");
    revalidatePath("/inventory/movements");
    revalidatePath("/products");
    return { ok: true, message: "Operacion registrada correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function createInventoryCount(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "inventory.count");

  const parsed = createInventoryCountSchema.safeParse({
    reason: formData.get("reason"),
    notes: formData.get("notes"),
    items: getInventoryCountItemsFromForm(formData),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const productIds = parsed.data.items.map((item) => item.productId);
  assertUniqueIds(productIds, "No repitas productos en el mismo conteo.");

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      select: { id: true },
    });

    if (products.length !== productIds.length) {
      throw new Error("Uno o mas productos no estan disponibles.");
    }

    const lastCount = await tx.inventoryCount.findFirst({
      orderBy: { internalNumber: "desc" },
      select: { internalNumber: true },
    });
    const internalNumber = (lastCount?.internalNumber ?? 0) + 1;

    const items = [];
    for (const item of parsed.data.items) {
      const theoreticalStock = await getProductStock(item.productId, tx);
      const difference = calculateInventoryDifference({
        theoreticalStock,
        countedStock: item.countedStock,
      });
      items.push({
        productId: item.productId,
        theoreticalStock,
        countedStock: item.countedStock,
        difference,
        reason: item.reason,
      });
    }

    return tx.inventoryCount.create({
      data: {
        internalNumber,
        createdById: currentUser.id,
        reason: parsed.data.reason,
        notes: parsed.data.notes,
        items: { create: items },
      },
      include: { items: true },
    });
  });
}

export async function createInventoryCountFormAction(
  _state: SpecialOperationFormState,
  formData: FormData,
): Promise<SpecialOperationFormState> {
  try {
    const count = await createInventoryCount(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: "inventoryCount.create",
      entity: "InventoryCount",
      entityId: count.id,
      nextData: count,
      reason: count.reason,
    });
    revalidatePath("/inventory/operations");
    return {
      ok: true,
      message: `Conteo #${count.internalNumber} creado como borrador.`,
      entityId: count.id,
    };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function approveInventoryCount(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "inventory.adjust.approve");

  const parsed = approveInventoryCountSchema.safeParse({
    inventoryCountId: formData.get("inventoryCountId"),
  });

  if (!parsed.success) {
    throw new Error("Conteo invalido.");
  }

  return prisma.$transaction(async (tx) => {
    const count = await tx.inventoryCount.findUnique({
      where: { id: parsed.data.inventoryCountId },
      include: { items: true },
    });

    if (!count || count.status !== "DRAFT") {
      throw new Error("Solo se puede aprobar un conteo en borrador.");
    }

    for (const item of count.items) {
      const movementType = getInventoryCountMovementType(item.difference);

      if (!movementType) {
        continue;
      }

      const previousStock = await getProductStock(item.productId, tx);
      const resultingStock = previousStock + item.difference;

      if (resultingStock < 0) {
        throw new Error("El conteo dejaria stock negativo en uno o mas productos.");
      }

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          quantity: item.difference,
          type: movementType as InventoryMovementType,
          userId: currentUser.id,
          sourceEntity: "InventoryCount",
          sourceEntityId: count.id,
          reason: item.reason,
          previousStock,
          resultingStock,
        },
      });
    }

    return tx.inventoryCount.update({
      where: { id: count.id },
      data: {
        status: "APPROVED",
        approvedById: currentUser.id,
        approvedAt: new Date(),
      },
      include: { items: true },
    });
  });
}

export async function approveInventoryCountFormAction(
  _state: SpecialOperationFormState,
  formData: FormData,
): Promise<SpecialOperationFormState> {
  try {
    const count = await approveInventoryCount(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: "inventoryCount.approve",
      entity: "InventoryCount",
      entityId: count.id,
      nextData: count,
      reason: count.reason,
    });
    revalidatePath("/inventory/operations");
    revalidatePath("/inventory/movements");
    revalidatePath("/products");
    return { ok: true, message: `Conteo #${count.internalNumber} aprobado.` };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function voidInventoryCount(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "inventory.adjust.approve");

  const parsed = voidInventoryCountSchema.safeParse({
    inventoryCountId: formData.get("inventoryCountId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const count = await prisma.inventoryCount.findUnique({
    where: { id: parsed.data.inventoryCountId },
  });

  if (!count || count.status !== "DRAFT") {
    throw new Error("Solo se puede anular un conteo en borrador.");
  }

  return prisma.inventoryCount.update({
    where: { id: count.id },
    data: {
      status: "VOID",
      voidedById: currentUser.id,
      voidedAt: new Date(),
      notes: count.notes
        ? `${count.notes}\nAnulacion: ${parsed.data.reason}`
        : `Anulacion: ${parsed.data.reason}`,
    },
    include: { items: true },
  });
}

export async function voidInventoryCountFormAction(
  _state: SpecialOperationFormState,
  formData: FormData,
): Promise<SpecialOperationFormState> {
  try {
    const count = await voidInventoryCount(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: "inventoryCount.void",
      entity: "InventoryCount",
      entityId: count.id,
      nextData: count,
      reason: count.reason,
    });
    revalidatePath("/inventory/operations");
    return { ok: true, message: `Conteo #${count.internalNumber} anulado.` };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function createProductOpening(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "openings.create");

  const parsed = createProductOpeningSchema.safeParse({
    inputProductId: formData.get("inputProductId"),
    inputQuantity: formData.get("inputQuantity"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
    outputs: getProductOpeningOutputsFromForm(formData),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const outputProductIds = parsed.data.outputs.map((output) => output.productId);
  assertUniqueIds(outputProductIds, "No repitas productos obtenidos en la apertura.");

  return prisma.$transaction(async (tx) => {
    const inputProduct = await tx.product.findFirst({
      where: {
        id: parsed.data.inputProductId,
        status: "ACTIVE",
        type: ProductType.SEALED,
      },
      select: { id: true, averageCost: true, name: true },
    });

    if (!inputProduct) {
      throw new Error("Selecciona un producto sellado activo como entrada.");
    }

    const outputProducts = await tx.product.findMany({
      where: { id: { in: outputProductIds }, status: "ACTIVE" },
      select: { id: true, averageCost: true },
    });
    const outputProductMap = new Map(
      outputProducts.map((product) => [product.id, product]),
    );

    if (outputProducts.length !== outputProductIds.length) {
      throw new Error("Uno o mas productos obtenidos no estan disponibles.");
    }

    const inputPreviousStock = await getProductStock(inputProduct.id, tx);
    const inputResultingStock = inputPreviousStock - parsed.data.inputQuantity;

    if (inputResultingStock < 0) {
      throw new Error(`Stock insuficiente para abrir ${inputProduct.name}.`);
    }

    const lastOpening = await tx.productOpening.findFirst({
      orderBy: { internalNumber: "desc" },
      select: { internalNumber: true },
    });
    const internalNumber = (lastOpening?.internalNumber ?? 0) + 1;
    const inputLineCost = calculateProductOpeningLineCost({
      quantity: parsed.data.inputQuantity,
      unitCost: inputProduct.averageCost,
    });
    const totalOutputCost = calculateProductOpeningTotal(parsed.data.outputs);

    const opening = await tx.productOpening.create({
      data: {
        internalNumber,
        userId: currentUser.id,
        reason: parsed.data.reason,
        notes: parsed.data.notes,
        totalInputCost: inputLineCost,
        totalOutputCost,
        inputs: {
          create: [
            {
              productId: inputProduct.id,
              quantity: parsed.data.inputQuantity,
              unitCost: inputProduct.averageCost,
              lineCost: inputLineCost,
            },
          ],
        },
        outputs: {
          create: parsed.data.outputs.map((output) => ({
            productId: output.productId,
            quantity: output.quantity,
            unitCost: output.unitCost,
            lineCost: calculateProductOpeningLineCost(output),
          })),
        },
      },
      include: { inputs: true, outputs: true },
    });

    await tx.inventoryMovement.create({
      data: {
        productId: inputProduct.id,
        quantity: -parsed.data.inputQuantity,
        type: InventoryMovementType.SEALED_PRODUCT_OPENING,
        userId: currentUser.id,
        sourceEntity: "ProductOpening",
        sourceEntityId: opening.id,
        reason: `Apertura #${opening.internalNumber}: ${parsed.data.reason}`,
        previousStock: inputPreviousStock,
        resultingStock: inputResultingStock,
      },
    });

    for (const output of parsed.data.outputs) {
      const outputProduct = outputProductMap.get(output.productId);

      if (!outputProduct) {
        throw new Error("Producto obtenido invalido.");
      }

      const previousStock = await getProductStock(output.productId, tx);
      const resultingStock = previousStock + output.quantity;
      const inventoryValueBefore = previousStock * outputProduct.averageCost;
      const lineCost = calculateProductOpeningLineCost(output);
      const averageCost =
        resultingStock === 0
          ? outputProduct.averageCost
          : Math.round((inventoryValueBefore + lineCost) / resultingStock);

      await tx.inventoryMovement.create({
        data: {
          productId: output.productId,
          quantity: output.quantity,
          type: InventoryMovementType.OPENING_OUTPUT,
          userId: currentUser.id,
          sourceEntity: "ProductOpening",
          sourceEntityId: opening.id,
          reason: `Resultado apertura #${opening.internalNumber}: ${parsed.data.reason}`,
          previousStock,
          resultingStock,
        },
      });

      await tx.product.update({
        where: { id: output.productId },
        data: {
          averageCost,
          lastPurchaseCost: output.unitCost,
        },
      });
    }

    return opening;
  });
}

export async function createProductOpeningFormAction(
  _state: SpecialOperationFormState,
  formData: FormData,
): Promise<SpecialOperationFormState> {
  try {
    const opening = await createProductOpening(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: "productOpening.create",
      entity: "ProductOpening",
      entityId: opening.id,
      nextData: opening,
      reason: opening.reason,
    });
    revalidatePath("/inventory/operations");
    revalidatePath("/inventory/movements");
    revalidatePath("/products");
    return {
      ok: true,
      message: `Apertura #${opening.internalNumber} registrada correctamente.`,
      entityId: opening.id,
    };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}
