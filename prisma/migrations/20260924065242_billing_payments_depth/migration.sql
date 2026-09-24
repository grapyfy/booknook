-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ADVANCE', 'PARTIAL', 'FULL', 'REFUND');

-- DropIndex
DROP INDEX "Folio_bookingId_key";

-- AlterTable
ALTER TABLE "Folio" ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voided" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "type" "PaymentType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashRegisterDay" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "openingBalance" INTEGER NOT NULL,
    "closingBalanceActual" INTEGER,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "CashRegisterDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashPaidOutEntry" (
    "id" TEXT NOT NULL,
    "registerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashPaidOutEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_recordedAt_idx" ON "Payment"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_creditNoteNumber_key" ON "CreditNote"("creditNoteNumber");

-- CreateIndex
CREATE INDEX "CreditNote_bookingId_idx" ON "CreditNote"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "CashRegisterDay_date_key" ON "CashRegisterDay"("date");

-- CreateIndex
CREATE INDEX "CashRegisterDay_date_idx" ON "CashRegisterDay"("date");

-- CreateIndex
CREATE INDEX "CashPaidOutEntry_registerId_idx" ON "CashPaidOutEntry"("registerId");

-- CreateIndex
CREATE INDEX "Folio_bookingId_idx" ON "Folio"("bookingId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashPaidOutEntry" ADD CONSTRAINT "CashPaidOutEntry_registerId_fkey" FOREIGN KEY ("registerId") REFERENCES "CashRegisterDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
