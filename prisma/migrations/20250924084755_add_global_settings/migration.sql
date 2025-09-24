-- AlterTable
ALTER TABLE "bills" ADD COLUMN "aggregationType" TEXT DEFAULT 'SINGLE';

-- CreateTable
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bill_details" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT NOT NULL,
    "meterReadingId" TEXT NOT NULL,
    "meterType" TEXT NOT NULL,
    "meterName" TEXT,
    "usage" DECIMAL NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "amount" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL,
    "previousReading" DECIMAL,
    "currentReading" DECIMAL NOT NULL,
    "readingDate" DATETIME NOT NULL,
    "priceSource" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bill_details_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bill_details_meterReadingId_fkey" FOREIGN KEY ("meterReadingId") REFERENCES "meter_readings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "global_settings_key_key" ON "global_settings"("key");

-- CreateIndex
CREATE INDEX "bill_details_billId_idx" ON "bill_details"("billId");

-- CreateIndex
CREATE INDEX "bill_details_meterReadingId_idx" ON "bill_details"("meterReadingId");

-- CreateIndex
CREATE INDEX "bill_details_meterType_idx" ON "bill_details"("meterType");

-- CreateIndex
CREATE INDEX "bills_aggregationType_idx" ON "bills"("aggregationType");
