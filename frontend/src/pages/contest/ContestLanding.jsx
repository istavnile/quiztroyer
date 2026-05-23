import React, { useEffect, useState } from 'react';
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

const inView = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0 },
};

const STEP_COLORS = ['#76B900', '#e61f30', '#facc15'];

export default function ContestLanding() {
  const [s, setS] = useState(DEFAULT);
  const open = isRegistrationOpen();

  useEffect(() => {
    fetch(`${API}/api/contest/settings`)
      .then((r) => r.json())
      .then((data) => setS({ ...DEFAULT, ...data }))
      .catch(() => {});
  }, []);

  const titleWords  = s.titulo.trim().split(/\s+/);
  const titleMain   = titleWords.slice(0, -1).join(' ');
  const titleAccent = titleWords.slice(-1)[0];
  const primary     = s.patrocinadores?.[0];
  const accent      = primary?.color || '#76B900';

  return (
    <ContestLayout settings={s}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative py-20 text-center" style={{ overflow: 'hidden' }}>

        {/* Hero background image */}
        {s.imagenHero && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
            <img src={s.imagenHero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0a0a0a)' }} />
          </div>
        )}

        {/* Radial glow behind title */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `radial-gradient(ellipse 60% 60% at 50% 0%, ${accent}18, transparent)`,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {s.badge && (
            <motion.div variants={inView} initial="hidden" animate="show" transition={{ duration: 0.5 }}>
              <span style={{
                display: 'inline-block',
                background: `${accent}14`, border: `1px solid ${accent}44`,
                color: accent, fontSize: '0.65rem', letterSpacing: '0.2em',
                fontWeight: 800, padding: '5px 16px', borderRadius: '2px', marginBottom: '2rem',
              }}>
                {s.badge}
              </span>
            </motion.div>
          )}

          <motion.h1
            variants={inView} initial="hidden" animate="show" transition={{ duration: 0.6, delay: 0.05 }}
            style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', margin: '0 0 1.5rem' }}
          >
            {titleMain && <>{titleMain} </>}
            <span style={{ color: accent, textShadow: `0 0 60px ${accent}66` }}>{titleAccent}</span>
          </motion.h1>

          {s.subtitulo && (
            <motion.p
              variants={inView} initial="hidden" animate="show" transition={{ duration: 0.6, delay: 0.1 }}
              style={{ color: '#6b7280', fontSize: '1.1rem', maxWidth: '540px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}
            >
              {s.subtitulo}
            </motion.p>
          )}

          {s.patrocinadores?.some((p) => p.logoUrl) && (
            <motion.div
              variants={inView} initial="hidden" animate="show" transition={{ duration: 0.5, delay: 0.15 }}
              className="flex items-center justify-center gap-8 mb-10 flex-wrap"
            >
              {s.patrocinadores.filter((p) => p.logoUrl).map((p) => (
                <img key={p.nombre} src={p.logoUrl} alt={p.nombre}
                  style={{ height: '32px', objectFit: 'contain', opacity: 0.75, filter: 'brightness(1.1)' }} />
              ))}
            </motion.div>
          )}

          <motion.div
            variants={inView} initial="hidden" animate="show" transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {open ? (
              <Link to="/concursos/el-gran-upgrade/inscripcion" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: accent, color: '#000', fontWeight: 900,
                  padding: '15px 40px', borderRadius: '3px', fontSize: '0.95rem',
                  border: 'none', cursor: 'pointer', letterSpacing: '0.05em',
                  boxShadow: `0 0 40px ${accent}55`, textTransform: 'uppercase',
                  transition: 'transform .15s, box-shadow .15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = `0 0 60px ${accent}88`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = `0 0 40px ${accent}55`; }}
                >
                  Inscribirme ahora
                </button>
              </Link>
            ) : (
              <span style={{
                display: 'inline-block',
                background: `${accent}0a`, border: `1px solid ${accent}33`,
                color: accent, padding: '15px 40px', borderRadius: '3px',
                fontSize: '0.95rem', fontWeight: 700,
              }}>
                Inscripciones abren el {s.textoFechaApertura}
              </span>
            )}
            <Link to="/concursos/el-gran-upgrade/votacion" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'transparent', color: '#9ca3af',
                border: '1px solid rgba(255,255,255,0.12)',
                fontWeight: 600, padding: '15px 40px', borderRadius: '3px',
                fontSize: '0.95rem', cursor: 'pointer',
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

      {/* ── FECHAS — tipografía pura, sin cajas ───────────────────────── */}
      <motion.section
        variants={inView} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5 }}
        style={{ marginTop: '64px', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'APERTURA', date: s.textoFechaApertura, color: '#76B900' },
            { label: 'CIERRE',   date: s.textoFechaCierre,   color: '#e61f30' },
            { label: 'GRAN FINAL EN VIVO', date: s.textoFechaFinal, color: '#facc15' },
          ].map(({ label, date, color }, i) => (
            <div key={label} style={{
              padding: '32px 28px',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              borderBottom: `2px solid ${color}`,
              background: `linear-gradient(180deg, ${color}06 0%, transparent 100%)`,
            }}>
              <p style={{
                color: '#374151', fontSize: '0.62rem', letterSpacing: '0.22em',
                fontWeight: 800, marginBottom: '10px', textTransform: 'uppercase',
              }}>{label}</p>
              <p style={{ color, fontSize: 'clamp(1.1rem, 2.5vw, 1.7rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {date}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── CÓMO PARTICIPAR — sin cajas, números watermark ───────────── */}
      {s.pasos?.length > 0 && (
        <section style={{ marginTop: '100px' }}>

          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '64px' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07))' }} />
            <span style={{ color: '#374151', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Cómo participar
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.07), transparent)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', position: 'relative' }}>

            {/* Horizontal connector between dots */}
            <div style={{
              position: 'absolute', top: '6px', left: 'calc(16.6% + 8px)', right: 'calc(16.6% + 8px)',
              height: '1px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)',
              zIndex: 0,
            }} />

            {s.pasos.map(({ numero, titulo, descripcion }, i) => {
              const clr = STEP_COLORS[i % STEP_COLORS.length];
              return (
                <motion.div
                  key={numero}
                  variants={inView} initial="hidden" whileInView="show" viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.14 }}
                  style={{ padding: '0 32px 0 0', position: 'relative', paddingLeft: i === 0 ? 0 : '32px' }}
                >
                  {/* Glowing dot */}
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: clr, boxShadow: `0 0 16px ${clr}99`,
                    marginBottom: '28px', position: 'relative', zIndex: 1,
                    marginLeft: i === 0 ? 0 : undefined,
                  }} />

                  {/* Watermark number */}
                  <div aria-hidden="true" style={{
                    position: 'absolute', top: '-20px', left: i === 0 ? '-12px' : '20px',
                    fontSize: '9rem', fontWeight: 900, lineHeight: 1,
                    color: clr, opacity: 0.05,
                    userSelect: 'none', pointerEvents: 'none',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.04em',
                  }}>
                    {numero}
                  </div>

                  <p style={{ color: clr, fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.2em', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Paso {numero}
                  </p>
                  <h3 style={{ color: '#f9fafb', fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2 }}>
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

      {/* ── PREMIO ────────────────────────────────────────────────────── */}
      {s.premios?.length > 0 && (
        <motion.section
          variants={inView} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ marginTop: '100px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '48px' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07))' }} />
            <span style={{ color: '#374151', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Premio
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.07), transparent)' }} />
          </div>

          <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {s.premios.map(({ posicion, descripcion, color, imagenUrl }) => (
              <div key={posicion} style={{
                display: 'flex', alignItems: 'stretch',
                borderLeft: `3px solid ${color}`,
                background: `linear-gradient(90deg, ${color}0a 0%, transparent 60%)`,
              }}>
                {/* Text */}
                <div style={{ flex: 1, padding: '32px 28px' }}>
                  <p style={{ color, fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {posicion}
                  </p>
                  <p style={{ color: '#f9fafb', fontSize: '1.6rem', fontWeight: 900, lineHeight: 1.2, margin: 0, letterSpacing: '-0.02em' }}>
                    {descripcion}
                  </p>
                </div>
                {/* Product image */}
                {imagenUrl && (
                  <div style={{
                    flexShrink: 0, width: '200px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px', borderLeft: `1px solid ${color}18`,
                  }}>
                    <img src={imagenUrl} alt={descripcion}
                      style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── CTA FINAL ─────────────────────────────────────────────────── */}
      {open && (
        <motion.section
          variants={inView} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ marginTop: '100px', textAlign: 'center', paddingBottom: '32px' }}
        >
          <p style={{ color: '#374151', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '20px' }}>
            No te quedes fuera
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '16px' }}>
            ¿Listo para el{' '}
            <span style={{ color: accent, textShadow: `0 0 40px ${accent}55` }}>Gran Upgrade?</span>
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '36px', fontSize: '0.95rem' }}>
            Las inscripciones cierran el {s.textoFechaCierre}.
          </p>
          <Link to="/concursos/el-gran-upgrade/inscripcion" style={{ textDecoration: 'none' }}>
            <button style={{
              background: accent, color: '#000', fontWeight: 900,
              padding: '16px 48px', borderRadius: '3px', fontSize: '1rem',
              border: 'none', cursor: 'pointer', letterSpacing: '0.06em',
              textTransform: 'uppercase',
              boxShadow: `0 0 50px ${accent}44`,
              transition: 'transform .15s, box-shadow .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = `0 0 70px ${accent}77`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 0 50px ${accent}44`; }}
            >
              Inscribirme ahora
            </button>
          </Link>
        </motion.section>
      )}

    </ContestLayout>
  );
}
