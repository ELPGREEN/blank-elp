import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Download,
  Mail,
  Filter,
  Search,
  Sparkles,
  Building2,
  Globe,
  FileSignature,
  Lock,
  Scale,
  Clock,
  CheckSquare,
  Square,
  RefreshCw
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  type: 'contact' | 'marketplace';
  status?: string;
}

interface BulkJobResult {
  leadId: string;
  leadName: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  documentId?: string;
  error?: string;
}

const documentTypes = [
  { value: 'nda', label: 'NDA (Confidencialidade)', icon: Lock },
  { value: 'nda_bilateral', label: 'NDA Bilateral', icon: Lock },
   { value: 'nda_multilateral', label: 'NDA Multilateral', icon: Lock },
  { value: 'loi', label: 'Carta de Intenções (LOI)', icon: FileSignature },
  { value: 'mou', label: 'Memorando de Entendimento (MOU)', icon: FileText },
  { value: 'joint_venture', label: 'Joint Venture', icon: Scale },
  { value: 'proposal', label: 'Proposta Comercial', icon: Building2 },
   { value: 'contract', label: 'Contrato Comercial', icon: FileSignature },
   { value: 'kyc', label: 'KYC - Conheça seu Cliente', icon: FileText },
   { value: 'compliance', label: 'Termo de Compliance', icon: Scale },
   { value: 'supply_agreement', label: 'Acordo de Fornecimento', icon: Building2 },
   { value: 'technology_license', label: 'Licença de Tecnologia', icon: FileText },
   { value: 'distribution', label: 'Acordo de Distribuição', icon: Globe },
   { value: 'meeting_minutes', label: 'Ata de Reunião', icon: FileText },
  // Advanced templates
  { value: 'feasibility_study', label: 'Estudo de Viabilidade com ROI', icon: FileText },
  { value: 'sustainability_report', label: 'Relatório de Sustentabilidade ESG', icon: Globe },
  { value: 'environmental_improvement', label: 'Plano de Melhorias Ambientais', icon: Globe },
  { value: 'due_diligence', label: 'Due Diligence Report', icon: FileText },
  { value: 'term_sheet', label: 'Term Sheet', icon: FileSignature },
  { value: 'investment_proposal', label: 'Proposta de Investimento', icon: Building2 },
  { value: 'partnership_agreement', label: 'Acordo de Parceria', icon: Scale },
  { value: 'service_agreement', label: 'Contrato de Serviços', icon: FileText },
  { value: 'consulting_agreement', label: 'Contrato de Consultoria', icon: FileText },
  { value: 'franchise_agreement', label: 'Contrato de Franquia', icon: Building2 },
  { value: 'agency_agreement', label: 'Representação Comercial', icon: Building2 },
  { value: 'offtake_agreement', label: 'Acordo de Offtake', icon: FileSignature },
  { value: 'equipment_lease', label: 'Locação de Equipamentos', icon: FileText },
  { value: 'carbon_credit', label: 'Contrato de Créditos de Carbono', icon: Globe },
  { value: 'esg_commitment', label: 'Termo de Compromisso ESG', icon: Scale },
  { value: 'anti_corruption', label: 'Termo Anticorrupção / FCPA', icon: Lock },
  { value: 'data_processing', label: 'Contrato DPA (LGPD/GDPR)', icon: Lock },
  { value: 'power_of_attorney', label: 'Procuração', icon: FileSignature },
  { value: 'royalty_agreement', label: 'Acordo de Royalties', icon: FileText },
  { value: 'non_compete', label: 'Acordo de Não-Concorrência', icon: Lock },
  { value: 'shareholders_agreement', label: 'Acordo de Acionistas', icon: Scale },
];

