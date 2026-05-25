import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

function useParticles(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(),
      size: Math.random() * 1.3 + 0.25,
      vy: -(Math.random() * 0.35 + 0.08),
      vx: (Math.random() - 0.5) * 0.18,
      alpha: Math.random() * 0.55 + 0.08,
      green: Math.random() > 0.32,
    }));
    function frame() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y += p.vy / h; p.x += p.vx / w;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02) p.x = 1.02;
        if (p.x >  1.02) p.x = -0.02;
        const px = p.x * w, py = p.y * h;
        const rgb = p.green ? '118,185,0' : '220,55,55';
        const r = p.size * 5;
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(${rgb},${p.alpha * 0.75})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${Math.min(p.alpha * 4, 1)})`; ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
}

const BASE = '/concursos/el-gran-upgrade';
const API  = import.meta.env.VITE_API_URL || '';

const DEFAULT_SETTINGS = {
  titulo: 'El Gran Upgrade',
  patrocinadores: [
    { nombre: 'NVIDIA',       logoUrl: '', color: '#76B900' },
    { nombre: 'ASUS ROG',     logoUrl: '', color: '#e61f30' },
    { nombre: 'ComputerShop', logoUrl: '', color: '#ffffff' },
  ],
  textoFechaApertura: '1 de junio, 2026',
  textoFechaCierre:   '7 de junio, 23:59',
  textoFechaFinal:    '12 de junio, 2026',
};

// Returns true if the hex color is perceptually dark (needs white text over it)
function isDark(hex = '#000000') {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
  } catch { return true; }
}

export default function ContestLayout({ children }) {
  const { pathname } = useLocation();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const canvasRef = useRef(null);
  useParticles(canvasRef);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setNavVisible(y < lastScrollY.current || y < 80);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/contest/settings`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch((err) => console.warn('[contest-layout-settings]', err));
  }, []);

  const sponsors     = settings.patrocinadores || DEFAULT_SETTINGS.patrocinadores;
  const primary      = sponsors[0] || DEFAULT_SETTINGS.patrocinadores[0];
  const accentColor  = primary.color || '#76B900';
  const titulo       = settings.titulo || 'El Gran Upgrade';
  const badgeTextClr = isDark(accentColor) ? '#fff' : '#000';

  return (
    <div
      style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}
      className="text-white"
    >
      {/* Particle canvas — full viewport */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }} />

      {/* Scanlines decorativas */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.18) 2px, rgba(0,0,0,.18) 4px)',
        }}
      />

      {/* Header — hide on scroll down, show on scroll up */}
      <motion.header
        animate={{
          borderColor: [`${accentColor}88`, `${accentColor}ee`, `${accentColor}88`],
          y: navVisible ? 0 : -80,
          opacity: navVisible ? 1 : 0,
        }}
        transition={{ borderColor: { duration: 3, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 0.25, ease: 'easeInOut' }, opacity: { duration: 0.2 } }}
        style={{
          background: 'rgba(0,0,0,0.45)',
          borderBottom: `1px solid ${accentColor}55`,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={BASE} className="flex items-center gap-3 no-underline">

            {/* Primary sponsor badge — logo image or text fallback */}
            <div
              style={{
                background: accentColor,
                borderRadius: '4px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px',
                height: '28px',
                flexShrink: 0,
              }}
            >
              {primary.logoUrl ? (
                <img
                  src={primary.logoUrl}
                  alt={primary.nombre || ''}
                  style={{
                    height: '18px',
                    maxWidth: '80px',
                    width: 'auto',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
              ) : (
                <span
                  style={{
                    color: badgeTextClr,
                    fontWeight: 900,
                    fontSize: '0.72rem',
                    letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                  }}
                >
                  {primary.nombre || 'NVIDIA'}
                </span>
              )}
            </div>

            {/* Campaign title */}
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.04em' }}>
              {titulo}
            </span>
          </Link>

          <nav className="flex gap-4 text-sm font-medium">
            <NavLink to={BASE}                      active={pathname === BASE}                     accent={accentColor}>Inicio</NavLink>
            <NavLink to={`${BASE}/inscripcion`}     active={pathname.includes('/inscripcion')}     accent={accentColor}>Inscripción</NavLink>
            <NavLink to={`${BASE}/votacion`}        active={pathname.includes('/votacion')}        accent={accentColor}>Votación</NavLink>
          </nav>
        </div>
      </motion.header>

      {/* Glow superior — animated pulse */}
      <motion.div
        animate={{
          opacity:    [0.7, 1, 0.7],
          boxShadow:  [`0 0 40px 12px ${accentColor}33`, `0 0 100px 30px ${accentColor}77`, `0 0 40px 12px ${accentColor}33`],
          scaleX:     [0.9, 1.05, 0.9],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'fixed', top: 0, left: '50%', translateX: '-50%',
          width: '60vw', height: '2px', background: accentColor,
          zIndex: 40,
          transformOrigin: 'center',
          transform: 'translateX(-50%)',
        }}
      />

      {/* Contenido */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{ borderTop: '1px solid #1a1a1a', background: '#050505' }}
        className="mt-20 py-8 text-center text-xs text-gray-600"
      >
        <p>
          Concurso organizado por{' '}
          {sponsors.map((s, i) => (
            <span key={i}>
              {i > 0 && <span className="text-gray-700">{i < sponsors.length - 1 ? ', ' : ' y '}</span>}
              <span style={{ color: s.color }}>{s.nombre}</span>
            </span>
          ))}
        </p>
        <p className="mt-1">
          Inscripciones del{' '}
          <strong className="text-white">{settings.textoFechaApertura}</strong>
          {' '}al{' '}
          <strong className="text-white">{settings.textoFechaCierre}</strong>
          {' '}&nbsp;·&nbsp;{' '}
          Gran Final en vivo:{' '}
          <strong className="text-white">{settings.textoFechaFinal}</strong>
        </p>
      </footer>
    </div>
  );
}

function NavLink({ to, children, active, accent }) {
  return (
    <Link
      to={to}
      style={{
        color: active ? accent : '#9ca3af',
        borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
        paddingBottom: '2px',
        textDecoration: 'none',
        transition: 'color .2s',
      }}
    >
      {children}
    </Link>
  );
}
