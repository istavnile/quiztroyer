const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// ── PUBLIC ──────────────────────────────────────────────────────────────────

// GET /api/raffle/:slug — public raffle info
router.get('/:slug', async (req, res) => {
  const raffle = await prisma.raffle.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, name: true, slug: true, status: true, branding: true },
  });
  if (!raffle) return res.status(404).json({ error: 'Sorteo no encontrado' });
  res.json(raffle);
});

// POST /api/raffle/:slug/enter — submit entry
router.post('/:slug/enter', async (req, res) => {
  const { pin, nombre, apellido, dni, correo, telefono } = req.body;
  if (!nombre || !apellido || !dni || !correo || !telefono || !pin) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(correo)) return res.status(400).json({ error: 'Correo inválido' });
  const phoneRx = /^\+?[\d\s\-().]{7,20}$/;
  if (!phoneRx.test(telefono)) return res.status(400).json({ error: 'Teléfono inválido' });

  const raffle = await prisma.raffle.findUnique({ where: { slug: req.params.slug } });
  if (!raffle) return res.status(404).json({ error: 'Sorteo no encontrado' });
  if (raffle.pin !== pin) return res.status(403).json({ error: 'PIN incorrecto' });
  if (raffle.status !== 'OPEN') return res.status(400).json({ error: 'El sorteo no está abierto' });

  // Check duplicates with specific messages
  const dniNorm     = dni.trim().toLowerCase();
  const correoNorm  = correo.trim().toLowerCase();
  const telNorm     = telefono.replace(/[\s\-().]/g, '');

  const existing = await prisma.raffleEntry.findFirst({
    where: {
      raffleId: raffle.id,
      OR: [
        { dni:      { equals: dniNorm,    mode: 'insensitive' } },
        { correo:   { equals: correoNorm, mode: 'insensitive' } },
        { telefono: telNorm },
      ],
    },
    select: { dni: true, correo: true, telefono: true },
  });

  if (existing) {
    if (existing.dni.toLowerCase() === dniNorm)
      return res.status(409).json({ error: 'Este DNI ya está registrado en el sorteo' });
    if (existing.correo.toLowerCase() === correoNorm)
      return res.status(409).json({ error: 'Este correo ya está registrado en el sorteo' });
    return res.status(409).json({ error: 'Este teléfono ya está registrado en el sorteo' });
  }

  try {
    const entry = await prisma.raffleEntry.create({
      data: { raffleId: raffle.id, nombre, apellido, dni: dniNorm, correo: correoNorm, telefono: telNorm },
    });
    res.json({ entryId: entry.id, nombre: entry.nombre });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Datos duplicados. Verifica DNI, correo y teléfono' });
    throw err;
  }
});

// ── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/raffle/admin/list?archived=true
router.get('/admin/list', requireAdmin, async (req, res) => {
  const archived = req.query.archived === 'true';
  const raffles = await prisma.raffle.findMany({
    where: { archived },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { entries: true } } },
  });
  res.json(raffles);
});

// PATCH /api/raffle/admin/:id/archive
router.patch('/admin/:id/archive', requireAdmin, async (req, res) => {
  const { archived } = req.body;
  const updated = await prisma.raffle.update({
    where: { id: req.params.id },
    data: { archived: Boolean(archived) },
    select: { id: true, archived: true },
  });
  res.json(updated);
});

// POST /api/raffle/admin/create
router.post('/admin/create', requireAdmin, async (req, res) => {
  const { name, slug, pin } = req.body;
  if (!name || !slug || !pin) return res.status(400).json({ error: 'name, slug y pin requeridos' });
  const raffle = await prisma.raffle.create({ data: { name, slug, pin } });
  res.json(raffle);
});

// GET /api/raffle/admin/:id
router.get('/admin/:id', requireAdmin, async (req, res) => {
  const raffle = await prisma.raffle.findUnique({
    where: { id: req.params.id },
    include: { entries: { orderBy: { createdAt: 'asc' } } },
  });
  if (!raffle) return res.status(404).json({ error: 'Not found' });
  res.json(raffle);
});

// PATCH /api/raffle/admin/:id/status
router.patch('/admin/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const raffle = await prisma.raffle.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(raffle);
});

// PATCH /api/raffle/admin/:id/branding
router.patch('/admin/:id/branding', requireAdmin, async (req, res) => {
  const { branding } = req.body;
  const raffle = await prisma.raffle.update({
    where: { id: req.params.id },
    data: { branding: branding || {} },
  });
  res.json(raffle);
});

// DELETE /api/raffle/admin/:id
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  await prisma.raffle.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
