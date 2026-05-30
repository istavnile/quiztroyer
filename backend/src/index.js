require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const adminRoutes = require('./routes/admin');
const challengeRoutes = require('./routes/challenges');
const raffleRoutes = require('./routes/raffle');
const contestRoutes = require('./routes/contest');
const { setupGameSocket } = require('./socket/gameHandler');
const { setupRaffleSocket } = require('./socket/raffleHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// ─── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

const contestRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas inscripciones desde esta IP. Intenta más tarde.' },
});

const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de voto. Intenta más tarde.' },
});

// Middlewares
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Public site settings (no auth) — DB-backed
const SITE_DEFAULTS = { blob1Color: '#6366f1', blob2Color: '#a855f7', blob3Color: '#ec4899', homeBgColor: '#0f172a', homeButtonColor: '#4f46e5', logoUrl: '', bgEffect: 'blobs' };
app.get('/api/settings', async (req, res) => {
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: 'singleton' } });
    res.json({ ...SITE_DEFAULTS, ...(row?.data ?? {}) });
  } catch {
    res.json(SITE_DEFAULTS);
  }
});

// REST Routes
app.use('/api/admin/login', authLimiter);
app.use('/api/contest/register', contestRegisterLimiter);
app.use('/api/contest/vote', voteLimiter);
app.use('/api/admin', adminRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/raffle', raffleRoutes);
app.use('/api/contest', contestRoutes);

// Serve index.html with dynamic OG tags for social crawlers
app.get('/index-ssr.html', async (req, res) => {
  try {
    const s = await prisma.contestSettings.findFirst();
    const settings = s?.data || {};

    const title = settings.titulo || 'El Upgrade de lo que realmente importa';
    const desc = settings.subtitulo ?
      settings.subtitulo.replace(/<[^>]*>/g, '').substring(0, 160) :
      'Muéstranos tu PC y cuéntanos tu historia';
    const image = settings.imagenHero ? `http://localhost:4000${settings.imagenHero}` : 'https://quiztroyer.istavnile.cloud/og-image.svg';
    const badge = settings.badge || '';

    const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#09090f" />
    <title>${title}</title>

    <!-- SEO -->
    <meta name="description" content="${desc}" />

    <!-- Open Graph (WhatsApp, Facebook, Telegram, Slack…) -->
    <meta property="og:type"        content="website" />
    <meta property="og:site_name"   content="El Upgrade" />
    <meta property="og:title"       content="${title}" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:image"       content="${image}" />
    <meta property="og:image:width"  content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url"         content="https://concurso.intercutmedia.com/" />

    <!-- Twitter / X card -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="${title}" />
    <meta name="twitter:description" content="${desc}" />
    <meta name="twitter:image"       content="${image}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    <script type="module" src="/src/main.jsx"><\/script>
  </head>
  <body class="bg-slate-900 text-white font-display antialiased">
    <div id="root"></div>
  </body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('[SSR error]', err);
    res.status(500).send('<html><body>Error loading page</body></html>');
  }
});

// Global error handler (prevents server crash)
app.use((err, req, res, next) => {
  console.error('[Unhandled error]', err.message);
  res.status(500).json({ error: err.message });
});

// Socket.io
setupGameSocket(io);
setupRaffleSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Quiztroyer backend running on port ${PORT}`);
});
