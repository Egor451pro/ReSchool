-- CreateEnum
CREATE TYPE "PhotoRole" AS ENUM ('BEFORE', 'AFTER');

-- AlterTable
ALTER TABLE "ItemPhoto" ADD COLUMN "role" "PhotoRole" NOT NULL DEFAULT 'BEFORE';

-- CreateIndex
CREATE INDEX "ItemPhoto_itemId_role_idx" ON "ItemPhoto"("itemId", "role");
