import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

type TxClient = Prisma.TransactionClient | PrismaClient;

export async function getProductStock(productId: string, client: TxClient = prisma) {
  const result = await client.inventoryMovement.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });

  return result._sum.quantity ?? 0;
}

export async function getProductStockMap(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await prisma.inventoryMovement.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _sum: { quantity: true },
  });

  return new Map(rows.map((row) => [row.productId, row._sum.quantity ?? 0]));
}
