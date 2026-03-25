import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import BrandingLayout from '../../components/BrandingLayout';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function RankingScreen() {
  const { state } = useGame();
  const { ranking, sessionId, branding } = state;

  const myEntry = ranking.find((r) => r.id === sessionId);
  const myRank  = ranking.findIndex((r) => r.id === sessionId) + 1;
  const primaryColor = branding?.primaryColor || '#6366f1';

  return (
    <BrandingLayout branding={branding}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex-1 flex flex-col items-center justify-start p-6 overflow-auto"
      >
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6 mt-2"
        >
          <div className="text-5xl mb-2">📊</div>
          <h1 className="text-3xl font-black text-white">Ranking Parcial</h1>
          <p className="text-white/50 mt-1 text-sm">Esperando la siguiente pregunta...</p>
        </motion.div>

        {/* Personal rank badge */}
        {myEntry && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl px-6 py-4 mb-5 text-center w-full max-w-xs"
            style={{ background: `${primaryColor}22`, border: `2px solid ${primaryColor}` }}
          >
            <p className="text-white/60 text-xs mb-1">Tu posición</p>
            <p className="text-4xl font-black text-white">#{myRank}</p>
            <p className="font-bold text-lg mt-0.5" style={{ color: primaryColor }}>
              {myEntry.totalScore?.toLocaleString()} pts
            </p>
          </motion.div>
        )}

        {/* Ranking list */}
        <div className="w-full max-w-md space-y-2">
          {ranking.slice(0, 10).map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.04 + 0.2 }}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: player.id === sessionId
                  ? `${primaryColor}22`
                  : 'rgba(255,255,255,0.05)',
                border: player.id === sessionId
                  ? `1px solid ${primaryColor}55`
                  : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span className="text-xl w-8 text-center">
                {i < 3 ? MEDALS[i] : <span className="text-white/40 text-sm font-bold">#{i + 1}</span>}
              </span>
              <span className="flex-1 font-semibold text-white truncate">{player.playerName}</span>
              <span className="font-bold text-sm" style={{ color: primaryColor }}>
                {player.totalScore?.toLocaleString()}
              </span>
            </motion.div>
          ))}
          {ranking.length === 0 && (
            <p className="text-center text-white/30 py-6">Cargando ranking...</p>
          )}
        </div>
      </motion.div>
    </BrandingLayout>
  );
}
