-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('SCHOOL', 'GYMNASIUM', 'LYCEUM', 'COLLEGE', 'VOCATIONAL', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DONOR_STAFF', 'FREELANCER', 'DISTRICT_ANALYST', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('WORKING', 'REPAIRABLE', 'SCRAP');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('LISTED', 'REQUESTED', 'IN_REPAIR', 'READY', 'DELIVERED', 'CLOSED', 'DISPOSAL_PENDING', 'DISPOSED');

-- CreateEnum
CREATE TYPE "CloseReason" AS ENUM ('COMPLETED', 'WITHDRAWN', 'UNREPAIRABLE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'QUALITY_CHECK', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'MATCHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('TRANSFER_ACT', 'RETURN_ACT', 'WRITE_OFF_DRAFT', 'PAYOUT_ACT');

-- CreateEnum
CREATE TYPE "ScenarioKind" AS ENUM ('CONSERVATIVE', 'BASE', 'OPTIMISTIC');

-- CreateEnum
CREATE TYPE "WalletTxnKind" AS ENUM ('PAYOUT', 'BONUS', 'ADJUSTMENT', 'DISPOSAL_FEE');

-- CreateEnum
CREATE TYPE "DisposalMode" AS ENUM ('SELF', 'FREELANCER');

-- CreateEnum
CREATE TYPE "DisposalJobStatus" AS ENUM ('PENDING', 'DELIVERED', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BYN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "institutionId" TEXT,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "consentAt" TIMESTAMP(3),
    "consentVersion" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorySpecialty" (
    "categoryId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,

    CONSTRAINT "CategorySpecialty_pkey" PRIMARY KEY ("categoryId","specialtyId")
);

-- CreateTable
CREATE TABLE "FreelancerSkill" (
    "userId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,

    CONSTRAINT "FreelancerSkill_pkey" PRIMARY KEY ("userId","specialtyId")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "condition" "ItemCondition" NOT NULL,
    "status" "ItemStatus" NOT NULL,
    "closeReason" "CloseReason",
    "quantity" INTEGER NOT NULL,
    "year" INTEGER,
    "newUnitPriceKop" INTEGER NOT NULL,
    "repairBudgetKop" INTEGER NOT NULL,
    "listedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPhoto" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,

    CONSTRAINT "ItemPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairOrder" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "plannedMaterialsKop" INTEGER NOT NULL,
    "actualMaterialsKop" INTEGER NOT NULL DEFAULT 0,
    "transportKop" INTEGER NOT NULL DEFAULT 0,
    "plannedMinutes" INTEGER NOT NULL,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "agreedFeeKop" INTEGER NOT NULL DEFAULT 0,
    "schoolAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderMessage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "orderId" TEXT,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "matchedItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fromInstitutionId" TEXT NOT NULL,
    "toInstitutionId" TEXT NOT NULL,
    "transferredAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "number" TEXT NOT NULL,
    "orderId" TEXT,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balanceKop" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "kind" "WalletTxnKind" NOT NULL,
    "amountKop" INTEGER NOT NULL,
    "orderId" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssumptionSet" (
    "id" TEXT NOT NULL,
    "kind" "ScenarioKind" NOT NULL,
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
    "slesarAnnualSalaryKop" INTEGER NOT NULL DEFAULT 0,
    "zavhozBonusShareMilli" INTEGER NOT NULL DEFAULT 0,
    "freelancerAvgFeeKop" INTEGER NOT NULL DEFAULT 0,
    "basisNote" TEXT NOT NULL,

    CONSTRAINT "AssumptionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisposalRate" (
    "assumptionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "perUnitKop" INTEGER NOT NULL,

    CONSTRAINT "DisposalRate_pkey" PRIMARY KEY ("assumptionId","categoryId")
);

-- CreateTable
CREATE TABLE "EconomySnapshot" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assumptionId" TEXT NOT NULL,
    "newPriceKop" INTEGER NOT NULL,
    "materialsKop" INTEGER NOT NULL,
    "transportKop" INTEGER NOT NULL,
    "freelancerFeeKop" INTEGER NOT NULL DEFAULT 0,
    "procurementSavingKop" INTEGER NOT NULL,
    "avoidedDisposalKop" INTEGER NOT NULL,
    "propertyBudgetKop" INTEGER NOT NULL,
    "practiceSavingKop" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EconomySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecyclingPoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT NOT NULL DEFAULT '',
    "hours" TEXT NOT NULL DEFAULT '',
    "acceptsCategories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecyclingPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisposalJob" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "pointId" TEXT,
    "mode" "DisposalMode" NOT NULL,
    "status" "DisposalJobStatus" NOT NULL DEFAULT 'PENDING',
    "feeKop" INTEGER NOT NULL DEFAULT 0,
    "freelancerId" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "deliveredAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisposalJob_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "ItemPhoto_itemId_idx" ON "ItemPhoto"("itemId");

-- CreateIndex
CREATE INDEX "RepairOrder_masterId_status_idx" ON "RepairOrder"("masterId", "status");

-- CreateIndex
CREATE INDEX "RepairOrder_itemId_idx" ON "RepairOrder"("itemId");

-- CreateIndex
CREATE INDEX "RepairOrder_status_idx" ON "RepairOrder"("status");

-- CreateIndex
CREATE INDEX "OrderMessage_orderId_createdAt_idx" ON "OrderMessage"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "StatusEvent_itemId_createdAt_idx" ON "StatusEvent"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "Request_institutionId_idx" ON "Request"("institutionId");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_itemId_key" ON "Transfer"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_number_key" ON "Document"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssumptionSet_kind_key" ON "AssumptionSet"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "EconomySnapshot_orderId_key" ON "EconomySnapshot"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DisposalJob_itemId_key" ON "DisposalJob"("itemId");

-- CreateIndex
CREATE INDEX "DisposalJob_status_idx" ON "DisposalJob"("status");

-- CreateIndex
CREATE INDEX "DisposalJob_freelancerId_idx" ON "DisposalJob"("freelancerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorySpecialty" ADD CONSTRAINT "CategorySpecialty_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorySpecialty" ADD CONSTRAINT "CategorySpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelancerSkill" ADD CONSTRAINT "FreelancerSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreelancerSkill" ADD CONSTRAINT "FreelancerSkill_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_listedById_fkey" FOREIGN KEY ("listedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPhoto" ADD CONSTRAINT "ItemPhoto_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairOrder" ADD CONSTRAINT "RepairOrder_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairOrder" ADD CONSTRAINT "RepairOrder_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_matchedItemId_fkey" FOREIGN KEY ("matchedItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromInstitutionId_fkey" FOREIGN KEY ("fromInstitutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toInstitutionId_fkey" FOREIGN KEY ("toInstitutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisposalRate" ADD CONSTRAINT "DisposalRate_assumptionId_fkey" FOREIGN KEY ("assumptionId") REFERENCES "AssumptionSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisposalRate" ADD CONSTRAINT "DisposalRate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomySnapshot" ADD CONSTRAINT "EconomySnapshot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomySnapshot" ADD CONSTRAINT "EconomySnapshot_assumptionId_fkey" FOREIGN KEY ("assumptionId") REFERENCES "AssumptionSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisposalJob" ADD CONSTRAINT "DisposalJob_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisposalJob" ADD CONSTRAINT "DisposalJob_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "RecyclingPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisposalJob" ADD CONSTRAINT "DisposalJob_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
