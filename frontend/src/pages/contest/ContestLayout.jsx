import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

function GamingCursor({ accent = '#76B900' }) {
  const wrapRef = useRef(null);
  const svgRef  = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const svg  = svgRef.current;
    if (!wrap) return;

    let hovering = false;

    const onMove = (e) => {
      wrap.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
    };

    const onOver = (e) => {
      const hit = !!e.target.closest('a, button, [role="button"], input, select, textarea');
      if (hit === hovering) return;
      hovering = hit;
      if (!svg) return;
      svg.style.transform = hit ? 'scale(1.7)' : 'scale(1)';
      svg.style.filter    = hit
        ? `drop-shadow(0 0 6px ${accent}) drop-shadow(0 0 14px ${accent}88)`
        : 'none';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
    };
  }, [accent]);

  return (
    <div
      ref={wrapRef}
      style={{ position: 'fixed', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none', transform: 'translate(-300px, -300px)', willChange: 'transform' }}
    >
      <svg
        ref={svgRef}
        width="40" height="40" viewBox="0 0 40 40"
        style={{ display: 'block', transition: 'transform 0.11s ease, filter 0.11s ease', transformOrigin: 'center' }}
      >
        <line x1="4" y1="4" x2="10" y2="4"  stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="4" y1="4" x2="4"  y2="10" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="36" y1="4" x2="30" y2="4"  stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="36" y1="4" x2="36" y2="10" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="4" y1="36" x2="10" y2="36" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="4" y1="36" x2="4"  y2="30" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="36" y1="36" x2="30" y2="36" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="36" y1="36" x2="36" y2="30" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="20" y1="4"  x2="20" y2="14" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="26" x2="20" y2="36" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4"  y1="20" x2="14" y2="20" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="20" x2="36" y2="20" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="20" r="1.5" fill={accent} />
      </svg>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 5, borderRadius: '50%', border: `1px dashed ${accent}55`, pointerEvents: 'none' }}
      />
      <motion.div
        animate={{ scale: [0.7, 1.4], opacity: [0.55, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.6 }}
        style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `1px solid ${accent}`, pointerEvents: 'none' }}
      />
    </div>
  );
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
      style={{ background: '#06070e', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', cursor: 'none' }}
      className="text-white"
    >
      {/* Force cursor:none on all interactive elements — prevents browser pointer showing on links/buttons */}
      <style>{`a, button, input, select, textarea, label, [role="button"] { cursor: none !important; }`}</style>

      <GamingCursor accent={accentColor} />

      {/* Ambient top glow — extends well below the hero fold */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '75vh',
        background: `radial-gradient(ellipse 90% 80% at 50% -10%, ${accentColor}0d, transparent 70%)`,
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Tactical dot grid */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Scanlines */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.13) 2px, rgba(0,0,0,.13) 4px)',
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

            {/* Primary sponsor — bare logo or colored text badge */}
            {primary.logoUrl ? (
              <img
                src={primary.logoUrl}
                alt={primary.nombre || ''}
                style={{ height: `${Math.min(primary.logoAltura || 28, 34)}px`, maxWidth: '110px', width: 'auto', objectFit: 'contain', display: 'block', flexShrink: 0 }}
              />
            ) : (
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
                <span style={{ color: badgeTextClr, fontWeight: 900, fontSize: '0.72rem', letterSpacing: '0.1em', whiteSpace: 'nowrap', lineHeight: 1 }}>
                  {primary.nombre || 'NVIDIA'}
                </span>
              </div>
            )}

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
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-10" style={{ flex: 1 }}>
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
  const [hov, setHov] = useState(false);
  const lit = active || hov;
  return (
    <Link
      to={to}
      style={{ textDecoration: 'none', position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Diagonal hover fill */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `${accent}0e`,
        clipPath: 'polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 0 100%)',
        opacity: hov && !active ? 1 : 0,
        transition: 'opacity 0.14s',
      }} />

      <div style={{ padding: '8px 10px 7px', display: 'flex', alignItems: 'center', gap: '5px', position: 'relative' }}>
        {/* // prefix — only on active */}
        <span style={{
          fontFamily: 'monospace', fontSize: '0.55rem',
          color: `${accent}66`, lineHeight: 1,
          opacity: active ? 1 : 0, transition: 'opacity 0.2s',
          width: active ? 'auto' : 0, overflow: 'hidden', whiteSpace: 'nowrap',
        }}>//</span>

        <span style={{
          fontSize: '0.68rem', fontWeight: 800,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          fontFamily: 'monospace',
          color: lit ? accent : '#374151',
          filter: lit ? `drop-shadow(0 0 7px ${accent}99)` : 'none',
          transition: 'color 0.15s, filter 0.15s',
        }}>
          {children}
        </span>
      </div>

      {/* Active bottom bar — pulsing glow */}
      {active && (
        <motion.div
          animate={{ boxShadow: [`0 0 5px ${accent}88`, `0 0 16px ${accent}`, `0 0 5px ${accent}88`] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: 0, left: 8, right: 8, height: '2px',
            background: accent,
          }}
        />
      )}

      {/* Hover bottom bar — slides in from left */}
      {!active && (
        <div style={{
          position: 'absolute', bottom: 0, left: 8, right: 8, height: '1px',
          background: `${accent}55`,
          transform: `scaleX(${hov ? 1 : 0})`,
          transition: 'transform 0.18s ease',
          transformOrigin: 'left',
        }} />
      )}
    </Link>
  );
}
