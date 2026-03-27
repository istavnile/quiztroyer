-- Add unique constraints on correo and telefono per raffle
CREATE UNIQUE INDEX IF NOT EXISTS "RaffleEntry_raffleId_correo_key" ON "RaffleEntry"("raffleId", "correo");
CREATE UNIQUE INDEX IF NOT EXISTS "RaffleEntry_raffleId_telefono_key" ON "RaffleEntry"("raffleId", "telefono");
