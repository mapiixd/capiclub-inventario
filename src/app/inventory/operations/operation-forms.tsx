"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import { formatCurrency } from "@/lib/format";
import {
  specialInventoryMovementLabels,
  specialInventoryMovementTypes,
} from "@/lib/inventory/movement-labels";
import {
  approveInventoryCountFormAction,
  createInventoryCountFormAction,
  createProductOpeningFormAction,
  createSpecialInventoryMovementFormAction,
  voidInventoryCountFormAction,
  type SpecialOperationFormState,
} from "./actions";

const initialState: SpecialOperationFormState = {};

type ProductOption = {
  id: string;
  sku: string;
  name: string;
  type: string;
  averageCost: number;
  stock: number;
};

type CountLine = {
  productId: string;
  countedStock: number;
  reason: string;
};

type OpeningOutputLine = {
  productId: string;
  quantity: number;
  unitCost: number;
};

export function SpecialMovementForm({ products }: { products: ProductOption[] }) {
  const [state, formAction] = useActionState(
    createSpecialInventoryMovementFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3 p-5">
      <ProductSelect products={products} name="productId" />
      <label className="grid min-w-0 gap-1 text-sm">
        Tipo
        <select className="w-full min-w-0 rounded border border-[var(--border)] px-3 py-2" name="type" required>
          {specialInventoryMovementTypes.map((type) => (
            <option key={type} value={type}>
              {specialInventoryMovementLabels[type]}
            </option>
          ))}
        </select>
      </label>
      <Field defaultValue="1" label="Cantidad" min={1} name="quantity" type="number" />
      <Field label="Motivo" name="reason" />
      <Field label="Observaciones" name="notes" required={false} />
      <ActionMessage state={state} />
      <FormSubmitButton disabled={products.length === 0}>Registrar operacion</FormSubmitButton>
    </form>
  );
}

export function InventoryCountCreateForm({
  products,
}: {
  products: ProductOption[];
}) {
  const [state, formAction] = useActionState(
    createInventoryCountFormAction,
    initialState,
  );
  const [items, setItems] = useState<CountLine[]>([]);
  const selectedIds = new Set(items.map((item) => item.productId));
  const availableProducts = products.filter((product) => !selectedIds.has(product.id));

  useEffect(() => {
    if (state.ok) {
      const timeoutId = window.setTimeout(() => setItems([]), 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [state.ok]);

  function addProduct(productId: string) {
    if (!productId) {
      return;
    }

    const product = products.find((item) => item.id === productId);
    setItems((currentItems) => [
      ...currentItems,
      {
        productId,
        countedStock: product?.stock ?? 0,
        reason: "Conteo fisico",
      },
    ]);
  }

  function updateLine(productId: string, patch: Partial<CountLine>) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId ? { ...item, ...patch } : item,
      ),
    );
  }

  return (
    <form action={formAction} className="grid gap-4 p-5">
      {items.map((item) => (
        <div key={item.productId}>
          <input name="countProductId" type="hidden" value={item.productId} />
          <input name="countedStock" type="hidden" value={item.countedStock} />
          <input name="countReason" type="hidden" value={item.reason} />
        </div>
      ))}

      <Field label="Motivo general" name="reason" />
      <Field label="Observaciones" name="notes" required={false} />

      <div className="grid gap-2">
        <label className="grid min-w-0 gap-1 text-sm">
          Agregar producto
          <select
            className="w-full min-w-0 rounded border border-[var(--border)] px-3 py-2"
            disabled={availableProducts.length === 0}
            onChange={(event) => {
              addProduct(event.target.value);
              event.target.value = "";
            }}
            value=""
          >
            <option value="">Selecciona un producto</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku} - {product.name} (stock {product.stock})
              </option>
            ))}
          </select>
        </label>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
          Agrega productos al conteo. Se guardara como borrador y no afectara stock
          hasta que sea aprobado.
        </p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            const theoreticalStock = product?.stock ?? 0;
            const difference = item.countedStock - theoreticalStock;

            return (
              <article
                className="grid min-w-0 gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                key={item.productId}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{product?.name}</p>
                  <p className="text-sm text-[var(--muted)]">{product?.sku}</p>
                  <p className="mt-2 text-sm">Stock teorico: {theoreticalStock}</p>
                </div>
                <Field
                  label="Contado"
                  min={0}
                  name={`visible-count-${item.productId}`}
                  onChange={(value) =>
                    updateLine(item.productId, { countedStock: Math.max(0, value) })
                  }
                  type="number"
                  value={item.countedStock}
                />
                <div className="grid content-end gap-1 text-sm">
                  <span className="text-[var(--muted)]">Diferencia</span>
                  <span className="font-semibold">{difference}</span>
                </div>
                <Field
                  label="Motivo linea"
                  name={`visible-reason-${item.productId}`}
                  onTextChange={(value) => updateLine(item.productId, { reason: value })}
                  value={item.reason}
                />
                <button
                  aria-label="Quitar producto"
                  className="grid h-10 w-10 place-items-center self-end rounded border border-[var(--border)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]"
                  onClick={() =>
                    setItems((currentItems) =>
                      currentItems.filter((line) => line.productId !== item.productId),
                    )
                  }
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            );
          })}
        </div>
      )}

      <ActionMessage state={state} />
      <FormSubmitButton disabled={items.length === 0}>Crear conteo</FormSubmitButton>
    </form>
  );
}

