import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR, enUS, es, it, zhCN } from 'date-fns/locale';
import { 
  FileText, 
  Download, 
  Eye, 
  Loader2, 
  Sparkles, 
  ClipboardPaste,
  Calendar,
  User,
  Hash,
  Briefcase,
  FileCheck,
  CheckCircle,
  AlertCircle,
  Globe,
  Wand2,
  Send,
  ExternalLink,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { generateELPReportPDF, type SupportedLanguage, type PDFSigner } from '@/lib/generateELPReportPDF';
import { MultipleSignersManager, type Signer } from './MultipleSignersManager';
import logoElpNew from '@/assets/logo-elp-new.png';

// Language labels for translation
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  pt: 'Português',
  en: 'English', 
  es: 'Español',
  it: 'Italiano',
  zh: '中文'
};

// Date locale mapping
const DATE_LOCALES = {
  pt: ptBR,
  en: enUS,
  es: es,
  it: it,
  zh: zhCN
};

// Language options
const LANGUAGE_OPTIONS = [
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
];

// Document type options for AI generation
const DOCUMENT_TYPE_OPTIONS = [
  { value: 'report', label: 'Relatório / Report', icon: FileText },
  { value: 'proposal', label: 'Proposta Comercial / Proposal', icon: Briefcase },
  { value: 'contract', label: 'Contrato / Contract', icon: FileCheck },
  { value: 'loi', label: 'Letter of Intent (LOI)', icon: Send },
  { value: 'mou', label: 'Memorandum of Understanding (MOU)', icon: FileText },
  { value: 'analysis', label: 'Análise Técnica / Analysis', icon: Brain },
  { value: 'custom', label: 'Personalizado / Custom', icon: Wand2 },
];

// Sample meeting report text
const SAMPLE_REPORT = `REUNIÃO ESTRATÉGICA – DESTINAÇÃO DE PNEUS OTR

PARTICIPANTES:
- Eryon Piccoli – Diretor, ELP Green Technology
- João Silva – Gerente de Operações, Mineradora XYZ
- Maria Santos – Diretora de Sustentabilidade, Grupo ABC

OBJETIVO:
Discutir parceria estratégica para destinação e reciclagem de pneus OTR (Off-the-Road) provenientes das operações de mineração.

TÓPICOS DISCUTIDOS:

1. Volume de pneus OTR gerados mensalmente pela operação
   - Estimativa de 50 a 80 unidades/mês de pneus categoria gigante (>57")
   - Peso médio de 3.500 kg por unidade
   - Armazenamento atual em pátio próprio

2. Solução proposta pela ELP Green Technology
   - Instalação de linha Smart OTR robótica para processamento local
   - Recuperação de materiais: borracha granulada (43%), aço (25%), têxtil (8%), rCB (12%)
   - Modelo de parceria joint venture com royalties de 10%

3. Benefícios ambientais e ESG
   - Eliminação de passivo ambiental
   - Créditos de carbono estimados em 1,5 tCO2e por tonelada processada
   - Alinhamento com metas SDG 12, 13 e 15
   - Relatório ESG auditável para stakeholders

4. Cronograma preliminar
   - Assinatura de LOI: Janeiro/2026
   - Due diligence técnica: Fevereiro-Março/2026
   - Instalação de equipamentos: Abril-Agosto/2026
   - Início das operações: Setembro/2026

PRÓXIMOS PASSOS:
☐ ELP Green enviar proposta comercial detalhada até 05/02/2026
☐ Mineradora XYZ fornecer dados de volume histórico
☐ Agendar visita técnica às instalações da ELP em São Paulo
☐ Análise jurídica do modelo de joint venture

Esta ata foi elaborada como registro oficial da reunião realizada.`;

interface ReportData {
  title: string;
  date: Date;
  documentNumber: string;
  signatoryName: string;
  signatoryPosition: string;
  content: string;
  includeExecutiveSummary: boolean;
  executiveSummary: string;
  language: SupportedLanguage;
}

