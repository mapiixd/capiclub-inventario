"use server";

import { revalidatePath } from "next/cache";
import { getActionErrorMessage, type FormActionState } from "@/lib/action-state";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import {
  createDatabaseBackup,
  restoreDatabaseBackup,
} from "@/lib/backups/backup-store";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/server/audit/audit-log";

export type BackupFormState = FormActionState;

export async function createBackupFormAction(
  _state: BackupFormState,
  _formData: FormData,
): Promise<BackupFormState> {
  void _state;
  void _formData;

  try {
    const currentUser = await requireUserWithPermissions();
    await requirePermission(currentUser.id, "backup.create");
    const backup = await createDatabaseBackup();
    await recordAuditLog({
      userId: currentUser.id,
      action: "backup.create",
      entity: "Backup",
      entityId: backup.fileName,
      nextData: {
        fileName: backup.fileName,
        size: backup.size,
      },
    });
    revalidatePath("/admin/backups");
    return { ok: true, message: `Respaldo creado: ${backup.fileName}` };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function restoreBackupFormAction(
  _state: BackupFormState,
  formData: FormData,
): Promise<BackupFormState> {
  try {
    const currentUser = await requireUserWithPermissions();
    await requirePermission(currentUser.id, "backup.restore");
    const fileName = String(formData.get("fileName") ?? "");

    await recordAuditLog({
      userId: currentUser.id,
      action: "backup.restore.request",
      entity: "Backup",
      entityId: fileName,
      reason: "Restauracion solicitada desde administracion.",
    });

    await prisma.$disconnect();
    const result = await restoreDatabaseBackup(fileName);

    return {
      ok: true,
      message: `Base restaurada desde ${result.restoredFrom}. Reinicia la app para asegurar que todos los procesos usen la base restaurada.`,
    };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}
