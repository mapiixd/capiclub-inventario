import { z } from "zod";
import { optionalFormText } from "@/lib/validation/form";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del proveedor."),
  documentNumber: optionalFormText,
  email: optionalFormText,
  phone: optionalFormText,
});

export const purchaseItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().int().min(0),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor."),
  supplierDocumentNumber: optionalFormText,
  documentDate: optionalFormText,
  discount: z.coerce.number().int().min(0),
  additionalCosts: z.coerce.number().int().min(0),
  notes: optionalFormText,
  items: z.array(purchaseItemInputSchema).min(1, "Agrega al menos un producto."),
});

export const purchaseIdSchema = z.object({
  purchaseId: z.string().min(1),
});

export const updatePurchaseDraftSchema = z.object({
  purchaseId: z.string().min(1),
  supplierId: z.string().min(1, "Selecciona un proveedor."),
  supplierDocumentNumber: optionalFormText,
  documentDate: optionalFormText,
  discount: z.coerce.number().int().min(0),
  additionalCosts: z.coerce.number().int().min(0),
  notes: optionalFormText,
});

export const addPurchaseItemSchema = purchaseItemInputSchema.extend({
  purchaseId: z.string().min(1),
});

export const updatePurchaseItemSchema = z.object({
  purchaseItemId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().int().min(0),
});

export const deletePurchaseItemSchema = z.object({
  purchaseItemId: z.string().min(1),
});
