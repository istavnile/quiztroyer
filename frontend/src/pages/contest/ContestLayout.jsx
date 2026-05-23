import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BASE = '/concursos/el-gran-upgrade';

// ─── Colores corporativos ──────────────────────────────────────────────────────
// Verde NVIDIA: #76B900   Rojo ASUS ROG: #e61f30   Fondo: #0a0a0a

export default function ContestLayout({ children }) {
  const { pathname } = useLocation();

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
        style={{ background: 'rgba(0,0,0,0.85)', borderBottom: '2px solid #76B900' }}
        className="sticky top-0 z-50 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={BASE} className="flex items-center gap-3 no-underline">
            <span
              style={{ background: '#76B900', color: '#000', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.1em', padding: '4px 10px', borderRadius: '4px' }}
            >
              NVIDIA
            </span>
            <span
              style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.04em' }}
            >
              El Gran Upgrade
            </span>
          </Link>

          <nav className="flex gap-4 text-sm font-medium">
            <NavLink to={BASE} active={pathname === BASE}>Inicio</NavLink>
            <NavLink to={`${BASE}/inscripcion`} active={pathname.includes('/inscripcion')}>
              Inscripción
            </NavLink>
            <NavLink to={`${BASE}/votacion`} active={pathname.includes('/votacion')}>
              Votación
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Glow superior */}
      <div
        style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '60vw', height: '2px', background: '#76B900',
          boxShadow: '0 0 80px 20px rgba(118,185,0,0.35)',
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
          <span style={{ color: '#76B900' }}>NVIDIA</span>,{' '}
          <span style={{ color: '#e61f30' }}>ASUS ROG</span> y{' '}
          <strong className="text-gray-400">ComputerShop</strong>
        </p>
        <p className="mt-1">
          Inscripciones del <strong className="text-white">1 al 7 de junio de 2026</strong> &nbsp;·&nbsp;
          Gran Final en vivo: <strong className="text-white">12 de junio de 2026</strong>
        </p>
      </footer>
    </div>
  );
}

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      style={{
        color: active ? '#76B900' : '#9ca3af',
        borderBottom: active ? '2px solid #76B900' : '2px solid transparent',
        paddingBottom: '2px',
        textDecoration: 'none',
        transition: 'color .2s',
      }}
    >
      {children}
    </Link>
  );
}
