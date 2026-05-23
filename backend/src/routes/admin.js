const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { signAdminToken, signTotpPendingToken, requireAdmin, requireTotpPending } = require('../middleware/auth');
const speakeasy = require('speakeasy');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { readContestSettings } = require('./contest');

const prisma = new PrismaClient();

// Multer config for image uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan campos' });

  // Fallback: if no admins exist in DB yet, allow env-based superadmin login
  const count = await prisma.admin.count();
  if (count === 0) {
    const envPass = process.env.ADMIN_PASSWORD || 'admin123';
    if (username === 'admin' && password === envPass) {
      // Auto-create the first admin in DB
      const hash = await bcrypt.hash(password, 10);
      const created = await prisma.admin.create({ data: { username: 'admin', passwordHash: hash } });
      return res.json({ token: signAdminToken(created.id, created.username) });
    }
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return res.status(401).json({ error: 'Credenciales incorrectas' });
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

  if (admin.totpEnabled && admin.totpSecret) {
    const tempToken = signTotpPendingToken(admin.id, admin.username);
    return res.json({ requires_totp: true, tempToken });
  }

  res.json({ token: signAdminToken(admin.id, admin.username), username: admin.username });
});

// ─── TOTP / 2FA endpoints ──────────────────────────────────────────────────────

// GET /api/admin/auth/totp/status  — estado 2FA del admin actual
router.get('/auth/totp/status', requireAdmin, async (req, res) => {
  const admin = await prisma.admin.findUnique({
    where: { id: req.admin.adminId },
    select: { totpEnabled: true },
  });
  res.json({ totpEnabled: admin?.totpEnabled ?? false });
});

// POST /api/admin/auth/totp/setup  — genera secret + devuelve URL para QR
router.post('/auth/totp/setup', requireAdmin, async (req, res) => {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.adminId } });
  const appName = process.env.TOTP_APP_NAME || 'Quiztroyer';
  const secret = speakeasy.generateSecret({ name: `${appName} (${admin.username})`, length: 20 });
  // Store the pending secret (not yet enabled) temporarily in totpSecret
  await prisma.admin.update({
    where: { id: admin.id },
    data: { totpSecret: secret.base32, totpEnabled: false },
  });
  res.json({ otpauthUrl: secret.otpauth_url, secret: secret.base32 });
});

// POST /api/admin/auth/totp/verify-setup  — verifica primer código y activa 2FA
router.post('/auth/totp/verify-setup', requireAdmin, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código requerido' });

  const admin = await prisma.admin.findUnique({ where: { id: req.admin.adminId } });
  if (!admin?.totpSecret) return res.status(400).json({ error: 'Primero genera el código QR' });

  const valid = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: 'base32',
    token: String(code).replace(/\s/g, ''),
    window: 1,
  });
  if (!valid) return res.status(400).json({ error: 'Código incorrecto. Verifica la hora de tu dispositivo.' });

  await prisma.admin.update({ where: { id: admin.id }, data: { totpEnabled: true } });
  res.json({ ok: true });
});

// POST /api/admin/auth/totp/disable  — desactiva 2FA (requiere password actual)
router.post('/auth/totp/disable', requireAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Contraseña requerida para desactivar 2FA' });

  const admin = await prisma.admin.findUnique({ where: { id: req.admin.adminId } });
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });

  await prisma.admin.update({
    where: { id: admin.id },
    data: { totpEnabled: false, totpSecret: null },
  });
  res.json({ ok: true });
});

// POST /api/admin/auth/totp/verify-login  — segundo paso del login con TOTP
router.post('/auth/totp/verify-login', requireTotpPending, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código requerido' });

  const admin = await prisma.admin.findUnique({ where: { id: req.admin.adminId } });
  if (!admin?.totpEnabled || !admin?.totpSecret) {
    return res.status(400).json({ error: '2FA no configurado' });
  }

  const valid = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: 'base32',
    token: String(code).replace(/\s/g, ''),
    window: 1,
  });
  if (!valid) return res.status(400).json({ error: 'Código incorrecto' });

  res.json({ token: signAdminToken(admin.id, admin.username), username: admin.username });
});

