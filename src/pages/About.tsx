import React, { useState, Suspense, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Float, Sphere } from '@react-three/drei';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import { Target, Eye, Users, Award, Shield, Lightbulb, Globe, MapPin, Linkedin, Mail, Building2, Handshake, Phone, FileCheck, ExternalLink, Calendar, Images, X, ChevronLeft, ChevronRight, FileText, Factory, Star, ArrowRight, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/glass-card';
import { WatermarkImage } from '@/components/ui/watermark-image';
import { Button } from '@/components/ui/button';
import { openExternal } from '@/lib/openExternal';
import factoryBg from '@/assets/hero/factory-background.jpg';
import { ParticleField } from '@/components/3d/ParticleField';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Import team images
import ericsonPiccoliImg from '@/assets/team/ericson-piccoli.png';
import xuShiheImg from '@/assets/team/xu-shihe.png';
import topsPartnershipImg from '@/assets/team/tops-partnership.jpg';
import factoryImg from '@/assets/team/factory.jpg';
import factoryVisitImg from '@/assets/team/factory-visit.jpg';

// Import OTR images for gallery
import otrProcessingAreaImg from '@/assets/otr/otr-processing-area.jpg';
import otrPartnershipImg from '@/assets/otr/otr-tire-partnership.jpg';
import redShredderImg from '@/assets/otr/red-shredder-operation.jpg';
import shreddingLineImg from '@/assets/otr/shredding-line-interior.jpg';
import topsFactoryOverviewImg from '@/assets/otr/tops-factory-overview.jpg';
import beadRingsStackedImg from '@/assets/otr/bead-rings-stacked.jpg';

// Import gallery images
import partnershipTeamImg from '@/assets/gallery/partnership-team.jpg';
import productionBagsImg from '@/assets/gallery/production-bags.jpg';
import topsRecyclingTeamImg from '@/assets/gallery/tops-recycling-team.jpg';
import partnershipHandshakeImg from '@/assets/gallery/partnership-handshake.jpg';

// Sun Glow Component
function SunGlow() {
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (glowRef.current) {
      // Pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={[4, 2, 3]}>
      {/* Sun core - bright white/yellow */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#fffaf0" />
      </mesh>
      
      {/* Inner glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#ffdd44" transparent opacity={0.6} />
      </mesh>
      
      {/* Outer glow layer 1 */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} />
      </mesh>
      
      {/* Outer glow layer 2 */}
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.15} />
      </mesh>
      
      {/* Lens flare effect - horizontal streak */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[4, 0.08]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Lens flare effect - vertical streak */}
      <mesh rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[3, 0.05]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// 3D Globe Component for Headquarters with Earth texture and space background
function Globe3D({ withStars = false, withSun = false }: { withStars?: boolean; withSun?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const earthTexture = useLoader(TextureLoader, '/textures/earth.jpg');

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <>
      {/* Stars background */}
      {withStars && (
        <mesh>
          <sphereGeometry args={[50, 64, 64]} />
          <meshBasicMaterial color="#000011" side={THREE.BackSide} />
        </mesh>
      )}
      
      {/* Star particles */}
      {withStars && Array.from({ length: 200 }).map((_, i) => {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 15 + Math.random() * 30;
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.02 + Math.random() * 0.03, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        );
      })}
      
      {/* Sun with glow effect */}
      {withSun && <SunGlow />}
      
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <group>
          {/* Earth sphere with real texture */}
          <Sphere ref={meshRef} args={[1.3, 64, 64]}>
            <meshStandardMaterial
              map={earthTexture}
              roughness={0.6}
              metalness={0.1}
            />
          </Sphere>
          
          {/* Atmosphere glow - outer bright rim */}
          <Sphere args={[1.38, 64, 64]}>
            <meshBasicMaterial
              color="#88ccff"
              transparent
              opacity={0.15}
              side={THREE.BackSide}
            />
          </Sphere>
          
          {/* Inner atmosphere */}
          <Sphere args={[1.33, 64, 64]}>
            <meshBasicMaterial
              color="#4da6ff"
              transparent
              opacity={0.08}
              side={THREE.BackSide}
            />
          </Sphere>
          
          {/* Sunlit edge glow - simulates light hitting atmosphere */}
          {withSun && (
            <mesh position={[0.8, 0.4, 0.6]}>
              <sphereGeometry args={[1.4, 64, 64]} />
              <meshBasicMaterial
                color="#ffeecc"
                transparent
                opacity={0.08}
                side={THREE.BackSide}
              />
            </mesh>
          )}
          
          {/* Location markers with glow */}
          {/* Italy - Valenza (green) */}
          <mesh position={[0.6, 0.75, 0.85]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          <mesh position={[0.6, 0.75, 0.85]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.4} />
          </mesh>
          
          {/* Brazil - Medianeira (yellow) */}
          <mesh position={[-0.75, -0.35, 0.95]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
          <mesh position={[-0.75, -0.35, 0.95]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#eab308" transparent opacity={0.4} />
          </mesh>
          
          {/* Germany - Frankfurt (red) */}
          <mesh position={[0.45, 0.85, 0.75]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0.45, 0.85, 0.75]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
          </mesh>
          
          {/* China - Zhangjiagang (orange) */}
          <mesh position={[1.0, 0.5, -0.6]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          <mesh position={[1.0, 0.5, -0.6]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.4} />
          </mesh>
        </group>
      </Float>
    </>
  );
}


// Gallery images with i18n keys - using about.galleryItems which exists in pt.json
const getGalleryImages = (t: (key: string) => string) => [
  { src: topsFactoryOverviewImg, key: 'topsFactory' },
  { src: redShredderImg, key: 'otrShredder' },
  { src: otrProcessingAreaImg, key: 'otrProcessing' },
  { src: shreddingLineImg, key: 'shreddingLine' },
  { src: beadRingsStackedImg, key: 'beadRings' },
  { src: otrPartnershipImg, key: 'otrPartnership' },
  { src: topsRecyclingTeamImg, key: 'topsTeam' },
  { src: partnershipHandshakeImg, key: 'partnershipAgreement' },
].map(item => ({
  src: item.src,
  // Keys match about.galleryItems in pt.json
  title: t(`about.galleryItems.${item.key}.title`),
  description: t(`about.galleryItems.${item.key}.description`),
}));

// Certificates with i18n keys - using about.certificates which exists in pt.json
const getCertificates = (t: (key: string) => string) => [
  { key: 'class1', file: '/certificates/certificado-classe-1.pdf' },
  { key: 'class7', file: '/certificates/certificado-classe-7.pdf' },
  { key: 'class35', file: '/certificates/certificado-classe-35.pdf' },
  { key: 'class40', file: '/certificates/certificado-classe-40.pdf' },
  { key: 'class40_1', file: '/certificates/certificado-classe-40-1.pdf' },
  { key: 'class42', file: '/certificates/certificado-classe-42.pdf' },
].map(item => ({
  // Keys match about.certificates in pt.json
  name: t(`about.certificates.${item.key}.name`),
  file: item.file,
  description: t(`about.certificates.${item.key}.description`),
}));

const values = [
  { key: 'innovation', icon: Lightbulb, color: 'from-secondary to-primary' },
  { key: 'sustainability', icon: Globe, color: 'from-primary to-secondary' },
  { key: 'transparency', icon: Eye, color: 'from-elp-teal to-cyan-400' },
  { key: 'excellence', icon: Award, color: 'from-secondary to-primary' },
];

// Leadership team with i18n
const getLeadershipTeam = (t: (key: string) => string) => [
  {
    name: 'Ericson Piccoli',
    role: t('about.leadershipBios.ericson.role'),
    location: t('about.leadershipBios.ericson.location'),
    image: ericsonPiccoliImg,
    bio: t('about.leadershipBios.ericson.bio'),
    email: 'info@elpgreen.com',
    linkedin: 'https://www.linkedin.com/company/elpgreen',
    phone: '+39 350 102 1359',
    passport: 'FV769007',
  },
  {
    name: 'Xu Shihe (许世和)',
    role: t('about.leadershipBios.xuShihe.role'),
    location: t('about.leadershipBios.xuShihe.location'),
    image: xuShiheImg,
    bio: t('about.leadershipBios.xuShihe.bio'),
    email: 'info@topsindustry.com',
    phone: '+86 159 6237 8058',
    company: 'TOPS RECYCLING',
    companyUrl: 'https://www.topsrecycling.com',
    businessLicense: '91320582565255473X',
    passport: 'E99066912',
  },
];

// Global Headquarters with i18n
const getHeadquarters = (t: (key: string) => string) => [
  {
    key: 'italy',
    color: 'from-green-500 to-red-500',
    icon: Building2,
    flagColors: ['#009246', '#FFFFFF', '#CE2B37'],
  },
  {
    key: 'brazil',
    color: 'from-green-500 to-yellow-500',
    icon: Factory,
    flagColors: ['#009C3B', '#FFDF00'],
  },
  {
    key: 'germany',
    color: 'from-gray-800 to-red-500',
    icon: Building2,
    flagColors: ['#000000', '#DD0000', '#FFCE00'],
  },
  {
    key: 'china',
    color: 'from-red-500 to-yellow-500',
    icon: Factory,
    flagColors: ['#DE2910', '#FFDE00'],
  },
].map(hq => ({
  country: t(`about.offices.${hq.key}.country`),
  city: t(`about.offices.${hq.key}.city`),
  role: t(`about.offices.${hq.key}.role`),
  description: t(`about.offices.${hq.key}.description`),
  phone: t(`about.offices.${hq.key}.phone`) !== `about.offices.${hq.key}.phone` ? t(`about.offices.${hq.key}.phone`) : undefined,
  color: hq.color,
  icon: hq.icon,
  flagColors: hq.flagColors,
}));

// Trademark registrations with i18n
const getTrademarks = (t: (key: string) => string) => [
  { key: 'class1', process: '927739089' },
  { key: 'class7', process: '927738945' },
  { key: 'class35', process: '927738996' },
  { key: 'class40', process: '927739038' },
  { key: 'class42', process: '927739054' },
].map(tm => ({
  class: t(`about.trademarkClasses.${tm.key}.class`),
  process: tm.process,
  description: t(`about.trademarkClasses.${tm.key}.description`),
  details: t(`about.trademarkClasses.${tm.key}.details`),
}));

export default function About() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<{ name: string; file: string; description: string } | null>(null);

  // Get translated data
  const galleryImages = getGalleryImages(t);
  const certificates = getCertificates(t);
  const leadershipTeam = getLeadershipTeam(t);
  const headquarters = getHeadquarters(t);
  const trademarks = getTrademarks(t);

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => setSelectedImage((prev) => (prev !== null ? (prev + 1) % galleryImages.length : 0));
  const prevImage = () => setSelectedImage((prev) => (prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : 0));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Background image + overlays (same style as Index hero) */}
        <div className="absolute inset-0">
          <img
            src={factoryBg}
            alt={t('about.title')}
            className="w-full h-[120%] object-cover"
            loading="lazy"
          />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-900/90" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80" />
        </div>

        {/* Particle overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <ParticleField />
        </div>
        
        {/* 3D Globe Background with Space */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-50 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-primary/50 rounded-full" />
          <Canvas 
            camera={{ position: [0, 0, 4], fov: 50 }}
            style={{ background: 'transparent' }}
          >
            <directionalLight position={[10, 5, 8]} intensity={2} color="#fff5e6" />
            <ambientLight intensity={0.2} color="#4466aa" />
            <Suspense fallback={null}>
              <Globe3D />
            </Suspense>
          </Canvas>
        </div>

        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-full px-5 py-2.5 mb-6 shadow-lg"
            >
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
              <span className="text-white text-sm font-semibold">{t('about.heroSubtitle')}</span>
            </motion.div>
            
            <h1 className="text-white mb-6 drop-shadow-2xl text-5xl md:text-6xl font-bold leading-tight">
              {t('about.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl font-light">
              {t('about.heroSubtitle')} 
            </p>
            <p className="text-lg text-white font-semibold mt-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-secondary" />
              {t('about.noSellEquipment')}
            </p>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-4 mt-8"
            >
              <Button size="lg" variant="elp-white" asChild className="shadow-xl">
                <Link to="/otr-sources">
                  <Handshake className="h-5 w-5 mr-2" />
                  {t('hero.cta.partner')}
                </Link>
              </Button>
              <Button size="lg" variant="elp-white-outline" asChild>
                <Link to="/solutions">
                  <Factory className="h-5 w-5 mr-2" />
                  {t('hero.cta.technology')}
                </Link>
              </Button>
            </motion.div>
            
            {/* Quick headquarters badges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-3 mt-10"
            >
              {headquarters.map((hq, i) => (
                <motion.div
                  key={hq.country}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-4 py-2 hover:bg-white/25 transition-colors"
                >
                  <div className={`w-5 h-4 rounded-sm bg-gradient-to-br ${hq.color}`} />
                  <span className="text-white/95 text-sm font-medium">{hq.city}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
        
        {/* Enhanced decorative gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </section>

      {/* Global Headquarters Section - NEW */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-30" />
        
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
              <Globe className="h-5 w-5 text-primary" />
              <span className="text-primary font-medium">{t('globalPresence.title')}</span>
            </div>
            <h2 className="mb-4">{t('about.headquarters.title')}</h2>
            <div className="section-divider mx-auto mb-6" />
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('about.headquarters.subtitle')}
            </p>
          </motion.div>

          {/* 3D Interactive Globe Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="h-[400px] relative rounded-2xl overflow-hidden"
            >
              {/* Space background container */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#000011] via-[#0a0a1a] to-[#0f0f2a] rounded-2xl" />
              
              <Canvas 
                camera={{ position: [0, 0, 4.5], fov: 45 }}
                style={{ background: 'transparent' }}
              >
                {/* Sun light - bright and warm */}
                <directionalLight position={[10, 5, 8]} intensity={2} color="#fff5e6" castShadow />
                {/* Ambient space light - very dim */}
                <ambientLight intensity={0.15} color="#4466aa" />
                {/* Rim light for atmosphere effect */}
                <pointLight position={[-5, 0, -10]} intensity={0.5} color="#4da6ff" />
                
                <Suspense fallback={null}>
                  <Globe3D withStars withSun />
                </Suspense>
                <OrbitControls 
                  enableZoom={false} 
                  enablePan={false}
                  autoRotate
                  autoRotateSpeed={0.5}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 1.5}
                />
              </Canvas>
              
              {/* Floating labels */}
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-[20%] left-[60%] bg-background/90 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-1.5 shadow-lg"
                >
                  <span className="text-xs font-medium flex items-center gap-1">
                    <span className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(to right, #009246 33%, #FFFFFF 33%, #FFFFFF 66%, #CE2B37 66%)' }} />
                    Valenza
                  </span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute top-[55%] left-[15%] bg-background/90 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-1.5 shadow-lg"
                >
                  <span className="text-xs font-medium flex items-center gap-1">
                    <span className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(135deg, #009C3B 50%, #FFDF00 50%)' }} />
                    Medianeira
                  </span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute top-[25%] left-[35%] bg-background/90 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-1.5 shadow-lg"
                >
                  <span className="text-xs font-medium flex items-center gap-1">
                    <span className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(to bottom, #000000 33%, #DD0000 33%, #DD0000 66%, #FFCE00 66%)' }} />
                    Frankfurt
                  </span>
                </motion.div>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                  className="absolute top-[40%] right-[10%] bg-background/90 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-1.5 shadow-lg"
                >
                  <span className="text-xs font-medium flex items-center gap-1">
                    <span className="w-3 h-2 rounded-sm" style={{ background: 'linear-gradient(135deg, #DE2910 80%, #FFDE00 80%)' }} />
                    Zhangjiagang
                  </span>
                </motion.div>
              </div>
            </motion.div>

            <div className="space-y-4">
              {headquarters.map((hq, index) => (
                <motion.div
                  key={hq.country}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlassCard className="p-5 hover:border-primary/40 transition-all duration-300 group">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${hq.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <hq.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{hq.country}</h3>
                          <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{hq.role}</span>
                        </div>
                        <p className="text-primary font-medium text-sm flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3" />
                          {hq.city}
                        </p>
                        <p className="text-muted-foreground text-sm">{hq.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OTR Focus Section - NEW */}
      <section className="py-16 section-metal text-white border-y border-gold/15">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-4">
              <Factory className="h-5 w-5 text-gold" />
              <span className="text-gold font-medium">{t('aboutPage.otrFocus.badge')}</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">{t('aboutPage.otrFocus.title')}</h2>
            <p className="text-white/70 max-w-3xl mx-auto">
              {t('aboutPage.otrFocus.description')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: t('aboutPage.otrFocus.sizes'), value: t('aboutPage.otrFocus.sizesValue'), desc: t('aboutPage.otrFocus.sizesDesc') },
              { label: t('aboutPage.otrFocus.capacity'), value: t('aboutPage.otrFocus.capacityValue'), desc: t('aboutPage.otrFocus.capacityDesc') },
              { label: t('aboutPage.otrFocus.recovery'), value: t('aboutPage.otrFocus.recoveryValue'), desc: t('aboutPage.otrFocus.recoveryDesc') },
              { label: t('aboutPage.otrFocus.model'), value: t('aboutPage.otrFocus.modelValue'), desc: t('aboutPage.otrFocus.modelDesc') },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 text-center border-primary/20 hover:border-primary/40 transition-colors">
                  <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
                  <p className="font-medium text-foreground">{stat.label}</p>
                  <p className="text-sm text-muted-foreground">{stat.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission with 3D effects */}
      <section className="py-24 brushed-metal-h text-white">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-10 h-full group hover:border-primary/40 transition-all duration-500">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4">{t('aboutPage.vision.title')}</h2>
                <p className="text-white/70 text-lg leading-relaxed">
                  {t('aboutPage.vision.description')}
                </p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-10 h-full group hover:border-primary/40 transition-all duration-500">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4">{t('aboutPage.mission.title')}</h2>
                <p className="text-white/70 text-lg leading-relaxed">
                  {t('aboutPage.mission.description')}
                </p>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values with 3D hover effects */}
      <section className="py-24">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <Star className="h-5 w-5 text-primary" />
              <span className="text-primary font-medium">{t('aboutPage.ourPillars')}</span>
            </div>
            <h2 className="mb-4">{t('about.values.title')}</h2>
            <div className="section-divider mx-auto" />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, rotateY: 5 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <GlassCard className="p-8 text-center h-full group cursor-pointer">
                  <motion.div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <value.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                    {t(`about.values.${value.key}`)}
                  </h3>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-24 metal-deep-blue text-white">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              <Users className="h-5 w-5 text-gold" />
              <span className="text-gold font-medium">{t('about.leadership.title')}</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">{t('about.leadership.title')}</h2>
            <div className="section-divider mx-auto mb-6" />
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {t('about.leadership.subtitle')}
            </p>
          </motion.div>

          {/* Main Leaders */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {leadershipTeam.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
              <GlassCard className="overflow-hidden group hover:border-secondary/40 transition-all duration-500">
                  <div className="h-64 bg-gradient-to-br from-primary/20 via-muted to-secondary/10 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-20" />
                    <motion.div 
                      className="w-48 h-48 rounded-full overflow-hidden border-4 border-secondary/30 shadow-2xl relative z-10"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-contain bg-white"
                      />
                    </motion.div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-2xl mb-1">{member.name}</h3>
                        <p className="text-primary font-semibold">{member.role}</p>
                      </div>
                      {member.company && (
                        <a
                          href={member.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-secondary flex items-center gap-1 transition-colors"
                        >
                          <Building2 className="h-4 w-4" />
                          {member.company}
                        </a>
                      )}
                    </div>
                    <p className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                      <MapPin className="h-4 w-4 text-secondary" />
                      {member.location}
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {member.bio}
                    </p>
                    
                    {/* Contact Details */}
                    <div className="space-y-2 text-sm mb-4">
                      {member.phone && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 text-secondary" />
                          {member.phone}
                        </p>
                      )}
                      {member.businessLicense && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <FileCheck className="h-4 w-4 text-secondary" />
                          <span>License: {member.businessLicense}</span>
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 pt-4 border-t border-border">
                      <a
                        href={`mailto:${member.email}`}
                        className="text-muted-foreground hover:text-secondary transition-colors flex items-center gap-1"
                      >
                        <Mail className="h-5 w-5" />
                        <span className="text-xs">{member.email}</span>
                      </a>
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-secondary transition-colors"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Partnership Highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GlassCard className="p-8 border-secondary/30">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                      <Handshake className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">{t('about.leadership.partnership')}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4 text-secondary" />
                    <span>{t('about.leadership.partnershipDate')}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    A ELP Green Technology firmou parceria oficial com a <strong>TOPS RECYCLING ZHANGJIAGANG SHILONG MACHINERY CO. LTD</strong>, 
                    líder chinesa em equipamentos de reciclagem e processamento industrial. O Sr. Xu Shihe atua como 
                    <strong> Foreign Business Intermediary Agent</strong> para negócios internacionais, garantindo 
                    acesso à manufatura de classe mundial e inovação contínua em nossas soluções de pirólise.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="https://www.topsrecycling.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-secondary hover:underline font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      www.topsrecycling.com
                    </a>
                    <a
                      href="https://www.topsindustry.com/about-us/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                      <Building2 className="h-4 w-4" />
                      Tops Industry
                    </a>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden shadow-2xl border border-secondary/20">
                  <img
                    src={topsPartnershipImg}
                    alt="Equipe ELP Green Technology e TOPS Recycling em Zhangjiagang, China"
                    className="w-full h-72 md:h-80 object-cover"
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Trademark Registrations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">{t('about.leadership.trademarks')}</h3>
              <p className="text-muted-foreground">
                {t('about.leadership.trademarksDesc')}
              </p>
              <p className="text-sm text-secondary font-medium mt-2">
                {t('about.leadership.validity')}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trademarks.map((tm, index) => (
                <motion.div
                  key={tm.class}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="p-5 hover:border-secondary/40 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">
                        {tm.class}
                      </span>
                      <span className="text-xs text-muted-foreground">Nº {tm.process}</span>
                    </div>
                    <h4 className="font-semibold mb-1">{tm.description}</h4>
                    <p className="text-xs text-muted-foreground">{tm.details}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-6">
              <a 
                href="/certificates/certificado-classe-1.pdf" 
                target="_blank"
                className="text-secondary hover:underline text-sm inline-flex items-center gap-2"
              >
                <FileCheck className="h-4 w-4" />
                {t('about.leadership.viewCertificates')}
              </a>
            </div>
          </motion.div>

          {/* Factory Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h3 className="text-xl font-bold text-center mb-8">{t('about.factories')}</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <GlassCard className="overflow-hidden group">
                <img
                  src={factoryImg}
                  alt={t('about.factoryLine')}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {t('about.factoryLine')}
                  </p>
                </div>
              </GlassCard>
              <GlassCard className="overflow-hidden group">
                <img
                  src={factoryVisitImg}
                  alt={t('about.factoryVisit')}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {t('about.factoryVisit')}
                  </p>
                </div>
              </GlassCard>
            </div>
            <p className="text-center text-muted-foreground mt-6 max-w-2xl mx-auto">
              {t('about.factoryDesc')}
            </p>
          </motion.div>

          {/* About Company */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <GlassCard className="p-8 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="text-center max-w-4xl mx-auto">
                <blockquote className="text-2xl font-medium text-foreground mb-6 italic">
                  "{t('about.quote')}"
                </blockquote>
                <div className="section-divider mx-auto mb-6" />
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t('about.companyDesc1')}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {t('about.companyDesc2')}
                </p>
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  <a
                    href="https://www.elpgreen.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-secondary hover:underline font-medium"
                  >
                    <Globe className="h-4 w-4" />
                    www.elpgreen.com
                  </a>
                  <a
                    href="https://www.youtube.com/@elpgreen/videos"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      openExternal('https://www.youtube.com/@elpgreen/videos');
                    }}
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    YouTube
                  </a>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Governance */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-background" />
        <div className="container-wide relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-primary font-medium">{t('about.governance.title')}</span>
              </div>
              <h2 className="mb-6">{t('about.governance.title')}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {t('about.governance.description')}
              </p>
              <ul className="space-y-3">
                {(t('about.governance.items', { returnObjects: true }) as string[]).map((item: string, i: number) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-secondary" />
                    </div>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-10 bg-gradient-to-br from-primary to-secondary text-white border-secondary/30">
                <Users className="h-12 w-12 mb-6 text-white" />
                <h3 className="text-2xl font-bold mb-4">{t('about.governance.internationalBoard')}</h3>
                <p className="text-white/90 leading-relaxed">
                  {t('about.governance.boardDesc')}
                </p>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* OTR Partnership CTA - Enhanced */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border-y border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-5" />
        <div className="container-wide relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/30 rounded-full px-4 py-2 mb-4">
                <Handshake className="h-5 w-5 text-secondary" />
                <span className="text-secondary font-medium">{t('about.leadership.partnership')}</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">{t('globalExpansion.partnership.title')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('about.partnershipDesc')}
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  t('globalExpansion.partnership.jointVentures'),
                  t('aboutPage.noSellEquipment'),
                  t('globalExpansion.partnership.smartLineTech'),
                  t('about.leadership.partnership'),
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-secondary" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-8 border-secondary/30 bg-gradient-to-br from-background to-muted/50">
                <h3 className="text-xl font-bold mb-4">{t('smartOtr.indicateSource')}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {t('indexPage.ctaSection.description')}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <Mail className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-sm font-medium">{t('contact.email')}</p>
                      <a href="mailto:info@elpgreen.com" className="text-secondary hover:text-secondary/80">
                        info@elpgreen.com
                      </a>
                    </div>
                  </div>
                  <Button 
                    size="lg" 
                    variant="elp-solid"
                    className="w-full"
                    asChild
                  >
                    <Link to="/otr-sources">
                      <Handshake className="h-5 w-5 mr-2" />
                      {t('hero.cta.partner')}
                    </Link>
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {t('footer.contactAfterReview')}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Photo Gallery - Enhanced */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-30" />
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/30 rounded-full px-4 py-2 mb-6">
              <Images className="h-5 w-5 text-secondary" />
              <span className="text-secondary font-medium">{t('about.gallery')}</span>
            </div>
            <h2 className="mb-4">{t('aboutPage.gallery.title')}</h2>
            <div className="section-divider mx-auto mb-6" />
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('about.gallerySubtitle')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group cursor-pointer relative rounded-xl overflow-hidden aspect-[4/3] shadow-lg border border-transparent hover:border-secondary/30 transition-all duration-300"
                onClick={() => openLightbox(index)}
              >
                <WatermarkImage
                  src={image.src}
                  alt={image.title}
                  className="group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h4 className="text-white font-semibold text-sm">{image.title}</h4>
                    <p className="text-white/70 text-xs">{image.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificates Section - Enhanced */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/30" />
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-primary font-medium">{t('about.documents.title')}</span>
            </div>
            <h2 className="mb-4">{t('about.leadership.trademarks')}</h2>
            <div className="section-divider mx-auto mb-6" />
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('about.documents.subtitle')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <GlassCard 
                  className="p-6 cursor-pointer group hover:border-secondary/40"
                  onClick={() => setSelectedPdf(cert)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                      <FileCheck className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">{cert.name}</h3>
                      <p className="text-sm text-muted-foreground">{cert.description}</p>
                      <p className="text-xs text-secondary mt-2 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {t('certificates.clickToView')}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-8">
            {t('about.leadership.validity')} | {t('certificates.holder')}: Ericson Rodrigues Piccoli
          </p>
        </div>
      </section>

      {/* Lightbox for Gallery */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
              onClick={closeLightbox}
            >
              <X className="h-8 w-8" />
            </button>
            
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-white/10 rounded-full"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-white/10 rounded-full"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-5xl max-h-[85vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-full max-h-[80vh] rounded-lg overflow-hidden">
                <WatermarkImage
                  src={galleryImages[selectedImage].src}
                  alt={galleryImages[selectedImage].title}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                <h3 className="text-white text-xl font-bold">{galleryImages[selectedImage].title}</h3>
                <p className="text-white/80">{galleryImages[selectedImage].description}</p>
                <p className="text-white/50 text-sm mt-2">{selectedImage + 1} / {galleryImages.length}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!selectedPdf} onOpenChange={() => setSelectedPdf(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-secondary" />
              {selectedPdf?.name} - {selectedPdf?.description}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/50 overflow-auto">
            {selectedPdf && (
              <div className="p-6">
                {/* Certificate Info Card */}
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-8 text-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                    <FileCheck className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{selectedPdf.name}</h3>
                  <p className="text-lg text-primary font-medium mb-4">{selectedPdf.description}</p>
                  <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full mb-6">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Registro Ativo</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Titular</p>
                    <p className="font-semibold">Ericson Rodrigues Piccoli</p>
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Vigência</p>
                    <p className="font-semibold">07/11/2023 - 07/11/2033</p>
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Órgão Emissor</p>
                    <p className="font-semibold">INPI - Brasil</p>
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <p className="font-semibold text-green-600">Ativo e Válido</p>
                  </div>
                </div>

                {/* Open PDF Button */}
                <div className="text-center">
                  <Button
                    onClick={() => window.open(selectedPdf.file, '_blank')}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Certificado PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="p-3 border-t flex-shrink-0 bg-card">
            <p className="text-xs text-muted-foreground text-center">
              Documento oficial do INPI - Instituto Nacional da Propriedade Industrial do Brasil
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
