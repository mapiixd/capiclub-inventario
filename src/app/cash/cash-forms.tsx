"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import { formatCurrency } from "@/lib/format";
import {
  closeCashSessionFormAction,
  createCashMovementFormAction,
  openCashSessionFormAction,
  type CashFormState,
} from "./actions";

const initialState: CashFormState = {};

type CashRegisterOption = {
  id: string;
  name: string;
};

export function OpenCashSessionForm({
  cashRegisters,
}: {
  cashRegisters: CashRegisterOption[];
}) {
  const [state, formAction] = useActionState(openCashSessionFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 p-5">
      <label className="grid gap-1 text-sm">
        Caja
        <select
          className="rounded border border-[var(--border)] px-3 py-2"
          name="cashRegisterId"
          required
        >
          {cashRegisters.map((cashRegister) => (
            <option key={cashRegister.id} value={cashRegister.id}>
              {cashRegister.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Fondo inicial
        <input
          className="rounded border border-[var(--border)] px-3 py-2"
          min={0}
          name="openingFloat"
          required
          type="number"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Observaciones
        <textarea
          className="min-h-24 rounded border border-[var(--border)] px-3 py-2"
          name="notes"
        />
      </label>
      <ActionMessage state={state} />
      <FormSubmitButton disabled={cashRegisters.length === 0}>Abrir caja</FormSubmitButton>
    </form>
  );
}

export function CashMovementForm({
  cashSessionId,
  canAdjust,
  canCreateExpense,
}: {
  cashSessionId: string;
  canAdjust: boolean;
  canCreateExpense: boolean;
}) {
  const [state, formAction] = useActionState(createCashMovementFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 p-5">
      <input name="cashSessionId" type="hidden" value={cashSessionId} />
      <label className="grid gap-1 text-sm">
        Tipo
        <select className="rounded border border-[var(--border)] px-3 py-2" name="type" required>
          {canAdjust ? <option value="INCOME">Ingreso extra</option> : null}
          {canAdjust ? <option value="WITHDRAWAL">Retiro</option> : null}
          {canCreateExpense ? <option value="EXPENSE">Gasto</option> : null}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Monto
        <input
          className="rounded border border-[var(--border)] px-3 py-2"
          min={1}
          name="amount"
          required
          type="number"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Motivo
        <input
          className="rounded border border-[var(--border)] px-3 py-2"
          name="reason"
          required
        />
      </label>
      <ActionMessage state={state} />
      <FormSubmitButton disabled={!canAdjust && !canCreateExpense}>
        Registrar movimiento
      </FormSubmitButton>
    </form>
  );
}

export function CloseCashSessionForm({
  cashSessionId,
  expectedCash,
}: {
  cashSessionId: string;
  expectedCash: number;
}) {
  const [state, formAction] = useActionState(closeCashSessionFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-3 p-5">
      <input name="cashSessionId" type="hidden" value={cashSessionId} />
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
        <span className="text-[var(--muted)]">Efectivo esperado</span>
        <p className="mt-1 text-xl font-semibold">{formatCurrency(expectedCash)}</p>
      </div>
      <label className="grid gap-1 text-sm">
        Efectivo contado
        <input
          className="rounded border border-[var(--border)] px-3 py-2"
          min={0}
          name="countedCash"
          required
          type="number"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Observaciones de cierre
        <textarea
          className="min-h-24 rounded border border-[var(--border)] px-3 py-2"
          name="notes"
        />
      </label>
      <ActionMessage state={state} />
      <FormSubmitButton variant="secondary">Cerrar caja</FormSubmitButton>
    </form>
  );
}
