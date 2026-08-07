"use server";

import { revalidatePath } from "next/cache";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { getActionErrorMessage, type FormActionState } from "@/lib/action-state";
import { prisma } from "@/lib/db";
import { uniqueConstraintMessage } from "@/lib/db-errors";
import { createUserSchema, updateUserStatusSchema } from "@/lib/validation/admin";
import { recordAuditLog } from "@/server/audit/audit-log";

export type UserFormState = FormActionState;

export async function createUserAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "users.manage");

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user
    .create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        roleId: parsed.data.roleId,
      },
      select: { id: true, email: true, name: true, roleId: true },
    })
    .catch((error: unknown) => {
      const message = uniqueConstraintMessage(error, {
        email: "Ya existe un usuario con ese correo.",
      });
      throw new Error(message ?? "No se pudo crear el usuario.");
    });

  await recordAuditLog({
    userId: currentUser.id,
    action: "users.create",
    entity: "User",
    entityId: user.id,
    nextData: user,
  });

  revalidatePath("/admin/users");
}

export async function createUserFormAction(
  _state: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  try {
    await createUserAction(formData);
    return { ok: true, message: "Usuario creado correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}

export async function updateUserStatusAction(formData: FormData) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "users.manage");

  const parsed = updateUserStatusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error("Datos invalidos.");
  }

  if (parsed.data.userId === currentUser.id && parsed.data.status === "INACTIVE") {
    throw new Error("No puedes desactivar tu propio usuario.");
  }

  const previous = await prisma.user.findUniqueOrThrow({
    where: { id: parsed.data.userId },
    select: { id: true, status: true },
  });
  const updated = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });

  await recordAuditLog({
    userId: currentUser.id,
    action: "users.updateStatus",
    entity: "User",
    entityId: updated.id,
    previousData: previous,
    nextData: updated,
  });

  revalidatePath("/admin/users");
}

export async function updateUserStatusFormAction(
  _state: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  try {
    await updateUserStatusAction(formData);
    return { ok: true, message: "Estado actualizado correctamente." };
  } catch (error) {
    return { ok: false, message: getActionErrorMessage(error) };
  }
}
