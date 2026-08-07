export const reportableSaleStatuses = ["COMPLETED", "PARTIALLY_RETURNED"] as const;

export type ReportSale = {
  status: string;
  finalTotal: number;
  estimatedMarginTotal: number;
};

export type ReportSaleItem = {
  quantity: number;
  finalUnitPrice: number;
  productId: string;
  productName: string;
  sku: string;
};

export type InventoryValuationItem = {
  stock: number;
  averageCost: number;
  salePrice: number;
};

export function isReportableSaleStatus(status: string) {
  return reportableSaleStatuses.includes(
    status as (typeof reportableSaleStatuses)[number],
  );
}

export function calculateSalesReportSummary(sales: ReportSale[]) {
  const reportableSales = sales.filter((sale) => isReportableSaleStatus(sale.status));
  const salesTotal = reportableSales.reduce((total, sale) => total + sale.finalTotal, 0);
  const marginTotal = reportableSales.reduce(
    (total, sale) => total + sale.estimatedMarginTotal,
    0,
  );
  const averageTicket =
    reportableSales.length === 0 ? 0 : Math.round(salesTotal / reportableSales.length);

  return {
    saleCount: reportableSales.length,
    salesTotal,
    marginTotal,
    averageTicket,
  };
}

export function getTopSellingProducts(items: ReportSaleItem[], limit = 10) {
  const rows = new Map<
    string,
    {
      productId: string;
      sku: string;
      productName: string;
      quantity: number;
      total: number;
    }
  >();

  for (const item of items) {
    const current = rows.get(item.productId) ?? {
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      quantity: 0,
      total: 0,
    };
    current.quantity += item.quantity;
    current.total += item.quantity * item.finalUnitPrice;
    rows.set(item.productId, current);
  }

  return [...rows.values()]
    .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
    .slice(0, limit);
}

export function calculateInventoryValuation(items: InventoryValuationItem[]) {
  return items.reduce(
    (summary, item) => ({
      costValue: summary.costValue + item.stock * item.averageCost,
      saleValue: summary.saleValue + item.stock * item.salePrice,
    }),
    { costValue: 0, saleValue: 0 },
  );
}
