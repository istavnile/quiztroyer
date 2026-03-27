import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import api from '../../lib/api';
import BrandingLayout from '../../components/BrandingLayout';
import CountdownTimer from '../../components/CountdownTimer';
import { resolveSlideBackground } from '../../lib/slideThemes';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

const OPTION_COLORS = [
  { bg: 'bg-red-500/20    border-red-500/50',    icon: '🔴' },
  { bg: 'bg-blue-500/20   border-blue-500/50',   icon: '🔵' },
  { bg: 'bg-yellow-500/20 border-yellow-500/50', icon: '🟡' },
  { bg: 'bg-green-500/20  border-green-500/50',  icon: '🟢' },
];

// ── EN VIVO badge ─────────────────────────────────────────────────────────────
function LiveBadge() {
  return (
    <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 100, display: 'flex', alignItems: 'center', gap: 8 }}>
      <motion.div
        style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }}
        animate={{ opacity: [1, 0.2, 1], scale: [1, 0.8, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span style={{ color: '#ef4444', fontWeight: 900, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        En vivo
      </span>
    </div>
  );
}

// ── Question display (display-mode — no interaction) ─────────────────────────
function QuizDisplay({ options, revealConfig }) {
  const correctId = revealConfig?.type === 'QUIZ'
    ? revealConfig.config.options?.find((o) => o.isCorrect)?.id
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
      {options.map((opt, i) => {
        const col = OPTION_COLORS[i % OPTION_COLORS.length];
        const isCorrect = correctId === opt.id;
        const isWrong   = correctId && correctId !== opt.id;
        return (
          <motion.div key={opt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`border rounded-2xl p-4 text-left min-h-20 transition-all duration-300
              ${isCorrect ? 'bg-green-500/30 border-green-400 ring-2 ring-green-400 scale-105'
                : isWrong ? 'opacity-30 bg-white/5 border-white/10'
                : col.bg}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isCorrect ? '✅' : col.icon}</span>
              <span className="text-white font-semibold text-base leading-snug">{opt.text}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function TrueFalseDisplay({ revealConfig }) {
  const correct = revealConfig?.type === 'TRUEFALSE' ? revealConfig.config.correctAnswer : null;
  return (
    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
      {[true, false].map((val) => {
        const isCorrect = correct === val;
        const isWrong   = correct !== null && correct !== val;
        return (
          <div key={String(val)}
            className={`rounded-2xl py-8 text-center text-2xl font-black border-2 transition-all duration-300
              ${isCorrect ? 'bg-green-500/30 border-green-400 ring-2 ring-green-400 scale-105'
                : isWrong ? 'opacity-30 bg-white/5 border-white/10'
                : val ? 'bg-blue-500/20 border-blue-500/50' : 'bg-red-500/20 border-red-500/50'}`}>
            <span className="text-white">{val ? '✓ Verdadero' : '✗ Falso'}</span>
          </div>
        );
      })}
    </div>
  );
}

function PuzzleDisplay({ items, revealConfig }) {
  const display = revealConfig?.config?.items || items || [];
  return (
    <div className="flex flex-col gap-2 max-w-lg mx-auto w-full">
      {display.map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`rounded-2xl px-5 py-4 border-2 text-white font-bold flex items-center gap-4
            ${revealConfig ? 'bg-green-500/20 border-green-400' : 'bg-indigo-500/20 border-indigo-500/50'}`}>
          <span className="text-xl font-black opacity-50">{i + 1}</span>
          <span>{item}</span>
        </motion.div>
      ))}
    </div>
  );
}

function PinImageDisplay({ imageUrl, revealConfig }) {
  return (
    <div className="relative max-w-lg mx-auto w-full">
      <img src={imageUrl} alt="" className="w-full rounded-xl" />
      {revealConfig && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg"
          style={{ left: `${revealConfig.config.correctX}%`, top: `${revealConfig.config.correctY}%`, transform: 'translate(-50%,-50%)' }} />
      )}
    </div>
  );
}

// ── LOBBY ─────────────────────────────────────────────────────────────────────
function LobbyView({ name, playerCount, branding }) {
  const primary = branding?.primaryColor || '#6366f1';
  return (
    <BrandingLayout branding={branding}>
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[1,2,3].map((i) => (
            <div key={i} className="absolute rounded-full animate-ping" style={{
              width: `${i * 200}px`, height: `${i * 200}px`,
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              background: primary, opacity: 0.04, animationDelay: `${i * 0.4}s`, animationDuration: '2.4s',
            }} />
          ))}
        </div>
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }} className="text-center relative z-10">
          <div className="text-7xl mb-6">🎯</div>
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-3">{name}</h1>
          <p className="text-white/50 text-xl mb-10">El desafío está por comenzar</p>
          <div className="flex gap-2 justify-center mb-8">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-3 h-3 rounded-full"
                style={{ background: primary }}
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
            ))}
          </div>
          <div className="glass rounded-xl px-8 py-4 inline-flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: primary }} />
            <span className="text-2xl font-black text-white">{playerCount}</span>
            <span className="text-white/60">jugadores conectados</span>
          </div>
        </motion.div>
      </div>
    </BrandingLayout>
  );
}

// ── RANKING ───────────────────────────────────────────────────────────────────
function RankingView({ ranking, branding }) {
  const primary = branding?.primaryColor || '#6366f1';
  return (
    <BrandingLayout branding={branding}>
      <div className="flex-1 flex flex-col items-center justify-start p-6 overflow-auto">
        <motion.h2 initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black text-white mb-6 mt-2">Clasificación</motion.h2>
        <div className="w-full max-w-xl space-y-2">
          {ranking.slice(0, 10).map((p, i) => (
            <motion.div key={p.sessionId || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 rounded-xl px-5 py-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="font-black w-8 text-center text-lg"
                style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}>
                #{i + 1}
              </span>
              <span className="flex-1 text-white font-semibold truncate text-lg">{p.playerName}</span>
              <span className="font-bold" style={{ color: primary }}>{p.totalScore?.toLocaleString()} pts</span>
            </motion.div>
          ))}
        </div>
      </div>
    </BrandingLayout>
  );
}

// ── PODIUM ────────────────────────────────────────────────────────────────────
function PodiumView({ podium, branding }) {
  const primary = branding?.primaryColor || '#6366f1';
  const accent  = branding?.accentColor  || '#f59e0b';

  useEffect(() => {
    const colors = [primary, accent, '#ec4899', '#ffd700', '#c0c0c0'];
    setTimeout(() => confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 }, colors }), 400);
    const end = Date.now() + 8000;
    const stream = () => {
      confetti({ particleCount: 4, angle: 60,  spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(stream);
    };
    stream();
    const iv = setInterval(() => confetti({ particleCount: 80, spread: 90, origin: { x: Math.random(), y: Math.random() * 0.5 }, colors }), 3000);
    return () => clearInterval(iv);
  }, []);

  const [first, second, third] = podium || [];
  const podiumConfig = [
    { data: second, h: 'h-28', label: '🥈', color: '#c0c0c0', pos: '2', delay: 0.6 },
    { data: first,  h: 'h-40', label: '🥇', color: '#ffd700', pos: '1', delay: 1.0 },
    { data: third,  h: 'h-20', label: '🥉', color: '#cd7f32', pos: '3', delay: 0.3 },
  ];

  return (
    <BrandingLayout branding={branding}>
      <div className="flex-1 flex flex-col items-center justify-start p-6 overflow-auto relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="blob-anim-1 absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: '#ffd700' }} />
          <div className="blob-anim-2 absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-15" style={{ background: primary }} />
        </div>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8 mt-2 relative z-10">
          <h1 className="text-5xl font-black text-white">🏆 Resultados Finales</h1>
          <p className="text-white/50 mt-1">¡Gracias por participar!</p>
        </motion.div>
        <div className="flex items-end justify-center gap-3 mb-10 w-full max-w-md relative z-10">
          {podiumConfig.map(({ data, h, label, color, pos, delay }, i) => (
            <motion.div key={i} initial={{ y: 100, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay, type: 'spring', stiffness: 200, damping: 18 }}
              className="flex flex-col items-center flex-1">
              {data && (<>
                <div className="text-3xl mb-0.5">{label}</div>
                <div className="text-white font-bold text-sm text-center truncate w-full px-1">{data.name}</div>
                <div className="font-bold text-sm mb-1.5" style={{ color: primary }}>{data.score?.toLocaleString()} pts</div>
              </>)}
              <div className={`${h} w-full rounded-t-xl flex items-center justify-center`}
                style={{ background: color, opacity: data ? 1 : 0.25 }}>
                <span className="font-black text-2xl text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{pos}</span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="w-full max-w-md space-y-2 relative z-10">
          {(podium || []).slice(0, 10).map((player, i) => (
            <motion.div key={player.id || i} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.04 }}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="font-black text-white/50 w-7 text-center text-sm">#{i + 1}</span>
              <span className="flex-1 text-white font-semibold truncate">{player.name}</span>
              <span className="font-bold text-sm text-white/80">{player.score?.toLocaleString()}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </BrandingLayout>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ChallengeDisplay() {
  const { slug } = useParams();
  const socketRef = useRef(null);

  const [siteSettings, setSiteSettings] = useState({ homeBgColor: '#0f172a', homeButtonColor: '#6366f1', bgEffect: 'blobs', logoUrl: '' });
  const [challenge, setChallenge]       = useState(null);
  const [phase, setPhase]               = useState('LOBBY');
  const [slideIndex, setSlideIndex]     = useState(-1);
  const [totalSlides, setTotalSlides]   = useState(0);
  const [playerCount, setPlayerCount]   = useState(0);
  const [question, setQuestion]         = useState(null);
  const [revealConfig, setRevealConfig] = useState(null);
  const [slideStartTs, setSlideStartTs] = useState(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState(null);
  const [ranking, setRanking]           = useState([]);
  const [podium, setPodium]             = useState(null);

  useEffect(() => {
    api.get('/settings').then((r) => setSiteSettings((s) => ({ ...s, ...r.data }))).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/game`, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('display:join', { slug }));

    socket.on('display:ready', ({ challenge: c, phase: p, slideIndex: si, totalSlides: ts, playerCount: pc, currentQuestion, timeRemainingMs: tr, serverTimestamp }) => {
      setChallenge(c);
      setPhase(p);
      setSlideIndex(si);
      setTotalSlides(ts);
      setPlayerCount(pc);
      if (currentQuestion) {
        setQuestion(currentQuestion);
        setSlideStartTs(serverTimestamp || (Date.now() - (currentQuestion.timeLimit * 1000 - (tr || 0))));
        setTimeRemainingMs(tr);
      }
    });

    socket.on('room:players', ({ count }) => setPlayerCount(count));

    socket.on('game:start', ({ totalSlides: ts }) => { setTotalSlides(ts); setPhase('PLAYING'); setRevealConfig(null); });

    socket.on('slide:show', ({ question: q, timeRemainingMs: tr, slideIndex: si, totalSlides: ts, serverTimestamp }) => {
      setQuestion(q);
      setSlideIndex(si);
      setTotalSlides(ts);
      setRevealConfig(null);
      setPhase('PLAYING');
      setSlideStartTs(serverTimestamp || Date.now());
      setTimeRemainingMs(tr);
    });

    socket.on('slide:timeout', () => setRevealConfig((r) => r)); // keep reveal if already set

    socket.on('slide:reveal', ({ config, type }) => setRevealConfig({ config, type }));

    socket.on('ranking:update', ({ ranking: r }) => { setRanking(r); });
    socket.on('phase:ranking', () => setPhase('RANKING'));

    socket.on('game:end', ({ podium: p }) => { setPodium(p); setPhase('ENDED'); });

    return () => socket.disconnect();
  }, [slug]);

  const branding = { ...(challenge?.branding || {}), bgColor: challenge?.branding?.bgColor || siteSettings.homeBgColor };
  const primary  = branding.primaryColor || siteSettings.homeButtonColor;

  if (phase === 'LOBBY') return (
    <>
      <LiveBadge />
      <LobbyView name={challenge?.name || '…'} playerCount={playerCount} branding={branding} />
    </>
  );

  if (phase === 'ENDED' && podium) return (
    <>
      <LiveBadge />
      <PodiumView podium={podium} branding={branding} />
    </>
  );

  if (phase === 'RANKING') return (
    <>
      <LiveBadge />
      <RankingView ranking={ranking} branding={branding} />
    </>
  );

  if (!question) return (
    <BrandingLayout branding={branding}>
      <LiveBadge />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </BrandingLayout>
  );

  const slideBg    = resolveSlideBackground(question.config?._slideBackground);
  const slideImage = question.config?._slideImage || '';

  return (
    <BrandingLayout branding={branding}>
      <LiveBadge />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative" style={slideBg || {}}>
        {slideBg?.backgroundImage && <div className="absolute inset-0 bg-black/40 pointer-events-none" />}

        {/* Progress + Timer */}
        <div className="relative z-10 flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs font-semibold">{slideIndex + 1} / {totalSlides}</span>
            <div className="flex gap-1">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === slideIndex ? '20px' : '6px', background: i <= slideIndex ? primary : 'rgba(255,255,255,0.15)', opacity: i < slideIndex ? 0.45 : 1 }} />
              ))}
            </div>
          </div>
          {!revealConfig && slideStartTs && (
            <CountdownTimer timeLimit={question.timeLimit} startTimestamp={slideStartTs}
              initialRemaining={timeRemainingMs} accentColor={primary} />
          )}
          {revealConfig && (
            <div className="text-2xl font-black text-green-400 flex items-center gap-2">✅ Respuesta</div>
          )}
        </div>

        {/* Question */}
        <div className="relative z-10 flex-1 flex flex-col overflow-auto">
          {slideImage && (
            <div className="px-4 pt-4 shrink-0">
              <motion.img initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                src={slideImage} alt="Imagen del slide"
                className="mx-auto rounded-xl object-contain shadow-2xl"
                style={{ maxHeight: '220px', maxWidth: '100%' }} />
            </div>
          )}

          <div className="px-5 pt-4 pb-3 shrink-0">
            <AnimatePresence mode="wait">
              <motion.h2 key={question.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-4xl font-bold text-white leading-tight text-center drop-shadow">
                {question.prompt}
              </motion.h2>
            </AnimatePresence>
          </div>

          <div className="flex-1 px-4 pb-6 flex flex-col justify-center">
            {question.type === 'QUIZ' && (
              <QuizDisplay options={question.config.options || []} revealConfig={revealConfig} />
            )}
            {question.type === 'TRUEFALSE' && (
              <TrueFalseDisplay revealConfig={revealConfig} />
            )}
            {question.type === 'PUZZLE' && (
              <PuzzleDisplay items={question.config.items} revealConfig={revealConfig} />
            )}
            {question.type === 'PINIMAGE' && question.config.imageUrl && (
              <PinImageDisplay imageUrl={question.config.imageUrl} revealConfig={revealConfig} />
            )}
          </div>
        </div>
      </div>
    </BrandingLayout>
  );
}
