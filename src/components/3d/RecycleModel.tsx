import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

function RecycleSymbol() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  const Arrow = ({ rotation }: { rotation: number }) => (
    <group rotation={[0, 0, rotation]}>
      <mesh position={[0.8, 0, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.15]} />
        <MeshTransmissionMaterial
          color="#22c55e"
          thickness={0.5}
          roughness={0.1}
          transmission={0.9}
          ior={1.5}
          chromaticAberration={0.05}
        />
      </mesh>
      <mesh position={[1.1, 0.15, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.15, 0.3, 4]} />
        <MeshTransmissionMaterial
          color="#22c55e"
          thickness={0.5}
          roughness={0.1}
          transmission={0.9}
          ior={1.5}
        />
      </mesh>
    </group>
  );

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef}>
        <Arrow rotation={0} />
        <Arrow rotation={(Math.PI * 2) / 3} />
        <Arrow rotation={(Math.PI * 4) / 3} />
      </group>
    </Float>
  );
}

export function RecycleModel() {
  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} color="#0ea5e9" intensity={0.5} />
        <RecycleSymbol />
      </Canvas>
    </div>
  );
}
