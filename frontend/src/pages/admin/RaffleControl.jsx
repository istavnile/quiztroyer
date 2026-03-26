import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import api from '../../lib/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export default function RaffleControl() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [raffle, setRaffle] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [spinsDone, setSpinsDone] = useState(0);
  const [winner, setWinner] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [phase, setPhase] = useState('lobby'); // lobby | spinning | done

  useEffect(() => {
    api.get(`/raffle/admin/${id}`).then((r) => {
      setRaffle(r.data);
      if (r.data.status === 'DONE') {
        const w = r.data.entries.find((e) => e.isWinner);
        if (w) { setWinner(w); setPhase('done'); setSpinsDone(3); }
      }
    });

    const token = localStorage.getItem('qt_admin_token');
    const socket = io(`${SOCKET_URL}/raffle`, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      // We need the slug — load raffle first
      api.get(`/raffle/admin/${id}`).then((r) => {
        socket.emit('raffle:admin-join', { slug: r.data.slug, token });
      });
    });

    socket.on('raffle:admin-ready', ({ raffle: r, participantCount: c }) => {
      setRaffle(r);
      setParticipantCount(c);
    });

    socket.on('raffle:count', (c) => setParticipantCount(c));

    socket.on('raffle:spinning', ({ spinNumber }) => {
      setSpinsDone(spinNumber);
      setSpinning(true);
      setPhase('spinning');
      setTimeout(() => setSpinning(false), spinNumber < 3 ? 3000 : 3500);
    });

    socket.on('raffle:winner', (data) => {
      setWinner(data);
      setPhase('done');
    });

    return () => socket.disconnect();
  }, [id]);

  async function openRaffle() {
    await api.patch(`/raffle/admin/${id}/status`, { status: 'OPEN' });
    setRaffle((r) => ({ ...r, status: 'OPEN' }));
  }

  function handleSpin() {
    if (spinning || spinsDone >= 3) return;
    const next = spinsDone + 1;
    socketRef.current?.emit('raffle:spin', { slug: raffle.slug, spinNumber: next });
  }

  if (!raffle) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-white transition-colors text-sm">← Admin</button>
        <span className="text-slate-600">/</span>
        <span className="font-bold truncate">{raffle.name}</span>
        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400">Sorteo</span>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Status & participant count */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-indigo-400">{participantCount}</p>
            <p className="text-slate-400 text-sm">Participantes</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-amber-400">{spinsDone}/3</p>
            <p className="text-slate-400 text-sm">Giros realizados</p>
          </div>
        </div>

        {/* Open raffle */}
        {raffle.status === 'DRAFT' && (
          <div className="glass rounded-xl p-5 text-center">
            <p className="text-slate-400 text-sm mb-3">El sorteo está cerrado. Ábrelo para que los participantes puedan inscribirse.</p>
            <button onClick={openRaffle}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all">
              🟢 Abrir sorteo
            </button>
          </div>
        )}

        {/* Share link */}
        {raffle.status === 'OPEN' && (
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Link de inscripción</p>
            <p className="text-indigo-400 text-sm break-all font-mono">{window.location.origin}/sorteo/{raffle.slug}</p>
            <p className="text-xs text-slate-500 mt-1">PIN: <span className="text-white font-bold">{raffle.pin}</span></p>
          </div>
        )}

        {/* Spin controls */}
        {raffle.status !== 'DRAFT' && phase !== 'done' && (
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-slate-400 text-sm mb-4">
              {spinsDone === 0 ? 'Cuando estés listo, realiza el primer giro.' :
               spinsDone === 1 ? 'Buen giro. Uno más antes del definitivo.' :
               spinsDone === 2 ? '¡Último giro! Este revelará al ganador.' : ''}
            </p>

            <motion.button
              onClick={handleSpin}
              disabled={spinning || spinsDone >= 3 || participantCount === 0}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-5 rounded-2xl font-black text-xl transition-all disabled:opacity-40
                ${spinsDone === 2 ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
            >
              {spinning ? '🎰 Girando...' :
               spinsDone === 0 ? '🎰 Primer giro' :
               spinsDone === 1 ? '🎰 Segundo giro' :
               spinsDone === 2 ? '🏆 ¡Girar para revelar ganador!' : '✅ Sorteo completado'}
            </motion.button>

            {participantCount === 0 && (
              <p className="text-red-400 text-xs mt-2">No hay participantes aún</p>
            )}

            {/* Spin indicators */}
            <div className="flex justify-center gap-3 mt-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`w-3 h-3 rounded-full transition-all ${spinsDone >= n ? 'bg-indigo-400' : 'bg-slate-700'}`} />
              ))}
            </div>
          </div>
        )}

        {/* Winner */}
        {phase === 'done' && winner && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-2xl p-6 border border-yellow-500/30 text-center">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-yellow-400 font-bold uppercase tracking-widest text-xs mb-2">Ganador del sorteo</p>
            <h2 className="text-2xl font-black text-white mb-4">{winner.nombre} {winner.apellido}</h2>
            <div className="grid grid-cols-1 gap-2 text-left text-sm">
              {[['DNI', winner.dni], ['Correo', winner.correo], ['Teléfono', winner.telefono]].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-slate-500 w-16 shrink-0">{k}:</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Entries list */}
        {raffle.entries?.length > 0 && (
          <div className="glass rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Participantes ({raffle.entries.length})
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {raffle.entries.map((e) => (
                <div key={e.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${e.isWinner ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-slate-800/50'}`}>
                  <span className="text-white">{e.nombre} {e.apellido}</span>
                  <span className="text-slate-500 text-xs">{e.dni}</span>
                  {e.isWinner && <span className="text-yellow-400 text-xs font-bold">GANADOR</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
