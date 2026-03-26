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

  try {
    const entry = await prisma.raffleEntry.create({
      data: { raffleId: raffle.id, nombre, apellido, dni, correo, telefono },
    });
    res.json({ entryId: entry.id, nombre: entry.nombre });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Este DNI ya está registrado' });
    throw err;
  }
});

// ── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/raffle/admin/list
router.get('/admin/list', requireAdmin, async (req, res) => {
  const raffles = await prisma.raffle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { entries: true } } },
  });
  res.json(raffles);
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

// DELETE /api/raffle/admin/:id
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  await prisma.raffle.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
