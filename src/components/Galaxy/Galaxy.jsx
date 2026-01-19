import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;
varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tris(float x) {
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * fract(x) - 1.0));
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5; 
  vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      float seed = Hash21(id + offset);
      float size = fract(seed * 345.32);
      float flareSize = smoothstep(0.9, 1.0, size);
      
      vec3 base = hsv2rgb(vec3(fract(seed + uHueShift/360.0), uSaturation, 1.0));
      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed * 0.1), tris(seed * 38.0 + uTime * uSpeed * 0.05)) - 0.5;
      
      float star = Star(gv - offset - pad, flareSize);
      col += star * size * base;
    }
  }
  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;
  
  // EFEITO DE REPULSÃO
  if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float dist = length(uv - mousePosUV);
    vec2 dir = normalize(uv - mousePosUV);
    float force = (uRepulsionStrength * 0.1) / (dist + 0.15);
    uv += dir * force * uMouseActiveFactor;
  }

  float angle = uTime * uRotationSpeed;
  uv *= mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 1.0; i += 1.0/NUM_LAYER) {
    float depth = fract(i + uTime * uStarSpeed * 0.1);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    col += StarLayer(uv * scale + i * 453.32) * depth;
  }
  
  gl_FragColor = vec4(col, uTransparent ? length(col) : 1.0);
}
`;

export default function Galaxy({
  starSpeed = 0.5, density = 1, hueShift = 200, speed = 1.0,
  glowIntensity = 0.5, saturation = 0.5, repulsionStrength = 2.5,
  rotationSpeed = 0.05, transparent = true
}) {
  const ctnDom = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5, active: 0 });

  useEffect(() => {
    if (!ctnDom.current) return;
    const renderer = new Renderer({ alpha: transparent, premultipliedAlpha: false });
    const gl = renderer.gl;
    const program = new Program(gl, {
      vertex: vertexShader, fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 }, uResolution: { value: new Color() },
        uFocal: { value: new Float32Array([0.5, 0.5]) }, uRotation: { value: new Float32Array([1, 0]) },
        uStarSpeed: { value: starSpeed }, uDensity: { value: density }, uHueShift: { value: hueShift },
        uSpeed: { value: speed }, uMouse: { value: new Float32Array([0.5, 0.5]) },
        uGlowIntensity: { value: glowIntensity }, uSaturation: { value: saturation },
        uMouseRepulsion: { value: true }, uRepulsionStrength: { value: repulsionStrength },
        uMouseActiveFactor: { value: 0 }, uRotationSpeed: { value: rotationSpeed },
        uTransparent: { value: transparent }, uAutoCenterRepulsion: { value: 0 }
      }
    });

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      program.uniforms.uResolution.value.set(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    };
    
    const onMouseMove = (e) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = 1.0 - (e.clientY / window.innerHeight);
      mouse.current.active = 1.0;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    resize();

    let frame;
    const update = (t) => {
      frame = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      program.uniforms.uMouse.value[0] += (mouse.current.x - program.uniforms.uMouse.value[0]) * 0.1;
      program.uniforms.uMouse.value[1] += (mouse.current.y - program.uniforms.uMouse.value[1]) * 0.1;
      program.uniforms.uMouseActiveFactor.value += (mouse.current.active - program.uniforms.uMouseActiveFactor.value) * 0.05;
      renderer.render({ scene: mesh });
    };
    frame = requestAnimationFrame(update);

    ctnDom.current.appendChild(gl.canvas);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      if (ctnDom.current) ctnDom.current.removeChild(gl.canvas);
    };
  }, [density, hueShift, starSpeed, repulsionStrength]);

  return <div ref={ctnDom} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />;
}