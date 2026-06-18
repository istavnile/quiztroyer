-- Drop unique constraint on voterIp to allow multiple votes per IP
DROP INDEX IF EXISTS "ContestVote_voterIp_key";
