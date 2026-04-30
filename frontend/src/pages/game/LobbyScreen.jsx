import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import BrandingLayout from '../../components/BrandingLayout';

export default function LobbyScreen() {
  const { state } = useGame();
  const { challengeName, playerName, connected, branding } = state;

  const primaryColor = branding?.primaryColor || '#6366f1';

  return (
    <BrandingLayout branding={branding}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex-1 flex flex-col items-center justify-center p-6 text-center relative"
      >
        {/* Pulsing rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute rounded-full animate-ping"
              style={{
                width: `${i * Math.min(180, window.innerWidth * 0.35)}px`,
                height: `${i * Math.min(180, window.innerWidth * 0.35)}px`,
                background: primaryColor,
                opacity: 0.06,
                animationDelay: `${i * 0.35}s`,
                animationDuration: '2.2s',
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring' }}
          className="relative z-10"
        >
          <div className="text-6xl mb-4">⏳</div>

          <h1 className="text-3xl font-black text-white mb-2">
            {challengeName || 'Conectando...'}
          </h1>

          <p className="text-white/60 mb-8">
            Hola, <span className="text-white font-semibold">{playerName}</span>
          </p>

          <div className="glass-card rounded-2xl px-8 py-5 mb-8 inline-block">
            <div className="flex items-center gap-3 justify-center">
              <div
                className={`w-2.5 h-2.5 rounded-full ${connected ? 'animate-pulse' : ''}`}
                style={{ background: connected ? '#4ade80' : '#f87171' }}
              />
              <p className="text-base font-medium text-white">
                {connected ? 'Conectado' : 'Conectando...'}
              </p>
            </div>
            <p className="text-white/50 text-sm mt-1">Esperando al host para comenzar</p>
          </div>

          {/* Bouncing dots */}
          <div className="flex gap-2 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full animate-bounce"
                style={{ background: primaryColor, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </BrandingLayout>
  );
}
