import Link from "next/link";
import { Prisma } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { PurchaseCreateForm, SupplierCreateForm } from "./purchase-forms";

const purchaseStatusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  RECEIVED: "Recibida",
  VOID: "Anulada",
};

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireUserWithPermissions();
  const permissions = new Set(currentUser.permissions);
  const params = await searchParams;
  const supplierId = typeof params.supplierId === "string" ? params.supplierId : "";
  const status = typeof params.status === "string" ? params.status : "ALL";
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const where: Prisma.PurchaseWhereInput = {};

  if (supplierId) {
    where.supplierId = supplierId;
  }

  if (status !== "ALL") {
    where.status = status;
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
    };
  }

  if (q) {
    const asNumber = Number(q);
    where.OR = [
      ...(Number.isInteger(asNumber) ? [{ internalNumber: asNumber }] : []),
      { supplierDocumentNumber: { contains: q } },
      { supplier: { name: { contains: q } } },
    ];
  }

  const [purchases, suppliers, products] = await Promise.all([
    prisma.purchase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { supplier: true, items: true },
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

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="Abastecimiento"
          title="Compras"
          description="Las compras en borrador no afectan inventario. La recepcion crea movimientos."
          actions={<StatusBadge tone="accent">{purchases.length} resultados</StatusBadge>}
        />

        {permissions.has("purchases.create") ? (
          <PurchaseCreateForm suppliers={suppliers} products={products} />
        ) : null}

        <div className="grid gap-6 2xl:grid-cols-[1fr_360px]">
          <Panel>
            <PanelHeader
              title="Historial de compras"
              description="Consulta documentos por proveedor, fecha, estado o numero interno."
            />
            <div className="px-5 pb-4">
            <form className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_150px_150px_130px_auto]" action="/purchases">
              <input
                className="rounded border border-[var(--border)] px-3 py-2 text-sm"
                defaultValue={q}
                name="q"
                placeholder="Numero, proveedor o documento"
              />
              <select className="rounded border border-[var(--border)] px-3 py-2 text-sm" defaultValue={supplierId} name="supplierId">
                <option value="">Todos los proveedores</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <input className="rounded border border-[var(--border)] px-3 py-2 text-sm" defaultValue={from} name="from" type="date" />
              <input className="rounded border border-[var(--border)] px-3 py-2 text-sm" defaultValue={to} name="to" type="date" />
              <select className="rounded border border-[var(--border)] px-3 py-2 text-sm" defaultValue={status} name="status">
                <option value="ALL">Todos</option>
                <option value="DRAFT">Borrador</option>
                <option value="RECEIVED">Recibida</option>
                <option value="VOID">Anulada</option>
              </select>
              <button className="rounded bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]" type="submit">
                Filtrar
              </button>
            </form>
            </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="p-3">Numero</th>
                  <th className="p-3">Proveedor</th>
                  <th className="p-3">Fecha doc.</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((purchase) => (
                  <tr className="border-b border-[var(--border)]" key={purchase.id}>
                    <td className="p-3 font-medium">
                      <Link className="underline" href={`/purchases/${purchase.id}`}>
                        #{purchase.internalNumber}
                      </Link>
                    </td>
                    <td className="p-3">{purchase.supplier.name}</td>
                    <td className="p-3">{purchase.documentDate ? formatDate(purchase.documentDate) : ""}</td>
                    <td className="p-3">{purchase.items.length}</td>
                    <td className="p-3">{formatCurrency(purchase.total)}</td>
                    <td className="p-3">
                      <StatusBadge tone={purchase.status === "RECEIVED" ? "success" : purchase.status === "VOID" ? "danger" : "warning"}>
                        {purchaseStatusLabels[purchase.status] ?? purchase.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </Panel>

        <aside className="grid gap-6">
          {permissions.has("purchases.create") ? (
            <Panel className="p-4">
              <h3 className="text-lg font-semibold">Nuevo proveedor</h3>
              <SupplierCreateForm />
            </Panel>
          ) : null}
        </aside>
        </div>
      </div>
    </AppShell>
  );
}