const countryOptions = [
  { code: 'brazil', label: '🇧🇷 Brasil', lang: 'pt' },
  { code: 'italy', label: '🇮🇹 Italia', lang: 'it' },
  { code: 'germany', label: '🇩🇪 Deutschland', lang: 'de' },
  { code: 'usa', label: '🇺🇸 United States', lang: 'en' },
  { code: 'australia', label: '🇦🇺 Australia', lang: 'en' },
  { code: 'mexico', label: '🇲🇽 México', lang: 'es' },
  { code: 'china', label: '🇨🇳 中国', lang: 'zh' },
   { code: 'argentina', label: '🇦🇷 Argentina', lang: 'es' },
   { code: 'colombia', label: '🇨🇴 Colombia', lang: 'es' },
   { code: 'chile', label: '🇨🇱 Chile', lang: 'es' },
   { code: 'peru', label: '🇵🇪 Perú', lang: 'es' },
   { code: 'uk', label: '🇬🇧 United Kingdom', lang: 'en' },
   { code: 'france', label: '🇫🇷 France', lang: 'fr' },
   { code: 'spain', label: '🇪🇸 España', lang: 'es' },
   { code: 'portugal', label: '🇵🇹 Portugal', lang: 'pt' },
   { code: 'japan', label: '🇯🇵 日本', lang: 'ja' },
   { code: 'india', label: '🇮🇳 India', lang: 'en' },
   { code: 'south_africa', label: '🇿🇦 South Africa', lang: 'en' },
   { code: 'uae', label: '🇦🇪 UAE', lang: 'en' },
   { code: 'saudi_arabia', label: '🇸🇦 Saudi Arabia', lang: 'ar' },
   { code: 'indonesia', label: '🇮🇩 Indonesia', lang: 'id' },
];

