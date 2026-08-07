import { Prisma, ProductStatus, ProductType } from "@prisma/client";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { getProductStockMap } from "@/server/inventory/stock";
import { PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { CategoryCreateForm, GameCreateForm } from "./catalog-forms";
import { ProductCreateForm } from "./product-create-form";
import { ProductStatusInlineForm } from "./product-status-inline-form";

const productTypeLabels: Record<ProductType, string> = {
  SEALED: "Producto sellado",
  SINGLE: "Single",
  ACCESSORY: "Accesorio",
  MERCHANDISING: "Merchandising",
  SERVICE: "Inscripcion o servicio",
  OTHER: "Otro",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireUserWithPermissions();
  const permissions = new Set(currentUser.permissions);
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const gameId = typeof params.gameId === "string" ? params.gameId : "";
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "";
  const status = typeof params.status === "string" ? params.status : "ACTIVE";

  const productWhere: Prisma.ProductWhereInput = {};

  if (status !== "ALL") {
    productWhere.status =
      status === "INACTIVE" ? ProductStatus.INACTIVE : ProductStatus.ACTIVE;
  }

  if (gameId) {
    productWhere.gameId = gameId;
  }

  if (categoryId) {
    productWhere.categoryId = categoryId;
  }

  if (q) {
    productWhere.OR = [
      { sku: { contains: q } },
      { barcode: { contains: q } },
      { name: { contains: q } },
      { edition: { contains: q } },
    ];
  }

  const [products, games, categories] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      orderBy: { createdAt: "desc" },
      include: { game: true, category: true },
      take: 100,
    }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    prisma.productCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  const stockMap = await getProductStockMap(products.map((product) => product.id));
  const lowStockCount = products.filter((product) => {
    const stock = stockMap.get(product.id) ?? 0;
    return product.minimumStock > 0 && stock > 0 && stock <= product.minimumStock;
  }).length;
  const noStockCount = products.filter((product) => (stockMap.get(product.id) ?? 0) === 0).length;

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="Catalogo"
          title="Productos"
          description="El stock es derivado desde movimientos de inventario y cada cambio queda trazado."
          actions={<StatusBadge tone="accent">{products.length} resultados</StatusBadge>}
        />

        <div className="grid gap-6 2xl:grid-cols-[1fr_420px]">
          <Panel>
            <PanelHeader
              title="Listado de productos"
              description="Filtra por juego, categoria, estado o busqueda por SKU, codigo y nombre."
            />
            <div className="px-5 pb-4">
            <form className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_160px_auto]" action="/products">
              <input
                className="rounded border border-[var(--border)] px-3 py-2 text-sm"
                defaultValue={q}
                name="q"
                placeholder="Buscar SKU, codigo, nombre o edicion"
              />
              <select className="rounded border border-[var(--border)] px-3 py-2 text-sm" defaultValue={gameId} name="gameId">
                <option value="">Todos los juegos</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
              <select className="rounded border border-[var(--border)] px-3 py-2 text-sm" defaultValue={categoryId} name="categoryId">
                <option value="">Todas las categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select className="rounded border border-[var(--border)] px-3 py-2 text-sm" defaultValue={status} name="status">
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
                <option value="ALL">Todos</option>
              </select>
              <button className="rounded bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]" type="submit">
                Filtrar
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <StatusBadge tone="neutral">Resultados: {products.length}</StatusBadge>
              <StatusBadge tone={lowStockCount > 0 ? "warning" : "success"}>Bajo minimo: {lowStockCount}</StatusBadge>
              <StatusBadge tone={noStockCount > 0 ? "danger" : "success"}>Sin stock: {noStockCount}</StatusBadge>
            </div>
            </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="p-3">SKU</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Juego</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Precio</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Accion</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr className="border-b border-[var(--border)]" key={product.id}>
                    <td className="p-3 font-medium">
                      <Link className="underline" href={`/products/${product.id}`}>
                        {product.sku}
                      </Link>
                    </td>
                    <td className="p-3">
                      <p>{product.name}</p>
                      <p className="text-xs text-[var(--muted)]">{productTypeLabels[product.type]}</p>
                    </td>
                    <td className="p-3">{product.game?.name ?? ""}</td>
                    <td className="p-3">{product.category?.name ?? ""}</td>
                    <td className="p-3">
                      <StockBadge minimumStock={product.minimumStock} stock={stockMap.get(product.id) ?? 0} />
                    </td>
                    <td className="p-3">{formatCurrency(product.salePrice)}</td>
                    <td className="p-3">
                      <StatusBadge tone={product.status === "ACTIVE" ? "success" : "neutral"}>
                        {product.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      </StatusBadge>
                    </td>
                    <td className="p-3">
                      {permissions.has("products.deactivate") ? (
                        <ProductStatusInlineForm
                          productId={product.id}
                          currentStatus={product.status}
                        />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </Panel>

        <aside className="grid gap-6">
          {permissions.has("products.create") ? (
            <Panel className="p-4">
              <h3 className="text-lg font-semibold">Crear producto</h3>
              <ProductCreateForm games={games} categories={categories} />
            </Panel>
          ) : null}

          {permissions.has("products.create") ? (
            <Panel className="p-4">
              <h3 className="text-lg font-semibold">Catalogos</h3>
              <GameCreateForm />
              <CategoryCreateForm categories={categories} />
            </Panel>
          ) : null}

        </aside>
        </div>
      </div>
    </AppShell>
  );
}

function StockBadge({ stock, minimumStock }: { stock: number; minimumStock: number }) {
  const tone =
    stock === 0
      ? "danger"
      : minimumStock > 0 && stock <= minimumStock
        ? "warning"
        : "success";

  return <StatusBadge tone={tone}>{stock}</StatusBadge>;
}
