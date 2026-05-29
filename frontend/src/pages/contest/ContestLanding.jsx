import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ContestLayout, { GalaxyCanvas } from './ContestLayout';

const API = import.meta.env.VITE_API_URL || '';

const DEFAULT = {
  titulo: 'El Upgrade de lo que realmente importa.',
  tituloVw: 7,
  subtitulo: 'Muéstranos tu PC y cuéntanos tu historia. ¡El mejor setup ganará un upgrade épico!',
  badge: 'CONCURSO PATROCINADO POR NVIDIA · ASUS ROG · COMPUTERSHOP',
  imagenHero: '',
  textoFechaApertura: '1 de junio, 2026',
  textoFechaCierre:   '7 de junio, 23:59',
  textoFechaFinal:    '12 de junio, 2026',
  patrocinadores: [
    { nombre: 'NVIDIA',       logoUrl: '', color: '#76B900' },
    { nombre: 'ASUS ROG',     logoUrl: '', color: '#e61f30' },
    { nombre: 'ComputerShop', logoUrl: '', color: '#ffffff' },
  ],
  pasos: [
    { numero: '01', titulo: 'Inscríbete',            descripcion: 'Llena el formulario con los datos de tu PC, sube fotos y cuenta tu historia en máximo 150 palabras.' },
    { numero: '02', titulo: 'Espera los finalistas', descripcion: 'Nuestro equipo revisará todas las participaciones y seleccionará los mejores setups.' },
    { numero: '03', titulo: 'Vota y comparte',       descripcion: 'Del 8 al 11 de junio, la comunidad vota por sus favoritos. ¡El ganador anunciado en vivo el 12 de junio!' },
  ],
  premios: [
    { posicion: '1er lugar', descripcion: 'ASUS NVIDIA GeForce RTX 5060 Ti', color: '#76B900', imagenUrl: '' },
  ],
};

const STEP_COLORS = ['#76B900', '#e61f30', '#facc15'];

const GAMING_CSS = `
  @media (max-width: 640px) {
    .steps-grid    { grid-template-columns: 1fr !important; }
    .steps-connector { display: none !important; }
    .step-item     { padding: 0 0 20px 0 !important; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.9; }
    100% { transform: scale(3);   opacity: 0; }
  }
  @keyframes float-bob {
    0%,100% { transform: translateY(0px)   rotate(-1deg); }
    50%      { transform: translateY(-18px) rotate(1deg);  }
  }
  @keyframes hud-flicker {
    0%,94%,100% { opacity: 1;   }
    95%          { opacity: 0.2; }
    96%          { opacity: 1;   }
    97%          { opacity: 0.5; }
    98%          { opacity: 1;   }
  }
  @keyframes tactical-blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  .gaming-float   { animation: float-bob   3.8s ease-in-out infinite; }
  .gaming-flicker { animation: hud-flicker 7s   ease-in-out infinite; }
  .tactical-blink { animation: tactical-blink 1.1s step-start infinite; }
`;

/* ── HUD corner brackets ─────────────────────────────────────────── */
function HudCorners({ color, size = 20, thickness = 2 }) {
  const b = { background: color, position: 'absolute' };
  return (
    <>
      <div style={{ ...b, top: 0, left: 0,  width: size,      height: thickness }} />
      <div style={{ ...b, top: 0, left: 0,  width: thickness, height: size      }} />
      <div style={{ ...b, top: 0, right: 0, width: size,      height: thickness }} />
      <div style={{ ...b, top: 0, right: 0, width: thickness, height: size      }} />
      <div style={{ ...b, bottom: 0, left: 0,  width: size,      height: thickness }} />
      <div style={{ ...b, bottom: 0, left: 0,  width: thickness, height: size      }} />
      <div style={{ ...b, bottom: 0, right: 0, width: size,      height: thickness }} />
      <div style={{ ...b, bottom: 0, right: 0, width: thickness, height: size      }} />
    </>
  );
}

