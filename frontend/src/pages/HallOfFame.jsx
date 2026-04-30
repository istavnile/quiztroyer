import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import PageBackground from '../components/PageBackground';

const MEDALS = ['🥇', '🥈', '🥉'];
const ROW_COLORS = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];

export default function HallOfFame() {
  const { slug } = useParams();
  const [data, setData]         = useState(null);
  const [settings, setSettings] = useState({ homeBgColor: '#0f172a', homeButtonColor: '#6366f1', bgEffect: 'blobs', logoUrl: '' });
  const [error, setError]       = useState(false);

  useEffect(() => {
    api.get('/settings').then((r) => setSettings((s) => ({ ...s, ...r.data }))).catch(() => {});
    api.get(`/challenges/${slug}/hall-of-fame`)
      .then((r) => setData(r.data))
      .catch(() => setError(true));
  }, [slug]);

  const bg      = settings.homeBgColor    || '#0f172a';
  const primary = settings.homeButtonColor || '#6366f1';
  const logoUrl = data?.challenge?.branding?.logoUrl || settings.logoUrl;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <p className="text-white/50">Desafío no encontrado</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primary }} />
    </div>
  );

  const { challenge, entries } = data;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center py-12 px-4" style={{ background: bg }}>
      <PageBackground siteSettings={settings} color={primary} />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          {logoUrl && <img src={logoUrl} alt="logo" className="h-14 object-contain mx-auto mb-4" />}
          <p className="text-4xl mb-2">🏆</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{challenge.name}</h1>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest">Hall of Fame · Todos los tiempos</p>
        </motion.div>

        {/* Podium top 3 */}
        {entries.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-end justify-center gap-3 mb-8">
            {[
              { data: entries[1], h: 'h-24', medal: '🥈', color: '#c0c0c0', pos: 2, delay: 0.5 },
              { data: entries[0], h: 'h-36', medal: '🥇', color: '#ffd700', pos: 1, delay: 0.8 },
              { data: entries[2], h: 'h-16', medal: '🥉', color: '#cd7f32', pos: 3, delay: 0.3 },
            ].map(({ data: p, h, medal, color, pos, delay }) => (
              <motion.div key={pos} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay, type: 'spring', stiffness: 180, damping: 16 }}
                className="flex flex-col items-center flex-1 max-w-[120px]">
                <div className="text-2xl mb-0.5">{medal}</div>
                <p className="text-white font-bold text-xs text-center truncate w-full px-1 mb-0.5">{p.playerName}</p>
                <p className="text-xs font-bold mb-1.5" style={{ color }}>{p.totalScore.toLocaleString()} pts</p>
                <div className={`${h} w-full rounded-t-xl flex items-end justify-center pb-2`} style={{ background: color }}>
                  <span className="font-black text-xl text-white/90">{pos}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Full list */}
        {entries.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <p className="text-white/30 text-lg">Aún no hay resultados registrados</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {entries.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className="flex items-center gap-4 rounded-xl px-5 py-3 glass-card"
                style={{ background: i < 3 ? `${['#ffd700','#c0c0c0','#cd7f32'][i]}14` : undefined, border: i < 3 ? `1px solid ${['#ffd70040','#c0c0c040','#cd7f3240'][i]}` : undefined }}>
                <span className={`font-black w-8 text-center text-lg ${ROW_COLORS[i] || 'text-white/30'}`}>
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </span>
                <span className="flex-1 text-white font-semibold truncate">{p.playerName}</span>
                <span className="text-xs text-white/30 mr-2">Ronda {p.runNumber}</span>
                <span className="font-black text-sm" style={{ color: primary }}>{p.totalScore.toLocaleString()} pts</span>
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-center text-white/20 text-xs mt-10 uppercase tracking-widest">Quiztroyer</p>
      </div>
    </div>
  );
}
