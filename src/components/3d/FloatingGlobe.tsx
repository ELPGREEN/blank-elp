import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Sphere, OrbitControls, Line, Html, Stars } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { MapPin, Phone, Mail, Building2, Users, Globe, X, ZoomIn, ZoomOut, RotateCcw, Sun as SunIcon, Moon, ExternalLink, Copy, Check } from 'lucide-react';
import { HQMiniMap } from '@/components/maps/HQMiniMap';

// Get user's local hour to determine day/night
function getIsNightTime(): boolean {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 19;
}

// City lights on the dark side of Earth
function CityLights({ intensity = 1 }: { intensity?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const cities = useMemo(() => [
    { lat: 51.5, lon: -0.1 }, { lat: 48.9, lon: 2.35 }, { lat: 52.5, lon: 13.4 },
    { lat: 41.9, lon: 12.5 }, { lat: 40.4, lon: -3.7 }, { lat: 55.8, lon: 37.6 },
    { lat: 35.7, lon: 139.7 }, { lat: 31.2, lon: 121.5 }, { lat: 39.9, lon: 116.4 },
    { lat: 22.3, lon: 114.2 }, { lat: 1.35, lon: 103.8 }, { lat: 28.6, lon: 77.2 },
    { lat: 19.1, lon: 72.9 }, { lat: 37.6, lon: 127 },
    { lat: 40.7, lon: -74 }, { lat: 34.1, lon: -118.2 }, { lat: 41.9, lon: -87.6 },
    { lat: -23.5, lon: -46.6 }, { lat: -22.9, lon: -43.2 }, { lat: 19.4, lon: -99.1 },
    { lat: -34.6, lon: -58.4 },
    { lat: 30, lon: 31.2 }, { lat: -33.9, lon: 18.4 }, { lat: 25.2, lon: 55.3 },
    { lat: -33.9, lon: 151.2 }, { lat: -37.8, lon: 145 },
  ], []);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(cities.length * 3);
    cities.forEach((city, i) => {
      const phi = (90 - city.lat) * (Math.PI / 180);
      const theta = (city.lon + 180) * (Math.PI / 180);
      const radius = 1.51;
      pos[i * 3] = -(radius * Math.sin(phi) * Math.cos(theta));
      pos[i * 3 + 1] = radius * Math.cos(phi);
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    });
    return pos;
  }, [cities]);
  
  useFrame((state) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = (0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2) * intensity;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={cities.length}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#ffcc00"
        transparent
        opacity={0.7 * intensity}
        sizeAttenuation
      />
    </points>
  );
}

// Sun component
function SunLight({ isNight }: { isNight: boolean }) {
  const sunRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  const position: [number, number, number] = isNight ? [-8, -4, -6] : [8, 4, 6];
  const sunIntensity = isNight ? 0.3 : 2;
  
  useFrame((state) => {
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      glowRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <group position={position}>
      <mesh ref={sunRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial color={isNight ? "#8899aa" : "#FDB813"} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color={isNight ? "#6677aa" : "#FDB813"} transparent opacity={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial color={isNight ? "#445566" : "#FF8C00"} transparent opacity={0.1} />
      </mesh>
      <pointLight color={isNight ? "#8899bb" : "#FFF5E6"} intensity={sunIntensity} distance={30} decay={2} />
    </group>
  );
}

// Floating particles around globe
function SpaceParticles({ count = 100 }) {
  const points = useRef<THREE.Points>(null);
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 3 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, [count]);
  
  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });
  
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.01} color="#88ccff" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// Convert lat/long to 3D position on sphere
function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

// Create curved arc between two points on sphere
function createArc(start: THREE.Vector3, end: THREE.Vector3, segments: number = 50): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = new THREE.Vector3().lerpVectors(start, end, t);
    const midHeight = 1 + Math.sin(t * Math.PI) * 0.3;
    point.normalize().multiplyScalar(1.5 * midHeight);
    points.push(point);
  }
  return points;
}

