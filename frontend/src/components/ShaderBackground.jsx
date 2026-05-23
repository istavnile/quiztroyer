import { useEffect, useRef } from 'react';

const VERT = `attribute vec4 a_pos; void main(){ gl_Position = a_pos; }`;

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_t;
uniform vec3  u_col;

float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(h(i),           h(i + vec2(1,0)), f.x),
    mix(h(i+vec2(0,1)), h(i + vec2(1,1)), f.x),
    f.y
  );
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 6; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float t  = u_t * 0.10;

  vec2  p  = uv * 2.0;
  float n1 = fbm(p + vec2(t,         t * 0.65));
  float n2 = fbm(p + vec2(-t * 0.75, t * 0.45) + vec2(n1 * 0.9, 0.0));
  float n3 = fbm(p * 1.4 + vec2(t * 0.3, -t * 0.6) + vec2(n2 * 0.6, n2 * 0.4));

  // Vibrant, clearly visible dark-space palette
  vec3 col = vec3(0.04, 0.05, 0.16);
  col = mix(col, vec3(0.09, 0.11, 0.52),  smoothstep(0.25, 0.60, n1));
  col = mix(col, vec3(0.28, 0.04, 0.62),  smoothstep(0.30, 0.68, n2));
  col = mix(col, vec3(0.03, 0.38, 0.68),  smoothstep(0.38, 0.75, n3));
  col = mix(col, u_col * 0.75,            smoothstep(0.55, 0.90, n1 * n2));

  // Bright peak — luminous highlights in the aurora bands
  float peak = smoothstep(0.70, 1.00, n1 * n3);
  col += vec3(0.10, 0.15, 0.55) * peak;
  col += u_col * 0.40 * smoothstep(0.80, 1.00, n2 * n3);

  // Soft vignette — keep edges dark, centre bright
  vec2 vp = uv - 0.5;
  col *= 1.0 - dot(vp, vp) * 1.1;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function hexToRgb(hex) {
  const n = (hex || '#4f46e5').replace('#', '');
  return [
    parseInt(n.slice(0, 2), 16) / 255,
    parseInt(n.slice(2, 4), 16) / 255,
    parseInt(n.slice(4, 6), 16) / 255,
  ];
}

export default function ShaderBackground({ color = '#4f46e5' }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const colorRef  = useRef(hexToRgb(color));

  useEffect(() => { colorRef.current = hexToRgb(color); }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,   VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uT   = gl.getUniformLocation(prog, 'u_t');
    const uCol = gl.getUniformLocation(prog, 'u_col');

    const t0 = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();

    // Use ResizeObserver so the canvas tracks its container
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function frame() {
      const t = (performance.now() - t0) / 1000;
      const [r, g, b] = colorRef.current;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT,   t);
      gl.uniform3f(uCol, r, g, b);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
}
