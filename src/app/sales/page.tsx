import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { MetricCard, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/format";
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

export default async function SalesPage() {
  const currentUser = await requireUserWithPermissions();
  const [products, paymentMethods, latestSales] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, sku: true, name: true, salePrice: true },
      take: 200,
    }),
    prisma.paymentMethod.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { payments: { include: { paymentMethod: true } }, items: true },
    }),
  ]);
  const stockMap = await getProductStockMap(products.map((product) => product.id));
  const sellableProducts = products
    .map((product) => ({
      ...product,
      stock: stockMap.get(product.id) ?? 0,
    }))
    .filter((product) => product.stock > 0);
  const latestSalesTotal = latestSales.reduce(
    (total, sale) => total + sale.finalTotal,
    0,
  );

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="Punto de venta"
          title="Ventas"
          description="Registra ventas con control de stock, pagos exactos y movimientos trazables."
          actions={<StatusBadge tone="success">{sellableProducts.length} productos disponibles</StatusBadge>}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Ultimas ventas" value={String(latestSales.length)} detail="Registros recientes cargados" />
          <MetricCard label="Monto reciente" value={formatCurrency(latestSalesTotal)} detail="Suma de las ventas listadas" tone="primary" />
          <MetricCard label="Productos vendibles" value={String(sellableProducts.length)} detail="Activos con stock positivo" tone="accent" />
        </div>

        <SaleForm products={sellableProducts} paymentMethods={paymentMethods} />

        <Panel>
          <PanelHeader title="Ultimas ventas" description="Ventas completadas recientemente." />
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
        </Panel>
      </div>
    </AppShell>
  );
}
