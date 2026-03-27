import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import api from '../../lib/api';
import PageBackground from '../../components/PageBackground';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

const PALETTE = [
  '#f472b6','#a78bfa','#60a5fa','#34d399','#fbbf24',
  '#fb923c','#e879f9','#38bdf8','#4ade80','#f87171',
  '#c084fc','#fb7185','#22d3ee','#a3e635','#f97316',
];

const TRACKS = [
  { rxF: 0.40, ryF: 0.28, speed: 14 },
  { rxF: 0.32, ryF: 0.38, speed: 11 },
  { rxF: 0.46, ryF: 0.20, speed: 9  },
  { rxF: 0.24, ryF: 0.42, speed: 16 },
  { rxF: 0.48, ryF: 0.35, speed: 12 },
];

// ── Confetti canvas ─────────────────────────────────────────────────────────
function Confetti({ active }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width, y: -20 - Math.random() * 120,
      w: 7 + Math.random() * 11, h: 4 + Math.random() * 5,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      vx: (Math.random() - 0.5) * 5, vy: 2.5 + Math.random() * 3.5,
      rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 10,
    }));
    let rafId;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(p.rot * 0.05) * 0.5; p.y += p.vy; p.rot += p.rotV;
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color; ctx.globalAlpha = 0.85;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      rafId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [active]);
  if (!active) return null;
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 50 }} />;
}

// ── Camera flash ─────────────────────────────────────────────────────────────
function CameraFlash({ active }) {
  if (!active) return null;
  return (
    <motion.div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 60, pointerEvents: 'none' }}
      initial={{ opacity: 0 }} animate={{ opacity: [0, 0.95, 0, 0.7, 0, 0.5, 0] }}
      transition={{ duration: 1.8, ease: 'easeOut' }} />
  );
}

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

