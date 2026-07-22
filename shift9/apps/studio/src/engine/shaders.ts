/* Shared GLSL chunks — ported verbatim from reference/shift9-scene.js
   (Asset Manifest #4). The math is the visual contract; do not tune. */

export const VUV_VERT =
  'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';

export const DUST_FRAG = `
    uniform float uTime; uniform vec3 uColor; uniform float uFade; varying vec2 vUv;
    float hash2(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453123); }
    // fine motes that DRIFT (continuous time) and TWINKLE (so they read as lit
    // specks in the beam, not static pixels). grid is dense → small points.
    float motes(vec2 uv, vec2 grid, float t, float thresh, float drift){
      uv.y += t * drift;                       // slow upward float
      uv.x += sin(t * 0.5 + uv.y * 7.0) * 0.012; // gentle lateral sway
      vec2 cell = floor(uv * grid);
      float n = hash2(cell);
      if (n < thresh) return 0.0;
      vec2 f = fract(uv * grid);
      vec2 c = vec2(hash2(cell + 7.1), hash2(cell + 3.3));
      float pt = smoothstep(0.09, 0.0, length(f - c)); // small crisp speck
      float tw = 0.55 + 0.45 * sin(t * 3.0 + n * 40.0); // twinkle in the light
      return pt * tw;
    }
    void main(){
      float t = uTime;
      float dust = motes(vUv, vec2(150.0, 105.0), t, 0.984, 0.016) * 0.8
                 + motes(vUv + 5.3, vec2(230.0, 165.0), t * 1.25, 0.99, 0.028) * 0.5;
      float edge = smoothstep(0.0,0.3,vUv.x)*smoothstep(1.0,0.7,vUv.x)*smoothstep(0.0,0.2,vUv.y)*smoothstep(1.0,0.8,vUv.y);
      gl_FragColor = vec4(uColor, min(dust,1.0)*0.4*edge*uFade);
    }`;

export const CONE_FRAG = `varying vec2 vUv; uniform vec3 uColor; uniform float uOp;
          void main(){ float a = pow(vUv.y,2.0)*uOp; gl_FragColor = vec4(uColor, a); }`;
