"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardList, DatabaseBackup, FileClock, LayoutDashboard, PackageOpen, Receipt, ShoppingBag, Settings, Users, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/components/ui";

type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  group: "Operaciones" | "Administracion";
};

const navItems: AppNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Operaciones" },
  { href: "/products", label: "Productos", icon: Boxes, group: "Operaciones" },
  { href: "/inventory/movements", label: "Movimientos", icon: ClipboardList, group: "Operaciones" },
  { href: "/inventory/operations", label: "Operaciones", icon: PackageOpen, group: "Operaciones" },
  { href: "/purchases", label: "Compras", icon: ShoppingBag, permission: "purchases.create", group: "Operaciones" },
  { href: "/sales", label: "Ventas", icon: Receipt, permission: "sales.create", group: "Operaciones" },
  { href: "/cash", label: "Caja", icon: WalletCards, permission: "cash.open", group: "Operaciones" },
  { href: "/admin/users", label: "Usuarios", icon: Users, permission: "users.manage", group: "Administracion" },
  { href: "/admin/settings", label: "Configuracion", icon: Settings, permission: "settings.manage", group: "Administracion" },
  { href: "/admin/backups", label: "Respaldos", icon: DatabaseBackup, permission: "backup.create", group: "Administracion" },
  { href: "/admin/audit", label: "Auditoria", icon: FileClock, permission: "audit.view", group: "Administracion" },
];

export function AppNav({
  permissions,
}: {
  permissions: string[];
}) {
  const pathname = usePathname();
  const permissionSet = new Set(permissions);
  const visibleItems = navItems.filter(
    (item) => !item.permission || permissionSet.has(item.permission),
  );
  const groups = ["Operaciones", "Administracion"] as const;

  return (
    <nav className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
      {groups.map((group) => {
        const groupItems = visibleItems.filter((item) => item.group === group);

        if (groupItems.length === 0) {
          return null;
        }

        return (
          <div className="flex min-w-fit gap-2 lg:block lg:min-w-0" key={group}>
            <p className="hidden px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--sidebar-muted)] lg:block">
              {group}
            </p>
            <div className="flex gap-2 lg:grid">
              {groupItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    className={cn(
                      "inline-flex h-10 min-w-fit items-center gap-2 rounded-lg px-3 text-sm font-medium text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-active)] hover:text-[var(--sidebar-foreground)]",
                      active &&
                        "bg-[var(--sidebar-active)] text-[var(--sidebar-foreground)] shadow-[inset_3px_0_0_var(--primary)]",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
