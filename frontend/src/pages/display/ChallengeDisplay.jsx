import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import api from '../../lib/api';
import PageBackground from '../../components/PageBackground';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

const OPTION_COLORS = [
  { bg: 'bg-red-600',    border: 'border-red-400',    label: 'A' },
  { bg: 'bg-blue-600',   border: 'border-blue-400',   label: 'B' },
  { bg: 'bg-yellow-500', border: 'border-yellow-400', label: 'C' },
  { bg: 'bg-green-600',  border: 'border-green-400',  label: 'D' },
];

function CountdownRing({ timeMs, totalMs }) {
  const pct = Math.max(0, Math.min(1, timeMs / totalMs));
  const r = 44, circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s linear, stroke 0.5s' }} />
      </svg>
      <span className="text-3xl font-black text-white z-10">{Math.ceil(timeMs / 1000)}</span>
    </div>
  );
}

export default function ChallengeDisplay() {
  const { slug } = useParams();
  const socketRef = useRef(null);

  const [siteSettings, setSiteSettings] = useState({ homeBgColor: '#0f172a', homeButtonColor: '#6366f1', bgEffect: 'blobs', logoUrl: '' });
  const [challenge, setChallenge]   = useState(null);
  const [phase, setPhase]           = useState('LOBBY');
  const [slideIndex, setSlideIndex] = useState(-1);
  const [totalSlides, setTotalSlides] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [question, setQuestion]     = useState(null);
  const [revealConfig, setRevealConfig] = useState(null);
  const [timeMs, setTimeMs]         = useState(0);
  const [totalTimeMs, setTotalTimeMs] = useState(30000);
  const [ranking, setRanking]       = useState([]);
  const [podium, setPodium]         = useState(null);
  const timerRef = useRef(null);

  // Site settings for background
  useEffect(() => {
    api.get('/settings').then((r) => setSiteSettings((s) => ({ ...s, ...r.data }))).catch(() => {});
  }, []);

  function startTimer(ms) {
    setTimeMs(ms);
    setTotalTimeMs(ms);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeMs((t) => {
        if (t <= 100) { clearInterval(timerRef.current); return 0; }
        return t - 100;
      });
    }, 100);
  }

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/game`, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('display:join', { slug }));

    socket.on('display:ready', ({ challenge: c, phase: p, slideIndex: si, totalSlides: ts, playerCount: pc, currentQuestion, timeRemainingMs }) => {
      setChallenge(c);
      setPhase(p);
      setSlideIndex(si);
      setTotalSlides(ts);
      setPlayerCount(pc);
      if (currentQuestion && timeRemainingMs != null) {
        setQuestion(currentQuestion);
        startTimer(timeRemainingMs);
      }
    });

    socket.on('room:players', ({ count }) => setPlayerCount(count));

    socket.on('game:start', ({ totalSlides: ts }) => {
      setTotalSlides(ts);
      setPhase('PLAYING');
      setRevealConfig(null);
    });

    socket.on('slide:show', ({ question: q, timeRemainingMs, slideIndex: si, totalSlides: ts }) => {
      setQuestion(q);
      setSlideIndex(si);
      setTotalSlides(ts);
      setRevealConfig(null);
      setPhase('PLAYING');
      startTimer(timeRemainingMs);
    });

    socket.on('slide:timeout', () => {
      clearInterval(timerRef.current);
      setTimeMs(0);
    });

    socket.on('slide:reveal', ({ config, type }) => {
      setRevealConfig({ config, type });
      clearInterval(timerRef.current);
    });

    socket.on('ranking:update', ({ ranking: r }) => {
      setRanking(r);
      setPhase('RANKING');
    });

    socket.on('phase:ranking', () => setPhase('RANKING'));

    socket.on('game:end', ({ podium: p }) => {
      setPodium(p);
      setPhase('ENDED');
    });

    return () => { socket.disconnect(); clearInterval(timerRef.current); };
  }, [slug]);

  const branding = challenge?.branding || {};
  const bg       = branding.bgColor || siteSettings.homeBgColor;
  const primary  = branding.primaryColor || siteSettings.homeButtonColor;
  const logo     = branding.logoUrl || siteSettings.logoUrl;

  // --- LOBBY ---
  if (phase === 'LOBBY') return (
    <Screen bg={bg} siteSettings={siteSettings} primary={primary}>
      <Logo logo={logo} />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <h1 className="text-4xl sm:text-6xl font-black text-white mb-4">{challenge?.name || '…'}</h1>
        <p className="text-slate-400 text-xl mb-8">Esperando que el host inicie el desafío</p>
        <div className="flex items-center justify-center gap-3">
          <div className="flex gap-1">{[0,1,2].map(i => (
            <motion.div key={i} className="w-3 h-3 rounded-full bg-indigo-500"
              animate={{ y: [0, -12, 0] }} transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
          ))}</div>
        </div>
      </motion.div>
      <div className="flex items-center gap-2 bg-slate-800/60 rounded-full px-5 py-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-white font-bold text-lg">{playerCount}</span>
        <span className="text-slate-400">jugadores conectados</span>
      </div>
    </Screen>
  );

  // --- ENDED / PODIUM ---
  if (phase === 'ENDED' && podium) return (
    <Screen bg={bg} siteSettings={siteSettings} primary={primary}>
      <Logo logo={logo} />
      <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-black text-white mb-10">🏆 Podio Final</motion.h2>
      <div className="flex items-end gap-6 mb-8">
        {[podium[1], podium[0], podium[2]].map((p, visualIdx) => {
          if (!p) return <div key={visualIdx} className="w-40" />;
          const heights = ['h-32', 'h-48', 'h-28'];
          const ranks = [2, 1, 3];
          const colors = ['bg-slate-500', 'bg-yellow-500', 'bg-amber-700'];
          return (
            <motion.div key={p.rank} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: visualIdx * 0.2 }}
              className="flex flex-col items-center">
              <span className="text-white font-bold text-xl mb-2">{p.name}</span>
              <span className="text-slate-300 text-lg mb-3">{p.score} pts</span>
              <div className={`w-40 ${heights[visualIdx]} ${colors[visualIdx]} rounded-t-xl flex items-center justify-center`}>
                <span className="text-4xl font-black text-white">{ranks[visualIdx]}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Screen>
  );

  // --- RANKING ---
  if (phase === 'RANKING') return (
    <Screen bg={bg} siteSettings={siteSettings} primary={primary}>
      <Logo logo={logo} />
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl font-black text-white mb-8">
        Clasificación
      </motion.h2>
      <div className="w-full max-w-lg space-y-3">
        {ranking.slice(0, 8).map((p, i) => (
          <motion.div key={p.sessionId || i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-4 bg-slate-800/70 rounded-2xl px-5 py-3">
            <span className={`text-2xl font-black w-8 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>{i + 1}</span>
            <span className="flex-1 text-white font-bold text-xl truncate">{p.playerName}</span>
            <span className="text-indigo-300 font-bold text-lg">{p.totalScore} pts</span>
          </motion.div>
        ))}
      </div>
    </Screen>
  );

  // --- PLAYING ---
  if (!question) return (
    <Screen bg={bg} siteSettings={siteSettings} primary={primary}>
      <Logo logo={logo} />
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </Screen>
  );

  const correctOptionId = revealConfig?.type === 'QUIZ'
    ? revealConfig.config.options?.find((o) => o.isCorrect)?.id
    : null;
  const correctAnswer = revealConfig?.type === 'TRUEFALSE' ? revealConfig.config.correctAnswer : null;

  return (
    <Screen bg={bg} siteSettings={siteSettings} primary={primary}>
      {/* Top bar */}
      <div className="w-full flex items-center justify-between mb-6 px-2">
        <Logo logo={logo} small />
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">{slideIndex + 1} / {totalSlides}</span>
          <div className="flex gap-1">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i < slideIndex ? 'bg-indigo-500' : i === slideIndex ? 'bg-white' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>
        {!revealConfig && <CountdownRing timeMs={timeMs} totalMs={totalTimeMs} />}
        {revealConfig && <div className="w-28 h-28 flex items-center justify-center text-4xl">✅</div>}
      </div>

      {/* Question prompt */}
      <AnimatePresence mode="wait">
        <motion.div key={question.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl text-center mb-10 px-4">
          {question.config._slideBackground && (
            <div className="absolute inset-0 opacity-15 bg-cover bg-center -z-10 rounded-3xl"
              style={{ backgroundImage: `url(${question.config._slideBackground})` }} />
          )}
          {question.config._slideImage && (
            <img src={question.config._slideImage} alt="" className="h-48 object-contain mx-auto mb-6 rounded-2xl" />
          )}
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">{question.prompt}</h1>
        </motion.div>
      </AnimatePresence>

      {/* QUIZ options */}
      {question.type === 'QUIZ' && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-4xl px-4">
          {question.config.options?.map((opt, i) => {
            const col = OPTION_COLORS[i] || OPTION_COLORS[0];
            const isCorrect = revealConfig && correctOptionId === opt.id;
            const isWrong   = revealConfig && correctOptionId && correctOptionId !== opt.id;
            return (
              <motion.div key={opt.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl px-6 py-5 border-2 flex items-center gap-4 text-white text-2xl font-bold transition-all
                  ${isCorrect ? 'bg-green-600 border-green-400 scale-105' : isWrong ? 'opacity-30 bg-slate-800 border-slate-600' : `${col.bg} ${col.border}`}`}>
                <span className="text-3xl font-black opacity-70">{col.label}</span>
                <span className="flex-1">{opt.text}</span>
                {isCorrect && <span className="text-3xl">✓</span>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* TRUEFALSE */}
      {question.type === 'TRUEFALSE' && (
        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl px-4">
          {[true, false].map((val) => {
            const isCorrect = revealConfig && correctAnswer === val;
            const isWrong   = revealConfig && correctAnswer !== val;
            return (
              <motion.div key={String(val)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl py-8 text-center text-4xl font-black border-2 transition-all
                  ${isCorrect ? 'bg-green-600 border-green-400 text-white' : isWrong ? 'opacity-30 bg-slate-800 border-slate-600 text-slate-400' : val ? 'bg-blue-600 border-blue-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
                {val ? '✓ Verdadero' : '✗ Falso'}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* PUZZLE */}
      {question.type === 'PUZZLE' && (
        <div className="flex flex-col gap-3 w-full max-w-2xl px-4">
          {(revealConfig?.config?.items || question.config.items || []).map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl px-6 py-4 border-2 text-white text-xl font-bold flex items-center gap-4 ${revealConfig ? 'bg-green-700/50 border-green-500' : 'bg-indigo-700/50 border-indigo-400'}`}>
              <span className="text-2xl font-black opacity-60">{i + 1}</span>
              <span>{item}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* PINIMAGE */}
      {question.type === 'PINIMAGE' && question.config.imageUrl && (
        <div className="relative max-w-2xl w-full px-4">
          <img src={question.config.imageUrl} alt="" className="w-full rounded-2xl" />
          {revealConfig && (
            <div className="absolute" style={{
              left: `${revealConfig.config.correctX}%`, top: `${revealConfig.config.correctY}%`,
              transform: 'translate(-50%,-50%)'
            }}>
              <div className="w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
            </div>
          )}
        </div>
      )}

      {/* Bottom: player count */}
      <div className="absolute bottom-5 right-6 flex items-center gap-2 text-slate-500 text-sm">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        {playerCount} jugadores
      </div>
    </Screen>
  );
}

function Screen({ bg, siteSettings, primary, children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 relative overflow-hidden select-none"
      style={{ background: bg }}>
      <PageBackground siteSettings={siteSettings} color={primary} />
      <div className="relative z-10 flex flex-col items-center w-full gap-6">{children}</div>
    </div>
  );
}

function Logo({ logo, small }) {
  if (!logo) return null;
  return <img src={logo} alt="logo" className={`object-contain ${small ? 'h-8' : 'h-14'}`} />;
}
