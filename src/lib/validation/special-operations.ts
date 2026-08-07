import { z } from "zod";
import { optionalFormText } from "@/lib/validation/form";

export const createSpecialInventoryMovementSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto."),
  type: z.enum([
    "DAMAGED_PRODUCT",
    "SHRINKAGE",
    "INTERNAL_USE",
    "TOURNAMENT_PRIZE",
    "COMPENSATION",
  ]),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a cero."),
  reason: z.string().trim().min(3, "Ingresa un motivo."),
  notes: optionalFormText,
});

export const createInventoryCountSchema = z.object({
  reason: z.string().trim().min(3, "Ingresa un motivo."),
  notes: optionalFormText,
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Selecciona un producto."),
        countedStock: z.coerce.number().int().min(0),
        reason: z.string().trim().min(3, "Ingresa un motivo por linea."),
      }),
    )
    .min(1, "Agrega al menos un producto al conteo."),
});

export const approveInventoryCountSchema = z.object({
  inventoryCountId: z.string().min(1),
});

export const voidInventoryCountSchema = z.object({
  inventoryCountId: z.string().min(1),
  reason: z.string().trim().min(3, "Ingresa un motivo."),
});

export const createProductOpeningSchema = z.object({
  inputProductId: z.string().min(1, "Selecciona el producto sellado."),
  inputQuantity: z.coerce.number().int().positive(),
  reason: z.string().trim().min(3, "Ingresa un motivo."),
  notes: optionalFormText,
  outputs: z
    .array(
      z.object({
        productId: z.string().min(1, "Selecciona un producto obtenido."),
        quantity: z.coerce.number().int().positive(),
        unitCost: z.coerce.number().int().min(0),
      }),
    )
    .min(1, "Agrega al menos un producto obtenido."),
});
