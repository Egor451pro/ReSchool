-- Hot-path indexes for catalog, cabinet, workshop, and freelancer orders.
CREATE INDEX "Institution_district_idx" ON "Institution"("district");

CREATE INDEX "Item_status_createdAt_idx" ON "Item"("status", "createdAt");

CREATE INDEX "Item_institutionId_status_idx" ON "Item"("institutionId", "status");

CREATE INDEX "Item_status_condition_createdAt_idx" ON "Item"("status", "condition", "createdAt");

CREATE INDEX "RepairOrder_masterId_updatedAt_idx" ON "RepairOrder"("masterId", "updatedAt");
