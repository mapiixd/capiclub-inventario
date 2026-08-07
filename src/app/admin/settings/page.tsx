import { AppShell } from "@/components/app-shell";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SettingForm } from "./setting-form";

export default async function SettingsPage() {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "settings.manage");
  const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });

  return (
    <AppShell user={currentUser}>
      <section className="rounded border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] p-4">
          <h2 className="text-xl font-semibold">Configuracion</h2>
          <p className="text-sm text-[var(--muted)]">Parametros operativos auditados.</p>
        </div>
        <div className="grid gap-3 p-4">
          {settings.map((setting) => (
            <div className="grid gap-3 rounded border border-[var(--border)] p-3 md:grid-cols-[1fr_360px]" key={setting.id}>
              <div>
                <p className="font-medium">{setting.key}</p>
                <p className="text-sm text-[var(--muted)]">{setting.description}</p>
              </div>
              <SettingForm settingKey={setting.key} value={setting.value} />
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
