"use client";

import * as React from "react";
import { useReducedMotionSafe } from "@shift9/motion";

/* ── Shaders ──────────────────────────────────────────────────────────────
   A render-to-texture FEEDBACK loop: each frame we sample the previous frame,
   multiply it by a decay constant, and add a soft "beam" that orbits the
   frame's inner edge. The decaying remainder is what draws the comet-like
   phosphor trail — a persistence-of-vision streak that CSS keyframes can't
   fake. A rectangle-outline SDF hard-masks everything except a ~3px band on
   the existing hairline, so a viewport-sized canvas costs almost nothing. */
const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const UPDATE_FRAG = `precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_inset;
uniform float u_band;
uniform vec3 u_signal;
uniform vec3 u_pulse;
uniform float u_decay;
uniform float u_peak;
uniform float u_speed;
uniform float u_sigma;
uniform sampler2D u_prev;
const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;
void main(){
  vec2 p = gl_FragCoord.xy;
  vec2 uv = p / u_res;

  // signed distance to the inset rectangle's outline → distance to the border
  vec2 lo = vec2(u_inset);
  vec2 hi = u_res - vec2(u_inset);
  vec2 d = max(lo - p, p - hi);
  float outside = length(max(d, vec2(0.0)));
  float inside = min(max(d.x, d.y), 0.0);
  float edge = abs(outside + inside);
  float band = 1.0 - smoothstep(u_band - 1.0, u_band + 1.0, edge);

  // beam: a soft head orbiting the frame, parameterised by angle from centre
  vec2 c = u_res * 0.5;
  float ang = atan(p.y - c.y, p.x - c.x);
  float sweep = u_time * u_speed;
  float da = abs(mod(ang - sweep + PI, TWO_PI) - PI);
  float beam = exp(-(da * da) / (2.0 * u_sigma * u_sigma));
  vec3 beamCol = mix(u_signal, u_pulse, 0.5 + 0.5 * sin(sweep));

  // premultiplied feedback: decay the previous frame, add the masked beam
  vec4 prev = texture2D(u_prev, uv);
  float addA = beam * band * u_peak;
  vec3 addRGB = beamCol * addA;
  gl_FragColor = vec4(prev.rgb * u_decay + addRGB, min(1.0, prev.a * u_decay + addA));
}`;

const COPY_FRAG = `precision highp float;
uniform vec2 u_res;
uniform sampler2D u_tex;
uniform float u_opacity;
void main(){
  vec4 c = texture2D(u_tex, gl_FragCoord.xy / u_res);
  gl_FragColor = vec4(c.rgb * u_opacity, c.a * u_opacity);
}`;

export interface SweepPalette {
  /** colour the beam resolves toward at the top of its orbit (hex) */
  signal: string;
  /** colour it warps toward at the bottom of its orbit (hex) */
  pulse: string;
}

const DEFAULT_PALETTE: SweepPalette = { signal: "#22d3ee", pulse: "#8b5cf6" };

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
 * GridSweep — the phosphor sweep that traces the GridFrame's inner hairline
 * like an oscilloscope refreshing its own bezel. The single new WebGL context
 * in the whole suite; transparent everywhere except a ~3px ring on the frame,
 * gated behind GridFrame's `live` prop. Renders nothing under reduced motion
 * or when WebGL is unavailable, so the frame is byte-for-byte unchanged.
 */
