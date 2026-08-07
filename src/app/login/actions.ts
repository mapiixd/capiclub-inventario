"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validation/auth";
import { recordAuditLog } from "@/server/audit/audit-log";

export type LoginState = {
  message?: string;
};

export async function loginAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Datos de acceso invalidos.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || user.status !== "ACTIVE") {
    return { message: "Correo o contrasena incorrectos." };
  }

  const validPassword = await verifyPassword(
    user.passwordHash,
    parsed.data.password,
  );

  if (!validPassword) {
    return { message: "Correo o contrasena incorrectos." };
  }

  await createSession(user.id);
  await recordAuditLog({
    userId: user.id,
    action: "auth.login",
    entity: "User",
    entityId: user.id,
  });

  redirect("/dashboard");
}

