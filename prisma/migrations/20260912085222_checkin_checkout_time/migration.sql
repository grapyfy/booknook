-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkOutTime" TEXT;

-- AlterTable
ALTER TABLE "PropertySettings" ADD COLUMN     "defaultCheckInTime" TEXT NOT NULL DEFAULT '14:00',
ADD COLUMN     "defaultCheckOutTime" TEXT NOT NULL DEFAULT '11:00';