// --- CHALLENGES CRUD ---

// GET /api/admin/challenges?archived=true
router.get('/challenges', requireAdmin, async (req, res) => {
  const archived = req.query.archived === 'true';
  const challenges = await prisma.challenge.findMany({
    where: { archived },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true, sessions: true } } },
  });
  res.json(challenges);
});

// POST /api/admin/challenges
router.post('/challenges', requireAdmin, async (req, res) => {
  const { name, slug, pin, branding } = req.body;
  if (!name || !slug || !pin) {
    return res.status(400).json({ error: 'name, slug y pin son requeridos' });
  }
  const exists = await prisma.challenge.findUnique({ where: { slug } });
  if (exists) return res.status(409).json({ error: 'El slug ya existe' });

  const challenge = await prisma.challenge.create({
    data: { name, slug, pin, branding: branding || {} },
  });
  res.status(201).json(challenge);
});

// GET /api/admin/challenges/:id
router.get('/challenges/:id', requireAdmin, async (req, res) => {
  const challenge = await prisma.challenge.findUnique({
    where: { id: req.params.id },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!challenge) return res.status(404).json({ error: 'Not found' });
  res.json(challenge);
});

// PUT /api/admin/challenges/:id
router.put('/challenges/:id', requireAdmin, async (req, res) => {
  const { name, slug, pin, branding, status } = req.body;
  const updated = await prisma.challenge.update({
    where: { id: req.params.id },
    data: { name, slug, pin, branding, ...(status && { status }) },
  });
  res.json(updated);
});

// DELETE /api/admin/challenges/:id
router.delete('/challenges/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Manual cascade: Answers → Sessions → LiveRoom → Questions → Challenge
    const sessions = await prisma.gameSession.findMany({ where: { challengeId: id }, select: { id: true } });
    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length) {
      await prisma.answer.deleteMany({ where: { sessionId: { in: sessionIds } } });
      await prisma.gameSession.deleteMany({ where: { challengeId: id } });
    }
    await prisma.liveRoom.deleteMany({ where: { challengeId: id } });
    await prisma.question.deleteMany({ where: { challengeId: id } });
    await prisma.challenge.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete challenge error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/challenges/:id/archive
router.patch('/challenges/:id/archive', requireAdmin, async (req, res) => {
  const { archived } = req.body;
  const updated = await prisma.challenge.update({
    where: { id: req.params.id },
    data: { archived: Boolean(archived) },
    select: { id: true, archived: true },
  });
  res.json(updated);
});

// POST /api/admin/challenges/:id/reset — reset for replay, keep history
router.post('/challenges/:id/reset', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.liveRoom.deleteMany({ where: { challengeId: id } });
    const updated = await prisma.challenge.update({
      where: { id },
      data: { status: 'DRAFT', runNumber: { increment: 1 } },
      select: { id: true, status: true, runNumber: true },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- QUESTIONS CRUD ---

// GET /api/admin/challenges/:id/questions
router.get('/challenges/:id/questions', requireAdmin, async (req, res) => {
  const questions = await prisma.question.findMany({
    where: { challengeId: req.params.id },
    orderBy: { order: 'asc' },
  });
  res.json(questions);
});

// POST /api/admin/challenges/:id/questions
router.post('/challenges/:id/questions', requireAdmin, async (req, res) => {
  const { type, prompt, timeLimit, maxChars, config } = req.body;
  const count = await prisma.question.count({ where: { challengeId: req.params.id } });
  const question = await prisma.question.create({
    data: {
      challengeId: req.params.id,
      type,
      prompt,
      timeLimit: timeLimit || 30,
      maxChars: maxChars || 200,
      config: config || {},
      order: count,
    },
  });
  res.status(201).json(question);
});

// PUT /api/admin/questions/:qid
router.put('/questions/:qid', requireAdmin, async (req, res) => {
  const { type, prompt, timeLimit, maxChars, config, order, slideImage, slideBackground } = req.body;
  // Store slideImage and slideBackground inside config to avoid schema changes
  const mergedConfig = {
    ...(config || {}),
    ...(slideImage !== undefined   && { _slideImage: slideImage }),
    ...(slideBackground !== undefined && { _slideBackground: slideBackground }),
  };
  const updated = await prisma.question.update({
    where: { id: req.params.qid },
    data: { type, prompt, timeLimit, maxChars, config: mergedConfig, ...(order !== undefined && { order }) },
  });
  res.json(updated);
});

// DELETE /api/admin/questions/:qid
router.delete('/questions/:qid', requireAdmin, async (req, res) => {
  await prisma.question.delete({ where: { id: req.params.qid } });
  res.json({ ok: true });
});

// PUT /api/admin/challenges/:id/questions/reorder
router.put('/challenges/:id/questions/reorder', requireAdmin, async (req, res) => {
  const { order } = req.body; // array of { id, order }
  await prisma.$transaction(
    order.map((q) => prisma.question.update({ where: { id: q.id }, data: { order: q.order } }))
  );
  res.json({ ok: true });
});

// POST /api/admin/upload-image
router.post('/upload-image', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// --- RESULTS ---

// GET /api/admin/challenges/:id/results
router.get('/challenges/:id/results', requireAdmin, async (req, res) => {
  const sessions = await prisma.gameSession.findMany({
    where: { challengeId: req.params.id },
    orderBy: { totalScore: 'desc' },
    include: { answers: { include: { question: { select: { prompt: true, type: true } } } } },
  });
  res.json(sessions);
});

// --- ADMIN MANAGEMENT ---

// GET /api/admin/admins — list all admins
router.get('/admins', requireAdmin, async (req, res) => {
  const admins = await prisma.admin.findMany({
    select: { id: true, username: true, email: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(admins);
});

// POST /api/admin/admins — create new admin
router.post('/admins', requireAdmin, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username y password requeridos' });
  const exists = await prisma.admin.findUnique({ where: { username } });
  if (exists) return res.status(409).json({ error: 'El usuario ya existe' });
  const hash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.create({ data: { username, email: email || undefined, passwordHash: hash } });
  res.status(201).json({ id: admin.id, username: admin.username, email: admin.email });
});

// DELETE /api/admin/admins/:id
router.delete('/admins/:id', requireAdmin, async (req, res) => {
  if (req.admin.adminId === req.params.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  await prisma.admin.delete({ where: { id: req.params.id } }).catch(() => {});
  res.json({ ok: true });
});

// PATCH /api/admin/admins/me/password — change own password
router.patch('/admins/me/password', requireAdmin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Faltan campos' });
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.adminId } });
  if (!admin) return res.status(404).json({ error: 'Admin no encontrado' });
  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.admin.update({ where: { id: req.admin.adminId }, data: { passwordHash: hash } });
  res.json({ ok: true });
});

// PATCH /api/admin/admins/me/email — set/update own email
router.patch('/admins/me/email', requireAdmin, async (req, res) => {
  const { email } = req.body;
  await prisma.admin.update({ where: { id: req.admin.adminId }, data: { email: email || null } });
  res.json({ ok: true });
});

// POST /api/admin/auth/forgot-password — send reset email
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const admin = email ? await prisma.admin.findUnique({ where: { email } }) : null;
  // Always return 200 to avoid enumeration
  if (!admin) return res.json({ ok: true });

  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await prisma.passwordResetToken.create({ data: { adminId: admin.id, token, expiresAt } });

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/reset-password?token=${token}`;

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from:    process.env.SMTP_FROM || process.env.SMTP_USER,
    to:      admin.email,
    subject: 'Recuperar contraseña — Quiztroyer',
    html:    `<p>Haz clic en el siguiente enlace para restablecer tu contraseña (válido por 1 hora):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  }).catch((e) => console.error('[SMTP error]', e.message));

  res.json({ ok: true });
});

