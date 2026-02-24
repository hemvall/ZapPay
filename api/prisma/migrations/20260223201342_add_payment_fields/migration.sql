/*
  Warnings:

  - You are about to drop the column `currency` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `merchant` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `network` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientAddress` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Payment_merchant_idx";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "currency",
DROP COLUMN "merchant",
ADD COLUMN     "label" TEXT,
ADD COLUMN     "network" TEXT NOT NULL,
ADD COLUMN     "recipientAddress" TEXT NOT NULL,
ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Payment_recipientAddress_idx" ON "Payment"("recipientAddress");
