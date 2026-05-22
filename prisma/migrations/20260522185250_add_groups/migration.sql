-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "groupId" INTEGER;

-- CreateTable
CREATE TABLE "DonationGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER,
    "isOzet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonationGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DonationGroup" ADD CONSTRAINT "DonationGroup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "DonationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
