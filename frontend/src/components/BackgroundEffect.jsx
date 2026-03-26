import React, { useEffect, useRef } from 'react';

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return { r: 99, g: 102, b: 241 };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// ── Shared canvas wrapper ─────────────────────────────────────────────────
function CanvasEffect({ drawFn, color }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      stateRef.current = {}; // reinitialise entities on resize
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    let rafId, time = 0;

    const loop = () => {
      time += 0.016;
      drawFn(ctx, canvas, time, stateRef.current, hexToRgb(color));
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); };
  }, [color, drawFn]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

// ── Nodes / network ───────────────────────────────────────────────────────
function drawNodes(ctx, canvas, time, state, { r, g, b }) {
  if (!state.nodes) {
    state.nodes = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      size: 1.5 + Math.random() * 2,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const nodes = state.nodes;
  const maxDist = Math.min(160, canvas.width * 0.12);

  nodes.forEach((n) => {
    n.x += n.vx; n.y += n.vy; n.pulse += 0.025;
    if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
    if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
  });

  // Draw connecting lines
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist / maxDist) * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Draw nodes
  nodes.forEach((n) => {
    const glowR = n.size * (1.8 + 0.6 * Math.sin(n.pulse));
    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR * 3);
    grad.addColorStop(0, `rgba(${r},${g},${b},0.7)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(n.x, n.y, glowR * 3, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
    ctx.fill();
  });
}

// ── Particles / sparks ────────────────────────────────────────────────────
function drawParticles(ctx, canvas, time, state, { r, g, b }) {
  if (!state.particles) {
    state.particles = Array.from({ length: 130 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.15 - Math.random() * 0.5,
      size: 0.8 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.015 + Math.random() * 0.025,
    }));
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  state.particles.forEach((p) => {
    p.x += p.vx + Math.sin(p.phase) * 0.2;
    p.y += p.vy;
    p.phase += p.speed;

    if (p.y < -8) { p.y = canvas.height + 8; p.x = Math.random() * canvas.width; }
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;

    const alpha = 0.25 + 0.45 * Math.abs(Math.sin(p.phase));

    // Outer glow
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
    grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.6})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Core dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.fill();
  });
}

// ── Waves ─────────────────────────────────────────────────────────────────
function drawWaves(ctx, canvas, time, state, { r, g, b }) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const waves = [
    { amp: 70,  freq: 0.007, speed: 0.4,  yOff: 0.30, alpha: 0.10 },
    { amp: 55,  freq: 0.011, speed: 0.65, yOff: 0.45, alpha: 0.08 },
    { amp: 90,  freq: 0.005, speed: 0.28, yOff: 0.58, alpha: 0.07 },
    { amp: 40,  freq: 0.014, speed: 0.9,  yOff: 0.70, alpha: 0.06 },
    { amp: 110, freq: 0.004, speed: 0.18, yOff: 0.82, alpha: 0.05 },
  ];

  waves.forEach((w) => {
    const baseY = canvas.height * w.yOff;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= canvas.width; x += 3) {
      ctx.lineTo(x, baseY + Math.sin(x * w.freq + time * w.speed) * w.amp);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fillStyle = `rgba(${r},${g},${b},${w.alpha})`;
    ctx.fill();

    // Highlight line on top of each wave
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= canvas.width; x += 3) {
      ctx.lineTo(x, baseY + Math.sin(x * w.freq + time * w.speed) * w.amp);
    }
    ctx.strokeStyle = `rgba(${r},${g},${b},${w.alpha * 1.8})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

// ── Polygons ──────────────────────────────────────────────────────────────
function drawPolygons(ctx, canvas, time, state, { r, g, b }) {
  if (!state.polys) {
    state.polys = Array.from({ length: 22 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      sides: 3 + Math.floor(Math.random() * 4),
      size: 25 + Math.random() * 90,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 0.007,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: 0.05 + Math.random() * 0.12,
      filled: Math.random() > 0.55,
    }));
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  state.polys.forEach((p) => {
    p.rot += p.rotSpd;
    p.x += p.vx; p.y += p.vy;
    const pad = p.size + 20;
    if (p.x < -pad) p.x = canvas.width + pad;
    if (p.x > canvas.width + pad) p.x = -pad;
    if (p.y < -pad) p.y = canvas.height + pad;
    if (p.y > canvas.height + pad) p.y = -pad;

    ctx.beginPath();
    for (let i = 0; i < p.sides; i++) {
      const angle = p.rot + (i / p.sides) * Math.PI * 2;
      const x = p.x + Math.cos(angle) * p.size;
      const y = p.y + Math.sin(angle) * p.size;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();

    if (p.filled) {
      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha * 0.4})`;
      ctx.fill();
    }
    ctx.strokeStyle = `rgba(${r},${g},${b},${p.alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

// ── Dot pattern ───────────────────────────────────────────────────────────
function drawPattern(ctx, canvas, time, state, { r, g, b }) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const spacing = 38;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  for (let x = spacing / 2; x < canvas.width; x += spacing) {
    for (let y = spacing / 2; y < canvas.height; y += spacing) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const wave = Math.sin(dist * 0.018 - time * 1.8) * 0.5 + 0.5;
      const alpha = 0.04 + wave * 0.14;
      const size  = 1.2 + wave * 1.8;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }
  }
}

// ── Map & export ──────────────────────────────────────────────────────────
const DRAW_FNS = { nodes: drawNodes, particles: drawParticles, waves: drawWaves, polygons: drawPolygons, pattern: drawPattern };

export default function BackgroundEffect({ type, color }) {
  const fn = DRAW_FNS[type];
  if (!fn) return null;
  return <CanvasEffect key={type} drawFn={fn} color={color} />;
}
