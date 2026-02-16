import React, { useState, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { motion } from 'framer-motion';
import { FileText, Building2, User, Mail, Phone, MapPin, Package, MessageSquare, Send, CheckCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateLOIPDF } from '@/lib/generateLOI';

const ParticleField = lazy(() => import('@/components/3d/ParticleField').then(m => ({ default: m.ParticleField })));
const TechGrid = lazy(() => import('@/components/ui/tech-grid').then(m => ({ default: m.TechGrid })));

const countries = [
  'Brasil', 'Alemanha', 'Itália', 'China', 'Estados Unidos', 'México', 
  'Argentina', 'Chile', 'Colômbia', 'Peru', 'Portugal', 'Espanha', 
  'França', 'Reino Unido', 'Índia', 'Japão', 'Coreia do Sul', 'Outro'
];

export default function RequestQuote() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: '',
    companyType: '',
    estimatedVolume: '',
    message: ''
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const products = [
    { id: 'rcb', nameKey: 'marketplace.products.rcb.title' },
    { id: 'pyrolytic-oil', nameKey: 'marketplace.products.pyrolyticOil.title' },
    { id: 'steel-wire', nameKey: 'marketplace.products.greenSteel.title' },
    { id: 'rubber-blocks', nameKey: 'marketplace.products.rubberBlocks.title' },
    { id: 'rubber-granules', nameKey: 'marketplace.products.rubberGranules.title' },
    { id: 'reclaimed-rubber', nameKey: 'marketplace.products.reclaimedRubber.title' },
    { id: 'tire-shredder', nameKey: 'solutions.machines.tireShredder.title' },
    { id: 'debeader', nameKey: 'solutions.machines.debeader.title' },
    { id: 'otr-cutter', nameKey: 'solutions.machines.otrCutter.title' },
    { id: 'granulator', nameKey: 'solutions.machines.granulator.title' },
    { id: 'cracker-mill', nameKey: 'solutions.machines.crackerMill.title' },
    { id: 'powder-line', nameKey: 'solutions.machines.powderLine.title' },
    { id: 'reclaimed-line', nameKey: 'solutions.machines.reclaimedLine.title' },
    { id: 'pyrolysis-plant', nameKey: 'solutions.machines.pyrolysisPlant.title' },
  ];

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(p => p !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      toast({
        title: t('quote.form.selectProduct', 'Selecione ao menos um produto'),
        description: t('quote.form.selectProductDesc', 'Por favor, selecione os produtos/equipamentos de seu interesse.'),
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check for duplicate email
      const { data: existingRegistration } = await supabase
        .from('marketplace_registrations')
        .select('id, email')
        .eq('email', formData.email.toLowerCase().trim())
        .maybeSingle();

      if (existingRegistration) {
        toast({
          title: t('quote.form.duplicateEmail', 'Email já cadastrado'),
          description: t('quote.form.duplicateEmailDesc', 'Este email já possui uma solicitação. Nossa equipe entrará em contato em breve.'),
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      // Save to database
      const { data: registrationData, error } = await supabase.from('marketplace_registrations').insert({
        company_name: formData.companyName,
        contact_name: formData.contactName,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone || null,
        country: formData.country,
        company_type: formData.companyType,
        products_interest: selectedProducts,
        estimated_volume: formData.estimatedVolume || null,
        message: formData.message || null
      }).select().single();

      if (error) throw error;

      const currentLang = i18n.language as 'pt' | 'en' | 'es' | 'zh';

      // Send confirmation email with LOI link
      const emailResponse = await supabase.functions.invoke('send-marketplace-email', {
        body: {
          companyName: formData.companyName,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone || undefined,
          country: formData.country,
          companyType: formData.companyType,
          productsInterest: selectedProducts,
          estimatedVolume: formData.estimatedVolume || undefined,
          message: formData.message || undefined,
          registrationId: registrationData?.id,
          language: currentLang
        }
      });

      if (emailResponse.error) {
        console.error('Email error:', emailResponse.error);
      }

      toast({
        title: t('quote.form.success', 'Solicitação enviada com sucesso!'),
        description: t('quote.form.successDesc', 'Sua Carta de Intenções (LOI) foi gerada. Entraremos em contato em até 7 dias úteis.'),
      });

      // Generate LOI PDF (auto-download)
      generateLOIPDF({
        companyName: formData.companyName,
        contactName: formData.contactName,
        email: formData.email,
        phone: formData.phone || undefined,
        country: formData.country,
        companyType: formData.companyType,
        productsInterest: selectedProducts,
        estimatedVolume: formData.estimatedVolume || undefined,
        message: formData.message || undefined,
        language: currentLang
      });

      // Reset form
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        country: '',
        companyType: '',
        estimatedVolume: '',
        message: ''
      });
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error submitting quote request:', error);
      toast({
        title: t('quote.form.error', 'Erro ao enviar solicitação'),
        description: t('quote.form.errorDesc', 'Por favor, tente novamente ou entre em contato conosco.'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[40vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <ParticleField />
          </Suspense>
        </div>
        <Suspense fallback={null}>
          <TechGrid />
        </Suspense>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/30 rounded-full px-4 py-2 mb-6">
              <FileText className="h-4 w-4 text-secondary" />
              <span className="text-sm text-secondary font-medium">{t('quote.badge', 'LOI Automático')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent">
              {t('quote.title', 'Solicitar Orçamento')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('quote.subtitle', 'Preencha o formulário abaixo e receba automaticamente sua Carta de Intenções (LOI) profissional.')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Company Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-secondary" />
                      {t('quote.companyInfo', 'Informações da Empresa')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-secondary" />
                          {t('quote.form.companyName', 'Razão Social')} *
                        </Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                          placeholder={t('quote.form.companyNamePlaceholder', 'Nome da sua empresa')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactName" className="flex items-center gap-2">
                          <User className="h-4 w-4 text-secondary" />
                          {t('quote.form.contactName', 'Nome do Contato')} *
                        </Label>
                        <Input
                          id="contactName"
                          value={formData.contactName}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                          placeholder={t('quote.form.contactNamePlaceholder', 'Seu nome completo')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-secondary" />
                          {t('quote.form.email', 'E-mail Corporativo')} *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder={t('quote.form.emailPlaceholder', 'seu@empresa.com')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-secondary" />
                          {t('quote.form.phone', 'Telefone')}
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+55 11 99999-9999"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-secondary" />
                          {t('quote.form.country', 'País')} *
                        </Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('quote.form.countryPlaceholder', 'Selecione o país')} />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyType" className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-secondary" />
                          {t('quote.form.companyType', 'Tipo de Empresa')} *
                        </Label>
                        <Select
                          value={formData.companyType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, companyType: value }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('quote.form.companyTypePlaceholder', 'Selecione o tipo')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buyer">{t('quote.form.buyer', 'Comprador')}</SelectItem>
                            <SelectItem value="seller">{t('quote.form.seller', 'Vendedor/Fornecedor')}</SelectItem>
                            <SelectItem value="both">{t('quote.form.both', 'Comprador e Vendedor')}</SelectItem>
                            <SelectItem value="investor">{t('quote.form.investor', 'Investidor')}</SelectItem>
                            <SelectItem value="partner">{t('quote.form.partner', 'Parceiro Estratégico')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Products Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-secondary" />
                      {t('quote.productsTitle', 'Produtos/Equipamentos de Interesse')} *
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {products.map(product => (
                        <div
                          key={product.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedProducts.includes(product.id)
                              ? 'border-secondary bg-secondary/10'
                              : 'border-border hover:border-secondary/50'
                          }`}
                          onClick={() => handleProductToggle(product.id)}
                        >
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => handleProductToggle(product.id)}
                          />
                          <span className="text-sm">{t(product.nameKey, product.id)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Volume & Message */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="estimatedVolume" className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-secondary" />
                        {t('quote.form.volume', 'Volume/Quantidade Estimada')}
                      </Label>
                      <Input
                        id="estimatedVolume"
                        value={formData.estimatedVolume}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedVolume: e.target.value }))}
                        placeholder={t('quote.form.volumePlaceholder', 'Ex: 100 ton/mês ou 2 unidades')}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="message" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-secondary" />
                        {t('quote.form.message', 'Mensagem/Especificações')}
                      </Label>
                      <Textarea
                        id="message"
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder={t('quote.form.messagePlaceholder', 'Descreva suas necessidades, especificações técnicas ou dúvidas...')}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold shadow-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('quote.form.sending', 'Enviando...')}
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          {t('quote.form.submit', 'Enviar Solicitação e Gerar LOI')}
                        </>
                      )}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      {t('quote.form.loiNote', 'Ao enviar, você receberá automaticamente sua Carta de Intenções (LOI) em PDF e por email.')}
                    </p>
                  </div>
                </form>
              </GlassCard>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 grid sm:grid-cols-3 gap-6"
            >
              {[
                { icon: FileText, title: t('quote.benefits.loi', 'LOI Automático'), desc: t('quote.benefits.loiDesc', 'Documento profissional gerado instantaneamente') },
                { icon: Mail, title: t('quote.benefits.email', 'Link por Email'), desc: t('quote.benefits.emailDesc', 'Acesse sua LOI online a qualquer momento') },
                { icon: CheckCircle, title: t('quote.benefits.response', 'Resposta Rápida'), desc: t('quote.benefits.responseDesc', 'Nossa equipe responde em até 7 dias úteis') },
              ].map((benefit, index) => (
                <GlassCard key={index} className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-6 w-6 text-secondary" />
                  </div>
                  <h4 className="font-semibold mb-2">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </GlassCard>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
