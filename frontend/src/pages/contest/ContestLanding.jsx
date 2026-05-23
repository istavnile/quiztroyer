import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ContestLayout from './ContestLayout';
import { isRegistrationOpen, CONTEST_OPEN_DATE, CONTEST_CLOSE_DATE } from '../../lib/contestConstants';

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } };

export default function ContestLanding() {
  const open = isRegistrationOpen();

  return (
    <ContestLayout>
      {/* Hero */}
      <section className="text-center py-16 relative">
        {/* Glow de fondo */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: -1,
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(118,185,0,0.12), transparent)',
        }} />

        <motion.div
          variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.6 }}
        >
          <span style={{
            display: 'inline-block', background: 'rgba(118,185,0,0.1)',
            border: '1px solid rgba(118,185,0,0.4)', color: '#76B900',
            fontSize: '0.7rem', letterSpacing: '0.18em', fontWeight: 700,
            padding: '4px 14px', borderRadius: '999px', marginBottom: '1.5rem',
          }}>
            CONCURSO PATROCINADO POR NVIDIA · ASUS ROG · COMPUTERSHOP
          </span>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            El Gran{' '}
            <span style={{ color: '#76B900', textShadow: '0 0 40px rgba(118,185,0,0.5)' }}>
              Upgrade
            </span>
          </h1>

          <p style={{ color: '#9ca3af', fontSize: '1.15rem', maxWidth: '580px', margin: '1.5rem auto 0' }}>
            Muéstranos tu PC y cuéntanos tu historia. Los mejores setups ganarán un upgrade épico
            con hardware NVIDIA y ASUS ROG.
          </p>
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
                boxShadow: '0 0 30px rgba(118,185,0,0.4)',
                transition: 'transform .15s, box-shadow .15s',
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
              Inscripciones abren el 1 de junio
            </div>
          )}
          <Link to="/concursos/el-gran-upgrade/votacion">
            <button style={{
              background: 'transparent', color: '#e61f30',
              border: '2px solid #e61f30', fontWeight: 700,
              padding: '14px 36px', borderRadius: '6px', fontSize: '1rem',
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
          { label: 'Apertura de inscripciones', date: '1 de junio, 2026', color: '#76B900' },
          { label: 'Cierre de inscripciones',   date: '7 de junio, 23:59', color: '#e61f30' },
          { label: 'Gran Final en vivo',         date: '12 de junio, 2026', color: '#facc15' },
        ].map(({ label, date, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: '12px', padding: '24px', textAlign: 'center',
            borderTop: `3px solid ${color}`,
          }}>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</p>
            <p style={{ color, fontSize: '1.3rem', fontWeight: 800 }}>{date}</p>
          </div>
        ))}
      </motion.section>

      {/* Cómo participar */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="mt-20"
      >
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>
          ¿Cómo participar?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Inscríbete', desc: 'Llena el formulario con los datos de tu PC, sube fotos y cuenta tu historia en máximo 150 palabras.' },
            { step: '02', title: 'Espera los finalistas', desc: 'Nuestro equipo revisará todas las participaciones y seleccionará los mejores setups.' },
            { step: '03', title: 'Vota y comparte', desc: 'Del 8 al 11 de junio, la comunidad vota por sus favoritos. ¡El ganador anunciado en vivo el 12 de junio!' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', padding: '28px',
            }}>
              <div style={{ color: '#76B900', fontSize: '2.5rem', fontWeight: 900, opacity: 0.4, lineHeight: 1 }}>{step}</div>
              <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, margin: '12px 0 8px' }}>{title}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Premios */}
      <motion.section
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="mt-20"
      >
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>
          Premios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { pos: '1er lugar', prize: 'NVIDIA GeForce RTX 4080 + ASUS ROG Monitor 4K', color: '#facc15' },
            { pos: '2do lugar', prize: 'NVIDIA GeForce RTX 4070 Super + Periféricos ASUS ROG', color: '#9ca3af' },
            { pos: '3er lugar', prize: 'NVIDIA GeForce RTX 4060 + Voucher ComputerShop Q500', color: '#cd7c3e' },
          ].map(({ pos, prize, color }) => (
            <div key={pos} style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))`,
              border: `1px solid ${color}44`,
              borderRadius: '12px', padding: '28px', textAlign: 'center',
            }}>
              <div style={{ color, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>{pos}</div>
              <p style={{ color: '#e5e7eb', fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 }}>{prize}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* CTA final */}
      {open && (
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mt-20 text-center"
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(118,185,0,0.08), rgba(230,31,48,0.06))',
            border: '1px solid rgba(118,185,0,0.2)',
            borderRadius: '16px', padding: '48px 24px',
          }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
              ¿Listo para el Gran Upgrade?
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
              Las inscripciones cierran el 7 de junio a las 23:59. No te quedes fuera.
            </p>
            <Link to="/concursos/el-gran-upgrade/inscripcion">
              <button style={{
                background: '#76B900', color: '#000', fontWeight: 800,
                padding: '14px 40px', borderRadius: '6px', fontSize: '1.05rem',
                border: 'none', cursor: 'pointer',
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
