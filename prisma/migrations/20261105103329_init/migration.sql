-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "institutionId" TEXT,
    "groupId" TEXT,
    CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CategorySpecialty" (
    "categoryId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,

    PRIMARY KEY ("categoryId", "specialtyId"),
    CONSTRAINT "CategorySpecialty_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CategorySpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    CONSTRAINT "StudyGroup_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudyGroup_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudyGroup_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "closeReason" TEXT,
    "quantity" INTEGER NOT NULL,
    "year" INTEGER,
    "newUnitPriceKop" INTEGER NOT NULL,
    "listedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_listedById_fkey" FOREIGN KEY ("listedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    CONSTRAINT "ItemPhoto_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepairOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "workshopInstitutionId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" DATETIME,
    "plannedMaterialsKop" INTEGER NOT NULL,
    "actualMaterialsKop" INTEGER NOT NULL DEFAULT 0,
    "transportKop" INTEGER NOT NULL DEFAULT 0,
    "plannedMinutes" INTEGER NOT NULL,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RepairOrder_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairOrder_workshopInstitutionId_fkey" FOREIGN KEY ("workshopInstitutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairOrder_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairOrder_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RepairOrder_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudyGroup" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderParticipant" (
    "orderId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    PRIMARY KEY ("orderId", "studentId"),
    CONSTRAINT "OrderParticipant_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderParticipant_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "orderId" TEXT,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusEvent_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StatusEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "matchedItemId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Request_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Request_matchedItemId_fkey" FOREIGN KEY ("matchedItemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "fromInstitutionId" TEXT NOT NULL,
    "toInstitutionId" TEXT NOT NULL,
    "transferredAt" DATETIME NOT NULL,
    "documentId" TEXT,
    CONSTRAINT "Transfer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_fromInstitutionId_fkey" FOREIGN KEY ("fromInstitutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_toInstitutionId_fkey" FOREIGN KEY ("toInstitutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "orderId" TEXT,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssumptionSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shownOnDashboard" BOOLEAN NOT NULL DEFAULT false,
    "expectedListedPerYear" INTEGER NOT NULL,
    "avgNewPriceKop" INTEGER NOT NULL,
    "avgMaterialsKop" INTEGER NOT NULL,
    "avgDisposalKop" INTEGER NOT NULL,
    "defaultTransportKop" INTEGER NOT NULL,
    "practiceConsumableKop" INTEGER NOT NULL,
    "substitutionMilli" INTEGER NOT NULL,
    "completionMilli" INTEGER NOT NULL,
    "hostingKopAnnual" INTEGER NOT NULL,
    "supportKopAnnual" INTEGER NOT NULL,
    "illustrativeLaborKopHour" INTEGER NOT NULL,
    "basisNote" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DisposalRate" (
    "assumptionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "perUnitKop" INTEGER NOT NULL,

    PRIMARY KEY ("assumptionId", "categoryId"),
    CONSTRAINT "DisposalRate_assumptionId_fkey" FOREIGN KEY ("assumptionId") REFERENCES "AssumptionSet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DisposalRate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EconomySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "assumptionId" TEXT NOT NULL,
    "newPriceKop" INTEGER NOT NULL,
    "materialsKop" INTEGER NOT NULL,
    "transportKop" INTEGER NOT NULL,
    "procurementSavingKop" INTEGER NOT NULL,
    "avoidedDisposalKop" INTEGER NOT NULL,
    "propertyBudgetKop" INTEGER NOT NULL,
    "practiceSavingKop" INTEGER NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EconomySnapshot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EconomySnapshot_assumptionId_fkey" FOREIGN KEY ("assumptionId") REFERENCES "AssumptionSet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortfolioEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL,
    "masterComment" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PortfolioEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_slug_key" ON "Specialty"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_name_key" ON "Specialty"("name");

-- CreateIndex
CREATE INDEX "Item_status_idx" ON "Item"("status");

-- CreateIndex
CREATE INDEX "Item_institutionId_idx" ON "Item"("institutionId");

-- CreateIndex
CREATE INDEX "Item_categoryId_idx" ON "Item"("categoryId");

-- CreateIndex
CREATE INDEX "RepairOrder_workshopInstitutionId_status_idx" ON "RepairOrder"("workshopInstitutionId", "status");

-- CreateIndex
CREATE INDEX "RepairOrder_itemId_idx" ON "RepairOrder"("itemId");

-- CreateIndex
CREATE INDEX "StatusEvent_itemId_createdAt_idx" ON "StatusEvent"("itemId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_itemId_key" ON "Transfer"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_number_key" ON "Document"("number");

-- CreateIndex
CREATE UNIQUE INDEX "AssumptionSet_kind_key" ON "AssumptionSet"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "EconomySnapshot_orderId_key" ON "EconomySnapshot"("orderId");

-- CreateIndex
CREATE INDEX "PortfolioEntry_studentId_idx" ON "PortfolioEntry"("studentId");
