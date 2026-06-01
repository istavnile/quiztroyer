const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Contest Settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  // Registration gate — admin-controlled toggle
  registrationOpen: false,

  // Hero
  titulo: 'El Upgrade de lo que realmente importa.',
  tituloVw: 7,
  subtitulo: 'Muéstranos tu PC y cuéntanos tu historia. ¡El mejor setup ganará un upgrade épico!',
  badge: 'CONCURSO PATROCINADO POR NVIDIA · ASUS ROG · COMPUTERSHOP',
  imagenHero: '',

  // Fechas (solo texto display)
  textoFechaApertura: '1 de junio, 2026',
  textoFechaCierre: '7 de junio, 23:59',
  textoFechaFinal: '12 de junio, 2026',

  // Patrocinadores
  patrocinadores: [
    { nombre: 'NVIDIA',       logoUrl: '', color: '#76B900' },
    { nombre: 'ASUS ROG',     logoUrl: '', color: '#e61f30' },
    { nombre: 'ComputerShop', logoUrl: '', color: '#ffffff' },
  ],

  // Pasos
  pasos: [
    { numero: '01', titulo: 'Inscríbete',            descripcion: 'Llena el formulario con los datos de tu PC, sube fotos y cuenta tu historia en máximo 150 palabras.' },
    { numero: '02', titulo: 'Espera los finalistas', descripcion: 'Nuestro equipo revisará todas las participaciones y seleccionará los mejores setups.' },
    { numero: '03', titulo: 'Vota y comparte',       descripcion: 'Del 8 al 11 de junio, la comunidad vota por sus favoritos. ¡El ganador anunciado en vivo el 12 de junio!' },
  ],

  // Premios
  premios: [
    { posicion: '1er lugar', descripcion: 'ASUS NVIDIA GeForce RTX 5060 Ti', color: '#76B900', imagenUrl: '' },
  ],

  // Fondo de texto técnico NVIDIA
  techBgEnabled: true,
  techBgOpacity: 1.0,
  techBgTerms: [
    'DLSS 3', 'REFLEX', 'RAY TRACING', 'RTX ON', 'TENSOR CORES',
    'CUDA', 'G-SYNC', 'NVENC', 'FRAME GENERATION', 'ACE', 'BROADCAST',
    'ADA LOVELACE', 'AMPERE', 'NVLINK', 'AI DENOISING', 'OVERDRIVE',
    'DEEP LEARNING', 'BLACKWELL', 'GDDR7', 'DLSS 4', 'MULTI FRAME GEN',
  ],

  // Formulario — metadatos generales
  tituloFormulario: 'Formulario de inscripción',
  instruccionesFormulario: 'Completa todos los campos. Las inscripciones cierran el 7 de junio a las 23:59.',
  contenidoTyC: '<h3>Términos y Condiciones</h3><p>Configura el contenido desde el panel de administración.</p>',

  // Campos del formulario (schema dinámico)
  campos: [
    { id: 'nombre',    tipo: 'text',  label: 'Nombre completo',      placeholder: 'Tu nombre',            requerido: true,  ancho: 'half',  sistema: true },
    { id: 'email',     tipo: 'email', label: 'Correo electrónico',   placeholder: 'correo@ejemplo.com',   requerido: true,  ancho: 'half',  sistema: true },
    { id: 'telefono',  tipo: 'tel',   label: 'Teléfono',             placeholder: '+502 0000-0000',       requerido: true,  ancho: 'half',  sistema: true },
    { id: 'procesador', tipo: 'select', label: 'Procesador', placeholder: 'Selecciona...', requerido: true, ancho: 'half', sistema: true,
      opciones: [
        { valor: 'INTEL_I3_10A_14A', etiqueta: 'Intel Core i3 (10ª–14ª Gen)' },
        { valor: 'INTEL_I5_10A_14A', etiqueta: 'Intel Core i5 (10ª–14ª Gen)' },
        { valor: 'INTEL_I7_10A_14A', etiqueta: 'Intel Core i7 (10ª–14ª Gen)' },
        { valor: 'INTEL_I9_10A_14A', etiqueta: 'Intel Core i9 (10ª–14ª Gen)' },
        { valor: 'AMD_RYZEN_3', etiqueta: 'AMD Ryzen 3 (Serie 3000–9000)' },
        { valor: 'AMD_RYZEN_5', etiqueta: 'AMD Ryzen 5 (Serie 3000–9000)' },
        { valor: 'AMD_RYZEN_7', etiqueta: 'AMD Ryzen 7 (Serie 3000–9000)' },
        { valor: 'AMD_RYZEN_9', etiqueta: 'AMD Ryzen 9 (Serie 3000–9000)' },
        { valor: 'OTRO', etiqueta: 'Otro' },
      ],
    },
    { id: 'graficaActual', tipo: 'select', label: 'Gráfica actual', placeholder: 'Selecciona...', requerido: true, ancho: 'half', sistema: true,
      opciones: [
        { valor: 'GTX_10_SERIES', etiqueta: 'NVIDIA GeForce GTX 10 Series (1060/1070/1080)' },
        { valor: 'GTX_16_SERIES', etiqueta: 'NVIDIA GeForce GTX 16 Series (1650/1660)' },
        { valor: 'RTX_20_SERIES', etiqueta: 'NVIDIA GeForce RTX 20 Series (2060/2070/2080)' },
        { valor: 'RTX_30_SERIES', etiqueta: 'NVIDIA GeForce RTX 30 Series (3060/3070/3080/3090)' },
        { valor: 'RTX_40_SERIES', etiqueta: 'NVIDIA GeForce RTX 40 Series (4060/4070/4080/4090)' },
        { valor: 'AMD_RX_5000',   etiqueta: 'AMD Radeon RX 5000 Series' },
        { valor: 'AMD_RX_6000',   etiqueta: 'AMD Radeon RX 6000 Series' },
        { valor: 'AMD_RX_7000',   etiqueta: 'AMD Radeon RX 7000 Series' },
        { valor: 'INTEL_ARC',     etiqueta: 'Intel Arc' },
        { valor: 'GPU_INTEGRADA', etiqueta: 'GPU Integrada (sin tarjeta dedicada)' },
        { valor: 'OTRA',          etiqueta: 'Otra' },
      ],
    },
    { id: 'fuentePoderWatts', tipo: 'select', label: 'Fuente de poder', placeholder: 'Selecciona...', requerido: true, ancho: 'half', sistema: true,
      opciones: [
        { valor: 'MENOS_500W', etiqueta: 'Menos de 500W' },
        { valor: 'W500_649',   etiqueta: '500W – 649W' },
        { valor: 'W650_749',   etiqueta: '650W – 749W' },
        { valor: 'W750_849',   etiqueta: '750W – 849W' },
        { valor: 'W850_999',   etiqueta: '850W – 999W' },
        { valor: 'MAS_1000W',  etiqueta: '1000W o más' },
        { valor: 'NO_SE',      etiqueta: 'No sé / No tengo' },
      ],
    },
    { id: 'fotoExterior', tipo: 'file', label: 'Foto exterior (gabinete / setup)', hint: 'Vista frontal o general de tu setup',             requerido: true, ancho: 'half',  sistema: true },
    { id: 'fotoInterior', tipo: 'file', label: 'Foto interior (componentes)',        hint: 'Interior del gabinete con componentes visibles', requerido: true, ancho: 'half',  sistema: true },
    { id: 'historia',    tipo: 'textarea', label: '¿Por qué mereces el Gran Upgrade?', placeholder: 'Comparte tu historia, tu pasión por la tecnología y por qué tu setup necesita un upgrade...', requerido: true, ancho: 'full', sistema: true, maxPalabras: 150 },
    { id: 'aceptaTyC',       tipo: 'checkbox', label: 'Acepto los Términos y Condiciones del concurso', url: '#tyc', requerido: true,  ancho: 'full', sistema: true },
    { id: 'aceptaMarketing', tipo: 'checkbox', label: 'Acepto recibir comunicaciones comerciales de NVIDIA, ASUS y ComputerShop',          requerido: false, ancho: 'full', sistema: true },
  ],
};

