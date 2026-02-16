import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Factory, 
  TrendingUp, 
  Calendar, 
  Target,
  CheckCircle2,
  ArrowRight,
  Mountain,
  Building2,
  Zap,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';

// Import images
import factoryExpandedImg from '@/assets/factory/tops-factory-expanded.jpg';

export default function GlobalExpansion() {
  const { t } = useTranslation();

  // Key Metrics with translations
  const keyMetrics = [
    { label: t('globalExpansion.metrics.annualGoal'), value: '1M', suffix: t('globalExpansion.metrics.tonsYear'), icon: Target },
    { label: t('globalExpansion.metrics.globalCapacity'), value: '175', suffix: t('globalExpansion.metrics.tonsHour'), icon: Zap },
    { label: t('globalExpansion.metrics.plannedFactories'), value: '17-18', suffix: t('globalExpansion.metrics.units'), icon: Factory },
    { label: t('globalExpansion.metrics.targetCountries'), value: '15+', suffix: t('globalExpansion.metrics.markets'), icon: Globe },
  ];

  // Expansion Roadmap with translations
  const expansionRoadmap = [
    { 
      year: '2026', 
      milestone: t('globalExpansion.timeline.2026.milestone'),
      description: t('globalExpansion.timeline.2026.description'),
      factories: t('globalExpansion.timeline.2026.factories'), 
      capacity: t('globalExpansion.timeline.2026.capacity'),
      status: 'in_progress',
      location: t('globalExpansion.timeline.2026.location'),
      flag: '🇦🇺'
    },
    { 
      year: '2027', 
      milestone: t('globalExpansion.timeline.2027.milestone'),
      description: t('globalExpansion.timeline.2027.description'),
      factories: t('globalExpansion.timeline.2027.factories'), 
      capacity: t('globalExpansion.timeline.2027.capacity'),
      status: 'planned',
      location: t('globalExpansion.timeline.2027.location'),
      flag: '🇧🇷🇮🇹'
    },
    { 
      year: '2028', 
      milestone: t('globalExpansion.timeline.2028.milestone'),
      description: t('globalExpansion.timeline.2028.description'),
      factories: t('globalExpansion.timeline.2028.factories'), 
      capacity: t('globalExpansion.timeline.2028.capacity'),
      status: 'planned',
      location: t('globalExpansion.timeline.2028.location'),
      flag: '🌍'
    },
    { 
      year: '2029-2031', 
      milestone: t('globalExpansion.timeline.2029-2031.milestone'),
      description: t('globalExpansion.timeline.2029-2031.description'),
      factories: t('globalExpansion.timeline.2029-2031.factories'), 
      capacity: t('globalExpansion.timeline.2029-2031.capacity'),
      status: 'planned',
      location: t('globalExpansion.timeline.2029-2031.location'),
      flag: '🌐'
    },
  ];

  // Regional Focus Areas with translations
  const regionalFocus = [
    {
      region: t('globalExpansion.regions_data.europe.region'),
      flag: '🇮🇹',
      countries: t('globalExpansion.regions_data.europe.countries', { returnObjects: true }) as string[],
      advantages: t('globalExpansion.regions_data.europe.advantages', { returnObjects: true }) as string[],
      icon: Building2,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      region: t('globalExpansion.regions_data.latam.region'),
      flag: '🇧🇷',
      countries: t('globalExpansion.regions_data.latam.countries', { returnObjects: true }) as string[],
      advantages: t('globalExpansion.regions_data.latam.advantages', { returnObjects: true }) as string[],
      icon: Mountain,
      color: 'from-green-500 to-emerald-500'
    },
    {
      region: t('globalExpansion.regions_data.oceania.region'),
      flag: '🇦🇺',
      countries: t('globalExpansion.regions_data.oceania.countries', { returnObjects: true }) as string[],
      advantages: t('globalExpansion.regions_data.oceania.advantages', { returnObjects: true }) as string[],
      icon: Factory,
      color: 'from-amber-500 to-orange-500'
    },
    {
      region: t('globalExpansion.regions_data.asia.region'),
      flag: '🇨🇳',
      countries: t('globalExpansion.regions_data.asia.countries', { returnObjects: true }) as string[],
      advantages: t('globalExpansion.regions_data.asia.advantages', { returnObjects: true }) as string[],
      icon: Globe,
      color: 'from-red-500 to-pink-500'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={factoryExpandedImg} 
            alt="ELP Global Expansion" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/85 to-slate-950/70" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Calendar className="w-3 h-3 mr-1" />
              {t('globalExpansion.badge')}
            </Badge>
            
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                {t('globalExpansion.poweredByTops', 'Powered by TOPS Recycling Group')}
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                {t('globalExpansion.title')}
              </span>
              <br />
              <span className="text-white">{t('globalExpansion.subtitle')}</span>
            </h1>
            
            <p className="text-xl text-white/70 mb-8 max-w-2xl leading-relaxed">
              {t('globalExpansion.heroDescription')}
              <strong className="text-white"> {t('globalExpansion.noSellEquipment')}</strong>
            </p>
            
            {/* TOPS Technology Credit */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-8 border border-white/20 max-w-2xl">
              <p className="text-white/80 text-sm leading-relaxed">
                <strong className="text-secondary">{t('globalExpansion.topsCredit.title', 'Technology Partner:')}</strong>{' '}
                {t('globalExpansion.topsCredit.description', 'All Smart Line equipment and recycling technology featured in this expansion plan are designed and manufactured by TOPS Recycling Group, our strategic partner with 15+ years of experience in tire recycling solutions.')}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/otr-sources">
                  {t('globalExpansion.indicateSource')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link to="/partnership/otr">
                  {t('globalExpansion.knowSmartLine')}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {keyMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 text-center h-full">
                  <metric.icon className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                    {metric.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {metric.suffix}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {metric.label}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expansion Roadmap */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">{t('globalExpansion.roadmap.badge')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('globalExpansion.roadmap.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('globalExpansion.roadmap.subtitle')}
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary via-secondary to-primary/30 hidden lg:block" />
            
            <div className="space-y-12">
              {expansionRoadmap.map((phase, index) => (
                <motion.div
                  key={phase.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-8 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                    <Card className={`border-l-4 ${phase.status === 'in_progress' ? 'border-l-primary bg-primary/5' : 'border-l-muted'}`}>
                      <CardHeader>
                        <div className={`flex items-center gap-3 ${index % 2 === 0 ? 'lg:justify-end' : ''}`}>
                          <Badge variant={phase.status === 'in_progress' ? 'default' : 'outline'}>
                            {phase.year}
                          </Badge>
                          <span className="text-2xl">{phase.flag}</span>
                        </div>
                        <CardTitle className="text-xl">{phase.milestone}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">{phase.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Factory className="w-4 h-4 text-primary" />
                            <span>{phase.factories} {t('globalExpansion.factories')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-secondary" />
                            <span>{phase.capacity}</span>
                          </div>
                        </div>
                        {phase.status === 'in_progress' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-primary font-medium">{t('globalExpansion.inProgress')}</span>
                              <span>40%</span>
                            </div>
                            <Progress value={40} className="h-2" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="hidden lg:flex w-12 h-12 rounded-full bg-background border-4 border-primary items-center justify-center z-10">
                    {phase.status === 'in_progress' ? (
                      <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Regional Focus */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">{t('globalExpansion.regions.badge')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('globalExpansion.regions.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('globalExpansion.regions.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {regionalFocus.map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${region.color} flex items-center justify-center mb-4`}>
                      <region.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{region.flag}</span>
                      <CardTitle>{region.region}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {region.countries.map((country) => (
                        <Badge key={country} variant="secondary" className="text-xs">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {region.advantages.map((advantage, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{advantage}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About TOPS Recycling Group Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-secondary/20 text-secondary border-secondary/30">
              {t('globalExpansion.aboutTops.badge', 'Technology Partner')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('globalExpansion.aboutTops.title', 'About TOPS Recycling Group')}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              {t('globalExpansion.aboutTops.subtitle', 'The engineering powerhouse behind our Smart Line technology')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                    <Factory className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t('globalExpansion.aboutTops.founded', 'Founded in 2001')}</h3>
                    <p className="text-muted-foreground">{t('globalExpansion.aboutTops.founder', 'By Mr. Samuel Sue')}</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {t('globalExpansion.aboutTops.description', 'TOPS Recycling Group has been designing and manufacturing high-performance tire recycling equipment for over 15 years. Based in Wuxi, Jiangsu Province, China, with offices in Shanghai and Zhangjiagang, TOPS serves customers in 60+ countries worldwide.')}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">15+</div>
                    <div className="text-sm text-muted-foreground">{t('globalExpansion.aboutTops.years', 'Years Experience')}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-secondary">60+</div>
                    <div className="text-sm text-muted-foreground">{t('globalExpansion.aboutTops.countries', 'Countries Served')}</div>
                  </div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{t('globalExpansion.aboutTops.feature1', 'Complete tire recycling production lines (TDF, mulch, granules, powder)')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{t('globalExpansion.aboutTops.feature2', 'Reclaimed rubber production technology')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{t('globalExpansion.aboutTops.feature3', 'OTR, AG, and AC tire processing solutions')}</span>
                  </li>
                </ul>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <Card className="border-l-4 border-l-secondary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-secondary" />
                    {t('globalExpansion.aboutTops.globalReach', 'Global Reach')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {t('globalExpansion.aboutTops.globalReachDesc', 'Machines sold across USA, Canada, South America, Middle East, India, Malaysia, and 60+ countries worldwide, including extensive presence in China.')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    {t('globalExpansion.aboutTops.productLines', 'Product Lines')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {t('globalExpansion.aboutTops.productLinesDesc', 'From tire shredding to rubber powder devulcanizing, TOPS offers complete production lines for all tire recycling needs with continuous technology improvements.')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    {t('globalExpansion.aboutTops.partnership', 'Strategic Partnership')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {t('globalExpansion.aboutTops.partnershipDesc', 'ELP Green Technology and TOPS Recycling Group formalized their strategic partnership on February 22, 2023, combining Brazilian market expertise with Chinese manufacturing excellence.')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>


      <section className="py-20">
        <div className="container mx-auto px-4">
          <GlassCard className="p-8 md:p-12 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                  <Users className="w-3 h-3 mr-1" />
                  {t('globalExpansion.partnership.badge')}
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {t('globalExpansion.partnership.title')}
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {t('globalExpansion.partnership.description')}
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>{t('globalExpansion.partnership.jointVentures')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>{t('globalExpansion.partnership.smartLineTech')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>{t('globalExpansion.partnership.jointOperation')}</span>
                  </li>
                </ul>
                <Button asChild size="lg">
                  <Link to="/otr-sources">
                    {t('globalExpansion.partnership.indicateOtr')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img 
                    src={factoryExpandedImg} 
                    alt="Factory Operations" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{t('globalExpansion.goal2031')}</div>
                        <div className="text-sm text-muted-foreground">{t('globalExpansion.millionTonsYear')}</div>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('globalExpansion.cta.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              {t('globalExpansion.cta.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link to="/otr-sources">
                  <Mountain className="mr-2 h-5 w-5" />
                  {t('globalExpansion.indicateSource')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/partnership/otr">
                  {t('globalExpansion.cta.knowTech')}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
