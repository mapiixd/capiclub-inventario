"use server";

import { redirect } from "next/navigation";
import { destroySession, getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/server/audit/audit-log";

export async function logoutAction() {
  const user = await getCurrentUser();

  if (user) {
    await recordAuditLog({
      userId: user.id,
      action: "auth.logout",
      entity: "User",
      entityId: user.id,
    });
  }

  await destroySession();
  redirect("/login");
}

