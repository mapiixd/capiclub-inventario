"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  createSaleReturnFormAction,
  voidSaleFormAction,
  type SaleDetailFormState,
} from "../actions";

const initialState: SaleDetailFormState = {};

type ReturnableItem = {
  id: string;
  product: { sku: string; name: string };
  quantity: number;
  returnableQuantity: number;
};

export function SaleVoidForm({ saleId }: { saleId: string }) {
  const [state, formAction] = useActionState(voidSaleFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input name="saleId" type="hidden" value={saleId} />
      <label className="grid gap-1 text-sm">
        Motivo
        <textarea
          className="min-h-20 rounded border border-[var(--border)] px-3 py-2"
          name="reason"
          required
        />
      </label>
      <ActionMessage state={state} />
      <FormSubmitButton variant="danger">Anular venta completa</FormSubmitButton>
    </form>
  );
}

export function SaleReturnForm({
  saleId,
  items,
}: {
  saleId: string;
  items: ReturnableItem[];
}) {
  const [state, formAction] = useActionState(createSaleReturnFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <input name="saleId" type="hidden" value={saleId} />
      <div className="grid gap-2">
        {items.map((item) => (
          <label
            className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
            key={item.id}
          >
            <span>
              {item.product.sku} - {item.product.name}
            </span>
            <span className="text-xs text-[var(--muted)]">
              Vendidas: {item.quantity} - Disponibles para devolver: {item.returnableQuantity}
            </span>
            <input name="saleItemId" type="hidden" value={item.id} />
            <input
              className="rounded border border-[var(--border)] px-3 py-2"
              max={item.returnableQuantity}
              min={0}
              name="returnQuantity"
              type="number"
              defaultValue="0"
            />
          </label>
        ))}
      </div>
      <label className="grid gap-1 text-sm">
        Motivo
        <textarea
          className="min-h-20 rounded border border-[var(--border)] px-3 py-2"
          name="reason"
          required
        />
      </label>
      <ActionMessage state={state} />
      <FormSubmitButton>Registrar devolucion</FormSubmitButton>
    </form>
  );
}
