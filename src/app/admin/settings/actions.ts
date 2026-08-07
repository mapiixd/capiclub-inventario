"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { getActionErrorMessage, type FormActionState } from "@/lib/action-state";
import { prisma } from "@/lib/db";
import { updateSettingSchema } from "@/lib/validation/admin";
import { recordAuditLog } from "@/server/audit/audit-log";

export type SettingFormState = FormActionState;

export async function updateSettingAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "settings.manage");

  const parsed = updateSettingSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const previous = await prisma.systemSetting.findUniqueOrThrow({
    where: { key: parsed.data.key },
  });
  const updated = await prisma.systemSetting.update({
    where: { key: parsed.data.key },
    data: { value: parsed.data.value },
  });

  await recordAuditLog({
    userId: currentUser.id,
    action: "settings.update",
    entity: "SystemSetting",
    entityId: updated.id,
    previousData: previous,
    nextData: updated,
  });

  revalidatePath("/admin/settings");
}

export async function updateSettingFormAction(
  _state: SettingFormState,
  formData: FormData,
): Promise<SettingFormState> {
  try {
    await updateSettingAction(formData);
    return { ok: true, message: "Configuracion actualizada." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}
