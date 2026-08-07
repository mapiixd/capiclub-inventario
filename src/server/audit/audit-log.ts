import "server-only";
import { prisma } from "@/lib/db";

type AuditLogInput = {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  previousData?: unknown;
  nextData?: unknown;
  reason?: string;
  terminalOrIp?: string;
};

export async function recordAuditLog(input: AuditLogInput) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      previousData:
        input.previousData === undefined
          ? undefined
          : JSON.stringify(input.previousData),
      nextData:
        input.nextData === undefined ? undefined : JSON.stringify(input.nextData),
      reason: input.reason,
      terminalOrIp: input.terminalOrIp,
    },
  });
}

