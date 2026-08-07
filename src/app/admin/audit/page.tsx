import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function AuditPage() {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "audit.view");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <AppShell user={currentUser}>
      <section className="rounded border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] p-4">
          <h2 className="text-xl font-semibold">Auditoria</h2>
          <p className="text-sm text-[var(--muted)]">Ultimas 100 acciones sensibles.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left">
                <th className="p-3">Fecha</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Accion</th>
                <th className="p-3">Entidad</th>
                <th className="p-3">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr className="border-b border-[var(--border)]" key={log.id}>
                  <td className="p-3">{formatDateTime(log.createdAt)}</td>
                  <td className="p-3">{log.user?.name ?? "Sistema"}</td>
                  <td className="p-3">{log.action}</td>
                  <td className="p-3">{log.entity}</td>
                  <td className="p-3">{log.reason ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

