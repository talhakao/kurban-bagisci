-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" SERIAL NOT NULL,
    "ownerName" TEXT NOT NULL,
    "sharesCount" INTEGER NOT NULL,
    "sharesType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "notes" TEXT,
    "receipt" TEXT NOT NULL DEFAULT 'ALINMADI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
