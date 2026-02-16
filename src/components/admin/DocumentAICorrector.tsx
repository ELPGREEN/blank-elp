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
   Brain,
   Scale,
   Gavel,
   RefreshCw,
   Copy,
   FileSignature,
   Shield,
   Lock
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
 import { Progress } from '@/components/ui/progress';
 import { useToast } from '@/hooks/use-toast';
 import { cn } from '@/lib/utils';
 import { supabase } from '@/integrations/supabase/client';
 import { generateProfessionalDocument } from '@/lib/generateProfessionalDocument';
 import { MultipleSignersManager, type Signer } from './MultipleSignersManager';
 import logoElpNew from '@/assets/logo-elp-new.png';
 
 // Language options with flags
 const LANGUAGE_OPTIONS = [
   { value: 'pt', label: 'Português', flag: '🇧🇷' },
   { value: 'en', label: 'English', flag: '🇺🇸' },
   { value: 'es', label: 'Español', flag: '🇪🇸' },
   { value: 'it', label: 'Italiano', flag: '🇮🇹' },
   { value: 'zh', label: '中文', flag: '🇨🇳' },
   { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
 ];
 
 // Country options for legal jurisdiction
 const COUNTRY_OPTIONS = [
   { value: 'brazil', label: '🇧🇷 Brasil', laws: 'LGPD, Lei 14.063/2020, Código Civil' },
   { value: 'italy', label: '🇮🇹 Italia', laws: 'GDPR, Codice Civile Italiano' },
   { value: 'germany', label: '🇩🇪 Deutschland', laws: 'GDPR, BGB, HGB' },
   { value: 'usa', label: '🇺🇸 United States', laws: 'UCC, ESIGN Act, State Laws' },
   { value: 'australia', label: '🇦🇺 Australia', laws: 'Privacy Act, Electronic Transactions Act' },
   { value: 'mexico', label: '🇲🇽 México', laws: 'LFPDPPP, Código Civil Federal' },
   { value: 'china', label: '🇨🇳 中国', laws: 'PIPL, Civil Code, Cybersecurity Law' },
  { value: 'uk', label: '🇬🇧 United Kingdom', laws: 'UK GDPR, Bribery Act, Companies Act' },
  { value: 'france', label: '🇫🇷 France', laws: 'GDPR, Code Civil, Loi Sapin II' },
  { value: 'japan', label: '🇯🇵 日本', laws: 'APPI, Civil Code, Companies Act' },
  { value: 'india', label: '🇮🇳 India', laws: 'DPDP Act, IT Act, Contract Act' },
  { value: 'argentina', label: '🇦🇷 Argentina', laws: 'PDPA, Código Civil, Ley de Sociedades' },
  { value: 'chile', label: '🇨🇱 Chile', laws: 'Ley 19.628, Código Civil' },
  { value: 'colombia', label: '🇨🇴 Colombia', laws: 'Ley 1581/2012, Código de Comercio' },
  { value: 'peru', label: '🇵🇪 Perú', laws: 'Ley 29733, Código Civil' },
  { value: 'spain', label: '🇪🇸 España', laws: 'GDPR, LOPDGDD, Código Civil' },
  { value: 'portugal', label: '🇵🇹 Portugal', laws: 'GDPR, Lei 58/2019, Código Civil' },
  { value: 'uae', label: '🇦🇪 UAE', laws: 'PDPL, Commercial Companies Law' },
  { value: 'saudi_arabia', label: '🇸🇦 Saudi Arabia', laws: 'PDPL, Companies Law' },
  { value: 'south_africa', label: '🇿🇦 South Africa', laws: 'POPIA, Companies Act' },
 ];
 
 // Document type options
 const DOCUMENT_TYPE_OPTIONS = [
   { value: 'nda', label: 'NDA (Confidencialidade)', icon: Lock },
   { value: 'nda_bilateral', label: 'NDA Bilateral', icon: Shield },
   { value: 'loi', label: 'Carta de Intenções (LOI)', icon: FileSignature },
   { value: 'mou', label: 'Memorando de Entendimento (MOU)', icon: FileText },
   { value: 'joint_venture', label: 'Joint Venture', icon: Scale },
   { value: 'contract', label: 'Contrato Comercial', icon: Gavel },
   { value: 'proposal', label: 'Proposta Comercial', icon: Briefcase },
   { value: 'report', label: 'Relatório Executivo', icon: FileText },
  // Advanced templates
  { value: 'feasibility_study', label: 'Estudo de Viabilidade com ROI', icon: FileText },
  { value: 'sustainability_report', label: 'Relatório de Sustentabilidade ESG', icon: Globe },
  { value: 'environmental_improvement', label: 'Plano de Melhorias Ambientais', icon: Globe },
  { value: 'due_diligence', label: 'Due Diligence Report', icon: FileCheck },
  { value: 'term_sheet', label: 'Term Sheet', icon: FileSignature },
  { value: 'investment_proposal', label: 'Proposta de Investimento', icon: Briefcase },
  { value: 'partnership_agreement', label: 'Acordo de Parceria', icon: Scale },
  { value: 'service_agreement', label: 'Contrato de Serviços', icon: FileText },
  { value: 'consulting_agreement', label: 'Contrato de Consultoria', icon: FileText },
  { value: 'supply_agreement', label: 'Acordo de Fornecimento', icon: FileText },
  { value: 'distribution', label: 'Acordo de Distribuição', icon: Globe },
  { value: 'technology_license', label: 'Licença de Tecnologia', icon: FileText },
  { value: 'franchise_agreement', label: 'Contrato de Franquia', icon: Briefcase },
  { value: 'agency_agreement', label: 'Representação Comercial', icon: Briefcase },
  { value: 'offtake_agreement', label: 'Acordo de Offtake', icon: FileSignature },
  { value: 'carbon_credit', label: 'Contrato de Créditos de Carbono', icon: Globe },
  { value: 'esg_commitment', label: 'Termo de Compromisso ESG', icon: Scale },
  { value: 'anti_corruption', label: 'Termo Anticorrupção / FCPA', icon: Shield },
  { value: 'data_processing', label: 'Contrato DPA (LGPD/GDPR)', icon: Lock },
  { value: 'power_of_attorney', label: 'Procuração', icon: FileSignature },
  { value: 'kyc', label: 'KYC - Conheça seu Cliente', icon: FileCheck },
  { value: 'compliance', label: 'Termo de Compliance', icon: Scale },
  { value: 'shareholders_agreement', label: 'Acordo de Acionistas', icon: Scale },
  { value: 'meeting_minutes', label: 'Ata de Reunião', icon: FileText },
 ];
 
 // Sample contract text
 const SAMPLE_CONTRACT = `CONTRATO DE PARCERIA COMERCIAL
 
 Entre as partes:
 
 PARTE A: ELP Green Technology, empresa brasileira
 PARTE B: [NOME DA EMPRESA], empresa [PAÍS]
 
 OBJETO:
 Este contrato tem por objeto estabelecer os termos e condições para parceria comercial na área de reciclagem de pneus OTR.
 
 CLÁUSULAS:
 
 1. A Parte A fornecerá equipamentos e tecnologia.
 2. A Parte B será responsável pela operação local.
 3. Os lucros serão divididos conforme acordado.
 
 Este contrato é válido por 5 anos.
 
 Assinaturas:
 _______________________
 Representante Parte A
 
 _______________________
 Representante Parte B`;
 
 interface CorrectionData {
   title: string;
   date: Date;
   documentNumber: string;
   signatoryName: string;
   signatoryPosition: string;
   content: string;
   language: string;
   country: string;
   documentType: string;
   includeExecutiveSummary: boolean;
   executiveSummary: string;
 }
 
 interface AIProgress {
   step: string;
   provider: string;
   status: 'pending' | 'processing' | 'completed' | 'error';
   message?: string;
 }
 
 export function DocumentAICorrector() {
   const { t, i18n } = useTranslation();
   const { toast } = useToast();
   const previewRef = useRef<HTMLDivElement>(null);
   
   const currentLang = i18n.language || 'pt';
   
   const [correctionData, setCorrectionData] = useState<CorrectionData>({
     title: 'Documento Empresarial',
     date: new Date(),
     documentNumber: `DOC-ELP-${String(new Date().getMonth() + 1).padStart(2, '0')}${new Date().getFullYear().toString().slice(-2)}-001`,
     signatoryName: 'Eryon Piccoli',
     signatoryPosition: 'Diretor – ELP Green Technology',
     content: '',
     language: currentLang,
     country: 'brazil',
     documentType: 'contract',
     includeExecutiveSummary: false,
     executiveSummary: '',
   });
   
   const [isCorrectingAll, setIsCorrectingAll] = useState(false);
   const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
   const [correctedContent, setCorrectedContent] = useState('');
   const [showPreview, setShowPreview] = useState(false);
   const [datePickerOpen, setDatePickerOpen] = useState(false);
   const [characterCount, setCharacterCount] = useState(0);
   
   // AI Progress tracking
   const [aiProgress, setAiProgress] = useState<AIProgress[]>([]);
   const [overallProgress, setOverallProgress] = useState(0);
   
   // Multiple Signers
   const [enableMultipleSignatures, setEnableMultipleSignatures] = useState(false);
   const [signers, setSigners] = useState<Signer[]>([]);
 
   const updateField = <K extends keyof CorrectionData>(field: K, value: CorrectionData[K]) => {
     setCorrectionData(prev => ({ ...prev, [field]: value }));
     if (field === 'content') {
       setCharacterCount(typeof value === 'string' ? value.length : 0);
       setCorrectedContent('');
     }
   };
 
   const handlePasteExample = () => {
     updateField('content', SAMPLE_CONTRACT);
     toast({ title: 'Exemplo colado', description: 'Texto de exemplo adicionado ao editor.' });
   };
 
   const copyToClipboard = async (text: string) => {
     await navigator.clipboard.writeText(text);
     toast({ title: 'Copiado!', description: 'Texto copiado para a área de transferência.' });
   };
 
   // Main AI correction with all 7 providers
   const handleCorrectWithAllAIs = async () => {
     if (!correctionData.content.trim()) {
       toast({ title: 'Erro', description: 'Cole o conteúdo do documento primeiro.', variant: 'destructive' });
       return;
     }
 
     if (correctionData.content.length < 100) {
       toast({ title: 'Documento muito curto', description: 'O documento deve ter pelo menos 100 caracteres.', variant: 'destructive' });
       return;
     }
 
     setIsCorrectingAll(true);
     setCorrectedContent('');
     setOverallProgress(0);
     
     // Initialize AI progress
     setAiProgress([
       { step: 'Análise inicial', provider: 'Groq', status: 'pending' },
       { step: 'Correção gramatical', provider: 'Gemini', status: 'pending' },
       { step: 'Análise jurídica', provider: 'Claude', status: 'pending' },
       { step: 'Cláusulas faltantes', provider: 'Gemini-2', status: 'pending' },
       { step: 'Conformidade país', provider: 'Gemini-3', status: 'pending' },
       { step: 'Revisão ESG', provider: 'Gemini-4', status: 'pending' },
       { step: 'Formatação final', provider: 'Gemini-5', status: 'pending' },
     ]);
 
     try {
       const countryData = COUNTRY_OPTIONS.find(c => c.value === correctionData.country);
       const docTypeData = DOCUMENT_TYPE_OPTIONS.find(d => d.value === correctionData.documentType);
 
       toast({ 
         title: '🤖 Processando com 7 IAs...', 
         description: 'Corrigindo, analisando e adicionando cláusulas faltantes',
       });
 
       // Step 1: Initial analysis
       setAiProgress(prev => prev.map((p, i) => i === 0 ? { ...p, status: 'processing' } : p));
       setOverallProgress(5);
 
       const { data, error } = await supabase.functions.invoke('ai-hub', {
         body: {
           action: 'correct_document',
           text: correctionData.content,
           documentType: correctionData.documentType,
           country: correctionData.country,
           language: correctionData.language,
           countryLaws: countryData?.laws || '',
           documentTypeName: docTypeData?.label || 'Documento',
           minimumCharacters: 50000,
         }
       });
 
       if (error) throw error;
 
       // Update progress based on response
       if (data?.correctedDocument) {
         // Simulate progress for visual feedback
         for (let i = 0; i < 7; i++) {
           setAiProgress(prev => prev.map((p, idx) => 
             idx <= i ? { ...p, status: 'completed' } : p
           ));
           setOverallProgress((i + 1) * 14);
           await new Promise(resolve => setTimeout(resolve, 200));
         }
         
         setCorrectedContent(data.correctedDocument);
         setOverallProgress(100);
         
         toast({ 
           title: '✅ Documento corrigido com sucesso!', 
           description: `${data.correctedDocument.length.toLocaleString()} caracteres gerados. Providenciadores: ${data.providers?.join(', ') || 'Multi-AI'}`,
         });
       }
     } catch (error: any) {
       console.error('AI correction error:', error);
       setAiProgress(prev => prev.map(p => 
         p.status === 'processing' ? { ...p, status: 'error', message: error.message } : p
       ));
       toast({ 
         title: 'Erro na correção', 
         description: error.message || 'Não foi possível processar. Tente novamente.',
         variant: 'destructive' 
       });
     } finally {
       setIsCorrectingAll(false);
     }
   };
 
   // Apply corrected content back to main editor
   const applyCorrection = () => {
     if (correctedContent) {
       updateField('content', correctedContent);
       setCorrectedContent('');
       toast({ title: 'Aplicado!', description: 'Documento corrigido aplicado ao editor.' });
     }
   };
 
   const selectedCountry = COUNTRY_OPTIONS.find(c => c.value === correctionData.country);
   const selectedDocType = DOCUMENT_TYPE_OPTIONS.find(d => d.value === correctionData.documentType);
   const DocTypeIcon = selectedDocType?.icon || FileText;
 
   return (
     <Card className="border-2">
       <CardHeader className="pb-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
               <Wand2 className="h-6 w-6 text-primary" />
             </div>
             <div>
               <CardTitle className="flex items-center gap-2">
                 Correção com 7 IAs
                 <Badge variant="secondary" className="text-xs">Beta</Badge>
               </CardTitle>
               <CardDescription>
                 Cole seu documento para correção automática, análise jurídica e adição de cláusulas faltantes
               </CardDescription>
             </div>
           </div>
           <Badge variant="outline" className="text-xs">
             Min. 50.000 caracteres
           </Badge>
         </div>
       </CardHeader>
 
       <CardContent className="space-y-6">
         {/* Configuration Row */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {/* Document Type */}
           <div className="space-y-2">
             <Label className="flex items-center gap-2">
               <DocTypeIcon className="h-4 w-4" />
               Tipo de Documento
             </Label>
             <Select value={correctionData.documentType} onValueChange={(v) => updateField('documentType', v)}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {DOCUMENT_TYPE_OPTIONS.map(type => {
                   const Icon = type.icon;
                   return (
                     <SelectItem key={type.value} value={type.value}>
                       <div className="flex items-center gap-2">
                         <Icon className="h-4 w-4" />
                         {type.label}
                       </div>
                     </SelectItem>
                   );
                 })}
               </SelectContent>
             </Select>
           </div>
 
           {/* Country/Jurisdiction */}
           <div className="space-y-2">
             <Label className="flex items-center gap-2">
               <Globe className="h-4 w-4" />
               País/Jurisdição
             </Label>
             <Select value={correctionData.country} onValueChange={(v) => updateField('country', v)}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {COUNTRY_OPTIONS.map(country => (
                   <SelectItem key={country.value} value={country.value}>
                     {country.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
             {selectedCountry && (
               <p className="text-xs text-muted-foreground">{selectedCountry.laws}</p>
             )}
           </div>
 
           {/* Language */}
           <div className="space-y-2">
             <Label className="flex items-center gap-2">
               <FileText className="h-4 w-4" />
               Idioma do Documento
             </Label>
             <Select value={correctionData.language} onValueChange={(v) => updateField('language', v)}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {LANGUAGE_OPTIONS.map(lang => (
                   <SelectItem key={lang.value} value={lang.value}>
                     {lang.flag} {lang.label}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Document Info */}
           <div className="space-y-2">
             <Label className="flex items-center gap-2">
               <Hash className="h-4 w-4" />
               Número do Documento
             </Label>
             <Input
               value={correctionData.documentNumber}
               onChange={(e) => updateField('documentNumber', e.target.value)}
               placeholder="DOC-001"
             />
           </div>
         </div>
 
         <Separator />
 
         {/* Main Content Area - Two Columns */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Left: Original Document */}
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <Label className="text-base font-semibold flex items-center gap-2">
                 <ClipboardPaste className="h-4 w-4" />
                 Documento Original
               </Label>
               <div className="flex items-center gap-2">
                 <Badge variant={characterCount >= 50000 ? 'default' : 'secondary'}>
                   {characterCount.toLocaleString()} caracteres
                 </Badge>
                 <Button variant="outline" size="sm" onClick={handlePasteExample}>
                   <ClipboardPaste className="h-4 w-4 mr-1" />
                   Exemplo
                 </Button>
               </div>
             </div>
             
             <Textarea
               value={correctionData.content}
               onChange={(e) => updateField('content', e.target.value)}
               placeholder="Cole aqui o conteúdo do seu contrato, NDA, LOI, MOU ou outro documento jurídico/empresarial para correção automática com 7 IAs...
 
 As IAs irão:
 ✓ Corrigir gramática e ortografia
 ✓ Analisar conformidade jurídica
 ✓ Adicionar cláusulas faltantes
 ✓ Aplicar leis do país selecionado
 ✓ Incluir cláusulas ESG e anticorrupção
 ✓ Formatar profissionalmente
 ✓ Expandir para mínimo 50.000 caracteres"
               className="min-h-[400px] font-mono text-sm resize-none"
             />
             
             <div className="flex gap-2">
               <Button 
                 onClick={handleCorrectWithAllAIs}
                 disabled={isCorrectingAll || !correctionData.content.trim()}
                 className="flex-1 gap-2"
                 size="lg"
               >
                 {isCorrectingAll ? (
                   <>
                     <Loader2 className="h-5 w-5 animate-spin" />
                     Processando com 7 IAs...
                   </>
                 ) : (
                   <>
                     <Sparkles className="h-5 w-5" />
                     Corrigir com 7 IAs
                   </>
                 )}
               </Button>
             </div>
           </div>
 
           {/* Right: Corrected Document / Progress */}
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <Label className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                 Documento Corrigido
               </Label>
               {correctedContent && (
                 <div className="flex items-center gap-2">
                    <Badge variant="default">
                     {correctedContent.length.toLocaleString()} caracteres
                   </Badge>
                   <Button variant="outline" size="sm" onClick={() => copyToClipboard(correctedContent)}>
                     <Copy className="h-4 w-4 mr-1" />
                     Copiar
                   </Button>
                 </div>
               )}
             </div>
 
             {isCorrectingAll ? (
               <div className="min-h-[400px] border rounded-lg p-4 bg-muted/30 space-y-4">
                 <div className="text-center mb-6">
                   <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                   <p className="text-lg font-medium">Processando com 7 IAs...</p>
                   <p className="text-sm text-muted-foreground">Isso pode levar 1-2 minutos</p>
                 </div>
                 
                 <Progress value={overallProgress} className="h-3" />
                 <p className="text-center text-sm text-muted-foreground">{overallProgress}% concluído</p>
                 
                 <div className="space-y-2 mt-4">
                   {aiProgress.map((progress, index) => (
                     <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-background">
                       <div className={cn(
                         "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                          progress.status === 'completed' && "bg-primary/20 text-primary",
                          progress.status === 'processing' && "bg-secondary text-secondary-foreground",
                         progress.status === 'pending' && "bg-muted text-muted-foreground",
                          progress.status === 'error' && "bg-destructive/20 text-destructive"
                       )}>
                         {progress.status === 'completed' && <CheckCircle className="h-4 w-4" />}
                         {progress.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                         {progress.status === 'pending' && (index + 1)}
                         {progress.status === 'error' && <AlertCircle className="h-4 w-4" />}
                       </div>
                       <div className="flex-1">
                         <p className="text-sm font-medium">{progress.step}</p>
                         <p className="text-xs text-muted-foreground">{progress.provider}</p>
                       </div>
                       <Badge variant={
                         progress.status === 'completed' ? 'default' : 
                         progress.status === 'processing' ? 'secondary' : 
                         progress.status === 'error' ? 'destructive' : 'outline'
                       } className="text-xs">
                         {progress.status === 'completed' && '✓'}
                         {progress.status === 'processing' && '...'}
                         {progress.status === 'pending' && 'Aguardando'}
                         {progress.status === 'error' && 'Erro'}
                       </Badge>
                     </div>
                   ))}
                 </div>
               </div>
             ) : correctedContent ? (
               <>
                  <ScrollArea className="min-h-[400px] max-h-[400px] border rounded-lg p-4 bg-primary/5">
                   <pre className="whitespace-pre-wrap text-sm font-mono">{correctedContent}</pre>
                 </ScrollArea>
                 <div className="flex gap-2">
                   <Button onClick={applyCorrection} className="flex-1 gap-2" variant="default">
                     <CheckCircle className="h-4 w-4" />
                     Aplicar ao Editor
                   </Button>
                   <Button onClick={() => setCorrectedContent('')} variant="outline">
                     <RefreshCw className="h-4 w-4" />
                   </Button>
                 </div>
               </>
             ) : (
               <div className="min-h-[400px] border rounded-lg p-6 bg-muted/30 flex flex-col items-center justify-center text-center">
                 <Brain className="h-16 w-16 text-muted-foreground/30 mb-4" />
                 <p className="text-lg font-medium text-muted-foreground">Aguardando documento</p>
                 <p className="text-sm text-muted-foreground mt-2 max-w-md">
                   Cole um documento no campo ao lado e clique em "Corrigir com 7 IAs" para processar automaticamente.
                 </p>
                 <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                   <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                     Correção gramatical
                   </div>
                   <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                     Análise jurídica
                   </div>
                   <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                     Cláusulas faltantes
                   </div>
                   <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                     Leis do país
                   </div>
                   <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                     Cláusulas ESG
                   </div>
                   <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                     Min. 50k caracteres
                   </div>
                 </div>
               </div>
             )}
           </div>
         </div>
 
         {/* Signers Section */}
         <Separator />
         
         <div className="space-y-4">
           <div className="flex items-center gap-3">
             <Checkbox 
               id="multiple-signatures"
               checked={enableMultipleSignatures}
               onCheckedChange={(checked) => setEnableMultipleSignatures(checked === true)}
             />
             <Label htmlFor="multiple-signatures" className="cursor-pointer">
               Habilitar múltiplos signatários
             </Label>
           </div>
 
           {enableMultipleSignatures ? (
             <MultipleSignersManager 
               signers={signers} 
               onSignersChange={setSigners}
               enableMultipleSignatures={enableMultipleSignatures}
               onEnableMultipleSignaturesChange={setEnableMultipleSignatures}
             />
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="flex items-center gap-2">
                   <User className="h-4 w-4" />
                   Nome do Signatário
                 </Label>
                 <Input
                   value={correctionData.signatoryName}
                   onChange={(e) => updateField('signatoryName', e.target.value)}
                   placeholder="Nome completo"
                 />
               </div>
               <div className="space-y-2">
                 <Label className="flex items-center gap-2">
                   <Briefcase className="h-4 w-4" />
                   Cargo/Posição
                 </Label>
                 <Input
                   value={correctionData.signatoryPosition}
                   onChange={(e) => updateField('signatoryPosition', e.target.value)}
                   placeholder="Cargo ou posição"
                 />
               </div>
             </div>
           )}
         </div>
       </CardContent>
     </Card>
   );
 }