/* ── Pulsing concentric-ring dot ─────────────────────────────────── */
function PulsingDot({ color, size = 12 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {[1.4, 2].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `1px solid ${color}`,
          animation: `pulse-ring ${delay}s ease-out infinite`,
          animationDelay: `${i * 0.55}s`,
        }} />
      ))}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}, 0 0 18px ${color}66`,
      }} />
    </div>
  );
}

/* ── Animated scanning HUD corners (prize card) ─────────────────── */
function ScanningHudCorners({ color, size = 34, thickness = 2.5 }) {
  const corners = [
    { wrap: { top: 0,    left:  0 }, dx:  18, dy:  18, delay: 0    },
    { wrap: { top: 0,    right: 0 }, dx: -18, dy:  18, delay: 0.2  },
    { wrap: { bottom: 0, left:  0 }, dx:  18, dy: -18, delay: 0.4  },
    { wrap: { bottom: 0, right: 0 }, dx: -18, dy: -18, delay: 0.6  },
  ];

  return (
    <>
      {corners.map(({ wrap, dx, dy, delay }, i) => {
        const vEdge = 'top' in wrap ? { top: 0 } : { bottom: 0 };
        const hEdge = 'left' in wrap ? { left: 0 } : { right: 0 };
        return (
          <motion.div
            key={i}
            animate={{
              x:       [0, dx,  dx,  0,  0],
              y:       [0, dy,  dy,  0,  0],
              opacity: [1, 0.9, 0.06, 0.06, 1],
            }}
            transition={{
              x:       { duration: 3.0, repeat: Infinity, ease: 'easeInOut', delay, times: [0, 0.30, 0.50, 0.70, 1] },
              y:       { duration: 3.0, repeat: Infinity, ease: 'easeInOut', delay, times: [0, 0.30, 0.50, 0.70, 1] },
              opacity: { duration: 3.0, repeat: Infinity, ease: 'linear',    delay, times: [0, 0.28, 0.38, 0.65, 1] },
            }}
            style={{ position: 'absolute', ...wrap, width: size, height: size, pointerEvents: 'none', zIndex: 10 }}
          >
            <div style={{
              background: color,
              boxShadow: `0 0 7px ${color}, 0 0 18px ${color}88`,
              position: 'absolute', ...vEdge, ...hEdge, width: size, height: thickness,
            }} />
            <div style={{
              background: color,
              boxShadow: `0 0 7px ${color}, 0 0 18px ${color}88`,
              position: 'absolute', ...vEdge, ...hEdge, width: thickness, height: size,
            }} />
          </motion.div>
        );
      })}
    </>
  );
}

/* ── Terminal typewriter with glitch ────────────────────────────── */
const GLITCH_CHARS = '!@#$%^&*<>?\\|~[]{}ABCDEFabcdef0123456789';
function TerminalText({ text, delay = 0, speed = 54, started = true, showCursor = false, onDone }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);

  useEffect(() => {
    if (!started) { setDisplayed(''); setDone(false); return; }
    let cancelled = false;
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await pause(delay);
      for (let i = 0; i < text.length; i++) {
        if (cancelled) return;
        if (Math.random() < 0.28) {
          setDisplayed(text.slice(0, i) + GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]);
          await pause(50 + Math.random() * 30);
          if (cancelled) return;
        }
        setDisplayed(text.slice(0, i + 1));
        await pause(speed + Math.random() * 28 - 14);
      }
      if (!cancelled) { setDone(true); onDone?.(); }
    })();
    return () => { cancelled = true; };
  }, [text, delay, speed, started]);

  return (
    <span>
      {displayed}
      {showCursor && (
        <span className="tactical-blink" style={{ marginLeft: '1px' }}>█</span>
      )}
    </span>
  );
}

/* ── Live cycling terminal value ────────────────────────────────── */
function LiveDataLine({ values, color, interval = 3400 }) {
  const [idx, setIdx] = useState(0);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setFlash(true);
      setTimeout(() => { setIdx((i) => (i + 1) % values.length); setFlash(false); }, 110);
    }, interval);
    return () => clearInterval(id);
  }, [values.length, interval]);
  return (
    <span style={{
      color: flash ? `${color}33` : color,
      filter: flash ? 'blur(1.5px)' : 'none',
      transition: flash ? 'none' : 'color 0.18s, filter 0.18s',
      fontVariantNumeric: 'tabular-nums',
    }}>{values[idx]}</span>
  );
}

/* ── Valorant-style section header ───────────────────────────────── */
function SectionHeader({ label, count, countLabel, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -28, filter: 'blur(6px) brightness(3)' }}
      whileInView={{ opacity: 1, x: 0, filter: 'blur(0px) brightness(1)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '52px' }}
    >
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ width: '3px', height: '18px', background: accent, flexShrink: 0, transformOrigin: 'top' }}
      />
      <span style={{ color: `${accent}99`, fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.08em' }}>//</span>
      <span className="gaming-flicker" style={{ color: '#e2e8f0', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)', transformOrigin: 'left' }}
      />
      {count !== undefined && (
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          style={{ color: '#374151', fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.1em', flexShrink: 0 }}
        >
          [ {count}{countLabel ? ` ${countLabel}` : ''} ]
        </motion.span>
      )}
    </motion.div>
  );
}

/* ── Bottom-right system recon HUD ──────────────────────────────── */
function SysInfoHud({ accent }) {
  const [lines,   setLines]   = useState([]);
  const [sysRows, setSysRows] = useState(null);

  // Detect once on mount
  useEffect(() => {
    const ua = navigator.userAgent;
    let os = 'UNKNOWN';
    if      (/Windows NT 10/i.test(ua)) os = 'WIN 10/11';
    else if (/Mac OS X/i.test(ua))      os = 'MACOS';
    else if (/Android/i.test(ua))       os = 'ANDROID';
    else if (/iPhone|iPad/i.test(ua))   os = 'IOS';
    else if (/Linux/i.test(ua))         os = 'LINUX';
    else if (/Windows/i.test(ua))       os = 'WINDOWS';

    const rows = [];
    if (navigator.deviceMemory)        rows.push({ l: 'BAT', v: null }); // placeholder for battery
    rows.push({ l: 'OS',  v: os });
    if (navigator.deviceMemory)        rows.push({ l: 'RAM', v: `${navigator.deviceMemory} GB` });
    if (navigator.hardwareConcurrency) rows.push({ l: 'CPU', v: `${navigator.hardwareConcurrency}T` });
    rows.push({ l: 'RES', v: `${screen.width}\xD7${screen.height}` });
    rows.push({ l: 'INP', v: navigator.maxTouchPoints > 0 ? 'TOUCH' : 'MOUSE' });
    rows.push({ l: 'TZ',  v: Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().replace(/_/g, ' ') });
    if (navigator.connection?.effectiveType) rows.push({ l: 'NET', v: navigator.connection.effectiveType.toUpperCase() });

    const finalize = (batStr) => {
      const final = rows
        .filter((r) => r.l !== 'BAT')
        .map((r) => r);
      if (batStr) final.unshift({ l: 'BAT', v: batStr });
      setSysRows(final);
    };

    if (navigator.getBattery) {
      navigator.getBattery()
        .then((bat) => finalize(`${bat.charging ? '⚡' : ''}${Math.round(bat.level * 100)}%`))
        .catch(() => finalize(null));
    } else {
      finalize(null);
    }
  }, []);

  // Cycling terminal sequence
  useEffect(() => {
    if (!sysRows) return;
    let cancelled = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let k = 0;
    const add = (text, color) =>
      setLines((prev) => [...prev, { text, color, k: k++ }]);

    const run = async () => {
      while (!cancelled) {
        // ── Boot phase ───────────────────────────────────────────────
        setLines([{ text: '> initializing recon...', color: null, k: k++ }]);
        await sleep(850);  if (cancelled) return;
        add('> gathering system data...', null);
        await sleep(700);  if (cancelled) return;
        add('> parsing hardware...', null);
        await sleep(600);  if (cancelled) return;

        // ── Data reveal ──────────────────────────────────────────────
        setLines([]);
        for (const row of sysRows) {
          if (cancelled) return;
          add(`> ${row.l.padEnd(3)}  ${row.v}`, accent);
          await sleep(270);
        }

        // ── Hold ─────────────────────────────────────────────────────
        await sleep(5500); if (cancelled) return;

        // ── Update phase ─────────────────────────────────────────────
        add('> updating info...', null);
        await sleep(700);  if (cancelled) return;
        add('> sync: [OK]', '#76B900');
        await sleep(900);  if (cancelled) return;
        await sleep(300);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [sysRows, accent]);

  if (lines.length === 0) return null;

  return (
    <div className="gaming-flicker" style={{
      position: 'absolute', bottom: '22px', right: '22px', zIndex: 5,
      pointerEvents: 'none', fontFamily: 'monospace', textAlign: 'right',
    }}>
      <div style={{ borderRight: `2px solid ${accent}66`, paddingRight: '10px' }}>
        {lines.map((ln) => (
          <div key={ln.k} style={{ fontSize: '0.48rem', letterSpacing: '0.12em', lineHeight: 1.85, color: ln.color || `${accent}55` }}>
            <TerminalText text={ln.text} speed={26} started={true} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── GPU terminal cycling sequence ───────────────────────────────── */
function GpuTerminal({ gpuName, worthy, accent }) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (!gpuName) return;
    let cancelled = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let key = 0;
    const push = (text, color) =>
      setLines((prev) => [...prev.slice(-3), { text, color, k: key++ }]);

    const run = async () => {
      while (!cancelled) {
        setLines([]);
        push('> scanning hardware...', null);        await sleep(750);
        if (cancelled) return;
        push('error: no sudo command', '#e61f30');   await sleep(550);
        if (cancelled) return;
        push('> acquiring root access...', null);    await sleep(950);
        if (cancelled) return;
        push('> access granted', '#76B900');         await sleep(500);
        if (cancelled) return;
        push(`> GPU: ${gpuName}`, accent);
        if (!worthy) { await sleep(600); if (cancelled) return; push('> ⚠ gpu antiguo · upgrade!', '#e61f30'); }
        await sleep(2800);
        if (cancelled) return;
        push('> updating firmware...', null);        await sleep(650);
        if (cancelled) return;
        push('! connection lost', '#e61f30');        await sleep(500);
        if (cancelled) return;
        push('> reestablishing...', null);           await sleep(1000);
        if (cancelled) return;
        await sleep(300);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [gpuName, worthy, accent]);

  return (
    <div className="gaming-flicker" style={{
      position: 'absolute', bottom: '22px', left: '22px', zIndex: 5,
      pointerEvents: 'none', fontFamily: 'monospace', textAlign: 'left',
    }}>
      <div style={{ borderLeft: `2px solid ${accent}66`, paddingLeft: '10px' }}>
        {lines.map((ln) => (
          <div key={ln.k} style={{ fontSize: '0.48rem', letterSpacing: '0.12em', lineHeight: 1.85, color: ln.color || `${accent}55` }}>
            <TerminalText text={ln.text} speed={30} started={true} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function ContestLanding() {
  const [s, setS] = useState(DEFAULT);
  const open      = s.registrationOpen ?? false;
  const [gpuInfo, setGpuInfo] = useState(null);
  const isMobile = window.innerWidth < 640;

  useEffect(() => {
    fetch(`${API}/api/contest/settings`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setS({ ...DEFAULT, ...data }))
      .catch((err) => console.warn('[contest-settings]', err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (!ext) return;
        const raw = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        const angleMatch = raw.match(/ANGLE \((.+?)(?:\s+Direct3D|\s+OpenGL|\s+Metal|\s+Vulkan)/i);
        let name = angleMatch ? angleMatch[1].trim() : raw;
        if (/mozilla|swiftshader/i.test(name)) return;
        // clean "NVIDIA, NVIDIA GeForce..." → "NVIDIA GeForce..." and remove "(0x...)" hex suffix
        name = name.replace(/^(nvidia|amd|intel\(r\)|intel|ati),?\s*/i, '').trim();
        name = name.replace(/\s*\(0x[0-9a-f]+\)\s*$/i, '').trim();
        const worthy = /(rtx\s*4080|rtx\s*4090|rtx\s*5060\s*ti|rtx\s*507|rtx\s*508|rtx\s*5090)/i.test(name);
        setGpuInfo({ name, worthy });
      } catch {}
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const [dateSeq,  setDateSeq]  = useState(-1);
  const [stepsIn,  setStepsIn]  = useState(false);
  const [stepTick, setStepTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStepTick((t) => t + 1), 1800);
    return () => clearInterval(id);
  }, []);

  const titleWords  = s.titulo.trim().split(/\s+/);
  const titleMain   = titleWords.slice(0, -1).join(' ');
  const titleAccent = titleWords.slice(-1)[0];
  const primary     = s.patrocinadores?.[0];
  const accent      = primary?.color || '#76B900';

  return (
    <ContestLayout>
      <style>{GAMING_CSS}</style>

      {/* ══════════ HERO ══════════════════════════════════════════════ */}
      <section style={{ position: 'relative', padding: '80px 0 56px', textAlign: 'center', overflow: 'hidden' }}>

        {/* Hero BG image — rendered first so the nebula blends on top via mixBlendMode:screen */}
        {s.imagenHero && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
            <img src={s.imagenHero} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center center', opacity: 0.45 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #06070e)' }} />
          </div>
        )}

        {/* Nebulosa Shader confined to Hero with diffuse edges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.5, delay: 0.8 }}
          style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', maskImage: 'radial-gradient(ellipse 52% 62% at 50% 50%, black 10%, transparent 88%)', WebkitMaskImage: 'radial-gradient(ellipse 52% 62% at 50% 50%, black 10%, transparent 88%)' }}
        >
          <GalaxyCanvas accent={accent} />
        </motion.div>

        {/* Spotlight — sweeps across the hero text (desktop only) */}
        {!isMobile && (
          <motion.div
            animate={{ left: ['-10%', '60%', '110%', '-10%'] }}
            transition={{ duration: 9, repeat: Infinity, ease: [0.4, 0, 0.6, 1], times: [0, 0.38, 0.62, 1], repeatDelay: 1.2 }}
            style={{
              position: 'absolute', top: '-20%', width: '80%', bottom: '-20%',
              background: `radial-gradient(ellipse 55% 65% at 40% 50%, ${accent}2e 0%, ${accent}10 38%, transparent 68%)`,
              pointerEvents: 'none', zIndex: 1,
            }}
          />
        )}

        {/* Tactical HUD — top-left (live terminal feed) */}
        <div className="gaming-flicker" style={{
          position: 'absolute', top: '22px', left: '22px', zIndex: 5,
          pointerEvents: 'none', fontFamily: 'monospace', textAlign: 'left',
        }}>
          <div style={{ borderLeft: `2px solid ${accent}77`, paddingLeft: '10px' }}>
            <div style={{ fontSize: '0.5rem', letterSpacing: '0.14em', lineHeight: 1.9, color: `${accent}66` }}>
              <div>SYS&nbsp;<LiveDataLine values={['ONLINE','CPU:76%','GPU:94%','RAM:38%','TMP:62C']} color={accent} interval={2800} /></div>
              <div>NET&nbsp;<LiveDataLine values={['SECURED','PKT:1.2K','PING:4ms','BW:940M','ENC:AES']} color={accent} interval={3500} /></div>
            </div>
          </div>
        </div>

        {/* Tactical HUD — top-right (live terminal feed) */}
        <div className="gaming-flicker" style={{
          position: 'absolute', top: '22px', right: '22px', zIndex: 5,
          pointerEvents: 'none', textAlign: 'right', fontFamily: 'monospace',
        }}>
          <div style={{ borderRight: '2px solid rgba(255,255,255,0.1)', paddingRight: '10px' }}>
            <div style={{ fontSize: '0.5rem', letterSpacing: '0.12em', lineHeight: 1.9, color: 'rgba(255,255,255,0.2)' }}>
              <div><LiveDataLine values={['GU_2026','BUILD_01','V2.0.1','REV_047','GU_2026']} color="rgba(255,255,255,0.35)" interval={4100} /></div>
              <div><LiveDataLine
                values={open
                  ? ['REG_OPEN','ENT:12','DAYS:6','QUOTA:500','REG_OPEN']
                  : ['REG_CLSD','DL_PAST','REV_MODE','JUDGING','REG_CLSD']}
                color={open ? '#76B900' : '#e61f30'}
                interval={3200}
              /></div>
            </div>
          </div>
        </div>

        {/* Tactical HUD — bottom-left (GPU terminal easter egg) — desktop only */}
        {!isMobile && gpuInfo && <GpuTerminal gpuName={gpuInfo.name} worthy={gpuInfo.worthy} accent={accent} />}

        {/* Tactical HUD — bottom-right (system recon) — desktop only */}
        {!isMobile && <SysInfoHud accent={accent} />}


        {/* Fade divs removed for a seamless look */}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>

          {/* Text Vignette (Dark halo behind text for readability and aesthetic) */}
          <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', maxWidth: '1200px', height: '180%', background: 'radial-gradient(ellipse at center, rgba(6,7,14,0.85) 0%, rgba(6,7,14,0.4) 40%, transparent 70%)', pointerEvents: 'none', zIndex: -1, filter: 'blur(30px)' }} />

          {/* Badge — angular Valorant cut */}
          {s.badge && (
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '2rem' }}
            >
              <motion.span
                animate={{ opacity: [0.82, 1, 0.82] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                style={{
                  display: 'inline-block',
                  background: `${accent}10`,
                  border: `1px solid ${accent}44`,
                  borderLeft: `3px solid ${accent}`,
                  color: accent, fontSize: '0.61rem', letterSpacing: '0.22em',
                  fontWeight: 800, padding: '6px 20px 6px 14px',
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
                }}
              >
                {s.badge}
              </motion.span>
            </motion.div>
          )}

          {/* Glitch title */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
            <h1
              style={{ fontSize: `clamp(1rem, ${s.tituloVw ?? 7}vw, 9rem)`, fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', margin: 0 }}
            >
              {titleWords.map((word, i) => {
                const isAccent = i === titleWords.length - 1;
                return (
                  <motion.span
                    key={i}
                    initial={isMobile ? { opacity: 0 } : { opacity: 0, scale: 0.3, filter: 'blur(10px)' }}
                    animate={isMobile ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={isMobile
                      ? { duration: 0.35, delay: i * 0.07, ease: 'easeOut' }
                      : { duration: 0.9, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }
                    }
                    style={{ display: 'inline-block', marginRight: isAccent ? 0 : '0.25em' }}
                  >
                    {isAccent ? (
                      <motion.span
                        animate={{ textShadow: [
                          `0 0 40px ${accent}55, 0 0 80px ${accent}1a`,
                          `0 0 70px ${accent}99, 0 0 140px ${accent}33`,
                          `0 0 40px ${accent}55, 0 0 80px ${accent}1a`,
                        ] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ color: accent }}
                      >
                        {word}
                      </motion.span>
                    ) : (
                      word
                    )}
                  </motion.span>
                );
              })}
            </h1>

            {/* Glitch layers (desktop only) */}
            {!isMobile && <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: titleWords.length * 0.18 + 0.5, duration: 1 }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none' }}
            >
              {/* Glitch layer R */}
              <motion.div aria-hidden="true"
                animate={{
                  opacity:  [0, 0, 0.82, 0.1, 0.75, 0],
                  x:        [0, 0, -9,   2,   -6,   0],
                  clipPath: ['inset(35% 0 45% 0)', 'inset(35% 0 45% 0)', 'inset(12% 0 58% 0)', 'inset(55% 0 22% 0)', 'inset(28% 0 40% 0)', 'inset(0% 0 0% 0)'],
                }}
                transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 1.2, times: [0, 0.52, 0.57, 0.61, 0.65, 0.70] }}
                style={{
                  position: 'absolute', inset: 0,
                  fontSize: `clamp(1rem, ${s.tituloVw ?? 7}vw, 9rem)`, fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em',
                  color: '#e61f30',
                }}
              >
                {titleMain && <>{titleMain} </>}<span>{titleAccent}</span>
              </motion.div>

              {/* Glitch layer C */}
              <motion.div aria-hidden="true"
                animate={{
                  opacity:  [0, 0, 0.70, 0.08, 0.60, 0],
                  x:        [0, 0,  10,  -3,    7,   0],
                  clipPath: ['inset(62% 0 15% 0)', 'inset(62% 0 15% 0)', 'inset(70% 0 2% 0)', 'inset(40% 0 35% 0)', 'inset(58% 0 10% 0)', 'inset(0% 0 0% 0)'],
                }}
                transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 1.2, delay: 0.07, times: [0, 0.52, 0.57, 0.61, 0.65, 0.70] }}
                style={{
                  position: 'absolute', inset: 0,
                  fontSize: `clamp(1rem, ${s.tituloVw ?? 7}vw, 9rem)`, fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em',
                  color: '#00cfff',
                }}
              >
                {titleMain && <>{titleMain} </>}<span>{titleAccent}</span>
              </motion.div>
            </motion.div>}
          </div>

          {s.subtitulo && (
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: titleWords.length * 0.18 + 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ color: '#cbd5e1', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.75 }}
              dangerouslySetInnerHTML={{ __html: s.subtitulo }}
            />
          )}

          {/* Sponsor logos */}
          {s.patrocinadores?.some((p) => p.logoUrl) && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-8 mb-10 flex-wrap"
            >
              {s.patrocinadores.filter((p) => p.logoUrl).map((p) => (
                <img key={p.nombre} src={p.logoUrl} alt={p.nombre}
                  style={{ height: `${p.logoAltura || 52}px`, objectFit: 'contain', opacity: 0.88 }} />
              ))}
            </motion.div>
          )}

          {/* CTA buttons — parallelogram shape */}
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {open ? (
              <Link to="/concursos/el-gran-upgrade/inscripcion" style={{ textDecoration: 'none' }}>
                <motion.button
                  animate={{ filter: [`drop-shadow(0 0 12px ${accent}55)`, `drop-shadow(0 0 28px ${accent}cc) drop-shadow(0 0 50px ${accent}44)`, `drop-shadow(0 0 12px ${accent}55)`] }}
                  whileHover={{ filter: `drop-shadow(0 0 22px ${accent}) drop-shadow(0 0 60px ${accent}88)`, scale: 1.06 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background: accent, color: '#000', fontWeight: 900,
                    padding: '14px 52px', border: 'none', cursor: 'pointer',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                    fontSize: '0.9rem', position: 'relative', overflow: 'hidden',
                  }}
                >
                  <motion.div
                    animate={{ left: ['-80%', '130%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', top: 0, width: '60%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                  Inscribirme ahora
                </motion.button>
              </Link>
            ) : (
              <motion.span
                animate={{ opacity: [0.8, 1, 0.8] }}
                whileHover={{
                  opacity: 1,
                  background: accent,
                  color: '#000',
                  boxShadow: `0 0 50px ${accent}cc, 0 0 100px ${accent}55`,
                  filter: `drop-shadow(0 0 22px ${accent})`,
                  scale: 1.08,
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  display: 'inline-block',
                  background: `${accent}18`,
                  border: `1px solid ${accent}77`,
                  borderLeft: `3px solid ${accent}`,
                  boxShadow: `0 0 18px ${accent}33, inset 0 0 12px ${accent}0a`,
                  color: accent, padding: '14px 44px',
                  clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                  fontSize: '0.9rem', fontWeight: 700,
                }}
              >
                Inscripciones abren el {s.textoFechaApertura}
              </motion.span>
            )}
            <Link to="/concursos/el-gran-upgrade/votacion" style={{ textDecoration: 'none' }}>
              <motion.button
                initial={{ background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', boxShadow: '0 0 14px rgba(255,255,255,0.06)' }}
                whileHover={{
                  background: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  boxShadow: '0 0 50px rgba(255,255,255,0.45), 0 0 100px rgba(255,255,255,0.18)',
                  filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.9))',
                  scale: 1.08,
                }}
                transition={{ duration: 0.13 }}
                style={{
                  background: 'rgba(255,255,255,0.05)', color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.38)',
                  boxShadow: '0 0 14px rgba(255,255,255,0.06), inset 0 0 8px rgba(255,255,255,0.03)',
                  fontWeight: 600, padding: '14px 44px',
                  clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                  fontSize: '0.9rem', cursor: 'pointer', outline: 'none',
                }}
              >
                Ver finalistas y votar
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════ FECHAS ════════════════════════════════════════════ */}
      {/* seq: 0=label0  1=label1  2=label2  3=date0  4=date1  5=date2 */}
      <motion.div
        onViewportEnter={() => setDateSeq(0)}
        viewport={{ once: true }}
        style={{
          marginTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'center', alignItems: 'center',
        }}
      >
        {[
          { label: 'APERTURA',           date: s.textoFechaApertura, color: '#76B900', live: false },
          { label: 'CIERRE',             date: s.textoFechaCierre,   color: '#e61f30', live: false },
          { label: 'GRAN FINAL EN VIVO', date: s.textoFechaFinal,    color: '#facc15', live: true  },
        ].map(({ label, date, color, live }, i) => {
          const labelSeq = i;
          const dateSeqIdx = 3 + i;
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              whileHover={{
                background: `${color}12`,
                boxShadow: `inset 0 0 28px ${color}22, 0 0 18px ${color}22`,
                scale: 1.04,
                filter: `drop-shadow(0 0 10px ${color}55)`,
              }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              style={{
                padding: isMobile ? '14px 24px' : '16px 40px',
                textAlign: 'center',
                borderRight: !isMobile && i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                borderBottom: isMobile && i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                width: isMobile ? '100%' : 'auto',
                cursor: 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                {live ? (
                  <motion.div animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                    style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                ) : (
                  <span style={{ fontFamily: 'monospace', color: `${color}88`, fontSize: '0.55rem', lineHeight: 1 }}>//</span>
                )}
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.55rem', letterSpacing: '0.18em', fontWeight: 700, margin: 0, textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  <TerminalText
                    text={label} speed={36}
                    started={dateSeq >= labelSeq}
                    showCursor={dateSeq === labelSeq}
                    onDone={() => setDateSeq((s) => Math.max(s, labelSeq + 1))}
                  />
                </p>
              </div>
              <p style={{ color, fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '0.02em', lineHeight: 1, fontFamily: 'monospace', textShadow: `0 0 18px ${color}66` }}>
                <TerminalText
                  text={date} speed={58}
                  delay={dateSeqIdx === 3 ? 120 : 0}
                  started={dateSeq >= dateSeqIdx}
                  showCursor={dateSeq === dateSeqIdx || (dateSeq >= 6 && i === 2)}
                  onDone={() => setDateSeq((s) => Math.max(s, dateSeqIdx + 1))}
                />
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ══════════ CÓMO PARTICIPAR ═══════════════════════════════════ */}
      {s.pasos?.length > 0 && (
        <motion.section
          style={{ marginTop: '100px' }}
          onViewportEnter={() => setStepsIn(true)}
          viewport={{ once: true }}
        >
          <SectionHeader label="Cómo participar" count={s.pasos.length} countLabel="pasos" accent={accent} />

          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', position: 'relative' }}>

            {/* Sequential connector segments */}
            {[0, 1].map((seg) => {
              const segActive = (stepTick % s.pasos.length) === seg;
              return (
                <motion.div
                  key={seg}
                  className="steps-connector"
                  animate={{
                    opacity: segActive ? [0.25, 1, 0.25] : 0.12,
                    boxShadow: segActive
                      ? [`0 0 3px ${STEP_COLORS[seg]}44`, `0 0 10px ${STEP_COLORS[seg]}bb`, `0 0 3px ${STEP_COLORS[seg]}44`]
                      : 'none',
                  }}
                  transition={{ duration: 1.8, repeat: segActive ? Infinity : 0, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', top: '6px', height: '1px',
                    left:  seg === 0 ? '18px'                  : 'calc(33.33% + 38px)',
                    right: seg === 0 ? 'calc(66.66% - 32px)'  : '18px',
                    background: STEP_COLORS[seg],
                    zIndex: 0,
                  }}
                />
              );
            })}

            {s.pasos.map(({ numero, titulo, descripcion }, i) => {
              const clr = STEP_COLORS[i % STEP_COLORS.length];
              const isActive = (stepTick % s.pasos.length) === i;
              return (
                <motion.div
                  key={numero}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.14 }}
                  className="step-item"
                  style={{ padding: i === 0 ? '0 32px 0 0' : '0 32px 0 32px', position: 'relative', paddingBottom: '24px', display: 'flex', flexDirection: 'column' }}
                >
                  {/* Radar ping on active step */}
                  <div style={{ marginBottom: '28px', position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isActive && (
                      <motion.div
                        key={`ping-${stepTick}`}
                        initial={{ scale: 1, opacity: 0.9 }}
                        animate={{ scale: 5.5, opacity: 0 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        style={{
                          position: 'absolute', width: '12px', height: '12px', borderRadius: '50%',
                          border: `1.5px solid ${clr}`, pointerEvents: 'none',
                        }}
                      />
                    )}
                    <PulsingDot color={clr} size={12} />
                  </div>

                  {/* Ghost number behind content */}
                  <div aria-hidden="true" style={{
                    position: 'absolute', top: '-16px',
                    left: i === 0 ? '-12px' : '20px',
                    fontSize: '9rem', fontWeight: 900, lineHeight: 1,
                    color: clr, opacity: isActive ? 0.12 : 0.03,
                    userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em',
                    transition: 'opacity 0.5s ease', zIndex: 0,
                  }}>
                    {numero}
                  </div>

                  {/* Content card — Valorant angular border + glow */}
                  <motion.div
                    animate={isActive ? {
                      filter: [
                        `drop-shadow(0 0 6px ${clr}66)`,
                        `drop-shadow(0 0 18px ${clr}cc) drop-shadow(0 0 32px ${clr}55)`,
                        `drop-shadow(0 0 6px ${clr}66)`,
                      ],
                    } : { filter: `drop-shadow(0 0 0px ${clr}00)` }}
                    whileHover={{
                      filter: `drop-shadow(0 0 14px ${clr}99) drop-shadow(0 0 30px ${clr}44)`,
                      scale: 1.02,
                    }}
                    transition={isActive ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.25 }}
                    style={{
                      position: 'relative', zIndex: 1, flex: 1,
                      border: `1px solid ${isActive ? `${clr}66` : 'rgba(255,255,255,0.05)'}`,
                      clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
                      background: isActive ? `${clr}0c` : 'rgba(255,255,255,0.015)',
                      padding: '20px',
                      transition: 'border-color 0.45s, background 0.45s',
                    }}
                  >
                    {/* Active top-left accent bar */}
                    {isActive && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, width: '3px', height: '100%',
                        background: `linear-gradient(to bottom, ${clr}, ${clr}00)`,
                        transition: 'opacity 0.45s',
                      }} />
                    )}

                    <p style={{
                      color: isActive ? clr : `${clr}55`,
                      fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.22em',
                      marginBottom: '10px', textTransform: 'uppercase',
                      transition: 'color 0.45s',
                      fontFamily: 'monospace',
                    }}>
                      // PASO {numero}
                    </p>
                    <h3 style={{
                      color: isActive ? '#ffffff' : '#5b6471',
                      fontSize: '1.05rem', fontWeight: 800, marginBottom: '10px', lineHeight: 1.2,
                      textShadow: isActive ? `0 0 28px ${clr}66` : 'none',
                      transition: 'color 0.45s, text-shadow 0.45s',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                    }}>
                      <TerminalText text={titulo} delay={i * 500 + 150} speed={46} started={stepsIn} />
                    </h3>
                    <p style={{ color: isActive ? '#6b7280' : '#374151', fontSize: '0.85rem', lineHeight: 1.7, margin: 0, transition: 'color 0.45s' }}
                      dangerouslySetInnerHTML={{ __html: descripcion }} />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* ══════════ PREMIO ════════════════════════════════════════════ */}
      {s.premios?.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ marginTop: '100px' }}
        >
          <SectionHeader label="Premio" count={s.premios.length} countLabel={s.premios.length === 1 ? 'premio' : 'premios'} accent={accent} />

          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {s.premios.map(({ posicion, descripcion, color, imagenUrl }) => (
              <div key={posicion} style={{ position: 'relative', overflow: 'hidden' }}>

                {/* Crosshairs wrap the full card (text + image) */}
                <ScanningHudCorners color={color} size={10} />

                {/* Sweeping highlight */}
                <motion.div
                  animate={{ left: ['-80%', '130%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', top: 0, width: '50%', height: '100%',
                    background: `linear-gradient(90deg, transparent, ${color}14, transparent)`,
                    pointerEvents: 'none', zIndex: 1,
                  }}
                />

                {/* Pulsing left border glow — wraps text + image */}
                <motion.div
                  animate={{ boxShadow: [`-4px 0 12px ${color}44`, `-4px 0 28px ${color}99`, `-4px 0 12px ${color}44`] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    borderLeft: `3px solid ${color}`,
                    background: `linear-gradient(90deg, ${color}0d 0%, transparent 60%)`,
                  }}
                >
                  {/* Title */}
                  <div style={{ padding: '36px 32px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <PulsingDot color={color} size={8} />
                      <p style={{ color, fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0, fontFamily: 'monospace' }}>
                        // {posicion}
                      </p>
                    </div>
                    <motion.p
                      style={{
                        color: '#f9fafb', fontSize: 'clamp(1.3rem, 3vw, 2rem)',
                        fontWeight: 900, lineHeight: 1.15, margin: 0, letterSpacing: '-0.02em',
                        textTransform: 'uppercase', display: 'flex', flexWrap: 'wrap', gap: '0.3em',
                      }}
                    >
                      {descripcion.split(' ').map((word, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
                          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: i * 0.12, ease: 'easeOut' }}
                          animate={{ textShadow: [`0 0 20px ${color}00`, `0 0 40px ${color}44`, `0 0 20px ${color}00`] }}
                        >
                          {word}
                        </motion.span>
                      ))}
                    </motion.p>
                  </div>

                  {/* Image — absolutely centered, large, below title */}
                  {imagenUrl && (
                    <div style={{
                      position: 'relative', height: '400px',
                      background: `radial-gradient(ellipse at center, ${color}08 0%, transparent 70%)`,
                    }}>
                      <motion.img
                        src={imagenUrl} alt={descripcion}
                        className="gaming-float"
                        initial={{ opacity: 0, scale: 0.92 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        style={{
                          position: 'absolute',
                          left: '50%', top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '200%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ══════════ CTA FINAL ═════════════════════════════════════════ */}
      {open && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ marginTop: '100px', textAlign: 'center', paddingBottom: '32px' }}
        >
          <SectionHeader label="No te quedes fuera" accent={accent} />

          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: '16px', textTransform: 'uppercase' }}>
            ¿Listo para el{' '}
            <motion.span
              animate={{ textShadow: [`0 0 30px ${accent}33`, `0 0 70px ${accent}88`, `0 0 30px ${accent}33`] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ color: accent }}
            >
              Gran Upgrade?
            </motion.span>
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '44px', fontSize: '0.9rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            // INSCRIPCIONES CIERRAN EL <span style={{ color: '#e2e8f0' }}>{s.textoFechaCierre}</span>
          </p>

          <Link to="/concursos/el-gran-upgrade/inscripcion" style={{ textDecoration: 'none' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* Expanding pulse rings */}
              {[0, 0.6, 1.2].map((delay, i) => (
                <motion.div key={i}
                  animate={{ scale: [1, 2.8], opacity: [0.45, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', inset: 0,
                    border: `1px solid ${accent}`, pointerEvents: 'none',
                  }}
                />
              ))}

              <motion.button
                animate={{ filter: [`drop-shadow(0 0 14px ${accent}55)`, `drop-shadow(0 0 36px ${accent}cc) drop-shadow(0 0 64px ${accent}44)`, `drop-shadow(0 0 14px ${accent}55)`] }}
                whileHover={{ filter: `drop-shadow(0 0 28px ${accent}) drop-shadow(0 0 70px ${accent}88)`, scale: 1.07 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: accent, color: '#000', fontWeight: 900,
                  padding: '18px 72px', border: 'none', cursor: 'pointer',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  clipPath: 'polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)',
                  fontSize: '1rem', position: 'relative', overflow: 'hidden',
                }}
              >
                <motion.div
                  animate={{ left: ['-80%', '130%'] }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.9, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', top: 0, width: '60%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)',
                    pointerEvents: 'none',
                  }}
                />
                Inscribirme ahora
              </motion.button>
            </div>
          </Link>
        </motion.section>
      )}
    </ContestLayout>
  );
}
