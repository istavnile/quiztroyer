-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('DRAFT', 'OPEN', 'SPINNING', 'DONE');

-- CreateTable
CREATE TABLE "Raffle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "status" "RaffleStatus" NOT NULL DEFAULT 'DRAFT',
    "branding" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Raffle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleEntry" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "socketId" TEXT,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaffleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Raffle_slug_key" ON "Raffle"("slug");
CREATE INDEX "Raffle_slug_idx" ON "Raffle"("slug");
CREATE INDEX "RaffleEntry_raffleId_idx" ON "RaffleEntry"("raffleId");
CREATE UNIQUE INDEX "RaffleEntry_raffleId_dni_key" ON "RaffleEntry"("raffleId", "dni");

-- AddForeignKey
ALTER TABLE "RaffleEntry" ADD CONSTRAINT "RaffleEntry_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
