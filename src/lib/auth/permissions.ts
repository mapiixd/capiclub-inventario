import "server-only";
import { prisma } from "@/lib/db";

export async function userHasPermission(userId: string, permissionKey: string) {
  const count = await prisma.user.count({
    where: {
      id: userId,
      status: "ACTIVE",
      role: {
        permissions: {
          some: {
            permission: {
              key: permissionKey,
            },
          },
        },
      },
    },
  });

  return count > 0;
}

export async function requirePermission(userId: string, permissionKey: string) {
  const allowed = await userHasPermission(userId, permissionKey);

  if (!allowed) {
    throw new Error("No tienes permiso para realizar esta accion.");
  }
}

