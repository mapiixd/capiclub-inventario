import { z } from "zod";

export const openCashSessionSchema = z.object({
  cashRegisterId: z.string().min(1),
  openingFloat: z.coerce.number().int().min(0),
  notes: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.string().trim().optional(),
  ),
});

export const createCashMovementSchema = z.object({
  cashSessionId: z.string().min(1),
  type: z.enum(["INCOME", "WITHDRAWAL", "EXPENSE"]),
  amount: z.coerce.number().int().positive(),
  reason: z.string().trim().min(3, "Ingresa un motivo."),
});

export const closeCashSessionSchema = z.object({
  cashSessionId: z.string().min(1),
  countedCash: z.coerce.number().int().min(0),
  notes: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.string().trim().optional(),
  ),
});
