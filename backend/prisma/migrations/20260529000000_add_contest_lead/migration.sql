-- CreateEnum: Procesador
CREATE TYPE "Procesador" AS ENUM ('INTEL_I3_10A_14A', 'INTEL_I5_10A_14A', 'INTEL_I7_10A_14A', 'INTEL_I9_10A_14A', 'AMD_RYZEN_3', 'AMD_RYZEN_5', 'AMD_RYZEN_7', 'AMD_RYZEN_9', 'OTRO');

-- CreateEnum: GraficaActual
CREATE TYPE "GraficaActual" AS ENUM ('GTX_10_SERIES', 'GTX_16_SERIES', 'RTX_20_SERIES', 'RTX_30_SERIES', 'RTX_40_SERIES', 'AMD_RX_5000', 'AMD_RX_6000', 'AMD_RX_7000', 'INTEL_ARC', 'GPU_INTEGRADA', 'OTRA');

-- CreateEnum: FuentePoderWatts
CREATE TYPE "FuentePoderWatts" AS ENUM ('MENOS_500W', 'W500_649', 'W650_749', 'W750_849', 'W850_999', 'MAS_1000W', 'NO_SE');

-- CreateTable: ContestLead
CREATE TABLE "ContestLead" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "procesador" "Procesador" NOT NULL,
    "graficaActual" "GraficaActual" NOT NULL,
    "fuentePoderWatts" "FuentePoderWatts" NOT NULL,
    "fotoExteriorUrl" TEXT NOT NULL,
    "fotoInteriorUrl" TEXT NOT NULL,
    "historia" TEXT NOT NULL,
    "aceptaTyC" BOOLEAN NOT NULL,
    "aceptaMarketing" BOOLEAN NOT NULL,
    "isFinalist" BOOLEAN NOT NULL DEFAULT false,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "camposExtra" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ContestVote
CREATE TABLE "ContestVote" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "voterIp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContestVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContestLead_email_key" ON "ContestLead"("email");

-- CreateIndex
CREATE INDEX "ContestLead_isFinalist_idx" ON "ContestLead"("isFinalist");

-- CreateIndex
CREATE INDEX "ContestLead_procesador_idx" ON "ContestLead"("procesador");

-- CreateIndex
CREATE INDEX "ContestLead_graficaActual_idx" ON "ContestLead"("graficaActual");

-- CreateIndex
CREATE INDEX "ContestLead_fuentePoderWatts_idx" ON "ContestLead"("fuentePoderWatts");

-- CreateIndex
CREATE UNIQUE INDEX "ContestVote_voterIp_key" ON "ContestVote"("voterIp");

-- AddForeignKey
ALTER TABLE "ContestVote" ADD CONSTRAINT "ContestVote_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "ContestLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
