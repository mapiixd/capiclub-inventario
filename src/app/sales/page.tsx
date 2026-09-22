import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MetricCard, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { isReportableSaleStatus } from "@/lib/reports/metrics";
import { getProductStockMap } from "@/server/inventory/stock";
import { SaleForm } from "./sale-form";

const saleStatusLabels: Record<string, string> = {
  COMPLETED: "Completada",
  PARTIALLY_RETURNED: "Devuelta parcial",
  RETURNED: "Devuelta",
  VOID: "Anulada",
};

function saleStatusTone(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "PARTIALLY_RETURNED") return "warning";
  if (status === "RETURNED") return "accent";
  if (status === "VOID") return "danger";
  return "neutral";
}

const salesPerPage = 20;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireUserWithPermissions();
  const params = await searchParams;
  const requestedPage = typeof params.page === "string" ? Number(params.page) : 1;
  const totalSales = await prisma.sale.count();
  const totalPages = Math.max(1, Math.ceil(totalSales / salesPerPage));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, totalPages)
    : 1;
  const [products, paymentMethods, latestSales] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, sku: true, name: true, salePrice: true, tracksStock: true },
      take: 200,
    }),
    prisma.paymentMethod.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.sale.findMany({
      orderBy: [{ createdAt: "desc" }, { visibleNumber: "desc" }],
      skip: (page - 1) * salesPerPage,
      take: salesPerPage,
      include: { payments: { include: { paymentMethod: true } }, items: true },
    }),
  ]);
  const stockMap = await getProductStockMap(products.map((product) => product.id));
  const sellableProducts = products
    .map((product) => ({
      ...product,
      stock: stockMap.get(product.id) ?? 0,
    }))
    .filter((product) => !product.tracksStock || product.stock > 0);
  const latestSalesTotal = latestSales.reduce(
    (total, sale) =>
      isReportableSaleStatus(sale.status) ? total + sale.finalTotal : total,
    0,
  );

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="Punto de venta"
          title="Ventas"
          description="Registra ventas con control de stock, pagos exactos y movimientos trazables."
          actions={<StatusBadge tone="success">{sellableProducts.length} productos vendibles</StatusBadge>}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Ventas registradas" value={String(totalSales)} detail={`${latestSales.length} ventas en esta página`} />
          <MetricCard label="Monto de esta página" value={formatCurrency(latestSalesTotal)} detail="Suma sin anuladas ni devueltas" tone="primary" />
          <MetricCard label="Productos vendibles" value={String(sellableProducts.length)} detail="Activos con stock o sin control" tone="accent" />
        </div>

        <SaleForm products={sellableProducts} paymentMethods={paymentMethods} />

        <div id="historial-ventas" className="scroll-mt-4">
          <Panel>
            <PanelHeader title="Historial de ventas" description="Todas las ventas, desde las más recientes hasta las más antiguas." />
            <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
              {latestSales.map((sale) => (
                <div
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)]"
                  key={sale.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link className="font-medium underline" href={`/sales/${sale.id}`}>
                        Venta #{sale.visibleNumber}
                      </Link>
                      <p className="text-sm text-[var(--muted)]">{formatDateTime(sale.createdAt)}</p>
                    </div>
                    <div className="grid justify-items-end gap-2">
                      <p className="font-semibold">{formatCurrency(sale.finalTotal)}</p>
                      <StatusBadge tone={saleStatusTone(sale.status)}>
                        {saleStatusLabels[sale.status] ?? sale.status}
                      </StatusBadge>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Items: {sale.items.length} - Pagos: {sale.payments.map((payment) => payment.paymentMethod.name).join(", ")}
                  </p>
                </div>
              ))}
              {latestSales.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                  Sin ventas registradas.
                </p>
              ) : null}
            </div>
            {totalSales > 0 ? (
              <nav aria-label="Páginas del historial de ventas" className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] p-4 text-sm">
                <p className="text-[var(--muted)]">
                  Mostrando {(page - 1) * salesPerPage + 1}–{Math.min(page * salesPerPage, totalSales)} de {totalSales} ventas · Página {page} de {totalPages}
                </p>
                <div className="flex flex-wrap gap-3">
                  {page > 1 ? (
                    <Link className="rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-[var(--surface-muted)]" href={`/sales?page=${page - 1}#historial-ventas`}>
                      Ventas más recientes
                    </Link>
                  ) : null}
                  {page < totalPages ? (
                    <Link className="rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-[var(--surface-muted)]" href={`/sales?page=${page + 1}#historial-ventas`}>
                      Ventas anteriores
                    </Link>
                  ) : null}
                </div>
              </nav>
            ) : null}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
