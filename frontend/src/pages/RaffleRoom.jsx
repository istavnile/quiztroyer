import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export default function RaffleRoom() {
  const { slug } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [phase, setPhase] = useState('lobby'); // lobby | spinning | winner
  const [participantCount, setParticipantCount] = useState(0);
  const [spinNumber, setSpinNumber] = useState(0);
  const [winner, setWinner] = useState(null);
  const [spinNames, setSpinNames] = useState([]);
  const spinInterval = useRef(null);

  const entryId = state?.entryId;
  const nombre = state?.nombre;

  useEffect(() => {
    if (!entryId) { navigate('/'); return; }

    const socket = io(`${SOCKET_URL}/raffle`, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('raffle:join', { slug, entryId, nombre, apellido: '' });
    });

    socket.on('raffle:joined', ({ raffleName, status }) => {
      if (status === 'DONE') setPhase('done');
    });

    socket.on('raffle:count', (count) => setParticipantCount(count));

    socket.on('raffle:spinning', ({ spinNumber: n }) => {
      setSpinNumber(n);
      setPhase('spinning');
      startSpinAnimation();
    });

    socket.on('raffle:winner', (data) => {
      clearInterval(spinInterval.current);
      setWinner(data);
      setPhase('winner');
    });

    socket.on('raffle:error', (msg) => console.error('[Raffle]', msg));

    return () => {
      clearInterval(spinInterval.current);
      socket.disconnect();
    };
  }, []);

  const fakeNames = ['María G.', 'Carlos R.', 'Ana P.', 'José M.', 'Luis T.', 'Carmen V.', 'Pedro A.', 'Laura S.', 'Miguel F.', 'Isabel C.'];

  function startSpinAnimation() {
    let count = 0;
    clearInterval(spinInterval.current);
    spinInterval.current = setInterval(() => {
      const shuffled = [...fakeNames].sort(() => Math.random() - 0.5).slice(0, 5);
      setSpinNames(shuffled);
      count++;
      if (count > 30) clearInterval(spinInterval.current);
    }, 80);
  }

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
              background: '#6366f1',
              opacity: 0.05,
              animationDelay: `${i * 0.35}s`,
              animationDuration: '2.2s',
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

  if (phase === 'spinning') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/20" />
        <motion.div key={spinNumber} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center relative z-10">
          <p className="text-white/50 text-sm mb-2 uppercase tracking-widest">Girando #{spinNumber}</p>
          <div className="text-6xl mb-6 animate-spin" style={{ animationDuration: '0.5s' }}>🎰</div>
          <div className="space-y-2 w-64 mx-auto">
            {spinNames.map((name, i) => (
              <motion.div key={`${name}-${i}`}
                initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                className="glass rounded-xl px-4 py-2 text-white font-semibold text-center">
                {name}
              </motion.div>
            ))}
          </div>
          {spinNumber < 3 && (
            <p className="text-white/40 text-sm mt-6">
              {spinNumber === 1 ? 'Falta 1 giro más...' : 'Último giro...'}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  if (phase === 'winner' && winner) {
    const isMe = winner.nombre === nombre;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="blob-anim-1 absolute -top-20 -right-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full blur-3xl opacity-30" style={{ background: '#ffd700' }} />
          <div className="blob-anim-2 absolute -bottom-20 -left-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full blur-3xl opacity-20" style={{ background: '#f59e0b' }} />
        </div>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center relative z-10">
          <div className="text-7xl mb-4">{isMe ? '🎉' : '🏆'}</div>
          <p className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-2">¡Ganador del sorteo!</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">
            {winner.nombre} {winner.apellido}
          </h1>
          {isMe && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
              className="mt-6 bg-yellow-400/20 border border-yellow-400/40 rounded-2xl px-6 py-4">
              <p className="text-yellow-300 font-black text-xl">🎊 ¡FELICITACIONES!</p>
              <p className="text-white/70 text-sm mt-1">¡Tú eres el ganador!</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return null;
}
