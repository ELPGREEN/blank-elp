import { useRef, useMemo, useState, useEffect, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';

// Detect low-end device based on hardware concurrency and device memory
function useDevicePerformance(): 'high' | 'medium' | 'low' {
  const [perf, setPerf] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    const isTouchDevice = 'ontouchstart' in window;
    if (cores <= 2 || memory <= 2 || (isTouchDevice && cores <= 4)) {
      setPerf('low');
    } else if (cores >= 8 && memory >= 8) {
      setPerf('high');
    } else {
      setPerf('medium');
    }
  }, []);

  return perf;
}

// Navy blue particles — background layer
function NavyParticles({ count = 600, speed = 0.015 }: { count?: number; speed?: number }) {
  const ref = useRef<THREE.Points>(null);
  const frameSkip = useRef(0);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    frameSkip.current++;
    if (frameSkip.current % 2 !== 0) return;
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * speed * 0.8;
      ref.current.rotation.y = state.clock.elapsedTime * speed;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#1e3a5f"
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

// Gold accent particles — foreground layer, opposite rotation
function GoldParticles({ count = 100, speed = 0.02 }: { count?: number; speed?: number }) {
  const ref = useRef<THREE.Points>(null);
  const frameSkip = useRef(0);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    frameSkip.current++;
    if (frameSkip.current % 2 !== 0) return;
    if (ref.current) {
      // Opposite rotation to navy for parallax depth
      ref.current.rotation.x = -state.clock.elapsedTime * speed * 0.6;
      ref.current.rotation.y = -state.clock.elapsedTime * speed;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#b8902a"
        size={0.09}
        sizeAttenuation
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </points>
  );
}

// Neural network connections between nearby navy particles
function ParticleConnections({ count = 300, threshold = 3.2 }: { count?: number; threshold?: number }) {
  const ref = useRef<THREE.LineSegments>(null);
  const frameSkip = useRef(0);
  const rotX = useRef(0);
  const rotY = useRef(0);

  const { positions: particlePos, linePositions } = useMemo(() => {
    const positions = [] as number[];
    for (let i = 0; i < count; i++) {
      positions.push(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 12
      );
    }

    const linePositions: number[] = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = positions[i * 3]     - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < threshold) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }
    return { positions, linePositions };
  }, [count, threshold]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    return geo;
  }, [linePositions]);

  useFrame((state) => {
    frameSkip.current++;
    if (frameSkip.current % 3 !== 0) return;
    if (ref.current) {
      rotX.current = state.clock.elapsedTime * 0.008;
      rotY.current = state.clock.elapsedTime * 0.012;
      ref.current.rotation.x = rotX.current;
      ref.current.rotation.y = rotY.current;
    }
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial
        color="#2a4a7f"
        transparent
        opacity={0.12}
        depthWrite={false}
      />
    </lineSegments>
  );
}

// Mouse-reactive repulsion layer
function MouseReactiveLayer({ count = 80 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { camera, gl } = useThree();
  const mouse = useRef(new THREE.Vector2(0, 0));
  const frameSkip = useRef(0);

  const originalPositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, [count]);

  const currentPositions = useMemo(() => new Float32Array(originalPositions), [originalPositions]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    canvas.addEventListener('mousemove', onMouseMove);
    return () => canvas.removeEventListener('mousemove', onMouseMove);
  }, [gl]);

  useFrame(() => {
    frameSkip.current++;
    if (frameSkip.current % 2 !== 0) return;
    if (!ref.current) return;

    const repulseX = mouse.current.x * 5;
    const repulseY = mouse.current.y * 5;
    const repulseRadius = 2.5;
    const repulseStrength = 1.2;

    for (let i = 0; i < count; i++) {
      const ox = originalPositions[i * 3];
      const oy = originalPositions[i * 3 + 1];
      const oz = originalPositions[i * 3 + 2];

      const dx = ox - repulseX;
      const dy = oy - repulseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < repulseRadius) {
        const force = (1 - dist / repulseRadius) * repulseStrength;
        currentPositions[i * 3]     = ox + (dx / dist) * force;
        currentPositions[i * 3 + 1] = oy + (dy / dist) * force;
        currentPositions[i * 3 + 2] = oz;
      } else {
        // Spring back
        currentPositions[i * 3]     += (ox - currentPositions[i * 3]) * 0.05;
        currentPositions[i * 3 + 1] += (oy - currentPositions[i * 3 + 1]) * 0.05;
        currentPositions[i * 3 + 2] += (oz - currentPositions[i * 3 + 2]) * 0.05;
      }
    }

    (ref.current.geometry.attributes.position as THREE.BufferAttribute).array = currentPositions;
    (ref.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[currentPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#3a6090"
        size={0.05}
        sizeAttenuation
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </points>
  );
}

export const ParticleField = forwardRef<HTMLDivElement>(function ParticleField(_props, _ref) {
  const isMobile = useIsMobile();
  const perf = useDevicePerformance();
  const [shouldRender, setShouldRender] = useState(true);

  const config = useMemo(() => {
    if (isMobile || perf === 'low') {
      return { navy: 200, gold: 40, connections: 0, mouse: 0, speed: 0.012 };
    } else if (perf === 'medium') {
      return { navy: 450, gold: 80, connections: 200, mouse: 60, speed: 0.018 };
    }
    return { navy: 700, gold: 130, connections: 320, mouse: 90, speed: 0.022 };
  }, [isMobile, perf]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setShouldRender(false);
  }, []);

  if (!shouldRender || (isMobile && perf === 'low')) {
    return <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 to-transparent" />;
  }

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 70 }}
        dpr={isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5)}
        gl={{
          antialias: false,
          powerPreference: 'low-power',
          alpha: true,
          stencil: false,
          depth: false,
        }}
        onError={() => null}
      >
        <NavyParticles count={config.navy} speed={config.speed} />
        <GoldParticles count={config.gold} speed={config.speed * 1.2} />
        {config.connections > 0 && (
          <ParticleConnections count={config.connections} threshold={3.2} />
        )}
        {config.mouse > 0 && !isMobile && (
          <MouseReactiveLayer count={config.mouse} />
        )}
      </Canvas>
    </div>
  );
});