export function BulkDocumentGenerator() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [documentType, setDocumentType] = useState('nda');
  const [defaultCountry, setDefaultCountry] = useState('brazil');
  const [defaultLanguage, setDefaultLanguage] = useState('pt');
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'contact' | 'marketplace'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [jobResults, setJobResults] = useState<BulkJobResult[]>([]);
  const [sendEmails, setSendEmails] = useState(true);
   const [generateFullDocument, setGenerateFullDocument] = useState(true);
   const [minimumCharacters, setMinimumCharacters] = useState(50000);

  // Fetch all leads
  const { data: allLeads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['bulk-leads'],
    queryFn: async () => {
      const [contactsRes, marketplaceRes] = await Promise.all([
        supabase.from('contacts').select('id, name, email, company, country, status').order('created_at', { ascending: false }),
        supabase.from('marketplace_registrations').select('id, contact_name, email, company_name, country, status').order('created_at', { ascending: false }),
      ]);
      
      const leads: Lead[] = [];
      contactsRes.data?.forEach(c => leads.push({ 
        id: c.id, name: c.name, email: c.email, company: c.company, country: c.country, type: 'contact', status: c.status 
      }));
      marketplaceRes.data?.forEach(m => leads.push({ 
        id: m.id, name: m.contact_name, email: m.email, company: m.company_name, country: m.country, type: 'marketplace', status: m.status 
      }));
      return leads;
    },
  });

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['document-templates-bulk'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_templates').select('*').eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  // Filter leads
  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (lead.company?.toLowerCase().includes(searchFilter.toLowerCase()) ?? false);
      const matchesType = typeFilter === 'all' || lead.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [allLeads, searchFilter, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const completed = jobResults.filter(r => r.status === 'success').length;
    const errors = jobResults.filter(r => r.status === 'error').length;
    const pending = jobResults.filter(r => r.status === 'pending' || r.status === 'generating').length;
    return { completed, errors, pending, total: jobResults.length };
  }, [jobResults]);

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const newSet = new Set(selectedLeads);
    filteredLeads.forEach(lead => newSet.add(lead.id));
    setSelectedLeads(newSet);
  };

  const clearSelection = () => {
    setSelectedLeads(new Set());
  };

  // Generate documents for all selected leads
  const startBulkGeneration = async () => {
    if (selectedLeads.size === 0) {
      toast.error('Selecione pelo menos um lead');
      return;
    }

    const selectedLeadsList = allLeads.filter(l => selectedLeads.has(l.id));
    const template = templates.find(t => t.type === documentType);
    
    if (!template) {
      toast.error('Template não encontrado para este tipo de documento');
      return;
    }

    // Initialize job results
    const initialResults: BulkJobResult[] = selectedLeadsList.map(lead => ({
      leadId: lead.id,
      leadName: lead.name,
      status: 'pending'
    }));
    setJobResults(initialResults);
    setIsGenerating(true);
    setIsPaused(false);

    // Process each lead sequentially to avoid rate limits
    for (let i = 0; i < selectedLeadsList.length; i++) {
      if (isPaused) {
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!isPaused) {
              clearInterval(checkPause);
              resolve(true);
            }
          }, 500);
        });
      }

      const lead = selectedLeadsList[i];
      
      // Update status to generating
      setJobResults(prev => prev.map(r => 
        r.leadId === lead.id ? { ...r, status: 'generating' } : r
      ));

      try {
        // Get country-specific language
        const leadCountry = countryOptions.find(c => 
          c.code === lead.country?.toLowerCase() || 
          c.label.toLowerCase().includes(lead.country?.toLowerCase() || '')
        );
        const language = leadCountry?.lang || defaultLanguage;

        // Generate document with AI
        let aiData: any;
        let aiError: any;
        
        if (generateFullDocument) {
          // Use the comprehensive 7-AI document correction for full documents
          const baseContent = `${documentTypes.find(d => d.value === documentType)?.label || documentType}

Empresa: ${lead.company || 'N/A'}
Contato: ${lead.name}
Email: ${lead.email}
País: ${lead.country || defaultCountry}

Este documento estabelece os termos entre ELP Green Technology e ${lead.company || lead.name}.`;

          const response = await supabase.functions.invoke('ai-hub', {
            body: {
              action: 'correct_document',
              text: baseContent,
              documentType: documentType,
              country: leadCountry?.code || defaultCountry,
              language,
              documentTypeName: documentTypes.find(d => d.value === documentType)?.label || 'Documento',
              minimumCharacters: minimumCharacters,
            },
          });
          
          aiData = response.data ? { 
            fields: {},
            documentContent: response.data.correctedDocument 
          } : null;
          aiError = response.error;
        } else {
          // Use standard document generation
          const response = await supabase.functions.invoke('generate-document-ai', {
            body: {
              templateType: documentType,
              country: leadCountry?.code || defaultCountry,
              language,
              existingFields: [
                { name: 'company_name', label: 'Empresa', type: 'text' },
                { name: 'contact_name', label: 'Contato', type: 'text' },
                { name: 'email', label: 'Email', type: 'email' },
              ],
              templateContent: template ? (template[`content_${language}` as keyof typeof template] || template.content_pt) : '',
              generateFullDocument: true,
              leadContext: {
                name: lead.name,
                email: lead.email,
                company: lead.company,
                country: lead.country,
              }
            },
          });
          
          aiData = response.data;
          aiError = response.error;
        }

        if (aiError) throw aiError;

        // Save generated document
        const documentName = `${documentTypes.find(d => d.value === documentType)?.label || documentType} - ${lead.company || lead.name}`;
        
        const { data: docData, error: docError } = await supabase.from('generated_documents').insert({
          template_id: template.id,
          document_name: documentName,
          document_type: documentType,
          language,
          lead_id: lead.id,
          lead_type: lead.type,
          field_values: {
            company_name: lead.company || '',
            contact_name: lead.name,
            email: lead.email,
            date: format(new Date(), 'dd/MM/yyyy'),
            disclosing_party: 'ELP Alliance S/A',
            receiving_party: lead.company || lead.name,
            ...aiData?.fields
          },
          generated_by: user?.id,
          sent_to_email: sendEmails ? lead.email : null,
          sent_at: sendEmails ? new Date().toISOString() : null,
        }).select().single();

        if (docError) throw docError;

        // Optionally send email
        if (sendEmails && lead.email) {
          await supabase.functions.invoke('send-document-signature-link', {
            body: {
              documentId: docData.id,
              recipientEmail: lead.email,
              recipientName: lead.name,
              documentType,
              language,
            }
          });
        }

        // Update status to success
        setJobResults(prev => prev.map(r => 
          r.leadId === lead.id ? { ...r, status: 'success', documentId: docData.id } : r
        ));

      } catch (error: any) {
        console.error(`Error generating for ${lead.name}:`, error);
        setJobResults(prev => prev.map(r => 
          r.leadId === lead.id ? { ...r, status: 'error', error: error.message } : r
        ));
      }

      // Small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsGenerating(false);
    queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
    toast.success(`Geração em massa concluída: ${stats.completed} sucesso, ${stats.errors} erros`);
  };

  const progress = stats.total > 0 ? ((stats.completed + stats.errors) / stats.total) * 100 : 0;

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Users className="h-4 w-4" />
        Geração em Massa
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Geração em Massa de Documentos
            </DialogTitle>
            <DialogDescription>
              Selecione múltiplos leads para gerar documentos automaticamente com IA
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>País Padrão</Label>
                <Select value={defaultCountry} onValueChange={setDefaultCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map(country => (
                      <SelectItem key={country.code} value={country.code}>{country.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Idioma Padrão</Label>
                <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">🇧🇷 Português</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                    <SelectItem value="zh">🇨🇳 中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="send-emails" 
                  checked={sendEmails} 
                  onCheckedChange={(checked) => setSendEmails(checked === true)} 
                />
                <Label htmlFor="send-emails" className="text-sm cursor-pointer">
                  Enviar por email automaticamente
                </Label>
              </div>
               <div className="flex items-center gap-2">
                 <Checkbox 
                   id="full-document" 
                   checked={generateFullDocument} 
                   onCheckedChange={(checked) => setGenerateFullDocument(checked === true)} 
                 />
                 <Label htmlFor="full-document" className="text-sm cursor-pointer">
                   Documento completo (50k+ caracteres)
                 </Label>
               </div>
            </div>

            <Separator />

            {/* Filters and Selection */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar leads..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="contact">Contatos</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllVisible}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Selecionar Todos
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <Square className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>

              <Badge variant="secondary" className="ml-auto">
                {selectedLeads.size} selecionado(s)
              </Badge>
            </div>

            {/* Lead List */}
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-1">
                {leadsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum lead encontrado
                  </div>
                ) : (
                  filteredLeads.map(lead => {
                    const result = jobResults.find(r => r.leadId === lead.id);
                    const isSelected = selectedLeads.has(lead.id);
                    
                    return (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => !isGenerating && toggleLeadSelection(lead.id)}
                      >
                        <Checkbox checked={isSelected} disabled={isGenerating} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{lead.name}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {lead.company && <span>{lead.company} • </span>}
                            {lead.email}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {lead.type === 'contact' ? 'Contato' : 'Marketplace'}
                          </Badge>
                          {lead.country && (
                            <Badge variant="secondary" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              {lead.country}
                            </Badge>
                          )}
                          
                          {result && (
                            <Badge 
                              variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {result.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {result.status === 'generating' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              {result.status === 'success' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {result.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {result.status === 'pending' && 'Aguardando'}
                              {result.status === 'generating' && 'Gerando...'}
                              {result.status === 'success' && 'Sucesso'}
                              {result.status === 'error' && 'Erro'}
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Progress */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso: {stats.completed + stats.errors} de {stats.total}</span>
                  <span className="text-muted-foreground">
                    ✅ {stats.completed} sucesso • ❌ {stats.errors} erro(s)
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0">
            {isGenerating ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPaused(!isPaused)}
                  className="gap-2"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? 'Continuar' : 'Pausar'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setIsGenerating(false);
                    setIsPaused(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Fechar
                </Button>
                {jobResults.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setJobResults([]);
                      clearSelection();
                    }}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Nova Geração
                  </Button>
                )}
                <Button 
                  onClick={startBulkGeneration}
                  disabled={selectedLeads.size === 0}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Gerar {selectedLeads.size} Documento(s)
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
