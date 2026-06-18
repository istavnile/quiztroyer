-- Add isWinner field to ContestLead
ALTER TABLE "ContestLead" ADD COLUMN "isWinner" BOOLEAN NOT NULL DEFAULT false;

-- Add index for winner
CREATE INDEX "ContestLead_isWinner_idx" ON "ContestLead"("isWinner");
