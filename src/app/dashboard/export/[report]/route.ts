import { InventoryMovementType, Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { inventoryMovementLabels } from "@/lib/inventory/movement-labels";
import { reportableSaleStatuses } from "@/lib/reports/metrics";
import { rowsToCsv } from "@/lib/reports/csv";
import { getProductStockMap } from "@/server/inventory/stock";

function parseDateRange(request: NextRequest) {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");

  return {
    from: fromParam ? new Date(`${fromParam}T00:00:00`) : defaultFrom,
    to: toParam ? new Date(`${toParam}T23:59:59`) : now,
  };
}

function csvResponse(report: string, csv: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${report}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ report: string }> },
) {
  const currentUser = await requireUserWithPermissions();
  await requirePermission(currentUser.id, "reports.export");

  const { report } = await params;
  const { from, to } = parseDateRange(request);
  const reportableSalesWhere: Prisma.SaleWhereInput = {
    createdAt: { gte: from, lte: to },
    status: { in: [...reportableSaleStatuses] },
  };

  if (report === "sales") {
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "desc" },
      include: {
        payments: { include: { paymentMethod: true } },
      },
    });
    const csv = rowsToCsv(
      [
        "numero",
        "fecha",
        "estado",
        "total",
        "costo_estimado",
        "margen_estimado",
        "medios_pago",
      ],
      sales.map((sale) => [
        sale.visibleNumber,
        formatDateTime(sale.createdAt),
        sale.status,
        sale.finalTotal,
        sale.estimatedCostTotal,
        sale.estimatedMarginTotal,
        sale.payments.map((payment) => payment.paymentMethod.name).join(" + "),
      ]),
    );

    return csvResponse("ventas", csv);
  }

  if (report === "top-products") {
    const items = await prisma.saleItem.findMany({
      where: { sale: reportableSalesWhere },
      include: {
        product: { select: { sku: true, name: true } },
      },
    });
    const rows = Object.values(
      items.reduce<
        Record<string, { sku: string; name: string; quantity: number; total: number }>
      >((summary, item) => {
        const current = summary[item.productId] ?? {
          sku: item.product.sku,
          name: item.product.name,
          quantity: 0,
          total: 0,
        };
        current.quantity += item.quantity;
        current.total += item.quantity * item.finalUnitPrice;
        summary[item.productId] = current;
        return summary;
      }, {}),
    ).sort((a, b) => b.quantity - a.quantity || b.total - a.total);
    const csv = rowsToCsv(
      ["sku", "producto", "unidades", "total"],
      rows.map((row) => [row.sku, row.name, row.quantity, row.total]),
    );

    return csvResponse("productos-mas-vendidos", csv);
  }

  if (report === "inventory-value") {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        sku: true,
        name: true,
        averageCost: true,
        salePrice: true,
      },
    });
    const stockMap = await getProductStockMap(products.map((product) => product.id));
    const csv = rowsToCsv(
      [
        "sku",
        "producto",
        "stock",
        "costo_promedio",
        "precio_venta",
        "valor_costo",
        "valor_venta",
      ],
      products.map((product) => {
        const stock = stockMap.get(product.id) ?? 0;

        return [
          product.sku,
          product.name,
          stock,
          product.averageCost,
          product.salePrice,
          stock * product.averageCost,
          stock * product.salePrice,
        ];
      }),
    );

    return csvResponse("inventario-valorizado", csv);
  }

  if (report === "inventory-movements") {
    const movements = await prisma.inventoryMovement.findMany({
      where: { createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { sku: true, name: true } },
        user: { select: { name: true } },
      },
    });
    const csv = rowsToCsv(
      [
        "fecha",
        "sku",
        "producto",
        "tipo",
        "cantidad",
        "stock_anterior",
        "stock_resultante",
        "usuario",
        "motivo",
      ],
      movements.map((movement) => [
        formatDateTime(movement.createdAt),
        movement.product.sku,
        movement.product.name,
        inventoryMovementLabels[movement.type as InventoryMovementType] ??
          movement.type,
        movement.quantity,
        movement.previousStock,
        movement.resultingStock,
        movement.user.name,
        movement.reason,
      ]),
    );

    return csvResponse("movimientos-inventario", csv);
  }

  if (report === "expenses") {
    const expenses = await prisma.cashMovement.findMany({
      where: {
        type: "EXPENSE",
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: "desc" },
      include: {
        cashSession: {
          include: { cashRegister: true },
        },
      },
    });
    const csv = rowsToCsv(
      ["fecha", "caja", "monto", "motivo"],
      expenses.map((expense) => [
        formatDateTime(expense.createdAt),
        expense.cashSession.cashRegister.name,
        expense.amount,
        expense.reason,
      ]),
    );

    return csvResponse("gastos", csv);
  }

  return NextResponse.json({ message: "Reporte no encontrado." }, { status: 404 });
}
