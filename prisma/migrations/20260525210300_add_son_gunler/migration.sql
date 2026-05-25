-- CreateTable
CREATE TABLE "SonGunlerEntry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "addedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SonGunlerEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SonGunlerEntry" ADD CONSTRAINT "SonGunlerEntry_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
