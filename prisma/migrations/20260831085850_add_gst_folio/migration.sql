/*
  Warnings:

  - Added the required column `roomRatePerNight` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GstType" AS ENUM ('CGST_SGST', 'IGST');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "roomRatePerNight" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Folio" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "sacCode" TEXT NOT NULL DEFAULT '996311',
    "baseAmount" INTEGER NOT NULL,
    "gstRate" INTEGER NOT NULL,
    "gstType" "GstType" NOT NULL,
    "cgst" INTEGER NOT NULL,
    "sgst" INTEGER NOT NULL,
    "igst" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Folio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Folio_bookingId_key" ON "Folio"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Folio_invoiceNumber_key" ON "Folio"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "Folio" ADD CONSTRAINT "Folio_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