// Strip absolute localhost origins from stored URL fields (dev leftovers)
function sanitizeUrls(obj) {
  if (typeof obj === 'string') return obj.replace(/^https?:\/\/localhost:\d+/, '');
  if (Array.isArray(obj))     return obj.map(sanitizeUrls);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = sanitizeUrls(obj[k]);
    return out;
  }
  return obj;
}

async function readContestSettings() {
  try {
    const row = await prisma.contestSettings.findUnique({ where: { id: 'singleton' } });
    const stored = row?.data ?? {};
    const merged = { ...DEFAULT_SETTINGS, ...stored };

    // System campos must always be present. If DB has empty/missing campos (e.g. first save
    // before the form builder was opened), reconstruct from defaults preserving stored order
    // and any label/placeholder overrides the admin may have saved.
    const storedCampos = Array.isArray(stored.campos) ? stored.campos : [];
    if (storedCampos.length === 0) {
      // Nothing stored — use full defaults
      merged.campos = DEFAULT_SETTINGS.campos;
    } else {
      const storedIds = new Set(storedCampos.map((c) => c.id));
      const missingSystems = DEFAULT_SETTINGS.campos.filter((c) => !storedIds.has(c.id));
      merged.campos = [
        ...storedCampos.map((c) => {
          if (!c.sistema) return c;
          const def = DEFAULT_SETTINGS.campos.find((d) => d.id === c.id);
          // Merge: default provides structure, stored provides overrides; id/tipo/sistema immutable
          return def ? { ...def, ...c, id: def.id, tipo: def.tipo, sistema: true } : c;
        }),
        ...missingSystems,
      ];
    }

    // Ensure nombre + apellidos are always side-by-side when both exist
    if (merged.campos.some((c) => c.id === 'nombre') && merged.campos.some((c) => c.id === 'apellidos')) {
      merged.campos = merged.campos.map((c) =>
        (c.id === 'nombre' || c.id === 'apellidos') ? { ...c, ancho: 'half' } : c
      );
    }

    return sanitizeUrls(merged);
  } catch (err) {
    console.error('[readContestSettings]', err.message);
    return { ...DEFAULT_SETTINGS };
  }
}

