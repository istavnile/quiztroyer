import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';

export default function Home() {
  const [slug, setSlug]       = useState('');
  const [colors, setColors]   = useState({ blob1Color: '#6366f1', blob2Color: '#a855f7', blob3Color: '#ec4899', homeBgColor: '#0f172a', homeButtonColor: '#4f46e5' });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/settings').then((r) => setColors(r.data)).catch(() => {});
  }, []);

  function handleJoin(e) {
    e.preventDefault();
    if (slug.trim()) navigate(`/join/${slug.trim().toLowerCase()}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: colors.homeBgColor }}>
      {/* Animated background blobs — CSS keyframes, no transform conflict */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="blob-anim-1 absolute -top-20 -right-20 w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] rounded-full blur-3xl opacity-30"
          style={{ background: colors.blob1Color }}
        />
        <div
          className="blob-anim-2 absolute -bottom-20 -left-20 w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] rounded-full blur-3xl opacity-30"
          style={{ background: colors.blob2Color }}
        />
        <div
          className="blob-anim-3 absolute rounded-full blur-3xl opacity-20"
          style={{
            background: colors.blob3Color,
            width: 'min(320px, 60vw)', height: 'min(320px, 60vw)',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-3">
          <span className="text-gradient">QUIZ</span>
          <span className="text-white">TROYER</span>
        </h1>
        <p className="text-slate-400 text-lg">La plataforma de quizzes en vivo mas épica</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass rounded-2xl p-8 w-full max-w-md relative z-10"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Unirse a un Desafío</h2>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Código del desafío</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ej: demo-quiz"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full text-white font-bold py-3 rounded-xl transition-colors duration-200 text-lg glow-pulse"
            style={{ background: colors.homeButtonColor }}
          >
            Continuar →
          </button>
        </form>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-slate-600 text-sm relative z-10"
      >
        ¿Eres admin?{' '}
        <a href="/admin" className="text-indigo-400 hover:text-indigo-300 transition-colors">
          Panel de control
        </a>
      </motion.p>
    </div>
  );
}
