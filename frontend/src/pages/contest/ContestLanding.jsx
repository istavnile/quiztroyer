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
  .gaming-float   { animation: float-bob   3.8s ease-in-out infinite; }
  .gaming-flicker { animation: hud-flicker 7s   ease-in-out infinite; }
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

        {/* Optional hero BG image overlay */}
        {s.imagenHero && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
            <img src={s.imagenHero} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0a0a0a)' }} />
          </div>
        )}

        {/* Fade galaxy into page below */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to bottom, transparent, #0a0a0a)', pointerEvents: 'none', zIndex: 3 }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>

          {/* Animated badge */}
          {s.badge && (
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '2rem' }}
            >
              <motion.span
                animate={{ borderColor: [`${accent}33`, `${accent}bb`, `${accent}33`] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                style={{
                  display: 'inline-block',
                  background: `${accent}0e`, border: `1px solid ${accent}44`,
                  color: accent, fontSize: '0.61rem', letterSpacing: '0.22em',
                  fontWeight: 800, padding: '5px 18px', borderRadius: '2px',
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

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {open ? (
              <Link to="/concursos/el-gran-upgrade/inscripcion" style={{ textDecoration: 'none' }}>
                <motion.button
                  animate={{ boxShadow: [`0 0 28px ${accent}44`, `0 0 58px ${accent}99`, `0 0 28px ${accent}44`] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    background: accent, color: '#000', fontWeight: 900,
                    padding: '15px 44px', borderRadius: '3px', fontSize: '0.9rem',
                    border: 'none', cursor: 'pointer', letterSpacing: '0.08em',
                    textTransform: 'uppercase', position: 'relative', overflow: 'hidden',
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
                animate={{ borderColor: [`${accent}22`, `${accent}55`, `${accent}22`] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  display: 'inline-block',
                  background: `${accent}08`, border: `1px solid ${accent}33`,
                  color: accent, padding: '15px 40px', borderRadius: '3px',
                  fontSize: '0.9rem', fontWeight: 700,
                }}
              >
                Inscripciones abren el {s.textoFechaApertura}
              </motion.span>
            )}
            <Link to="/concursos/el-gran-upgrade/votacion" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'transparent', color: '#9ca3af',
                border: '1px solid rgba(255,255,255,0.12)',
                fontWeight: 600, padding: '15px 40px', borderRadius: '3px',
                fontSize: '0.9rem', cursor: 'pointer',
                transition: 'color .2s, border-color .2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
              >
                Ver finalistas y votar
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══════════ FECHAS ════════════════════════════════════════════ */}
      <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {[
          { label: 'APERTURA',           date: s.textoFechaApertura, color: '#76B900', live: false },
          { label: 'CIERRE',             date: s.textoFechaCierre,   color: '#e61f30', live: false },
          { label: 'GRAN FINAL EN VIVO', date: s.textoFechaFinal,    color: '#facc15', live: true  },
        ].map(({ label, date, color, live }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            style={{ padding: '14px 40px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '4px' }}>
              {live && (
                <motion.div animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
              )}
              <p style={{ color: '#374151', fontSize: '0.52rem', letterSpacing: '0.18em', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>{label}</p>
            </div>
            <p style={{ color, fontSize: '0.88rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', lineHeight: 1 }}>{date}</p>
          </motion.div>
        ))}
      </div>

      {/* ══════════ CÓMO PARTICIPAR ═══════════════════════════════════ */}
      {s.pasos?.length > 0 && (
        <section style={{ marginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '64px' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07))' }} />
            <span style={{ color: '#374151', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Cómo participar
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.07), transparent)' }} />
          </div>

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
                  style={{ padding: i === 0 ? '0 32px 0 0' : '0 32px 0 32px', position: 'relative' }}
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

                  <div aria-hidden="true" style={{
                    position: 'absolute', top: '-20px',
                    left: i === 0 ? '-12px' : '20px',
                    fontSize: '9rem', fontWeight: 900, lineHeight: 1,
                    color: clr, opacity: isActive ? 0.13 : 0.04,
                    userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em',
                    transition: 'opacity 0.5s ease',
                  }}>
                    {numero}
                  </div>

                  <p style={{
                    color: isActive ? clr : `${clr}66`,
                    fontSize: '0.60rem', fontWeight: 800, letterSpacing: '0.2em',
                    marginBottom: '12px', textTransform: 'uppercase',
                    transition: 'color 0.45s',
                  }}>
                    Paso {numero}
                  </p>
                  <h3 style={{
                    color: isActive ? '#ffffff' : '#6b7280',
                    fontSize: '1.15rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.2,
                    textShadow: isActive ? `0 0 28px ${clr}77` : 'none',
                    transition: 'color 0.45s, text-shadow 0.45s',
                  }}>
                    {titulo}
                  </h3>
                  <p style={{ color: '#4b5563', fontSize: '0.88rem', lineHeight: 1.75, margin: 0 }}
                    dangerouslySetInnerHTML={{ __html: descripcion }} />
                </motion.div>
              );
            })}
          </div>
        </section>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '48px' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07))' }} />
            <span style={{ color: '#374151', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Premio
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.07), transparent)' }} />
          </div>

          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {s.premios.map(({ posicion, descripcion, color, imagenUrl }) => (
              <div key={posicion} style={{ position: 'relative', overflow: 'hidden' }}>
                <HudCorners color={color} size={22} />

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
                      <p style={{ color, fontSize: '0.60rem', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', margin: 0 }}>
                        {posicion}
                      </p>
                    </div>
                    <motion.p
                      animate={{ textShadow: [`0 0 20px ${color}00`, `0 0 40px ${color}44`, `0 0 20px ${color}00`] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        color: '#f9fafb', fontSize: 'clamp(1.3rem, 3vw, 2rem)',
                        fontWeight: 900, lineHeight: 1.15, margin: 0, letterSpacing: '-0.02em',
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
          <p style={{ color: '#374151', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '20px' }}>
            No te quedes fuera
          </p>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '16px' }}>
            ¿Listo para el{' '}
            <motion.span
              animate={{ textShadow: [`0 0 30px ${accent}33`, `0 0 70px ${accent}88`, `0 0 30px ${accent}33`] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ color: accent }}
            >
              Gran Upgrade?
            </motion.span>
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '44px', fontSize: '0.95rem' }}>
            Las inscripciones cierran el {s.textoFechaCierre}.
          </p>

          <Link to="/concursos/el-gran-upgrade/inscripcion" style={{ textDecoration: 'none' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* Expanding pulse rings */}
              {[0, 0.6, 1.2].map((delay, i) => (
                <motion.div key={i}
                  animate={{ scale: [1, 2.8], opacity: [0.45, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay, ease: 'easeOut' }}
                  style={{
                    position: 'absolute', inset: 0, borderRadius: '3px',
                    border: `1px solid ${accent}`, pointerEvents: 'none',
                  }}
                />
              ))}

              <motion.button
                animate={{ boxShadow: [`0 0 35px ${accent}44`, `0 0 75px ${accent}99`, `0 0 35px ${accent}44`] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: accent, color: '#000', fontWeight: 900,
                  padding: '18px 60px', borderRadius: '3px', fontSize: '1rem',
                  border: 'none', cursor: 'pointer', letterSpacing: '0.08em',
                  textTransform: 'uppercase', position: 'relative', overflow: 'hidden',
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
