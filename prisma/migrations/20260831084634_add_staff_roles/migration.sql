-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'FRONT_DESK', 'ACCOUNTANT', 'HOUSEKEEPING_SUPERVISOR', 'HOUSEKEEPING_STAFF');

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_supabaseUserId_key" ON "Staff"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");
