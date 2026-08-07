import { InventoryMovementType, Prisma } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { inventoryMovementLabels } from "@/lib/inventory/movement-labels";

export default async function InventoryMovementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireUserWithPermissions();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const type = typeof params.type === "string" ? params.type : "ALL";
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const where: Prisma.InventoryMovementWhereInput = {};

  if (type !== "ALL") {
    where.type = type as InventoryMovementType;
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
    };
  }

  if (q) {
    where.OR = [
      { product: { sku: { contains: q } } },
      { product: { name: { contains: q } } },
      { reason: { contains: q } },
    ];
  }

  const movements = await prisma.inventoryMovement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { sku: true, name: true } },
      user: { select: { name: true } },
    },
  });

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="Inventario"
          title="Movimientos de inventario"
          description="Historial no editable de cambios de stock."
          actions={<StatusBadge tone="accent">{movements.length} resultados</StatusBadge>}
        />

      <Panel>
        <PanelHeader
          title="Historial"
          description="Filtra por producto, motivo, tipo o rango de fechas."
        />
        <div className="px-5 pb-4">
          <form className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr_150px_150px_auto]" action="/inventory/movements">
            <input
              className="rounded border border-[var(--border)] px-3 py-2 text-sm"
              defaultValue={q}
              name="q"
              placeholder="Producto, SKU o motivo"
            />
            <select
              className="rounded border border-[var(--border)] px-3 py-2 text-sm"
              defaultValue={type}
              name="type"
            >
              <option value="ALL">Todos los tipos</option>
              {Object.values(InventoryMovementType).map((movementType) => (
                <option key={movementType} value={movementType}>
                  {inventoryMovementLabels[movementType] ?? movementType}
                </option>
              ))}
            </select>
            <input
              className="rounded border border-[var(--border)] px-3 py-2 text-sm"
              defaultValue={from}
              name="from"
              type="date"
            />
            <input
              className="rounded border border-[var(--border)] px-3 py-2 text-sm"
              defaultValue={to}
              name="to"
              type="date"
            />
            <button className="rounded bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]" type="submit">
              Filtrar
            </button>
          </form>
        </div>
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
                <th className="p-3">Usuario</th>
                <th className="p-3">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr className="border-b border-[var(--border)]" key={movement.id}>
                  <td className="p-3">{formatDateTime(movement.createdAt)}</td>
                  <td className="p-3">
                    {movement.product.sku} - {movement.product.name}
                  </td>
                  <td className="p-3">
                    {inventoryMovementLabels[movement.type] ?? movement.type}
                  </td>
                  <td className="p-3">{movement.quantity}</td>
                  <td className="p-3">{movement.previousStock}</td>
                  <td className="p-3">{movement.resultingStock}</td>
                  <td className="p-3">{movement.user.name}</td>
                  <td className="p-3">{movement.reason}</td>
                </tr>
              ))}
              {movements.length === 0 ? (
                <tr>
                  <td className="p-4 text-sm text-[var(--muted)]" colSpan={8}>
                    No hay movimientos para los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
      </div>
    </AppShell>
  );
}
