import { InventoryMovementType } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { MetricCard, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { inventoryMovementLabels } from "@/lib/inventory/movement-labels";
import { getProductStockMap } from "@/server/inventory/stock";
import {
  ApproveInventoryCountForm,
  InventoryCountCreateForm,
  ProductOpeningForm,
  SpecialMovementForm,
  VoidInventoryCountForm,
} from "./operation-forms";

const countStatusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  APPROVED: "Aprobado",
  VOID: "Anulado",
};

function countStatusTone(status: string): "neutral" | "success" | "danger" {
  if (status === "APPROVED") {
    return "success";
  }

  if (status === "VOID") {
    return "danger";
  }

  return "neutral";
}

function differenceTone(difference: number): "success" | "warning" | "neutral" {
  if (difference === 0) {
    return "success";
  }

  return "warning";
}

export default async function InventoryOperationsPage() {
  const currentUser = await requireUserWithPermissions();
  const permissions = new Set(currentUser.permissions);
  const specialTypes = [
    InventoryMovementType.DAMAGED_PRODUCT,
    InventoryMovementType.SHRINKAGE,
    InventoryMovementType.INTERNAL_USE,
    InventoryMovementType.TOURNAMENT_PRIZE,
    InventoryMovementType.COMPENSATION,
  ];
  const [products, recentMovements, counts, openings] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        sku: true,
        name: true,
        type: true,
        averageCost: true,
      },
    }),
    prisma.inventoryMovement.findMany({
      where: { type: { in: specialTypes } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        product: { select: { sku: true, name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.inventoryCount.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        items: {
          include: {
            product: { select: { sku: true, name: true } },
          },
        },
      },
    }),
    prisma.productOpening.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        inputs: { include: { product: { select: { sku: true, name: true } } } },
        outputs: { include: { product: { select: { sku: true, name: true } } } },
      },
    }),
  ]);
  const stockMap = await getProductStockMap(products.map((product) => product.id));
  const productOptions = products.map((product) => ({
    ...product,
    type: product.type,
    stock: stockMap.get(product.id) ?? 0,
  }));
  const draftCounts = counts.filter((count) => count.status === "DRAFT");
  const openedSealedCount = openings.reduce(
    (total, opening) =>
      total + opening.inputs.reduce((subtotal, input) => subtotal + input.quantity, 0),
    0,
  );
  const specialOutputStock = recentMovements.reduce(
    (total, movement) => total + movement.quantity,
    0,
  );

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="Inventario"
          title="Operaciones especiales"
          description="Registra salidas no comerciales, conteos fisicos con aprobacion y aperturas de productos sellados."
          actions={
            <StatusBadge tone={draftCounts.length > 0 ? "warning" : "success"}>
              {draftCounts.length} conteos pendientes
            </StatusBadge>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Productos activos"
            value={String(productOptions.length)}
            detail="Disponibles para operar"
            tone="primary"
          />
          <MetricCard
            label="Movimientos especiales"
            value={String(recentMovements.length)}
            detail={`Saldo ultimos registros: ${specialOutputStock}`}
            tone="accent"
          />
          <MetricCard
            label="Conteos pendientes"
            value={String(draftCounts.length)}
            detail="Requieren aprobacion"
            tone={draftCounts.length > 0 ? "warning" : "neutral"}
          />
          <MetricCard
            label="Sellados abiertos"
            value={String(openedSealedCount)}
            detail="Unidades consumidas en aperturas"
            tone="primary"
          />
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="grid gap-6">
            <Panel>
              <PanelHeader
                title="Conteos fisicos"
                description="Los borradores no cambian stock hasta ser aprobados."
              />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="p-3">Numero</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Items</th>
                      <th className="p-3">Diferencia</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counts.map((count) => {
                      const difference = count.items.reduce(
                        (total, item) => total + item.difference,
                        0,
                      );

                      return (
                        <tr className="border-b border-[var(--border)] align-top" key={count.id}>
                          <td className="p-3 font-medium">#{count.internalNumber}</td>
                          <td className="p-3">{formatDateTime(count.createdAt)}</td>
                          <td className="p-3">
                            <div className="grid gap-1">
                              {count.items.slice(0, 3).map((item) => (
                                <span key={item.id}>
                                  {item.product.sku} contado {item.countedStock}
                                </span>
                              ))}
                              {count.items.length > 3 ? (
                                <span className="text-[var(--muted)]">
                                  +{count.items.length - 3} mas
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="p-3">
                            <StatusBadge tone={differenceTone(difference)}>
                              {difference}
                            </StatusBadge>
                          </td>
                          <td className="p-3">
                            <StatusBadge tone={countStatusTone(count.status)}>
                              {countStatusLabels[count.status] ?? count.status}
                            </StatusBadge>
                          </td>
                          <td className="p-3">
                            {count.status === "DRAFT" &&
                            permissions.has("inventory.adjust.approve") ? (
                              <div className="grid gap-2">
                                <ApproveInventoryCountForm inventoryCountId={count.id} />
                                <VoidInventoryCountForm inventoryCountId={count.id} />
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                    {counts.length === 0 ? (
                      <tr>
                        <td className="p-4 text-sm text-[var(--muted)]" colSpan={6}>
                          No hay conteos registrados.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Aperturas recientes"
                description="Cada apertura consume sellados y genera entradas para los productos obtenidos."
              />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="p-3">Numero</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Entrada</th>
                      <th className="p-3">Salidas</th>
                      <th className="p-3">Costo asignado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openings.map((opening) => (
                      <tr className="border-b border-[var(--border)] align-top" key={opening.id}>
                        <td className="p-3 font-medium">#{opening.internalNumber}</td>
                        <td className="p-3">{formatDateTime(opening.createdAt)}</td>
                        <td className="p-3">
                          {opening.inputs.map((input) => (
                            <p key={input.id}>
                              {input.product.sku} x {input.quantity}
                            </p>
                          ))}
                        </td>
                        <td className="p-3">
                          {opening.outputs.slice(0, 4).map((output) => (
                            <p key={output.id}>
                              {output.product.sku} x {output.quantity}
                            </p>
                          ))}
                          {opening.outputs.length > 4 ? (
                            <p className="text-[var(--muted)]">
                              +{opening.outputs.length - 4} mas
                            </p>
                          ) : null}
                        </td>
                        <td className="p-3">
                          {formatCurrency(opening.totalOutputCost)}
                        </td>
                      </tr>
                    ))}
                    {openings.length === 0 ? (
                      <tr>
                        <td className="p-4 text-sm text-[var(--muted)]" colSpan={5}>
                          No hay aperturas registradas.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Movimientos especiales recientes"
                description="Salidas operativas y compensaciones registradas fuera de compras o ventas."
              />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Producto</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Cantidad</th>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMovements.map((movement) => (
                      <tr className="border-b border-[var(--border)]" key={movement.id}>
                        <td className="p-3">{formatDateTime(movement.createdAt)}</td>
                        <td className="p-3">
                          {movement.product.sku} - {movement.product.name}
                        </td>
                        <td className="p-3">
                          {inventoryMovementLabels[movement.type] ?? movement.type}
                        </td>
                        <td className="p-3">{movement.quantity}</td>
                        <td className="p-3">{movement.user.name}</td>
                        <td className="p-3">{movement.reason}</td>
                      </tr>
                    ))}
                    {recentMovements.length === 0 ? (
                      <tr>
                        <td className="p-4 text-sm text-[var(--muted)]" colSpan={6}>
                          No hay movimientos especiales registrados.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <aside className="grid content-start gap-6">
            {permissions.has("inventory.specialMovement.create") ? (
              <Panel>
                <PanelHeader
                  title="Operacion simple"
                  description="Danos, mermas, uso interno, premios o compensaciones."
                />
                <SpecialMovementForm products={productOptions} />
              </Panel>
            ) : null}

            {permissions.has("inventory.count") ? (
              <Panel>
                <PanelHeader
                  title="Nuevo conteo"
                  description="Guarda diferencias como borrador para aprobacion."
                />
                <InventoryCountCreateForm products={productOptions} />
              </Panel>
            ) : null}

            {permissions.has("openings.create") ? (
              <Panel>
                <PanelHeader
                  title="Apertura de sellado"
                  description="Consume sellados y asigna costos manuales a productos obtenidos."
                />
                <ProductOpeningForm products={productOptions} />
              </Panel>
            ) : null}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
