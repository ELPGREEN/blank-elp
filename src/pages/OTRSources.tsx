import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Send, 
  Mountain, 
  Building2, 
  Anchor, 
  Truck, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  Ruler, 
  FileText,
  Users,
  Globe,
  Shield,
  Clock,
  ArrowRight,
  Handshake,
  Target,
  QrCode
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/glass-card';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Import factory image
import factoryExpandedImg from '@/assets/factory/tops-factory-expanded.jpg';

// Tire Sizes
const tireSizes = [
  '18.00-33', '21.00-35', '24.00-35', '27.00-49', '29.5-25', '29.5-29',
  '33.00-51', '36.00-51', '37.00-57', '40.00-57', '46/90-57', '53/80-63',
  '55/80-63', '59/80-63', 'Outros tamanhos',
];

export default function OTRSources() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    whatsapp: '',
    sourceName: '',
    sourceCompany: '',
    sourceType: '',
    location: '',
    volumeAnnual: '',
    tireSizes: '',
    details: '',
  });
  
  // Track if user came from PDF QR Code
  const isFromPdfQrCode = searchParams.get('source') === 'pdf_feasibility';

  // Source Types with translations
  const sourceTypes = [
    { value: 'mining', label: t('otrSources.sourceTypes.mining'), icon: Mountain },
    { value: 'dealer', label: t('otrSources.sourceTypes.dealer'), icon: Truck },
    { value: 'port', label: t('otrSources.sourceTypes.port'), icon: Anchor },
    { value: 'quarry', label: t('otrSources.sourceTypes.quarry'), icon: Mountain },
    { value: 'construction', label: t('otrSources.sourceTypes.construction'), icon: Building2 },
    { value: 'manufacturer', label: t('otrSources.sourceTypes.manufacturer'), icon: Package },
    { value: 'other', label: t('otrSources.sourceTypes.other'), icon: FileText },
  ];

  // Locations with translations
  const locations = {
    europe: [
      { value: 'italy-lombardia', label: t('otrSources.locations.italy-lombardia') },
      { value: 'italy-tuscany', label: t('otrSources.locations.italy-tuscany') },
      { value: 'italy-other', label: t('otrSources.locations.italy-other') },
      { value: 'germany', label: t('otrSources.locations.germany') },
      { value: 'spain', label: t('otrSources.locations.spain') },
      { value: 'france', label: t('otrSources.locations.france') },
      { value: 'europe-other', label: t('otrSources.locations.europe-other') },
    ],
    latam: [
      { value: 'brazil-sp', label: t('otrSources.locations.brazil-sp') },
      { value: 'brazil-mg', label: t('otrSources.locations.brazil-mg') },
      { value: 'brazil-pa', label: t('otrSources.locations.brazil-pa') },
      { value: 'brazil-mt', label: t('otrSources.locations.brazil-mt') },
      { value: 'brazil-other', label: t('otrSources.locations.brazil-other') },
      { value: 'chile', label: t('otrSources.locations.chile') },
      { value: 'peru', label: t('otrSources.locations.peru') },
      { value: 'colombia', label: t('otrSources.locations.colombia') },
      { value: 'latam-other', label: t('otrSources.locations.latam-other') },
    ],
    other: [
      { value: 'australia', label: t('otrSources.locations.australia') },
      { value: 'africa', label: t('otrSources.locations.africa') },
      { value: 'asia', label: t('otrSources.locations.asia') },
      { value: 'other', label: t('otrSources.locations.other') },
    ],
  };

  // What we're looking for
  const lookingForItems = [
    t('otrSources.sidebar.lookingFor1'),
    t('otrSources.sidebar.lookingFor2'),
    t('otrSources.sidebar.lookingFor3'),
    t('otrSources.sidebar.lookingFor4'),
    t('otrSources.sidebar.lookingFor5'),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consent) {
      toast({
        title: t('otrSources.toast.consentRequired'),
        description: t('otrSources.toast.consentRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const messageBody = `
${t('otrSources.form.yourInfo').toUpperCase()}:
- ${t('otrSources.form.yourName')}: ${formData.name}
- ${t('otrSources.form.yourCompany')}: ${formData.company}
- ${t('otrSources.form.email')}: ${formData.email}
- ${t('otrSources.form.phone')}: ${formData.phone}
- WhatsApp: ${formData.whatsapp}

${t('otrSources.form.sourceInfo').toUpperCase()}:
- ${t('otrSources.form.sourceContactName')}: ${formData.sourceName}
- ${t('otrSources.form.generatingCompany')}: ${formData.sourceCompany}
- ${t('otrSources.form.sourceType')}: ${sourceTypes.find(s => s.value === formData.sourceType)?.label || formData.sourceType}
- ${t('otrSources.form.location')}: ${formData.location}
- ${t('otrSources.form.annualVolume')}: ${formData.volumeAnnual}
- ${t('otrSources.form.tireSizes')}: ${formData.tireSizes}

${t('otrSources.form.additionalDetails').toUpperCase()}:
${formData.details}

${isFromPdfQrCode ? '📄 ORIGEM: QR Code do PDF de Viabilidade' : ''}
      `.trim();

      // Add source tracking to channel
      const channel = isFromPdfQrCode ? 'otr-source-indication-pdf-qr' : 'otr-source-indication';

      const { error } = await supabase.from('contacts').insert({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        subject: isFromPdfQrCode ? '📄 OTR Source - Via PDF QR Code' : 'OTR Source Indication',
        message: messageBody,
        channel: channel,
        status: 'pending',
        priority: isFromPdfQrCode ? 'high' : 'medium',
      });

      if (error) throw error;

      // Send notification email with PDF QR Code tracking
      try {
        await supabase.functions.invoke('send-contact-email', {
          body: {
            name: formData.name,
            email: formData.email,
            company: formData.company,
            subject: isFromPdfQrCode ? '📄 OTR Source - Via PDF QR Code' : 'OTR Source Indication',
            message: messageBody,
            channel: channel,
            fromPdfQrCode: isFromPdfQrCode,
          },
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

      toast({
        title: t('otrSources.toast.successTitle'),
        description: t('otrSources.toast.successDesc'),
      });

      // Reset form
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        whatsapp: '',
        sourceName: '',
        sourceCompany: '',
        sourceType: '',
        location: '',
        volumeAnnual: '',
        tireSizes: '',
        details: '',
      });
      setConsent(false);
    } catch (error) {
      toast({
        title: t('otrSources.toast.errorTitle'),
        description: t('otrSources.toast.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Professional */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={factoryExpandedImg} 
            alt="TOPS Recycling Factory" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/80" />
        </div>
        
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            {/* PDF QR Code Welcome Banner */}
            {isFromPdfQrCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 bg-gradient-to-r from-violet-600/90 to-purple-600/90 backdrop-blur-sm border border-violet-400/30 rounded-xl p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <QrCode className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {t('otrSources.pdfWelcome.title', 'Welcome! You came from the Feasibility Study')}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {t('otrSources.pdfWelcome.description', 'Fill out the form below and our team will contact you within 24 hours.')}
                    </p>
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 ml-auto">
                    {t('otrSources.pdfWelcome.priority', 'Priority')}
                  </Badge>
                </div>
              </motion.div>
            )}
            
            {/* Professional Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm border border-primary/30 rounded-full px-5 py-2.5 mb-6">
              <Handshake className="h-4 w-4 text-primary" />
              <span className="text-primary text-sm font-semibold uppercase tracking-wide">
                {t('otrSources.hero.badge')}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              {t('otrSources.hero.title')}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-4 leading-relaxed max-w-3xl font-medium">
              {t('otrSources.hero.subtitle')}
            </p>
            
            <p className="text-lg text-white/70 mb-8 leading-relaxed max-w-3xl">
              {t('otrSources.hero.description')}
            </p>

            {/* Professional Benefits */}
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-white">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm">{t('otrSources.hero.longTermPartnership')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-white">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm">{t('otrSources.hero.directNegotiation')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-white">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm">{t('otrSources.hero.sharedBenefits')}</span>
              </div>
            </div>

            {/* Region Tags */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 text-white/80 text-sm flex items-center gap-2 border border-white/10">
                <Globe className="h-4 w-4" />
                <span>{t('otrSources.hero.regions.brazil')}</span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 text-white/80 text-sm flex items-center gap-2 border border-white/10">
                <Globe className="h-4 w-4" />
                <span>{t('otrSources.hero.regions.europe')}</span>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 text-white/80 text-sm flex items-center gap-2 border border-white/10">
                <Users className="h-4 w-4" />
                <span>{t('otrSources.hero.regions.partners')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partnership Process - Professional */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">{t('otrSources.process.title')}</h2>
            <p className="text-muted-foreground">{t('otrSources.process.subtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm font-medium text-primary mb-2">{t('otrSources.process.step1')}</div>
              <h3 className="font-bold text-lg mb-2">{t('otrSources.process.step1Title')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('otrSources.process.step1Desc')}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm font-medium text-primary mb-2">{t('otrSources.process.step2')}</div>
              <h3 className="font-bold text-lg mb-2">{t('otrSources.process.step2Title')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('otrSources.process.step2Desc')}
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Handshake className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm font-medium text-primary mb-2">{t('otrSources.process.step3')}</div>
              <h3 className="font-bold text-lg mb-2">{t('otrSources.process.step3Title')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('otrSources.process.step3Desc')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Form */}
            <div className="lg:col-span-2">
              <GlassCard className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-full bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{t('otrSources.form.title')}</h2>
                    <p className="text-sm text-muted-foreground">{t('otrSources.form.subtitle')}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Your Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      {t('otrSources.form.yourInfo')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('otrSources.form.yourName')} *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">{t('otrSources.form.yourCompany')}</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('otrSources.form.email')} *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('otrSources.form.phone')} *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+55 11 99999-9999"
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="whatsapp">{t('otrSources.form.whatsappOptional')}</Label>
                        <Input
                          id="whatsapp"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          placeholder="+55 11 99999-9999"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Source Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Mountain className="h-5 w-5 text-primary" />
                      {t('otrSources.form.sourceInfo')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sourceName">{t('otrSources.form.sourceContactName')}</Label>
                        <Input
                          id="sourceName"
                          value={formData.sourceName}
                          onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sourceCompany">{t('otrSources.form.generatingCompany')} *</Label>
                        <Input
                          id="sourceCompany"
                          value={formData.sourceCompany}
                          onChange={(e) => setFormData({ ...formData, sourceCompany: e.target.value })}
                          placeholder={t('otrSources.form.companyPlaceholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('otrSources.form.sourceType')} *</Label>
                        <Select
                          value={formData.sourceType}
                          onValueChange={(value) => setFormData({ ...formData, sourceType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('otrSources.form.selectType')} />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{t('otrSources.form.location')} *</Label>
                        <Select
                          value={formData.location}
                          onValueChange={(value) => setFormData({ ...formData, location: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('otrSources.form.selectRegion')} />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{t('otrSources.form.latinAmerica')}</div>
                            {locations.latam.map((loc) => (
                              <SelectItem key={loc.value} value={loc.value}>
                                {loc.label}
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">{t('otrSources.form.europe')}</div>
                            {locations.europe.map((loc) => (
                              <SelectItem key={loc.value} value={loc.value}>
                                {loc.label}
                              </SelectItem>
                            ))}
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">{t('otrSources.form.other')}</div>
                            {locations.other.map((loc) => (
                              <SelectItem key={loc.value} value={loc.value}>
                                {loc.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="volumeAnnual" className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {t('otrSources.form.annualVolume')}
                        </Label>
                        <Input
                          id="volumeAnnual"
                          value={formData.volumeAnnual}
                          onChange={(e) => setFormData({ ...formData, volumeAnnual: e.target.value })}
                          placeholder={t('otrSources.form.volumePlaceholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Ruler className="h-4 w-4" />
                          {t('otrSources.form.tireSizes')}
                        </Label>
                        <Select
                          value={formData.tireSizes}
                          onValueChange={(value) => setFormData({ ...formData, tireSizes: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('otrSources.form.selectSize')} />
                          </SelectTrigger>
                          <SelectContent>
                            {tireSizes.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-2">
                    <Label htmlFor="details">{t('otrSources.form.additionalDetails')}</Label>
                    <Textarea
                      id="details"
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      placeholder={t('otrSources.form.detailsPlaceholder')}
                      rows={4}
                    />
                  </div>

                  {/* Consent */}
                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="consent"
                      checked={consent}
                      onCheckedChange={(checked) => setConsent(checked === true)}
                    />
                    <Label htmlFor="consent" className="text-sm leading-relaxed">
                      {t('otrSources.form.consentText')}
                    </Label>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full text-lg py-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      t('otrSources.form.sending')
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        {t('otrSources.form.submitButton')}
                      </>
                    )}
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{t('otrSources.form.responseTime')}</span>
                  </div>
                </form>
              </GlassCard>
            </div>

            {/* Sidebar - Professional */}
            <div className="space-y-6">
              {/* Process Info Card */}
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {t('otrSources.sidebar.approvalProcess')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">1</div>
                      <div>
                        <p className="font-medium text-sm">{t('otrSources.sidebar.receipt')}</p>
                        <p className="text-xs text-muted-foreground">{t('otrSources.sidebar.receiptDesc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">2</div>
                      <div>
                        <p className="font-medium text-sm">{t('otrSources.sidebar.internalAnalysis')}</p>
                        <p className="text-xs text-muted-foreground">{t('otrSources.sidebar.internalAnalysisDesc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">3</div>
                      <div>
                        <p className="font-medium text-sm">{t('otrSources.sidebar.contact')}</p>
                        <p className="text-xs text-muted-foreground">{t('otrSources.sidebar.contactDesc')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What We're Looking For */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {t('otrSources.sidebar.whatWeLookFor')}
                  </h3>
                  <div className="space-y-3">
                    {lookingForItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Priority Regions */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    {t('otrSources.sidebar.priorityRegions')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{t('otrSources.sidebar.brazil')}</p>
                        <p className="text-xs text-muted-foreground">{t('otrSources.sidebar.brazilRegions')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{t('otrSources.sidebar.italy')}</p>
                        <p className="text-xs text-muted-foreground">{t('otrSources.sidebar.italyRegions')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{t('otrSources.sidebar.australia')}</p>
                        <p className="text-xs text-muted-foreground">{t('otrSources.sidebar.australiaRegions')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info - No WhatsApp links */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    {t('otrSources.sidebar.commercialContact')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">info@elpgreen.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">+39 350 1021359</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    {t('otrSources.sidebar.allSubmissionsNote')}
                  </p>
                </CardContent>
              </Card>

              {/* CTA */}
              <Link to="/partnership/otr">
                <Button variant="outline" className="w-full">
                  {t('otrSources.sidebar.learnMoreSmartLine')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
