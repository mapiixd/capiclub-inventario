"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  createBackupFormAction,
  restoreBackupFormAction,
  type BackupFormState,
} from "./actions";

const initialState: BackupFormState = {};

export function CreateBackupForm() {
  const [state, formAction] = useActionState(createBackupFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-3">
      <ActionMessage state={state} />
      <FormSubmitButton>Crear respaldo ahora</FormSubmitButton>
    </form>
  );
}

export function RestoreBackupForm({ fileName }: { fileName: string }) {
  const [state, formAction] = useActionState(restoreBackupFormAction, initialState);

  return (
    <form action={formAction} className="grid gap-2">
      <input name="fileName" type="hidden" value={fileName} />
      <ActionMessage state={state} />
      <FormSubmitButton variant="danger">Restaurar</FormSubmitButton>
    </form>
  );
}
