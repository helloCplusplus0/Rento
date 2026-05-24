-- CreateEnum
CREATE TYPE "MeterReadingRecordType" AS ENUM (
  'INITIAL_BASELINE',
  'REGULAR_READING',
  'CHECKOUT_FINAL'
);

-- AlterTable
ALTER TABLE "meter_readings"
ADD COLUMN "recordType" "MeterReadingRecordType" NOT NULL DEFAULT 'REGULAR_READING';
