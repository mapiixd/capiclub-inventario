"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Correo
        <input
          className="rounded border border-[var(--border)] px-3 py-2"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Contrasena
        <input
          className="rounded border border-[var(--border)] px-3 py-2"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      {state.message ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--danger)]">
          {state.message}
        </p>
      ) : null}

      <button
        className="inline-flex items-center justify-center gap-2 rounded bg-[var(--primary)] px-4 py-2 font-medium text-[var(--primary-foreground)] disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        <LogIn size={18} />
        {pending ? "Ingresando" : "Ingresar"}
      </button>
    </form>
  );
}

