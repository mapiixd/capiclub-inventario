"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  createUserFormAction,
  updateUserStatusFormAction,
  type UserFormState,
} from "./actions";

const initialState: UserFormState = {};

type RoleOption = {
  id: string;
  name: string;
};

export function UserCreateForm({ roles }: { roles: RoleOption[] }) {
  const [state, formAction] = useActionState(
    createUserFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <Field label="Nombre" name="name" />
      <Field label="Correo" name="email" type="email" />
      <Field label="Contrasena inicial" name="password" type="password" />
      <label className="grid gap-1 text-sm">
        Rol
        <select className="rounded border border-[var(--border)] px-3 py-2" name="roleId" required>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </label>
      <ActionMessage state={state} />
      <FormSubmitButton>Crear usuario</FormSubmitButton>
    </form>
  );
}

export function UserStatusForm({
  userId,
  nextStatus,
  label,
}: {
  userId: string;
  nextStatus: "ACTIVE" | "INACTIVE";
  label: string;
}) {
  const [state, formAction] = useActionState(
    updateUserStatusFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="userId" type="hidden" value={userId} />
      <input name="status" type="hidden" value={nextStatus} />
      <button className="rounded border border-[var(--border)] px-3 py-1" type="submit">
        {label}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
}: {
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input className="rounded border border-[var(--border)] px-3 py-2" name={name} required type={type} />
    </label>
  );
}

