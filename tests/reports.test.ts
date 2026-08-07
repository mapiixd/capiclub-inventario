import { describe, expect, it } from "vitest";
import { escapeCsvValue, rowsToCsv } from "@/lib/reports/csv";
import {
  calculateInventoryValuation,
  calculateSalesReportSummary,
  getTopSellingProducts,
  isReportableSaleStatus,
} from "@/lib/reports/metrics";

describe("report metrics", () => {
  it("excludes void and fully returned sales from sales totals", () => {
    expect(
      calculateSalesReportSummary([
        { status: "COMPLETED", finalTotal: 10000, estimatedMarginTotal: 3000 },
        {
          status: "PARTIALLY_RETURNED",
          finalTotal: 5000,
          estimatedMarginTotal: 1000,
        },
        { status: "VOID", finalTotal: 8000, estimatedMarginTotal: 2000 },
        { status: "RETURNED", finalTotal: 7000, estimatedMarginTotal: 1500 },
      ]),
    ).toEqual({
      saleCount: 2,
      salesTotal: 15000,
      marginTotal: 4000,
      averageTicket: 7500,
    });
  });

  it("identifies reportable sale statuses", () => {
    expect(isReportableSaleStatus("COMPLETED")).toBe(true);
    expect(isReportableSaleStatus("PARTIALLY_RETURNED")).toBe(true);
    expect(isReportableSaleStatus("VOID")).toBe(false);
  });

  it("ranks top selling products by quantity", () => {
    expect(
      getTopSellingProducts([
        {
          productId: "a",
          sku: "A",
          productName: "Alpha",
          quantity: 1,
          finalUnitPrice: 1000,
        },
        {
          productId: "b",
          sku: "B",
          productName: "Beta",
          quantity: 3,
          finalUnitPrice: 500,
        },
        {
          productId: "a",
          sku: "A",
          productName: "Alpha",
          quantity: 2,
          finalUnitPrice: 1000,
        },
      ]),
    ).toEqual([
      { productId: "a", sku: "A", productName: "Alpha", quantity: 3, total: 3000 },
      { productId: "b", sku: "B", productName: "Beta", quantity: 3, total: 1500 },
    ]);
  });

  it("calculates inventory valuation", () => {
    expect(
      calculateInventoryValuation([
        { stock: 2, averageCost: 1000, salePrice: 1500 },
        { stock: 3, averageCost: 500, salePrice: 900 },
      ]),
    ).toEqual({ costValue: 3500, saleValue: 5700 });
  });
});

describe("csv reports", () => {
  it("escapes commas, quotes and line breaks", () => {
    expect(escapeCsvValue('Nombre, "especial"\nLinea')).toBe(
      '"Nombre, ""especial""\nLinea"',
    );
  });

  it("serializes rows with headers", () => {
    expect(
      rowsToCsv(
        ["sku", "nombre"],
        [
          ["A-1", "Producto"],
          ["B-2", "Producto, con coma"],
        ],
      ),
    ).toBe('sku,nombre\r\nA-1,Producto\r\nB-2,"Producto, con coma"');
  });
});