export function GridSweep({
  className,
  palette = DEFAULT_PALETTE,
}: {
  className?: string;
  palette?: SweepPalette;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionSafe();
  const [failed, setFailed] = React.useState(false);
  const { signal, pulse } = palette;

  React.useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
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
        console.warn("[GridSweep]", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const link = (fragSrc: string) => {
      const vs = compile(gl.VERTEX_SHADER, VERT);
      const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
      if (!vs || !fs) return null;
      const prog = gl.createProgram();
      if (!prog) return null;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
      return prog;
    };

    const updateProg = link(UPDATE_FRAG);
    const copyProg = link(COPY_FRAG);
    if (!updateProg || !copyProg) {
      setFailed(true);
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const bindAttrib = (prog: WebGLProgram) => {
      const loc = gl.getAttribLocation(prog, "a");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const sigRGB = hexToRgb(signal);
    const pulRGB = hexToRgb(pulse);

    // ── ping-pong framebuffers ──────────────────────────────────────────
    type FBO = { tex: WebGLTexture; fb: WebGLFramebuffer };
    let a: FBO | null = null;
    let b: FBO | null = null;
    let W = 0;
    let H = 0;

    const makeFBO = (w: number, h: number): FBO | null => {
      const tex = gl.createTexture();
      const fb = gl.createFramebuffer();
      if (!tex || !fb) return null;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fb };
    };

    const allocate = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (w === W && h === H && a && b) return;
      W = w;
      H = h;
      canvas.width = w;
      canvas.height = h;
      if (a) {
        gl.deleteTexture(a.tex);
        gl.deleteFramebuffer(a.fb);
      }
      if (b) {
        gl.deleteTexture(b.tex);
        gl.deleteFramebuffer(b.fb);
      }
      a = makeFBO(w, h);
      b = makeFBO(w, h);
      if (!a || !b) setFailed(true);
    };
    allocate();
    if (!a || !b) {
      gl.deleteBuffer(buf);
      gl.deleteProgram(updateProg);
      gl.deleteProgram(copyProg);
      return; // allocate() already flagged failed → re-render unmounts the canvas
    }

    gl.disable(gl.BLEND);

    const draw = (t: number) => {
      if (!a || !b) return;
      const inset = (window.innerWidth >= 640 ? 20 : 12) * dpr;
      const band = 2.2 * dpr;

      // ── update pass: write into B, sampling A ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb);
      gl.viewport(0, 0, W, H);
      gl.useProgram(updateProg);
      bindAttrib(updateProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, a.tex);
      gl.uniform1i(gl.getUniformLocation(updateProg, "u_prev"), 0);
      gl.uniform2f(gl.getUniformLocation(updateProg, "u_res"), W, H);
      gl.uniform1f(gl.getUniformLocation(updateProg, "u_time"), t / 1000);
      gl.uniform1f(gl.getUniformLocation(updateProg, "u_inset"), inset);
      gl.uniform1f(gl.getUniformLocation(updateProg, "u_band"), band);
      gl.uniform3fv(gl.getUniformLocation(updateProg, "u_signal"), sigRGB);
      gl.uniform3fv(gl.getUniformLocation(updateProg, "u_pulse"), pulRGB);
      gl.uniform1f(gl.getUniformLocation(updateProg, "u_decay"), 0.9);
      gl.uniform1f(gl.getUniformLocation(updateProg, "u_peak"), 0.6);
      gl.uniform1f(gl.getUniformLocation(updateProg, "u_speed"), 0.42);
      gl.uniform1f(gl.getUniformLocation(updateProg, "u_sigma"), 0.12);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // ── copy pass: blit B to the screen ──
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(copyProg);
      bindAttrib(copyProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, b.tex);
      gl.uniform1i(gl.getUniformLocation(copyProg, "u_tex"), 0);
      gl.uniform2f(gl.getUniformLocation(copyProg, "u_res"), W, H);
      gl.uniform1f(gl.getUniformLocation(copyProg, "u_opacity"), 0.85);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // swap
      const tmp = a;
      a = b;
      b = tmp;
    };

    let raf = 0;
    let running = true;
    const loop = (t: number) => {
      allocate();
      draw(t);
      raf = running ? requestAnimationFrame(loop) : 0;
    };
    const onResize = () => allocate();
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      } else {
        running = true;
        if (!raf) raf = requestAnimationFrame(loop);
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (a) {
        gl.deleteTexture(a.tex);
        gl.deleteFramebuffer(a.fb);
      }
      if (b) {
        gl.deleteTexture(b.tex);
        gl.deleteFramebuffer(b.fb);
      }
      // The effect re-runs whenever the palette prop changes; free the GPU
      // objects so a re-skin (e.g. Just-a-Pinch) can't leak buffers/programs.
      gl.deleteBuffer(buf);
      gl.deleteProgram(updateProg);
      gl.deleteProgram(copyProg);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, signal, pulse]);

  // NB: render output must NOT branch on `reduced` — useReducedMotion is
  // false-until-measured, so a reduced-gated null would mismatch SSR (React
  // hydration #418). We always render the (transparent) canvas; the effect
  // above simply never starts the loop under reduced motion, leaving it blank.
  if (failed) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
