const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Fechas del concurso (UTC-6 / hora Guatemala)
const OPEN_DATE = new Date('2026-06-01T06:00:00Z');   // 1 jun 00:00 GT
const CLOSE_DATE = new Date('2026-06-08T05:59:59Z');  // 7 jun 23:59 GT

function isRegistrationOpen() {
  const now = new Date();
  return now >= OPEN_DATE && now <= CLOSE_DATE;
}

// Multer para uploads públicos del concurso
const contestUploadDir = path.join(__dirname, '../../uploads/contest');
if (!fs.existsSync(contestUploadDir)) fs.mkdirSync(contestUploadDir, { recursive: true });

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const contestStorage = multer.diskStorage({
  destination: contestUploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `contest-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const contestUpload = multer({
  storage: contestStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
  },
});

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─── POST /api/contest/register ───────────────────────────────────────────────
router.post(
  '/register',
  contestUpload.fields([
    { name: 'fotoExterior', maxCount: 1 },
    { name: 'fotoInterior', maxCount: 1 },
  ]),
  async (req, res) => {
    if (!isRegistrationOpen()) {
      // Limpia los archivos subidos si el concurso no está activo
      if (req.files) {
        Object.values(req.files).flat().forEach((f) => fs.unlink(f.path, () => {}));
      }
      return res.status(403).json({ error: 'Las inscripciones no están abiertas en este momento.' });
    }

    const {
      nombre, email, telefono,
      procesador, graficaActual, fuentePoderWatts,
      historia, aceptaTyC, aceptaMarketing,
    } = req.body;

    const missingFields = [];
    if (!nombre?.trim())           missingFields.push('nombre');
    if (!email?.trim())            missingFields.push('email');
    if (!telefono?.trim())         missingFields.push('telefono');
    if (!procesador)               missingFields.push('procesador');
    if (!graficaActual)            missingFields.push('graficaActual');
    if (!fuentePoderWatts)         missingFields.push('fuentePoderWatts');
    if (!historia?.trim())         missingFields.push('historia');

    if (missingFields.length) {
      return res.status(400).json({ error: `Campos requeridos: ${missingFields.join(', ')}` });
    }

    if (aceptaTyC !== 'true' && aceptaTyC !== true) {
      return res.status(400).json({ error: 'Debes aceptar los Términos y Condiciones.' });
    }

    if (countWords(historia) > 150) {
      return res.status(400).json({ error: 'La historia no puede superar 150 palabras.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido.' });
    }

    if (!req.files?.fotoExterior?.[0] || !req.files?.fotoInterior?.[0]) {
      return res.status(400).json({ error: 'Debes subir la foto exterior e interior de tu PC.' });
    }

    const apiBase = `${req.protocol}://${req.get('host')}`;
    const fotoExteriorUrl = `${apiBase}/uploads/contest/${req.files.fotoExterior[0].filename}`;
    const fotoInteriorUrl = `${apiBase}/uploads/contest/${req.files.fotoInterior[0].filename}`;

    try {
      const lead = await prisma.contestLead.create({
        data: {
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          telefono: telefono.trim(),
          procesador,
          graficaActual,
          fuentePoderWatts,
          fotoExteriorUrl,
          fotoInteriorUrl,
          historia: historia.trim(),
          aceptaTyC: true,
          aceptaMarketing: aceptaMarketing === 'true' || aceptaMarketing === true,
        },
      });
      res.status(201).json({ ok: true, id: lead.id });
    } catch (err) {
      // Limpia archivos si la inserción falla
      [req.files.fotoExterior[0], req.files.fotoInterior[0]].forEach((f) =>
        fs.unlink(f.path, () => {})
      );
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Ya existe una inscripción con ese email.' });
      }
      throw err;
    }
  }
);

// ─── GET /api/contest/finalists ───────────────────────────────────────────────
router.get('/finalists', async (req, res) => {
  const finalists = await prisma.contestLead.findMany({
    where: { isFinalist: true },
    select: {
      id: true,
      nombre: true,
      procesador: true,
      graficaActual: true,
      fotoExteriorUrl: true,
      fotoInteriorUrl: true,
      historia: true,
      voteCount: true,
    },
    orderBy: { voteCount: 'desc' },
  });
  res.json(finalists);
});

// ─── GET /api/contest/vote-status ─────────────────────────────────────────────
router.get('/vote-status', async (req, res) => {
  const ip = getClientIp(req);
  const existing = await prisma.contestVote.findUnique({ where: { voterIp: ip } });
  res.json({ hasVoted: !!existing, votedFor: existing?.entryId ?? null });
});

// ─── POST /api/contest/vote/:id ───────────────────────────────────────────────
router.post('/vote/:id', async (req, res) => {
  const { id } = req.params;
  const ip = getClientIp(req);

  const finalist = await prisma.contestLead.findFirst({
    where: { id, isFinalist: true },
  });
  if (!finalist) return res.status(404).json({ error: 'Finalista no encontrado.' });

  const existingVote = await prisma.contestVote.findUnique({ where: { voterIp: ip } });
  if (existingVote) {
    return res.status(409).json({ error: 'Ya emitiste tu voto.', votedFor: existingVote.entryId });
  }

  await prisma.$transaction([
    prisma.contestVote.create({ data: { entryId: id, voterIp: ip } }),
    prisma.contestLead.update({ where: { id }, data: { voteCount: { increment: 1 } } }),
  ]);

  const updated = await prisma.contestLead.findUnique({
    where: { id },
    select: { voteCount: true },
  });

  res.json({ ok: true, voteCount: updated.voteCount });
});

module.exports = router;
