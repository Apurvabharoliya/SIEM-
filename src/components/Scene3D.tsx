import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ─── Floating Particles ─── */
function Particles({ count = 800 }) {
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
      [0, 0.83, 1],    // cyan
      [0.4, 0.2, 1],   // purple
      [0, 1, 0.53],    // green
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
      mesh.current.rotation.y += delta * 0.015;
      mesh.current.rotation.x += delta * 0.008;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
        <bufferAttribute args={[colors, 3]} attach="attributes-color" />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.7}
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
      gridRef.current.position.z += delta * 0.3;
      if (gridRef.current.position.z > 2) {
        gridRef.current.position.z = -2;
      }
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[60, 60, 0x0066ff, 0x003388]}
      position={[0, -8, 0]}
    />
  );
}

/* ─── Floating Geometric Shapes ─── */
function FloatingOctahedron({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.3;
      mesh.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={2}>
      <mesh ref={mesh} position={position}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.3}
          emissive="#00d4ff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </Float>
  );
}

function FloatingTorus({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * 0.2;
      mesh.current.rotation.z = state.clock.elapsedTime * 0.4;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={1.5}>
      <mesh ref={mesh} position={position}>
        <torusGeometry args={[0.5, 0.12, 8, 16]} />
        <meshStandardMaterial
          color="#a855f7"
          wireframe
          transparent
          opacity={0.2}
          emissive="#a855f7"
          emissiveIntensity={0.4}
        />
      </mesh>
    </Float>
  );
}

function FloatingIcosahedron({ position }: { position: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.15;
      mesh.current.rotation.z = state.clock.elapsedTime * 0.25;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.4} floatIntensity={2.5}>
      <mesh ref={mesh} position={position}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color="#00ff88"
          wireframe
          transparent
          opacity={0.15}
          emissive="#00ff88"
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  );
}

/* ─── Data Stream Lines ─── */
function DataStreams() {
  const group = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (group.current) {
      group.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.position) {
          mesh.position.y -= 0.02;
          if (mesh.position.y < -10) {
            mesh.position.y = 10;
            mesh.position.x = (Math.random() - 0.5) * 30;
          }
        }
      });
    }
  });

  const streams = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      key: i,
      position: [(Math.random() - 0.5) * 30, Math.random() * 20 - 10, (Math.random() - 0.5) * 15 - 5] as [number, number, number],
      scale: [0.01, Math.random() * 2 + 1, 0.01] as [number, number, number],
      color: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#a855f7' : '#00ff88',
    }));
  }, []);

  return (
    <group ref={group}>
      {streams.map((s) => (
        <mesh key={s.key} position={s.position} scale={s.scale}>
          <cylinderGeometry args={[1, 1, 1, 4]} />
          <meshBasicMaterial
            color={s.color}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Scene Composition ─── */
function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.3} color="#00d4ff" />
      <pointLight position={[-10, -10, -5]} intensity={0.2} color="#a855f7" />
      <pointLight position={[0, 5, -10]} intensity={0.15} color="#00ff88" />

      <Particles count={600} />
      <CyberGrid />
      <DataStreams />

      <FloatingOctahedron position={[-6, 2, -5]} />
      <FloatingOctahedron position={[8, -3, -8]} />
      <FloatingTorus position={[5, 4, -6]} />
      <FloatingTorus position={[-8, -2, -4]} />
      <FloatingIcosahedron position={[0, 5, -10]} />
      <FloatingIcosahedron position={[-5, -4, -7]} />

      <Stars radius={50} depth={50} count={1500} factor={3} saturation={0.5} fade speed={0.5} />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          intensity={0.8}
          radius={0.8}
        />
        <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} />
        <Noise opacity={0.03} />
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
