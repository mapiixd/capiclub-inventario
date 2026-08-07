import { notFound } from "next/navigation";
import { ProductType } from "@prisma/client";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getProductStock } from "@/server/inventory/stock";
import { ProductEditForm, ProductStatusForm } from "./product-detail-forms";

const productTypeLabels: Record<ProductType, string> = {
  SEALED: "Producto sellado",
  SINGLE: "Single",
  ACCESSORY: "Accesorio",
  MERCHANDISING: "Merchandising",
  SERVICE: "Inscripcion o servicio",
  OTHER: "Otro",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const currentUser = await requireUserWithPermissions();
  const permissions = new Set(currentUser.permissions);
  const { productId } = await params;

  const [product, games, categories, movements] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: { game: true, category: true, createdBy: { select: { name: true } } },
    }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.inventoryMovement.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { name: true } } },
    }),
  ]);

  if (!product) {
    notFound();
  }

  const stock = await getProductStock(product.id);
  const canEdit = permissions.has("products.update");
  const canChangeStatus = permissions.has("products.deactivate");
  const canViewCosts = permissions.has("products.updateCost") || permissions.has("reports.view");

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-4">
            <Link className="text-sm text-[var(--muted)] underline" href="/products">
              Volver a productos
            </Link>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--muted)]">SKU inmutable: {product.sku}</p>
                <h2 className="text-2xl font-semibold">{product.name}</h2>
                <p className="text-sm text-[var(--muted)]">
                  {productTypeLabels[product.type]} · {product.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--muted)]">Stock actual</p>
                <p className="text-3xl font-semibold">{stock}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-3">
            <Info label="Juego" value={product.game?.name ?? "Sin juego"} />
            <Info label="Categoria" value={product.category?.name ?? "Sin categoria"} />
            <Info label="Precio venta" value={formatCurrency(product.salePrice)} />
            {canViewCosts ? <Info label="Costo promedio" value={formatCurrency(product.averageCost)} /> : null}
            {canViewCosts ? <Info label="Ultimo costo" value={formatCurrency(product.lastPurchaseCost)} /> : null}
            <Info label="Stock minimo" value={String(product.minimumStock)} />
            <Info label="Creado por" value={product.createdBy.name} />
            <Info label="Creado" value={formatDateTime(product.createdAt)} />
          </div>

          <div className="border-t border-[var(--border)] p-4">
            <h3 className="text-lg font-semibold">Historial de movimientos</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left">
                    <th className="p-3">Fecha</th>
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
                      <td className="p-3">{movement.type}</td>
                      <td className="p-3">{movement.quantity}</td>
                      <td className="p-3">{movement.previousStock}</td>
                      <td className="p-3">{movement.resultingStock}</td>
                      <td className="p-3">{movement.user.name}</td>
                      <td className="p-3">{movement.reason}</td>
                    </tr>
                  ))}
                  {movements.length === 0 ? (
                    <tr>
                      <td className="p-3 text-[var(--muted)]" colSpan={7}>
                        Sin movimientos registrados.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="grid gap-6">
          {canEdit ? (
            <section className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-lg font-semibold">Editar producto</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">El SKU y el stock no se editan desde aqui.</p>
              <ProductEditForm product={product} games={games} categories={categories} />
            </section>
          ) : null}

          {canChangeStatus ? (
            <section className="rounded border border-[var(--border)] bg-[var(--surface)] p-4">
              <h3 className="text-lg font-semibold">Estado comercial</h3>
              <ProductStatusForm productId={product.id} currentStatus={product.status} />
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
