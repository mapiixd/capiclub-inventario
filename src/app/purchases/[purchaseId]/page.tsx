import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import {
  PurchaseDraftEditForm,
  PurchaseItemAddForm,
  PurchaseItemDeleteForm,
  PurchaseItemEditForm,
  PurchaseReceiveForm,
  PurchaseVoidForm,
} from "./purchase-detail-forms";

const purchaseStatusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  RECEIVED: "Recibida",
  VOID: "Anulada",
};

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const currentUser = await requireUserWithPermissions();
  const permissions = new Set(currentUser.permissions);
  const { purchaseId } = await params;
  const [purchase, suppliers, products] = await Promise.all([
    prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        supplier: true,
        items: { include: { product: { select: { sku: true, name: true } } } },
        inventoryMovements: {
          orderBy: { createdAt: "desc" },
          include: { product: { select: { sku: true, name: true } } },
        },
      },
    }),
    prisma.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, sku: true, name: true },
    }),
  ]);

  if (!purchase) {
    notFound();
  }
  const isDraft = purchase.status === "DRAFT";
  const canEditDraft = isDraft && permissions.has("purchases.create");

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-4">
            <Link className="text-sm text-[var(--muted)] underline" href="/purchases">
              Volver a compras
            </Link>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--muted)]">Compra interna</p>
                <h2 className="text-2xl font-semibold">#{purchase.internalNumber}</h2>
                <p className="text-sm text-[var(--muted)]">
                  {purchase.supplier.name} · {purchaseStatusLabels[purchase.status] ?? purchase.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--muted)]">Total</p>
                <p className="text-2xl font-semibold">{formatCurrency(purchase.total)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-3">
            <Info label="Documento proveedor" value={purchase.supplierDocumentNumber ?? ""} />
            <Info label="Fecha documento" value={purchase.documentDate ? formatDate(purchase.documentDate) : ""} />
            <Info label="Recepcion" value={purchase.receivedAt ? formatDateTime(purchase.receivedAt) : "Pendiente"} />
            <Info label="Subtotal" value={formatCurrency(purchase.subtotal)} />
            <Info label="Descuento" value={formatCurrency(purchase.discount)} />
            <Info label="Costos adicionales" value={formatCurrency(purchase.additionalCosts)} />
          </div>

          <div className="border-t border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold">Productos</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left">
                    <th className="p-3">Producto</th>
                    <th className="p-3">Cantidad</th>
                    <th className="p-3">Costo unitario</th>
                    <th className="p-3">Subtotal</th>
                    {canEditDraft ? <th className="p-3">Accion</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {purchase.items.map((item) => (
                    <tr className="border-b border-[var(--border)]" key={item.id}>
                      <td className="p-3">
                        {item.product.sku} - {item.product.name}
                      </td>
                      <td className="p-3">
                        {canEditDraft ? (
                          <PurchaseItemEditForm item={item} />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="p-3">{formatCurrency(item.unitCost)}</td>
                      <td className="p-3">{formatCurrency(item.lineSubtotal)}</td>
                      {canEditDraft ? (
                        <td className="p-3">
                          <PurchaseItemDeleteForm purchaseItemId={item.id} />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold">Movimientos generados</h3>
            <div className="mt-3 overflow-x-auto">
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
                  {purchase.inventoryMovements.map((movement) => (
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
                  {purchase.inventoryMovements.length === 0 ? (
                    <tr>
                      <td className="p-3 text-[var(--muted)]" colSpan={6}>
                        Esta compra aun no ha generado movimientos.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-6">
          {canEditDraft ? (
            <section className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-lg font-semibold">Editar borrador</h3>
              <PurchaseDraftEditForm purchase={purchase} suppliers={suppliers} />
            </section>
          ) : null}

          {canEditDraft ? (
            <section className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-lg font-semibold">Agregar linea</h3>
              <PurchaseItemAddForm purchaseId={purchase.id} products={products} />
            </section>
          ) : null}

          <section className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="text-lg font-semibold">Acciones</h3>
            <div className="mt-4 grid gap-3">
              {purchase.status === "DRAFT" && permissions.has("purchases.receive") ? (
                <PurchaseReceiveForm purchaseId={purchase.id} />
              ) : null}
              {purchase.status !== "VOID" && permissions.has("purchases.void") ? (
                <PurchaseVoidForm purchaseId={purchase.id} />
              ) : null}
              <p className="text-sm leading-6 text-[var(--muted)]">
                Recibir una compra aumenta stock y actualiza costos en una sola transaccion. Anular una compra recibida crea movimientos compensatorios.
              </p>
            </div>
          </section>

          {purchase.notes ? (
            <section className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-lg font-semibold">Observaciones</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{purchase.notes}</p>
            </section>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--border)] p-3">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
