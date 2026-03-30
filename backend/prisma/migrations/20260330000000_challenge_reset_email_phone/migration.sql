-- Add runNumber to Challenge (tracks how many times it has been reset)
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "runNumber" INTEGER NOT NULL DEFAULT 1;

-- Add runNumber + contact fields to GameSession
ALTER TABLE "GameSession" ADD COLUMN IF NOT EXISTS "runNumber"   INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "GameSession" ADD COLUMN IF NOT EXISTS "playerEmail" TEXT;
ALTER TABLE "GameSession" ADD COLUMN IF NOT EXISTS "playerPhone" TEXT;

-- Replace old unique constraint with run-scoped one
DROP INDEX IF EXISTS "GameSession_challengeId_playerDni_key";
CREATE UNIQUE INDEX IF NOT EXISTS "GameSession_challengeId_playerDni_runNumber_key"
  ON "GameSession"("challengeId", "playerDni", "runNumber");
