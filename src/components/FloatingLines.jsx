import { useEffect, useRef } from 'react';
import { Scene, OrthographicCamera, WebGLRenderer, PlaneGeometry, Mesh, ShaderMaterial, Vector3, Vector2, Clock } from 'three';

const vertexShader = `
precision highp float;
void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const fragmentShader = `
precision highp float;
uniform float iTime;
uniform vec3 iResolution;
uniform float animationSpeed;
uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;
uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;
uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;
uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;
uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;
uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;
uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r) { return mat2(cos(r), sin(r), -sin(r), cos(r)); }

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) return baseColor;
  float clampedT = clamp(t, 0.0, 0.9999);
  float scaled = clampedT * float(lineGradientCount - 1);
  int idx = int(floor(scaled));
  float f = fract(scaled);
  int idx2 = min(idx + 1, lineGradientCount - 1);
  return mix(lineGradient[idx], lineGradient[idx2], f) * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;
  float x_offset = offset;
  float x_movement = time * 0.1;
  float amp = sin(offset + time * 0.2) * 0.3;
  float y = sin(uv.x + x_offset + x_movement) * amp;
  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    y += (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
  }
  return 0.0175 / max(abs(m = uv.y - y) + 0.01, 1e-3) + 0.01;
}

void main() {
  vec2 baseUv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  if (parallax) baseUv += parallaxOffset;
  vec3 col = vec3(0.0);
  vec2 mouseUv = interactive ? (2.0 * iMouse - iResolution.xy) / iResolution.y : vec2(0.0);
  if (interactive) mouseUv.y *= -1.0;

  if (enableMiddle) {
    for (int i = 0; i < 8; ++i) { // Hardcoded limit for shader loop stability
      if(i >= middleLineCount) break;
      float t = float(i) / max(float(middleLineCount - 1), 1.0);
      col += getLineColor(t, vec3(0.1)) * wave(baseUv * rotate(middleWavePosition.z * log(length(baseUv) + 1.0)) + vec2(middleLineDistance * float(i) + middleWavePosition.x, middleWavePosition.y), 2.0 + 0.15 * float(i), baseUv, mouseUv, interactive);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function FloatingLines({ linesGradient = ['#5227FF', '#FF9FFC'], enabledWaves = ['middle'], lineCount = 6, animationSpeed = 1, interactive = true, mixBlendMode = 'screen' }) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3() },
      animationSpeed: { value: animationSpeed },
      enableMiddle: { value: true },
      middleLineCount: { value: lineCount },
      middleLineDistance: { value: 0.05 },
      middleWavePosition: { value: new Vector3(5.0, 0.0, 0.2) },
      iMouse: { value: new Vector2() },
      interactive: { value: interactive },
      bendRadius: { value: 5.0 },
      bendStrength: { value: -0.5 },
      bendInfluence: { value: 0.5 },
      parallax: { value: true },
      parallaxStrength: { value: 0.1 },
      parallaxOffset: { value: new Vector2() },
      lineGradient: { value: linesGradient.map(c => {
        const r = parseInt(c.slice(1,3), 16)/255;
        const g = parseInt(c.slice(3,5), 16)/255;
        const b = parseInt(c.slice(5,7), 16)/255;
        return new Vector3(r, g, b);
      })},
      lineGradientCount: { value: linesGradient.length }
    };

    const mesh = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ uniforms, vertexShader, fragmentShader }));
    scene.add(mesh);
    const clock = new Clock();

    const animate = () => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const resize = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      renderer.setSize(width, height);
      uniforms.iResolution.value.set(width, height, 1);
    };

    window.addEventListener('resize', resize);
    resize(); animate();
    return () => { window.removeEventListener('resize', resize); renderer.dispose(); };
  }, [linesGradient]);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1, mixBlendMode }} />;
}