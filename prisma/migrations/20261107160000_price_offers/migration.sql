-- CreateEnum
CREATE TYPE "PriceOfferSide" AS ENUM ('SCHOOL', 'FREELANCER');

-- CreateEnum
CREATE TYPE "PriceOfferStatus" AS ENUM ('OPEN', 'SUPERSEDED', 'ACCEPTED');

-- AlterTable
ALTER TABLE "RepairOrder" ADD COLUMN "openOfferKop" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RepairOrder" ADD COLUMN "openOfferSide" "PriceOfferSide";

-- CreateTable
CREATE TABLE "PriceOffer" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "amountKop" INTEGER NOT NULL,
    "side" "PriceOfferSide" NOT NULL,
    "status" "PriceOfferStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceOffer_orderId_createdAt_idx" ON "PriceOffer"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "PriceOffer_orderId_status_idx" ON "PriceOffer"("orderId", "status");

-- AddForeignKey
ALTER TABLE "PriceOffer" ADD CONSTRAINT "PriceOffer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RepairOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceOffer" ADD CONSTRAINT "PriceOffer_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill open offer + history for existing ASSIGNED orders awaiting school accept
UPDATE "RepairOrder"
SET
  "openOfferKop" = "agreedFeeKop",
  "openOfferSide" = 'FREELANCER'
WHERE "status" = 'ASSIGNED'
  AND "schoolAcceptedAt" IS NULL
  AND "agreedFeeKop" > 0;

INSERT INTO "PriceOffer" ("id", "orderId", "actorId", "amountKop", "side", "status", "createdAt")
SELECT
  md5(random()::text || clock_timestamp()::text || "id"::text),
  "id",
  "masterId",
  "agreedFeeKop",
  'FREELANCER',
  'OPEN',
  "createdAt"
FROM "RepairOrder"
WHERE "status" = 'ASSIGNED'
  AND "schoolAcceptedAt" IS NULL
  AND "agreedFeeKop" > 0;

-- Accepted orders: keep history snapshot as ACCEPTED from freelancer claim
INSERT INTO "PriceOffer" ("id", "orderId", "actorId", "amountKop", "side", "status", "createdAt")
SELECT
  md5(random()::text || clock_timestamp()::text || "id"::text || 'acc'),
  "id",
  "masterId",
  "agreedFeeKop",
  'FREELANCER',
  'ACCEPTED',
  COALESCE("schoolAcceptedAt", "createdAt")
FROM "RepairOrder"
WHERE "schoolAcceptedAt" IS NOT NULL
  AND "agreedFeeKop" > 0;