// ── Orbiting name ─────────────────────────────────────────────────────────────
function OrbitingName({ name, index, total, spinning, isFeatured, cx, cy, winW, winH }) {
  const { rxF, ryF, speed } = TRACKS[index % TRACKS.length];
  const rx = rxF * winW * 0.5, ry = ryF * winH * 0.5;
  const color = PALETTE[index % PALETTE.length];
  const size = [26, 20, 16][index % 3];
  const trackPhase = (index / Math.max(total, 1)) * 2 * Math.PI;
  const phaseDelay = -(trackPhase / (2 * Math.PI)) * speed;
  const actualSpeed = spinning ? speed * 0.45 : speed;
  const particles = [0, 72, 144, 216, 288].map((a) => ({ angle: a, r: size * 0.8 + 4, size: spinning ? 4 : 2.5 }));

  return (
    <motion.div style={{ position: 'absolute', left: cx, top: cy, willChange: 'transform' }}
      animate={isFeatured ? { x: 0, y: 0 } : { x: [rx, 0, -rx, 0, rx], y: [0, ry, 0, -ry, 0] }}
      transition={isFeatured ? { duration: 0.7, ease: 'easeOut' } : {
        x: { duration: actualSpeed, repeat: Infinity, ease: 'linear', delay: phaseDelay },
        y: { duration: actualSpeed, repeat: Infinity, ease: 'linear', delay: phaseDelay },
      }}>
      <motion.div style={{ transform: 'translate(-50%, -50%)', position: 'relative', display: 'inline-block' }}
        animate={isFeatured ? { scale: 2.8 } : spinning ? { scale: [1, 1.25, 0.85, 1.15, 1], rotate: [-2, 3, -3, 2, -2] } : { scale: [1, 1.05, 1] }}
        transition={isFeatured ? { duration: 0.7, ease: 'easeOut' } : spinning
          ? { duration: 0.5 + (index % 3) * 0.15, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 3 + (index % 4), repeat: Infinity, ease: 'easeInOut' }}>
        <div style={{ color, fontSize: size, fontWeight: 900, whiteSpace: 'nowrap', userSelect: 'none', lineHeight: 1,
          textShadow: isFeatured ? `0 0 30px ${color}ff, 0 0 60px ${color}cc, 0 0 100px ${color}88`
            : spinning ? `0 0 20px ${color}ff, 0 0 40px ${color}aa`
            : `0 0 16px ${color}cc, 0 0 32px ${color}44` }}>
          {name}
        </div>
        {(spinning || isFeatured) && particles.map((p) => (
          <motion.div key={p.angle} style={{ position: 'absolute', top: '50%', left: '50%', width: p.size, height: p.size,
            borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}, 0 0 16px ${color}88`,
            marginTop: -p.size / 2, marginLeft: -p.size / 2 }}
            animate={{ x: [Math.cos((p.angle * Math.PI) / 180) * p.r, Math.cos(((p.angle + 180) * Math.PI) / 180) * p.r, Math.cos((p.angle * Math.PI) / 180) * p.r],
              y: [Math.sin((p.angle * Math.PI) / 180) * p.r, Math.sin(((p.angle + 180) * Math.PI) / 180) * p.r, Math.sin((p.angle * Math.PI) / 180) * p.r],
              opacity: [0.8, 0.3, 0.8], scale: [1, 1.5, 1] }}
            transition={{ duration: 1.2 + (p.angle / 360), repeat: Infinity, ease: 'easeInOut' }} />
        ))}
      </motion.div>
    </motion.div>
  );
}

function WordCloud({ names, spinning, featuredName }) {
  const [winSize, setWinSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const fn = () => setWinSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  const cx = winSize.w / 2, cy = winSize.h / 2;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {names.map((name, i) => (
        <OrbitingName key={name} name={name} index={i} total={names.length}
          spinning={spinning} isFeatured={name === featuredName} cx={cx} cy={cy} winW={winSize.w} winH={winSize.h} />
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RaffleDisplay() {
  const { slug } = useParams();
  const socketRef = useRef(null);

  const [siteSettings, setSiteSettings] = useState({ homeBgColor: '#0f172a', homeButtonColor: '#6366f1', bgEffect: 'blobs', logoUrl: '' });
  const [raffle, setRaffle]           = useState(null);
  const [phase, setPhase]             = useState('lobby');
  const [participantCount, setCount]  = useState(0);
  const [roster, setRoster]           = useState([]);
  const [spinNumber, setSpinNumber]   = useState(0);
  const [spinResult, setSpinResult]   = useState(null);
  const [winner, setWinner]           = useState(null);
  const [featuredName, setFeatured]   = useState(null);
  const [flashActive, setFlash]       = useState(false);

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
      setRoster(n);
      if (n.length > 0) setPhase('wordcloud');
      if (w) { setWinner(w); setPhase('winner'); }
    });

    socket.on('raffle:count', (c) => setCount(c));
    socket.on('raffle:roster', (n) => { setRoster(n); if (n.length > 0) setPhase((p) => p === 'lobby' ? 'wordcloud' : p); });

    socket.on('raffle:spinning', ({ spinNumber: n }) => { setSpinNumber(n); setFeatured(null); setPhase('spinning'); });

    socket.on('raffle:spin-result', ({ spinNumber: n, nombre: nb, apellido: ap }) => {
      const full = `${nb} ${ap}`;
      setFeatured(full);
      setTimeout(() => { setSpinResult({ spinNumber: n, nombre: nb, apellido: ap }); setPhase('spin-result'); setFeatured(null); }, 1400);
    });

    socket.on('raffle:winner', (data) => { setWinner(data); setPhase('winner'); setTimeout(() => setFlash(true), 300); });

    return () => socket.disconnect();
  }, [slug]);

  const branding   = raffle?.branding || {};
  const bg         = branding.bgColor || siteSettings.homeBgColor;
  const primary    = branding.primaryColor || siteSettings.homeButtonColor;
  const logoUrl    = branding.logoUrl || siteSettings.logoUrl;

  const LogoHeader = () => logoUrl ? (
    <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
      <img src={logoUrl} alt="logo" style={{ height: 40, objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.5))' }} />
    </div>
  ) : null;

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (phase === 'lobby') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: bg }}>
      <PageBackground siteSettings={{ ...siteSettings, homeBgColor: bg, homeButtonColor: primary }} color={primary} />
      <LiveBadge />
      <LogoHeader />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[1,2,3].map((i) => (
          <div key={i} className="absolute rounded-full animate-ping" style={{
            width: `${i * Math.min(180, window.innerWidth * 0.35)}px`, height: `${i * Math.min(180, window.innerWidth * 0.35)}px`,
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: primary, opacity: 0.05, animationDelay: `${i * 0.35}s`, animationDuration: '2.2s',
          }} />
        ))}
      </div>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="text-center relative z-10">
        <div className="text-6xl mb-4">🎟️</div>
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">{raffle?.name || '…'}</h1>
        <p className="text-white/50 mb-8">Esperando participantes...</p>
        <div className="glass rounded-xl px-6 py-3 inline-flex items-center gap-2">
          <span className="text-2xl font-black" style={{ color: primary }}>{participantCount}</span>
          <span className="text-white/60 text-sm">participantes registrados</span>
        </div>
      </motion.div>
    </div>
  );

  // ── WORDCLOUD / SPINNING ───────────────────────────────────────────────────
  if (phase === 'wordcloud' || phase === 'spinning') {
    const isSpinning = phase === 'spinning';
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: bg }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="blob-anim-1 absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full blur-3xl opacity-25" style={{ background: primary }} />
          <div className="blob-anim-2 absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full blur-3xl opacity-20" style={{ background: primary }} />
          <div className="blob-anim-3 absolute rounded-full blur-3xl opacity-15" style={{ background: '#ec4899', width: 200, height: 200, top: '50%', left: '50%' }} />
        </div>
        <LiveBadge />
        <LogoHeader />
        <WordCloud names={roster} spinning={isSpinning} featuredName={featuredName} />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-10">
          {isSpinning ? (
            <motion.div key="spinning-badge" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="glass rounded-2xl px-6 py-3 text-center">
              <p className="text-white font-black text-lg">🎰 Girando #{spinNumber}...</p>
              <p className="text-white/50 text-xs mt-1">{spinNumber === 1 ? 'Primer giro' : spinNumber === 2 ? 'Segundo giro' : '¡Giro final!'}</p>
            </motion.div>
          ) : (
            <div className="glass rounded-2xl px-6 py-3 text-center">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: primary }} />
                <p className="text-white/70 text-sm">{participantCount} participantes · Esperando al host</p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute left-0 right-0 flex justify-center z-10" style={{ top: logoUrl ? 70 : 24 }}>
          <div className="text-white/30 text-xs uppercase tracking-widest font-bold">🎟️ Sorteo en vivo</div>
        </div>
      </div>
    );
  }

  // ── SPIN RESULT ────────────────────────────────────────────────────────────
  if (phase === 'spin-result' && spinResult) return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6" style={{ background: bg }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob-anim-1 absolute -top-20 -right-20 w-[280px] h-[280px] rounded-full blur-3xl opacity-20" style={{ background: PALETTE[spinResult.spinNumber] }} />
        <div className="blob-anim-2 absolute -bottom-20 -left-20 w-[280px] h-[280px] rounded-full blur-3xl opacity-20" style={{ background: PALETTE[spinResult.spinNumber + 2] }} />
      </div>
      <LiveBadge />
      <LogoHeader />
      <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 250, damping: 18 }} className="text-center relative z-10">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Giro #{spinResult.spinNumber}</p>
        <div className="text-6xl mb-4">{spinResult.spinNumber < 3 ? '😬' : '🏆'}</div>
        <p className="text-white/60 text-sm mb-1 uppercase tracking-wider">
          {spinResult.spinNumber < 3 ? 'Esta vez el giro apuntó a...' : '¡El ganador es...!'}
        </p>
        <h2 className="font-black text-white mb-6"
          style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', textShadow: `0 0 40px ${PALETTE[spinResult.spinNumber]}` }}>
          {spinResult.nombre} {spinResult.apellido}
        </h2>
      </motion.div>
    </div>
  );

  // ── WINNER ─────────────────────────────────────────────────────────────────
  if (phase === 'winner' && winner) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: bg }}>
      <Confetti active={flashActive} />
      <CameraFlash active={flashActive} />
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob-anim-1 absolute -top-20 -right-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full blur-3xl opacity-40" style={{ background: '#ffd700' }} />
        <div className="blob-anim-2 absolute -bottom-20 -left-20 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full blur-3xl opacity-30" style={{ background: '#f59e0b' }} />
      </div>
      <LiveBadge />
      <LogoHeader />
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-center relative z-10">
        <motion.div className="text-7xl mb-3"
          animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
          transition={{ delay: 0.5, duration: 1, ease: 'easeInOut' }}>🏆</motion.div>
        <p className="text-yellow-400 font-bold uppercase tracking-widest text-xs mb-2">¡Ganador del sorteo!</p>
        <motion.h1 className="font-black text-white mb-6"
          style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', textShadow: '0 0 60px #ffd70088' }}
          animate={{ textShadow: ['0 0 60px #ffd70088', '0 0 120px #ffd700cc', '0 0 60px #ffd70088'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          {winner.nombre} {winner.apellido}
        </motion.h1>
      </motion.div>
    </div>
  );

  return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Cargando...</div>;
}
