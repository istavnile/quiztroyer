import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext';
import BrandingLayout from '../../components/BrandingLayout';

export default function PodiumScreen() {
  const { state } = useGame();
  const { podium, sessionId, branding } = state;

  const primaryColor  = branding?.primaryColor  || '#6366f1';
  const accentColor   = branding?.accentColor   || '#f59e0b';

  useEffect(() => {
    const colors = [primaryColor, accentColor, '#ec4899', '#ffd700', '#c0c0c0'];

    // Initial burst
    setTimeout(() => {
      confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 }, colors });
    }, 300);

    // Continuous side streams for 8 seconds, then periodic bursts
    const end = Date.now() + 8000;
    const stream = () => {
      confetti({ particleCount: 4, angle: 60,  spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(stream);
    };
    stream();

    // Periodic firework bursts every 3s
    const interval = setInterval(() => {
      confetti({ particleCount: 80, spread: 90, origin: { x: Math.random(), y: Math.random() * 0.5 }, colors });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const [first, second, third] = podium;
  const podiumConfig = [
    { data: second, h: 'h-28', label: '🥈', color: '#c0c0c0', pos: '2', delay: 0.6 },
    { data: first,  h: 'h-40', label: '🥇', color: '#ffd700', pos: '1', delay: 1.0 },
    { data: third,  h: 'h-20', label: '🥉', color: '#cd7f32', pos: '3', delay: 0.3 },
  ];

  return (
    <BrandingLayout branding={branding}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col items-center justify-start p-6 overflow-auto relative"
      >
        {/* Animated blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="blob-anim-1 absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{ background: '#ffd700' }} />
          <div className="blob-anim-2 absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-15"
            style={{ background: primaryColor }} />
        </div>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8 mt-2 relative z-10"
        >
          <h1 className="text-4xl font-black text-white">🏆 Resultados Finales</h1>
          <p className="text-white/50 mt-1">¡Gracias por participar!</p>
        </motion.div>

        {/* Visual podium */}
        <div className="flex items-end justify-center gap-3 mb-10 w-full max-w-sm relative z-10">
          {podiumConfig.map(({ data, h, label, color, pos, delay }, i) => (
            <motion.div
              key={i}
              initial={{ y: 100, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay, type: 'spring', stiffness: 200, damping: 18 }}
              className="flex flex-col items-center flex-1"
            >
              {data && (
                <>
                  <div className="text-2xl mb-0.5">{label}</div>
                  <div className="text-white font-bold text-xs text-center truncate w-full px-1">{data.name}</div>
                  <div className="font-bold text-xs mb-1.5" style={{ color: primaryColor }}>
                    {data.score?.toLocaleString()} pts
                  </div>
                </>
              )}
              <div
                className={`${h} w-full rounded-t-xl flex items-center justify-center`}
                style={{ background: color, opacity: data ? 1 : 0.25 }}
              >
                <span className="font-black text-xl text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{pos}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Full ranking */}
        <div className="w-full max-w-md space-y-2 relative z-10">
          {podium.slice(0, 10).map((player, i) => (
            <motion.div
              key={player.id || i}
              initial={{ x: -16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.04 }}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: player.id === sessionId ? `${primaryColor}22` : 'rgba(255,255,255,0.05)',
                border: player.id === sessionId ? `1px solid ${primaryColor}55` : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span className="font-black text-white/50 w-7 text-center text-sm">#{i + 1}</span>
              <span className="flex-1 text-white font-semibold truncate">{player.name}</span>
              <span className="font-bold text-sm text-white/80">
                {player.score?.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-8"
        >
          <a href="/" className="text-white/40 hover:text-white/70 transition-colors text-sm">
            ← Volver al inicio
          </a>
        </motion.div>
      </motion.div>
    </BrandingLayout>
  );
}