export function ELPReportGenerator() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Get current language from i18n as default
  const currentLang = (i18n.language as SupportedLanguage) || 'pt';
  
  const [reportData, setReportData] = useState<ReportData>({
    title: 'Relatório de Reunião Estratégica – ELP Green Technology',
    date: new Date(),
    documentNumber: `REL-ELP-${String(new Date().getMonth() + 1).padStart(2, '0')}${new Date().getFullYear().toString().slice(-2)}-001`,
    signatoryName: 'Eryon Piccoli',
    signatoryPosition: 'Diretor – ELP Green Technology',
    content: '',
    includeExecutiveSummary: false,
    executiveSummary: '',
    language: currentLang,
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCorrectingGrammar, setIsCorrectingGrammar] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [grammarCorrected, setGrammarCorrected] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [selectedPdfLanguage, setSelectedPdfLanguage] = useState<SupportedLanguage>(currentLang);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  
  // AI Document Generation State
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('report');
  const [includeWebResearch, setIncludeWebResearch] = useState(true);
  
  // Multiple Signers State
  const [enableMultipleSignatures, setEnableMultipleSignatures] = useState(false);
  const [signers, setSigners] = useState<Signer[]>([]);
  
  // Get date locale based on selected language
  const selectedDateLocale = DATE_LOCALES[reportData.language] || ptBR;

  const updateField = <K extends keyof ReportData>(field: K, value: ReportData[K]) => {
    setReportData(prev => ({ ...prev, [field]: value }));
    if (field === 'content') {
      setGrammarCorrected(false);
    }
  };

  const handlePasteExample = () => {
    updateField('content', SAMPLE_REPORT);
    toast({ title: 'Exemplo colado', description: 'Texto de exemplo adicionado ao editor.' });
  };

  const handleCorrectGrammar = async () => {
    if (!reportData.content.trim()) {
      toast({ title: 'Erro', description: 'Digite ou cole o conteúdo do relatório primeiro.', variant: 'destructive' });
      return;
    }

    setIsCorrectingGrammar(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-hub', {
        body: {
          action: 'correct_grammar',
          text: reportData.content,
          language: 'pt-BR',
          style: 'formal_business'
        }
      });

      if (error) throw error;

      if (data?.correctedText) {
        updateField('content', data.correctedText);
        setGrammarCorrected(true);
        toast({ 
          title: 'Texto corrigido!', 
          description: 'Gramática e formatação foram aprimoradas.',
        });
      }
    } catch (error) {
      console.error('Grammar correction error:', error);
      toast({ 
        title: 'Erro ao corrigir', 
        description: 'Não foi possível processar o texto. Tente novamente.',
        variant: 'destructive' 
      });
    } finally {
      setIsCorrectingGrammar(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!reportData.content.trim()) {
      toast({ title: 'Erro', description: 'Digite ou cole o conteúdo do relatório primeiro.', variant: 'destructive' });
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-hub', {
        body: {
          action: 'generate_summary',
          text: reportData.content,
          maxLines: 8,
          language: 'pt-BR'
        }
      });

      if (error) throw error;

      if (data?.summary) {
        updateField('executiveSummary', data.summary);
        updateField('includeExecutiveSummary', true);
        toast({ 
          title: 'Resumo gerado!', 
          description: 'Resumo executivo criado com sucesso.',
        });
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      toast({ 
        title: 'Erro ao gerar resumo', 
        description: 'Não foi possível gerar o resumo. Tente novamente.',
        variant: 'destructive' 
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Open language selection dialog
  const handleOpenLanguageDialog = () => {
    if (!reportData.content.trim()) {
      toast({ title: 'Erro', description: 'O conteúdo do relatório não pode estar vazio.', variant: 'destructive' });
      return;
    }
    setSelectedPdfLanguage(reportData.language);
    setShowLanguageDialog(true);
  };

  // Generate document using AI
  const handleGenerateWithAI = async () => {
    if (!documentDescription.trim()) {
      toast({ title: 'Erro', description: 'Descreva o documento que deseja gerar.', variant: 'destructive' });
      return;
    }

    setIsGeneratingDocument(true);
    try {
      toast({ 
        title: 'Gerando documento com IA...', 
        description: includeWebResearch ? 'Pesquisando na internet e elaborando...' : 'Elaborando documento...',
      });

      const { data, error } = await supabase.functions.invoke('ai-hub', {
        body: {
          action: 'generate_document',
          documentDescription: documentDescription,
          documentType: selectedDocumentType,
          targetLanguage: reportData.language,
          includeWebResearch: includeWebResearch,
        }
      });

      if (error) throw error;

      if (data?.generatedDocument) {
        updateField('content', data.generatedDocument);
        setActiveTab('manual');
        toast({ 
          title: 'Documento gerado com sucesso!', 
          description: data.webResearchSummary || `Documento elaborado pela IA (${data.provider})`,
        });
      }
    } catch (error) {
      console.error('Document generation error:', error);
      toast({ 
        title: 'Erro ao gerar documento', 
        description: 'Não foi possível gerar o documento. Tente novamente.',
        variant: 'destructive' 
      });
    } finally {
      setIsGeneratingDocument(false);
    }
  };

  // Translate content using AI
  const translateContent = async (text: string, targetLang: SupportedLanguage): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-hub', {
        body: {
          action: 'translate_document',
          text,
          targetLanguage: targetLang,
          sourceLanguage: 'auto',
          preserveFormatting: true
        }
      });

      if (error) throw error;
      return data?.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  };

  // Generate PDF with optional translation
  const handleGeneratePDF = async () => {
    setShowLanguageDialog(false);
    setIsGenerating(true);

    try {
      let finalContent = reportData.content;
      let finalTitle = reportData.title;
      let finalSummary = reportData.executiveSummary;
      let finalSignatoryPosition = reportData.signatoryPosition;

      // Detect if content appears to be in Portuguese (common words)
      const looksLikePortuguese = /\b(de|da|do|para|com|uma|dos|das|pela|pelo|entre|sobre|foi|foram|que|são|não|também)\b/i.test(reportData.content);
      const sourceLanguage = looksLikePortuguese ? 'pt' : reportData.language;
      
      console.log('PDF Generation - Selected language:', selectedPdfLanguage, 'Source detected:', sourceLanguage, 'Form language:', reportData.language);

      // Translate if target language is different from detected source language
      if (selectedPdfLanguage !== sourceLanguage) {
        setIsTranslating(true);
        toast({ 
          title: `Traduzindo para ${LANGUAGE_NAMES[selectedPdfLanguage]}...`, 
          description: 'A IA está traduzindo o documento.',
        });

        // Translate content, title, summary, and position in parallel
        const [translatedContent, translatedTitle, translatedSummary, translatedPosition] = await Promise.all([
          translateContent(reportData.content, selectedPdfLanguage),
          translateContent(reportData.title, selectedPdfLanguage),
          reportData.executiveSummary ? translateContent(reportData.executiveSummary, selectedPdfLanguage) : Promise.resolve(''),
          translateContent(reportData.signatoryPosition, selectedPdfLanguage),
        ]);

        finalContent = translatedContent;
        finalTitle = translatedTitle;
        finalSummary = translatedSummary;
        finalSignatoryPosition = translatedPosition;
        
        console.log('Translation completed. Content length:', finalContent.length);
        setIsTranslating(false);
      }

      // First, save document to database to get an ID for the QR code signing link
      const signersData = enableMultipleSignatures && signers.length > 0
        ? signers.map(s => ({ 
            name: s.name, 
            email: s.email || '', 
            role: s.role || '', 
            order: s.order, 
            status: 'pending' as const
          }))
        : [{ 
            name: reportData.signatoryName, 
            email: '', 
            role: reportData.signatoryPosition, 
            order: 1, 
            status: 'pending' as const
          }];

      console.log('Saving document with signers:', signersData);

      // Determine first signer info
      const firstSignerName = signersData[0]?.name || reportData.signatoryName;
      const firstSignerEmail = signersData[0]?.email || null;

      const insertData = {
        document_name: finalTitle,
        document_type: 'elp_report',
        language: selectedPdfLanguage,
        field_values: {
          date: reportData.date.toISOString(),
          content: reportData.content,
          summary: reportData.executiveSummary,
          documentNumber: reportData.documentNumber,
          signatoryName: reportData.signatoryName,
          signatoryPosition: reportData.signatoryPosition,
          signers: signersData,
        },
        signature_status: 'pending',
        required_signatures: signersData.length,
        current_signatures: 0,
        pending_signer_name: firstSignerName,
        pending_signer_email: firstSignerEmail,
        all_signatures_data: [],
      };

      console.log('Insert data prepared:', JSON.stringify(insertData, null, 2));

      const { data: savedDoc, error: saveError } = await supabase
        .from('generated_documents')
        .insert(insertData)
        .select()
        .single();

      if (saveError) {
        console.error('Error saving document:', saveError);
        toast({ 
          title: 'Erro ao salvar documento', 
          description: saveError.message,
          variant: 'destructive' 
        });
        // Continue without document ID - QR will use hash-based verification
      } else {
        console.log('Document saved successfully:', savedDoc?.id);
      }

      const documentId = savedDoc?.id;

      // Generate PDF with document ID for QR code and signers list
      const pdfSigners: PDFSigner[] | undefined = enableMultipleSignatures && signers.length > 0
        ? signers.map(s => ({
            name: s.name,
            email: s.email || '',
            role: s.role || '',
            order: s.order,
            status: 'pending' as const
          }))
        : undefined;

      await generateELPReportPDF({
        ...reportData,
        content: finalContent,
        title: finalTitle,
        executiveSummary: finalSummary,
        signatoryPosition: finalSignatoryPosition,
        language: selectedPdfLanguage,
        documentId: documentId,
        signers: pdfSigners,
      });

      toast({ 
        title: 'PDF gerado com sucesso!', 
        description: documentId 
          ? `Relatório ${reportData.documentNumber} salvo e pronto para assinatura digital.`
          : `Relatório ${reportData.documentNumber} em ${LANGUAGE_NAMES[selectedPdfLanguage]} baixado.`,
      });

      // If multiple signers enabled and first signer has email, trigger notification
      if (documentId && enableMultipleSignatures && signers.length > 0 && signers[0].email) {
        try {
          await supabase.functions.invoke('notify-next-signer', {
            body: { documentId }
          });
          toast({ 
            title: 'Notificação enviada!', 
            description: `E-mail enviado para ${signers[0].name} (${signers[0].email})`,
          });
        } catch (notifyError) {
          console.error('Failed to notify first signer:', notifyError);
        }
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ 
        title: 'Erro ao gerar PDF', 
        description: 'Não foi possível gerar o PDF. Tente novamente.',
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
      setIsTranslating(false);
    }
  };

  const formatReportContent = (content: string) => {
    // Parse content into structured sections
    const lines = content.split('\n');
    const sections: { type: 'title' | 'subtitle' | 'list' | 'checkbox' | 'paragraph'; text: string }[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Check for main sections (all caps or ending with :)
      if (/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s\-–]+:?$/.test(trimmed) && trimmed.length < 80) {
        sections.push({ type: 'title', text: trimmed.replace(/:$/, '') });
      }
      // Numbered items
      else if (/^\d+\./.test(trimmed)) {
        sections.push({ type: 'subtitle', text: trimmed });
      }
      // Checkbox items
      else if (/^☐|^\[\s?\]/.test(trimmed)) {
        sections.push({ type: 'checkbox', text: trimmed.replace(/^☐|^\[\s?\]/, '').trim() });
      }
      // Bullet points
      else if (/^[-•]/.test(trimmed)) {
        sections.push({ type: 'list', text: trimmed.replace(/^[-•]\s*/, '') });
      }
      else {
        sections.push({ type: 'paragraph', text: trimmed });
      }
    });
    
    return sections;
  };

  const previewSections = formatReportContent(reportData.content);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary text-primary-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">ELP Report Generator</CardTitle>
              <CardDescription>
                Gerador de relatórios empresariais profissionais com assinatura digital e QR Code
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Input Form */}
        <div className="space-y-4">
          {/* Document Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Informações do Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título do Relatório</Label>
                <Input
                  id="title"
                  value={reportData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Relatório de Reunião Estratégica..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data da Reunião
                  </Label>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        {format(reportData.date, "dd 'de' MMMM 'de' yyyy", { locale: selectedDateLocale })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={reportData.date}
                        onSelect={(date) => {
                          if (date) {
                            updateField('date', date);
                            setDatePickerOpen(false);
                          }
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Document Number */}
                <div className="space-y-2">
                  <Label htmlFor="docNumber" className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Número do Documento
                  </Label>
                  <Input
                    id="docNumber"
                    value={reportData.documentNumber}
                    onChange={(e) => updateField('documentNumber', e.target.value)}
                    placeholder="REL-ELP-001/2026"
                  />
                </div>
              </div>

              <Separator />

              {/* Language Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Idioma do Relatório / Report Language
                </Label>
                <Select
                  value={reportData.language}
                  onValueChange={(value: SupportedLanguage) => updateField('language', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Signatory Name */}
                <div className="space-y-2">
                  <Label htmlFor="signatoryName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome do Signatário
                  </Label>
                  <Input
                    id="signatoryName"
                    value={reportData.signatoryName}
                    onChange={(e) => updateField('signatoryName', e.target.value)}
                    placeholder="Eryon Piccoli"
                  />
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label htmlFor="position" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Cargo
                  </Label>
                  <Input
                    id="position"
                    value={reportData.signatoryPosition}
                    onChange={(e) => updateField('signatoryPosition', e.target.value)}
                    placeholder="Diretor – ELP Green Technology"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor with AI Generation Tab */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Conteúdo do Documento
              </CardTitle>
              <CardDescription>
                Crie manualmente ou deixe a IA gerar o documento automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manual' | 'ai')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Edição Manual
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="gap-2">
                    <Brain className="h-4 w-4" />
                    Gerar com IA
                  </TabsTrigger>
                </TabsList>

                {/* Manual Tab */}
                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {grammarCorrected && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Corrigido
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePasteExample}
                    >
                      <ClipboardPaste className="h-4 w-4 mr-2" />
                      Colar Exemplo
                    </Button>
                  </div>

                  <Textarea
                    value={reportData.content}
                    onChange={(e) => updateField('content', e.target.value)}
                    placeholder="Cole aqui o conteúdo completo do seu relatório ou ata de reunião..."
                    className="min-h-[250px] font-mono text-sm leading-relaxed"
                  />

                  {/* AI Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCorrectGrammar}
                      disabled={isCorrectingGrammar || !reportData.content.trim()}
                    >
                      {isCorrectingGrammar ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                      )}
                      Corrigir Gramática (IA)
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary || !reportData.content.trim()}
                    >
                      {isGeneratingSummary ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                      )}
                      Gerar Resumo Executivo
                    </Button>
                  </div>
                </TabsContent>

                {/* AI Generation Tab */}
                <TabsContent value="ai" className="space-y-4 mt-4">
                  <div className="p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Geração Inteligente de Documentos</h4>
                        <p className="text-sm text-muted-foreground">
                          A IA irá pesquisar na internet, consultar legislação e criar um documento profissional completo
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Document Type */}
                      <div className="space-y-2">
                        <Label>Tipo de Documento</Label>
                        <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_TYPE_OPTIONS.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <span className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label>Descreva o Documento Desejado</Label>
                        <Textarea
                          value={documentDescription}
                          onChange={(e) => setDocumentDescription(e.target.value)}
                          placeholder="Exemplo: Criar uma proposta comercial para parceria de reciclagem de pneus OTR com mineradora no Chile, incluindo modelo de joint venture com royalties de 12%, cronograma de instalação da planta de pirólise e projeções financeiras de 5 anos..."
                          className="min-h-[150px] text-sm"
                        />
                      </div>

                      {/* Web Research Toggle */}
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <div>
                            <Label htmlFor="webResearch" className="font-medium">Pesquisar na Internet</Label>
                            <p className="text-xs text-muted-foreground">Consultar leis, regulamentações e melhores práticas</p>
                          </div>
                        </div>
                        <Checkbox
                          id="webResearch"
                          checked={includeWebResearch}
                          onCheckedChange={(checked) => setIncludeWebResearch(!!checked)}
                        />
                      </div>

                      {/* Generate Button */}
                      <Button
                        onClick={handleGenerateWithAI}
                        disabled={isGeneratingDocument || !documentDescription.trim()}
                        className="w-full gap-2"
                        size="lg"
                      >
                        {isGeneratingDocument ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {includeWebResearch ? 'Pesquisando e Gerando...' : 'Gerando Documento...'}
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-5 w-5" />
                            Gerar Documento com IA
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Executive Summary - Always visible */}
              <Separator />
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeSummary"
                    checked={reportData.includeExecutiveSummary}
                    onCheckedChange={(checked) => updateField('includeExecutiveSummary', !!checked)}
                  />
                  <Label htmlFor="includeSummary" className="text-sm font-medium cursor-pointer">
                    Incluir Resumo Executivo no início
                  </Label>
                </div>
                
                {reportData.includeExecutiveSummary && (
                  <Textarea
                    value={reportData.executiveSummary}
                    onChange={(e) => updateField('executiveSummary', e.target.value)}
                    placeholder="Resumo executivo de 5-8 linhas..."
                    className="min-h-[100px] text-sm"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Multiple Signers Manager */}
          <MultipleSignersManager
            signers={signers}
            onSignersChange={setSigners}
            enableMultipleSignatures={enableMultipleSignatures}
            onEnableMultipleSignaturesChange={setEnableMultipleSignatures}
          />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1 sm:flex-none"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
            </Button>
            
            <Button
              onClick={handleOpenLanguageDialog}
              disabled={isGenerating || isTranslating || !reportData.content.trim()}
              className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
            >
              {isGenerating || isTranslating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isTranslating ? 'Traduzindo...' : isGenerating ? 'Gerando...' : 'Gerar Relatório PDF'}
            </Button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <Card className={cn("overflow-hidden transition-all", !showPreview && "lg:opacity-50")}>
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Prévia do Documento
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                A4 Portrait
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[700px]">
              <div 
                ref={previewRef}
                className="p-6 bg-white text-gray-900 min-h-[700px] relative"
                style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
              >
                {/* Official Stamp Watermark */}
                <div 
                  className="absolute top-20 right-6 rotate-[-15deg] border-4 border-primary/20 rounded-lg px-4 py-2 opacity-25"
                  style={{ 
                    borderColor: 'rgba(26, 39, 68, 0.3)',
                    color: 'rgba(26, 39, 68, 0.4)'
                  }}
                >
                  <div className="text-center">
                    <div className="font-bold text-sm">DOCUMENTO OFICIAL</div>
                    <div className="text-xs">ELP GREEN TECHNOLOGY</div>
                    <div className="text-xs">{format(new Date(), 'dd/MM/yyyy HH:mm')}</div>
                  </div>
                </div>

                {/* Header */}
                <div className="border-b-2 pb-3 mb-6" style={{ borderColor: '#1a2744' }}>
                  {/* Navy blue top stripe */}
                  <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: '#1a2744' }} />
                  
                  <div className="flex items-center justify-between mt-1">
                    {/* ELP Logo */}
                    <img 
                      src={logoElpNew} 
                      alt="ELP Green Technology" 
                      className="h-10 w-auto"
                    />
                    <div className="text-right text-xs leading-tight">
                      <div className="font-bold text-sm" style={{ color: '#1a2744' }}>
                        {reportData.documentNumber}
                      </div>
                      <div className="text-gray-500">
                        {format(reportData.date, selectedDateLocale === ptBR ? "dd 'de' MMMM 'de' yyyy" : 'PP', { locale: selectedDateLocale })}
                      </div>
                      <div className="text-gray-400 text-[10px]">www.elpgreen.com</div>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2 
                  className="text-base font-bold text-center mb-6 uppercase tracking-wide"
                  style={{ color: '#1a2744' }}
                >
                  {reportData.title}
                </h2>

                {/* Executive Summary */}
                {reportData.includeExecutiveSummary && reportData.executiveSummary && (
                  <div className="mb-6 p-4 bg-gray-50 rounded border-l-4" style={{ borderColor: '#1a2744' }}>
                    <h3 className="font-bold text-sm mb-2" style={{ color: '#1a2744' }}>
                      RESUMO EXECUTIVO
                    </h3>
                    <p className="text-sm text-justify leading-relaxed text-gray-700">
                      {reportData.executiveSummary}
                    </p>
                  </div>
                )}

                {/* Content */}
                <div className="space-y-3 text-sm">
                  {previewSections.map((section, idx) => {
                    if (section.type === 'title') {
                      return (
                        <h3 
                          key={idx} 
                          className="font-bold text-sm mt-4 mb-2 border-b pb-1"
                          style={{ color: '#1a2744', borderColor: '#1a2744' }}
                        >
                          {section.text}
                        </h3>
                      );
                    }
                    if (section.type === 'subtitle') {
                      return (
                        <h4 key={idx} className="font-semibold text-sm mt-3 mb-1 text-gray-800">
                          {section.text}
                        </h4>
                      );
                    }
                    if (section.type === 'list') {
                      return (
                        <div key={idx} className="flex gap-2 pl-4">
                          <span className="text-primary">•</span>
                          <span className="text-justify text-gray-700">{section.text}</span>
                        </div>
                      );
                    }
                    if (section.type === 'checkbox') {
                      return (
                        <div key={idx} className="flex gap-2 pl-4 items-start">
                          <span className="text-gray-400 mt-0.5">☐</span>
                          <span className="text-justify text-gray-700">{section.text}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="text-justify leading-relaxed text-gray-700 pl-4">
                        {section.text}
                      </p>
                    );
                  })}
                </div>

                {/* Signature Section Preview */}
                <div className="mt-10 pt-6 border-t">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="border-t border-gray-400 w-48 mb-1" />
                      <p className="font-semibold text-sm" style={{ color: '#1a2744' }}>
                        {reportData.signatoryName}
                      </p>
                      <p className="text-xs text-gray-600">{reportData.signatoryPosition}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Data: {format(reportData.date, 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="w-28 h-28 border-2 rounded flex items-center justify-center bg-gray-50"
                        style={{ borderColor: '#1a2744' }}
                      >
                        <div className="text-xs text-gray-400 text-center">
                          QR Code<br />Verificação
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Escaneie para verificar</p>
                    </div>
                  </div>
                </div>

                {/* Footer Preview */}
                <div className="absolute bottom-4 left-6 right-6 border-t pt-2 flex justify-between text-xs text-gray-500">
                  <span>ELP Green Technology | Confidencial</span>
                  <span>Página 1/1</span>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Language Selection Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Selecionar Idioma do PDF
            </DialogTitle>
            <DialogDescription>
              Escolha o idioma para o relatório. A IA traduzirá automaticamente todo o conteúdo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-2 py-4">
            {LANGUAGE_OPTIONS.map((lang) => (
              <Button
                key={lang.value}
                variant={selectedPdfLanguage === lang.value ? "default" : "outline"}
                className={cn(
                  "justify-start gap-3 h-12",
                  selectedPdfLanguage === lang.value && "bg-primary text-primary-foreground"
                )}
                onClick={() => setSelectedPdfLanguage(lang.value as SupportedLanguage)}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
                {selectedPdfLanguage === lang.value && (
                  <CheckCircle className="h-4 w-4 ml-auto" />
                )}
              </Button>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowLanguageDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGeneratePDF}
              disabled={isGenerating || isTranslating}
              className="gap-2"
            >
              {isGenerating || isTranslating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isTranslating ? 'Traduzindo...' : 'Gerar PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
