"use client";

import * as React from "react";
import { useReducedMotionSafe } from "@shift9/motion";

/* Fragment shader: fbm field + interleaved-gradient ordered dithering,
   base→signal→pulse, warped toward the cursor. Palette arrives as uniforms
   so any surface can re-skin the field without touching the shader.
   WebGL1-safe (no dynamic array indexing), so it compiles broadly. */
const FRAG = `precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_base;
uniform vec3 u_signal;
uniform vec3 u_pulse;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.0 + vec2(7.1, 3.7); a *= 0.5; }
  return v;
}
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2 m = (u_mouse - 0.5 * u_res) / u_res.y;
  float warp = 0.22 / (0.16 + length(p - m));
  float field = fbm(p * 2.1 + vec2(u_time * 0.045, u_time * 0.03) + warp * 0.12);
  field += 0.14 * warp;
  float intensity = smoothstep(0.36, 0.96, field);
  float th = ign(gl_FragCoord.xy);
  float dots = step(th, intensity);
  vec3 col = mix(u_signal, u_pulse, clamp(length(p - m) * 0.9, 0.0, 1.0));
  vec3 outc = mix(u_base, col, dots * (0.32 + 0.68 * intensity));
  outc *= 1.0 - 0.22 * length(uv - 0.5);
  gl_FragColor = vec4(outc, 1.0);
}`;

const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

export interface DitherPalette {
  /** base background colour (hex) */
  base: string;
  /** primary accent the dither resolves to away from the cursor (hex) */
  signal: string;
  /** secondary accent it warps toward at the cursor (hex) */
  pulse: string;
}

/** The default cool palette — keeps `shift9.dev` cyan/violet with no props. */
const DEFAULT_PALETTE: DitherPalette = {
  base: "#0f172a",
  signal: "#22d3ee",
  pulse: "#8b5cf6",
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * The Dither Field — a real-time monochrome-dither shader reacting to the
 * cursor. Pauses offscreen, renders a single static frame under reduced
 * motion, and falls back to a branded CSS gradient if WebGL is absent.
 *
 * Pass a `palette` to re-skin it per surface (e.g. the warm Just-a-Pinch
 * variant); omit it and you get the cool studio palette.
 */
export function DitherField({
  className,
  palette = DEFAULT_PALETTE,
}: {
  className?: string;
  palette?: DitherPalette;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionSafe();
  const [failed, setFailed] = React.useState(false);
  const { base, signal, pulse } = palette;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      setFailed(true);
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("[DitherField]", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      setFailed(true);
      return;
    }
    const prog = gl.createProgram();
    if (!prog) {
      setFailed(true);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    // Palette is constant per mount — set the colour uniforms once.
    gl.uniform3fv(gl.getUniformLocation(prog, "u_base"), hexToRgb(base));
    gl.uniform3fv(gl.getUniformLocation(prog, "u_signal"), hexToRgb(signal));
    gl.uniform3fv(gl.getUniformLocation(prog, "u_pulse"), hexToRgb(pulse));

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const mouse = { x: 0, y: 0 };
    let raf = 0;
    let visible = true;

    const resize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      if (!mouse.x) mouse.x = w / 2;
      if (!mouse.y) mouse.y = h / 2;
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr;
      mouse.y = (r.height - (e.clientY - r.top)) * dpr; // flip Y for GL space
    };

    const render = (t: number) => {
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uTime, reduced ? 8.0 : t / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = !reduced && visible ? requestAnimationFrame(render) : 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry?.isIntersecting;
        if (!reduced && visible && !raf) raf = requestAnimationFrame(render);
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });

    resize();
    if (reduced) {
      render(8000);
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced, base, signal, pulse]);

  if (failed) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          background:
            "radial-gradient(60% 60% at 30% 30%, color-mix(in oklab, var(--s9-signal) 28%, transparent), transparent 70%)," +
            "radial-gradient(50% 50% at 75% 65%, color-mix(in oklab, var(--s9-pulse) 26%, transparent), transparent 70%)," +
            "var(--s9-void)",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
