/* eslint-disable react/no-unknown-property */
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const AntigravityInner = ({ count = 400, magnetRadius = 15, ringRadius = 12, particleSize = 1.5, color = '#5227FF' }) => {
  const meshRef = useRef(null);
  const { viewport } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Captura movimento do mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normaliza para coordenadas do Three.js (-1 a 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMouse({ 
        x: x * (viewport.width / 2), 
        y: y * (viewport.height / 2) 
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [viewport]);

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

    particles.forEach((p, i) => {
      p.t += p.speed;
      const dx = p.mx - mouse.x;
      const dy = p.my - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let tX = p.mx, tY = p.my, tZ = p.mz;

      if (dist < magnetRadius) {
        const angle = Math.atan2(dy, dx);
        const wave = Math.sin(p.t * 0.5 + angle) * 1.2;
        tX = mouse.x + (ringRadius + wave) * Math.cos(angle);
        tY = mouse.y + (ringRadius + wave) * Math.sin(angle);
        tZ = p.mz + Math.sin(p.t) * 3;
      }

      p.cx += (tX - p.cx) * 0.08;
      p.cy += (tY - p.cy) * 0.08;
      p.cz += (tZ - p.cz) * 0.08;
      
      dummy.position.set(p.cx, p.cy, p.cz);
      dummy.lookAt(mouse.x, mouse.y, p.cz);
      dummy.rotateX(Math.PI / 2);
      
      const dRing = Math.abs(Math.sqrt(Math.pow(p.cx - mouse.x, 2) + Math.pow(p.cy - mouse.y, 2)) - ringRadius);
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
      position: 'absolute', 
      inset: 0, 
      zIndex: 0, 
      opacity: opacity,
      pointerEvents: 'none' 
    }}>
      <Canvas 
        camera={{ position: [0, 0, 50], fov: 35 }}
        style={{ pointerEvents: 'none' }}
      >
        <AntigravityInner {...props} />
      </Canvas>
    </div>
  );
}