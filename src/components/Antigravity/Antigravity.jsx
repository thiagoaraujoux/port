/* eslint-disable react/no-unknown-property */
import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const AntigravityInner = ({ count = 400, magnetRadius = 12, ringRadius = 10, particleSize = 1.5, color = '#5227FF' }) => {
  const meshRef = useRef(null);
  const { viewport, mouse: fiberMouse } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const virtualMouse = useRef(new THREE.Vector2(0, 0));

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const speed = 0.01 + Math.random() / 150;
      const x = (Math.random() - 0.5) * viewport.width * 2.5;
      const y = (Math.random() - 0.5) * viewport.height * 2.5;
      const z = (Math.random() - 0.5) * 15;
      temp.push({ t, speed, mx: x, my: y, mz: z, cx: x, cy: y, cz: z });
    }
    return temp;
  }, [count, viewport]);

  useFrame(() => {
    if (!meshRef.current) return;
    // Conversão do mouse para coordenadas do mundo 3D
    const targetX = (fiberMouse.x * viewport.width) / 2;
    const targetY = (fiberMouse.y * viewport.height) / 2;
    virtualMouse.current.x += (targetX - virtualMouse.current.x) * 0.1;
    virtualMouse.current.y += (targetY - virtualMouse.current.y) * 0.1;

    particles.forEach((p, i) => {
      p.t += p.speed;
      const dx = p.mx - virtualMouse.current.x;
      const dy = p.my - virtualMouse.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let tX = p.mx, tY = p.my, tZ = p.mz;

      if (dist < magnetRadius) {
        const angle = Math.atan2(dy, dx);
        const wave = Math.sin(p.t * 0.5 + angle) * 1.2;
        tX = virtualMouse.current.x + (ringRadius + wave) * Math.cos(angle);
        tY = virtualMouse.current.y + (ringRadius + wave) * Math.sin(angle);
        tZ = p.mz + Math.sin(p.t) * 3;
      }

      p.cx += (tX - p.cx) * 0.08;
      p.cy += (tY - p.cy) * 0.08;
      p.cz += (tZ - p.cz) * 0.08;
      dummy.position.set(p.cx, p.cy, p.cz);
      dummy.lookAt(virtualMouse.current.x, virtualMouse.current.y, p.cz);
      dummy.rotateX(Math.PI / 2);
      const dRing = Math.abs(Math.sqrt(Math.pow(p.cx - virtualMouse.current.x, 2) + Math.pow(p.cy - virtualMouse.current.y, 2)) - ringRadius);
      const scale = Math.max(0.2, Math.min(1, 1 - dRing / 8)) * particleSize;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} />
    </instancedMesh>
  );
};

export default function Antigravity({ opacity = 1, ...props }) {
  return (
    <div style={{ 
        position: 'absolute', inset: 0, zIndex: 0, 
        opacity: opacity, transition: 'opacity 0.8s ease-in-out',
        pointerEvents: 'none' /* Container div não bloqueia, mas o Canvas interno via CSS bloqueia */
    }}>
      <Canvas camera={{ position: [0, 0, 50], fov: 35 }}>
        <AntigravityInner {...props} />
      </Canvas>
    </div>
  );
}