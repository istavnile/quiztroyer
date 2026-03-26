import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

const PALETTE = [
  '#f472b6','#a78bfa','#60a5fa','#34d399','#fbbf24',
  '#fb923c','#e879f9','#38bdf8','#4ade80','#f87171',
];

// Stable random word cloud layout — recalculated only when names change
function useWordCloudLayout(names) {
  return useMemo(() => {
    // Simple non-overlapping placement using a grid approach
    return names.map((name, i) => {
      const seed = i * 137.508; // golden angle spread
      const r = 20 + (i % 5) * 12;
      const angle = (seed * Math.PI) / 180;
      const cx = 50 + r * Math.cos(angle);
      const cy = 50 + r * Math.sin(angle);
      return {
        name,
        x: Math.max(5, Math.min(88, cx)),
        y: Math.max(8, Math.min(85, cy)),
        color: PALETTE[i % PALETTE.length],
        size: i % 3 === 0 ? 22 : i % 3 === 1 ? 17 : 14,
        floatDur: 3 + (i % 4),
        floatDelay: (i * 0.4) % 3,
        rotRange: [-4 + (i % 3), 4 - (i % 3)],
      };
    });
  }, [names.join('|')]);
}

function WordCloud({ names, spinning, featuredName }) {
  const layout = useWordCloudLayout(names);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {layout.map(({ name, x, y, color, size, floatDur, floatDelay, rotRange }) => {
        const isFeatured = name === featuredName;
        return (
          <motion.div
            key={name}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              color,
              fontSize: size,
              fontWeight: 800,
              textShadow: `0 0 18px ${color}cc, 0 0 40px ${color}55`,
              whiteSpace: 'nowrap',
              userSelect: 'none',
              lineHeight: 1,
            }}
            animate={
              isFeatured && featuredName
                ? {
                    scale: [1, 1.6, 1.3],
                    textShadow: [
                      `0 0 18px ${color}cc`,
                      `0 0 60px ${color}ff, 0 0 120px ${color}88`,
                      `0 0 40px ${color}dd`,
                    ],
                  }
                : spinning
                ? {
                    y: [0, -18, 12, -8, 0],
                    x: [0, 10, -8, 6, 0],
                    scale: [1, 1.15, 0.9, 1.05, 1],
                    rotate: rotRange,
                  }
                : {
                    y: [0, -6, 0],
                    scale: [1, 1.03, 1],
                  }
            }
            transition={
              isFeatured && featuredName
                ? { duration: 0.6, ease: 'easeOut' }
                : spinning
                ? { duration: 0.4 + Math.random() * 0.3, repeat: Infinity, ease: 'easeInOut' }
                : { duration: floatDur, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }
            }
          >
            {name}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function RaffleRoom() {
  const { slug } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [phase, setPhase] = useState('lobby');   // lobby | wordcloud | spinning | spin-result | winner
  const [participantCount, setParticipantCount] = useState(0);
  const [roster, setRoster] = useState([]);
  const [spinNumber, setSpinNumber] = useState(0);
  const [spinResult, setSpinResult] = useState(null); // { spinNumber, nombre, apellido }
  const [winner, setWinner] = useState(null);
  const [featuredName, setFeaturedName] = useState(null);

  const entryId = state?.entryId;
  const nombre = state?.nombre;

  useEffect(() => {
    if (!entryId) { navigate('/'); return; }

    const socket = io(`${SOCKET_URL}/raffle`, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('raffle:join', { slug, entryId, nombre, apellido: '' });
    });

    socket.on('raffle:joined', ({ status }) => {
      if (status === 'DONE') setPhase('winner');
    });

    socket.on('raffle:count', (count) => setParticipantCount(count));

    socket.on('raffle:roster', (names) => {
      setRoster(names);
      if (names.length > 0) setPhase((p) => p === 'lobby' ? 'wordcloud' : p);
    });

    socket.on('raffle:spinning', ({ spinNumber: n }) => {
      setSpinNumber(n);
      setFeaturedName(null);
      setPhase('spinning');
    });

    socket.on('raffle:spin-result', ({ spinNumber: n, nombre: nb, apellido: ap }) => {
      const full = `${nb} ${ap}`;
      setFeaturedName(full);
      setTimeout(() => {
        setSpinResult({ spinNumber: n, nombre: nb, apellido: ap });
        setPhase('spin-result');
        setFeaturedName(null);
      }, 1200);
    });

    socket.on('raffle:winner', (data) => {
      setWinner(data);
      setPhase('winner');
    });

    socket.on('raffle:error', (msg) => console.error('[Raffle]', msg));

    return () => socket.disconnect();
  }, []);

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="absolute rounded-full animate-ping" style={{
              width: `${i * Math.min(180, window.innerWidth * 0.35)}px`,
              height: `${i * Math.min(180, window.innerWidth * 0.35)}px`,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#6366f1', opacity: 0.05,
              animationDelay: `${i * 0.35}s`, animationDuration: '2.2s',
            }} />
          ))}
        </div>
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }} className="text-center relative z-10">
          <div className="text-6xl mb-4">🎟️</div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">¡Estás registrado!</h1>
          <p className="text-white/60 mb-6">Hola, <span className="text-white font-semibold">{nombre}</span></p>
          <div className="glass rounded-2xl px-8 py-5 mb-6">
            <div className="flex items-center gap-3 justify-center mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-white font-medium">Conectado</p>
            </div>
            <p className="text-white/50 text-sm">Esperando que el sorteo comience</p>
          </div>
          <div className="glass rounded-xl px-6 py-3 inline-flex items-center gap-2">
            <span className="text-2xl font-black text-indigo-400">{participantCount}</span>
            <span className="text-white/60 text-sm">participantes registrados</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── WORD CLOUD (idle + spinning) ───────────────────────────────────────────
  if (phase === 'wordcloud' || phase === 'spinning') {
    const isSpinning = phase === 'spinning';
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: '#080c1a' }}>
        {/* Ambient glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="blob-anim-1 absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full blur-3xl opacity-20" style={{ background: '#6366f1' }} />
          <div className="blob-anim-2 absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full blur-3xl opacity-20" style={{ background: '#a855f7' }} />
          <div className="blob-anim-3 absolute rounded-full blur-3xl opacity-15" style={{
            background: '#ec4899', width: 200, height: 200, top: '50%', left: '50%', transform: 'translate(-50%,-50%)'
          }} />
        </div>

        {/* Word cloud */}
        <WordCloud names={roster} spinning={isSpinning} featuredName={featuredName} />

        {/* Status overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-10">
          {isSpinning ? (
            <motion.div key="spinning-badge"
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="glass rounded-2xl px-6 py-3 text-center">
              <p className="text-white font-black text-lg">🎰 Girando #{spinNumber}...</p>
              <p className="text-white/50 text-xs mt-1">
                {spinNumber === 1 ? 'Primer giro' : spinNumber === 2 ? 'Segundo giro' : '¡Giro final!'}
              </p>
            </motion.div>
          ) : (
            <div className="glass rounded-2xl px-6 py-3 text-center">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-white/70 text-sm">{participantCount} participantes · Esperando al host</p>
              </div>
            </div>
          )}
        </div>

        {/* Top label */}
        <div className="absolute top-6 left-0 right-0 flex justify-center z-10">
          <div className="text-white/30 text-xs uppercase tracking-widest font-bold">🎟️ Sorteo en vivo</div>
        </div>
      </div>
    );
  }

  // ── SPIN RESULT (who was featured this round) ──────────────────────────────
  if (phase === 'spin-result' && spinResult) {
    const isMe = spinResult.nombre === nombre;
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6"
        style={{ background: '#080c1a' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="blob-anim-1 absolute -top-20 -right-20 w-[280px] h-[280px] rounded-full blur-3xl opacity-20" style={{ background: PALETTE[spinResult.spinNumber] }} />
          <div className="blob-anim-2 absolute -bottom-20 -left-20 w-[280px] h-[280px] rounded-full blur-3xl opacity-20" style={{ background: PALETTE[spinResult.spinNumber + 2] }} />
        </div>

        <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 250, damping: 18 }}
          className="text-center relative z-10">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Giro #{spinResult.spinNumber}</p>
          <div className="text-6xl mb-4">{spinResult.spinNumber < 3 ? '😬' : '🏆'}</div>
          <p className="text-white/60 text-sm mb-1 uppercase tracking-wider">
            {spinResult.spinNumber < 3 ? 'Esta vez el giro apuntó a...' : '¡El ganador es...!'}
          </p>
          <h2 className="font-black text-white mb-6"
            style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', textShadow: `0 0 40px ${PALETTE[spinResult.spinNumber]}` }}>
            {spinResult.nombre} {spinResult.apellido}
          </h2>

          {isMe && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}
              className="bg-red-500/20 border border-red-400/40 rounded-2xl px-6 py-4 mt-2">
              <p className="text-red-300 font-bold">😅 ¡Esta vez tocó tu nombre!</p>
            </motion.div>
          )}

          {spinResult.spinNumber < 3 && (
            <p className="text-white/30 text-sm mt-6 animate-pulse">Esperando el siguiente giro...</p>
          )}
        </motion.div>
      </div>
    );
  }

  // ── WINNER ─────────────────────────────────────────────────────────────────
  if (phase === 'winner' && winner) {
    const isMe = winner.nombre === nombre;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ background: '#080c1a' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="blob-anim-1 absolute -top-20 -right-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full blur-3xl opacity-40" style={{ background: '#ffd700' }} />
          <div className="blob-anim-2 absolute -bottom-20 -left-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full blur-3xl opacity-30" style={{ background: '#f59e0b' }} />
        </div>

        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center relative z-10">
          <div className="text-7xl mb-3">{isMe ? '🎉' : '🏆'}</div>
          <p className="text-yellow-400 font-bold uppercase tracking-widest text-xs mb-2">¡Ganador del sorteo!</p>
          <h1 className="font-black text-white mb-6"
            style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', textShadow: '0 0 60px #ffd70088' }}>
            {winner.nombre} {winner.apellido}
          </h1>
          {isMe && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
              className="bg-yellow-400/20 border border-yellow-400/40 rounded-2xl px-6 py-4">
              <p className="text-yellow-300 font-black text-xl">🎊 ¡FELICITACIONES!</p>
              <p className="text-white/70 text-sm mt-1">¡Tú eres el ganador!</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      Cargando...
    </div>
  );
}
