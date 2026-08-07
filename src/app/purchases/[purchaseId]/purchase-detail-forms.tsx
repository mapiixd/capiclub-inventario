"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  addPurchaseItemFormAction,
  deletePurchaseItemFormAction,
  receivePurchaseFormAction,
  updatePurchaseDraftFormAction,
  updatePurchaseItemFormAction,
  voidPurchaseFormAction,
  type PurchaseDraftFormState,
} from "../actions";

const initialState: PurchaseDraftFormState = {};

type SupplierOption = { id: string; name: string };
type ProductOption = { id: string; sku: string; name: string };

export function PurchaseDraftEditForm({
  purchase,
  suppliers,
}: {
  purchase: {
    id: string;
    supplierId: string;
    supplierDocumentNumber: string | null;
    documentDate: Date | null;
    discount: number;
    additionalCosts: number;
    notes: string | null;
  };
  suppliers: SupplierOption[];
}) {
  const [state, formAction] = useActionState(updatePurchaseDraftFormAction, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <input name="purchaseId" type="hidden" value={purchase.id} />
      <label className="grid gap-1 text-sm">
        Proveedor
        <select className="rounded border border-[var(--border)] px-3 py-2" name="supplierId" defaultValue={purchase.supplierId} required>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
          ))}
        </select>
      </label>
      <Field label="Documento proveedor" name="supplierDocumentNumber" defaultValue={purchase.supplierDocumentNumber ?? ""} required={false} />
      <Field label="Fecha documento" name="documentDate" type="date" defaultValue={purchase.documentDate?.toISOString().slice(0, 10) ?? ""} required={false} />
      <Field label="Descuento" name="discount" type="number" defaultValue={String(purchase.discount)} />
      <Field label="Costos adicionales" name="additionalCosts" type="number" defaultValue={String(purchase.additionalCosts)} />
      <label className="grid gap-1 text-sm">
        Observaciones
        <textarea className="min-h-20 rounded border border-[var(--border)] px-3 py-2" name="notes" defaultValue={purchase.notes ?? ""} />
      </label>
      <ActionMessage state={state} />
      <FormSubmitButton>Guardar borrador</FormSubmitButton>
    </form>
  );
}

export function PurchaseItemEditForm({ item }: { item: { id: string; quantity: number; unitCost: number } }) {
  const [state, formAction] = useActionState(updatePurchaseItemFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <div className="flex gap-2">
        <input name="purchaseItemId" type="hidden" value={item.id} />
        <input className="w-24 rounded border border-[var(--border)] px-2 py-1" min={1} name="quantity" type="number" defaultValue={item.quantity} />
        <input className="w-28 rounded border border-[var(--border)] px-2 py-1" min={0} name="unitCost" type="number" defaultValue={item.unitCost} />
        <button className="rounded border border-[var(--border)] px-2 py-1" type="submit">Guardar</button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

export function PurchaseItemDeleteForm({ purchaseItemId }: { purchaseItemId: string }) {
  const [state, formAction] = useActionState(deletePurchaseItemFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <input name="purchaseItemId" type="hidden" value={purchaseItemId} />
      <button className="rounded border border-[var(--border)] px-3 py-1" type="submit">Eliminar</button>
      <ActionMessage state={state} />
    </form>
  );
}

export function PurchaseItemAddForm({ purchaseId, products }: { purchaseId: string; products: ProductOption[] }) {
  const [state, formAction] = useActionState(addPurchaseItemFormAction, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <input name="purchaseId" type="hidden" value={purchaseId} />
      <label className="grid gap-1 text-sm">
        Producto
        <select className="rounded border border-[var(--border)] px-3 py-2" name="productId" required>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>
          ))}
        </select>
      </label>
      <Field label="Cantidad" name="quantity" type="number" defaultValue="1" />
      <Field label="Costo unitario" name="unitCost" type="number" defaultValue="0" />
      <ActionMessage state={state} />
      <FormSubmitButton>Agregar linea</FormSubmitButton>
    </form>
  );
}

export function PurchaseReceiveForm({ purchaseId }: { purchaseId: string }) {
  const [state, formAction] = useActionState(receivePurchaseFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <input name="purchaseId" type="hidden" value={purchaseId} />
      <ActionMessage state={state} />
      <FormSubmitButton>Recibir compra</FormSubmitButton>
    </form>
  );
}

export function PurchaseVoidForm({ purchaseId }: { purchaseId: string }) {
  const [state, formAction] = useActionState(voidPurchaseFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <input name="purchaseId" type="hidden" value={purchaseId} />
      <ActionMessage state={state} />
      <FormSubmitButton variant="danger">Anular compra</FormSubmitButton>
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
      <input className="rounded border border-[var(--border)] px-3 py-2" defaultValue={defaultValue} min={type === "number" ? 0 : undefined} name={name} required={required} type={type} />
    </label>
  );
}