// Headquarters locations with EXACT coordinates
const headquarters = [
  { 
    name: 'Valenza, Italy', 
    lat: 44.9767,
    lon: 8.6424, 
    color: '#22c55e',
    address: 'Strada per Solero',
    phone: '+39 350 1021359',
    email: 'info@elpgreen.com',
    website: 'www.elpgreen.com',
    description: 'European Headquarters & Strategic Operations',
    team: 'Ericson Piccoli - Chairman & Founder',
    operations: ['Strategic Planning', 'European Sales', 'Partner Relations']
  },
  { 
    name: 'Medianeira, Brazil', 
    lat: -25.2959,
    lon: -54.0942, 
    color: '#eab308',
    address: 'Linha Saude S/N, PR - CEP 85884-000',
    phone: '+39 350 1021359',
    email: 'info@elpgreen.com',
    website: 'www.elpgreen.com',
    description: 'South American Operations & R&D Center',
    team: 'Technical & Operations Team',
    operations: ['R&D Development', 'South American Market', 'Technical Support']
  },
  { 
    name: 'Frankfurt, Germany', 
    lat: 50.1109,
    lon: 8.6821, 
    color: '#ef4444',
    address: 'Financial District',
    phone: '+39 350 1021359',
    email: 'info@elpgreen.com',
    website: 'www.elpgreen.com',
    description: 'Financial Hub & Investor Relations',
    team: 'Finance & Investment Team',
    operations: ['Investor Relations', 'Financial Strategy', 'EU Compliance']
  },
  { 
    name: 'Zhangjiagang, China', 
    lat: 31.8756,
    lon: 120.5536, 
    color: '#f97316',
    address: 'TOPS Recycling Industrial Park, Jiangsu Province',
    phone: '+86 159 6237 8058',
    email: 'info@topsindustry.com',
    website: 'www.topsrecycling.com',
    description: 'Manufacturing & Asia-Pacific Operations',
    team: 'Xu Shihe - Managing Director China',
    operations: ['Equipment Manufacturing', 'Asia-Pacific Sales', 'Production']
  },
  { 
    name: 'Sydney, Australia', 
    lat: -33.8688,
    lon: 151.2093, 
    color: '#06b6d4',
    address: 'Level 5, 100 Miller Street, North Sydney NSW 2060',
    phone: '+39 350 1021359',
    email: 'info@elpgreen.com',
    website: 'www.elpgreen.com',
    description: 'Oceania Regional Office & Mining Partnerships',
    team: 'Asia-Pacific Expansion Team',
    operations: ['Mining Industry Relations', 'Oceania Market', 'OTR Tire Sourcing']
  },
];

const routes = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 0, to: 3 },
  { from: 2, to: 3 },
  { from: 1, to: 3 },
  { from: 3, to: 4 },
  { from: 4, to: 1 },
];

interface HeadquarterInfo {
  name: string;
  color: string;
  address: string;
  phone?: string;
  email: string;
  website?: string;
  description: string;
  team: string;
  operations: string[];
  lat: number;
  lon: number;
}

function AnimatedRoute({ points, color }: { points: THREE.Vector3[]; color: string }) {
  const lineRef = useRef<any>(null);
  
  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.material.dashOffset = -state.clock.elapsedTime * 0.5;
    }
  });
  
  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={0.6}
      dashed
      dashScale={8}
      dashSize={0.1}
      dashOffset={0}
    />
  );
}

