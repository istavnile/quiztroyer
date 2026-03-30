const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/challenges/:slug - public info for join page
router.get('/:slug', async (req, res) => {
  const challenge = await prisma.challenge.findUnique({
    where: { slug: req.params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      branding: true,
      status: true,
      _count: { select: { questions: true } },
    },
  });
  if (!challenge) return res.status(404).json({ error: 'Desafío no encontrado' });
  res.json(challenge);
});

// POST /api/challenges/:slug/validate-pin
router.post('/:slug/validate-pin', async (req, res) => {
  const { pin } = req.body;
  const challenge = await prisma.challenge.findUnique({ where: { slug: req.params.slug } });
  if (!challenge) return res.status(404).json({ error: 'No encontrado' });
  if (challenge.pin !== pin) return res.status(401).json({ error: 'PIN incorrecto' });
  res.json({ valid: true, challengeId: challenge.id, name: challenge.name });
});

// GET /api/challenges/:slug/leaderboard - public leaderboard
router.get('/:slug/leaderboard', async (req, res) => {
  const challenge = await prisma.challenge.findUnique({ where: { slug: req.params.slug } });
  if (!challenge) return res.status(404).json({ error: 'No encontrado' });

  const sessions = await prisma.gameSession.findMany({
    where: { challengeId: challenge.id },
    orderBy: { totalScore: 'desc' },
    take: 10,
    select: {
      id: true,
      playerName: true,
      playerDni: true,
      totalScore: true,
      rank: true,
    },
  });
  res.json(sessions);
});

// GET /api/challenges/:slug/hall-of-fame — all-time top 20 across all runs
router.get('/:slug/hall-of-fame', async (req, res) => {
  const challenge = await prisma.challenge.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, name: true, branding: true, runNumber: true },
  });
  if (!challenge) return res.status(404).json({ error: 'No encontrado' });

  const top = await prisma.gameSession.findMany({
    where: { challengeId: challenge.id, completedAt: { not: null } },
    orderBy: { totalScore: 'desc' },
    take: 20,
    select: { playerName: true, totalScore: true, runNumber: true, completedAt: true },
  });

  res.json({ challenge, entries: top });
});

module.exports = router;
