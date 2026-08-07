import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/logout/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-sm font-medium shadow-[var(--shadow-sm)] hover:bg-[var(--surface-muted)]"
        type="submit"
      >
        <LogOut size={16} />
        Salir
      </button>
    </form>
  );
}
