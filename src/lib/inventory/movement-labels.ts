export const inventoryMovementLabels: Record<string, string> = {
  PURCHASE_RECEIVED: "Compra recibida",
  SALE: "Venta",
  CUSTOMER_RETURN: "Devolucion de cliente",
  SUPPLIER_RETURN: "Devolucion a proveedor",
  DAMAGED_PRODUCT: "Producto danado",
  SHRINKAGE: "Merma",
  INTERNAL_USE: "Uso interno",
  TOURNAMENT_PRIZE: "Premio de torneo",
  SEALED_PRODUCT_OPENING: "Apertura de sellado",
  OPENING_OUTPUT: "Ingreso por apertura",
  PHYSICAL_COUNT_POSITIVE_ADJUSTMENT: "Ajuste positivo por conteo",
  PHYSICAL_COUNT_NEGATIVE_ADJUSTMENT: "Ajuste negativo por conteo",
  PURCHASE_VOID: "Anulacion de compra",
  SALE_VOID: "Anulacion de venta",
  TRANSFER_OR_RECLASSIFICATION: "Transferencia o reclasificacion",
  COMPENSATION: "Compensacion",
};

export const specialInventoryMovementTypes = [
  "DAMAGED_PRODUCT",
  "SHRINKAGE",
  "INTERNAL_USE",
  "TOURNAMENT_PRIZE",
  "COMPENSATION",
] as const;

export const specialInventoryMovementLabels: Record<
  (typeof specialInventoryMovementTypes)[number],
  string
> = {
  DAMAGED_PRODUCT: "Producto danado",
  SHRINKAGE: "Merma",
  INTERNAL_USE: "Uso interno",
  TOURNAMENT_PRIZE: "Premio de torneo",
  COMPENSATION: "Compensacion",
};