export function ProductOpeningForm({ products }: { products: ProductOption[] }) {
  const [state, formAction] = useActionState(
    createProductOpeningFormAction,
    initialState,
  );
  const sealedProducts = products.filter((product) => product.type === "SEALED");
  const outputProducts = products.filter((product) => product.type !== "SERVICE");
  const [outputs, setOutputs] = useState<OpeningOutputLine[]>([]);
  const totalOutputCost = useMemo(
    () =>
      outputs.reduce(
        (total, output) => total + output.quantity * output.unitCost,
        0,
      ),
    [outputs],
  );
  const selectedOutputIds = new Set(outputs.map((output) => output.productId));
  const availableOutputProducts = outputProducts.filter(
    (product) => !selectedOutputIds.has(product.id),
  );

  useEffect(() => {
    if (state.ok) {
      const timeoutId = window.setTimeout(() => setOutputs([]), 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [state.ok]);

  function addOutput(productId: string) {
    if (!productId) {
      return;
    }

    const product = products.find((item) => item.id === productId);
    setOutputs((currentOutputs) => [
      ...currentOutputs,
      { productId, quantity: 1, unitCost: product?.averageCost ?? 0 },
    ]);
  }

  function updateOutput(productId: string, patch: Partial<OpeningOutputLine>) {
    setOutputs((currentOutputs) =>
      currentOutputs.map((output) =>
        output.productId === productId ? { ...output, ...patch } : output,
      ),
    );
  }

  return (
    <form action={formAction} className="grid gap-4 p-5">
      {outputs.map((output) => (
        <div key={output.productId}>
          <input name="outputProductId" type="hidden" value={output.productId} />
          <input name="outputQuantity" type="hidden" value={output.quantity} />
          <input name="outputUnitCost" type="hidden" value={output.unitCost} />
        </div>
      ))}

      <label className="grid min-w-0 gap-1 text-sm">
        Producto sellado
        <select
          className="w-full min-w-0 rounded border border-[var(--border)] px-3 py-2"
          name="inputProductId"
          required
        >
          {sealedProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.sku} - {product.name} (stock {product.stock})
            </option>
          ))}
        </select>
      </label>
      <Field defaultValue="1" label="Cantidad a abrir" min={1} name="inputQuantity" type="number" />
      <Field label="Motivo" name="reason" />
      <Field label="Observaciones" name="notes" required={false} />

      <label className="grid min-w-0 gap-1 text-sm">
        Agregar producto obtenido
        <select
          className="w-full min-w-0 rounded border border-[var(--border)] px-3 py-2"
          disabled={availableOutputProducts.length === 0}
          onChange={(event) => {
            addOutput(event.target.value);
            event.target.value = "";
          }}
          value=""
        >
          <option value="">Selecciona un producto</option>
          {availableOutputProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.sku} - {product.name}
            </option>
          ))}
        </select>
      </label>

      {outputs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
          Agrega los productos obtenidos y su costo unitario manual.
        </p>
      ) : (
        <div className="grid gap-3">
          {outputs.map((output) => {
            const product = products.find((entry) => entry.id === output.productId);
            const lineCost = output.quantity * output.unitCost;

            return (
              <article
                className="grid min-w-0 gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                key={output.productId}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{product?.name}</p>
                  <p className="text-sm text-[var(--muted)]">{product?.sku}</p>
                </div>
                <QuantityStepper
                  label="Cantidad"
                  onChange={(quantity) =>
                    updateOutput(output.productId, {
                      quantity: Math.max(1, quantity),
                    })
                  }
                  value={output.quantity}
                />
                <Field
                  label="Costo unitario"
                  min={0}
                  name={`visible-cost-${output.productId}`}
                  onChange={(unitCost) =>
                    updateOutput(output.productId, {
                      unitCost: Math.max(0, unitCost),
                    })
                  }
                  type="number"
                  value={output.unitCost}
                />
                <div className="grid min-w-0 content-end gap-1 text-sm">
                  <span className="text-[var(--muted)]">Costo asignado</span>
                  <span className="break-words font-semibold">{formatCurrency(lineCost)}</span>
                </div>
                <button
                  aria-label="Quitar producto obtenido"
                  className="grid h-10 w-10 place-items-center self-end rounded border border-[var(--border)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]"
                  onClick={() =>
                    setOutputs((currentOutputs) =>
                      currentOutputs.filter((line) => line.productId !== output.productId),
                    )
                  }
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
        <span className="text-[var(--muted)]">Total costo asignado</span>
        <span className="break-words font-semibold">{formatCurrency(totalOutputCost)}</span>
      </div>
      <ActionMessage state={state} />
      <FormSubmitButton disabled={sealedProducts.length === 0 || outputs.length === 0}>
        Registrar apertura
      </FormSubmitButton>
    </form>
  );
}

export function ApproveInventoryCountForm({
  inventoryCountId,
}: {
  inventoryCountId: string;
}) {
  const [state, formAction] = useActionState(
    approveInventoryCountFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="inventoryCountId" type="hidden" value={inventoryCountId} />
      <ActionMessage state={state} />
      <FormSubmitButton>Aprobar</FormSubmitButton>
    </form>
  );
}

export function VoidInventoryCountForm({
  inventoryCountId,
}: {
  inventoryCountId: string;
}) {
  const [state, formAction] = useActionState(
    voidInventoryCountFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="inventoryCountId" type="hidden" value={inventoryCountId} />
      <input
        className="w-full min-w-0 rounded border border-[var(--border)] px-3 py-2 text-sm"
        name="reason"
        placeholder="Motivo de anulacion"
        required
      />
      <ActionMessage state={state} />
      <FormSubmitButton variant="secondary">Anular</FormSubmitButton>
    </form>
  );
}

function ProductSelect({
  products,
  name,
}: {
  products: ProductOption[];
  name: string;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      Producto
      <select className="w-full min-w-0 rounded border border-[var(--border)] px-3 py-2" name={name} required>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.sku} - {product.name} (stock {product.stock})
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = true,
  defaultValue,
  min,
  value,
  onChange,
  onTextChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  min?: number;
  value?: string | number;
  onChange?: (value: number) => void;
  onTextChange?: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      {label}
      <input
        className="w-full min-w-0 rounded border border-[var(--border)] px-3 py-2"
        defaultValue={defaultValue}
        min={min ?? (type === "number" ? 0 : undefined)}
        name={name}
        onChange={(event) => {
          if (type === "number") {
            onChange?.(Number(event.target.value));
          } else {
            onTextChange?.(event.target.value);
          }
        }}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function QuantityStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid min-w-0 gap-1 text-sm">
      {label}
      <div className="flex h-10 overflow-hidden rounded border border-[var(--border)]">
        <button
          aria-label="Restar unidad"
          className="grid w-10 place-items-center border-r border-[var(--border)] hover:bg-[var(--surface-muted)]"
          onClick={() => onChange(value - 1)}
          type="button"
        >
          <Minus size={15} />
        </button>
        <input
          className="min-w-0 flex-1 border-0 px-2 text-center"
          min={1}
          onChange={(event) => onChange(Number(event.target.value))}
          type="number"
          value={value}
        />
        <button
          aria-label="Sumar unidad"
          className="grid w-10 place-items-center border-l border-[var(--border)] hover:bg-[var(--surface-muted)]"
          onClick={() => onChange(value + 1)}
          type="button"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
