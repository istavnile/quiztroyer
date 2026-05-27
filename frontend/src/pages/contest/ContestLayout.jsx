import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function GamingCursor({ accent = '#76B900' }) {
  const wrapRef      = useRef(null);
  const svgRef       = useRef(null);
  const crosshairRef = useRef(null);
  const coordRef     = useRef(null);

  useEffect(() => {
    const wrap      = wrapRef.current;
    const svg       = svgRef.current;
    const crosshair = crosshairRef.current;
    if (!wrap) return;

    let hovering = false;

    const onMove = (e) => {
      wrap.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
      if (coordRef.current) coordRef.current.textContent = `${e.clientX} ${e.clientY}`;
    };

    const onOver = (e) => {
      const hit = !!e.target.closest('a, button, [role="button"], input, select, textarea');
      if (hit === hovering) return;
      hovering = hit;
      if (svg) {
        svg.style.filter = hit
          ? `drop-shadow(0 0 6px ${accent}) drop-shadow(0 0 14px ${accent}88)`
          : 'none';
      }
      if (crosshair) {
        crosshair.style.animation = 'none';
        void crosshair.offsetHeight; // force reflow to restart animation
        crosshair.style.animation = hit ? 'ch-lock 0.4s ease-out forwards' : 'ch-return 0.22s ease-out forwards';
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
    };
  }, [accent]);

  return (
    <div
      ref={wrapRef}
      style={{ position: 'fixed', left: 0, top: 0, zIndex: 9999, pointerEvents: 'none', transform: 'translate(-300px, -300px)', willChange: 'transform' }}
    >
      <svg
        ref={svgRef}
        width="40" height="40" viewBox="0 0 40 40"
        style={{ display: 'block', transition: 'transform 0.11s ease, filter 0.11s ease', transformOrigin: 'center' }}
      >
        <line x1="4" y1="4" x2="10" y2="4"  stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="4" y1="4" x2="4"  y2="10" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="36" y1="4" x2="30" y2="4"  stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="36" y1="4" x2="36" y2="10" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="4" y1="36" x2="10" y2="36" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="4" y1="36" x2="4"  y2="30" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="36" y1="36" x2="30" y2="36" stroke={accent} strokeWidth="1" opacity="0.45" />
        <line x1="36" y1="36" x2="36" y2="30" stroke={accent} strokeWidth="1" opacity="0.45" />
        {/* Center crosshair — lock-on animation on hover */}
        <g ref={crosshairRef} style={{ transformOrigin: '20px 20px', transformBox: 'fill-box' }}>
          <line x1="20" y1="4"  x2="20" y2="14" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="26" x2="20" y2="36" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4"  y1="20" x2="14" y2="20" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="26" y1="20" x2="36" y2="20" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="20" cy="20" r="1.5" fill={accent} />
        </g>
      </svg>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 5, borderRadius: '50%', border: `1px dashed ${accent}55`, pointerEvents: 'none' }}
      />
      <motion.div
        animate={{ scale: [0.7, 1.4], opacity: [0.55, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.6 }}
        style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `1px solid ${accent}`, pointerEvents: 'none' }}
      />
      <span
        ref={coordRef}
        style={{
          position: 'absolute', left: '44px', top: '26px',
          fontFamily: '"Courier New", monospace', fontSize: '0.42rem', fontWeight: 600,
          color: `${accent}77`, whiteSpace: 'nowrap', lineHeight: 1, pointerEvents: 'none',
          letterSpacing: '0.04em',
        }}
      >0 0</span>
    </div>
  );
}


