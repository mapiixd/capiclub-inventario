import Image from "next/image";
import { AppNav } from "@/components/app-nav";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AuthenticatedUserWithPermissions } from "@/lib/auth/session";

export function AppShell({
  user,
  children,
}: {
  user: AuthenticatedUserWithPermissions;
  children: React.ReactNode;
}) {
  return (
    <main className="shell-grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-[var(--border)] bg-[var(--sidebar)] px-4 py-4 text-[var(--sidebar-foreground)] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-white/10 lg:px-5">
        <div className="flex items-center justify-between gap-4 lg:block">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[var(--shadow-sm)]">
              <Image
                alt="CapiClub"
                className="h-11 w-11 object-contain"
                height={44}
                priority
                src="/brand/capiclub-icon.png"
                width={44}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
                CapiClub
              </p>
              <h1 className="mt-1 truncate text-xl font-semibold">Inventario</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:mt-6">
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-5">
          <AppNav permissions={user.permissions} />
        </div>
      </aside>

      <section className="min-w-0">
        <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                Gestion local
              </p>
              <p className="text-sm text-[var(--foreground)]">
                Inventario, compras y ventas en una sola operacion.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right text-sm sm:block">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">{user.role}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
