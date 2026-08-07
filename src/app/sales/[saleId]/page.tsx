import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getReturnableQuantity, getReturnedQuantity } from "@/lib/sales/returns";
import { SaleReturnForm, SaleVoidForm } from "./sale-detail-forms";

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

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const currentUser = await requireUserWithPermissions();
  const permissions = new Set(currentUser.permissions);
  const { saleId } = await params;
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      items: {
        include: {
          product: { select: { sku: true, name: true } },
          returnItems: true,
        },
      },
      payments: { include: { paymentMethod: true } },
      returns: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true } },
          items: {
            include: {
              product: { select: { sku: true, name: true } },
            },
          },
        },
      },
      inventoryMovements: {
        orderBy: { createdAt: "desc" },
        include: { product: { select: { sku: true, name: true } } },
      },
    },
  });

  if (!sale) {
    notFound();
  }

  const canVoid = permissions.has("sales.void");
  const returnableItems = sale.items
    .map((item) => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      returnableQuantity: getReturnableQuantity(item),
    }))
    .filter((item) => item.returnableQuantity > 0);
  const canReturn =
    canVoid &&
    (sale.status === "COMPLETED" || sale.status === "PARTIALLY_RETURNED") &&
    returnableItems.length > 0;
  const canVoidFull = canVoid && sale.status === "COMPLETED" && sale.returns.length === 0;

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <Link className="text-sm text-[var(--muted)] underline" href="/sales">
          Volver a ventas
        </Link>
        <PageHeader
          eyebrow="Detalle de venta"
          title={`Venta #${sale.visibleNumber}`}
          description={`Registrada el ${formatDateTime(sale.createdAt)}`}
          actions={
            <StatusBadge tone={saleStatusTone(sale.status)}>
              {saleStatusLabels[sale.status] ?? sale.status}
            </StatusBadge>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="grid gap-6">
            <Panel>
              <PanelHeader title="Resumen" description="Totales historicos de la venta original." />
              <div className="grid gap-4 p-5 md:grid-cols-4">
                <Info label="Bruto" value={formatCurrency(sale.grossTotal)} />
                <Info label="Descuento" value={formatCurrency(sale.totalDiscount)} />
                <Info label="Total" value={formatCurrency(sale.finalTotal)} />
                <Info label="Margen estimado" value={formatCurrency(sale.estimatedMarginTotal)} />
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Productos vendidos" />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="p-3">Producto</th>
                      <th className="p-3">Vendidas</th>
                      <th className="p-3">Devueltas</th>
                      <th className="p-3">Precio final unit.</th>
                      <th className="p-3">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item) => {
                      const returned = getReturnedQuantity(item);

                      return (
                        <tr className="border-b border-[var(--border)]" key={item.id}>
                          <td className="p-3">
                            {item.product.sku} - {item.product.name}
                          </td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">{returned}</td>
                          <td className="p-3">{formatCurrency(item.finalUnitPrice)}</td>
                          <td className="p-3">{formatCurrency(item.finalUnitPrice * item.quantity)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Pagos" />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Medio</th>
                      <th className="p-3">Monto</th>
                      <th className="p-3">Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.payments.map((payment) => (
                      <tr className="border-b border-[var(--border)]" key={payment.id}>
                        <td className="p-3">{formatDateTime(payment.createdAt)}</td>
                        <td className="p-3">{payment.paymentMethod.name}</td>
                        <td className="p-3">{formatCurrency(payment.amount)}</td>
                        <td className="p-3">{payment.reference ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Devoluciones y anulaciones" />
              <div className="grid gap-3 p-5">
                {sale.returns.map((saleReturn) => (
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3" key={saleReturn.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {saleReturn.type === "VOID" ? "Anulacion" : "Devolucion"}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {formatDateTime(saleReturn.createdAt)} - {saleReturn.user.name}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(saleReturn.totalAmount)}</p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">{saleReturn.reason}</p>
                    <div className="mt-3 grid gap-1 text-sm">
                      {saleReturn.items.map((item) => (
                        <p key={item.id}>
                          {item.product.sku} - {item.product.name}: {item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {sale.returns.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    Esta venta no tiene devoluciones ni anulaciones.
                  </p>
                ) : null}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Movimientos de inventario" />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Cantidad</th>
                      <th className="p-3">Antes</th>
                      <th className="p-3">Despues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.inventoryMovements.map((movement) => (
                      <tr className="border-b border-[var(--border)]" key={movement.id}>
                        <td className="p-3">{formatDateTime(movement.createdAt)}</td>
                        <td className="p-3">
                          {movement.product.sku} - {movement.product.name}
                        </td>
                        <td className="p-3">{movement.type}</td>
                        <td className="p-3">{movement.quantity}</td>
                        <td className="p-3">{movement.previousStock}</td>
                        <td className="p-3">{movement.resultingStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <aside className="grid content-start gap-6">
            {canReturn ? (
              <Panel className="p-4">
                <h3 className="text-lg font-semibold">Registrar devolucion</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Devuelve solo las cantidades indicadas y restaura stock.
                </p>
                <div className="mt-4">
                  <SaleReturnForm saleId={sale.id} items={returnableItems} />
                </div>
              </Panel>
            ) : null}

            {canVoidFull ? (
              <Panel className="p-4">
                <h3 className="text-lg font-semibold">Anular venta</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Solo disponible antes de registrar devoluciones parciales.
                </p>
                <div className="mt-4">
                  <SaleVoidForm saleId={sale.id} />
                </div>
              </Panel>
            ) : null}

            {sale.notes ? (
              <Panel className="p-4">
                <h3 className="text-lg font-semibold">Observaciones</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{sale.notes}</p>
              </Panel>
            ) : null}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
