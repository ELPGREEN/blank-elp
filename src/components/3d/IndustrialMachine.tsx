import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function IndustrialMachine() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Main body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 0.8, 1]} />
          <meshStandardMaterial color="#22c55e" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Top cylinder (reactor) */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 0.6, 32]} />
          <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Pipes */}
        <mesh position={[0.8, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.8, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.8, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
        
        {/* Control panel */}
        <mesh position={[0.5, 0, 0.55]}>
          <boxGeometry args={[0.4, 0.5, 0.1]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </mesh>
        
        {/* Indicator lights */}
        <mesh position={[0.5, 0.1, 0.62]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.4, 0.1, 0.62]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
        </mesh>
        
        {/* Base */}
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[1.8, 0.2, 1.2]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

export function IndustrialMachineModel() {
  return (
    <div className="w-full h-full min-h-[350px]">
      <Canvas camera={{ position: [2, 1.5, 2], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, 3, -5]} color="#22c55e" intensity={0.5} />
        <pointLight position={[5, -3, 5]} color="#0ea5e9" intensity={0.3} />
        <IndustrialMachine />
      </Canvas>
    </div>
  );
}
