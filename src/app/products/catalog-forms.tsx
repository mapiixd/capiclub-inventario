"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  createCategoryFormAction,
  createGameFormAction,
  type CatalogFormState,
} from "./actions";

const initialState: CatalogFormState = {};

type CategoryOption = {
  id: string;
  name: string;
};

export function GameCreateForm() {
  const [state, formAction] = useActionState(
    createGameFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <Field label="Nuevo juego" name="name" />
      <ActionMessage state={state} />
      <FormSubmitButton>Crear juego</FormSubmitButton>
    </form>
  );
}

export function CategoryCreateForm({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const [state, formAction] = useActionState(
    createCategoryFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 grid gap-3">
      <Field label="Nueva categoria" name="name" />
      <label className="grid gap-1 text-sm">
        Categoria padre
        <select className="rounded border border-[var(--border)] px-3 py-2" name="parentId">
          <option value="">Sin padre</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <ActionMessage state={state} />
      <FormSubmitButton>Crear categoria</FormSubmitButton>
    </form>
  );
}

function Field({ label, name }: { label: string; name: string }) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input className="rounded border border-[var(--border)] px-3 py-2" name={name} required />
    </label>
  );
}

