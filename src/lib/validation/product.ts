import { ProductType } from "@prisma/client";
import { z } from "zod";
import { optionalFormText } from "@/lib/validation/form";

export const createGameSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del juego."),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre de la categoria."),
  parentId: optionalFormText,
});

export const createProductSchema = z.object({
  sku: z.string().trim().min(2, "Ingresa un SKU."),
  barcode: optionalFormText,
  name: z.string().trim().min(2, "Ingresa el nombre."),
  gameId: optionalFormText,
  categoryId: optionalFormText,
  edition: optionalFormText,
  manufacturer: optionalFormText,
  language: optionalFormText,
  condition: optionalFormText,
  rarity: optionalFormText,
  variant: optionalFormText,
  type: z.nativeEnum(ProductType),
  averageCost: z.coerce.number().int().min(0),
  lastPurchaseCost: z.coerce.number().int().min(0),
  salePrice: z.coerce.number().int().min(0),
  minimumStock: z.coerce.number().int().min(0),
  notes: optionalFormText,
});

export const updateProductSchema = createProductSchema
  .omit({ sku: true })
  .extend({
    productId: z.string().min(1),
  })
  .strict();

export const updateProductStatusSchema = z.object({
  productId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const createInventoryMovementSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto."),
  type: z.enum([
    "DAMAGED_PRODUCT",
    "SHRINKAGE",
    "INTERNAL_USE",
    "TOURNAMENT_PRIZE",
    "PHYSICAL_COUNT_POSITIVE_ADJUSTMENT",
    "PHYSICAL_COUNT_NEGATIVE_ADJUSTMENT",
    "COMPENSATION",
  ]),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a cero."),
  reason: z.string().trim().min(3, "Ingresa un motivo."),
  notes: optionalFormText,
});
