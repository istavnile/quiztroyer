import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ContestLayout from './ContestLayout';
import { isRegistrationOpen } from '../../lib/contestConstants';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const DEFAULT = {
  titulo: 'El Gran Upgrade',
  subtitulo: 'Muéstranos tu PC y cuéntanos tu historia. Los mejores setups ganarán un upgrade épico con hardware NVIDIA y ASUS ROG.',
  badge: 'CONCURSO PATROCINADO POR NVIDIA · ASUS ROG · COMPUTERSHOP',
  imagenHero: '',
  textoFechaApertura: '1 de junio, 2026',
  textoFechaCierre:   '7 de junio, 23:59',
  textoFechaFinal:    '12 de junio, 2026',
  patrocinadores: [
    { nombre: 'NVIDIA',       logoUrl: '', color: '#76B900' },
    { nombre: 'ASUS ROG',     logoUrl: '', color: '#e61f30' },
    { nombre: 'ComputerShop', logoUrl: '', color: '#ffffff' },
  ],
  pasos: [
    { numero: '01', titulo: 'Inscríbete',            descripcion: 'Llena el formulario con los datos de tu PC, sube fotos y cuenta tu historia en máximo 150 palabras.' },
    { numero: '02', titulo: 'Espera los finalistas', descripcion: 'Nuestro equipo revisará todas las participaciones y seleccionará los mejores setups.' },
    { numero: '03', titulo: 'Vota y comparte',       descripcion: 'Del 8 al 11 de junio, la comunidad vota por sus favoritos. ¡El ganador anunciado en vivo el 12 de junio!' },
  ],
  premios: [
    { posicion: '1er lugar', descripcion: 'ASUS NVIDIA GeForce RTX 5060 Ti', color: '#76B900', imagenUrl: '' },
  ],
};

const STEP_COLORS = ['#76B900', '#e61f30', '#facc15'];

const GAMING_CSS = `
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.9; }
    100% { transform: scale(3);   opacity: 0; }
  }
  @keyframes float-bob {
    0%,100% { transform: translateY(0px)   rotate(-1deg); }
    50%      { transform: translateY(-18px) rotate(1deg);  }
  }
  @keyframes hud-flicker {
    0%,94%,100% { opacity: 1;   }
    95%          { opacity: 0.2; }
    96%          { opacity: 1;   }
    97%          { opacity: 0.5; }
    98%          { opacity: 1;   }
  }
  .gaming-float   { animation: float-bob   3.8s ease-in-out infinite; }
  .gaming-flicker { animation: hud-flicker 7s   ease-in-out infinite; }
`;

/* ── HUD corner brackets ─────────────────────────────────────────── */
function HudCorners({ color, size = 20, thickness = 2 }) {
  const b = { background: color, position: 'absolute' };
  return (
    <>
      <div style={{ ...b, top: 0, left: 0,  width: size,      height: thickness }} />
      <div style={{ ...b, top: 0, left: 0,  width: thickness, height: size      }} />
      <div style={{ ...b, top: 0, right: 0, width: size,      height: thickness }} />
      <div style={{ ...b, top: 0, right: 0, width: thickness, height: size      }} />
      <div style={{ ...b, bottom: 0, left: 0,  width: size,      height: thickness }} />
      <div style={{ ...b, bottom: 0, left: 0,  width: thickness, height: size      }} />
      <div style={{ ...b, bottom: 0, right: 0, width: size,      height: thickness }} />
      <div style={{ ...b, bottom: 0, right: 0, width: thickness, height: size      }} />
    </>
  );
}

