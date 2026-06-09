import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ─── Floating Particles ─── */
function Particles({ count = 400 }) {
  const mesh = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return pos;
  }, [count]);

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3);
    const palette = [
      [0.03, 0.57, 0.70],  // cyan (softer)
      [0.48, 0.23, 0.93],  // purple (softer)
      [0.02, 0.59, 0.41],  // green (softer)
    ];
    for (let i = 0; i < count; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return col;
  }, [count]);

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.008;
      mesh.current.rotation.x += delta * 0.004;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
        <bufferAttribute args={[colors, 3]} attach="attributes-color" />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        vertexColors
        transparent
        opacity={0.35}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Cyber Grid Floor ─── */
function CyberGrid() {
  const gridRef = useRef<THREE.GridHelper>(null!);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z += delta * 0.2;
      if (gridRef.current.position.z > 2) {
        gridRef.current.position.z = -2;
      }
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[60, 60, 0x0066ff, 0x8899bb]}
      position={[0, -8, 0]}
    />
  );
}

/* ─── Floating Geometric Shapes ─── */
function FloatingOctahedron({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.2;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={1.5}>
      <mesh ref={mesh} position={position}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color="#0891b2"
          wireframe
          transparent
          opacity={0.15}
          emissive="#0891b2"
          emissiveIntensity={0.2}
        />
      </mesh>
    </Float>
  );
}

function FloatingTorus({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.15;
      mesh.current.rotation.z = state.clock.elapsedTime * 0.25;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1.2}>
      <mesh ref={mesh} position={position}>
        <torusGeometry args={[0.4, 0.08, 8, 16]} />
        <meshStandardMaterial
          color="#7c3aed"
          wireframe
          transparent
          opacity={0.12}
          emissive="#7c3aed"
          emissiveIntensity={0.2}
        />
      </mesh>
    </Float>
  );
}

function FloatingIcosahedron({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.12;
      mesh.current.rotation.z = state.clock.elapsedTime * 0.18;
    }
  });

  return (
    <Float speed={0.8} rotationIntensity={0.3} floatIntensity={1.8}>
      <mesh ref={mesh} position={position}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color="#059669"
          wireframe
          transparent
          opacity={0.1}
          emissive="#059669"
          emissiveIntensity={0.15}
        />
      </mesh>
    </Float>
  );
}

/* ─── Scene Composition ─── */
function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={0.3} color="#ffffff" />
      <directionalLight position={[-5, 5, -5]} intensity={0.15} color="#0891b2" />

      <Particles count={400} />
      <CyberGrid />

      <FloatingOctahedron position={[-6, 2, -5]} />
      <FloatingOctahedron position={[8, -3, -8]} />
      <FloatingTorus position={[5, 4, -6]} />
      <FloatingTorus position={[-8, -2, -4]} />
      <FloatingIcosahedron position={[0, 5, -10]} />
      <FloatingIcosahedron position={[-5, -4, -7]} />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.3}
          luminanceSmoothing={0.7}
          intensity={0.3}
          radius={0.5}
        />
      </EffectComposer>
    </>
  );
}

/* ─── Exported Background Component ─── */
export function Scene3DBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.5,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Scene3D />
      </Canvas>
    </div>
  );
}
