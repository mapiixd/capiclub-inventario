import { AppShell } from "@/components/app-shell";
import { MetricCard, PageHeader, Panel, PanelHeader, StatusBadge } from "@/components/ui";
import { requireUserWithPermissions } from "@/lib/auth/session";
import { calculateExpectedCash } from "@/lib/cash/expected-cash";
import { prisma } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  CashMovementForm,
  CloseCashSessionForm,
  OpenCashSessionForm,
} from "./cash-forms";

const movementLabels: Record<string, string> = {
  INCOME: "Ingreso extra",
  WITHDRAWAL: "Retiro",
  EXPENSE: "Gasto",
};

function sessionStatusTone(status: string): "success" | "neutral" {
  return status === "OPEN" ? "success" : "neutral";
}

function sessionStatusLabel(status: string) {
  return status === "OPEN" ? "Abierta" : "Cerrada";
}

function getSessionExpectedCash(session: {
  openingFloat: number;
  cashMovements: Array<{ type: string; amount: number }>;
  payments: Array<{ amount: number; paymentMethod: { name: string } }>;
}) {
  return calculateExpectedCash({
    openingFloat: session.openingFloat,
    cashPayments: session.payments
      .filter((payment) => payment.paymentMethod.name === "Efectivo")
      .map((payment) => payment.amount),
    movements: session.cashMovements,
  });
}

