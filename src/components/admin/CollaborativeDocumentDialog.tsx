import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  Zap,
  CheckCircle2,
  Loader2,
  ArrowRight,
  FileText,
  Copy,
  Download,
  Eye,
  Star,
  Lightbulb,
  Play,
  FileDown,
  Edit3,
  Check,
  X,
  Languages,
  Globe,
  Search,
  SpellCheck,
  RefreshCw,
  Wand2,
  Calculator,
  BarChart3,
  Shield,
  Leaf,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateProfessionalDocument } from '@/lib/generateProfessionalDocument';

interface CollaborativeDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentGenerated?: (content: string, documentType: string) => void;
  defaultValues?: {
    companyName?: string;
    contactName?: string;
    email?: string;
    country?: string;
  };
}

interface IterationStep {
  step: string;
  provider: string;
  summary: string;
}

interface GenerationResult {
  document: string;
  iterations: IterationStep[];
  quality_score: number;
  style_suggestions: string[];
  ai_providers_used: string[];
}

const documentTypes = [
  { value: 'nda', label: '🔒 NDA - Acordo de Confidencialidade', icon: '🔒' },
   { value: 'nda_bilateral', label: '🔐 NDA Bilateral', icon: '🔐' },
   { value: 'nda_multilateral', label: '🔏 NDA Multilateral', icon: '🔏' },
  { value: 'proposal', label: '📊 Proposta Comercial', icon: '📊' },
  { value: 'loi', label: '📝 LOI - Carta de Intenção', icon: '📝' },
  { value: 'mou', label: '🤝 MOU - Memorando de Entendimento', icon: '🤝' },
  { value: 'contract', label: '📜 Contrato Comercial', icon: '📜' },
  { value: 'joint_venture', label: '🏭 Joint Venture', icon: '🏭' },
   { value: 'kyc', label: '🔍 KYC - Conheça seu Cliente', icon: '🔍' },
   { value: 'compliance', label: '⚖️ Termo de Compliance', icon: '⚖️' },
   { value: 'supply_agreement', label: '📦 Acordo de Fornecimento', icon: '📦' },
   { value: 'technology_license', label: '⚙️ Licença de Tecnologia', icon: '⚙️' },
   { value: 'distribution', label: '🌍 Acordo de Distribuição', icon: '🌍' },
  { value: 'feasibility_summary', label: '📈 Resumo Executivo de Viabilidade', icon: '📈' },
  { value: 'email_response', label: '✉️ Resposta de Email Profissional', icon: '✉️' },
   { value: 'meeting_minutes', label: '📋 Ata de Reunião', icon: '📋' },
   { value: 'power_of_attorney', label: '📄 Procuração', icon: '📄' },
  // New advanced templates
  { value: 'feasibility_study', label: '📊 Estudo de Viabilidade Técnica com ROI', icon: '📊' },
  { value: 'sustainability_report', label: '🌱 Relatório de Sustentabilidade ESG', icon: '🌱' },
  { value: 'environmental_improvement', label: '♻️ Plano de Melhorias Ambientais', icon: '♻️' },
  { value: 'due_diligence', label: '🔎 Relatório de Due Diligence', icon: '🔎' },
  { value: 'term_sheet', label: '📑 Term Sheet / Sumário de Termos', icon: '📑' },
  { value: 'investment_proposal', label: '💰 Proposta de Investimento', icon: '💰' },
  { value: 'partnership_agreement', label: '🤝 Acordo de Parceria Estratégica', icon: '🤝' },
  { value: 'service_agreement', label: '🛠️ Contrato de Prestação de Serviços', icon: '🛠️' },
  { value: 'consulting_agreement', label: '💼 Contrato de Consultoria', icon: '💼' },
  { value: 'franchise_agreement', label: '🏪 Contrato de Franquia', icon: '🏪' },
  { value: 'agency_agreement', label: '🏢 Contrato de Representação Comercial', icon: '🏢' },
  { value: 'offtake_agreement', label: '📦 Acordo de Offtake / Compra Garantida', icon: '📦' },
  { value: 'equipment_lease', label: '⚙️ Contrato de Locação de Equipamentos', icon: '⚙️' },
  { value: 'carbon_credit', label: '🌍 Contrato de Créditos de Carbono', icon: '🌍' },
  { value: 'esg_commitment', label: '🌿 Termo de Compromisso ESG', icon: '🌿' },
  { value: 'anti_corruption', label: '🛡️ Termo Anticorrupção / FCPA', icon: '🛡️' },
  { value: 'data_processing', label: '🔐 Contrato de Tratamento de Dados (DPA)', icon: '🔐' },
  { value: 'software_license', label: '💻 Licença de Software / SaaS', icon: '💻' },
  { value: 'royalty_agreement', label: '👑 Acordo de Royalties', icon: '👑' },
  { value: 'non_compete', label: '🚫 Acordo de Não-Concorrência', icon: '🚫' },
  { value: 'non_solicitation', label: '🙅 Acordo de Não-Solicitação', icon: '🙅' },
  { value: 'warranty_agreement', label: '✅ Termo de Garantia', icon: '✅' },
  { value: 'indemnity_agreement', label: '🛡️ Acordo de Indenização', icon: '🛡️' },
  { value: 'memorandum_association', label: '📜 Contrato Social / Estatuto', icon: '📜' },
  { value: 'shareholders_agreement', label: '👥 Acordo de Acionistas', icon: '👥' },
];