// Smooth cinematic camera fly animation with easing
function CinematicCamera({ 
  targetPosition, 
  isFlying,
  onFlyComplete
}: { 
  targetPosition: THREE.Vector3 | null;
  isFlying: boolean;
  onFlyComplete: () => void;
}) {
  const { camera, controls } = useThree();
  const startPos = useRef(new THREE.Vector3());
  const endPos = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const endLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const progress = useRef(0);
  const flying = useRef(false);
  
  useEffect(() => {
    if (isFlying && targetPosition) {
      startPos.current.copy(camera.position);
      startLookAt.current.set(0, 0, 0); // Start looking at center
      endLookAt.current.copy(targetPosition); // End looking at marker
      
      // Calculate end position - camera looks at marker from optimal distance
      const direction = targetPosition.clone().normalize();
      // Position camera further out and slightly above for better view
      const offset = new THREE.Vector3(0, 0.3, 0);
      endPos.current.copy(direction.multiplyScalar(3.0).add(offset));
      
      progress.current = 0;
      flying.current = true;
    }
  }, [isFlying, targetPosition, camera]);
  
  useFrame((_, delta) => {
    if (flying.current) {
      // Slower, more cinematic animation
      progress.current += delta * 0.6;
      
      if (progress.current >= 1) {
        progress.current = 1;
        flying.current = false;
        onFlyComplete();
      }
      
      // Custom ease-out cubic for smoother deceleration
      const t = progress.current;
      const ease = 1 - Math.pow(1 - t, 4);
      
      // Interpolate camera position
      camera.position.lerpVectors(startPos.current, endPos.current, ease);
      
      // Interpolate look-at target for smooth transition
      const currentLookAt = new THREE.Vector3().lerpVectors(
        startLookAt.current, 
        endLookAt.current, 
        ease
      );
      camera.lookAt(currentLookAt);
      
      // Update controls target if available
      if (controls && (controls as any).target) {
        (controls as any).target.copy(currentLookAt);
      }
    } else if (targetPosition) {
      // When not flying but has a target, keep looking at it smoothly
      camera.lookAt(targetPosition);
    }
  });
  
  return null;
}

