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
  textoFechaCierre: '7 de junio, 23:59',
  textoFechaFinal: '12 de junio, 2026',
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
    { posicion: '1er lugar', descripcion: 'NVIDIA GeForce RTX 4080 + ASUS ROG Monitor 4K',         color: '#facc15', imagenUrl: '' },
    { posicion: '2do lugar', descripcion: 'NVIDIA GeForce RTX 4070 Super + Periféricos ASUS ROG',   color: '#9ca3af', imagenUrl: '' },
    { posicion: '3er lugar', descripcion: 'NVIDIA GeForce RTX 4060 + Voucher ComputerShop Q500',    color: '#cd7c3e', imagenUrl: '' },
  ],
};

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };

export default function ContestLanding() {
  const [s, setS] = useState(DEFAULT);
  const open = isRegistrationOpen();

  useEffect(() => {
    fetch(`${API}/api/contest/settings`)
      .then((r) => r.json())
      .then((data) => setS({ ...DEFAULT, ...data }))
      .catch(() => {});
  }, []);

  // Split title: last word gets the green glow
  const titleWords = s.titulo.trim().split(/\s+/);
  const titleMain = titleWords.slice(0, -1).join(' ');
  const titleAccent = titleWords.slice(-1)[0];

  return (
    <ContestLayout settings={s}>
      {/* Hero */}
      <section className="text-center py-16 relative">
        {/* Imagen de fondo del hero (si existe) */}
        {s.imagenHero && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: -2, borderRadius: '16px', overflow: 'hidden',
          }}>
            <img src={s.imagenHero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }} />
          </div>
        )}
        <div style={{
          position: 'absolute', inset: 0, zIndex: -1,
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(118,185,0,0.12), transparent)',
        }} />

        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.6 }}>
          {s.badge && (
            <span style={{
              display: 'inline-block', background: 'rgba(118,185,0,0.1)',
              border: '1px solid rgba(118,185,0,0.4)', color: '#76B900',
              fontSize: '0.7rem', letterSpacing: '0.18em', fontWeight: 700,
              padding: '4px 14px', borderRadius: '999px', marginBottom: '1.5rem',
            }}>
              {s.badge}
            </span>
          )}

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            {titleMain && <>{titleMain} </>}
            <span style={{ color: '#76B900', textShadow: '0 0 40px rgba(118,185,0,0.5)' }}>
              {titleAccent}
            </span>
          </h1>

          {s.subtitulo && (
            <p style={{ color: '#9ca3af', fontSize: '1.15rem', maxWidth: '580px', margin: '1.5rem auto 0' }}>
              {s.subtitulo}
            </p>
          )}

          {/* Logos de patrocinadores */}
          {s.patrocinadores?.some((p) => p.logoUrl) && (
            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
              {s.patrocinadores.filter((p) => p.logoUrl).map((p) => (
                <img key={p.nombre} src={p.logoUrl} alt={p.nombre} style={{ height: '36px', objectFit: 'contain', opacity: 0.85 }} />
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          {open ? (
            <Link to="/concursos/el-gran-upgrade/inscripcion">
              <button style={{
                background: '#76B900', color: '#000', fontWeight: 800,
                padding: '14px 36px', borderRadius: '6px', fontSize: '1rem',
                border: 'none', cursor: 'pointer', letterSpacing: '0.03em',
                boxShadow: '0 0 30px rgba(118,185,0,0.4)', transition: 'transform .15s, box-shadow .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(118,185,0,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(118,185,0,0.4)'; }}
              >
                Inscribirme ahora
              </button>
            </Link>
          ) : (
            <div style={{
              background: 'rgba(118,185,0,0.08)', border: '1px solid rgba(118,185,0,0.3)',
              color: '#76B900', padding: '14px 36px', borderRadius: '6px', fontSize: '1rem', fontWeight: 700,
            }}>
              Inscripciones abren el {s.textoFechaApertura}
            </div>
          )}
          <Link to="/concursos/el-gran-upgrade/votacion">
            <button style={{
              background: 'transparent', color: '#e61f30', border: '2px solid #e61f30',
              fontWeight: 700, padding: '14px 36px', borderRadius: '6px', fontSize: '1rem',
              cursor: 'pointer', transition: 'background .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,31,48,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Ver finalistas y votar
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Fechas clave */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          { label: 'Apertura de inscripciones', date: s.textoFechaApertura, color: '#76B900' },
          { label: 'Cierre de inscripciones',   date: s.textoFechaCierre,   color: '#e61f30' },
          { label: 'Gran Final en vivo',         date: s.textoFechaFinal,    color: '#facc15' },
        ].map(({ label, date, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: '12px', padding: '24px', textAlign: 'center', borderTop: `3px solid ${color}`,
          }}>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</p>
            <p style={{ color, fontSize: '1.3rem', fontWeight: 800 }}>{date}</p>
          </div>
        ))}
      </motion.section>

      {/* Cómo participar */}
      {s.pasos?.length > 0 && (
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mt-20"
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>¿Cómo participar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {s.pasos.map(({ numero, titulo, descripcion }) => (
              <div key={numero} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', padding: '28px',
              }}>
                <div style={{ color: '#76B900', fontSize: '2.5rem', fontWeight: 900, opacity: 0.4, lineHeight: 1 }}>{numero}</div>
                <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, margin: '12px 0 8px' }}>{titulo}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{descripcion}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Premios */}
      {s.premios?.length > 0 && (
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mt-20"
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>Premios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {s.premios.map(({ posicion, descripcion, color, imagenUrl }) => (
              <div key={posicion} style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                border: `1px solid ${color}44`, borderRadius: '12px', overflow: 'hidden', textAlign: 'center',
              }}>
                {imagenUrl && (
                  <img src={imagenUrl} alt={posicion} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                )}
                <div style={{ padding: '24px' }}>
                  <div style={{ color, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>{posicion}</div>
                  <p style={{ color: '#e5e7eb', fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 }}>{descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* CTA final */}
      {open && (
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mt-20 text-center"
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(118,185,0,0.08), rgba(230,31,48,0.06))',
            border: '1px solid rgba(118,185,0,0.2)', borderRadius: '16px', padding: '48px 24px',
          }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>¿Listo para el Gran Upgrade?</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
              Las inscripciones cierran el {s.textoFechaCierre}. No te quedes fuera.
            </p>
            <Link to="/concursos/el-gran-upgrade/inscripcion">
              <button style={{
                background: '#76B900', color: '#000', fontWeight: 800,
                padding: '14px 40px', borderRadius: '6px', fontSize: '1.05rem', border: 'none', cursor: 'pointer',
              }}>
                Inscribirme
              </button>
            </Link>
          </div>
        </motion.section>
      )}
    </ContestLayout>
  );
}