// Tipos de Parceiro
const partnerTypes = [
  { value: 'corporate', label: '🏢 Empresa Comercial', description: 'Parceria comercial com royalties governamentais (10% por facilitação de concessões)' },
  { value: 'ngo', label: '🌱 ONG / Associação / Instituto', description: 'Parceria com terceiro setor via Royalties Sociais Ambientais (10-20%)' },
  { value: 'government', label: '🏛️ Governo / Órgão Público', description: 'Parceria público-privada ou convênio governamental' },
];

// Tipos de Solicitação/Propósito
const requestTypes = [
  { value: 'partnership', label: '🤝 Proposta de Parceria', description: 'Iniciar nova parceria estratégica' },
  { value: 'supply', label: '📦 Fornecimento de Pneus', description: 'Acordo para fornecimento de pneus OTR' },
  { value: 'investment', label: '💰 Proposta de Investimento', description: 'Captação de investimento ou joint venture' },
  { value: 'licensing', label: '📋 Licenciamento Ambiental', description: 'Apoio em regulamentação e licenças' },
  { value: 'fiscal', label: '🏦 Incentivos Fiscais', description: 'Busca de incentivos e benefícios fiscais' },
  { value: 'technology', label: '⚙️ Transferência de Tecnologia', description: 'Licenciamento ou transferência tecnológica' },
];

const countryOptions = [
  { code: 'brazil', label: '🇧🇷 Brasil' },
  { code: 'italy', label: '🇮🇹 Italia' },
  { code: 'usa', label: '🇺🇸 United States' },
  { code: 'australia', label: '🇦🇺 Australia' },
  { code: 'mexico', label: '🇲🇽 México' },
  { code: 'china', label: '🇨🇳 中国' },
  { code: 'germany', label: '🇩🇪 Deutschland' },
  { code: 'chile', label: '🇨🇱 Chile' },
   { code: 'argentina', label: '🇦🇷 Argentina' },
   { code: 'colombia', label: '🇨🇴 Colombia' },
   { code: 'peru', label: '🇵🇪 Perú' },
   { code: 'uk', label: '🇬🇧 United Kingdom' },
   { code: 'france', label: '🇫🇷 France' },
   { code: 'spain', label: '🇪🇸 España' },
   { code: 'portugal', label: '🇵🇹 Portugal' },
   { code: 'japan', label: '🇯🇵 日本' },
   { code: 'india', label: '🇮🇳 India' },
   { code: 'south_africa', label: '🇿🇦 South Africa' },
   { code: 'uae', label: '🇦🇪 UAE' },
   { code: 'saudi_arabia', label: '🇸🇦 Saudi Arabia' },
   { code: 'indonesia', label: '🇮🇩 Indonesia' },
];

const languageOptions = [
  { code: 'pt', label: '🇧🇷 Português' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'de', label: '🇩🇪 Deutsch' },
];

const providerIcons: Record<string, React.ReactNode> = {
  groq: <Zap className="h-4 w-4 text-amber-500" />,
  gemini: <Star className="h-4 w-4 text-primary" />,
  anthropic: <Brain className="h-4 w-4 text-accent" />,
};

