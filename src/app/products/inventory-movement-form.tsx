"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  createInventoryMovementFormAction,
  type InventoryMovementFormState,
} from "./actions";

const initialState: InventoryMovementFormState = {};

type ProductOption = {
  id: string;
  sku: string;
  name: string;
};

export function InventoryMovementForm({
  products,
}: {
  products: ProductOption[];
}) {
  const [state, formAction] = useActionState(
    createInventoryMovementFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <Select label="Producto" name="productId">
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.sku} - {product.name}
          </option>
        ))}
      </Select>
      <Select label="Tipo" name="type">
        <option value="PHYSICAL_COUNT_POSITIVE_ADJUSTMENT">Ajuste positivo</option>
        <option value="PHYSICAL_COUNT_NEGATIVE_ADJUSTMENT">Ajuste negativo</option>
        <option value="DAMAGED_PRODUCT">Producto danado</option>
        <option value="SHRINKAGE">Merma</option>
        <option value="INTERNAL_USE">Uso interno</option>
        <option value="TOURNAMENT_PRIZE">Premio de torneo</option>
        <option value="COMPENSATION">Movimiento compensatorio</option>
      </Select>
      <Field label="Cantidad" name="quantity" type="number" defaultValue="1" />
      <Field label="Motivo" name="reason" />
      <Field label="Observaciones" name="notes" required={false} />

      <ActionMessage state={state} />

      <FormSubmitButton>Registrar movimiento</FormSubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = true,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input
        className="rounded border border-[var(--border)] px-3 py-2"
        defaultValue={defaultValue}
        min={type === "number" ? 0 : undefined}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function Select({
  label,
  name,
  children,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select className="rounded border border-[var(--border)] px-3 py-2" name={name} required>
        {children}
      </select>
    </label>
  );
}