// POST /api/admin/auth/reset-password — apply reset token
router.post('/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Faltan campos' });
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.used || record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Token inválido o expirado' });
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.admin.update({ where: { id: record.adminId }, data: { passwordHash: hash } });
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } });
  res.json({ ok: true });
});

// --- SITE SETTINGS ---
// Store in uploads dir (volume-mounted in production so it persists across restarts)
const SETTINGS_PATH = path.join(__dirname, '../../uploads/settings.json');

function readSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); }
  catch { return { blob1Color: '#6366f1', blob2Color: '#a855f7', blob3Color: '#ec4899', homeBgColor: '#0f172a', homeButtonColor: '#4f46e5', logoUrl: '', bgEffect: 'blobs' }; }
}

// GET /api/admin/settings
router.get('/settings', requireAdmin, (req, res) => res.json(readSettings()));

// PATCH /api/admin/settings
router.patch('/settings', requireAdmin, (req, res) => {
  const updated = { ...readSettings(), ...req.body };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2));
  res.json(updated);
});

// ─── Concurso Externo ("El Gran Upgrade") ─────────────────────────────────────

const CONTEST_SETTINGS_PATH = path.join(__dirname, '../../uploads/contest-settings.json');

// GET /api/admin/concurso/settings
router.get('/concurso/settings', requireAdmin, (req, res) => {
  res.json(readContestSettings());
});

