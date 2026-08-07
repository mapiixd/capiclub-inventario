-- CreateTable
CREATE TABLE "InventoryCount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "internalNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "voidedById" TEXT,
    "voidedAt" DATETIME,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryCountItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryCountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "theoreticalStock" INTEGER NOT NULL,
    "countedStock" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    CONSTRAINT "InventoryCountItem_inventoryCountId_fkey" FOREIGN KEY ("inventoryCountId") REFERENCES "InventoryCount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryCountItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductOpening" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "internalNumber" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "totalInputCost" INTEGER NOT NULL DEFAULT 0,
    "totalOutputCost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProductOpeningInput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productOpeningId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "lineCost" INTEGER NOT NULL,
    CONSTRAINT "ProductOpeningInput_productOpeningId_fkey" FOREIGN KEY ("productOpeningId") REFERENCES "ProductOpening" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductOpeningInput_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductOpeningOutput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productOpeningId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "lineCost" INTEGER NOT NULL,
    CONSTRAINT "ProductOpeningOutput_productOpeningId_fkey" FOREIGN KEY ("productOpeningId") REFERENCES "ProductOpening" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductOpeningOutput_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCount_internalNumber_key" ON "InventoryCount"("internalNumber");

-- CreateIndex
CREATE INDEX "InventoryCount_status_idx" ON "InventoryCount"("status");

-- CreateIndex
CREATE INDEX "InventoryCount_createdAt_idx" ON "InventoryCount"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryCountItem_inventoryCountId_idx" ON "InventoryCountItem"("inventoryCountId");

-- CreateIndex
CREATE INDEX "InventoryCountItem_productId_idx" ON "InventoryCountItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOpening_internalNumber_key" ON "ProductOpening"("internalNumber");

-- CreateIndex
CREATE INDEX "ProductOpening_createdAt_idx" ON "ProductOpening"("createdAt");

-- CreateIndex
CREATE INDEX "ProductOpeningInput_productOpeningId_idx" ON "ProductOpeningInput"("productOpeningId");

-- CreateIndex
CREATE INDEX "ProductOpeningInput_productId_idx" ON "ProductOpeningInput"("productId");

-- CreateIndex
CREATE INDEX "ProductOpeningOutput_productOpeningId_idx" ON "ProductOpeningOutput"("productOpeningId");

-- CreateIndex
CREATE INDEX "ProductOpeningOutput_productId_idx" ON "ProductOpeningOutput"("productId");
