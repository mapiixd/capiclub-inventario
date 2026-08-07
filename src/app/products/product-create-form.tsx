"use client";

import { useActionState } from "react";
import { ProductType } from "@prisma/client";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  createProductFormAction,
  type ProductFormState,
} from "./actions";

const initialState: ProductFormState = {};

const productTypeLabels: Record<ProductType, string> = {
  SEALED: "Producto sellado",
  SINGLE: "Single",
  ACCESSORY: "Accesorio",
  MERCHANDISING: "Merchandising",
  SERVICE: "Inscripcion o servicio",
  OTHER: "Otro",
};

type Option = {
  id: string;
  name: string;
};

export function ProductCreateForm({
  games,
  categories,
}: {
  games: Option[];
  categories: Option[];
}) {
  const [state, formAction] = useActionState(
    createProductFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <Field label="SKU" name="sku" />
      <Field label="Codigo de barras" name="barcode" required={false} />
      <Field label="Nombre" name="name" />
      <Select label="Tipo" name="type">
        {Object.entries(productTypeLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Select label="Juego" name="gameId" required={false}>
        <option value="">Sin juego</option>
        {games.map((game) => (
          <option key={game.id} value={game.id}>
            {game.name}
          </option>
        ))}
      </Select>
      <Select label="Categoria" name="categoryId" required={false}>
        <option value="">Sin categoria</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Field label="Edicion" name="edition" required={false} />
      <Field label="Marca/fabricante" name="manufacturer" required={false} />
      <Field label="Idioma" name="language" required={false} />
      <Field label="Condicion" name="condition" required={false} />
      <Field label="Rareza" name="rarity" required={false} />
      <Field label="Variante" name="variant" required={false} />
      <Field label="Costo promedio" name="averageCost" type="number" defaultValue="0" />
      <Field label="Ultimo costo" name="lastPurchaseCost" type="number" defaultValue="0" />
      <Field label="Precio venta" name="salePrice" type="number" defaultValue="0" />
      <Field label="Stock minimo" name="minimumStock" type="number" defaultValue="0" />
      <label className="grid gap-1 text-sm">
        Notas
        <textarea className="min-h-20 rounded border border-[var(--border)] px-3 py-2" name="notes" />
      </label>

      <ActionMessage state={state} />

      <FormSubmitButton>Crear producto</FormSubmitButton>
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
  required = true,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select className="rounded border border-[var(--border)] px-3 py-2" name={name} required={required}>
        {children}
      </select>
    </label>
  );
}