// PATCH /api/admin/concurso/settings
router.patch('/concurso/settings', requireAdmin, (req, res) => {
  try {
    let current = {};
    try { current = JSON.parse(fs.readFileSync(CONTEST_SETTINGS_PATH, 'utf8')); } catch {}
    const updated = { ...current, ...req.body };
    fs.writeFileSync(CONTEST_SETTINGS_PATH, JSON.stringify(updated, null, 2));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/concurso?procesador=&graficaActual=&fuentePoderWatts=&search=
router.get('/concurso', requireAdmin, async (req, res) => {
  const { procesador, graficaActual, fuentePoderWatts, search, isFinalist } = req.query;

  const where = {};
  if (procesador)       where.procesador       = procesador;
  if (graficaActual)    where.graficaActual    = graficaActual;
  if (fuentePoderWatts) where.fuentePoderWatts = fuentePoderWatts;
  if (isFinalist === 'true')  where.isFinalist = true;
  if (isFinalist === 'false') where.isFinalist = false;
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { email:  { contains: search, mode: 'insensitive' } },
    ];
  }

  const leads = await prisma.contestLead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, nombre: true, email: true, telefono: true,
      procesador: true, graficaActual: true, fuentePoderWatts: true,
      isFinalist: true, voteCount: true, createdAt: true,
    },
  });
  res.json(leads);
});

// GET /api/admin/concurso/:id
router.get('/concurso/:id', requireAdmin, async (req, res) => {
  const lead = await prisma.contestLead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ error: 'Registro no encontrado' });
  res.json(lead);
});

// PATCH /api/admin/concurso/:id/finalist  — toggle isFinalist
router.patch('/concurso/:id/finalist', requireAdmin, async (req, res) => {
  const lead = await prisma.contestLead.findUnique({
    where: { id: req.params.id },
    select: { isFinalist: true },
  });
  if (!lead) return res.status(404).json({ error: 'Registro no encontrado' });

  const updated = await prisma.contestLead.update({
    where: { id: req.params.id },
    data: { isFinalist: !lead.isFinalist },
    select: { id: true, isFinalist: true },
  });
  res.json(updated);
});

// DELETE /api/admin/concurso/:id
router.delete('/concurso/:id', requireAdmin, async (req, res) => {
  await prisma.contestLead.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;

