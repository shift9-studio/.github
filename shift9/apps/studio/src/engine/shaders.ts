/* Shared GLSL chunks — ported verbatim from reference/shift9-scene.js
   (Asset Manifest #4). The math is the visual contract; do not tune. */

export const VUV_VERT =
  'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';

export const DUST_FRAG = `
    uniform float uTime; uniform vec3 uColor; uniform float uFade; varying vec2 vUv;
    float hash2(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453123); }
    float mote(vec2 uv, vec2 grid, float t, float thresh){
      vec2 cell = floor(uv*grid);
      float n = hash2(cell + vec2(t*0.37, t*0.61));
      if (n < thresh) return 0.0;
      vec2 f = fract(uv*grid);
      vec2 c = vec2(hash2(cell+7.1), hash2(cell+3.3));
      return smoothstep(0.35, 0.0, length(f - c)); // point falloff inside the cell
    }
    void main(){
      float t = floor(uTime*6.0);
      float dust = mote(vUv, vec2(60.0,40.0), t, 0.985)*0.9
                 + mote(vUv+13.7, vec2(110.0,75.0), t*1.7, 0.992)*0.7;
      float edge = smoothstep(0.0,0.3,vUv.x)*smoothstep(1.0,0.7,vUv.x)*smoothstep(0.0,0.2,vUv.y)*smoothstep(1.0,0.8,vUv.y);
      gl_FragColor = vec4(uColor, min(dust,1.0)*0.35*edge*uFade);
    }`;

export const CONE_FRAG = `varying vec2 vUv; uniform vec3 uColor; uniform float uOp;
          void main(){ float a = pow(vUv.y,2.0)*uOp; gl_FragColor = vec4(uColor, a); }`;
