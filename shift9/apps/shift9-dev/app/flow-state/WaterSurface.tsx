"use client";

import { useEffect, useRef } from "react";
import s from "./flow-state.module.css";

type Vec3 = [number, number, number];

function hexToVec3(hex: string, fallback: Vec3): Vec3 {
  const cleaned = hex.trim().replace("#", "");
  if (cleaned.length !== 6) return fallback;
  const r = Number.parseInt(cleaned.slice(0, 2), 16);
  const g = Number.parseInt(cleaned.slice(2, 4), 16);
  const b = Number.parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return fallback;
  return [r / 255, g / 255, b / 255];
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function linkProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const VERT = `#version 300 es
precision highp float;
const vec2 POS[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main() {
  vec2 p = POS[gl_VertexID];
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const SIM_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPrev;
uniform sampler2D uCurr;
uniform vec2 uTexel;
uniform vec2 uDrop;
uniform float uDropRadius;
uniform float uDropStrength;
uniform float uDamping;
uniform float uSpread;
uniform float uIdle;
uniform float uTime;
out vec4 fragColor;
void main() {
  vec2 uv = vUv;
  float prev = texture(uPrev, uv).r;
  float curr = texture(uCurr, uv).r;
  float n = texture(uCurr, uv + vec2(0.0, uTexel.y)).r;
  float s = texture(uCurr, uv - vec2(0.0, uTexel.y)).r;
  float e = texture(uCurr, uv + vec2(uTexel.x, 0.0)).r;
  float w = texture(uCurr, uv - vec2(uTexel.x, 0.0)).r;
  float next = (n + s + e + w) * uSpread - prev;
  next *= uDamping;
  float dist = distance(uv, uDrop);
  float drop = exp(-(dist * dist) / max(0.00001, uDropRadius * uDropRadius)) * uDropStrength;
  next += drop;
  float breathe = sin((uv.x * 6.2831 + uTime * 0.35)) * cos((uv.y * 5.0265 - uTime * 0.28));
  next += breathe * uIdle;
  fragColor = vec4(next, 0.0, 0.0, 1.0);
}`;

const VIEW_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uHeight;
uniform vec2 uTexel;
uniform vec2 uResolution;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uShallow;
uniform vec3 uHighlight;
uniform vec3 uStudio;
uniform float uTime;
uniform float uStill;
out vec4 fragColor;

vec3 studioEnv(vec3 rd) {
  float sky = pow(max(rd.y, 0.0), 0.55);
  float rim = pow(1.0 - abs(rd.y), 4.0);
  float lamp = exp(-pow(length(rd.xz - vec2(0.25, -0.15)) * 2.4, 2.0));
  float floorGlow = exp(-pow((rd.y + 0.35) * 3.5, 2.0)) * 0.18;
  vec3 col = uStudio * (0.22 + sky * 0.55);
  col += uHighlight * (rim * 0.12 + lamp * 0.55 + floorGlow);
  col += uMid * (0.08 + sky * 0.1);
  return col;
}

float caustic(vec2 p, float t) {
  vec2 q = p * 3.2;
  float a = sin(q.x * 2.1 + t * 0.7) * cos(q.y * 1.7 - t * 0.55);
  float b = sin((q.x + q.y) * 1.9 - t * 0.4) * cos((q.x - q.y) * 2.3 + t * 0.35);
  float c = sin(length(q) * 3.4 - t * 0.65);
  return pow(clamp(0.55 + 0.28 * a + 0.22 * b + 0.15 * c, 0.0, 1.0), 3.2);
}

void main() {
  vec2 uv = vUv;
  float h = texture(uHeight, uv).r;
  float hx = texture(uHeight, uv + vec2(uTexel.x, 0.0)).r - texture(uHeight, uv - vec2(uTexel.x, 0.0)).r;
  float hy = texture(uHeight, uv + vec2(0.0, uTexel.y)).r - texture(uHeight, uv - vec2(0.0, uTexel.y)).r;
  vec3 n = normalize(vec3(-hx * 28.0, 1.0, -hy * 28.0));
  vec3 V = normalize(vec3((uv.x - 0.5) * 1.2, 0.82, (uv.y - 0.35) * 1.1));
  float fresnel = pow(1.0 - max(dot(n, V), 0.0), 3.2);
  vec3 R = reflect(-V, n);
  vec3 env = studioEnv(normalize(R));
  vec2 refrUv = uv + n.xz * 0.045;
  float depth = clamp(0.35 + h * 1.8 + (1.0 - uv.y) * 0.35, 0.0, 1.0);
  vec3 body = mix(uDeep, uMid, smoothstep(0.15, 0.7, depth));
  body = mix(body, uShallow, smoothstep(0.55, 1.0, 1.0 - depth + abs(h) * 0.35));
  float cau = caustic(refrUv * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0) + n.xz * 0.4, uTime * (1.0 - uStill * 0.85));
  body += uHighlight * cau * (0.08 + fresnel * 0.12);
  body += uStudio * 0.12;
  float foam = smoothstep(0.045, 0.12, abs(hx) + abs(hy));
  vec3 color = mix(body, env, fresnel * 0.72 + 0.08);
  color = mix(color, uHighlight, foam * 0.18);
  float vignette = smoothstep(1.15, 0.25, length((uv - vec2(0.5, 0.42)) * vec2(1.15, 1.0)));
  color *= 0.72 + vignette * 0.28;
  float grain = fract(sin(dot(uv * uResolution + uTime * 11.0, vec2(12.9898, 78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.012;
  fragColor = vec4(color, 1.0);
}`;

export function WaterSurface() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });

    const tokens = getComputedStyle(document.documentElement);
    const deep = hexToVec3(tokens.getPropertyValue("--s9-void-2"), [0.043, 0.067, 0.125]);
    const mid = hexToVec3(tokens.getPropertyValue("--s9-void"), [0.059, 0.09, 0.165]);
    const shallow = hexToVec3(tokens.getPropertyValue("--s9-surface"), [0.075, 0.11, 0.192]);
    const highlight = hexToVec3(tokens.getPropertyValue("--s9-pearl"), [0.788, 0.82, 0.863]);
    const studio = hexToVec3(tokens.getPropertyValue("--s9-obsidian"), [0, 0, 0]);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const pointer = { x: 0.5, y: 0.42, active: false, px: 0.5, py: 0.42 };
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastPaint = 0;
    let simW = 192;
    let simH = 108;
    let useWebGL = Boolean(gl);

    let simProgram: WebGLProgram | null = null;
    let viewProgram: WebGLProgram | null = null;
    let textures: [WebGLTexture, WebGLTexture, WebGLTexture] | null = null;
    let framebuffers: [WebGLFramebuffer, WebGLFramebuffer, WebGLFramebuffer] | null = null;
    let readIndex = 0;
    let writeIndex = 1;
    let prevIndex = 2;
    let dropRadius = 0;
    let dropStrength = 0;
    let idleAmp = 0.00012;
    let damp = 0.985;
    let spread = 0.5;

    function chooseSimSize(cssW: number, cssH: number) {
      const cores = navigator.hardwareConcurrency || 4;
      const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
      const weak = cores <= 4 || mem <= 4 || cssW * cssH > 2_073_600;
      const strong = cores >= 8 && mem >= 8 && cssW * cssH <= 2_073_600;
      const target = weak ? 160 : strong ? 320 : 224;
      const aspect = cssW / Math.max(1, cssH);
      simW = Math.max(96, Math.round(target * Math.min(1.6, aspect)));
      simH = Math.max(72, Math.round(target / Math.min(1.6, aspect)));
      idleAmp = weak ? 0.00008 : 0.00014;
      damp = weak ? 0.978 : 0.987;
      spread = 0.5;
    }

    function createSimTexture(ctx: WebGL2RenderingContext) {
      const tex = ctx.createTexture();
      if (!tex) return null;
      ctx.bindTexture(ctx.TEXTURE_2D, tex);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
      ctx.texImage2D(
        ctx.TEXTURE_2D,
        0,
        ctx.R32F,
        simW,
        simH,
        0,
        ctx.RED,
        ctx.FLOAT,
        null,
      );
      return tex;
    }

    function createFb(ctx: WebGL2RenderingContext, tex: WebGLTexture) {
      const fb = ctx.createFramebuffer();
      if (!fb) return null;
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, fb);
      ctx.framebufferTexture2D(
        ctx.FRAMEBUFFER,
        ctx.COLOR_ATTACHMENT0,
        ctx.TEXTURE_2D,
        tex,
        0,
      );
      const ok =
        ctx.checkFramebufferStatus(ctx.FRAMEBUFFER) === ctx.FRAMEBUFFER_COMPLETE;
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
      return ok ? fb : null;
    }

    function initWebGL(ctx: WebGL2RenderingContext) {
      if (!ctx.getExtension("EXT_color_buffer_float")) return false;
      simProgram = linkProgram(ctx, VERT, SIM_FRAG);
      viewProgram = linkProgram(ctx, VERT, VIEW_FRAG);
      if (!simProgram || !viewProgram) return false;
      const t0 = createSimTexture(ctx);
      const t1 = createSimTexture(ctx);
      const t2 = createSimTexture(ctx);
      if (!t0 || !t1 || !t2) return false;
      const f0 = createFb(ctx, t0);
      const f1 = createFb(ctx, t1);
      const f2 = createFb(ctx, t2);
      if (!f0 || !f1 || !f2) return false;
      textures = [t0, t1, t2];
      framebuffers = [f0, f1, f2];
      readIndex = 0;
      writeIndex = 1;
      prevIndex = 2;
      ctx.disable(ctx.DEPTH_TEST);
      ctx.disable(ctx.BLEND);
      return true;
    }

    function destroyWebGL(ctx: WebGL2RenderingContext) {
      if (textures) textures.forEach((t) => ctx.deleteTexture(t));
      if (framebuffers) framebuffers.forEach((f) => ctx.deleteFramebuffer(f));
      if (simProgram) ctx.deleteProgram(simProgram);
      if (viewProgram) ctx.deleteProgram(viewProgram);
      textures = null;
      framebuffers = null;
      simProgram = null;
      viewProgram = null;
    }

    function seedStillField(ctx: WebGL2RenderingContext) {
      if (!textures) return;
      const data = new Float32Array(simW * simH);
      for (let y = 0; y < simH; y += 1) {
        for (let x = 0; x < simW; x += 1) {
          const u = x / simW;
          const v = y / simH;
          data[y * simW + x] = Math.sin(u * 9.2) * Math.cos(v * 7.1) * 0.012;
        }
      }
      for (const tex of textures) {
        ctx.bindTexture(ctx.TEXTURE_2D, tex);
        ctx.texImage2D(
          ctx.TEXTURE_2D,
          0,
          ctx.R32F,
          simW,
          simH,
          0,
          ctx.RED,
          ctx.FLOAT,
          data,
        );
      }
    }

    function stepSim(ctx: WebGL2RenderingContext, timeSec: number, still: boolean) {
      if (!textures || !framebuffers || !simProgram) return;
      const program = simProgram;
      ctx.useProgram(program);
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, framebuffers[writeIndex] ?? null);
      ctx.viewport(0, 0, simW, simH);
      ctx.activeTexture(ctx.TEXTURE0);
      ctx.bindTexture(ctx.TEXTURE_2D, textures[prevIndex] ?? null);
      ctx.uniform1i(ctx.getUniformLocation(program, "uPrev"), 0);
      ctx.activeTexture(ctx.TEXTURE1);
      ctx.bindTexture(ctx.TEXTURE_2D, textures[readIndex] ?? null);
      ctx.uniform1i(ctx.getUniformLocation(program, "uCurr"), 1);
      ctx.uniform2f(ctx.getUniformLocation(program, "uTexel"), 1 / simW, 1 / simH);
      ctx.uniform2f(
        ctx.getUniformLocation(program, "uDrop"),
        pointer.x,
        1 - pointer.y,
      );
      ctx.uniform1f(
        ctx.getUniformLocation(program, "uDropRadius"),
        still ? 0 : dropRadius,
      );
      ctx.uniform1f(
        ctx.getUniformLocation(program, "uDropStrength"),
        still ? 0 : dropStrength,
      );
      ctx.uniform1f(ctx.getUniformLocation(program, "uDamping"), damp);
      ctx.uniform1f(ctx.getUniformLocation(program, "uSpread"), spread);
      ctx.uniform1f(ctx.getUniformLocation(program, "uIdle"), still ? 0 : idleAmp);
      ctx.uniform1f(ctx.getUniformLocation(program, "uTime"), timeSec);
      ctx.drawArrays(ctx.TRIANGLES, 0, 3);
      const nextPrev = readIndex;
      readIndex = writeIndex;
      writeIndex = prevIndex;
      prevIndex = nextPrev;
      dropStrength *= 0.86;
      dropRadius = Math.max(0.012, dropRadius * 0.96);
    }

    function drawView(ctx: WebGL2RenderingContext, timeSec: number, still: boolean) {
      if (!textures || !viewProgram) return;
      const program = viewProgram;
      ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
      ctx.viewport(0, 0, ctx.drawingBufferWidth, ctx.drawingBufferHeight);
      ctx.useProgram(program);
      ctx.activeTexture(ctx.TEXTURE0);
      ctx.bindTexture(ctx.TEXTURE_2D, textures[readIndex] ?? null);
      ctx.uniform1i(ctx.getUniformLocation(program, "uHeight"), 0);
      ctx.uniform2f(ctx.getUniformLocation(program, "uTexel"), 1 / simW, 1 / simH);
      ctx.uniform2f(ctx.getUniformLocation(program, "uResolution"), width, height);
      ctx.uniform3fv(ctx.getUniformLocation(program, "uDeep"), deep);
      ctx.uniform3fv(ctx.getUniformLocation(program, "uMid"), mid);
      ctx.uniform3fv(ctx.getUniformLocation(program, "uShallow"), shallow);
      ctx.uniform3fv(ctx.getUniformLocation(program, "uHighlight"), highlight);
      ctx.uniform3fv(ctx.getUniformLocation(program, "uStudio"), studio);
      ctx.uniform1f(ctx.getUniformLocation(program, "uTime"), timeSec);
      ctx.uniform1f(ctx.getUniformLocation(program, "uStill"), still ? 1 : 0);
      ctx.drawArrays(ctx.TRIANGLES, 0, 3);
    }

    function paintFallback() {
      if (!canvas) return;
      if (gl) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(deep[0], deep[1], deep[2], 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      const voidDeep = tokens.getPropertyValue("--s9-void-2").trim() || "#0b1120";
      const voidMid = tokens.getPropertyValue("--s9-void").trim() || "#0f172a";
      const surfaceTok = tokens.getPropertyValue("--s9-surface").trim() || "#131c31";
      const g = context.createLinearGradient(0, 0, width * 0.2, height);
      g.addColorStop(0, voidDeep);
      g.addColorStop(0.45, voidMid);
      g.addColorStop(1, surfaceTok);
      context.fillStyle = g;
      context.fillRect(0, 0, width, height);
    }

    function paint(time: number) {
      const still = motionQuery.matches;
      if (!useWebGL || !gl) {
        paintFallback();
        return;
      }
      const timeSec = time * 0.001;
      if (!still) stepSim(gl, timeSec, false);
      drawView(gl, timeSec, still);
    }

    function resize() {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (useWebGL && gl) {
        chooseSimSize(width, height);
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        destroyWebGL(gl);
        useWebGL = initWebGL(gl);
        if (useWebGL) {
          if (motionQuery.matches) seedStillField(gl);
          paint(0);
        } else {
          paintFallback();
        }
      } else if (motionQuery.matches) {
        paint(0);
      } else {
        paintFallback();
      }
    }

    function animate(time: number) {
      if (time - lastPaint > 15) {
        paint(time);
        lastPaint = time;
      }
      if (!motionQuery.matches) frame = window.requestAnimationFrame(animate);
    }

    function start() {
      window.cancelAnimationFrame(frame);
      paint(0);
      if (!motionQuery.matches) frame = window.requestAnimationFrame(animate);
    }

    function move(event: PointerEvent) {
      const nx = event.clientX / Math.max(1, width);
      const ny = event.clientY / Math.max(1, height);
      const dx = nx - pointer.px;
      const dy = ny - pointer.py;
      const speed = Math.min(1, Math.hypot(dx, dy) * 18);
      pointer.px = nx;
      pointer.py = ny;
      pointer.x = nx;
      pointer.y = ny;
      pointer.active = true;
      const pressing = event.buttons > 0;
      dropRadius = pressing ? 0.055 + speed * 0.04 : 0.028 + speed * 0.02;
      dropStrength = pressing ? 0.045 + speed * 0.08 : 0.012 + speed * 0.035;
      if (motionQuery.matches) paint(0);
    }

    function leave() {
      pointer.active = false;
      dropStrength *= 0.5;
    }

    let interactionEnabled = false;
    function syncInteraction() {
      const shouldEnable = pointerQuery.matches && !motionQuery.matches;
      if (shouldEnable === interactionEnabled) return;
      interactionEnabled = shouldEnable;
      if (shouldEnable) {
        window.addEventListener("pointermove", move, { passive: true });
        document.documentElement.addEventListener("pointerleave", leave);
      } else {
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", leave);
        pointer.active = false;
        paint(0);
      }
    }

    function syncPreferences() {
      start();
      syncInteraction();
    }

    if (gl) {
      chooseSimSize(window.innerWidth, window.innerHeight);
      useWebGL = initWebGL(gl);
      if (useWebGL && motionQuery.matches) seedStillField(gl);
    } else {
      useWebGL = false;
    }

    resize();
    start();
    syncInteraction();
    window.addEventListener("resize", resize);
    motionQuery.addEventListener("change", syncPreferences);
    pointerQuery.addEventListener("change", syncInteraction);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      motionQuery.removeEventListener("change", syncPreferences);
      pointerQuery.removeEventListener("change", syncInteraction);
      if (gl) destroyWebGL(gl);
    };
  }, []);

  return <canvas ref={canvasRef} className={s.waterSurface} aria-hidden="true" />;
}
