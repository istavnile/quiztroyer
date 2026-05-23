import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import BackgroundEffect from '../components/BackgroundEffect';
import ShaderBackground from '../components/ShaderBackground';

const BADGES = [
  { icon: '🎯', label: 'Quiz en vivo',    sub: 'Múltiple opción',   pos: 'top-[26%] left-[6%]',   delay: 0,   dur: 4.2 },
  { icon: '🏆', label: 'Hall of Fame',    sub: 'Top jugadores',     pos: 'top-[20%] right-[7%]',  delay: 0.6, dur: 3.6 },
  { icon: '🎟', label: 'Sorteos',         sub: 'Participantes live', pos: 'bottom-[26%] left-[8%]', delay: 1.1, dur: 5.0 },
  { icon: '⚡', label: 'Tiempo real',     sub: 'WebSocket',         pos: 'bottom-[20%] right-[6%]', delay: 0.3, dur: 3.8 },
];

export default function Home() {
  const [slug, setSlug]         = useState('');
  const [colors, setColors]     = useState({
    blob1Color: '#6366f1', blob2Color: '#a855f7', blob3Color: '#ec4899',
    homeBgColor: '#09090f', homeButtonColor: '#4f46e5', logoUrl: '', bgEffect: 'blobs',
  });
  const [inputFocused, setInputFocused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/settings').then((r) => setColors((prev) => ({ ...prev, ...r.data }))).catch(() => {});
  }, []);

  function handleJoin(e) {
    e.preventDefault();
    if (slug.trim()) navigate(`/join/${slug.trim().toLowerCase()}`);
  }

  const accent = colors.homeButtonColor || '#4f46e5';
  const isCanvas = colors.bgEffect && colors.bgEffect !== 'blobs';

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: colors.homeBgColor || '#09090f' }}>

      {/* Background */}
      {isCanvas ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <BackgroundEffect type={colors.bgEffect} color={accent} />
        </div>
      ) : (
        <ShaderBackground color={accent} />
      )}

      {/* Floating decorative badges — desktop only */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {BADGES.map(({ icon, label, sub, pos, delay, dur }) => (
          <motion.div
            key={label}
            className={`absolute ${pos}`}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay }}
          >
            <div className="glass-pill flex items-center gap-3 px-4 py-3 rounded-2xl">
              <span className="text-xl leading-none">{icon}</span>
              <div>
                <p className="text-white text-xs font-bold leading-tight">{label}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6" style={{ zIndex: 2 }}>

        {/* Logo / title */}
        <motion.div
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-10"
        >
          {colors.logoUrl ? (
            <img src={colors.logoUrl} alt="logo" className="h-16 sm:h-24 object-contain mx-auto mb-5" />
          ) : (
            <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-4 leading-none">
              <span className="text-gradient">QUIZ</span>
              <span className="text-white">TROYER</span>
            </h1>
          )}
          <p className="text-slate-400 text-sm sm:text-base tracking-wide">
            La plataforma de quizzes en vivo más épica
          </p>
        </motion.div>

        {/* Join card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card rounded-3xl p-8 w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-center text-white mb-1">Unirse a un Desafío</h2>
          <p className="text-center text-slate-500 text-sm mb-6">Ingresa el código de tu sesión</p>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 mb-2 uppercase tracking-widest font-semibold">
                Código del desafío
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="ej: demo-quiz"
                className="w-full rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none text-lg transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${inputFocused ? accent + '90' : 'rgba(255,255,255,0.11)'}`,
                  boxShadow: inputFocused
                    ? `0 0 0 3px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.10)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                }}
                autoFocus
              />
            </div>

            <motion.button
              type="submit"
              className="w-full text-white font-bold py-4 rounded-xl text-lg relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${accent}ee, ${accent}99)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22)`,
              }}
              animate={{
                boxShadow: [
                  `inset 0 1px 0 rgba(255,255,255,0.22), 0 0 10px 2px ${accent}44`,
                  `inset 0 1px 0 rgba(255,255,255,0.22), 0 0 32px 10px ${accent}99`,
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            >
              Continuar →
            </motion.button>
          </form>
        </motion.div>

        {/* Admin link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-7 text-slate-500 text-sm"
        >
          ¿Eres admin?{' '}
          <a href="/admin" className="font-semibold transition-colors hover:opacity-80" style={{ color: accent }}>
            Panel de control
          </a>
        </motion.p>
      </div>
    </div>
  );
}
