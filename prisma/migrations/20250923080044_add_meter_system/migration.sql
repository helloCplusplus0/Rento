-- CreateTable
CREATE TABLE "meters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meterNumber" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "meterType" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "unitPrice" DECIMAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "installDate" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "meters_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meter_readings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meterId" TEXT NOT NULL,
    "contractId" TEXT,
    "previousReading" DECIMAL,
    "currentReading" DECIMAL NOT NULL,
    "usage" DECIMAL NOT NULL,
    "readingDate" DATETIME NOT NULL,
    "period" TEXT,
    "unitPrice" DECIMAL NOT NULL,
    "amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isBilled" BOOLEAN NOT NULL DEFAULT false,
    "operator" TEXT,
    "remarks" TEXT,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "abnormalReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "meter_readings_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "meters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "meter_readings_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RENT',
    "amount" DECIMAL NOT NULL,
    "receivedAmount" DECIMAL NOT NULL DEFAULT 0,
    "pendingAmount" DECIMAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "period" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "contractId" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "operator" TEXT,
    "remarks" TEXT,
    "metadata" TEXT,
    "meterReadingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bills_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bills_meterReadingId_fkey" FOREIGN KEY ("meterReadingId") REFERENCES "meter_readings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_bills" ("amount", "billNumber", "contractId", "createdAt", "dueDate", "id", "metadata", "operator", "paidDate", "paymentMethod", "pendingAmount", "period", "receivedAmount", "remarks", "status", "type", "updatedAt") SELECT "amount", "billNumber", "contractId", "createdAt", "dueDate", "id", "metadata", "operator", "paidDate", "paymentMethod", "pendingAmount", "period", "receivedAmount", "remarks", "status", "type", "updatedAt" FROM "bills";
DROP TABLE "bills";
ALTER TABLE "new_bills" RENAME TO "bills";
CREATE UNIQUE INDEX "bills_billNumber_key" ON "bills"("billNumber");
CREATE INDEX "bills_status_dueDate_idx" ON "bills"("status", "dueDate");
CREATE INDEX "bills_contractId_status_idx" ON "bills"("contractId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "meters_meterNumber_key" ON "meters"("meterNumber");

-- CreateIndex
CREATE INDEX "meters_roomId_meterType_isActive_idx" ON "meters"("roomId", "meterType", "isActive");

-- CreateIndex
CREATE INDEX "meters_meterType_isActive_idx" ON "meters"("meterType", "isActive");

-- CreateIndex
CREATE INDEX "meter_readings_meterId_readingDate_idx" ON "meter_readings"("meterId", "readingDate");

-- CreateIndex
CREATE INDEX "meter_readings_contractId_readingDate_idx" ON "meter_readings"("contractId", "readingDate");

-- CreateIndex
CREATE INDEX "meter_readings_status_readingDate_idx" ON "meter_readings"("status", "readingDate");
