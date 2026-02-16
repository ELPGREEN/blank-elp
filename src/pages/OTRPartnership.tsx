import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Handshake, Globe, TrendingUp, Users, Mountain, Phone, Mail, Send, CheckCircle2, Factory, Target, MapPin, Zap, Bot, Calendar, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VideoBackground } from '@/components/ui/video-background';
import otrHeroVideo from '@/assets/videos/otr-hero-background.mp4';
export default function OTRPartnership() {
  const {
    t
  } = useTranslation();
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    country: '',
    otrSources: '',
    volume: '',
    message: ''
  });

  // Partnership benefits with translations
  const partnerBenefits = [{
    icon: Factory,
    title: t('otrPartnership.benefits.smartLine'),
    description: t('otrPartnership.benefits.smartLineDesc'),
    highlight: t('otrPartnership.benefits.smartLineHighlight')
  }, {
    icon: TrendingUp,
    title: t('otrPartnership.benefits.profitModel'),
    description: t('otrPartnership.benefits.profitModelDesc'),
    highlight: t('otrPartnership.benefits.profitModelHighlight')
  }, {
    icon: Globe,
    title: t('otrPartnership.benefits.globalExpansion'),
    description: t('otrPartnership.benefits.globalExpansionDesc'),
    highlight: t('otrPartnership.benefits.globalExpansionHighlight')
  }, {
    icon: Users,
    title: t('otrPartnership.benefits.partnership'),
    description: t('otrPartnership.benefits.partnershipDesc'),
    highlight: t('otrPartnership.benefits.partnershipHighlight')
  }];

  // OTR Sources with translations
  const otrSources = [{
    icon: Mountain,
    name: t('otrPartnership.sources.mining'),
    description: t('otrPartnership.sources.miningDesc')
  }, {
    icon: Factory,
    name: t('otrPartnership.sources.manufacturer'),
    description: t('otrPartnership.sources.manufacturerDesc')
  }, {
    icon: Building2,
    name: t('otrPartnership.sources.dealer'),
    description: t('otrPartnership.sources.dealerDesc')
  }, {
    icon: MapPin,
    name: t('otrPartnership.sources.port'),
    description: t('otrPartnership.sources.portDesc')
  }];

  // Global Expansion Roadmap
  const expansionRoadmap = [{
    year: '2025',
    milestone: 'First Smart Line in Australia',
    factories: '1',
    capacity: '10 ton/hour'
  }, {
    year: '2026',
    milestone: 'South America & Europe Expansion',
    factories: '3-4',
    capacity: '30-40 ton/hour'
  }, {
    year: '2027',
    milestone: 'Africa & Middle East',
    factories: '8-10',
    capacity: '80-100 ton/hour'
  }, {
    year: '2028-2030',
    milestone: 'Complete Global Goal',
    factories: '17-18',
    capacity: '175 ton/hour'
  }];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from('contacts').insert({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        subject: 'OTR Partnership Opportunity',
        message: `${t('otrPartnership.form.countryRegion')}: ${formData.country}\n\n${t('otrPartnership.form.otrSources')}: ${formData.otrSources}\n\n${t('otrPartnership.form.estimatedVolume')}: ${formData.volume}\n\n${t('otrPartnership.form.additionalMessage')}: ${formData.message}`,
        channel: 'otr-partnership'
      });
      if (error) throw error;
      toast({
        title: t('otrPartnership.toast.successTitle'),
        description: t('otrPartnership.toast.successDesc')
      });
      setFormData({
        name: '',
        email: '',
        company: '',
        country: '',
        otrSources: '',
        volume: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: t('otrPartnership.toast.errorTitle'),
        description: t('otrPartnership.toast.errorDesc'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section with Video Background */}
      <section className="pt-28 pb-16 relative overflow-hidden min-h-[60vh] flex items-center">
        <VideoBackground src={otrHeroVideo} overlayClassName="bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90" />
        
        <div className="container-wide relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="max-w-4xl mx-auto text-center">
            <motion.div initial={{
            opacity: 0,
            scale: 0.9
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.2
          }} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 mb-4">
              <Handshake className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">{t('otrPartnership.hero.badge')}</span>
            </motion.div>
            
            {/* TOPS Technology Credit Badge */}
            <motion.div initial={{
            opacity: 0,
            scale: 0.9
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.3
          }} className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm border border-secondary/40 rounded-full px-4 py-2 mb-6 ml-2">
              <Factory className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-primary-foreground">{t('otrPartnership.hero.poweredByTops', 'Technology by TOPS Recycling Group')}</span>
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              {t('otrPartnership.hero.title')}
            </h1>
            <h2 className="text-xl md:text-2xl text-white font-semibold mb-6">
              {t('otrPartnership.hero.subtitle')}
            </h2>
            
            <p className="text-lg text-slate-300 mb-6 max-w-2xl mx-auto leading-relaxed">
              {t('otrPartnership.hero.description')}
            </p>
            
            <p className="text-white font-semibold mb-4">
              {t('otrPartnership.hero.firstDemo')}
            </p>

            {/* TOPS Partnership Credit */}
            <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 mb-4 max-w-xl mx-auto">
              <p className="text-slate-200 text-sm">
                🏭 <strong className="text-secondary">{t('otrPartnership.hero.topsCredit', 'TOPS Recycling Group:')}</strong>{' '}
                {t('otrPartnership.hero.topsCreditDesc', 'All Smart Line equipment is designed and manufactured by our strategic partner TOPS, with 15+ years experience and presence in 60+ countries.')}
              </p>
            </div>

            <div className="bg-white/10 border border-white/30 rounded-xl p-4 mb-8 max-w-xl mx-auto">
              <p className="text-slate-200 font-medium text-sm">
                ⚠️ <strong className="text-white">{t('otrPartnership.hero.noSellWarning')}</strong> – {t('otrPartnership.hero.noSellDesc')}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-white hover:bg-slate-100 text-slate-900 font-semibold" asChild>
                <Link to="/otr-sources">
                  {t('otrPartnership.hero.indicateNow')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-slate-500 text-slate-200 hover:bg-slate-700" asChild>
                <Link to="/global-expansion">
                  {t('otrPartnership.hero.viewExpansion')}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TOPS Technology Video Section */}
      <section className="py-16 bg-gradient-to-br from-secondary/5 to-primary/5">
        <div className="container-wide">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2 mb-4">
              <Factory className="h-4 w-4 text-secondary" />
              <span className="text-secondary text-sm font-medium">{t('otrPartnership.video.badge', 'TOPS Recycling Group')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('otrPartnership.video.title', 'Smart Line Technology in Action')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('otrPartnership.video.description', 'Watch how TOPS Recycling Group\'s advanced OTR tire processing technology works. Over 15 years of innovation in tire recycling equipment.')}
            </p>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          scale: 0.95
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} className="max-w-4xl mx-auto">
            <GlassCard className="overflow-hidden p-0">
              <div className="aspect-video">
                <iframe src="https://www.youtube.com/embed/RwJXgnFV1S4?rel=0&modestbranding=1" title="TOPS Recycling - OTR Smart Line Technology" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full border-0" />
              </div>
            </GlassCard>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                <strong className="text-secondary">{t('otrPartnership.video.credit', 'Video by TOPS Recycling Group')}</strong> – {t('otrPartnership.video.creditDesc', 'Our strategic technology partner since 2023')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Smart Line Technology */}
      <section className="py-12 bg-muted/30">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{
            opacity: 0,
            x: -30
          }} whileInView={{
            opacity: 1,
            x: 0
          }} viewport={{
            once: true
          }}>
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-primary text-sm font-medium">{t('otrPartnership.technology.badge')}</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t('otrPartnership.technology.title')}
              </h2>
              
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('otrPartnership.technology.description')}
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('otrPartnership.technology.simpleProcess')}</p>
                    <p className="text-sm text-muted-foreground">{t('otrPartnership.technology.simpleProcessDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('otrPartnership.technology.firstInstall')}</p>
                    <p className="text-sm text-muted-foreground">{t('otrPartnership.technology.firstInstallDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('otrPartnership.technology.futureExpansion')}</p>
                    <p className="text-sm text-muted-foreground">{t('otrPartnership.technology.futureExpansionDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                <p className="text-sm text-primary font-medium">
                  <strong>{t('otrPartnership.technology.important')}</strong> {t('otrPartnership.technology.importantDesc')}
                </p>
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
          }} className="relative">
              <GlassCard className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {t('otrPartnership.technology.howItWorks')}
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">1</div>
                    <div>
                      <p className="font-medium">{t('otrPartnership.technology.step1')}</p>
                      <p className="text-sm text-muted-foreground">{t('otrPartnership.technology.step1Desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">2</div>
                    <div>
                      <p className="font-medium">{t('otrPartnership.technology.step2')}</p>
                      <p className="text-sm text-muted-foreground">{t('otrPartnership.technology.step2Desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">3</div>
                    <div>
                      <p className="font-medium">{t('otrPartnership.technology.step3')}</p>
                      <p className="text-sm text-muted-foreground">{t('otrPartnership.technology.step3Desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">4</div>
                    <div>
                      <p className="font-medium">{t('otrPartnership.technology.step4')}</p>
                      <p className="text-sm text-muted-foreground">{t('otrPartnership.technology.step4Desc')}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Global Expansion Plan */}
      <section className="py-20">
        <div className="container-wide">
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
              <Target className="h-4 w-4 text-primary" />
              <span className="text-primary text-sm font-medium">{t('otrPartnership.expansion.badge')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('otrPartnership.expansion.title')}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              {t('otrPartnership.expansion.description')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {expansionRoadmap.map((phase, index) => <motion.div key={phase.year} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }}>
                <GlassCard className="h-full p-6 hover:border-primary/50 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-xl font-bold text-primary">{phase.year}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{phase.milestone}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">{t('otrPartnership.expansion.factories')}:</span> {phase.factories}</p>
                    <p><span className="font-medium text-foreground">{t('otrPartnership.expansion.capacity')}:</span> {phase.capacity}</p>
                  </div>
                </GlassCard>
              </motion.div>)}
          </div>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="mt-12 text-center">
            <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl p-8 border border-primary/20">
              <p className="text-lg font-medium mb-2">{t('otrPartnership.expansion.focusOverseas')}</p>
              <p className="text-muted-foreground">
                {t('otrPartnership.expansion.focusOverseasDesc')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partner Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="container-wide">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('otrPartnership.benefits.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('otrPartnership.benefits.description')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {partnerBenefits.map((benefit, index) => <motion.div key={benefit.title} initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }}>
                <GlassCard className="h-full p-6 hover:border-primary/50 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-muted-foreground mb-3">{benefit.description}</p>
                      <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm text-primary font-medium">{benefit.highlight}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* OTR Sources */}
      <section className="py-20">
        <div className="container-wide">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('otrPartnership.sources.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('otrPartnership.sources.description')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {otrSources.map((source, index) => <motion.div key={source.name} initial={{
            opacity: 0,
            scale: 0.9
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }}>
                <GlassCard className="h-full p-6 text-center hover:border-primary/50 transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <source.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{source.name}</h3>
                  <p className="text-sm text-muted-foreground">{source.description}</p>
                </GlassCard>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Partnership Form */}
      <section id="partnership-form" className="py-20 bg-muted/30">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('otrPartnership.form.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('otrPartnership.form.description')}
              </p>
            </motion.div>

            <GlassCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('otrPartnership.form.fullName')} *</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({
                    ...formData,
                    name: e.target.value
                  })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('otrPartnership.form.email')} *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
                    ...formData,
                    email: e.target.value
                  })} required />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company">{t('otrPartnership.form.company')}</Label>
                    <Input id="company" value={formData.company} onChange={e => setFormData({
                    ...formData,
                    company: e.target.value
                  })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">{t('otrPartnership.form.countryRegion')} *</Label>
                    <Input id="country" value={formData.country} onChange={e => setFormData({
                    ...formData,
                    country: e.target.value
                  })} placeholder={t('otrPartnership.form.countryPlaceholder')} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otrSources">{t('otrPartnership.form.otrSources')} *</Label>
                  <Textarea id="otrSources" value={formData.otrSources} onChange={e => setFormData({
                  ...formData,
                  otrSources: e.target.value
                })} placeholder={t('otrPartnership.form.otrSourcesPlaceholder')} rows={3} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume">{t('otrPartnership.form.estimatedVolume')}</Label>
                  <Input id="volume" value={formData.volume} onChange={e => setFormData({
                  ...formData,
                  volume: e.target.value
                })} placeholder={t('otrPartnership.form.volumePlaceholder')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">{t('otrPartnership.form.additionalMessage')}</Label>
                  <Textarea id="message" value={formData.message} onChange={e => setFormData({
                  ...formData,
                  message: e.target.value
                })} placeholder={t('otrPartnership.form.messagePlaceholder')} rows={4} />
                </div>

                <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? t('otrPartnership.form.sending') : <>
                      <Send className="mr-2 h-5 w-5" />
                      {t('otrPartnership.form.submit')}
                    </>}
                </Button>
              </form>
            </GlassCard>

            {/* Contact Info */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} className="mt-12 text-center">
              <p className="text-lg font-semibold mb-4 text-amber-500">
                {t('otrPartnership.form.awaitingNews')}
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <a href="tel:+393501021359" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="h-5 w-5" />
                  +39 350 1021359
                </a>
                <a href="mailto:info@elpgreen.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                  info@elpgreen.com
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
}