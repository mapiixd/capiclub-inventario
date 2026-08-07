"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { uniqueConstraintMessage } from "@/lib/db-errors";
import { getActionErrorMessage, type FormActionState } from "@/lib/action-state";
import { inventoryQuantityForMovement } from "@/lib/inventory/movement-quantity";
import {
  createCategorySchema,
  createGameSchema,
  createInventoryMovementSchema,
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
} from "@/lib/validation/product";
import { getProductStock } from "@/server/inventory/stock";
import { recordAuditLog } from "@/server/audit/audit-log";

export type ProductFormState = FormActionState;
export type InventoryMovementFormState = FormActionState;
export type CatalogFormState = FormActionState;
export type ProductUpdateFormState = FormActionState;

export async function createGameAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "products.create");

  const parsed = createGameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const game = await prisma.game
    .create({ data: { name: parsed.data.name } })
    .catch((error: unknown) => {
      const message = uniqueConstraintMessage(error, {
        name: "Ya existe un juego con ese nombre.",
      });
      throw new Error(message ?? "No se pudo crear el juego.");
    });
  await recordAuditLog({
    userId: currentUser.id,
    action: "games.create",
    entity: "Game",
    entityId: game.id,
    nextData: game,
  });
  revalidatePath("/products");
}

export async function createGameFormAction(
  _state: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    await createGameAction(formData);
    return { ok: true, message: "Juego creado correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function createCategoryAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "products.create");

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    parentId: formData.get("parentId"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const category = await prisma.productCategory
    .create({
      data: { name: parsed.data.name, parentId: parsed.data.parentId },
    })
    .catch((error: unknown) => {
      const message = uniqueConstraintMessage(error, {
        name: "Ya existe una categoria con ese nombre en el mismo nivel.",
      });
      throw new Error(message ?? "No se pudo crear la categoria.");
    });
  await recordAuditLog({
    userId: currentUser.id,
    action: "categories.create",
    entity: "ProductCategory",
    entityId: category.id,
    nextData: category,
  });
  revalidatePath("/products");
}

export async function createCategoryFormAction(
  _state: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  try {
    await createCategoryAction(formData);
    return { ok: true, message: "Categoria creada correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function createProduct(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "products.create");

  const parsed = createProductSchema.safeParse({
    sku: formData.get("sku"),
    barcode: formData.get("barcode"),
    name: formData.get("name"),
    gameId: formData.get("gameId"),
    categoryId: formData.get("categoryId"),
    edition: formData.get("edition"),
    manufacturer: formData.get("manufacturer"),
    language: formData.get("language"),
    condition: formData.get("condition"),
    rarity: formData.get("rarity"),
    variant: formData.get("variant"),
    type: formData.get("type"),
    averageCost: formData.get("averageCost"),
    lastPurchaseCost: formData.get("lastPurchaseCost"),
    salePrice: formData.get("salePrice"),
    minimumStock: formData.get("minimumStock"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const product = await prisma.product
    .create({
      data: {
        ...parsed.data,
        createdById: currentUser.id,
      },
    })
    .catch((error: unknown) => {
      const message = uniqueConstraintMessage(error, {
        sku: "Ya existe un producto con ese SKU.",
        barcode: "Ya existe un producto con ese codigo de barras.",
      });
      throw new Error(message ?? "No se pudo crear el producto.");
    });

  await recordAuditLog({
    userId: currentUser.id,
    action: "products.create",
    entity: "Product",
    entityId: product.id,
    nextData: product,
  });

  revalidatePath("/products");
}

export async function createProductAction(formData: FormData) {
  await createProduct(formData);
}

export async function createProductFormAction(
  _state: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    await createProduct(formData);
    return { ok: true, message: "Producto creado correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function updateProductAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "products.update");

  const parsed = updateProductSchema.safeParse({
    productId: formData.get("productId"),
    barcode: formData.get("barcode"),
    name: formData.get("name"),
    gameId: formData.get("gameId"),
    categoryId: formData.get("categoryId"),
    edition: formData.get("edition"),
    manufacturer: formData.get("manufacturer"),
    language: formData.get("language"),
    condition: formData.get("condition"),
    rarity: formData.get("rarity"),
    variant: formData.get("variant"),
    type: formData.get("type"),
    averageCost: formData.get("averageCost"),
    lastPurchaseCost: formData.get("lastPurchaseCost"),
    salePrice: formData.get("salePrice"),
    minimumStock: formData.get("minimumStock"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const previous = await prisma.product.findUniqueOrThrow({
    where: { id: parsed.data.productId },
  });

  const changesCost =
    previous.averageCost !== parsed.data.averageCost ||
    previous.lastPurchaseCost !== parsed.data.lastPurchaseCost;

  if (changesCost && !currentUser.permissions.includes("products.updateCost")) {
    throw new Error("No tienes permiso para modificar costos.");
  }

  const updated = await prisma.product
    .update({
      where: { id: parsed.data.productId },
      data: {
        barcode: parsed.data.barcode,
        name: parsed.data.name,
        gameId: parsed.data.gameId,
        categoryId: parsed.data.categoryId,
        edition: parsed.data.edition,
        manufacturer: parsed.data.manufacturer,
        language: parsed.data.language,
        condition: parsed.data.condition,
        rarity: parsed.data.rarity,
        variant: parsed.data.variant,
        type: parsed.data.type,
        averageCost: parsed.data.averageCost,
        lastPurchaseCost: parsed.data.lastPurchaseCost,
        salePrice: parsed.data.salePrice,
        minimumStock: parsed.data.minimumStock,
        notes: parsed.data.notes,
      },
    })
    .catch((error: unknown) => {
      const message = uniqueConstraintMessage(error, {
        barcode: "Ya existe un producto con ese codigo de barras.",
      });
      throw new Error(message ?? "No se pudo actualizar el producto.");
    });

  await recordAuditLog({
    userId: currentUser.id,
    action: "products.update",
    entity: "Product",
    entityId: updated.id,
    previousData: previous,
    nextData: updated,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${updated.id}`);
}

export async function updateProductFormAction(
  _state: ProductUpdateFormState,
  formData: FormData,
): Promise<ProductUpdateFormState> {
  try {
    await updateProductAction(formData);
    return { ok: true, message: "Producto actualizado correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function updateProductStatusAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "products.deactivate");

  const parsed = updateProductStatusSchema.safeParse({
    productId: formData.get("productId"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    throw new Error("Producto invalido.");
  }

  const previous = await prisma.product.findUniqueOrThrow({
    where: { id: parsed.data.productId },
  });
  const updated = await prisma.product.update({
    where: { id: parsed.data.productId },
    data: { status: parsed.data.status },
  });

  await recordAuditLog({
    userId: currentUser.id,
    action: "products.updateStatus",
    entity: "Product",
    entityId: updated.id,
    previousData: previous,
    nextData: updated,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${updated.id}`);
}

export async function updateProductStatusFormAction(
  _state: ProductUpdateFormState,
  formData: FormData,
): Promise<ProductUpdateFormState> {
  try {
    await updateProductStatusAction(formData);
    return { ok: true, message: "Estado actualizado correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function createInventoryMovement(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "inventory.specialMovement.create");

  const parsed = createInventoryMovementSchema.safeParse({
    productId: formData.get("productId"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const movement = await prisma.$transaction(async (tx) => {
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
        sourceEntity: "ManualInventoryMovement",
        reason: parsed.data.reason,
        notes: parsed.data.notes,
        previousStock,
        resultingStock,
      },
    });
  });

  await recordAuditLog({
    userId: currentUser.id,
    action: "inventoryMovement.create",
    entity: "InventoryMovement",
    entityId: movement.id,
    nextData: movement,
    reason: parsed.data.reason,
  });

  revalidatePath("/products");
  revalidatePath("/inventory/movements");
}

export async function createInventoryMovementAction(formData: FormData) {
  await createInventoryMovement(formData);
}

export async function createInventoryMovementFormAction(
  _state: InventoryMovementFormState,
  formData: FormData,
): Promise<InventoryMovementFormState> {
  try {
    await createInventoryMovement(formData);
    return { ok: true, message: "Movimiento registrado correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}