/* ── Pulsing concentric-ring dot ─────────────────────────────────── */
function PulsingDot({ color, size = 12 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {[1.4, 2].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `1px solid ${color}`,
          animation: `pulse-ring ${delay}s ease-out infinite`,
          animationDelay: `${i * 0.55}s`,
        }} />
      ))}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}, 0 0 18px ${color}66`,
      }} />
    </div>
  );
}

/* ── Particle canvas ─────────────────────────────────────────────── */
function useParticles(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size:    Math.random() * 1.3 + 0.25,
      vy:    -(Math.random() * 0.35 + 0.08),
      vx:     (Math.random() - 0.5) * 0.18,
      alpha:   Math.random() * 0.55 + 0.08,
      green:   Math.random() > 0.32,
    }));

    function frame() {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y += p.vy / h;
        p.x += p.vx / w;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02) p.x = 1.02;
        if (p.x >  1.02) p.x = -0.02;

        const px = p.x * w, py = p.y * h;
        const rgb = p.green ? '118,185,0' : '220,55,55';
        const r   = p.size * 5;
        const g   = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(${rgb},${p.alpha * 0.75})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${Math.min(p.alpha * 4, 1)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function ContestLanding() {
  const [s, setS]     = useState(DEFAULT);
  const canvasRef     = useRef(null);
  const open          = isRegistrationOpen();

  useEffect(() => {
    fetch(`${API}/api/contest/settings`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setS({ ...DEFAULT, ...data }))
      .catch((err) => console.warn('[contest-settings]', err));
  }, []);

  useParticles(canvasRef);

  const titleWords  = s.titulo.trim().split(/\s+/);
  const titleMain   = titleWords.slice(0, -1).join(' ');
  const titleAccent = titleWords.slice(-1)[0];
  const primary     = s.patrocinadores?.[0];
  const accent      = primary?.color || '#76B900';

  return (
    <ContestLayout>
      <style>{GAMING_CSS}</style>

      {/* ══════════ HERO ══════════════════════════════════════════════ */}
      <section style={{ position: 'relative', padding: '80px 0 56px', overflow: 'hidden', textAlign: 'center' }}>

        {/* Particle canvas */}
        <canvas ref={canvasRef} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Hero BG image */}
        {s.imagenHero && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
            <img src={s.imagenHero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0a0a0a)' }} />
          </div>
        )}

        {/* Breathing radial glow */}
        <motion.div
          animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.94, 1.06, 0.94] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${accent}22, transparent)`,
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>

          {/* Animated badge */}
          {s.badge && (
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '2rem' }}
            >
              <motion.span
                animate={{ borderColor: [`${accent}33`, `${accent}bb`, `${accent}33`] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                style={{
                  display: 'inline-block',
                  background: `${accent}0e`, border: `1px solid ${accent}44`,
                  color: accent, fontSize: '0.61rem', letterSpacing: '0.22em',
                  fontWeight: 800, padding: '5px 18px', borderRadius: '2px',
                }}
              >
                {s.badge}
              </motion.span>
            </motion.div>
          )}

          {/* Glitch title */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', margin: 0 }}
            >
              {titleMain && <>{titleMain} </>}
              <motion.span
                animate={{ textShadow: [
                  `0 0 40px ${accent}55, 0 0 80px ${accent}1a`,
                  `0 0 70px ${accent}99, 0 0 140px ${accent}33`,
                  `0 0 40px ${accent}55, 0 0 80px ${accent}1a`,
                ] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ color: accent }}
              >
                {titleAccent}
              </motion.span>
            </motion.h1>

            {/* Glitch layer R */}
            <motion.div aria-hidden="true"
              animate={{
                opacity:   [0, 0, 0.55, 0],
                x:         [0, 0, -5,   0],
                clipPath:  ['inset(40% 0 40% 0)', 'inset(40% 0 40% 0)', 'inset(18% 0 55% 0)', 'inset(0% 0 0% 0)'],
              }}
              transition={{ duration: 5.5, repeat: Infinity, repeatDelay: 2.5, times: [0, 0.58, 0.63, 0.68] }}
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none',
                fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em',
                color: '#e61f30',
              }}
            >
              {titleMain && <>{titleMain} </>}<span>{titleAccent}</span>
            </motion.div>

            {/* Glitch layer C */}
            <motion.div aria-hidden="true"
              animate={{
                opacity:   [0, 0, 0.45, 0],
                x:         [0, 0,  6,   0],
                clipPath:  ['inset(60% 0 18% 0)', 'inset(60% 0 18% 0)', 'inset(68% 0 4% 0)', 'inset(0% 0 0% 0)'],
              }}
              transition={{ duration: 5.5, repeat: Infinity, repeatDelay: 2.5, delay: 0.06, times: [0, 0.58, 0.63, 0.68] }}
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none',
                fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em',
                color: '#00cfff',
              }}
            >
              {titleMain && <>{titleMain} </>}<span>{titleAccent}</span>
            </motion.div>
          </div>

          {s.subtitulo && (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              style={{ color: '#6b7280', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.75 }}
            >
              {s.subtitulo}
            </motion.p>
          )}

          {/* Sponsor logos */}
          {s.patrocinadores?.some((p) => p.logoUrl) && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-8 mb-10 flex-wrap"
            >
              {s.patrocinadores.filter((p) => p.logoUrl).map((p) => (
                <img key={p.nombre} src={p.logoUrl} alt={p.nombre}
                  style={{ height: '30px', objectFit: 'contain', opacity: 0.75 }} />
              ))}
            </motion.div>
          )}

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {open ? (
              <Link to="/concursos/el-gran-upgrade/inscripcion" style={{ textDecoration: 'none' }}>
                <motion.button
                  animate={{ boxShadow: [`0 0 28px ${accent}44`, `0 0 58px ${accent}99`, `0 0 28px ${accent}44`] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background: accent, color: '#000', fontWeight: 900,
                    padding: '15px 44px', borderRadius: '3px', fontSize: '0.9rem',
                    border: 'none', cursor: 'pointer', letterSpacing: '0.08em',
                    textTransform: 'uppercase', position: 'relative', overflow: 'hidden',
                  }}
                >
                  <motion.div
                    animate={{ left: ['-80%', '130%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', top: 0, width: '60%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                  Inscribirme ahora
                </motion.button>
              </Link>
            ) : (
              <motion.span
                animate={{ borderColor: [`${accent}22`, `${accent}55`, `${accent}22`] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  display: 'inline-block',
                  background: `${accent}08`, border: `1px solid ${accent}33`,
                  color: accent, padding: '15px 40px', borderRadius: '3px',
                  fontSize: '0.9rem', fontWeight: 700,
                }}
              >
                Inscripciones abren el {s.textoFechaApertura}
              </motion.span>
            )}
            <Link to="/concursos/el-gran-upgrade/votacion" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'transparent', color: '#9ca3af',
                border: '1px solid rgba(255,255,255,0.12)',
                fontWeight: 600, padding: '15px 40px', borderRadius: '3px',
                fontSize: '0.9rem', cursor: 'pointer',
                transition: 'color .2s, border-color .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
              >
                Ver finalistas y votar
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════ FECHAS ════════════════════════════════════════════ */}
      <section style={{ marginTop: '48px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'APERTURA',           date: s.textoFechaApertura, color: '#76B900', live: false },
            { label: 'CIERRE',             date: s.textoFechaCierre,   color: '#e61f30', live: false },
            { label: 'GRAN FINAL EN VIVO', date: s.textoFechaFinal,    color: '#facc15', live: true  },
          ].map(({ label, date, color, live }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              style={{
                padding: '32px 24px', position: 'relative', overflow: 'hidden',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              {/* Animated bottom bar */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5], boxShadow: [`0 0 6px ${color}55`, `0 0 18px ${color}`, `0 0 6px ${color}55`] }}
                transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: color }}
              />
              {/* Ambient tint */}
              <motion.div
                animate={{ opacity: [0.02, 0.06, 0.02] }}
                transition={{ duration: 3 + i * 0.6, repeat: Infinity }}
                style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, ${color}10 0%, transparent 100%)`,
                  pointerEvents: 'none',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                {live && (
                  <motion.div
                    animate={{ opacity: [1, 0.15, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                    style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }}
                  />
                )}
                <p style={{ color: '#374151', fontSize: '0.60rem', letterSpacing: '0.22em', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
                  {label}
                </p>
              </div>
              <p style={{ color, fontSize: 'clamp(1rem, 2.2vw, 1.55rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>
                {date}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ CÓMO PARTICIPAR ═══════════════════════════════════ */}
      {s.pasos?.length > 0 && (
        <section style={{ marginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '64px' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07))' }} />
            <span style={{ color: '#374151', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Cómo participar
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.07), transparent)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', position: 'relative' }}>

            {/* Animated data-transfer connector */}
            <motion.div
              animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', top: '6px',
                left: 'calc(16.6% + 8px)', right: 'calc(16.6% + 8px)',
                height: '1px',
                background: `linear-gradient(90deg, transparent 0%, ${STEP_COLORS[0]}77 25%, ${STEP_COLORS[1]}55 50%, ${STEP_COLORS[2]}77 75%, transparent 100%)`,
                backgroundSize: '200% 100%',
                zIndex: 0,
              }}
            />

            {s.pasos.map(({ numero, titulo, descripcion }, i) => {
              const clr = STEP_COLORS[i % STEP_COLORS.length];
              return (
                <motion.div
                  key={numero}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.14 }}
                  style={{ padding: i === 0 ? '0 32px 0 0' : '0 32px 0 32px', position: 'relative' }}
                >
                  <div style={{ marginBottom: '28px', position: 'relative', zIndex: 1, display: 'inline-block' }}>
                    <PulsingDot color={clr} size={12} />
                  </div>

                  <div aria-hidden="true" style={{
                    position: 'absolute', top: '-20px',
                    left: i === 0 ? '-12px' : '20px',
                    fontSize: '9rem', fontWeight: 900, lineHeight: 1,
                    color: clr, opacity: 0.05,
                    userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em',
                  }}>
                    {numero}
                  </div>

                  <p style={{ color: clr, fontSize: '0.60rem', fontWeight: 800, letterSpacing: '0.2em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Paso {numero}
                  </p>
                  <h3 style={{ color: '#f9fafb', fontSize: '1.15rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>
                    {titulo}
                  </h3>
                  <p style={{ color: '#4b5563', fontSize: '0.88rem', lineHeight: 1.75, margin: 0 }}>
                    {descripcion}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ══════════ PREMIO ════════════════════════════════════════════ */}
      {s.premios?.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ marginTop: '100px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '48px' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07))' }} />
            <span style={{ color: '#374151', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Premio
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.07), transparent)' }} />
          </div>

          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {s.premios.map(({ posicion, descripcion, color, imagenUrl }) => (
              <div key={posicion} style={{ position: 'relative', overflow: 'hidden' }}>
                <HudCorners color={color} size={22} />

                {/* Sweeping highlight */}
                <motion.div
                  animate={{ left: ['-80%', '130%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', top: 0, width: '50%', height: '100%',
                    background: `linear-gradient(90deg, transparent, ${color}14, transparent)`,
                    pointerEvents: 'none', zIndex: 1,
                  }}
                />

                {/* Pulsing left border glow */}
                <motion.div
                  animate={{ boxShadow: [`-4px 0 12px ${color}44`, `-4px 0 28px ${color}99`, `-4px 0 12px ${color}44`] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    display: 'flex', alignItems: 'stretch',
                    borderLeft: `3px solid ${color}`,
                    background: `linear-gradient(90deg, ${color}0d 0%, transparent 60%)`,
                  }}
                >
                  <div style={{ flex: 1, padding: '36px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <PulsingDot color={color} size={8} />
                      <p style={{ color, fontSize: '0.60rem', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0 }}>
                        {posicion}
                      </p>
                    </div>
                    <motion.p
                      animate={{ textShadow: [`0 0 20px ${color}00`, `0 0 40px ${color}44`, `0 0 20px ${color}00`] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        color: '#f9fafb', fontSize: 'clamp(1.3rem, 3vw, 2rem)',
                        fontWeight: 900, lineHeight: 1.15, margin: 0, letterSpacing: '-0.02em',
                      }}
                    >
                      {descripcion}
                    </motion.p>
                  </div>

                  {imagenUrl && (
                    <div style={{
                      flexShrink: 0, width: '220px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '20px', borderLeft: `1px solid ${color}18`,
                    }}>
                      <img
                        src={imagenUrl} alt={descripcion}
                        className="gaming-float"
                        style={{ maxWidth: '100%', maxHeight: '155px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ══════════ CTA FINAL ═════════════════════════════════════════ */}
      {open && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ marginTop: '100px', textAlign: 'center', paddingBottom: '32px' }}
        >
          <p style={{ color: '#374151', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '20px' }}>
            No te quedes fuera
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '16px' }}>
            ¿Listo para el{' '}
            <motion.span
              animate={{ textShadow: [`0 0 30px ${accent}33`, `0 0 70px ${accent}88`, `0 0 30px ${accent}33`] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ color: accent }}
            >
              Gran Upgrade?
            </motion.span>
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '44px', fontSize: '0.95rem' }}>
            Las inscripciones cierran el {s.textoFechaCierre}.
          </p>

          <Link to="/concursos/el-gran-upgrade/inscripcion" style={{ textDecoration: 'none' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* Expanding pulse rings */}
              {[0, 0.6, 1.2].map((delay, i) => (
                <motion.div key={i}
                  animate={{ scale: [1, 2.8], opacity: [0.45, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: '3px',
                    border: `1px solid ${accent}`, pointerEvents: 'none',
                  }}
                />
              ))}

              <motion.button
                animate={{ boxShadow: [`0 0 35px ${accent}44`, `0 0 75px ${accent}99`, `0 0 35px ${accent}44`] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: accent, color: '#000', fontWeight: 900,
                  padding: '18px 60px', borderRadius: '3px', fontSize: '1rem',
                  border: 'none', cursor: 'pointer', letterSpacing: '0.08em',
                  textTransform: 'uppercase', position: 'relative', overflow: 'hidden',
                }}
              >
                <motion.div
                  animate={{ left: ['-80%', '130%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.9, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', top: 0, width: '60%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)',
                    pointerEvents: 'none',
                  }}
                />
                Inscribirme ahora
              </motion.button>
            </div>
          </Link>
        </motion.section>
      )}
    </ContestLayout>
  );
}
