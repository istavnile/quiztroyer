import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ContestLayout from './ContestLayout';
import { isRegistrationOpen } from '../../lib/contestConstants';

const API = import.meta.env.VITE_API_URL || '';

const DEFAULT = {
  titulo: 'El Gran Upgrade',
  subtitulo: 'Muéstranos tu PC y cuéntanos tu historia. Los mejores setups ganarán un upgrade épico con hardware NVIDIA y ASUS ROG.',
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
function TerminalText({ text, delay = 0, speed = 54, started = true, onDone }) {
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
      <span className="tactical-blink" style={{ marginLeft: '1px', opacity: done ? 0.45 : 1 }}>█</span>
    </span>
  );
}

/* ── Valorant-style section header ───────────────────────────────── */
function SectionHeader({ label, count, countLabel, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '52px' }}>
      <div style={{ width: '3px', height: '18px', background: accent, flexShrink: 0 }} />
      <span style={{ color: `${accent}99`, fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.08em' }}>//</span>
      <span style={{ color: '#e2e8f0', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
      {count !== undefined && (
        <span style={{ color: '#374151', fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.1em', flexShrink: 0 }}>
          [ {count}{countLabel ? ` ${countLabel}` : ''} ]
        </span>
      )}
    </div>
  );
}

/* ── WebGL galaxy shader ─────────────────────────────────────────── */
const VERT = `attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.,1.);}`;
const FRAG = `precision mediump float;
uniform vec2 u_res;uniform float u_t;uniform vec3 u_acc;
float h21(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.1+vec2(1.7,9.2);a*=.5;}return v;}
float star(vec2 uv,float sc){
  vec2 g=floor(uv*sc),f=fract(uv*sc)-.5;float hv=h21(g);
  if(hv<.967)return 0.;float b=(hv-.967)/.033;
  float tw=.55+.45*sin(u_t*(1.8+hv*5.)+hv*6.28);float sz=.014+b*.028;
  return smoothstep(sz,.0,length(f))*tw*b;}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  float asp=u_res.x/u_res.y;
  vec2 p=(uv-.5)*vec2(asp,1.);
  float c=cos(u_t*.05),s=sin(u_t*.05);
  vec2 rp=vec2(c*p.x-s*p.y,s*p.x+c*p.y);
  float n1=fbm(rp*2.2+u_t*.3);
  float n2=fbm(rp*3.5-u_t*.2+vec2(5.1,2.3));
  float neb=fbm(rp*1.7+n1*.5);
  float core=exp(-length(rp)*4.2)*.55;
  float halo=exp(-length(rp)*1.5)*.1;
  vec3 red=vec3(.85,.12,.19);
  vec3 col=vec3(.03,.03,.05);
  col+=u_acc*smoothstep(.3,.75,n1)*neb*.2;
  col+=red*smoothstep(.5,.85,n2)*(1.-neb)*.11;
  col+=u_acc*core+u_acc*halo;
  col+=red*exp(-length(rp+vec2(.28,.08))*5.)*.07;
  float st=star(uv+u_t*.001,55.)+star(uv*1.35+u_t*.002+.5,78.)*.7+star(uv*.78-u_t*.0015+.3,38.)*1.1;
  col+=vec3(st)*.95+st*u_acc*.18;
  col*=1.-smoothstep(.2,1.05,length(p*.8));
  gl_FragColor=vec4(col,1.);}`;

function GalaxyCanvas({ accent = '#76B900' }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uT   = gl.getUniformLocation(prog, 'u_t');
    const uAcc = gl.getUniformLocation(prog, 'u_acc');
    const r = parseInt(accent.slice(1,3),16)/255;
    const g = parseInt(accent.slice(3,5),16)/255;
    const b = parseInt(accent.slice(5,7),16)/255;
    gl.uniform3f(uAcc, r, g, b);
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const t0 = performance.now(); let raf;
    const frame = () => { gl.uniform1f(uT, (performance.now()-t0)/1000); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); raf=requestAnimationFrame(frame); };
    frame();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [accent]);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function ContestLanding() {
  const [s, setS] = useState(DEFAULT);
  const open      = isRegistrationOpen();

  useEffect(() => {
    fetch(`${API}/api/contest/settings`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setS({ ...DEFAULT, ...data }))
      .catch((err) => console.warn('[contest-settings]', err));
  }, []);

  const [datesIn,  setDatesIn]  = useState(false);
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
      <section style={{ position: 'relative', padding: '80px 0 56px', overflow: 'hidden', textAlign: 'center' }}>

        {/* Galaxy shader */}
        <GalaxyCanvas accent={accent} />

        {/* Tactical HUD — top-left */}
        <div className="gaming-flicker" style={{
          position: 'absolute', top: '22px', left: '22px', zIndex: 5,
          pointerEvents: 'none', fontFamily: 'monospace',
        }}>
          <div style={{ borderLeft: `2px solid ${accent}77`, paddingLeft: '10px' }}>
            <div style={{ fontSize: '0.5rem', letterSpacing: '0.14em', lineHeight: 1.9, color: `${accent}aa` }}>
              <div>SYS <span style={{ color: accent }}>ONLINE</span></div>
              <div>NET <span style={{ color: accent }}>SECURED</span></div>
            </div>
          </div>
        </div>

        {/* Tactical HUD — top-right */}
        <div className="gaming-flicker" style={{
          position: 'absolute', top: '22px', right: '22px', zIndex: 5,
          pointerEvents: 'none', textAlign: 'right', fontFamily: 'monospace',
        }}>
          <div style={{ borderRight: '2px solid rgba(255,255,255,0.1)', paddingRight: '10px' }}>
            <div style={{ fontSize: '0.5rem', letterSpacing: '0.12em', lineHeight: 1.9, color: 'rgba(255,255,255,0.25)' }}>
              <div>GU_2026</div>
              <div style={{ color: open ? '#76B900' : '#e61f30' }}>{open ? 'REG_OPEN' : 'REG_CLOSED'}</div>
            </div>
          </div>
        </div>

        {/* Optional hero BG image overlay */}
        {s.imagenHero && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
            <img src={s.imagenHero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #06070e)' }} />
          </div>
        )}

        {/* Fade galaxy into page — all 4 edges so the canvas has no visible rect border */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '240px', background: 'linear-gradient(to bottom, transparent, #06070e)', pointerEvents: 'none', zIndex: 3 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '110px', background: 'linear-gradient(to bottom, #06070e, transparent)', pointerEvents: 'none', zIndex: 3 }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '220px', background: 'linear-gradient(to right, #06070e, transparent)', pointerEvents: 'none', zIndex: 3 }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '220px', background: 'linear-gradient(to left, #06070e, transparent)', pointerEvents: 'none', zIndex: 3 }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>

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
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em', margin: 0 }}
            >
              {titleMain && <>{titleMain} </>}
              <motion.span
                animate={{ textShadow: [
                  `0 0 40px ${accent}55, 0 0 80px ${accent}1a`,
                  `0 0 70px ${accent}99, 0 0 140px ${accent}33`,
                  `0 0 40px ${accent}55, 0 0 80px ${accent}1a`,
                ] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ color: accent }}
              >
                {titleAccent}
              </motion.span>
            </motion.h1>

            {/* Glitch layer R */}
            <motion.div aria-hidden="true"
              animate={{
                opacity:  [0, 0, 0.82, 0.1, 0.75, 0],
                x:        [0, 0, -9,   2,   -6,   0],
                clipPath: ['inset(35% 0 45% 0)', 'inset(35% 0 45% 0)', 'inset(12% 0 58% 0)', 'inset(55% 0 22% 0)', 'inset(28% 0 40% 0)', 'inset(0% 0 0% 0)'],
              }}
              transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 1.2, times: [0, 0.52, 0.57, 0.61, 0.65, 0.70] }}
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none',
                fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em',
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
                position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none',
                fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.03em',
                color: '#00cfff',
              }}
            >
              {titleMain && <>{titleMain} </>}<span>{titleAccent}</span>
            </motion.div>
          </div>

          {s.subtitulo && (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              style={{ color: '#6b7280', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.75 }}
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
                animate={{ opacity: [0.75, 1, 0.75] }}
                whileHover={{
                  opacity: 1,
                  filter: `drop-shadow(0 0 12px ${accent}bb) drop-shadow(0 0 28px ${accent}55)`,
                  scale: 1.03,
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  display: 'inline-block',
                  background: `${accent}08`, border: `1px solid ${accent}33`,
                  borderLeft: `3px solid ${accent}`,
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
                initial={{ filter: 'none' }}
                whileHover={{
                  color: '#fff',
                  filter: `drop-shadow(0 0 10px ${accent}99) drop-shadow(0 0 26px ${accent}44)`,
                  scale: 1.04,
                }}
                transition={{ duration: 0.16 }}
                style={{
                  background: 'transparent', color: '#9ca3af',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontWeight: 600, padding: '14px 44px',
                  clipPath: 'polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)',
                  fontSize: '0.9rem', cursor: 'pointer', outline: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}55`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
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
        onViewportEnter={() => { setDatesIn(true); setDateSeq(0); }}
        viewport={{ once: true }}
        style={{
          marginTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}
      >
        {[
          { label: 'APERTURA',           date: s.textoFechaApertura, color: '#76B900', live: false },
          { label: 'CIERRE',             date: s.textoFechaCierre,   color: '#e61f30', live: false },
          { label: 'GRAN FINAL EN VIVO', date: s.textoFechaFinal,    color: '#facc15', live: true  },
        ].map(({ label, date, color, live }, i) => {
          const labelSeq = i;       // 0 1 2
          const dateSeqIdx = 3 + i; // 3 4 5
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              style={{ padding: '12px 36px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                {live ? (
                  <motion.div animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                    style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                ) : (
                  <span style={{ fontFamily: 'monospace', color: `${color}55`, fontSize: '0.5rem', lineHeight: 1 }}>//</span>
                )}
                <p style={{ color: '#374151', fontSize: '0.5rem', letterSpacing: '0.18em', fontWeight: 700, margin: 0, textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  <TerminalText
                    text={label} speed={36}
                    started={dateSeq >= labelSeq}
                    onDone={() => setDateSeq((s) => Math.max(s, labelSeq + 1))}
                  />
                </p>
              </div>
              <p style={{ color, fontSize: '0.86rem', fontWeight: 800, margin: 0, letterSpacing: '0.01em', lineHeight: 1, fontFamily: 'monospace' }}>
                <TerminalText
                  text={date} speed={58}
                  delay={dateSeqIdx === 3 ? 120 : 0}
                  started={dateSeq >= dateSeqIdx}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', position: 'relative' }}>

            {/* Sequential connector segments */}
            {[0, 1].map((seg) => {
              const segActive = (stepTick % s.pasos.length) === seg;
              return (
                <motion.div
                  key={seg}
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
                  style={{ padding: i === 0 ? '0 32px 0 0' : '0 32px 0 32px', position: 'relative', paddingBottom: '24px' }}
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
                      position: 'relative', zIndex: 1,
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
                <ScanningHudCorners color={color} size={22} />

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

                {/* Pulsing left border glow */}
                <motion.div
                  animate={{ boxShadow: [`-4px 0 12px ${color}44`, `-4px 0 28px ${color}99`, `-4px 0 12px ${color}44`] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    display: 'flex', alignItems: 'stretch',
                    borderLeft: `3px solid ${color}`,
                    background: `linear-gradient(90deg, ${color}0d 0%, transparent 60%)`,
                  }}
                >
                  <div style={{ flex: 1, padding: '36px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <PulsingDot color={color} size={8} />
                      <p style={{ color, fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0, fontFamily: 'monospace' }}>
                        // {posicion}
                      </p>
                    </div>
                    <motion.p
                      animate={{ textShadow: [`0 0 20px ${color}00`, `0 0 40px ${color}44`, `0 0 20px ${color}00`] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        color: '#f9fafb', fontSize: 'clamp(1.3rem, 3vw, 2rem)',
                        fontWeight: 900, lineHeight: 1.15, margin: 0, letterSpacing: '-0.02em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {descripcion}
                    </motion.p>
                  </div>

                  {imagenUrl && (
                    <div style={{
                      flexShrink: 0, width: '220px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '20px', borderLeft: `1px solid ${color}18`,
                    }}>
                      <img
                        src={imagenUrl} alt={descripcion}
                        className="gaming-float"
                        style={{ maxWidth: '100%', maxHeight: '155px', objectFit: 'contain' }}
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
