"use client";

import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ActionMessage } from "@/components/action-message";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Panel, PanelHeader, StatusBadge } from "@/components/ui";
import {
  addProductToCart,
  calculateCartTotals,
  calculatePaidTotal,
  getPaymentDifference,
  updateCartItemQuantity,
  type CartItem,
  type PaymentDraft,
} from "@/lib/sales/cart";
import { formatCurrency } from "@/lib/format";
import { completeSaleFormAction, type SaleFormState } from "./actions";

const initialState: SaleFormState = {};
const emptyPayment: PaymentDraft = {
  paymentMethodId: "",
  amount: 0,
  reference: "",
};

type ProductOption = {
  id: string;
  sku: string;
  name: string;
  salePrice: number;
  stock: number;
};

type PaymentMethodOption = {
  id: string;
  name: string;
};

export function SaleForm({
  products,
  paymentMethods,
}: {
  products: ProductOption[];
  paymentMethods: PaymentMethodOption[];
}) {
  const [state, formAction] = useActionState(completeSaleFormAction, initialState);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<PaymentDraft[]>([{ ...emptyPayment }]);
  const [notes, setNotes] = useState("");
  const totals = useMemo(() => calculateCartTotals(items), [items]);
  const paidTotal = useMemo(() => calculatePaidTotal(payments), [payments]);
  const paymentDifference = useMemo(
    () => getPaymentDifference({ payments, total: totals.finalTotal }),
    [payments, totals.finalTotal],
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
  const canSubmit =
    items.length > 0 &&
    paymentDifference === 0 &&
    paidTotal > 0 &&
    payments.some((payment) => payment.paymentMethodId && payment.amount > 0);

  useEffect(() => {
    if (state.ok) {
      const timeoutId = window.setTimeout(() => {
        setItems([]);
        setPayments([{ ...emptyPayment }]);
        setNotes("");
        setQuery("");
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [state.ok]);

  function addProduct(product: ProductOption) {
    setItems((currentItems) => addProductToCart(currentItems, product));
  }

  function updateItem(productId: string, updates: Partial<CartItem>) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId ? { ...item, ...updates } : item,
      ),
    );
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems((currentItems) =>
      updateCartItemQuantity(currentItems, productId, quantity),
    );
  }

  function removeItem(productId: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId),
    );
  }

  function updatePayment(index: number, updates: Partial<PaymentDraft>) {
    setPayments((currentPayments) =>
      currentPayments.map((payment, paymentIndex) =>
        paymentIndex === index ? { ...payment, ...updates } : payment,
      ),
    );
  }

  function addPayment() {
    if (payments.length >= 3) {
      return;
    }

    setPayments((currentPayments) => [...currentPayments, { ...emptyPayment }]);
  }

  function removePayment(index: number) {
    setPayments((currentPayments) =>
      currentPayments.filter((_, paymentIndex) => paymentIndex !== index),
    );
  }

  function fillRemainingPayment(index: number) {
    const otherPaid = payments.reduce(
      (total, payment, paymentIndex) =>
        paymentIndex === index ? total : total + payment.amount,
      0,
    );
    updatePayment(index, { amount: Math.max(0, totals.finalTotal - otherPaid) });
  }

  return (
    <form action={formAction} className="grid gap-5">
      {items.map((item) => (
        <div key={item.productId}>
          <input name="productId" type="hidden" value={item.productId} />
          <input name="quantity" type="hidden" value={item.quantity} />
          <input name="unitPrice" type="hidden" value={item.unitPrice} />
          <input name="lineDiscount" type="hidden" value={item.lineDiscount} />
        </div>
      ))}
      {payments.map((payment, index) => (
        <div key={index}>
          <input name="paymentMethodId" type="hidden" value={payment.paymentMethodId} />
          <input name="paymentAmount" type="hidden" value={payment.amount} />
          <input name="paymentReference" type="hidden" value={payment.reference} />
        </div>
      ))}
      <textarea className="hidden" name="notes" readOnly value={notes} />

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel>
          <PanelHeader
            title="Carrito"
            description="Agrega productos, ajusta cantidades y revisa el total antes de cobrar."
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
                    Busca productos a la derecha y agregalos a la venta.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {items.map((item) => {
                  const lineTotal = Math.max(
                    0,
                    item.quantity * item.unitPrice - item.lineDiscount,
                  );

                  return (
                    <article
                      className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 xl:grid-cols-[1fr_160px_150px_130px_44px]"
                      key={item.productId}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-sm text-[var(--muted)]">
                          {item.sku} - Stock {item.stock}
                        </p>
                        <p className="mt-2 font-semibold">{formatCurrency(lineTotal)}</p>
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
                            max={item.stock}
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
                        Precio
                        <input
                          className="rounded border border-[var(--border)] px-3 py-2"
                          min={0}
                          onChange={(event) =>
                            updateItem(item.productId, {
                              unitPrice: Math.max(0, Number(event.target.value)),
                            })
                          }
                          type="number"
                          value={item.unitPrice}
                        />
                      </label>

                      <label className="grid gap-1 text-sm">
                        Descuento
                        <input
                          className="rounded border border-[var(--border)] px-3 py-2"
                          max={item.quantity * item.unitPrice}
                          min={0}
                          onChange={(event) =>
                            updateItem(item.productId, {
                              lineDiscount: Math.max(0, Number(event.target.value)),
                            })
                          }
                          type="number"
                          value={item.lineDiscount}
                        />
                      </label>

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
                <textarea
                  className="min-h-24 rounded border border-[var(--border)] px-3 py-2"
                  onChange={(event) => setNotes(event.target.value)}
                  value={notes}
                />
              </label>

              <div className="grid gap-2 text-sm">
                <TotalRow label="Bruto" value={totals.grossTotal} />
                <TotalRow label="Descuentos" value={totals.totalDiscount} />
                <TotalRow label="Total" strong value={totals.finalTotal} />
                <TotalRow label="Pagado" value={paidTotal} />
                <div className="flex items-center justify-between border-t border-[var(--border)] pt-2">
                  <span className="text-[var(--muted)]">
                    {paymentDifference < 0 ? "Pendiente" : "Vuelto teorico"}
                  </span>
                  <span
                    className={
                      paymentDifference === 0
                        ? "font-semibold text-[var(--success)]"
                        : paymentDifference < 0
                          ? "font-semibold text-[var(--danger)]"
                          : "font-semibold text-[var(--warning)]"
                    }
                  >
                    {formatCurrency(Math.abs(paymentDifference))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <div className="grid content-start gap-5">
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
              <div className="grid max-h-[560px] gap-2 overflow-y-auto pr-1">
                {filteredProducts.map((product) => {
                  const inCart = items.find((item) => item.productId === product.id);

                  return (
                    <button
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-left hover:bg-[var(--surface-muted)]"
                      key={product.id}
                      onClick={() => addProduct(product)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{product.name}</p>
                          <p className="text-sm text-[var(--muted)]">{product.sku}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(product.salePrice)}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
                        <span>Stock {product.stock}</span>
                        {inCart ? <span>En carrito: {inCart.quantity}</span> : null}
                      </div>
                    </button>
                  );
                })}
                {filteredProducts.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
                    Sin productos disponibles.
                  </p>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Pago"
              description="El total pagado debe coincidir exactamente con la venta."
            />
            <div className="grid gap-3 p-4">
              {payments.map((payment, index) => (
                <div
                  className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
                  key={index}
                >
                  <select
                    className="rounded border border-[var(--border)] px-3 py-2 text-sm"
                    onChange={(event) =>
                      updatePayment(index, { paymentMethodId: event.target.value })
                    }
                    value={payment.paymentMethodId}
                  >
                    <option value="">Seleccionar medio</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      className="rounded border border-[var(--border)] px-3 py-2 text-sm"
                      min={0}
                      onChange={(event) =>
                        updatePayment(index, {
                          amount: Math.max(0, Number(event.target.value)),
                        })
                      }
                      placeholder="Monto"
                      type="number"
                      value={payment.amount}
                    />
                    <button
                      className="rounded border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-muted)]"
                      onClick={() => fillRemainingPayment(index)}
                      type="button"
                    >
                      Pendiente
                    </button>
                  </div>
                  <input
                    className="rounded border border-[var(--border)] px-3 py-2 text-sm"
                    onChange={(event) =>
                      updatePayment(index, { reference: event.target.value })
                    }
                    placeholder="Referencia opcional"
                    value={payment.reference}
                  />
                  {payments.length > 1 ? (
                    <button
                      className="justify-self-start text-sm text-[var(--danger)] underline"
                      onClick={() => removePayment(index)}
                      type="button"
                    >
                      Quitar pago
                    </button>
                  ) : null}
                </div>
              ))}
              {payments.length < 3 ? (
                <button
                  className="rounded border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-muted)]"
                  onClick={addPayment}
                  type="button"
                >
                  Agregar pago mixto
                </button>
              ) : null}
              <ActionMessage state={state} />
              {!canSubmit ? (
                <p className="text-sm text-[var(--muted)]">
                  Agrega productos y cuadra el pago para completar la venta.
                </p>
              ) : null}
              <FormSubmitButton disabled={!canSubmit}>Completar venta</FormSubmitButton>
            </div>
          </Panel>
        </div>
      </div>
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