function LocationMarker({ 
  position, 
  info,
  isSelected,
  onSelect
}: { 
  position: THREE.Vector3; 
  info: HeadquarterInfo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const pinRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (pulseRef.current) {
      const baseScale = isSelected ? 1.8 : 1;
      const pulse = Math.sin(state.clock.elapsedTime * (isSelected ? 4 : 2)) * 0.4;
      pulseRef.current.scale.setScalar(baseScale + pulse);
    }
    // Pin bounce animation
    if (pinRef.current && (hovered || isSelected)) {
      pinRef.current.position.y = Math.sin(state.clock.elapsedTime * 5) * 0.02;
    }
  });

  // Calculate pin direction (pointing outward from globe center)
  const pinDirection = position.clone().normalize();
  const pinHeight = 0.15;
  const pinTop = position.clone().add(pinDirection.clone().multiplyScalar(pinHeight));
  
  return (
    <group>
      {/* Pin stem */}
      <Line
        points={[position, pinTop]}
        color={info.color}
        lineWidth={3}
      />
      
      {/* Pin head */}
      <group ref={pinRef} position={pinTop}>
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <sphereGeometry args={[isSelected ? 0.1 : 0.07, 16, 16]} />
          <meshBasicMaterial color={info.color} transparent opacity={hovered || isSelected ? 1 : 0.95} />
        </mesh>
        
        {/* Pulsing glow */}
        <mesh ref={pulseRef}>
          <sphereGeometry args={[isSelected ? 0.12 : 0.08, 16, 16]} />
          <meshBasicMaterial color={info.color} transparent opacity={isSelected ? 0.4 : 0.2} />
        </mesh>
      </group>
      
      {/* City name label - always visible */}
      <Html
        position={pinTop.clone().add(pinDirection.clone().multiplyScalar(0.12))}
        center
        style={{ pointerEvents: 'none' }}
        zIndexRange={[100, 0]}
      >
        <div 
          className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap transition-all ${isSelected ? 'scale-110' : ''}`}
          style={{ 
            backgroundColor: `${info.color}dd`,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {info.name.split(',')[0]}
        </div>
      </Html>
      
      {/* Hover Tooltip */}
      {hovered && !isSelected && (
        <Html
          position={pinTop.clone().add(pinDirection.clone().multiplyScalar(0.25))}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div 
            className="bg-background/95 backdrop-blur-sm border border-primary/30 rounded-lg p-3 shadow-xl min-w-[180px]"
          >
            <div className="font-bold text-sm mb-1" style={{ color: info.color }}>
              {info.name}
            </div>
            <div className="text-xs text-muted-foreground">
              Click to view details
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function EarthGlobe({ 
  selectedHQ, 
  onSelectHQ,
  isNight,
  isFlying,
  onFlyComplete,
  markerPositions
}: { 
  selectedHQ: number | null;
  onSelectHQ: (index: number | null) => void;
  isNight: boolean;
  isFlying: boolean;
  onFlyComplete: () => void;
  markerPositions: THREE.Vector3[];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const earthTexture = useLoader(TextureLoader, '/textures/earth.jpg');

  const routeArcs = useMemo(() => {
    return routes.map(route => ({
      points: createArc(markerPositions[route.from], markerPositions[route.to]),
      color: headquarters[route.from].color,
    }));
  }, [markerPositions]);

  return (
    <>
      <CinematicCamera 
        targetPosition={selectedHQ !== null ? markerPositions[selectedHQ] : null}
        isFlying={isFlying}
        onFlyComplete={onFlyComplete}
      />
      
      {/* Space environment */}
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
      <SunLight isNight={isNight} />
      <SpaceParticles count={80} />
      
      <group ref={groupRef}>
        {/* Earth - clearer map without heavy atmosphere */}
        <Sphere args={[1.5, 64, 64]}>
          <meshStandardMaterial
            map={earthTexture}
            roughness={0.7}
            metalness={0.05}
            emissive={new THREE.Color(isNight ? '#0b1220' : '#000000')}
            emissiveIntensity={isNight ? 0.25 : 0.05}
          />
        </Sphere>
        
        {/* City lights - more visible at night */}
        <CityLights intensity={isNight ? 1.5 : 0.5} />
        
        {/* Very subtle atmosphere - reduced opacity */}
        <Sphere args={[1.52, 64, 64]}>
          <meshBasicMaterial
            color="#87CEEB"
            transparent
            opacity={0.02}
            side={THREE.BackSide}
          />
        </Sphere>
        
        {headquarters.map((hq, index) => (
          <LocationMarker
            key={hq.name}
            position={markerPositions[index]}
            info={hq}
            isSelected={selectedHQ === index}
            onSelect={() => onSelectHQ(selectedHQ === index ? null : index)}
          />
        ))}
        
        {routeArcs.map((route, index) => (
          <AnimatedRoute
            key={index}
            points={route.points}
            color={route.color}
          />
        ))}
      </group>
    </>
  );
}

// Contact info section with copy button
function ContactInfoSection({ 
  hq, 
  osmUrl, 
  t 
}: { 
  hq: HeadquarterInfo; 
  osmUrl: string; 
  t: (key: string) => string;
}) {
  const [copied, setCopied] = useState(false);
  
  const copyAddress = async () => {
    const fullAddress = `${hq.name}\n${hq.address}${hq.phone ? `\n${hq.phone}` : ''}\n${hq.email}`;
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4" style={{ color: hq.color }} />
          {t('globe.contactInfo')}
        </h4>
        <button
          onClick={copyAddress}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-all ${
            copied 
              ? 'bg-green-500/20 text-green-600' 
              : 'bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary'
          }`}
          title={t('globe.copyAddress')}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              {t('globe.copied')}
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              {t('globe.copyAddress')}
            </>
          )}
        </button>
      </div>
      <div className="space-y-2 pl-6">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-foreground">{hq.address}</div>
            <a
              href={osmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              <ExternalLink className="h-3 w-3" />
              {t('globe.openOSM')}
            </a>
          </div>
        </div>
        {hq.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <a href={`tel:${hq.phone}`} className="hover:underline text-foreground">{hq.phone}</a>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
          <a href={`mailto:${hq.email}`} className="hover:underline text-foreground">{hq.email}</a>
        </div>
      </div>
    </div>
  );
}