export default async function CashPage() {
  const currentUser = await requireUserWithPermissions();
  const permissions = new Set(currentUser.permissions);
  const [cashRegisters, openSession, recentSessions] = await Promise.all([
    prisma.cashRegister.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.cashSession.findFirst({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
      include: {
        cashRegister: true,
        openedBy: { select: { name: true } },
        cashMovements: { orderBy: { createdAt: "desc" } },
        payments: {
          orderBy: { createdAt: "desc" },
          include: {
            paymentMethod: true,
            sale: { select: { id: true, visibleNumber: true } },
          },
        },
      },
    }),
    prisma.cashSession.findMany({
      orderBy: { openedAt: "desc" },
      take: 12,
      include: {
        cashRegister: true,
        openedBy: { select: { name: true } },
        closedBy: { select: { name: true } },
        cashMovements: true,
        payments: {
          include: { paymentMethod: true },
        },
      },
    }),
  ]);

  const expectedCash = openSession ? getSessionExpectedCash(openSession) : 0;
  const cashPaymentTotal = openSession
    ? openSession.payments
        .filter((payment) => payment.paymentMethod.name === "Efectivo")
        .reduce((total, payment) => total + payment.amount, 0)
    : 0;
  const movementTotal = openSession
    ? openSession.cashMovements.reduce((total, movement) => {
        if (movement.type === "INCOME") {
          return total + movement.amount;
        }

        return total - movement.amount;
      }, 0)
    : 0;

  return (
    <AppShell user={currentUser}>
      <div className="grid gap-6">
        <PageHeader
          eyebrow="Operacion diaria"
          title="Caja"
          description="Abre caja, registra gastos o retiros y cierra el turno comparando efectivo esperado contra efectivo contado."
          actions={
            <StatusBadge tone={openSession ? "success" : "neutral"}>
              {openSession ? "Caja abierta" : "Sin caja abierta"}
            </StatusBadge>
          }
        />

        {openSession ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Fondo inicial"
              value={formatCurrency(openSession.openingFloat)}
              detail={openSession.cashRegister.name}
              tone="primary"
            />
            <MetricCard
              label="Ventas en efectivo"
              value={formatCurrency(cashPaymentTotal)}
              detail={`${openSession.payments.length} pagos vinculados`}
              tone="accent"
            />
            <MetricCard
              label="Movimientos"
              value={formatCurrency(movementTotal)}
              detail={`${openSession.cashMovements.length} registros`}
              tone={movementTotal < 0 ? "warning" : "neutral"}
            />
            <MetricCard
              label="Efectivo esperado"
              value={formatCurrency(expectedCash)}
              detail={`Abierta por ${openSession.openedBy.name}`}
              tone="primary"
            />
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-6">
            {openSession ? (
              <Panel>
                <PanelHeader
                  title={`Sesion ${openSession.cashRegister.name}`}
                  description={`Abierta el ${formatDateTime(openSession.openedAt)} por ${openSession.openedBy.name}.`}
                >
                  <StatusBadge tone="success">Abierta</StatusBadge>
                </PanelHeader>
                <div className="grid gap-6 p-5 lg:grid-cols-2">
                  <div>
                    <h3 className="font-semibold">Movimientos de caja</h3>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-left">
                            <th className="p-3">Tipo</th>
                            <th className="p-3">Motivo</th>
                            <th className="p-3 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {openSession.cashMovements.map((movement) => (
                            <tr className="border-b border-[var(--border)]" key={movement.id}>
                              <td className="p-3">
                                {movementLabels[movement.type] ?? movement.type}
                              </td>
                              <td className="p-3">{movement.reason}</td>
                              <td className="p-3 text-right font-medium">
                                {formatCurrency(movement.amount)}
                              </td>
                            </tr>
                          ))}
                          {openSession.cashMovements.length === 0 ? (
                            <tr>
                              <td className="p-4 text-sm text-[var(--muted)]" colSpan={3}>
                                No hay movimientos manuales registrados.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold">Pagos en efectivo</h3>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-left">
                            <th className="p-3">Venta</th>
                            <th className="p-3">Fecha</th>
                            <th className="p-3 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {openSession.payments
                            .filter((payment) => payment.paymentMethod.name === "Efectivo")
                            .map((payment) => (
                              <tr className="border-b border-[var(--border)]" key={payment.id}>
                                <td className="p-3 font-medium">
                                  #{payment.sale.visibleNumber}
                                </td>
                                <td className="p-3">{formatDateTime(payment.createdAt)}</td>
                                <td className="p-3 text-right font-medium">
                                  {formatCurrency(payment.amount)}
                                </td>
                              </tr>
                            ))}
                          {cashPaymentTotal === 0 ? (
                            <tr>
                              <td className="p-4 text-sm text-[var(--muted)]" colSpan={3}>
                                No hay pagos en efectivo vinculados.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel>
                <PanelHeader
                  title="Abrir caja"
                  description="Debes abrir caja para aceptar pagos en efectivo."
                />
                {permissions.has("cash.open") ? (
                  <OpenCashSessionForm cashRegisters={cashRegisters} />
                ) : (
                  <p className="p-5 text-sm text-[var(--muted)]">
                    Tu usuario no tiene permiso para abrir caja.
                  </p>
                )}
              </Panel>
            )}

            <Panel>
              <PanelHeader
                title="Ultimas sesiones"
                description="Resumen de aperturas, cierres y diferencias."
              />
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="p-3">Caja</th>
                      <th className="p-3">Apertura</th>
                      <th className="p-3">Cierre</th>
                      <th className="p-3">Esperado</th>
                      <th className="p-3">Diferencia</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map((session) => {
                      const sessionExpectedCash =
                        session.expectedCash ?? getSessionExpectedCash(session);

                      return (
                        <tr className="border-b border-[var(--border)]" key={session.id}>
                          <td className="p-3 font-medium">{session.cashRegister.name}</td>
                          <td className="p-3">{formatDateTime(session.openedAt)}</td>
                          <td className="p-3">
                            {session.closedAt ? formatDateTime(session.closedAt) : ""}
                          </td>
                          <td className="p-3">{formatCurrency(sessionExpectedCash)}</td>
                          <td className="p-3">
                            {session.difference === null
                              ? ""
                              : formatCurrency(session.difference)}
                          </td>
                          <td className="p-3">
                            <StatusBadge tone={sessionStatusTone(session.status)}>
                              {sessionStatusLabel(session.status)}
                            </StatusBadge>
                          </td>
                        </tr>
                      );
                    })}
                    {recentSessions.length === 0 ? (
                      <tr>
                        <td className="p-4 text-sm text-[var(--muted)]" colSpan={6}>
                          No hay sesiones registradas.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          {openSession ? (
            <aside className="grid content-start gap-6">
              {permissions.has("cash.adjust") || permissions.has("expenses.create") ? (
                <Panel>
                  <PanelHeader
                    title="Registrar movimiento"
                    description="Usa gastos para compras operativas menores y retiros para sacar efectivo."
                  />
                  <CashMovementForm
                    cashSessionId={openSession.id}
                    canAdjust={permissions.has("cash.adjust")}
                    canCreateExpense={permissions.has("expenses.create")}
                  />
                </Panel>
              ) : null}

              {permissions.has("cash.close") ? (
                <Panel>
                  <PanelHeader
                    title="Cerrar caja"
                    description="Cuenta el efectivo fisico y registra la diferencia."
                  />
                  <CloseCashSessionForm
                    cashSessionId={openSession.id}
                    expectedCash={expectedCash}
                  />
                </Panel>
              ) : null}
            </aside>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
