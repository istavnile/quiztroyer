import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import BackgroundEffect from '../components/BackgroundEffect';

export default function Home() {
  const [slug, setSlug]       = useState('');
  const [colors, setColors]   = useState({ blob1Color: '#6366f1', blob2Color: '#a855f7', blob3Color: '#ec4899', homeBgColor: '#0f172a', homeButtonColor: '#4f46e5', logoUrl: '', bgEffect: 'blobs' });
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: colors.homeBgColor }}>
      {/* Background effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {colors.bgEffect === 'blobs' || !colors.bgEffect ? (
          <>
            <div className="blob-anim-1 absolute -top-20 -right-20 w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] rounded-full blur-3xl opacity-30" style={{ background: colors.blob1Color }} />
            <div className="blob-anim-2 absolute -bottom-20 -left-20 w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] rounded-full blur-3xl opacity-30" style={{ background: colors.blob2Color }} />
            <div className="blob-anim-3 absolute rounded-full blur-3xl opacity-20" style={{ background: colors.blob3Color, width: 'min(320px, 60vw)', height: 'min(320px, 60vw)', top: '50%', left: '50%' }} />
          </>
        ) : (
          <BackgroundEffect type={colors.bgEffect} color={accent} />
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        {colors.logoUrl ? (
          <img src={colors.logoUrl} alt="logo" className="h-16 sm:h-20 object-contain mx-auto mb-4" />
        ) : (
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-3">
            <span className="text-gradient">QUIZ</span>
            <span className="text-white">TROYER</span>
          </h1>
        )}
        <p className="text-slate-500 text-sm">La plataforma de quizzes en vivo mas épica</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass-card rounded-3xl p-8 w-full max-w-md relative z-10"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-white">Unirse a un Desafío</h2>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-2 uppercase tracking-wide font-medium">Código del desafío</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="ej: demo-quiz"
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none text-lg transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${inputFocused ? accent + '80' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: inputFocused ? `0 0 0 3px ${accent}20, inset 0 1px 0 rgba(255,255,255,0.10)` : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)',
              }}
              autoFocus
            />
          </div>
          <motion.button
            type="submit"
            className="w-full text-white font-bold py-3.5 rounded-xl text-lg relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${accent}dd, ${accent}99)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.20)` }}
            animate={{ boxShadow: [`inset 0 1px 0 rgba(255,255,255,0.20), 0 0 10px 2px ${accent}50`, `inset 0 1px 0 rgba(255,255,255,0.20), 0 0 28px 8px ${accent}bb`] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          >
            Continuar →
          </motion.button>
        </form>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-slate-300 text-sm relative z-10"
      >
        ¿Eres admin?{' '}
        <a href="/admin" className="transition-colors font-medium" style={{ color: accent }}>
          Panel de control
        </a>
      </motion.p>
    </div>
  );
}
