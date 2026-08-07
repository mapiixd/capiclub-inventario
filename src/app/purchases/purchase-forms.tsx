"use client";

import { Minus, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Panel, PanelHeader, StatusBadge } from "@/components/ui";
import {
  addProductToPurchaseCart,
  calculatePurchaseCartTotals,
  updatePurchaseCartItemQuantity,
  updatePurchaseCartItemUnitCost,
  type PurchaseCartItem,
} from "@/lib/purchases/cart";
import { formatCurrency } from "@/lib/format";
import {
  createPurchaseFormAction,
  createSupplierFormAction,
  type PurchaseFormState,
  type SupplierFormState,
} from "./actions";

const initialSupplierState: SupplierFormState = {};
const initialPurchaseState: PurchaseFormState = {};

type SupplierOption = {
  id: string;
  name: string;
};

type ProductOption = {
  id: string;
  sku: string;
  name: string;
};

export function PurchaseCreateForm({
  suppliers,
  products,
}: {
  suppliers: SupplierOption[];
  products: ProductOption[];
}) {
  const [state, formAction] = useActionState(
    createPurchaseFormAction,
    initialPurchaseState,
  );
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PurchaseCartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [additionalCosts, setAdditionalCosts] = useState(0);
  const totals = useMemo(
    () =>
      calculatePurchaseCartTotals({
        items,
        discount,
        additionalCosts,
      }),
    [additionalCosts, discount, items],
  );
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return products.slice(0, 40);
    }

    return products
      .filter((product) =>
        `${product.sku} ${product.name}`.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 40);
  }, [products, query]);
  const canSubmit = items.length > 0;

  useEffect(() => {
    if (state.ok) {
      const timeoutId = window.setTimeout(() => {
        setItems([]);
        setQuery("");
        setDiscount(0);
        setAdditionalCosts(0);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [state.ok]);

  function addProduct(product: ProductOption) {
    setItems((currentItems) => addProductToPurchaseCart(currentItems, product));
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems((currentItems) =>
      updatePurchaseCartItemQuantity(currentItems, productId, quantity),
    );
  }

  function updateUnitCost(productId: string, unitCost: number) {
    setItems((currentItems) =>
      updatePurchaseCartItemUnitCost(currentItems, productId, unitCost),
    );
  }

  function removeItem(productId: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId),
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      {items.map((item) => (
        <div key={item.productId}>
          <input name="productId" type="hidden" value={item.productId} />
          <input name="quantity" type="hidden" value={item.quantity} />
          <input name="unitCost" type="hidden" value={item.unitCost} />
        </div>
      ))}
      <input name="discount" type="hidden" value={discount} />
      <input name="additionalCosts" type="hidden" value={additionalCosts} />

      <Panel>
        <PanelHeader
          title="Documento de compra"
          description="La compra se crea como borrador y no afecta stock hasta recibirla."
        />
        <div className="grid gap-3 p-4 lg:grid-cols-3">
          <label className="grid gap-1 text-sm">
            Proveedor
            <select className="rounded border border-[var(--border)] px-3 py-2" name="supplierId" required>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <Field label="Documento proveedor" name="supplierDocumentNumber" required={false} />
          <Field label="Fecha documento" name="documentDate" type="date" required={false} />
        </div>
      </Panel>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel>
          <PanelHeader
            title="Carrito de compra"
            description="Agrega todos los productos comprados y define su costo unitario."
          >
            <StatusBadge tone={items.length > 0 ? "success" : "neutral"}>
              {items.length} lineas
            </StatusBadge>
          </PanelHeader>
          <div className="grid gap-4 p-4">
            {items.length === 0 ? (
              <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center">
                <div>
                  <p className="font-medium">Carrito vacio</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Busca productos a la derecha y agregalos al borrador.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => {
                  const lineSubtotal = item.quantity * item.unitCost;

                  return (
                    <article
                      className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 xl:grid-cols-[minmax(220px,1fr)_150px_170px_minmax(170px,auto)_44px]"
                      key={item.productId}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-sm text-[var(--muted)]">{item.sku}</p>
                        <p className="mt-2 font-semibold">{formatCurrency(lineSubtotal)}</p>
                      </div>

                      <div className="grid gap-1 text-sm">
                        Cantidad
                        <div className="flex h-10 overflow-hidden rounded border border-[var(--border)]">
                          <button
                            aria-label="Restar unidad"
                            className="grid w-10 place-items-center border-r border-[var(--border)] hover:bg-[var(--surface-muted)]"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            type="button"
                          >
                            <Minus size={15} />
                          </button>
                          <input
                            className="w-full border-0 px-2 text-center"
                            min={1}
                            onChange={(event) =>
                              updateQuantity(item.productId, Number(event.target.value))
                            }
                            type="number"
                            value={item.quantity}
                          />
                          <button
                            aria-label="Sumar unidad"
                            className="grid w-10 place-items-center border-l border-[var(--border)] hover:bg-[var(--surface-muted)]"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            type="button"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>

                      <label className="grid gap-1 text-sm">
                        Costo unitario
                        <input
                          className="rounded border border-[var(--border)] px-3 py-2"
                          min={0}
                          onChange={(event) =>
                            updateUnitCost(item.productId, Number(event.target.value))
                          }
                          type="number"
                          value={item.unitCost}
                        />
                      </label>

                      <div className="grid min-w-0 content-end justify-items-end gap-1 text-right text-sm">
                        <span className="text-[var(--muted)]">Subtotal</span>
                        <span className="max-w-full whitespace-nowrap font-semibold">
                          {formatCurrency(lineSubtotal)}
                        </span>
                      </div>

                      <button
                        aria-label="Quitar producto"
                        className="grid h-10 w-10 place-items-center self-end rounded border border-[var(--border)] text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]"
                        onClick={() => removeItem(item.productId)}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 lg:grid-cols-[1fr_320px]">
              <label className="grid gap-1 text-sm">
                Observaciones
                <textarea className="min-h-24 rounded border border-[var(--border)] px-3 py-2" name="notes" />
              </label>

              <div className="grid gap-3">
                <label className="grid gap-1 text-sm">
                  Descuento
                  <input
                    className="rounded border border-[var(--border)] px-3 py-2"
                    min={0}
                    onChange={(event) => setDiscount(Math.max(0, Number(event.target.value)))}
                    type="number"
                    value={discount}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  Costos adicionales
                  <input
                    className="rounded border border-[var(--border)] px-3 py-2"
                    min={0}
                    onChange={(event) =>
                      setAdditionalCosts(Math.max(0, Number(event.target.value)))
                    }
                    type="number"
                    value={additionalCosts}
                  />
                </label>
                <div className="grid gap-2 border-t border-[var(--border)] pt-3 text-sm">
                  <TotalRow label="Subtotal" value={totals.subtotal} />
                  <TotalRow label="Descuento" value={discount} />
                  <TotalRow label="Costos adicionales" value={additionalCosts} />
                  <TotalRow label="Total" strong value={totals.total} />
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Productos" description="Busca por SKU o nombre." />
          <div className="grid gap-3 p-4">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                size={17}
              />
              <input
                className="w-full rounded border border-[var(--border)] py-2 pl-10 pr-3"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar producto"
                value={query}
              />
            </label>
            <div className="grid max-h-[620px] gap-2 overflow-y-auto pr-1">
              {filteredProducts.map((product) => {
                const inCart = items.find((item) => item.productId === product.id);

                return (
                  <button
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-left hover:bg-[var(--surface-muted)]"
                    key={product.id}
                    onClick={() => addProduct(product)}
                    type="button"
                  >
                    <p className="truncate font-medium">{product.name}</p>
                    <div className="mt-2 flex items-center justify-between text-sm text-[var(--muted)]">
                      <span>{product.sku}</span>
                      {inCart ? <span>En carrito: {inCart.quantity}</span> : null}
                    </div>
                  </button>
                );
              })}
              {filteredProducts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                  Sin productos encontrados.
                </p>
              ) : null}
            </div>
          </div>
        </Panel>
      </div>

      <ActionMessage state={state} />
      {state.ok && state.purchaseId ? (
        <Link className="rounded border border-[var(--border)] px-3 py-2 text-center text-sm underline" href={`/purchases/${state.purchaseId}`}>
          Ver compra creada
        </Link>
      ) : null}
      {!canSubmit ? (
        <p className="text-sm text-[var(--muted)]">
          Agrega al menos un producto para crear el borrador.
        </p>
      ) : null}
      <FormSubmitButton disabled={!canSubmit}>Crear borrador</FormSubmitButton>
    </form>
  );
}

export function SupplierCreateForm() {
  const [state, formAction] = useActionState(
    createSupplierFormAction,
    initialSupplierState,
  );

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <Field label="Nombre" name="name" />
      <Field label="RUT/documento" name="documentNumber" required={false} />
      <Field label="Email" name="email" type="email" required={false} />
      <Field label="Telefono" name="phone" required={false} />
      <ActionMessage state={state} />
      <FormSubmitButton>Crear proveedor</FormSubmitButton>
    </form>
  );
}

function TotalRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={strong ? "text-xl font-semibold" : "font-medium"}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = true,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input
        className="rounded border border-[var(--border)] px-3 py-2"
        defaultValue={defaultValue}
        min={type === "number" ? 0 : undefined}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}
