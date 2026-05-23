import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const BASE = '/concursos/el-gran-upgrade';
const API  = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

  useEffect(() => {
    fetch(`${API}/api/contest/settings`)
      .then((r) => r.json())
      .then((data) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch(() => {});
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
      {/* Scanlines decorativas */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.18) 2px, rgba(0,0,0,.18) 4px)',
        }}
      />

      {/* Header */}
      <header
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: `2px solid ${accentColor}` }}
        className="sticky top-0 z-50 backdrop-blur-md"
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
      </header>

      {/* Glow superior */}
      <div
        style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '60vw', height: '2px', background: accentColor,
          boxShadow: `0 0 80px 20px ${accentColor}59`,
          zIndex: 40,
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
