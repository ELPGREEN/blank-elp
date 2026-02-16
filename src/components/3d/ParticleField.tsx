import { useRef, useMemo, useState, useEffect, forwardRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useIsMobile } from '@/hooks/use-mobile';

// Detect low-end device based on hardware concurrency and device memory
function useDevicePerformance(): 'high' | 'medium' | 'low' {
  const [performance, setPerformance] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    const isTouchDevice = 'ontouchstart' in window;
    
    if (cores <= 2 || memory <= 2 || (isTouchDevice && cores <= 4)) {
      setPerformance('low');
    } else if (cores >= 8 && memory >= 8) {
      setPerformance('high');
    } else {
      setPerformance('medium');
    }
  }, []);

  return performance;
}

function Particles({ count = 800, speed = 0.03 }) {
  const ref = useRef<THREE.Points>(null);
  const frameSkip = useRef(0);

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    // Skip frames for smoother performance on low-end devices
    frameSkip.current++;
    if (frameSkip.current % 2 !== 0) return;
    
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * speed;
      ref.current.rotation.y = state.clock.elapsedTime * (speed * 1.5);
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#22c55e"
        size={0.04}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  );
}

export const ParticleField = forwardRef<HTMLDivElement>(function ParticleField(_props, _ref) {
  const isMobile = useIsMobile();
  const performance = useDevicePerformance();
  const [shouldRender, setShouldRender] = useState(true);

  // Determine particle count based on device performance
  const particleConfig = useMemo(() => {
    if (isMobile || performance === 'low') {
      return { count: 300, speed: 0.02 };
    } else if (performance === 'medium') {
      return { count: 600, speed: 0.025 };
    }
    return { count: 1000, speed: 0.03 };
  }, [isMobile, performance]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setShouldRender(false);
    }
  }, []);

  // Don't render on very low-end devices or reduced motion
  if (!shouldRender || (isMobile && performance === 'low')) {
    return (
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 to-transparent" />
    );
  }

  try {
    return (
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          dpr={isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5)}
          gl={{ 
            antialias: false,
            powerPreference: 'low-power',
            alpha: true,
            stencil: false,
            depth: false
          }}
          onError={() => null}
        >
          <Particles count={particleConfig.count} speed={particleConfig.speed} />
        </Canvas>
      </div>
    );
  } catch {
    return <div className="absolute inset-0 z-0 bg-gradient-to-b from-primary/5 to-transparent" />;
  }
});
