/*
  Warnings:

  - Added the required column `country` to the `SonGunlerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sharesCount` to the `SonGunlerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sharesType` to the `SonGunlerEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SonGunlerEntry" ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "receipt" TEXT NOT NULL DEFAULT 'ALINMADI',
ADD COLUMN     "sharesCount" INTEGER NOT NULL,
ADD COLUMN     "sharesType" TEXT NOT NULL;