/* ── Full-page circuit-board background canvas ───────────────────── */
function CircuitBoardBG({ accent = '#76B900' }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cr = parseInt(accent.slice(1,3),16);
    const cg = parseInt(accent.slice(3,5),16);
    const cb = parseInt(accent.slice(5,7),16);
    const col = (a) => `rgba(${cr},${cg},${cb},${a})`;

    let W = 0, H = 0, off = null, traces = [], pulses = [];
    const STEP = 58;
    const DATA_LABELS = ['48.15','3.26','18.59','73.26','0.16','31.51','47.14','51.29','1.04','27.12','65.43','9.87'];
    const mkRng = () => { let s = 7331; return () => { s=(s*1664525+1013904223)>>>0; return s/4294967295; }; };

    const build = () => {
      const rng = mkRng();
      traces = [];
      const nodes = {};
      const labels = [];
      const addNode = (x,y) => { nodes[`${Math.round(x)},${Math.round(y)}`] = {x,y}; };

      // Horizontal traces — primary visual element
      for (let y = STEP*0.5; y < H+STEP; y += STEP*(0.65+rng()*0.95)) {
        for (let x = -STEP; x < W+STEP;) {
          if (rng() < 0.6) {
            const len = STEP*(1+Math.floor(rng()*5));
            traces.push({x1:x,y1:y,x2:x+len,y2:y, a:0.04+rng()*0.08});
            addNode(x,y); addNode(x+len,y);
            if (rng()<0.14) labels.push({x:x+len*(0.2+rng()*0.6), y:y-7, t:DATA_LABELS[Math.floor(rng()*DATA_LABELS.length)]});
            x += len + STEP*(rng()<0.35 ? 1 : 2);
          } else { x += STEP*(1+Math.floor(rng()*2)); }
        }
      }

      // Vertical connectors
      for (let x = STEP; x < W+STEP; x += STEP*(1.3+rng()*2.4)) {
        for (let y = 0; y < H;) {
          if (rng()<0.28) {
            const len = STEP*(1+Math.floor(rng()*2));
            traces.push({x1:x,y1:y,x2:x,y2:y+len, a:0.03+rng()*0.045});
            addNode(x,y); addNode(x,y+len);
            y += len+STEP;
          } else { y += STEP; }
        }
      }

      // Bake static elements to offscreen canvas
      off = document.createElement('canvas');
      off.width = W; off.height = H;
      const oc = off.getContext('2d');

      for (const t of traces) {
        oc.strokeStyle = col(t.a); oc.lineWidth = 0.75;
        oc.beginPath(); oc.moveTo(t.x1,t.y1); oc.lineTo(t.x2,t.y2); oc.stroke();
      }
      for (const n of Object.values(nodes)) {
        oc.fillStyle = col(0.18);
        oc.beginPath(); oc.arc(n.x,n.y,2,0,Math.PI*2); oc.fill();
        if (rng()<0.22) {
          oc.strokeStyle = col(0.07); oc.lineWidth = 0.55;
          oc.beginPath(); oc.arc(n.x,n.y,4.5,0,Math.PI*2); oc.stroke();
        }
      }
      oc.font = '7.5px "Courier New", monospace';
      for (const l of labels) { oc.fillStyle = col(0.11); oc.fillText(l.t,l.x,l.y); }
    };

    const spawnPulse = () => {
      const long = traces.filter(t => Math.hypot(t.x2-t.x1,t.y2-t.y1) > 85);
      if (!long.length) return;
      const t = long[Math.floor(Math.random()*long.length)];
      pulses.push({t, p:0, spd:0.004+Math.random()*0.006});
    };

    for (let i=0;i<12;i++) setTimeout(spawnPulse, i*280);
    const pInt = setInterval(spawnPulse, 480);

    const resize = () => {
      const dpr = Math.min(devicePixelRatio||1,2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W*dpr; canvas.height = H*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      build();
    };
    window.addEventListener('resize', resize); resize();

    let raf;
    const frame = () => {
      ctx.clearRect(0,0,W,H);
      if (off) ctx.drawImage(off,0,0,W,H);

      pulses = pulses.filter(p=>p.p<=1);
      for (const p of pulses) {
        p.p += p.spd;
        const px = p.t.x1+(p.t.x2-p.t.x1)*p.p;
        const py = p.t.y1+(p.t.y2-p.t.y1)*p.p;
        const g = ctx.createRadialGradient(px,py,0,px,py,11);
        g.addColorStop(0, col(0.9)); g.addColorStop(0.3, col(0.35)); g.addColorStop(1, col(0));
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(px,py,11,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=col(1); ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => { cancelAnimationFrame(raf); clearInterval(pInt); window.removeEventListener('resize', resize); };
  }, [accent]);

  return <canvas ref={ref} style={{position:'fixed', inset:0, pointerEvents:'none', zIndex:0, display:'block'}} />;
}

/* ── WebGL galaxy shader — full-page fixed background ───────────── */
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
  vec3 col=vec3(.02,.02,.04);
  col+=u_acc*smoothstep(.3,.75,n1)*neb*.2;
  col+=red*smoothstep(.5,.85,n2)*(1.-neb)*.11;
  col+=u_acc*core+u_acc*halo;
  col+=red*exp(-length(rp+vec2(.28,.08))*5.)*.07;
  float st=star(uv+u_t*.001,55.)+star(uv*1.35+u_t*.002+.5,78.)*.7+star(uv*.78-u_t*.0015+.3,38.)*1.1;
  col+=vec3(st)*.95+st*u_acc*.18;
  col*=1.-smoothstep(.25,1.1,length(p*.75));
  gl_FragColor=vec4(col,1.);}`;

export function GalaxyCanvas({ accent = '#76B900' }) {
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
      // Use parent dimensions instead of window
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);
    const t0 = performance.now(); let raf;
    const frame = () => { gl.uniform1f(uT, (performance.now()-t0)/1000); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); raf=requestAnimationFrame(frame); };
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [accent]);
  // Use absolute positioning to fill the parent container, not fixed to screen
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 0, mixBlendMode: 'screen', pointerEvents: 'none' }} />;
}

/* ── NVIDIA tech-term depth background ──────────────────────────── */
const TECH_TERMS = [
  'DLSS 3', 'REFLEX', 'RAY TRACING', 'RTX ON', 'TENSOR CORES',
  'CUDA', 'G-SYNC', 'NVENC', 'FRAME GENERATION', 'ACE', 'BROADCAST',
  'ADA LOVELACE', 'AMPERE', 'NVLINK', 'AI DENOISING', 'OVERDRIVE',
  'DEEP LEARNING', 'BLACKWELL', 'GDDR7', 'DLSS 4', 'MULTI FRAME GEN',
];
function _pr(seed) { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }

// 4 depth layers: far · mid · near · ultra-near (bokeh, out-of-focus foreground)
const TECH_LAYERS = [
  { blur: 20, opacity: 0.16, minSz: 0.55, maxSz: 0.85, dur: 230, seed: 0,   count: 32 },
  { blur: 7,  opacity: 0.24, minSz: 0.95, maxSz: 1.45, dur: 125, seed: 130, count: 22 },
  { blur: 1,  opacity: 0.34, minSz: 1.6,  maxSz: 2.6,  dur: 62,  seed: 260, count: 13 },
  { blur: 28, opacity: 0.28, minSz: 3.5,  maxSz: 6.5,  dur: 48,  seed: 390, count: 9  },
];

function TechBG({ accent = '#76B900', enabled = true, globalOpacity = 1.0, terms }) {
  if (!enabled) return null;
  const pool = (terms && terms.length > 0) ? terms : TECH_TERMS;
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', userSelect: 'none', pointerEvents: 'none', zIndex: 0 }}>
      {TECH_LAYERS.map((layer, li) => {
        const words = Array.from({ length: layer.count }, (_, i) => {
          const s = layer.seed + i * 23;
          return {
            text:  pool[Math.floor(_pr(s) * pool.length)],
            x:     _pr(s * 3 + 1) * 92,
            y:     _pr(s * 7 + 2) * 50,
            size:  layer.minSz + _pr(s * 5 + 3) * (layer.maxSz - layer.minSz),
            alpha: 0.35 + _pr(s * 11 + 4) * 0.65,
            rot:   (_pr(s * 13 + 5) - 0.5) * 26,
          };
        });
        const all = [...words, ...words.map((w) => ({ ...w, y: w.y + 50 }))];
        return (
          <motion.div
            key={li}
            animate={{ y: ['0%', '-50%'] }}
            transition={{ duration: layer.dur, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: 0, filter: `blur(${layer.blur}px)`, opacity: layer.opacity * globalOpacity }}
          >
            <div style={{ position: 'relative', height: '200%' }}>
              {all.map((w, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${w.x}%`,
                  top: `${w.y}%`,
                  transform: `rotate(${w.rot}deg)`,
                  fontFamily: '"Courier New", monospace',
                  fontSize: `${w.size}rem`,
                  fontWeight: 700,
                  color: accent,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: w.alpha,
                  whiteSpace: 'nowrap',
                }}>
                  {w.text}
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

