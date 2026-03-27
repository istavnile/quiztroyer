import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import api from '../../lib/api';
import PageBackground from '../../components/PageBackground';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export default function RaffleDisplay() {
  const { slug } = useParams();
  const socketRef = useRef(null);

  const [siteSettings, setSiteSettings] = useState({ homeBgColor: '#0f172a', homeButtonColor: '#6366f1', bgEffect: 'blobs', logoUrl: '' });
  const [raffle, setRaffle]       = useState(null);
  const [names, setNames]         = useState([]);
  const [count, setCount]         = useState(0);
  const [phase, setPhase]         = useState('lobby'); // lobby | spinning | result | winner
  const [spinNumber, setSpinNumber] = useState(0);
  const [featured, setFeatured]   = useState(null);
  const [winner, setWinner]       = useState(null);

  useEffect(() => {
    api.get('/settings').then((r) => setSiteSettings((s) => ({ ...s, ...r.data }))).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/raffle`, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('raffle:display-join', { slug }));

    socket.on('raffle:display-ready', ({ raffle: r, participantCount: c, names: n, winner: w }) => {
      setRaffle(r);
      setCount(c);
      setNames(n);
      if (w) { setWinner(w); setPhase('winner'); }
    });

    socket.on('raffle:count', (c) => setCount(c));
    socket.on('raffle:roster', (n) => setNames(n));

    socket.on('raffle:spinning', ({ spinNumber: sn }) => {
      setSpinNumber(sn);
      setPhase('spinning');
      setFeatured(null);
    });

    socket.on('raffle:spin-result', ({ nombre, apellido, spinNumber: sn }) => {
      setFeatured({ nombre, apellido, spinNumber: sn });
      setPhase('result');
    });

    socket.on('raffle:winner', ({ nombre, apellido, dni }) => {
      setWinner({ nombre, apellido, dni });
      setPhase('winner');
    });

    return () => socket.disconnect();
  }, [slug]);

  const branding = raffle?.branding || {};
  const bg      = branding.bgColor || siteSettings.homeBgColor;
  const primary = branding.primaryColor || siteSettings.homeButtonColor;
  const logo    = branding.logoUrl || siteSettings.logoUrl;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden select-none"
      style={{ background: bg }}>
      <PageBackground siteSettings={siteSettings} color={primary} />

      <div className="relative z-10 w-full flex flex-col items-center gap-8 p-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          {logo && <img src={logo} alt="logo" className="h-12 object-contain" />}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-white">{raffle?.name || '…'}</h1>
            <p className="text-slate-400 text-sm">{count} participantes inscritos</p>
          </div>
        </div>

        {/* LOBBY — floating names */}
        <AnimatePresence mode="wait">
          {phase === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full max-w-4xl">
              {names.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-slate-500 text-xl">Esperando participantes...</p>
                  <div className="flex justify-center gap-1 mt-4">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-indigo-500"
                        animate={{ y: [0, -10, 0] }} transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  {names.map((name, i) => (
                    <motion.div key={name + i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                      transition={{ delay: (i % 20) * 0.04, y: { duration: 2 + (i % 5) * 0.4, repeat: Infinity, delay: (i % 7) * 0.3 } }}
                      className="bg-slate-800/80 border border-slate-700 rounded-full px-4 py-2 text-white text-sm font-medium backdrop-blur-sm">
                      {name}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* SPINNING */}
          {phase === 'spinning' && (
            <motion.div key="spinning" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center py-8">
              <p className="text-slate-400 text-lg mb-6">
                {spinNumber === 1 ? 'Primer giro...' : spinNumber === 2 ? 'Segundo giro...' : '¡Giro final!'}
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-3xl mb-8">
                {names.map((name, i) => (
                  <motion.span key={name + i}
                    className="text-white font-bold text-base px-3 py-1.5 rounded-full"
                    style={{ background: `hsl(${(i * 47) % 360}, 60%, 35%)` }}
                    animate={{
                      scale: [1, 1.15, 0.95, 1.1, 1],
                      opacity: [0.6, 1, 0.5, 1, 0.7],
                      rotate: [0, (i % 2 === 0 ? 3 : -3), 0],
                    }}
                    transition={{ duration: 0.4 + (i % 4) * 0.1, repeat: Infinity, delay: (i % 8) * 0.05 }}>
                    {name}
                  </motion.span>
                ))}
              </div>
              <motion.div className="text-6xl" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                🎰
              </motion.div>
            </motion.div>
          )}

          {/* SPIN RESULT (not final winner) */}
          {phase === 'result' && featured && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} transition={{ type: 'spring', damping: 12 }}
              className="text-center py-12">
              <p className="text-slate-400 text-xl mb-4">
                {featured.spinNumber === 1 ? '¡Primer finalista!' : '¡Segundo finalista!'}
              </p>
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-5xl sm:text-7xl font-black text-white mb-4">
                {featured.nombre} {featured.apellido}
              </motion.div>
              <p className="text-slate-500">Espera al giro final para conocer al ganador</p>
            </motion.div>
          )}

          {/* WINNER */}
          {phase === 'winner' && winner && (
            <motion.div key="winner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                className="text-7xl mb-6">🏆</motion.div>

              <p className="text-yellow-400 text-2xl font-bold mb-3 uppercase tracking-widest">¡Ganador!</p>

              <motion.h2
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl sm:text-8xl font-black text-white mb-6 leading-none">
                {winner.nombre}<br />{winner.apellido}
              </motion.h2>

              {/* Confetti dots */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.div key={i}
                    className="absolute w-3 h-3 rounded-sm"
                    style={{
                      left: `${Math.random() * 100}%`,
                      background: `hsl(${Math.random() * 360}, 80%, 60%)`,
                    }}
                    initial={{ y: -20, opacity: 1 }}
                    animate={{ y: '110vh', opacity: [1, 1, 0], rotate: Math.random() * 720 - 360 }}
                    transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 1.5, repeat: Infinity }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="absolute bottom-5 left-0 right-0 flex justify-center">
          <span className="text-slate-700 text-xs">{window.location.href}</span>
        </div>
      </div>
    </div>
  );
}
