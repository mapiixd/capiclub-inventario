import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/db";
import { calculateInventoryValuation, calculateSalesReportSummary, getTopSellingProducts, reportableSaleStatuses } from "@/lib/reports/metrics";
import { getProductStockMap } from "@/server/inventory/stock";
import { MetricCard, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";

function formatInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = now;

  return { from, to };
}

function parseDateRange(params: Record<string, string | string[] | undefined>) {
  const defaults = getDefaultDateRange();
  const fromValue = typeof params.from === "string" ? params.from : "";
  const toValue = typeof params.to === "string" ? params.to : "";
  const from = fromValue ? new Date(`${fromValue}T00:00:00`) : defaults.from;
  const to = toValue ? new Date(`${toValue}T23:59:59`) : defaults.to;

  return {
    from,
    to,
    fromValue: fromValue || formatInputDate(defaults.from),
    toValue: toValue || formatInputDate(defaults.to),
  };
}

function buildExportHref(report: string, from: string, to: string) {
  return `/dashboard/export/${report}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUserWithPermissions();
  const permissions = new Set(user.permissions);
  const canViewReports = permissions.has("reports.view");
  const canExportReports = permissions.has("reports.export");
  const params = await searchParams;
  const { from, to, fromValue, toValue } = parseDateRange(params);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      sku: true,
      name: true,
      averageCost: true,
      salePrice: true,
      minimumStock: true,
      game: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
  const stockMap = await getProductStockMap(products.map((product) => product.id));
  const inventoryRows = products.map((product) => ({
    ...product,
    stock: stockMap.get(product.id) ?? 0,
  }));
  const inventoryValuation = calculateInventoryValuation(inventoryRows);
  const lowStock = inventoryRows.filter(
    (product) =>
      product.minimumStock > 0 && product.stock > 0 && product.stock <= product.minimumStock,
  ).length;
  const noStock = inventoryRows.filter((product) => product.stock === 0).length;

  const emptySalesSummary = {
    saleCount: 0,
    salesTotal: 0,
    marginTotal: 0,
    averageTicket: 0,
  };
  const salesWhere: Prisma.SaleWhereInput = {
    createdAt: { gte: from, lte: to },
  };
  const reportableSalesWhere: Prisma.SaleWhereInput = {
    createdAt: { gte: from, lte: to },
    status: { in: [...reportableSaleStatuses] },
  };

  const [
    periodSales,
    todaySales,
    saleItems,
    payments,
    expenses,
    recentCashMovements,
  ] = canViewReports
    ? await Promise.all([
        prisma.sale.findMany({
          where: salesWhere,
          select: {
            status: true,
            finalTotal: true,
            estimatedMarginTotal: true,
          },
        }),
        prisma.sale.findMany({
          where: {
            createdAt: { gte: todayStart, lte: todayEnd },
            status: { in: [...reportableSaleStatuses] },
          },
          select: {
            status: true,
            finalTotal: true,
            estimatedMarginTotal: true,
          },
        }),
        prisma.saleItem.findMany({
          where: { sale: reportableSalesWhere },
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                game: { select: { name: true } },
                category: { select: { name: true } },
              },
            },
          },
        }),
        prisma.payment.findMany({
          where: { sale: reportableSalesWhere },
          include: {
            paymentMethod: true,
          },
        }),
        prisma.cashMovement.aggregate({
          where: {
            type: "EXPENSE",
            createdAt: { gte: from, lte: to },
          },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.cashMovement.findMany({
          where: {
            type: "EXPENSE",
            createdAt: { gte: from, lte: to },
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      ])
    : [[], [], [], [], { _sum: { amount: 0 }, _count: 0 }, []];

  const periodSalesSummary = canViewReports
    ? calculateSalesReportSummary(periodSales)
    : emptySalesSummary;
  const todaySalesSummary = canViewReports
    ? calculateSalesReportSummary(todaySales)
    : emptySalesSummary;
  const topProducts = canViewReports
    ? getTopSellingProducts(
        saleItems.map((item) => ({
          productId: item.product.id,
          sku: item.product.sku,
          productName: item.product.name,
          quantity: item.quantity,
          finalUnitPrice: item.finalUnitPrice,
        })),
        8,
      )
    : [];
  const paymentsByMethod = canViewReports
    ? Object.values(
        payments.reduce<
          Record<string, { paymentMethod: string; amount: number; count: number }>
        >((summary, payment) => {
          const current = summary[payment.paymentMethod.name] ?? {
            paymentMethod: payment.paymentMethod.name,
            amount: 0,
            count: 0,
          };
          current.amount += payment.amount;
          current.count += 1;
          summary[payment.paymentMethod.name] = current;
          return summary;
        }, {}),
      ).sort((a, b) => b.amount - a.amount)
    : [];
  const salesByGame = canViewReports
    ? Object.values(
        saleItems.reduce<Record<string, { label: string; quantity: number; total: number }>>(
          (summary, item) => {
            const label = item.product.game?.name ?? "Sin juego";
            const current = summary[label] ?? { label, quantity: 0, total: 0 };
            current.quantity += item.quantity;
            current.total += item.quantity * item.finalUnitPrice;
            summary[label] = current;
            return summary;
          },
          {},
        ),
      ).sort((a, b) => b.total - a.total)
    : [];
  const salesByCategory = canViewReports
    ? Object.values(
        saleItems.reduce<Record<string, { label: string; quantity: number; total: number }>>(
          (summary, item) => {
            const label = item.product.category?.name ?? "Sin categoria";
            const current = summary[label] ?? { label, quantity: 0, total: 0 };
            current.quantity += item.quantity;
            current.total += item.quantity * item.finalUnitPrice;
            summary[label] = current;
            return summary;
          },
          {},
        ),
      ).sort((a, b) => b.total - a.total)
    : [];
  const expenseTotal = expenses._sum.amount ?? 0;

  return (
    <AppShell user={user}>
      <section className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Operacion local"
          title="Dashboard"
          description="Resumen operativo para controlar ventas, margen, caja e inventario."
          actions={<StatusBadge tone="success">Sistema local activo</StatusBadge>}
        />

        <Panel>
          <PanelHeader
            title="Filtros"
            description="Las metricas comerciales usan el rango seleccionado."
          />
          <form className="grid gap-3 p-5 md:grid-cols-[180px_180px_auto]" action="/dashboard">
            <label className="grid gap-1 text-sm">
              Desde
              <input
                className="rounded border border-[var(--border)] px-3 py-2"
                defaultValue={fromValue}
                name="from"
                type="date"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Hasta
              <input
                className="rounded border border-[var(--border)] px-3 py-2"
                defaultValue={toValue}
                name="to"
                type="date"
              />
            </label>
            <button className="self-end rounded bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]" type="submit">
              Aplicar
            </button>
          </form>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Ventas del dia"
            value={formatCurrency(todaySalesSummary.salesTotal)}
            detail={`${todaySalesSummary.saleCount} ventas validas`}
            tone="accent"
          />
          <MetricCard
            label="Ventas del periodo"
            value={formatCurrency(periodSalesSummary.salesTotal)}
            detail={`${periodSalesSummary.saleCount} ventas validas`}
            tone="primary"
          />
          <MetricCard
            label="Ticket promedio"
            value={formatCurrency(periodSalesSummary.averageTicket)}
            detail="Solo ventas completadas o parciales"
          />
          <MetricCard
            label="Margen estimado"
            value={formatCurrency(periodSalesSummary.marginTotal)}
            detail="Segun costo historico de venta"
            tone="primary"
          />
          <MetricCard
            label="Gastos del periodo"
            value={formatCurrency(expenseTotal)}
            detail={`${expenses._count} movimientos de caja`}
            tone={expenseTotal > 0 ? "warning" : "neutral"}
          />
          <MetricCard
            label="Productos bajo minimo"
            value={String(lowStock)}
            detail="Activos con stock menor o igual al minimo"
            tone={lowStock > 0 ? "warning" : "primary"}
          />
          <MetricCard
            label="Productos sin stock"
            value={String(noStock)}
            detail="Productos activos sin unidades"
            tone={noStock > 0 ? "danger" : "primary"}
          />
          <MetricCard
            label="Inventario a costo"
            value={
              canViewReports ? formatCurrency(inventoryValuation.costValue) : "Restringido"
            }
            detail={
              canViewReports
                ? `Precio venta: ${formatCurrency(inventoryValuation.saleValue)}`
                : "Requiere permiso de reportes"
            }
            tone="primary"
          />
        </div>

        {!canViewReports ? (
          <Panel className="p-5">
            <p className="text-sm text-[var(--muted)]">
              Tu usuario no tiene permiso para ver reporterias comerciales completas.
            </p>
          </Panel>
        ) : null}

        {canViewReports ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="grid gap-6">
              <Panel>
                <PanelHeader
                  title="Productos mas vendidos"
                  description="Ranking por unidades vendidas en el periodo."
                >
                  {canExportReports ? (
                    <ExportLink href={buildExportHref("top-products", fromValue, toValue)} />
                  ) : null}
                </PanelHeader>
                <ReportTable
                  headers={["SKU", "Producto", "Unidades", "Total"]}
                  rows={topProducts.map((product) => [
                    product.sku,
                    product.productName,
                    product.quantity,
                    formatCurrency(product.total),
                  ])}
                />
              </Panel>

              <div className="grid gap-6 xl:grid-cols-2">
                <Panel>
                  <PanelHeader title="Ventas por juego" description="Totales por linea comercial." />
                  <ReportTable
                    headers={["Juego", "Unidades", "Total"]}
                    rows={salesByGame.map((row) => [
                      row.label,
                      row.quantity,
                      formatCurrency(row.total),
                    ])}
                  />
                </Panel>
                <Panel>
                  <PanelHeader title="Ventas por categoria" description="Totales por categoria." />
                  <ReportTable
                    headers={["Categoria", "Unidades", "Total"]}
                    rows={salesByCategory.map((row) => [
                      row.label,
                      row.quantity,
                      formatCurrency(row.total),
                    ])}
                  />
                </Panel>
              </div>

              <Panel>
                <PanelHeader
                  title="Ventas por medio de pago"
                  description="Monto cobrado por metodo en el periodo."
                >
                  {canExportReports ? (
                    <ExportLink href={buildExportHref("sales", fromValue, toValue)} />
                  ) : null}
                </PanelHeader>
                <ReportTable
                  headers={["Medio", "Pagos", "Total"]}
                  rows={paymentsByMethod.map((row) => [
                    row.paymentMethod,
                    row.count,
                    formatCurrency(row.amount),
                  ])}
                />
              </Panel>
            </div>

            <aside className="grid content-start gap-6">
              <Panel>
                <PanelHeader title="Exportaciones" description="Archivos CSV de solo lectura." />
                <div className="grid gap-2 p-5 text-sm">
                  {canExportReports ? (
                    <>
                      <ExportLink href={buildExportHref("sales", fromValue, toValue)} label="Ventas CSV" />
                      <ExportLink href={buildExportHref("top-products", fromValue, toValue)} label="Mas vendidos CSV" />
                      <ExportLink href={buildExportHref("inventory-value", fromValue, toValue)} label="Inventario valorizado CSV" />
                      <ExportLink href={buildExportHref("inventory-movements", fromValue, toValue)} label="Movimientos CSV" />
                      <ExportLink href={buildExportHref("expenses", fromValue, toValue)} label="Gastos CSV" />
                    </>
                  ) : (
                    <p className="text-[var(--muted)]">No tienes permiso para exportar.</p>
                  )}
                </div>
              </Panel>

              <Panel>
                <PanelHeader
                  title="Gastos recientes"
                  description="Movimientos de caja tipo gasto."
                />
                <div className="grid gap-3 p-5 text-sm">
                  {recentCashMovements.map((movement) => (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3" key={movement.id}>
                      <p className="font-medium">{formatCurrency(movement.amount)}</p>
                      <p className="mt-1 text-[var(--muted)]">{movement.reason}</p>
                    </div>
                  ))}
                  {recentCashMovements.length === 0 ? (
                    <p className="text-[var(--muted)]">Sin gastos en el periodo.</p>
                  ) : null}
                </div>
              </Panel>
            </aside>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

function ExportLink({
  href,
  label = "Exportar CSV",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      className="inline-flex items-center justify-center rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-muted)]"
      href={href}
    >
      {label}
    </Link>
  );
}

function ReportTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-left">
            {headers.map((header) => (
              <th className="p-3" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-b border-[var(--border)]" key={row.join("|")}>
              {row.map((cell, index) => (
                <td className="p-3" key={`${row.join("|")}-${index}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td className="p-4 text-sm text-[var(--muted)]" colSpan={headers.length}>
                Sin datos para el periodo.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