// GET /api/contest/settings  (pública)
router.get('/settings', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await readContestSettings());
});

// ─── OG preview for social crawlers (served by nginx bot-detection) ────────────
function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function stripHtml(str) {
  return String(str ?? '').replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
}
router.get('/og', async (_req, res) => {
  const s = await readContestSettings();
  const BASE = process.env.PUBLIC_URL || 'https://quiztroyer.istavnile.cloud';
  const title = esc(`${s.titulo || 'El Gran Upgrade'} · Concurso`);
  const desc  = esc(stripHtml(s.subtitulo) || 'Muéstranos tu PC y cuéntanos tu historia. ¡El mejor setup ganará un upgrade épico!');
  const badge = esc(s.badge || '');
  // Use imagenHero (uploaded jpg/png) as thumbnail; fall back to generic og-image
  const rawImg = s.imagenHero && s.imagenHero.trim() ? s.imagenHero.trim() : `${BASE}/og-image.svg`;
  const image = rawImg.startsWith('http') ? esc(rawImg) : esc(`${BASE}${rawImg}`);
  const pageUrl = esc(`${BASE}/concursos/el-gran-upgrade`);

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta property="og:type"        content="website">
  <meta property="og:site_name"   content="Quiztroyer">
  <meta property="og:title"       content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image"       content="${image}">
  <meta property="og:image:width"  content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url"         content="${pageUrl}">
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image"       content="${image}">
</head>
<body>
  <h1>${title}</h1>
  <p>${desc}</p>
  ${badge ? `<p>${badge}</p>` : ''}
  <a href="${pageUrl}">Ver concurso completo</a>
</body>
</html>`);
});

// Registration is controlled by the admin toggle (registrationOpen in settings)
async function isRegistrationOpen() {
  const s = await readContestSettings();
  return s.registrationOpen === true;
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

// IDs de campos del sistema que mapean a columnas DB
const SYSTEM_CAMPO_IDS = new Set([
  'nombre', 'email', 'telefono', 'procesador', 'graficaActual',
  'fuentePoderWatts', 'fotoExterior', 'fotoInterior', 'historia',
  'aceptaTyC', 'aceptaMarketing',
]);

// ─── POST /api/contest/register ───────────────────────────────────────────────
router.post(
  '/register',
  contestUpload.fields([
    { name: 'fotoExterior', maxCount: 1 },
    { name: 'fotoInterior', maxCount: 1 },
  ]),
  async (req, res) => {
    if (!(await isRegistrationOpen())) {
      if (req.files) Object.values(req.files).flat().forEach((f) => fs.unlink(f.path, () => {}));
      return res.status(403).json({ error: 'Las inscripciones no están abiertas en este momento.' });
    }

    const settings = await readContestSettings();
    const camposConfig = settings.campos || [];

    const { nombre, email, telefono, procesador, graficaActual, fuentePoderWatts, historia, aceptaTyC, aceptaMarketing } = req.body;

    // Validar campos del sistema
    const missing = [];
    if (!nombre?.trim())    missing.push('nombre');
    if (!email?.trim())     missing.push('email');
    if (!telefono?.trim())  missing.push('telefono');
    if (!procesador)        missing.push('procesador');
    if (!graficaActual)     missing.push('graficaActual');
    if (!fuentePoderWatts)  missing.push('fuentePoderWatts');
    if (!historia?.trim())  missing.push('historia');
    if (missing.length) return res.status(400).json({ error: `Campos requeridos: ${missing.join(', ')}` });

    if (aceptaTyC !== 'true' && aceptaTyC !== true)
      return res.status(400).json({ error: 'Debes aceptar los Términos y Condiciones.' });

    const historiaConfig = camposConfig.find((c) => c.id === 'historia');
    const maxPalabras = historiaConfig?.maxPalabras || 150;
    if (countWords(historia) > maxPalabras)
      return res.status(400).json({ error: `La historia no puede superar ${maxPalabras} palabras.` });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Email inválido.' });

    if (!req.files?.fotoExterior?.[0] || !req.files?.fotoInterior?.[0])
      return res.status(400).json({ error: 'Debes subir la foto exterior e interior de tu PC.' });

    // Validar y recolectar campos extra (no sistema)
    const camposExtra = {};
    for (const campo of camposConfig.filter((c) => !c.sistema)) {
      const val = req.body[campo.id];
      if (campo.requerido && (!val || (Array.isArray(val) ? val.length === 0 : !String(val).trim()))) {
        return res.status(400).json({ error: `El campo "${campo.label}" es requerido.` });
      }
      if (val !== undefined && val !== null && val !== '') camposExtra[campo.id] = val;
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
          procesador, graficaActual, fuentePoderWatts,
          fotoExteriorUrl, fotoInteriorUrl,
          historia: historia.trim(),
          aceptaTyC: true,
          aceptaMarketing: aceptaMarketing === 'true' || aceptaMarketing === true,
          camposExtra: Object.keys(camposExtra).length ? camposExtra : undefined,
        },
      });
      res.status(201).json({ ok: true, id: lead.id });
    } catch (err) {
      [req.files.fotoExterior[0], req.files.fotoInterior[0]].forEach((f) => fs.unlink(f.path, () => {}));
      if (err.code === 'P2002') return res.status(409).json({ error: 'Ya existe una inscripción con ese email.' });
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
module.exports.readContestSettings = readContestSettings;
module.exports.sanitizeUrls = sanitizeUrls;
