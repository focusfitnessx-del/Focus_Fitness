-- Add memberNumber column (nullable first so existing rows are not broken)
ALTER TABLE "members" ADD COLUMN "memberNumber" TEXT;

-- Backfill existing members ordered by joinDate then createdAt
UPDATE "members"
SET "memberNumber" = 'FF-' || LPAD(CAST(row_number AS TEXT), 4, '0')
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "joinDate" ASC, "createdAt" ASC) AS row_number
  FROM "members"
) ranked
WHERE "members".id = ranked.id;

-- Add unique constraint
ALTER TABLE "members" ADD CONSTRAINT "members_memberNumber_key" UNIQUE ("memberNumber");
