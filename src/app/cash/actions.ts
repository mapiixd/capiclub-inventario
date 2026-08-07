"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, type FormActionState } from "@/lib/action-state";
import {
  calculateCashDifference,
  calculateExpectedCash,
} from "@/lib/cash/expected-cash";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  closeCashSessionSchema,
  createCashMovementSchema,
  openCashSessionSchema,
} from "@/lib/validation/cash";
import { recordAuditLog } from "@/server/audit/audit-log";

export type CashFormState = FormActionState;

async function openCashSession(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "cash.open");

  const parsed = openCashSessionSchema.safeParse({
    cashRegisterId: formData.get("cashRegisterId"),
    openingFloat: formData.get("openingFloat"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  return prisma.$transaction(async (tx) => {
    const cashRegister = await tx.cashRegister.findFirst({
      where: { id: parsed.data.cashRegisterId, active: true },
      select: { id: true },
    });

    if (!cashRegister) {
      throw new Error("La caja seleccionada no esta disponible.");
    }

    const existingSession = await tx.cashSession.findFirst({
      where: { cashRegisterId: parsed.data.cashRegisterId, status: "OPEN" },
      select: { id: true },
    });

    if (existingSession) {
      throw new Error("La caja ya tiene una sesion abierta.");
    }

    return tx.cashSession.create({
      data: {
        cashRegisterId: parsed.data.cashRegisterId,
        openedById: currentUser.id,
        openingFloat: parsed.data.openingFloat,
        notes: parsed.data.notes,
      },
    });
  });
}

export async function openCashSessionFormAction(
  _state: CashFormState,
  formData: FormData,
): Promise<CashFormState> {
  try {
    const session = await openCashSession(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: "cash.open",
      entity: "CashSession",
      entityId: session.id,
      nextData: session,
    });
    revalidatePath("/cash");
    revalidatePath("/sales");
    return { ok: true, message: "Caja abierta correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function createCashMovement(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  const parsed = createCashMovementSchema.safeParse({
    cashSessionId: formData.get("cashSessionId"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  if (parsed.data.type === "EXPENSE") {
    await requirePermission(currentUser.id, "expenses.create");
  } else {
    await requirePermission(currentUser.id, "cash.adjust");
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.findUnique({
      where: { id: parsed.data.cashSessionId },
      select: { id: true, status: true },
    });

    if (!session || session.status !== "OPEN") {
      throw new Error("La caja no esta abierta.");
    }

    return tx.cashMovement.create({
      data: {
        cashSessionId: parsed.data.cashSessionId,
        type: parsed.data.type,
        amount: parsed.data.amount,
        reason: parsed.data.reason,
        userId: currentUser.id,
      },
    });
  });
}

export async function createCashMovementFormAction(
  _state: CashFormState,
  formData: FormData,
): Promise<CashFormState> {
  try {
    const movement = await createCashMovement(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: movement.type === "EXPENSE" ? "cash.expense" : "cash.movement",
      entity: "CashMovement",
      entityId: movement.id,
      nextData: movement,
      reason: movement.reason,
    });
    revalidatePath("/cash");
    return { ok: true, message: "Movimiento registrado correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

async function closeCashSession(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "cash.close");

  const parsed = closeCashSessionSchema.safeParse({
    cashSessionId: formData.get("cashSessionId"),
    countedCash: formData.get("countedCash"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.findUnique({
      where: { id: parsed.data.cashSessionId },
      include: {
        cashMovements: true,
        payments: {
          include: { paymentMethod: true },
        },
      },
    });

    if (!session || session.status !== "OPEN") {
      throw new Error("La caja no esta abierta.");
    }

    const cashPayments = session.payments
      .filter((payment) => payment.paymentMethod.name === "Efectivo")
      .map((payment) => payment.amount);
    const expectedCash = calculateExpectedCash({
      openingFloat: session.openingFloat,
      cashPayments,
      movements: session.cashMovements,
    });
    const difference = calculateCashDifference({
      expectedCash,
      countedCash: parsed.data.countedCash,
    });

    return tx.cashSession.update({
      where: { id: session.id },
      data: {
        status: "CLOSED",
        closedById: currentUser.id,
        closedAt: new Date(),
        expectedCash,
        countedCash: parsed.data.countedCash,
        difference,
        notes: parsed.data.notes ?? session.notes,
      },
    });
  });
}

export async function closeCashSessionFormAction(
  _state: CashFormState,
  formData: FormData,
): Promise<CashFormState> {
  try {
    const session = await closeCashSession(formData);
    const currentUser = await requireUserWithPermissions();
    await recordAuditLog({
      userId: currentUser.id,
      action: "cash.close",
      entity: "CashSession",
      entityId: session.id,
      nextData: session,
    });
    revalidatePath("/cash");
    revalidatePath("/sales");
    return { ok: true, message: "Caja cerrada correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}
