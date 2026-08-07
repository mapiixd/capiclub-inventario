import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { UserCreateForm, UserStatusForm } from "./user-forms";

export default async function UsersPage() {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "users.manage");

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { role: true },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-4">
            <h2 className="text-xl font-semibold">Usuarios</h2>
            <p className="text-sm text-[var(--muted)]">Cuentas locales y roles.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Accion</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr className="border-b border-[var(--border)]" key={user.id}>
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.role.name}</td>
                    <td className="p-3">{user.status === "ACTIVE" ? "Activo" : "Inactivo"}</td>
                    <td className="p-3">
                      <UserStatusForm
                        userId={user.id}
                        nextStatus={user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                        label={user.status === "ACTIVE" ? "Desactivar" : "Activar"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
          <h3 className="text-lg font-semibold">Crear usuario</h3>
          <UserCreateForm roles={roles} />
        </section>
      </div>
    </AppShell>
  );
}
