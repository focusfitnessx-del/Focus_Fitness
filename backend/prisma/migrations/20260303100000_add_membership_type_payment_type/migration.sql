-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('STUDENT', 'ADULT', 'COUPLE', 'CAMPUS');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('MONTHLY', 'ADMISSION');

-- AlterTable: add membershipType (nullable) to members
ALTER TABLE "members" ADD COLUMN "membershipType" "MembershipType";

-- AlterTable: add paymentType with default MONTHLY to payments
ALTER TABLE "payments" ADD COLUMN "paymentType" "PaymentType" NOT NULL DEFAULT 'MONTHLY';

-- Backfill all existing payments as MONTHLY
UPDATE "payments" SET "paymentType" = 'MONTHLY';

-- Drop the old blanket unique constraint (memberId, month, year)
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_memberId_month_year_key";

-- Create a partial unique index for MONTHLY payments only
-- This allows multiple ADMISSION payments for the same member/month/year
CREATE UNIQUE INDEX "payments_monthly_unique" ON "payments"("memberId", "month", "year") WHERE ("paymentType" = 'MONTHLY');
