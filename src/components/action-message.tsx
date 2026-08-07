export type ActionState = {
  message?: string;
  ok?: boolean;
};

export function ActionMessage({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={`rounded-lg border px-3 py-2 text-sm shadow-[var(--shadow-sm)] ${
        state.ok
          ? "border-green-200 bg-[color-mix(in_srgb,var(--success)_10%,var(--surface-elevated))] text-[var(--success)]"
          : "border-red-200 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface-elevated))] text-[var(--danger)]"
      }`}
    >
      {state.message}
    </p>
  );
}