const BASE = '/concursos/el-gran-upgrade';
const API  = import.meta.env.VITE_API_URL || '';

const DEFAULT_SETTINGS = {
  titulo: 'El Upgrade de lo que realmente importa.',
  patrocinadores: [
    { nombre: 'NVIDIA',       logoUrl: '', color: '#76B900' },
    { nombre: 'ASUS ROG',     logoUrl: '', color: '#e61f30' },
    { nombre: 'ComputerShop', logoUrl: '', color: '#ffffff' },
  ],
  textoFechaApertura: '1 de junio, 2026',
  textoFechaCierre:   '7 de junio, 23:59',
  textoFechaFinal:    '12 de junio, 2026',
  techBgEnabled: true,
  techBgOpacity: 1.0,
};

// Returns true if the hex color is perceptually dark (needs white text over it)
function isDark(hex = '#000000') {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 140;
  } catch { return true; }
}

export default function ContestLayout({ children }) {
  const { pathname } = useLocation();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setNavVisible(y < lastScrollY.current || y < 80);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/contest/settings`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch((err) => console.warn('[contest-layout-settings]', err));
  }, []);

  const sponsors     = settings.patrocinadores || DEFAULT_SETTINGS.patrocinadores;
  const primary      = sponsors[0] || DEFAULT_SETTINGS.patrocinadores[0];
  const accentColor  = primary.color || '#76B900';
  const titulo       = settings.titulo || 'El Gran Upgrade';
  const badgeTextClr = isDark(accentColor) ? '#fff' : '#000';

  return (
    <div
      style={{
        background: '#06070e',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.15) 2px, rgba(0,0,0,.15) 4px)',
        backgroundAttachment: 'fixed',
        minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', cursor: 'none',
      }}
      className="text-white"
    >
      {/* Force cursor:none on all interactive elements — prevents browser pointer showing on links/buttons */}
      <style>{`
        a, button, input, select, textarea, label, [role="button"] { cursor: none !important; }
        @keyframes ch-lock {
          0%   { transform: scale(1);    }
          30%  { transform: scale(1.65); }
          58%  { transform: scale(0.68); }
          76%  { transform: scale(0.88); }
          100% { transform: scale(0.80); }
        }
        @keyframes ch-return {
          from { transform: scale(0.80); }
          to   { transform: scale(1);    }
        }
      `}</style>

      <GamingCursor accent={accentColor} />

      {/* Full-page circuit board background */}
      <CircuitBoardBG accent={accentColor} />

      {/* NVIDIA tech terms — full-page blurred depth layer */}
      <TechBG accent={accentColor} enabled={settings.techBgEnabled !== false} globalOpacity={settings.techBgOpacity ?? 1.0} terms={settings.techBgTerms} />

      {/* Ambient top glow — extends well below the hero fold */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '75vh',
        background: `radial-gradient(ellipse 90% 80% at 50% -10%, ${accentColor}0d, transparent 70%)`,
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Tactical dot grid */}
      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.022) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />


      {/* Header — hide on scroll down, show on scroll up */}
      <motion.header
        initial={{ y: -80, opacity: 0, filter: 'brightness(3)' }}
        animate={{
          borderColor: [`${accentColor}88`, `${accentColor}ee`, `${accentColor}88`],
          y: navVisible ? 0 : -80,
          opacity: navVisible ? 1 : 0,
          filter: 'brightness(1)',
        }}
        transition={{ borderColor: { duration: 3, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 0.25, ease: 'easeInOut' }, opacity: { duration: 0.2 }, filter: { duration: 0.5, ease: 'easeOut' } }}
        style={{
          background: 'rgba(0,0,0,0.45)',
          borderBottom: `1px solid ${accentColor}55`,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={BASE} className="flex items-center gap-3 no-underline">

            {/* Primary sponsor — bare logo or colored text badge */}
            {primary.logoUrl ? (
              <img
                src={primary.logoUrl}
                alt={primary.nombre || ''}
                style={{ height: `${Math.min(primary.logoAltura || 28, 34)}px`, maxWidth: '110px', width: 'auto', objectFit: 'contain', display: 'block', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  background: accentColor,
                  borderRadius: '4px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '36px',
                  height: '28px',
                  flexShrink: 0,
                }}
              >
                <span style={{ color: badgeTextClr, fontWeight: 900, fontSize: '0.72rem', letterSpacing: '0.1em', whiteSpace: 'nowrap', lineHeight: 1 }}>
                  {primary.nombre || 'NVIDIA'}
                </span>
              </div>
            )}

            {/* Campaign title */}
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.04em' }}>
              {titulo}
            </span>
          </Link>

          <nav className="flex gap-4 text-sm font-medium">
            <NavLink to={BASE}                      active={pathname === BASE}                     accent={accentColor} icon="⌂">Inicio</NavLink>
            <NavLink to={`${BASE}/inscripcion`}     active={pathname.includes('/inscripcion')}     accent={accentColor} icon="✎">Inscripción</NavLink>
            <NavLink to={`${BASE}/votacion`}        active={pathname.includes('/votacion')}        accent={accentColor} icon="⊙">Votación</NavLink>
          </nav>
        </div>
      </motion.header>

      {/* Glow superior — animated pulse */}
      <motion.div
        animate={{
          opacity:    [0.7, 1, 0.7],
          boxShadow:  [`0 0 40px 12px ${accentColor}33`, `0 0 100px 30px ${accentColor}77`, `0 0 40px 12px ${accentColor}33`],
          scaleX:     [0.9, 1.05, 0.9],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'fixed', top: 0, left: '50%', translateX: '-50%',
          width: '60vw', height: '2px', background: accentColor,
          zIndex: 40,
          transformOrigin: 'center',
          transform: 'translateX(-50%)',
        }}
      />

      {/* Cyberpunk scan line on route change */}
      <AnimatePresence>
        <motion.div
          key={`scan-${pathname}`}
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: '100vh', opacity: 0.6 }}
          transition={{ duration: 0.6, ease: 'easeIn' }}
          style={{
            position: 'fixed', left: 0, right: 0, top: 0, height: '3px',
            background: `linear-gradient(90deg, transparent, ${accentColor}cc, ${accentColor}, ${accentColor}cc, transparent)`,
            boxShadow: `0 0 20px ${accentColor}, 0 0 50px ${accentColor}66`,
            zIndex: 999, pointerEvents: 'none',
          }}
        />
      </AnimatePresence>

      {/* Contenido */}
      <main className="relative max-w-6xl mx-auto px-4 py-10" style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 18, filter: 'brightness(2.5) blur(4px) saturate(3)' }}
            animate={{ opacity: 1, y: 0, filter: 'brightness(1) blur(0px) saturate(1)' }}
            exit={{ opacity: 0, y: -10, filter: 'brightness(0) blur(2px) saturate(0)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        style={{ borderTop: '1px solid #1a1a1a', background: '#050505' }}
        className="mt-20 py-8 text-center text-xs text-gray-600"
      >
        <p>
          Concurso organizado por{' '}
          {sponsors.map((s, i) => (
            <span key={i}>
              {i > 0 && <span className="text-gray-700">{i < sponsors.length - 1 ? ', ' : ' y '}</span>}
              <span style={{ color: s.color }}>{s.nombre}</span>
            </span>
          ))}
        </p>
        <p className="mt-1">
          Inscripciones del{' '}
          <strong className="text-white">{settings.textoFechaApertura}</strong>
          {' '}al{' '}
          <strong className="text-white">{settings.textoFechaCierre}</strong>
          {' '}&nbsp;·&nbsp;{' '}
          Gran Final en vivo:{' '}
          <strong className="text-white">{settings.textoFechaFinal}</strong>
        </p>
      </footer>
    </div>
  );
}

function NavLink({ to, children, active, accent, icon }) {
  const [hov, setHov] = useState(false);
  const lit = active || hov;
  return (
    <Link
      to={to}
      style={{ textDecoration: 'none', position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Diagonal hover fill */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `${accent}0e`,
        clipPath: 'polygon(0 0, calc(100% - 7px) 0, 100% 7px, 100% 100%, 0 100%)',
        opacity: hov && !active ? 1 : 0,
        transition: 'opacity 0.14s',
      }} />

      <div style={{ padding: '8px 10px 7px', display: 'flex', alignItems: 'center', gap: '5px', position: 'relative' }}>
        {/* // prefix — only on active */}
        <span style={{
          fontFamily: 'monospace', fontSize: '0.55rem',
          color: `${accent}66`, lineHeight: 1,
          opacity: active ? 1 : 0, transition: 'opacity 0.2s',
          width: active ? 'auto' : 0, overflow: 'hidden', whiteSpace: 'nowrap',
        }}>//</span>

        {icon && (
          <span style={{
            fontSize: '0.75rem', lineHeight: 1,
            color: lit ? accent : '#374151',
            filter: lit ? `drop-shadow(0 0 5px ${accent}99)` : 'none',
            transition: 'color 0.15s, filter 0.15s',
          }}>{icon}</span>
        )}

        <span style={{
          fontSize: '0.68rem', fontWeight: 800,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          fontFamily: 'monospace',
          color: lit ? accent : '#374151',
          filter: lit ? `drop-shadow(0 0 7px ${accent}99)` : 'none',
          transition: 'color 0.15s, filter 0.15s',
        }}>
          {children}
        </span>
      </div>

      {/* Active bottom bar — pulsing glow */}
      {active && (
        <motion.div
          animate={{ boxShadow: [`0 0 5px ${accent}88`, `0 0 16px ${accent}`, `0 0 5px ${accent}88`] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: 0, left: 8, right: 8, height: '2px',
            background: accent,
          }}
        />
      )}

      {/* Hover bottom bar — slides in from left */}
      {!active && (
        <div style={{
          position: 'absolute', bottom: 0, left: 8, right: 8, height: '1px',
          background: `${accent}55`,
          transform: `scaleX(${hov ? 1 : 0})`,
          transition: 'transform 0.18s ease',
          transformOrigin: 'left',
        }} />
      )}
    </Link>
  );
}
