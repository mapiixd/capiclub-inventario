"use client";

import { useFormStatus } from "react-dom";

export function FormSubmitButton({
  children,
  variant = "primary",
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const className = {
    primary:
      "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]",
    secondary:
      "bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)]",
    danger: "bg-[var(--danger)] text-white border-[var(--danger)]",
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center rounded border px-4 py-2 text-sm font-medium disabled:opacity-60 ${className}`}
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? "Guardando" : children}
    </button>
  );
}
