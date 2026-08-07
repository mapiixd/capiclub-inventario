"use client";

import { useActionState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import { updateSettingFormAction, type SettingFormState } from "./actions";

const initialState: SettingFormState = {};

export function SettingForm({
  settingKey,
  value,
}: {
  settingKey: string;
  value: string;
}) {
  const [state, formAction] = useActionState(
    updateSettingFormAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-[220px_auto]">
      <input name="key" type="hidden" value={settingKey} />
      <input className="rounded border border-[var(--border)] px-3 py-2" name="value" defaultValue={value} />
      <FormSubmitButton>Guardar</FormSubmitButton>
      <div className="md:col-span-2">
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

