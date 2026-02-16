import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { SEO } from '@/components/SEO';
import { Leaf, Users, Award, Target, Globe, Heart, ArrowRight, CheckCircle, Download, Sparkles, Zap, Sun, Building2, Recycle, CloudRain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TechGrid } from '@/components/ui/tech-grid';
import { GlassCard } from '@/components/ui/glass-card';

// Lazy load particle effects only
const ParticleField = lazy(() => import('@/components/3d/ParticleField').then(m => ({ default: m.ParticleField })));

const getImpactNumbers = (t: (key: string) => string) => [
  { value: '125,000', unit: 'ton', label: t('esgImpact.co2Avoided'), icon: Leaf },
  { value: '450,000', unit: 'ton', label: t('esgImpact.wasteProcessed'), icon: Recycle },
  { value: '2,500', unit: '+', label: t('esgImpact.jobsGenerated'), icon: Users },
  { value: '100', unit: '%', label: t('esgImpact.cleanEnergy'), icon: Zap },
];

// Official UN SDG Colors - https://www.un.org/sustainabledevelopment/news/communications-material/
const getSdgs = (t: (key: string) => string) => [
  { number: 7, title: t('sdgs.sdg7'), color: '#FCC30B', icon: Sun, description: t('sdgs.sdg7Desc') },
  { number: 9, title: t('sdgs.sdg9'), color: '#FD6925', icon: Building2, description: t('sdgs.sdg9Desc') },
  { number: 11, title: t('sdgs.sdg11'), color: '#FD9D24', icon: Globe, description: t('sdgs.sdg11Desc') },
  { number: 12, title: t('sdgs.sdg12'), color: '#BF8B2E', icon: Recycle, description: t('sdgs.sdg12Desc') },
  { number: 13, title: t('sdgs.sdg13'), color: '#3F7E44', icon: CloudRain, description: t('sdgs.sdg13Desc') },
];

const getCertifications = (t: (key: string) => string) => [
  { name: 'B-Corp', description: t('esgCerts.bcorp') },
  { name: t('esgCerts.euTaxonomy'), description: t('esgCerts.euTaxonomyDesc') },
  { name: 'ISO 14001', description: t('esgCerts.iso14001') },
  { name: 'ISO 45001', description: t('esgCerts.iso45001') },
];

export default function ESG() {
  const { t } = useTranslation();
  const impactNumbers = getImpactNumbers(t);
  const sdgs = getSdgs(t);
  const certifications = getCertifications(t);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEO 
        title="ESG & Sustentabilidade | ELP Green Technology"
        description="Compromisso com Environmental, Social & Governance. 125.000 ton CO2 evitadas, 450.000 ton resíduos processados. Certificações B-Corp, ISO 14001 e 45001."
        url="https://elpgreen.com/esg"
      />
      <Header />

      {/* Hero Section with Particles */}
      <section className="relative min-h-[70vh] flex items-center pt-20 overflow-hidden">
        <Suspense fallback={null}>
          <ParticleField />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <TechGrid />
        
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-primary/30"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">{t('esg.sustainableCommitment')}</span>
            </motion.div>
            
            <h1 className="text-white mb-6 leading-tight text-4xl md:text-5xl lg:text-6xl font-bold">
              {t('esg.title')}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-xl mx-auto leading-relaxed">
              {t('esg.subtitle')}
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" variant="elp-white">
                <Link to="/contact">
                  {t('esg.contactUs')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="elp-white-outline">
                <a href="/certificates/certificado-classe-1.pdf" target="_blank">
                  <Download className="mr-2 h-5 w-5" />
                  {t('esg.certificates')}
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Impact Numbers with Enhanced Cards */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent" />
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('esg.measurableImpact')}</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-secondary mx-auto rounded-full" />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {impactNumbers.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <GlassCard className="p-6 text-center bg-card/50">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-4xl font-bold text-gradient mb-1">
                    {item.value}<span className="text-2xl">{item.unit}</span>
                  </p>
                  <p className="text-muted-foreground">{item.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Environmental */}
      <section className="py-24 bg-muted/50">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Leaf className="h-12 w-12 text-primary mb-6" />
              <h2 className="mb-6">{t('esg.environmental.title')}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {t('esg.environmental.description')}
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>{t('esg.environmental.items.0')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>{t('esg.environmental.items.1')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>{t('esg.environmental.items.2')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>{t('esg.environmental.items.3')}</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-10 text-white"
            >
              <Target className="h-12 w-12 mb-6" />
              <h3 className="text-2xl font-bold mb-4">{t('esg.netZeroGoals')}</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>{t('esg.scopes.scope12')}</span>
                    <span>2030</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full">
                    <div className="h-2 bg-white rounded-full w-3/4"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>{t('esg.scopes.scope3')}</span>
                    <span>2040</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full">
                    <div className="h-2 bg-white rounded-full w-1/2"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social */}
      <section className="py-24">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-6 text-center">
                  <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-2xl font-bold mb-1">2,500+</p>
                  <p className="text-sm text-muted-foreground">{t('esgSocial.directJobs')}</p>
                </GlassCard>
                <GlassCard className="p-6 text-center">
                  <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-2xl font-bold mb-1">10,000+</p>
                  <p className="text-sm text-muted-foreground">{t('esgSocial.indirectJobs')}</p>
                </GlassCard>
                <GlassCard className="p-6 text-center">
                  <Award className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-2xl font-bold mb-1">500+</p>
                  <p className="text-sm text-muted-foreground">{t('esgSocial.trainings')}</p>
                </GlassCard>
                <GlassCard className="p-6 text-center">
                  <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="text-2xl font-bold mb-1">50+</p>
                  <p className="text-sm text-muted-foreground">{t('esgSocial.communities')}</p>
                </GlassCard>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <Users className="h-12 w-12 text-primary mb-6" />
              <h2 className="mb-6">{t('esg.social.title')}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {t('esg.social.description')}
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>{t('esg.social.items.0')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>{t('esg.social.items.1')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>{t('esg.social.items.2')}</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span>{t('esg.social.items.3')}</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SDGs - Official UN Colors */}
      <section className="py-24 bg-muted/50">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="mb-4">{t('esg.sdgsTitle')}</h2>
            <div className="section-divider mx-auto mb-6" />
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('esg.sdgsSubtitle')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {sdgs.map((sdg, index) => (
              <motion.div
                key={sdg.number}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="rounded-xl p-6 text-white text-center cursor-pointer transition-all duration-300"
                style={{ backgroundColor: sdg.color }}
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <sdg.icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold mb-1">ODS {sdg.number}</p>
                <p className="text-sm opacity-90 font-medium">{sdg.title}</p>
                <p className="text-xs opacity-75 mt-2 line-clamp-2">{sdg.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            {t('esg.sdgsNote')}
          </motion.p>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-24">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Award className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="mb-4">{t('esg.certifications.title')}</h2>
            <div className="section-divider mx-auto mb-6" />
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('esg.certifications.description')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <GlassCard className="p-6 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{cert.name}</h3>
                  <p className="text-sm text-muted-foreground">{cert.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg">
              <Link to="/about">
                {t('esg.viewCertificates')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="container-wide text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Leaf className="h-16 w-16 mx-auto mb-6 opacity-80" />
            <h2 className="text-white mb-6">{t('esg.joinJourney')}</h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {t('esg.joinJourneyDesc')}
            </p>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg">
              <Link to="/contact">
                {t('esg.contactUs')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
