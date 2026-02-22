-- Drop partial unique indexes if they were applied
DROP INDEX IF EXISTS "members_nic_unique_active";
DROP INDEX IF EXISTS "members_email_unique_active";

-- Restore standard unique constraints (in case they were dropped by a previous migration run)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'members' AND indexname = 'members_nic_key'
  ) THEN
    CREATE UNIQUE INDEX "members_nic_key" ON "members" ("nic") WHERE "nic" IS NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'members' AND indexname = 'members_email_key'
  ) THEN
    CREATE UNIQUE INDEX "members_email_key" ON "members" ("email") WHERE "email" IS NOT NULL;
  END IF;
END$$;

-- Remove soft delete column
ALTER TABLE "members" DROP COLUMN IF EXISTS "deletedAt";

-- Make memberId nullable on payments (preserve payment history after member delete)
ALTER TABLE "payments" ALTER COLUMN "memberId" DROP NOT NULL;

-- Replace FK on payments with ON DELETE SET NULL
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_memberId_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL;

-- Replace FK on reminder_logs with ON DELETE CASCADE
ALTER TABLE "reminder_logs" DROP CONSTRAINT IF EXISTS "reminder_logs_memberId_fkey";
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_memberId_fkey"
  FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE;