export function CollaborativeDocumentDialog({
  open,
  onOpenChange,
  onDocumentGenerated,
  defaultValues,
}: CollaborativeDocumentDialogProps) {
  const [documentType, setDocumentType] = useState('proposal');
  const [partnerType, setPartnerType] = useState('corporate');
  const [requestType, setRequestType] = useState('partnership');
  const [country, setCountry] = useState(defaultValues?.country || 'brazil');
  const [language, setLanguage] = useState('pt');
  const [companyName, setCompanyName] = useState(defaultValues?.companyName || '');
  const [contactName, setContactName] = useState(defaultValues?.contactName || '');
  const [email, setEmail] = useState(defaultValues?.email || '');
  const [additionalContext, setAdditionalContext] = useState('');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [currentStep, setCurrentStep] = useState(0);
  
  // New state for watermark and signature options
  const [watermarkType, setWatermarkType] = useState<'draft' | 'confidential' | 'final' | 'none'>('confidential');
  const [includeSignature, setIncludeSignature] = useState(true);
  
  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSpellChecking, setIsSpellChecking] = useState(false);
  
  // Web research toggle
  const [enableWebResearch, setEnableWebResearch] = useState(true);
  
  // Download dialog state
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadLanguage, setDownloadLanguage] = useState(language);

  // Build context with partner type information
  const buildContextWithPartnerType = () => {
    const partnerInfo = partnerTypes.find(p => p.value === partnerType);
    const requestInfo = requestTypes.find(r => r.value === requestType);
    
    let context = `TIPO DE PARCEIRO: ${partnerInfo?.label || partnerType}\n`;
    context += `DESCRIÇÃO: ${partnerInfo?.description || ''}\n`;
    context += `TIPO DE SOLICITAÇÃO: ${requestInfo?.label || requestType}\n`;
    context += `PROPÓSITO: ${requestInfo?.description || ''}\n\n`;
    
    if (additionalContext) {
      context += `CONTEXTO ADICIONAL:\n${additionalContext}`;
    }
    
    return context;
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      setCurrentStep(0);
      
      // Simulate progress through steps
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => Math.min(prev + 1, 4));
      }, 2500);

      const { data, error } = await supabase.functions.invoke('generate-collaborative-document', {
        body: {
          documentType,
          partnerType,
          requestType,
          country,
          language,
          companyName,
          contactName,
          email,
          additionalContext: buildContextWithPartnerType(),
          maxIterations: 3,
          enableWebResearch,
        },
      });

      clearInterval(stepInterval);
      setCurrentStep(5);

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data as GenerationResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setEditedContent(data.document);
      setActiveTab('result');
      toast.success(`Documento gerado com score ${data.quality_score}/100`, {
        description: `${data.iterations.length} iterações de refinamento usando ${data.ai_providers_used.join(', ')}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erro ao gerar documento', { description: error.message });
      setCurrentStep(0);
    },
  });

  const handleCopy = () => {
    const content = isEditing ? editedContent : result?.document;
    if (content) {
      navigator.clipboard.writeText(content);
      toast.success('Documento copiado!');
    }
  };

  const handleUseDocument = useCallback(() => {
    const content = editedContent || result?.document;
    if (content) {
      if (onDocumentGenerated) {
        onDocumentGenerated(content, documentType);
      }
      toast.success('Documento aplicado ao editor');
      onOpenChange(false);
    } else {
      toast.error('Nenhum documento disponível');
    }
  }, [editedContent, result, documentType, onDocumentGenerated, onOpenChange]);

  const handleDownloadPDF = async (selectedLanguage?: string) => {
    const content = editedContent || result?.document;
    if (!content) return;

    const langToUse = selectedLanguage || downloadLanguage;
    
    // Professional subtitle for legal department
    const legalSubtitles: Record<string, string> = {
      pt: 'Departamento Jurídico Internacional',
      en: 'International Legal Department',
      es: 'Departamento Jurídico Internacional',
      it: 'Dipartimento Legale Internazionale',
      zh: '国际法务部',
      de: 'Internationale Rechtsabteilung',
    };

    try {
      const docTypeLabel = documentTypes.find(d => d.value === documentType)?.label.replace(/^[^\w]+/, '').trim() || documentType;
      
      await generateProfessionalDocument({
        title: docTypeLabel,
        subtitle: `${legalSubtitles[langToUse] || legalSubtitles.en} • ELP Green Technology`,
        content: content,
        language: langToUse as 'pt' | 'en' | 'es' | 'zh' | 'it',
        documentType: documentType,
        companyName: companyName || undefined,
        contactName: contactName || undefined,
        email: email || undefined,
        country: country || undefined,
        includeSignature: includeSignature && ['nda', 'loi', 'mou', 'contract', 'joint_venture'].includes(documentType),
        includeQRCode: false,
        watermarkType: watermarkType,
        includeDocumentNumber: true,
      });

      setShowDownloadDialog(false);
      toast.success('PDF gerado com sucesso!', {
        description: 'O download iniciará automaticamente.',
      });
    } catch (err: any) {
      toast.error('Erro ao gerar PDF', { description: err.message });
    }
  };
  
  const openDownloadDialog = () => {
    setDownloadLanguage(language);
    setShowDownloadDialog(true);
  };

  // Spell check and grammar correction using AI
  const handleSpellCheck = async () => {
    if (!editedContent) return;
    
    setIsSpellChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-collaborative-document', {
        body: {
          documentType: 'spell_check',
          language,
          additionalContext: `CORREÇÃO ORTOGRÁFICA E GRAMATICAL:
          
Corrija APENAS erros de ortografia, gramática e pontuação no texto abaixo.
NÃO altere o conteúdo ou estrutura do documento.
Retorne o texto corrigido mantendo a mesma formatação.

TEXTO PARA CORREÇÃO:
${editedContent}`,
          maxIterations: 1,
        },
      });

      if (error) throw error;
      if (data?.document) {
        setEditedContent(data.document);
        toast.success('Correção ortográfica aplicada!');
      }
    } catch (err: any) {
      toast.error('Erro na correção', { description: err.message });
    } finally {
      setIsSpellChecking(false);
    }
  };

  // Enhance document with AI
  const handleEnhanceDocument = async () => {
    if (!editedContent) return;
    
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-collaborative-document', {
        body: {
          documentType: 'enhancement',
          language,
          country,
          companyName,
          additionalContext: `APRIMORAMENTO DO DOCUMENTO:
          
Aprimore e complemente o documento abaixo mantendo a estrutura e adicionando:
- Mais detalhes técnicos e jurídicos relevantes
- Cláusulas de proteção para a ELP Green
- Linguagem mais persuasiva e profissional
- Dados de mercado e referências legais atualizadas

DOCUMENTO PARA APRIMORAR:
${editedContent}`,
          maxIterations: 2,
        },
      });

      if (error) throw error;
      if (data?.document) {
        setEditedContent(data.document);
        toast.success('Documento aprimorado com sucesso!');
      }
    } catch (err: any) {
      toast.error('Erro ao aprimorar', { description: err.message });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Saving changes
      if (result) {
        setResult({
          ...result,
          document: editedContent,
        });
      }
      toast.success('Alterações salvas!');
    }
    setIsEditing(!isEditing);
  };

  const stepLabels = [
    { label: 'Pesquisa Web', provider: 'web', desc: 'Buscando leis e articulações jurídicas...' },
    { label: 'Rascunho', provider: 'groq', desc: 'Gerando estrutura base com legislação...' },
    { label: 'Aprimoramento', provider: 'gemini', desc: 'Refinando linguagem e estilo...' },
    { label: 'Revisão', provider: 'anthropic', desc: 'Verificação jurídica e compliance...' },
    { label: 'Consenso', provider: 'all', desc: 'Validando qualidade final...' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            Gerador de Documentos com IA Colaborativa
          </DialogTitle>
          <DialogDescription>
            Múltiplas IAs trabalhando juntas para criar documentos profissionais com pesquisa web de leis e articulação jurídica
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-3 mb-4 flex-shrink-0">
            <TabsTrigger value="form" className="gap-2">
              <FileText className="h-4 w-4" />
              Configurar
            </TabsTrigger>
            <TabsTrigger value="progress" disabled={!generateMutation.isPending}>
              <Loader2 className={`h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
              Processando
            </TabsTrigger>
            <TabsTrigger value="result" disabled={!result}>
              <CheckCircle2 className="h-4 w-4" />
              Resultado
            </TabsTrigger>
          </TabsList>

          {/* FORM TAB with ScrollArea */}
          <TabsContent value="form" className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-4">
                {/* Partner Type Selection - NEW */}
                <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
                  <CardContent className="pt-4">
                    <Label className="text-sm font-semibold mb-3 block">Tipo de Parceiro</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {partnerTypes.map(pt => (
                        <button
                          key={pt.value}
                          type="button"
                          onClick={() => setPartnerType(pt.value)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            partnerType === pt.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="font-medium text-sm">{pt.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{pt.description}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Request Type Selection - NEW */}
                <Card className="border-muted">
                  <CardContent className="pt-4">
                    <Label className="text-sm font-semibold mb-3 block">Propósito / Tipo de Solicitação</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {requestTypes.map(rt => (
                        <button
                          key={rt.value}
                          type="button"
                          onClick={() => setRequestType(rt.value)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            requestType === rt.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="font-medium text-xs">{rt.label}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Documento</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map(dt => (
                          <SelectItem key={dt.value} value={dt.value}>
                            {dt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>País / Jurisdição</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map(c => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      Idioma do Documento
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map(l => (
                          <SelectItem key={l.code} value={l.code}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Empresa Parceira</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Nome da empresa..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nome do Contato</Label>
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Nome completo..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@empresa.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contexto Adicional (opcional)</Label>
                  <Textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Informações específicas sobre a negociação, valores, prazos, condições especiais..."
                    rows={3}
                  />
                </div>

                {/* Web Research Toggle */}
                <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <Globe className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Pesquisa Web de Legislação
                          </div>
                          <p className="text-sm text-muted-foreground">
                            IA pesquisa leis, artigos jurídicos e regulamentações atualizadas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={enableWebResearch} 
                          onChange={(e) => setEnableWebResearch(e.target.checked)}
                          className="h-5 w-5"
                        />
                        <span className="text-sm font-medium">{enableWebResearch ? 'Ativado' : 'Desativado'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Watermark and Signature Options */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-2">
                    <Label>Marca d'água</Label>
                    <Select value={watermarkType} onValueChange={(v: any) => setWatermarkType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confidential">🔒 Confidencial</SelectItem>
                        <SelectItem value="draft">📝 Rascunho</SelectItem>
                        <SelectItem value="final">✅ Final</SelectItem>
                        <SelectItem value="none">❌ Sem marca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assinatura Digital e Numeração</Label>
                    <div className="flex items-center gap-2 h-10">
                      <input 
                        type="checkbox" 
                        checked={includeSignature} 
                        onChange={(e) => setIncludeSignature(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-muted-foreground">Incluir página de assinatura com código de verificação</span>
                    </div>
                  </div>
                </div>

                {/* AI Pipeline Info */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Pipeline de IA Colaborativa</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {stepLabels.map((step, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 text-xs text-muted-foreground text-center">
                          {step.provider === 'web' ? (
                            <Globe className="h-4 w-4 text-blue-500" />
                          ) : (
                            providerIcons[step.provider] || <Brain className="h-3 w-3" />
                          )}
                          <span>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => {
                    setActiveTab('progress');
                    generateMutation.mutate();
                  }}
                  disabled={generateMutation.isPending || !companyName.trim()}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90"
                  size="lg"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  <span className="text-lg font-semibold">Iniciar Geração com IA</span>
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* PROGRESS TAB */}
          <TabsContent value="progress" className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-4">
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Gerando documento profissional...</span>
                  </div>
                  <Progress value={(currentStep / 5) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  {stepLabels.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: currentStep >= i ? 1 : 0.4,
                        x: 0,
                      }}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        currentStep === i 
                          ? 'border-primary bg-primary/5' 
                          : currentStep > i 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : 'border-muted'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        currentStep === i 
                          ? 'bg-primary text-primary-foreground' 
                          : currentStep > i 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted'
                      }`}>
                        {currentStep > i ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : currentStep === i ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : step.provider === 'web' ? (
                          <Globe className="h-4 w-4" />
                        ) : (
                          providerIcons[step.provider] || <Brain className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium">{step.label}</div>
                        <div className="text-sm text-muted-foreground">{step.desc}</div>
                      </div>

                      <Badge variant="outline" className="gap-1">
                        {step.provider === 'web' ? (
                          <Globe className="h-3 w-3 text-blue-500" />
                        ) : (
                          providerIcons[step.provider]
                        )}
                        {step.provider}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* RESULT TAB */}
          <TabsContent value="result" className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              {result && (
                <div className="space-y-4 pb-4">
                  {/* Score and Stats */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-green-500/10 border">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{result.quality_score}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <div className="h-10 w-px bg-border" />
                      <div className="text-center">
                        <div className="text-xl font-semibold">{result.iterations.length}</div>
                        <div className="text-xs text-muted-foreground">Iterações</div>
                      </div>
                      <div className="h-10 w-px bg-border" />
                      <div className="flex gap-1">
                        {result.ai_providers_used.map(p => (
                          <Badge key={p} variant="secondary" className="gap-1">
                            {providerIcons[p]}
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                        <Copy className="h-4 w-4" />
                        Copiar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={openDownloadDialog} 
                        className="gap-2 border-green-500/50 text-green-600 hover:bg-green-500/10"
                      >
                        <FileDown className="h-4 w-4" />
                        Baixar PDF
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleUseDocument} 
                        className="gap-2 bg-primary hover:bg-primary/90"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Usar Documento
                      </Button>
                    </div>
                  </div>

                  {/* Editing Tools Bar */}
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={toggleEditMode}
                      className="gap-2"
                    >
                      {isEditing ? (
                        <>
                          <Check className="h-4 w-4" />
                          Salvar
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-4 w-4" />
                          Editar
                        </>
                      )}
                    </Button>
                    
                    <div className="h-6 w-px bg-border" />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSpellCheck}
                      disabled={isSpellChecking || !editedContent}
                      className="gap-2"
                    >
                      {isSpellChecking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SpellCheck className="h-4 w-4" />
                      )}
                      Correção Ortográfica
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEnhanceDocument}
                      disabled={isEnhancing || !editedContent}
                      className="gap-2"
                    >
                      {isEnhancing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      Complementar com IA
                    </Button>
                    
                    <div className="h-6 w-px bg-border" />
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Languages className="h-4 w-4" />
                      <span>{languageOptions.find(l => l.code === language)?.label}</span>
                    </div>
                  </div>

                  {/* Iterations Timeline */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Histórico de Refinamento
                    </Label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {result.iterations.map((iter, i) => (
                        <Card key={i} className="min-w-[200px] flex-shrink-0">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              {providerIcons[iter.provider]}
                              <span className="font-medium text-sm">{iter.step}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{iter.summary}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Style Suggestions */}
                  {result.style_suggestions.length > 0 && (
                    <div className="space-y-2">
                      <Label>Sugestões de Melhoria</Label>
                      <div className="flex flex-wrap gap-2">
                        {result.style_suggestions.map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Document Preview/Editor */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Edit3 className="h-4 w-4 text-primary" />
                          Editando Documento
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Visualização do Documento
                        </>
                      )}
                    </Label>
                    
                    {isEditing ? (
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                        placeholder="Conteúdo do documento..."
                      />
                    ) : (
                      <ScrollArea className="h-[400px] border rounded-lg p-4 bg-card">
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                          {editedContent || result.document}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Download Language Selection Dialog */}
        <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                Selecionar Idioma do PDF
              </DialogTitle>
              <DialogDescription>
                Escolha o idioma para o documento final antes de baixar.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                {languageOptions.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={downloadLanguage === lang.code ? "default" : "outline"}
                    className={`h-14 flex flex-col gap-1 ${
                      downloadLanguage === lang.code 
                        ? 'ring-2 ring-primary' 
                        : ''
                    }`}
                    onClick={() => setDownloadLanguage(lang.code)}
                  >
                    <span className="text-lg">{lang.label.split(' ')[0]}</span>
                    <span className="text-xs opacity-80">{lang.label.split(' ').slice(1).join(' ')}</span>
                  </Button>
                ))}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleDownloadPDF(downloadLanguage)}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
