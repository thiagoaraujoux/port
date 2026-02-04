import { useEffect, useRef } from 'react';
import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl';

import './PurpleParticles.css';

// Cores vibrantes e contrastantes
const purpleColors = [
  '#9d4edd', // Violeta vibrante
  '#7b2cbf', // Roxo médio
  '#ff6bff', // Rosa neon
  '#c77dff', // Lilás
  '#e0aaff', // Lavanda clara
  '#ff4dff'  // Rosa forte
];

const hexToRgb = hex => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(c => c + c)
      .join('');
  }
  const int = parseInt(hex, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
};

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  attribute float size;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  uniform float uIntensity;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  varying float vSize;
  
  void main() {
    vRandom = random;
    vColor = color;
    vSize = size;
    
    vec3 pos = position * uSpread;
    
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime * 1.5;
    
    // Movimento RÁPIDO e dramático
    float speedMultiplier = 3.0 * uIntensity;
    float waveSpeed = 0.003;
    
    mPos.x += sin(t * waveSpeed * random.z + 6.28 * random.w) * mix(1.5, 6.0, random.x) * speedMultiplier;
    mPos.y += sin(t * waveSpeed * 1.2 * random.y + 6.28 * random.x) * mix(1.5, 6.0, random.w) * speedMultiplier;
    mPos.z += sin(t * waveSpeed * 0.8 * random.w + 6.28 * random.y) * mix(1.5, 6.0, random.z) * speedMultiplier;
    
    // Efeito de pulsação RÁPIDA
    float pulse = sin(t * 0.002 + random.x * 6.28) * 0.4 + 1.0;
    mPos.xyz *= pulse;
    
    // Movimento orbital adicional
    float orbitX = sin(t * 0.0005 + random.y * 6.28) * 3.0;
    float orbitY = cos(t * 0.0007 + random.z * 6.28) * 3.0;
    mPos.x += orbitX;
    mPos.y += orbitY;
    
    vec4 mvPos = viewMatrix * mPos;

    // Tamanho dinâmico baseado na distância e intensidade
    float distanceFactor = 1.0 / (length(mvPos.xyz) * 0.25);
    float sizeVariation = 1.0 + uSizeRandomness * (random.y - 0.5);
    float intensitySize = 1.0 + uIntensity * 0.7;
    
    gl_PointSize = uBaseSize * sizeVariation * distanceFactor * intensitySize * pulse * 1.2;

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  
  uniform float uTime;
  uniform float uAlphaParticles;
  uniform float uIntensity;
  varying vec4 vRandom;
  varying vec3 vColor;
  varying float vSize;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    
    // Efeitos visuais mais intensos e RÁPIDOS
    float timeGlow = sin(uTime * 0.003 + vRandom.x * 12.56) * 0.35;
    float intensityGlow = uIntensity * 0.4;
    float sizeGlow = vSize * 0.015;
    
    // Efeito de brilho central FORTE
    float centerGlow = 1.0 - smoothstep(0.0, 0.4, d);
    
    if(uAlphaParticles < 0.5) {
      // Partículas sólidas com borda suave
      if(d > 0.5) {
        discard;
      }
      float edge = smoothstep(0.4, 0.5, d);
      float alpha = 1.0 - edge;
      
      float glow = 0.4 + timeGlow + intensityGlow + centerGlow * 0.7;
      vec3 finalColor = vColor * (1.0 + glow);
      
      // Núcleo MUITO mais brilhante
      float core = 1.0 - smoothstep(0.0, 0.15, d);
      finalColor += vec3(core * 0.8);
      
      gl_FragColor = vec4(finalColor, alpha * 0.95);
    } else {
      // Partículas com glow INTENSO
      float circle = smoothstep(0.5, 0.2, d);
      circle *= (1.0 + timeGlow * 0.7 + intensityGlow * 0.5);
      
      // Efeito de halo FORTE
      float halo = smoothstep(0.7, 0.3, d) * 0.6;
      
      float totalAlpha = max(circle, halo);
      
      vec3 glowColor = vColor * (1.0 + intensityGlow + timeGlow * 0.4);
      
      // Núcleo BRILHANTE
      float core = 1.0 - smoothstep(0.0, 0.1, d);
      glowColor += vec3(core * 1.2);
      
      // Adicionar brilho externo
      float outerGlow = smoothstep(0.8, 0.6, d) * 0.3;
      totalAlpha = max(totalAlpha, outerGlow);
      
      gl_FragColor = vec4(glowColor, totalAlpha * 0.9);
    }
  }
`;

const PurpleParticles = ({
  particleCount = 800,
  particleSpread = 25,
  speed = 0.3,
  particleColors = purpleColors,
  moveParticlesOnHover = true,
  particleHoverFactor = 0.8,
  alphaParticles = true,
  particleBaseSize = 140,
  sizeRandomness = 3.5,
  cameraDistance = 40,
  disableRotation = false,
  pixelRatio = 1.8,
  intensity = 1.8,
  className = ''
}) => {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      dpr: pixelRatio,
      depth: false,
      alpha: true,
      premultipliedAlpha: false,
      antialias: true
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl, { fov: 60 });
    camera.position.set(0, 0, cameraDistance);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };
    window.addEventListener('resize', resize, false);
    resize();

    const handleMouseMove = e => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current = { x, y };
    };

    if (moveParticlesOnHover) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    const count = particleCount;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = Math.pow(Math.random(), 1.5) * particleSpread;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions.set([x, y, z], i * 3);
      randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      
      const colorIndex = Math.floor(Math.random() * particleColors.length);
      const col = hexToRgb(particleColors[colorIndex]);
      colors.set(col, i * 3);
      
      sizes[i] = 0.6 + Math.random() * 2.0;
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      random: { size: 4, data: randoms },
      color: { size: 3, data: colors },
      size: { size: 1, data: sizes }
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uSpread: { value: particleSpread },
        uBaseSize: { value: particleBaseSize * pixelRatio },
        uSizeRandomness: { value: sizeRandomness },
        uAlphaParticles: { value: alphaParticles ? 1 : 0 },
        uIntensity: { value: intensity }
      },
      transparent: true,
      depthTest: false
    });

    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });

    let animationFrameId;
    let lastTime = performance.now();
    let elapsed = 0;

    const update = t => {
      animationFrameId = requestAnimationFrame(update);
      const delta = t - lastTime;
      lastTime = t;
      elapsed += delta * speed;

      program.uniforms.uTime.value = elapsed * 0.001;

      if (moveParticlesOnHover) {
        particles.position.x = -mouseRef.current.x * particleHoverFactor * 4;
        particles.position.y = -mouseRef.current.y * particleHoverFactor * 4;
      } else {
        particles.position.x = 0;
        particles.position.y = 0;
      }

      if (!disableRotation) {
        particles.rotation.x = Math.sin(elapsed * 0.00005) * 0.25;
        particles.rotation.y = Math.cos(elapsed * 0.00008) * 0.3;
        particles.rotation.z += 0.005 * speed;
        
        particles.position.y += Math.sin(elapsed * 0.00015) * 3;
        particles.position.x += Math.cos(elapsed * 0.00012) * 2;
      }

      renderer.render({ scene: particles, camera });
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      if (moveParticlesOnHover) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
    };
  }, [
    particleCount,
    particleSpread,
    speed,
    particleColors,
    moveParticlesOnHover,
    particleHoverFactor,
    alphaParticles,
    particleBaseSize,
    sizeRandomness,
    cameraDistance,
    disableRotation,
    pixelRatio,
    intensity
  ]);

  return <div ref={containerRef} className={`purple-particles-container ${className}`} />;
};

export default PurpleParticles;