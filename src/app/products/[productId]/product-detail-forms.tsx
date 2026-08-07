"use client";

import { ProductType } from "@prisma/client";
import { useActionState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  updateProductFormAction,
  updateProductStatusFormAction,
  type ProductUpdateFormState,
} from "../actions";

const initialState: ProductUpdateFormState = {};

const productTypeLabels: Record<ProductType, string> = {
  SEALED: "Producto sellado",
  SINGLE: "Single",
  ACCESSORY: "Accesorio",
  MERCHANDISING: "Merchandising",
  SERVICE: "Inscripcion o servicio",
  OTHER: "Otro",
};

type Option = { id: string; name: string };

type EditableProduct = {
  id: string;
  name: string;
  barcode: string | null;
  type: ProductType;
  gameId: string | null;
  categoryId: string | null;
  edition: string | null;
  manufacturer: string | null;
  language: string | null;
  condition: string | null;
  rarity: string | null;
  variant: string | null;
  averageCost: number;
  lastPurchaseCost: number;
  salePrice: number;
  minimumStock: number;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export function ProductEditForm({
  product,
  games,
  categories,
}: {
  product: EditableProduct;
  games: Option[];
  categories: Option[];
}) {
  const [state, formAction] = useActionState(updateProductFormAction, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <input name="productId" type="hidden" value={product.id} />
      <Field label="Nombre" name="name" defaultValue={product.name} />
      <Field label="Codigo de barras" name="barcode" defaultValue={product.barcode ?? ""} required={false} />
      <Select label="Tipo" name="type" defaultValue={product.type}>
        {Object.entries(productTypeLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </Select>
      <Select label="Juego" name="gameId" defaultValue={product.gameId ?? ""} required={false}>
        <option value="">Sin juego</option>
        {games.map((game) => (
          <option key={game.id} value={game.id}>{game.name}</option>
        ))}
      </Select>
      <Select label="Categoria" name="categoryId" defaultValue={product.categoryId ?? ""} required={false}>
        <option value="">Sin categoria</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </Select>
      <Field label="Edicion" name="edition" defaultValue={product.edition ?? ""} required={false} />
      <Field label="Marca/fabricante" name="manufacturer" defaultValue={product.manufacturer ?? ""} required={false} />
      <Field label="Idioma" name="language" defaultValue={product.language ?? ""} required={false} />
      <Field label="Condicion" name="condition" defaultValue={product.condition ?? ""} required={false} />
      <Field label="Rareza" name="rarity" defaultValue={product.rarity ?? ""} required={false} />
      <Field label="Variante" name="variant" defaultValue={product.variant ?? ""} required={false} />
      <Field label="Costo promedio" name="averageCost" type="number" defaultValue={String(product.averageCost)} />
      <Field label="Ultimo costo" name="lastPurchaseCost" type="number" defaultValue={String(product.lastPurchaseCost)} />
      <Field label="Precio venta" name="salePrice" type="number" defaultValue={String(product.salePrice)} />
      <Field label="Stock minimo" name="minimumStock" type="number" defaultValue={String(product.minimumStock)} />
      <label className="grid gap-1 text-sm">
        Notas
        <textarea className="min-h-20 rounded border border-[var(--border)] px-3 py-2" name="notes" defaultValue={product.notes ?? ""} />
      </label>
      <ActionMessage state={state} />
      <FormSubmitButton>Guardar producto</FormSubmitButton>
    </form>
  );
}

export function ProductStatusForm({
  productId,
  currentStatus,
}: {
  productId: string;
  currentStatus: "ACTIVE" | "INACTIVE";
}) {
  const [state, formAction] = useActionState(updateProductStatusFormAction, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-2">
      <input name="productId" type="hidden" value={productId} />
      <input name="status" type="hidden" value={currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"} />
      <ActionMessage state={state} />
      <FormSubmitButton variant="secondary">
        {currentStatus === "ACTIVE" ? "Desactivar" : "Activar"}
      </FormSubmitButton>
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

function Select({
  label,
  name,
  children,
  required = true,
  defaultValue,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select className="rounded border border-[var(--border)] px-3 py-2" defaultValue={defaultValue} name={name} required={required}>
        {children}
      </select>
    </label>
  );
}
