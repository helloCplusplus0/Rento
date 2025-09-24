-- CreateIndex
CREATE INDEX "bills_type_status_createdAt_idx" ON "bills"("type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "bills_dueDate_status_amount_idx" ON "bills"("dueDate", "status", "amount");

-- CreateIndex
CREATE INDEX "bills_contractId_dueDate_idx" ON "bills"("contractId", "dueDate");
