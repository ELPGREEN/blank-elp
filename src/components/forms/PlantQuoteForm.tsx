import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Building2, User, Mail, Phone, MapPin, Factory, MessageSquare, Send, Loader2, CheckCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PlantQuoteFormProps {
  plantType?: string;
  plantTitle?: string;
  className?: string;
}

const countries = [
  'Brasil', 'Alemanha', 'Itália', 'China', 'Estados Unidos', 'México', 
  'Argentina', 'Chile', 'Colômbia', 'Peru', 'Portugal', 'Espanha', 
  'França', 'Reino Unido', 'Índia', 'Japão', 'Coreia do Sul', 'Outro'
];

const plantTypes = [
  { id: 'otr-processing', name: 'Sistema Smart OTR – Pneus Gigantes' },
  { id: 'tire-recycling', name: 'Planta de Reciclagem de Pneus' },
  { id: 'pyrolysis', name: 'Planta de Pirólise Contínua' },
  { id: 'other', name: 'Outro Sistema Industrial' },
];

export function PlantQuoteForm({ plantType, plantTitle, className }: PlantQuoteFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: '',
    companyType: '',
    plantInterest: plantType || '',
    estimatedCapacity: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('marketplace_registrations').insert({
        company_name: formData.companyName,
        contact_name: formData.contactName,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone || null,
        country: formData.country,
        company_type: formData.companyType,
        products_interest: [formData.plantInterest || 'industrial-plant'],
        estimated_volume: formData.estimatedCapacity || null,
        message: `[INTERESSE EM PLANTA INDUSTRIAL: ${plantTitle || formData.plantInterest}] ${formData.message || ''}`
      });

      if (error) throw error;

      // Send confirmation email
      await supabase.functions.invoke('send-marketplace-email', {
        body: {
          companyName: formData.companyName,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone || undefined,
          country: formData.country,
          companyType: formData.companyType,
          productsInterest: [formData.plantInterest],
          estimatedVolume: formData.estimatedCapacity || undefined,
          message: formData.message || undefined,
        }
      });

      setIsSuccess(true);
      toast({
        title: 'Solicitação enviada com sucesso!',
        description: 'Nossa equipe entrará em contato em até 48 horas.',
      });

      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        country: '',
        companyType: '',
        plantInterest: plantType || '',
        estimatedCapacity: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Erro ao enviar solicitação',
        description: 'Por favor, tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={className}
      >
        <GlassCard className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Solicitação Recebida!</h3>
          <p className="text-muted-foreground mb-6">
            Nossa equipe de engenharia entrará em contato em até 48 horas 
            com uma proposta personalizada para sua necessidade.
          </p>
          <Button onClick={() => setIsSuccess(false)} variant="outline">
            Enviar nova solicitação
          </Button>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={className}
    >
      <GlassCard className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <Factory className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Solicitar Orçamento de Planta Industrial</h3>
            <p className="text-sm text-muted-foreground">Preencha o formulário e receba uma proposta personalizada</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Razão Social *
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Nome da sua empresa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Nome do Contato *
              </Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="Seu nome completo"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                E-mail Corporativo *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="seu@empresa.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Telefone/WhatsApp
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+55 11 99999-9999"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                País *
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o país" />
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
                <Building2 className="h-4 w-4 text-primary" />
                Tipo de Empresa *
              </Label>
              <Select
                value={formData.companyType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, companyType: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investor">Investidor</SelectItem>
                  <SelectItem value="municipality">Prefeitura/Governo</SelectItem>
                  <SelectItem value="recycler">Recicladora</SelectItem>
                  <SelectItem value="manufacturer">Indústria</SelectItem>
                  <SelectItem value="concessionaire">Concessionária</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plantInterest" className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-primary" />
                Tipo de Planta *
              </Label>
              <Select
                value={formData.plantInterest}
                onValueChange={(value) => setFormData(prev => ({ ...prev, plantInterest: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a planta" />
                </SelectTrigger>
                <SelectContent>
                  {plantTypes.map(plant => (
                    <SelectItem key={plant.id} value={plant.id}>{plant.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedCapacity">
                Capacidade Estimada Desejada
              </Label>
              <Input
                id="estimatedCapacity"
                value={formData.estimatedCapacity}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedCapacity: e.target.value }))}
                placeholder="Ex: 10 ton/hora, 50 ton/dia"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Mensagem / Requisitos Específicos
            </Label>
            <Textarea
              id="message"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Descreva suas necessidades, localização do projeto, disponibilidade de matéria-prima, etc."
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Solicitar Orçamento Personalizado
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao enviar, você concorda com nossa política de privacidade. 
            Seus dados são protegidos e não serão compartilhados.
          </p>
        </form>
      </GlassCard>
    </motion.div>
  );
}
