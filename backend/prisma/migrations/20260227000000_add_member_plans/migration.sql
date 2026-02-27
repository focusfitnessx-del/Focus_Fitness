-- Create PlanType enum
CREATE TYPE "PlanType" AS ENUM ('MEAL_PLAN', 'WORKOUT');

-- Create member_plans table
CREATE TABLE "member_plans" (
    "id"         TEXT NOT NULL,
    "memberId"   TEXT NOT NULL,
    "type"       "PlanType" NOT NULL,
    "title"      TEXT,
    "content"    TEXT NOT NULL,
    "sentAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentById"   TEXT,

    CONSTRAINT "member_plans_pkey" PRIMARY KEY ("id")
);

-- Foreign key to members
ALTER TABLE "member_plans" ADD CONSTRAINT "member_plans_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
