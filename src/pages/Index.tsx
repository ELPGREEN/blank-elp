import { Suspense, lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Leaf, Factory, Globe, Recycle, Shield, Award, FileCheck, Building2, Handshake, Target, BarChart3, Mountain, Calendar, Newspaper, Bot, MapPin, Phone, X, Users, TrendingUp, Briefcase, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/glass-card';
import { SEO } from '@/components/SEO';
import { useParallax } from '@/hooks/useParallax';
import { supabase } from '@/integrations/supabase/client';
import factoryBg from '@/assets/hero/factory-background.jpg';

// Lazy load 3D components for performance
const ParticleField = lazy(() => import('@/components/3d/ParticleField').then(m => ({
  default: m.ParticleField
})));
interface Article {
  id: string;
  slug: string;
  title_pt: string;
  title_en: string;
  title_es: string;
  title_zh: string;
  excerpt_pt: string;
  excerpt_en: string;
  excerpt_es: string;
  excerpt_zh: string;
  category: string;
  image_url: string | null;
  published_at: string | null;
}

// Global Presence regions - translated dynamically
const getGlobalPresence = (t: (key: string) => string) => [{
  regionKey: 'europe',
  region: t('indexPage.globalPresence.europe.region') || t('globalPresence.europe.title'),
  locations: [{
    city: t('globalPresence.europe.city'),
    role: t('globalPresence.europe.focus')
  }, {
    city: t('globalPresence.germany.city'),
    role: t('globalPresence.germany.focus')
  }],
  icon: Building2
}, {
  regionKey: 'southAmerica',
  region: t('indexPage.globalPresence.southAmerica.region') || t('globalPresence.latam.title'),
  locations: [{
    city: t('globalPresence.latam.city'),
    role: t('globalPresence.latam.focus')
  }],
  focus: t('globalPresence.latam.miningFocus'),
  icon: Mountain
}, {
  regionKey: 'asia',
  region: t('indexPage.globalPresence.asia.region') || t('globalPresence.asia.title'),
  locations: [{
    city: t('globalPresence.asia.city'),
    role: t('globalPresence.asia.focus')
  }],
  icon: Factory
}, {
  regionKey: 'oceania',
  region: t('indexPage.globalPresence.oceania.region') || t('globalPresence.oceania.title'),
  locations: [{
    city: t('globalPresence.oceania.city'),
    role: t('globalPresence.oceania.focus')
  }],
  highlight: true,
  icon: Globe
}];

// Certifications - translated dynamically
const getCertifications = (t: (key: string) => string) => [{
  class: '1',
  desc: t('indexPage.certifications.class1')
}, {
  class: '7',
  desc: t('indexPage.certifications.class7')
}, {
  class: '35',
  desc: t('indexPage.certifications.class35')
}, {
  class: '40',
  desc: t('indexPage.certifications.class40')
}, {
  class: '42',
  desc: t('indexPage.certifications.class42')
}];
export default function Index() {
  const {
    t,
    i18n
  } = useTranslation();
  const lang = i18n.language as 'pt' | 'en' | 'es' | 'zh';
  const [showTopBanner, setShowTopBanner] = useState(true);

  // Parallax effect
  const parallaxOffset = useParallax(0.3);

  // Fetch articles from database
  const {
    data: articles = [],
    isLoading: articlesLoading
  } = useQuery({
    queryKey: ['index-articles'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('articles').select('id, slug, title_pt, title_en, title_es, title_zh, excerpt_pt, excerpt_en, excerpt_es, excerpt_zh, category, image_url, published_at').eq('is_published', true).order('published_at', {
        ascending: false
      }).limit(3);
      if (error) throw error;
      return data as Article[];
    }
  });

  // Helper to get localized field
  const getLocalizedTitle = (item: Article) => {
    const key = `title_${lang}` as keyof typeof item;
    return item[key] as string || item.title_pt;
  };
  const getLocalizedExcerpt = (item: Article) => {
    const key = `excerpt_${lang}` as keyof typeof item;
    return item[key] as string || item.excerpt_pt;
  };
  return <div className="min-h-screen bg-background overflow-hidden">
      <SEO title="OTR Tire Recycling Partnership | ELP Green Technology – Brazil/Italy/Australia" description="Global partnership for OTR tire recycling. We invest directly in overseas plants. Looking for OTR tire sources from mining companies, dealers, and ports in Brazil, Italy, and Australia." />

      <Header />

      {/* Hero Section - Partnership Focus */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Factory Background Image with Parallax */}
        <div className="absolute inset-0" style={{
        transform: `translateY(${parallaxOffset}px)`
      }}>
          <img src={factoryBg} alt="ELP Green Technology Expanded Factory" className="w-full h-[120%] object-cover" />
          {/* Enhanced overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-900/90" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80" />
        </div>

        {/* 3D Particle Background */}
        <Suspense fallback={null}>
          <ParticleField />
        </Suspense>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            {/* Badge with staggered animation */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: 0.1
          }} className="inline-flex items-center gap-2 bg-primary/30 backdrop-blur-md rounded-full px-4 py-2 mb-6 border border-primary/40 shadow-lg">
              <Handshake className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary-foreground">{t('hero.badge')}</span>
            </motion.div>
            
            {/* Title with staggered animation */}
            <motion.h1 initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.7,
            delay: 0.2
          }} className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {t('hero.title')}
            </motion.h1>
            
            {/* Subtitle with staggered animation */}
            <motion.p initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.7,
            delay: 0.35
          }} className="text-lg md:text-xl text-white mb-6 max-w-3xl leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              {t('hero.subtitle')} <strong className="font-bold text-primary-foreground">{t('hero.noSellMachines')}</strong> – {t('hero.investDirectly')}
            </motion.p>
            
            {/* CTA Buttons with staggered animation */}
            <motion.div initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.7,
            delay: 0.65
          }} className="flex flex-wrap gap-4 mb-8">
              <Button asChild size="lg" variant="elp-white">
                <Link to="/otr-sources">
                  {t('hero.cta.partner')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="elp-white-outline">
                <Link to="/partnership/otr">{t('hero.cta.learnPartnership')}</Link>
              </Button>
            </motion.div>

            {/* Top Banner - Now inside Hero Section */}
            <AnimatePresence>
              {showTopBanner && <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0,
              y: -20
            }} className="brushed-metal text-white rounded-xl overflow-hidden max-w-2xl shadow-2xl">
                  <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Mountain className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm md:text-base font-medium">
                        {t('topBanner.lookingFor')}
                        <Link to="/otr-sources" className="underline font-bold ml-1 hover:text-white/90">
                          {t('topBanner.indicateHere')}
                        </Link>
                      </p>
                    </div>
                    <button onClick={() => setShowTopBanner(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Smart OTR Line Section - Translated */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6
          }}>
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-primary text-sm font-medium">{t('smartOtr.badge')}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2">
                  <Factory className="h-4 w-4 text-secondary" />
                  <span className="text-secondary text-sm font-medium">{t('smartOtr.poweredByTops', 'Technology by TOPS Recycling')}</span>
                </div>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t('smartOtr.title')}
              </h2>
              
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                {t('smartOtr.description')} <strong className="text-primary">{t('smartOtr.demoLocation')}</strong>. {t('smartOtr.globalGoal')}
              </p>

              {/* TOPS Technology Credit */}
              <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 mb-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-secondary">{t('smartOtr.topsCredit', 'TOPS Recycling Group:')}</strong>{' '}
                  {t('smartOtr.topsCreditDesc', 'All Smart Line equipment is designed and manufactured by our strategic technology partner TOPS, with 15+ years of experience in tire recycling solutions across 60+ countries.')}
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
                <p className="text-primary font-medium">
                  <strong>{t('smartOtr.disclaimer')}</strong> – {t('smartOtr.disclaimerDesc')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <motion.div initial={{
                opacity: 0,
                x: -20
              }} whileInView={{
                opacity: 1,
                x: 0
              }} viewport={{
                once: true
              }} transition={{
                delay: 0.1
              }} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">{t('smartOtr.features.autoPosition')}</span>
                </motion.div>
                <motion.div initial={{
                opacity: 0,
                x: -20
              }} whileInView={{
                opacity: 1,
                x: 0
              }} viewport={{
                once: true
              }} transition={{
                delay: 0.2
              }} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">{t('smartOtr.features.roboticCutting')}</span>
                </motion.div>
                <motion.div initial={{
                opacity: 0,
                x: -20
              }} whileInView={{
                opacity: 1,
                x: 0
              }} viewport={{
                once: true
              }} transition={{
                delay: 0.3
              }} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">{t('smartOtr.features.tonsPerPlant')}</span>
                </motion.div>
                <motion.div initial={{
                opacity: 0,
                x: -20
              }} whileInView={{
                opacity: 1,
                x: 0
              }} viewport={{
                once: true
              }} transition={{
                delay: 0.4
              }} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">{t('smartOtr.features.globalCapacity')}</span>
                </motion.div>
              </div>

              <Button asChild size="lg" variant="elp-solid">
                <Link to="/otr-sources">
                  {t('smartOtr.indicateSource')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.6,
            delay: 0.2
          }}>
              <GlassCard className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <h3 className="text-xl font-bold mb-6">{t('smartOtr.roadmapTitle')}</h3>
                
                <div className="space-y-4">
                  <motion.div initial={{
                  opacity: 0,
                  y: 10
                }} whileInView={{
                  opacity: 1,
                  y: 0
                }} viewport={{
                  once: true
                }} transition={{
                  delay: 0.1
                }} className="flex items-center gap-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-bold text-primary">2025</p>
                      <p className="text-sm text-muted-foreground">{t('smartOtr.roadmap.2025')}</p>
                    </div>
                  </motion.div>
                  <motion.div initial={{
                  opacity: 0,
                  y: 10
                }} whileInView={{
                  opacity: 1,
                  y: 0
                }} viewport={{
                  once: true
                }} transition={{
                  delay: 0.2
                }} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-bold">2026</p>
                      <p className="text-sm text-muted-foreground">{t('smartOtr.roadmap.2026')}</p>
                    </div>
                  </motion.div>
                  <motion.div initial={{
                  opacity: 0,
                  y: 10
                }} whileInView={{
                  opacity: 1,
                  y: 0
                }} viewport={{
                  once: true
                }} transition={{
                  delay: 0.3
                }} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-bold">2027</p>
                      <p className="text-sm text-muted-foreground">{t('smartOtr.roadmap.2027')}</p>
                    </div>
                  </motion.div>
                  <motion.div initial={{
                  opacity: 0,
                  y: 10
                }} whileInView={{
                  opacity: 1,
                  y: 0
                }} viewport={{
                  once: true
                }} transition={{
                  delay: 0.4
                }} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-bold">2028-2030</p>
                      <p className="text-sm text-muted-foreground">{t('smartOtr.roadmap.2030')}</p>
                    </div>
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Global Presence Section - Translated */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">{t('globalPresence.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('globalPresence.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('globalPresence.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {getGlobalPresence(t).map((region, index) => <motion.div key={region.regionKey} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.15,
            duration: 0.5
          }}>
                <GlassCard className={`h-full p-6 ${region.highlight ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}>
                  <div className={`w-12 h-12 rounded-xl ${region.highlight ? 'bg-primary' : 'bg-primary/10'} flex items-center justify-center mb-4`}>
                    <region.icon className={`h-6 w-6 ${region.highlight ? 'text-white' : 'text-primary'}`} />
                  </div>
                  <h3 className="font-bold text-lg mb-3">{region.region}</h3>
                  <div className="space-y-2">
                    {region.locations.map(loc => <div key={loc.city} className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{loc.city}</p>
                          <p className="text-xs text-muted-foreground">{loc.role}</p>
                        </div>
                      </div>)}
                  </div>
                  {region.focus && <div className="mt-3 inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                      <Mountain className="h-3 w-3" />
                      {region.focus}
                    </div>}
                </GlassCard>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Partnership Model Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
                <Handshake className="w-4 h-4 text-primary" />
                <span className="text-primary text-sm font-medium">{t('indexPage.partnershipModel.badge')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('indexPage.partnershipModel.title')}</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('indexPage.partnershipModel.description')}
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full btn-metal-blue text-white flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <p className="font-medium">{t('indexPage.partnershipModel.step1.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('indexPage.partnershipModel.step1.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full btn-metal-blue text-white flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <p className="font-medium">{t('indexPage.partnershipModel.step2.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('indexPage.partnershipModel.step2.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full btn-metal-blue text-white flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <p className="font-medium">{t('indexPage.partnershipModel.step3.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('indexPage.partnershipModel.step3.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full btn-metal-blue text-white flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <p className="font-medium">{t('indexPage.partnershipModel.step4.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('indexPage.partnershipModel.step4.desc')}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button asChild variant="elp-solid">
                  <Link to="/otr-sources">
                    {t('indexPage.partnershipModel.indicateSource')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/partnership/otr">
                    {t('indexPage.partnershipModel.fullDetails')}
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-5 text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">+60</p>
                  <p className="text-xs text-muted-foreground">{t('indexPage.partnershipModel.stats.partnerCountries')}</p>
                </GlassCard>
                <GlassCard className="p-5 text-center">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">1M</p>
                  <p className="text-xs text-muted-foreground">{t('indexPage.partnershipModel.stats.tonsYearGoal')}</p>
                </GlassCard>
                <GlassCard className="p-5 text-center">
                  <Factory className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">17-18</p>
                  <p className="text-xs text-muted-foreground">{t('indexPage.partnershipModel.stats.factoriesBy2030')}</p>
                </GlassCard>
                <GlassCard className="p-5 text-center">
                  <Briefcase className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">$0</p>
                  <p className="text-xs text-muted-foreground">{t('indexPage.partnershipModel.stats.yourInvestment')}</p>
                </GlassCard>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ESG & Certifications Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* ESG Card */}
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <GlassCard className="p-8 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Leaf className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t('indexPage.esgSection.title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('indexPage.esgSection.subtitle')}</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {t('indexPage.esgSection.description')}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{t('indexPage.esgSection.netZero')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Recycle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{t('indexPage.esgSection.zeroWaste')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{t('indexPage.esgSection.bCorp')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{t('indexPage.esgSection.euTaxonomy')}</span>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full border-green-500/30 text-green-600 hover:bg-green-500/10">
                  <Link to="/esg">
                    {t('indexPage.esgSection.learnMore')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </GlassCard>
            </motion.div>

            {/* Investors Card */}
            <motion.div initial={{
            opacity: 0,
            x: 30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <GlassCard className="p-8 border-primary/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t('indexPage.investorsSection.title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('indexPage.investorsSection.subtitle')}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {t('indexPage.investorsSection.description')}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {getCertifications(t).map(cert => <div key={cert.class} className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
                      <FileCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t('indexPage.investorsSection.class')} {cert.class}</span>
                    </div>)}
                </div>

                <div className="flex gap-3">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/investors">
                      {t('indexPage.investorsSection.dataRoom')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/certificates">
                      {t('indexPage.investorsSection.certificates')}
                    </Link>
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Newspaper className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">{t('indexPage.news.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('indexPage.news.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('indexPage.news.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {articlesLoading ? Array.from({
            length: 3
          }).map((_, index) => <div key={index} className="animate-pulse">
                  <div className="aspect-video bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded w-20 mb-2" />
                  <div className="h-6 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>) : articles.length > 0 ? articles.map((article, index) => <motion.div key={article.id} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }}>
                  <Link to={`/blog/${article.slug}`}>
                    <GlassCard className="overflow-hidden group hover:border-primary/30 transition-all h-full">
                      {article.image_url ? <div className="aspect-video overflow-hidden">
                          <img src={article.image_url} alt={getLocalizedTitle(article)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div> : <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <Newspaper className="h-12 w-12 text-primary/50" />
                        </div>}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                            {article.category}
                          </span>
                          {article.published_at && <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(article.published_at).toLocaleDateString(lang)}
                            </span>}
                        </div>
                        <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {getLocalizedTitle(article)}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {getLocalizedExcerpt(article)}
                        </p>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>) : <div className="col-span-3 text-center py-12">
                <Newspaper className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('indexPage.news.noNews')}</p>
              </div>}
          </div>

          {articles.length > 0 && <div className="text-center mt-10">
              <Button asChild variant="outline" size="lg">
                <Link to="/media">
                  {t('indexPage.news.viewAll')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>}
        </div>
      </section>

      {/* Privacy Note */}
      <section className="py-6 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <p className="text-xs text-center text-muted-foreground">
            {t('indexPage.privacyNote')} <Link to="/privacy" className="underline hover:text-primary">{t('footer.privacy')}</Link>
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 brushed-metal opacity-95" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('indexPage.ctaSection.title')}
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {t('indexPage.ctaSection.description')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" variant="elp-white">
                <Link to="/otr-sources">
                  {t('indexPage.ctaSection.indicateNow')}
                  <Mountain className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white/10 text-white border-2 border-white hover:bg-white/20">
                <Link to="/partnership/otr">
                  <Handshake className="mr-2 h-5 w-5" />
                  {t('indexPage.ctaSection.partnershipDetails')}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>;
}