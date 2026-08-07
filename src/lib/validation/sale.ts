import { z } from "zod";

const optionalFormText = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().trim().optional(),
);

export const saleItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().int().min(0),
  lineDiscount: z.coerce.number().int().min(0),
});

export const salePaymentInputSchema = z.object({
  paymentMethodId: z.string().min(1),
  amount: z.coerce.number().int().min(0),
  reference: optionalFormText,
});

export const completeSaleSchema = z.object({
  notes: optionalFormText,
  items: z.array(saleItemInputSchema).min(1, "Agrega al menos un producto."),
  payments: z
    .array(salePaymentInputSchema)
    .min(1, "Agrega al menos un medio de pago."),
});

export const saleIdSchema = z.object({
  saleId: z.string().min(1),
});

export const voidSaleSchema = z.object({
  saleId: z.string().min(1),
  reason: z.string().trim().min(3, "Ingresa un motivo para anular la venta."),
});

export const saleReturnItemInputSchema = z.object({
  saleItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(0),
});

export const createSaleReturnSchema = z.object({
  saleId: z.string().min(1),
  reason: z.string().trim().min(3, "Ingresa un motivo para registrar la devolucion."),
  items: z
    .array(saleReturnItemInputSchema)
    .transform((items) => items.filter((item) => item.quantity > 0))
    .pipe(z.array(saleReturnItemInputSchema.extend({ quantity: z.number().int().positive() })).min(1, "Ingresa al menos una cantidad a devolver.")),
});
