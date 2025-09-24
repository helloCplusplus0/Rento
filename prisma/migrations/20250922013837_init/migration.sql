-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "totalRooms" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomNumber" TEXT NOT NULL,
    "floorNumber" INTEGER NOT NULL,
    "buildingId" TEXT NOT NULL,
    "roomType" TEXT NOT NULL DEFAULT 'SHARED',
    "area" REAL,
    "rent" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VACANT',
    "currentRenter" TEXT,
    "overdueDays" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rooms_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "renters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gender" TEXT,
    "phone" TEXT NOT NULL,
    "idCard" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "occupation" TEXT,
    "company" TEXT,
    "moveInDate" DATETIME,
    "tenantCount" INTEGER,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractNumber" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isExtended" BOOLEAN NOT NULL DEFAULT false,
    "monthlyRent" DECIMAL NOT NULL,
    "totalRent" DECIMAL NOT NULL,
    "deposit" DECIMAL NOT NULL,
    "keyDeposit" DECIMAL,
    "cleaningFee" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "businessStatus" TEXT,
    "paymentMethod" TEXT,
    "paymentTiming" TEXT,
    "signedBy" TEXT,
    "signedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contracts_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contracts_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "renters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bills" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bills_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "rooms_buildingId_status_idx" ON "rooms"("buildingId", "status");

-- CreateIndex
CREATE INDEX "rooms_roomNumber_idx" ON "rooms"("roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_buildingId_roomNumber_key" ON "rooms"("buildingId", "roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "renters_phone_key" ON "renters"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "renters_idCard_key" ON "renters"("idCard");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_status_endDate_idx" ON "contracts"("status", "endDate");

-- CreateIndex
CREATE INDEX "contracts_roomId_status_idx" ON "contracts"("roomId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bills_billNumber_key" ON "bills"("billNumber");

-- CreateIndex
CREATE INDEX "bills_status_dueDate_idx" ON "bills"("status", "dueDate");

-- CreateIndex
CREATE INDEX "bills_contractId_status_idx" ON "bills"("contractId", "status");