// Detail panel component with translations - always visible when selected
function DetailPanel({ 
  hq, 
  onClose,
  t 
}: { 
  hq: HeadquarterInfo; 
  onClose: () => void;
  t: (key: string) => string;
}) {
  const osmUrl = `https://www.openstreetmap.org/?mlat=${hq.lat}&mlon=${hq.lon}#map=17/${hq.lat}/${hq.lon}`;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute right-2 sm:right-4 top-2 sm:top-4 bottom-2 sm:bottom-4 w-[calc(100%-1rem)] sm:w-72 md:w-80 bg-background/95 backdrop-blur-md border border-primary/20 rounded-xl shadow-2xl overflow-hidden z-10"
    >
      <div 
        className="p-4 border-b border-primary/20"
        style={{ background: `linear-gradient(135deg, ${hq.color}20, transparent)` }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg" style={{ color: hq.color }}>
              {hq.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {hq.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100%-80px)]">
        {/* Mini map (OpenStreetMap) - ALWAYS VISIBLE */}
        <div className="h-48 rounded-lg overflow-hidden border border-border">
          <HQMiniMap lat={hq.lat} lon={hq.lon} title={hq.name} subtitle={hq.address} />
        </div>

        {/* Contact Info */}
        <ContactInfoSection hq={hq} osmUrl={osmUrl} t={t} />

        {/* Team */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: hq.color }} />
            {t('globe.team')}
          </h4>
          <div className="pl-6">
            <p className="text-sm text-muted-foreground">{hq.team}</p>
          </div>
        </div>

        {/* Operations */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ color: hq.color }} />
            {t('globe.keyOperations')}
          </h4>
          <div className="pl-6 space-y-1">
            {hq.operations.map((op, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: hq.color }} />
                <span className="text-muted-foreground">{op}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface FloatingGlobeProps {
  showControls?: boolean;
  showLocationButtons?: boolean;
  showInstructions?: boolean;
  minHeight?: string;
}

export function FloatingGlobe({ 
  showControls = true, 
  showLocationButtons = true,
  showInstructions = true,
  minHeight = '400px'
}: FloatingGlobeProps) {
  const { t } = useTranslation();
  const [selectedHQ, setSelectedHQ] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isNight, setIsNight] = useState(getIsNightTime);
  const [isAutoDayNight, setIsAutoDayNight] = useState(true);
  const [isFlying, setIsFlying] = useState(false);
  const controlsRef = useRef<any>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const markerPositions = useMemo(() => {
    return headquarters.map((hq) => latLongToVector3(hq.lat, hq.lon, 1.52));
  }, []);

  const handleInteractionStart = useCallback(() => {
    setAutoRotate(false);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
  }, []);

  const handleInteractionEnd = useCallback(() => {
    resumeTimeoutRef.current = setTimeout(() => {
      if (selectedHQ === null) {
        setAutoRotate(true);
      }
    }, 2500);
  }, [selectedHQ]);

  const handleSelectHQ = useCallback((index: number | null) => {
    if (index !== null && index !== selectedHQ) {
      setIsFlying(true);
      setAutoRotate(false);
    }
    setSelectedHQ(index);
    if (index === null) {
      resumeTimeoutRef.current = setTimeout(() => {
        setAutoRotate(true);
      }, 800);
    }
  }, [selectedHQ]);

  const handleFlyComplete = useCallback(() => {
    setIsFlying(false);
  }, []);

  const toggleDayNight = useCallback(() => {
    setIsAutoDayNight(false);
    setIsNight((prev) => !prev);
  }, []);

  const zoomBy = useCallback((delta: number) => {
    const controls = controlsRef.current;
    if (!controls) return;

    handleInteractionStart();

    const camera = controls.object as THREE.Camera;
    const target = controls.target.clone();
    const direction = camera.position.clone().sub(target);
    const currentDistance = direction.length();

    const min = typeof controls.minDistance === 'number' ? controls.minDistance : 2.5;
    const max = typeof controls.maxDistance === 'number' ? controls.maxDistance : 8;
    const nextDistance = THREE.MathUtils.clamp(currentDistance + delta, min, max);

    direction.setLength(nextDistance);
    camera.position.copy(target.clone().add(direction));
    controls.update?.();

    setTimeout(handleInteractionEnd, 50);
  }, [handleInteractionEnd, handleInteractionStart]);

  const zoomIn = useCallback(() => {
    zoomBy(-0.6);
  }, [zoomBy]);

  const zoomOut = useCallback(() => {
    zoomBy(0.6);
  }, [zoomBy]);

  // Keep OrbitControls target aligned to the selected marker (more accurate location)
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (selectedHQ !== null && markerPositions[selectedHQ]) {
      controls.target.copy(markerPositions[selectedHQ]);
    } else {
      controls.target.set(0, 0, 0);
    }

    controls.update?.();
  }, [markerPositions, selectedHQ]);

  // Auto day/night (local time) if not manually overridden
  useEffect(() => {
    const id = window.setInterval(() => {
      if (isAutoDayNight) setIsNight(getIsNightTime());
    }, 60_000);
    return () => window.clearInterval(id);
  }, [isAutoDayNight]);

  // External control from Contact page cards
  useEffect(() => {
    const handler = (evt: Event) => {
      const e = evt as CustomEvent<{ index: number }>;
      if (typeof e.detail?.index === 'number') {
        handleSelectHQ(e.detail.index);
      }
    };
    window.addEventListener('globe:selectHQ', handler as EventListener);
    return () => window.removeEventListener('globe:selectHQ', handler as EventListener);
  }, [handleSelectHQ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedHQ !== null) {
      setAutoRotate(false);
    }
  }, [selectedHQ]);

  const ambient = isNight ? 0.18 : 0.28;
  const keyLight = isNight ? 1.1 : 2.2;

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl overflow-hidden" style={{ minHeight }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={ambient} />
        <hemisphereLight intensity={isNight ? 0.25 : 0.35} color={'#ffffff'} groundColor={'#1f2937'} />
        <directionalLight 
          position={isNight ? [-8, -4, -6] : [8, 4, 6]} 
          intensity={keyLight} 
          color={isNight ? "#aabbd6" : "#FFF5E6"}
        />
        <directionalLight 
          position={[-5, -2, -5]} 
          intensity={0.25} 
          color="#4da6ff"
        />

        <color attach="background" args={[isNight ? '#070a18' : '#0a0a1a']} />

        <EarthGlobe 
          selectedHQ={selectedHQ}
          onSelectHQ={showControls ? handleSelectHQ : () => {}}
          isNight={isNight}
          isFlying={isFlying}
          onFlyComplete={handleFlyComplete}
          markerPositions={markerPositions}
        />

        <OrbitControls 
          ref={controlsRef}
          enabled={!isFlying}
          enableZoom={showControls}
          enablePan={false}
          enableRotate={showControls}
          autoRotate={autoRotate && selectedHQ === null && !isFlying}
          autoRotateSpeed={0.5}
          minPolarAngle={0.05}
          maxPolarAngle={Math.PI - 0.05}
          minDistance={2.5}
          maxDistance={8}
          zoomSpeed={1}
          rotateSpeed={1.2}
          dampingFactor={0.08}
          enableDamping
          onStart={handleInteractionStart}
          onEnd={handleInteractionEnd}
        />
      </Canvas>

      {/* Focus buttons - only on full version */}
      {showLocationButtons && (
        <div className="absolute left-2 sm:left-4 top-2 sm:top-4 flex flex-col gap-2 z-10">
          <div className="bg-background/80 backdrop-blur-sm rounded-xl border border-border p-1.5 sm:p-2 shadow-lg">
            <div className="grid grid-cols-2 gap-1 sm:gap-2">
              {headquarters.map((hq, idx) => (
                <button
                  key={hq.name}
                  onClick={() => handleSelectHQ(idx)}
                  className={`px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold border transition-colors text-left ${
                    selectedHQ === idx
                      ? 'bg-primary/15 border-primary/30 text-foreground'
                      : 'bg-background/40 border-border hover:bg-primary/10'
                  }`}
                >
                  {hq.name.split(',')[0]}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (controlsRef.current) {
                  controlsRef.current.reset();
                  controlsRef.current.update?.();
                }
                setAutoRotate(true);
                setSelectedHQ(null);
              }}
              className="mt-1.5 sm:mt-2 w-full px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-semibold border border-border bg-background/40 hover:bg-primary/10 transition-colors"
            >
              {t('globe.backToCenter')}
            </button>
          </div>
        </div>
      )}

      {/* Controls - only on full version */}
      {showControls && (
        <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 sm:gap-2">
          <button
            onClick={toggleDayNight}
            className="p-1.5 sm:p-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border hover:bg-primary/20 hover:border-primary/40 transition-all group"
            title={isNight ? t('globe.dayMode') : t('globe.nightMode')}
          >
            {isNight ? (
              <SunIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 group-hover:text-yellow-300" />
            ) : (
              <Moon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 group-hover:text-blue-300" />
            )}
          </button>

          <button
            onClick={zoomIn}
            className="p-1.5 sm:p-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border hover:bg-primary/20 hover:border-primary/40 transition-all group"
            title={t('globe.zoomIn')}
          >
            <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary" />
          </button>

          <button
            onClick={zoomOut}
            className="p-1.5 sm:p-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border hover:bg-primary/20 hover:border-primary/40 transition-all group"
            title={t('globe.zoomOut')}
          >
            <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary" />
          </button>

          <button
            onClick={() => {
              if (controlsRef.current) {
                controlsRef.current.reset();
                controlsRef.current.update?.();
              }
              setAutoRotate(true);
              setSelectedHQ(null);
            }}
            className="p-1.5 sm:p-2 bg-background/80 backdrop-blur-sm rounded-lg border border-border hover:bg-primary/20 hover:border-primary/40 transition-all group"
            title={t('globe.resetView')}
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary" />
          </button>
        </div>
      )}

      {/* Detail Panel with AnimatePresence for smooth transitions */}
      {showControls && (
        <AnimatePresence mode="wait">
          {selectedHQ !== null && !isFlying && (
            <DetailPanel 
              key={selectedHQ}
              hq={headquarters[selectedHQ]} 
              onClose={() => handleSelectHQ(null)}
              t={t}
            />
          )}
        </AnimatePresence>
      )}

      {/* Instructions */}
      {showInstructions && selectedHQ === null && (
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 text-xs sm:text-sm text-white/70 bg-black/50 backdrop-blur-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-2 sm:gap-3 max-w-[95%] overflow-hidden">
          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${autoRotate ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
          <span className="truncate">{t('globe.clickMarker')}</span>
          <span className="text-white/40 hidden sm:inline">|</span>
          <span className="text-[10px] sm:text-xs text-white/50 hidden sm:inline">{t('globe.dragRotate')}</span>
          <span className="text-white/40 hidden md:inline">|</span>
          <span className="text-[10px] sm:text-xs text-white/50 hidden md:inline">{t('globe.scrollZoom')}</span>
        </div>
      )}

      {/* Flying indicator */}
      {isFlying && selectedHQ !== null && (
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 text-xs sm:text-sm text-white bg-primary/80 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full animate-pulse flex items-center gap-2">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{t('globe.flyingTo')} {headquarters[selectedHQ].name.split(',')[0]}...</span>
        </div>
      )}
    </div>
  );
}
