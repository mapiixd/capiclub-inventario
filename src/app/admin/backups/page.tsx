import { AppShell } from "@/components/app-shell";
import { MetricCard, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { ensureDailyBackup, listBackupFiles } from "@/lib/backups/backup-store";
import { getBackupDirectory, getDatabasePath } from "@/lib/backups/paths";
import { formatDateTime } from "@/lib/format";
import { CreateBackupForm, RestoreBackupForm } from "./backup-forms";

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default async function BackupsPage() {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "backup.create");
  await ensureDailyBackup();
  const backups = await listBackupFiles();
  const latestBackup = backups[0];
  const canRestore = currentUser.permissions.includes("backup.restore");

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="Administracion"
          title="Respaldos"
          description="Crea respaldos de la base local SQLite y restaura respaldos existentes cuando sea necesario."
          actions={<StatusBadge tone="success">{backups.length} respaldos</StatusBadge>}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Ultimo respaldo"
            value={latestBackup ? formatDateTime(latestBackup.createdAt) : "Sin respaldos"}
            detail={latestBackup?.fileName}
            tone="primary"
          />
          <MetricCard
            label="Base activa"
            value="SQLite"
            detail={getDatabasePath()}
            tone="accent"
          />
          <MetricCard
            label="Carpeta"
            value="Backups"
            detail={getBackupDirectory()}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel>
            <PanelHeader
              title="Respaldos disponibles"
              description="La restauracion crea antes un respaldo de seguridad de la base actual."
            />
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left">
                    <th className="p-3">Archivo</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Tamano</th>
                    <th className="p-3">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr className="border-b border-[var(--border)] align-top" key={backup.fileName}>
                      <td className="p-3 font-medium">{backup.fileName}</td>
                      <td className="p-3">{formatDateTime(backup.createdAt)}</td>
                      <td className="p-3">{formatBytes(backup.size)}</td>
                      <td className="p-3">
                        {canRestore ? (
                          <RestoreBackupForm fileName={backup.fileName} />
                        ) : (
                          <span className="text-sm text-[var(--muted)]">
                            Sin permiso
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {backups.length === 0 ? (
                    <tr>
                      <td className="p-4 text-sm text-[var(--muted)]" colSpan={4}>
                        No hay respaldos disponibles.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Panel>

          <aside className="grid content-start gap-6">
            <Panel className="p-5">
              <h3 className="text-lg font-semibold">Crear respaldo</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Se copia la base activa a la carpeta configurada en BACKUP_DIR.
              </p>
              <div className="mt-4">
                <CreateBackupForm />
              </div>
            </Panel>

            <Panel className="p-5">
              <h3 className="text-lg font-semibold">Uso recomendado</h3>
              <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
                <p>Crea un respaldo antes de actualizar el sistema.</p>
                <p>Guarda copias externas en un disco o nube.</p>
                <p>Despues de restaurar, reinicia la aplicacion local.</p>
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
