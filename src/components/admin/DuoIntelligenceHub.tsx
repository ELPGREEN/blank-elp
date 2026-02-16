/**
 * Duo Inteligência Empresarial Hub
 * Pipeline AUTOMÁTICO: Digite nome da empresa → IAs buscam e analisam tudo
 * Jina Reader (FREE) → Groq (FREE) → Gemini (FREE)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import logoElp from '@/assets/logo-elp-new.png';
import { generateIntelligencePDF } from '@/lib/generateIntelligencePDF';
import {
  Brain,
  Sparkles,
  Globe,
  Loader2,
  Trash2,
  Play,
  Zap,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  History,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileDown,
  Search,
  Building2,
  MapPin,
  Briefcase,
  Database,
  Filter,
  X,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalysisResult {
  id: string;
  created_at: string;
  urls: string[];
  insights_claude: string | null;
  complemento_gemini: string | null;
  relatorio_markdown: string | null;
  modo_rapido: boolean;
  status: string;
}

interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}

interface DiscoveredUrl {
  url: string;
  title: string;
  source: string;
}

interface CompanyIntelligence {
  id: string;
  company_name: string;
  company_name_normalized: string;
  country: string | null;
  industry: string | null;
  collected_urls: DiscoveredUrl[];
  collected_data: string | null;
  ai_insights: string | null;
  leadership_data: Array<{ nome: string; cargo: string; linkedin?: string }>;
  products_services: Array<{ produto: string; preco?: string }>;
  financial_data: Record<string, unknown>;
  contact_info: Record<string, unknown>;
  social_links: Array<{ platform: string; url: string }>;
  analysis_count: number;
  last_analyzed_at: string;
}

export function DuoIntelligenceHub() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State - SIMPLIFIED: just company name
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [industry, setIndustry] = useState('');
  const [modoRapido, setModoRapido] = useState(false);
  const [additionalText, setAdditionalText] = useState(''); // For pasting additional text
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<CompanyIntelligence[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Advanced filter states
  const [filterCountry, setFilterCountry] = useState<string>('');
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  
  // Discovered URLs state
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredUrl[]>([]);
  
  // Existing company data state
  const [existingCompanyData, setExistingCompanyData] = useState<CompanyIntelligence | null>(null);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    insights_groq?: string;
    complemento_gemini?: string;
    relatorio_markdown?: string;
  } | null>(null);
  
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: 'lookup', label: 'Verificando dados existentes', status: 'pending' },
    { id: 'discover', label: 'Descobrindo URLs na internet', status: 'pending' },
    { id: 'google', label: 'Verificando dados no Google', status: 'pending' },
    { id: 'collect', label: 'Coletando dados das páginas', status: 'pending' },
    { id: 'groq', label: 'Análise de inteligência (IA)', status: 'pending' },
    { id: 'gemini', label: 'Validação e sugestões (IA)', status: 'pending' },
    { id: 'save', label: 'Salvando inteligência acumulada', status: 'pending' },
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AnalysisResult | null>(null);
  
  // Language selection for PDF download
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('pt');
  const [pendingPdfMarkdown, setPendingPdfMarkdown] = useState<string | null>(null);

  // Fetch previous analyses
  const { data: previousAnalyses, isLoading: loadingHistory } = useQuery({
    queryKey: ['duo-analyses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analises')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as AnalysisResult[];
    },
    enabled: !!user,
  });

  // Update step status helper
  const updateStep = (stepId: string, status: AnalysisStep['status'], message?: string) => {
    setSteps(prev => prev.map(s => 
      s.id === stepId ? { ...s, status, message } : s
    ));
  };

  // Reset steps
  const resetSteps = () => {
    setSteps([
      { id: 'lookup', label: 'Verificando dados existentes', status: 'pending' },
      { id: 'discover', label: 'Descobrindo URLs na internet', status: 'pending' },
      { id: 'google', label: 'Verificando dados no Google', status: 'pending' },
      { id: 'collect', label: 'Coletando dados das páginas', status: 'pending' },
      { id: 'groq', label: 'Análise de inteligência (IA)', status: 'pending' },
      { id: 'gemini', label: 'Validação e sugestões (IA)', status: 'pending' },
      { id: 'save', label: 'Salvando inteligência acumulada', status: 'pending' },
    ]);
  };

  // Helper to normalize company name for matching
  const normalizeCompanyName = (name: string) => {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  // Debounced autocomplete search with filters
  const searchCompanies = useCallback(async (searchTerm: string) => {
    // Allow search even with empty term if filters are set
    const hasFilters = filterCountry || filterIndustry || filterDateFrom || filterDateTo;
    
    if (searchTerm.length < 2 && !hasFilters) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    setIsSearching(true);
    try {
      let query = supabase
        .from('company_intelligence')
        .select('*');
      
      // Apply name filter
      if (searchTerm.length >= 2) {
        const normalizedSearch = normalizeCompanyName(searchTerm);
        query = query.ilike('company_name_normalized', `%${normalizedSearch}%`);
      }
      
      // Apply country filter
      if (filterCountry) {
        query = query.ilike('country', `%${filterCountry}%`);
      }
      
      // Apply industry filter
      if (filterIndustry) {
        query = query.ilike('industry', `%${filterIndustry}%`);
      }
      
      // Apply date filters
      if (filterDateFrom) {
        query = query.gte('last_analyzed_at', filterDateFrom);
      }
      if (filterDateTo) {
        query = query.lte('last_analyzed_at', `${filterDateTo}T23:59:59`);
      }
      
      const { data, error } = await query
        .order('analysis_count', { ascending: false })
        .limit(12);

      if (error) throw error;
      
      setAutocompleteResults((data || []) as unknown as CompanyIntelligence[]);
      setShowAutocomplete((data || []).length > 0);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setAutocompleteResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [filterCountry, filterIndustry, filterDateFrom, filterDateTo]);

  // Clear all filters
  const clearFilters = () => {
    setFilterCountry('');
    setFilterIndustry('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // Count active filters
  const activeFiltersCount = [filterCountry, filterIndustry, filterDateFrom, filterDateTo].filter(Boolean).length;

  // Debounce effect for autocomplete
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasFilters = filterCountry || filterIndustry || filterDateFrom || filterDateTo;
      if (companyName.trim() || hasFilters) {
        searchCompanies(companyName);
      } else {
        setAutocompleteResults([]);
        setShowAutocomplete(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [companyName, searchCompanies, filterCountry, filterIndustry, filterDateFrom, filterDateTo]);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle company selection from autocomplete
  const handleSelectCompany = (company: CompanyIntelligence) => {
    setCompanyName(company.company_name);
    setExistingCompanyData(company);
    if (company.country) setCountry(company.country);
    if (company.industry) setIndustry(company.industry);
    setShowAutocomplete(false);
    toast.success(`Empresa "${company.company_name}" selecionada com ${company.analysis_count} análise(s) anterior(es)`);
  };

  // Main analysis mutation - FULLY AUTOMATIC with accumulated intelligence
  const analysisMutation = useMutation({
    mutationFn: async () => {
      if (!companyName.trim()) {
        throw new Error('Digite o nome da empresa para analisar');
      }

      resetSteps();
      setCurrentAnalysis(null);
      setDiscoveredUrls([]);
      setExistingCompanyData(null);

      const normalizedName = normalizeCompanyName(companyName);

      // Step 0: Check for existing company data
      updateStep('lookup', 'running');
      
      const { data: existingData } = await supabase
        .from('company_intelligence')
        .select('*')
        .eq('company_name_normalized', normalizedName)
        .single();

      let previousUrls: DiscoveredUrl[] = [];
      let previousInsights = '';
      let previousData = '';

      if (existingData) {
        setExistingCompanyData(existingData as unknown as CompanyIntelligence);
        previousUrls = (existingData.collected_urls as unknown as DiscoveredUrl[]) || [];
        previousInsights = existingData.ai_insights || '';
        previousData = existingData.collected_data || '';
        updateStep('lookup', 'completed', `${existingData.analysis_count}x análises anteriores`);
      } else {
        updateStep('lookup', 'completed', 'Primeira análise');
      }

      // Step 1: DISCOVER URLs automatically
      updateStep('discover', 'running');
      
      const { data: discoverData, error: discoverError } = await supabase.functions.invoke(
        'discover-company-urls',
        { 
          body: { 
            companyName: companyName.trim(),
            country,
            industry,
          } 
        }
      );

      if (discoverError || !discoverData?.success) {
        const errorMsg = discoverData?.error || discoverError?.message || 'Falha ao descobrir URLs';
        updateStep('discover', 'error', errorMsg);
        throw new Error(errorMsg);
      }

      const foundUrls: DiscoveredUrl[] = discoverData.urls || [];
      
      // Merge with existing URLs (avoid duplicates)
      const existingUrlSet = new Set(previousUrls.map(u => u.url));
      const newUrls = foundUrls.filter(u => !existingUrlSet.has(u.url));
      const allUrls = [...previousUrls, ...newUrls];
      
      setDiscoveredUrls(allUrls);
      
      if (allUrls.length === 0 && !additionalText.trim()) {
        throw new Error(`Nenhum resultado encontrado para "${companyName}". Tente outro nome ou cole texto adicional.`);
      }

      updateStep('discover', 'completed', `${newUrls.length} novas URLs (${allUrls.length} total)`);

      // Step 1.5: Fetch verified Google data via SerpAPI
      updateStep('google', 'running');
      
      let googleVerifiedData = null;
      try {
        // Try to get "About This Result" from Google for the main website
        const officialUrl = foundUrls.find(u => u.source === 'official')?.url || foundUrls[0]?.url;
        
        if (officialUrl) {
          const { data: serpData, error: serpError } = await supabase.functions.invoke(
            'serpapi-about',
            { 
              body: { 
                url: officialUrl,
                companyName: companyName.trim()
              } 
            }
          );

          if (serpData?.success && serpData?.extracted) {
            googleVerifiedData = serpData.extracted;
            console.log('Google verified data:', googleVerifiedData);
            updateStep('google', 'completed', 'Dados verificados');
          } else {
            updateStep('google', 'completed', 'Dados parciais');
          }
        } else {
          updateStep('google', 'completed', 'URL não encontrada');
        }
      } catch (googleError) {
        console.warn('Google About This Result failed:', googleError);
        updateStep('google', 'completed', 'Ignorado');
      }

      // Extract just the NEW URLs for collection (skip already collected ones)
      const urlsToScrape = newUrls.map(u => u.url).slice(0, 8); // Limit to 8 new URLs

      // Step 2: Collect data with Jina Reader (FREE)
      updateStep('collect', 'running');
      
      let newCollectedText = '';
      
      if (urlsToScrape.length > 0) {
        const { data: collectData, error: collectError } = await supabase.functions.invoke(
          'coletar-dados-concorrentes',
          { body: { urls: urlsToScrape } }
        );

        if (collectError || !collectData?.success) {
          const errorMsg = collectData?.error || collectError?.message || 'Falha ao coletar dados';
          updateStep('collect', 'error', errorMsg);
          throw new Error(errorMsg);
        }

        updateStep('collect', 'completed', `${collectData.stats.success}/${collectData.stats.total} páginas`);
        newCollectedText = collectData.texto_completo || '';
      } else {
        updateStep('collect', 'completed', 'Usando dados existentes');
      }

      // Combine previous data + new data + additional text (no duplicates)
      let enrichedText = '';
      
      // Add existing AI insights as context
      if (previousInsights) {
        enrichedText += `=== ANÁLISE ANTERIOR (USAR COMO CONTEXTO, NÃO REPETIR) ===\n${previousInsights}\n\n`;
      }
      
      // Add existing collected data
      if (previousData) {
        enrichedText += `=== DADOS ANTERIORES ===\n${previousData.substring(0, 5000)}\n\n`;
      }
      
      // Add new collected data
      if (newCollectedText) {
        enrichedText += `=== NOVOS DADOS COLETADOS ===\n${newCollectedText}\n\n`;
      }
      
      // Add user-pasted additional text
      if (additionalText.trim()) {
        enrichedText += `=== TEXTO ADICIONAL FORNECIDO PELO USUÁRIO ===\n${additionalText.trim()}\n\n`;
      }

      if (!enrichedText.trim()) {
        throw new Error('Nenhum conteúdo disponível para análise.');
      }

      // Step 3: Analyze with Groq (FREE tier) - Include Google verified data
      updateStep('groq', 'running');

      // Append Google verified data to the text for better analysis
      if (googleVerifiedData) {
        enrichedText += `\n\n=== DADOS VERIFICADOS DO GOOGLE ===\n`;
        if (googleVerifiedData.companyName) enrichedText += `Nome: ${googleVerifiedData.companyName}\n`;
        if (googleVerifiedData.subtitle) enrichedText += `Tipo: ${googleVerifiedData.subtitle}\n`;
        if (googleVerifiedData.description) enrichedText += `Descrição: ${googleVerifiedData.description}\n`;
        if (googleVerifiedData.companyDetails?.length > 0) {
          googleVerifiedData.companyDetails.forEach((d: { field: string; value: string }) => {
            enrichedText += `${d.field}: ${d.value}\n`;
          });
        }
        if (googleVerifiedData.socialLinks?.length > 0) {
          enrichedText += `Redes Sociais: ${googleVerifiedData.socialLinks.map((s: { platform: string }) => s.platform).join(', ')}\n`;
        }
        if (googleVerifiedData.firstIndexed) enrichedText += `No Google desde: ${googleVerifiedData.firstIndexed}\n`;
        if (googleVerifiedData.reviews?.length > 0) {
          enrichedText += `Avaliações: ${googleVerifiedData.reviews.map((r: { source: string; rating: number }) => `${r.source}: ${r.rating}`).join(', ')}\n`;
        }
      }

      // Add instruction for AI to avoid repetition
      const aiInstruction = `INSTRUÇÕES IMPORTANTES: 
1. Você está recebendo dados ACUMULADOS de múltiplas análises desta empresa.
2. NÃO REPITA informações que já estão na análise anterior.
3. ADICIONE apenas NOVAS informações e insights.
4. EXPANDA a análise com detalhes adicionais encontrados nos novos dados.
5. Se houver texto adicional fornecido pelo usuário, use-o para validar e enriquecer a análise.
`;

      const { data: groqData, error: groqError } = await supabase.functions.invoke(
        'analisar-com-groq',
        { 
          body: { 
            texto_completo: aiInstruction + '\n\n' + enrichedText,
            modo_rapido: modoRapido,
            companyName: companyName.trim(),
            googleVerifiedData, // Pass structured data too
          } 
        }
      );

      if (groqError || !groqData?.success) {
        const errorMsg = groqData?.error || groqError?.message || 'Falha na análise';
        updateStep('groq', 'error', errorMsg);
        throw new Error(errorMsg);
      }

      updateStep('groq', 'completed', groqData.model);
      setCurrentAnalysis(prev => ({ ...prev, insights_groq: groqData.insights }));

      // Step 4: Complement with Gemini (FREE tier)
      updateStep('gemini', 'running');

      // Pass additional text directly - the edge function will use the specialized prompt
      const { data: geminiData, error: geminiError } = await supabase.functions.invoke(
        'complementar-com-gemini',
        { 
          body: { 
            insights_claude: groqData.insights,
            modo_rapido: modoRapido,
            // Only pass additionalText if user provided it - edge function will handle the specialized prompt
            additionalText: additionalText.trim() || undefined,
          } 
        }
      );

      if (geminiError || !geminiData?.success) {
        const errorMsg = geminiData?.error || geminiError?.message || 'Falha na validação';
        updateStep('gemini', 'error', errorMsg);
        throw new Error(errorMsg);
      }

      updateStep('gemini', 'completed');
      setCurrentAnalysis(prev => ({ ...prev, complemento_gemini: geminiData.complemento_gemini }));

      // Step 5: Generate final report
      updateStep('save', 'running');

      const now = new Date().toLocaleString('pt-BR');
      
      // Parse and format Groq insights for human-readable markdown
      let formattedInsights = '';
      try {
        const parsed = typeof groqData.insights === 'string' 
          ? JSON.parse(groqData.insights) 
          : groqData.insights_parsed || groqData.insights;
        
        if (parsed && typeof parsed === 'object') {
          // Company Data Section
          if (parsed.dados_empresa) {
            const de = parsed.dados_empresa;
            formattedInsights += `### Dados Cadastrais da Empresa\n`;
            if (de.razao_social) formattedInsights += `- **Razão Social:** ${de.razao_social}\n`;
            if (de.cnpj_registro) formattedInsights += `- **CNPJ/Registro:** ${de.cnpj_registro}\n`;
            if (de.endereco) formattedInsights += `- **Endereço:** ${de.endereco}\n`;
            if (de.telefones?.length > 0) formattedInsights += `- **Telefones:** ${de.telefones.join(', ')}\n`;
            if (de.emails?.length > 0) formattedInsights += `- **E-mails:** ${de.emails.join(', ')}\n`;
            if (de.website) formattedInsights += `- **Website:** ${de.website}\n`;
            formattedInsights += '\n';
          }
          
          // Directors/Leadership Section
          if (parsed.diretoria?.length > 0) {
            formattedInsights += `### Diretoria e Liderança\n`;
            parsed.diretoria.forEach((dir: { nome: string; cargo: string; linkedin?: string }) => {
              let line = `- **${dir.nome}** - ${dir.cargo}`;
              if (dir.linkedin) line += ` ([LinkedIn](${dir.linkedin}))`;
              formattedInsights += `${line}\n`;
            });
            formattedInsights += '\n';
          }
          
          if (parsed.resumo_executivo) {
            formattedInsights += `### Resumo Executivo\n${parsed.resumo_executivo}\n\n`;
          }
          
          if (parsed.perfil_empresa) {
            formattedInsights += `### Perfil da Empresa\n${parsed.perfil_empresa}\n\n`;
          }
          
          if (parsed.estrategias_marketing?.length > 0) {
            formattedInsights += `### Estratégias de Marketing Identificadas\n`;
            parsed.estrategias_marketing.forEach((item: string) => {
              formattedInsights += `- ${item}\n`;
            });
            formattedInsights += '\n';
          }
          
          if (parsed.precos_produtos?.length > 0) {
            formattedInsights += `### Produtos e Preços\n`;
            parsed.precos_produtos.forEach((item: { produto: string; preco: string; url?: string }) => {
              formattedInsights += `- **${item.produto}**: ${item.preco}${item.url ? ` ([ver](${item.url}))` : ''}\n`;
            });
            formattedInsights += '\n';
          }
          
          if (parsed.oportunidades_diferencial?.length > 0) {
            formattedInsights += `### Oportunidades de Diferencial Competitivo\n`;
            parsed.oportunidades_diferencial.forEach((item: string) => {
              formattedInsights += `- ${item}\n`;
            });
            formattedInsights += '\n';
          }
          
          if (parsed.reclamacoes_clientes?.length > 0) {
            formattedInsights += `### Reclamações de Clientes (Oportunidades)\n`;
            parsed.reclamacoes_clientes.forEach((item: string) => {
              formattedInsights += `- ${item}\n`;
            });
            formattedInsights += '\n';
          }
          
          if (parsed.pontos_fortes?.length > 0) {
            formattedInsights += `### Pontos Fortes\n`;
            parsed.pontos_fortes.forEach((item: string) => {
              formattedInsights += `- ${item}\n`;
            });
            formattedInsights += '\n';
          }
          
          if (parsed.pontos_fracos?.length > 0) {
            formattedInsights += `### Pontos Fracos\n`;
            parsed.pontos_fracos.forEach((item: string) => {
              formattedInsights += `- ${item}\n`;
            });
            formattedInsights += '\n';
          }
        } else {
          formattedInsights = groqData.insights;
        }
      } catch {
        formattedInsights = groqData.insights;
      }
      
      const relatorioMarkdown = `# Relatório de Inteligência Empresarial
**ELP Green Technology**

**Empresa Analisada:** ${companyName}
**País:** ${country}
${industry ? `**Setor:** ${industry}` : ''}
**Gerado em:** ${now}

---

## Fontes Consultadas (${foundUrls.length} URLs)
${foundUrls.slice(0, 8).map(u => `- [${u.title || u.url}](${u.url})`).join('\n')}

---

## Análise de Mercado

${formattedInsights}

---

## Validação e Recomendações Estratégicas

${geminiData.complemento_gemini}

---

*Departamento de Inteligência Empresarial - ELP Green Technology*
*Este relatório foi gerado automaticamente através de análise de fontes públicas da internet.*
`;

      setCurrentAnalysis(prev => ({ ...prev, relatorio_markdown: relatorioMarkdown }));

      // Save to analises table
      const { error: saveError } = await supabase
        .from('analises')
        .insert({
          user_id: user?.id,
          urls: allUrls.map(u => u.url),
          insights_claude: groqData.insights,
          complemento_gemini: geminiData.complemento_gemini,
          relatorio_markdown: relatorioMarkdown,
          modo_rapido: modoRapido,
          status: 'completed',
        });

      if (saveError) {
        console.error('Error saving analysis:', saveError);
      }

      // Save/Update company_intelligence for accumulated data
      const companyIntelData = {
        company_name: companyName.trim(),
        company_name_normalized: normalizedName,
        country,
        industry: industry || null,
        collected_urls: JSON.parse(JSON.stringify(allUrls)), // Convert to JSON-compatible
        collected_data: (previousData + '\n\n' + newCollectedText).substring(0, 50000),
        ai_insights: groqData.insights,
        last_analyzed_at: new Date().toISOString(),
      };

      if (existingData) {
        await supabase
          .from('company_intelligence')
          .update({
            ...companyIntelData,
            analysis_count: (existingData.analysis_count || 1) + 1,
          })
          .eq('id', existingData.id);
      } else {
        await supabase
          .from('company_intelligence')
          .insert({
            ...companyIntelData,
            analysis_count: 1,
            created_by: user?.id,
          });
      }

      updateStep('save', 'completed', 'Inteligência acumulada!');

      // Invalidate queries to refresh history
      queryClient.invalidateQueries({ queryKey: ['duo-analyses'] });

      return { relatorio_markdown: relatorioMarkdown };
    },
    onError: (error) => {
      toast.error(error.message || 'Erro na análise');
    },
    onSuccess: () => {
      toast.success('Análise concluída com sucesso!');
    },
  });

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  // Available languages for PDF download
  const pdfLanguages = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  ];
  
  // Open language selection modal before PDF download
  const handlePdfDownloadClick = (markdown: string) => {
    setPendingPdfMarkdown(markdown);
    setShowLanguageModal(true);
  };
  
  // Download as Professional PDF with selected language
  const downloadPDF = async (language: string) => {
    if (!pendingPdfMarkdown) return;
    
    try {
      // Get current analysis data
      const reportData = {
        companyName: companyName || 'Empresa Analisada',
        country: country || 'Brasil',
        industry: industry || undefined,
        generatedAt: new Date().toLocaleString('pt-BR'),
        urls: discoveredUrls,
        rawMarkdown: pendingPdfMarkdown,
        insightsGroq: currentAnalysis?.insights_groq,
        complementoGemini: currentAnalysis?.complemento_gemini,
      };
      
      await generateIntelligencePDF(reportData, logoElp, language);
      toast.success('PDF profissional baixado com sucesso!');
      setShowLanguageModal(false);
      setPendingPdfMarkdown(null);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  // Step indicator component
  const StepIndicator = ({ step }: { step: AnalysisStep }) => {
    const icons = {
      pending: <Clock className="w-4 h-4 text-muted-foreground" />,
      running: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
      completed: <CheckCircle className="w-4 h-4 text-green-500" />,
      error: <AlertCircle className="w-4 h-4 text-destructive" />,
    };

    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
        step.status === 'running' ? 'bg-primary/10' : 
        step.status === 'completed' ? 'bg-green-500/10' :
        step.status === 'error' ? 'bg-destructive/10' : 'bg-muted/50'
      }`}>
        {icons[step.status]}
        <span className={`text-sm ${step.status === 'running' ? 'font-medium' : ''}`}>
          {step.label}
        </span>
        {step.message && (
          <Badge variant="outline" className="ml-auto text-xs">
            {step.message}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              Inteligência Empresarial
            </h2>
            <p className="text-sm text-muted-foreground">
              Digite o nome da empresa • IAs buscam e analisam automaticamente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="modo-rapido"
              checked={modoRapido}
              onCheckedChange={setModoRapido}
            />
            <Label htmlFor="modo-rapido" className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              Modo Rápido
            </Label>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section - SIMPLIFIED */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="w-4 h-4" />
              Buscar Empresa
            </CardTitle>
            <CardDescription>
              Digite apenas o nome da empresa - as IAs fazem o resto automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="relative" ref={autocompleteRef}>
                <Label htmlFor="company-name" className="text-sm flex items-center gap-1 mb-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Nome da Empresa *
                </Label>
                <div className="relative">
                  <Input
                    ref={inputRef}
                    id="company-name"
                    placeholder="Ex: Ecotyre, Reciclanip, GreenRubber..."
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setExistingCompanyData(null); // Reset when typing new
                    }}
                    onFocus={() => {
                      if (autocompleteResults.length > 0) setShowAutocomplete(true);
                    }}
                    className="font-medium pr-8"
                  />
                  {isSearching && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Advanced Filters Toggle */}
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Filter className="w-3 h-3" />
                    Filtros avançados
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </button>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[10px] text-destructive hover:text-destructive/80 flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" />
                      Limpar
                    </button>
                  )}
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                  <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground mb-1 block">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          País
                        </Label>
                        <Input
                          placeholder="Brasil, USA..."
                          value={filterCountry}
                          onChange={(e) => setFilterCountry(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground mb-1 block">
                          <Briefcase className="w-3 h-3 inline mr-1" />
                          Setor
                        </Label>
                        <Input
                          placeholder="Reciclagem..."
                          value={filterIndustry}
                          onChange={(e) => setFilterIndustry(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground mb-1 block">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          De
                        </Label>
                        <Input
                          type="date"
                          value={filterDateFrom}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground mb-1 block">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Até
                        </Label>
                        <Input
                          type="date"
                          value={filterDateTo}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => searchCompanies(companyName)}
                    >
                      <Search className="w-3 h-3 mr-1" />
                      Buscar no Banco
                    </Button>
                  </div>
                )}

                {/* Autocomplete Dropdown */}
                {showAutocomplete && autocompleteResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
                    <div className="p-1.5 border-b border-border/50 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground px-2">
                        {autocompleteResults.length} empresa(s) encontrada(s)
                      </span>
                      {activeFiltersCount > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {activeFiltersCount} filtro(s)
                        </Badge>
                      )}
                    </div>
                    {autocompleteResults.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => handleSelectCompany(company)}
                        className="w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors flex items-center justify-between gap-2 border-b border-border/30 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{company.company_name}</div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                            {company.country && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                {company.country}
                              </span>
                            )}
                            {company.industry && (
                              <span className="flex items-center gap-0.5">
                                <Briefcase className="w-2.5 h-2.5" />
                                {company.industry}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(company.last_analyzed_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            {company.analysis_count}x
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {company.collected_urls?.length || 0} URLs
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="country" className="text-sm flex items-center gap-1 mb-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  País
                </Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                    <SelectItem value="USA">Estados Unidos</SelectItem>
                    <SelectItem value="China">China</SelectItem>
                    <SelectItem value="Alemanha">Alemanha</SelectItem>
                    <SelectItem value="Reino Unido">Reino Unido</SelectItem>
                    <SelectItem value="França">França</SelectItem>
                    <SelectItem value="Itália">Itália</SelectItem>
                    <SelectItem value="Espanha">Espanha</SelectItem>
                    <SelectItem value="Portugal">Portugal</SelectItem>
                    <SelectItem value="México">México</SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Índia">Índia</SelectItem>
                    <SelectItem value="Japão">Japão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="industry" className="text-sm flex items-center gap-1 mb-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Setor (opcional)
                </Label>
                <Input
                  id="industry"
                  placeholder="Ex: Reciclagem, Tecnologia, Energia..."
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>

              {/* Additional Text Area for expanding AI reach */}
              <div>
                <Label htmlFor="additional-text" className="text-sm flex items-center gap-1 mb-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Texto Adicional (opcional)
                </Label>
                <Textarea
                  id="additional-text"
                  placeholder="Cole aqui textos adicionais: artigos, relatórios, notícias, descrições de produtos... A IA usará para validar e enriquecer a análise."
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  className="min-h-[80px] text-xs resize-y"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Expanda o alcance da IA colando textos externos para validação
                </p>
              </div>
            </div>

            {/* Existing Company Badge */}
            {existingCompanyData && !analysisMutation.isPending && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-sm text-emerald-700 dark:text-emerald-400">
                    Empresa já analisada
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {existingCompanyData.analysis_count}x análises
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Última: {new Date(existingCompanyData.last_analyzed_at).toLocaleDateString('pt-BR')} • 
                  {existingCompanyData.collected_urls?.length || 0} URLs • 
                  Dados serão acumulados (sem repetição)
                </p>
              </div>
            )}

            <Button
              onClick={() => analysisMutation.mutate()}
              disabled={analysisMutation.isPending || !companyName.trim()}
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              {analysisMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : existingCompanyData ? (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Expandir Análise
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Analisar Empresa
                </>
              )}
            </Button>

            {/* Progress Steps */}
            {analysisMutation.isPending && (
              <div className="space-y-2 pt-2">
                {steps.map(step => (
                  <StepIndicator key={step.id} step={step} />
                ))}
              </div>
            )}

            {/* Discovered URLs */}
            {discoveredUrls.length > 0 && !analysisMutation.isPending && (
              <div className="pt-2">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Fontes encontradas ({discoveredUrls.length})
                </Label>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {discoveredUrls.slice(0, 8).map((url, idx) => (
                      <a
                        key={idx}
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary truncate"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{url.title || url.url}</span>
                      </a>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4" />
                Resultados da Análise
              </CardTitle>
              {currentAnalysis && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => currentAnalysis.relatorio_markdown && 
                      copyToClipboard(currentAnalysis.relatorio_markdown)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => currentAnalysis.relatorio_markdown &&
                      handlePdfDownloadClick(currentAnalysis.relatorio_markdown)}
                  >
                    <FileDown className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!currentAnalysis && !analysisMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Brain className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-medium">Digite o nome de uma empresa</p>
                <p className="text-sm">e clique em "Analisar Empresa"</p>
                <p className="text-xs mt-3 text-emerald-600 font-medium">
                  As IAs buscam automaticamente na internet
                </p>
              </div>
            ) : (
              <Tabs defaultValue="report" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="report" className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Relatório
                  </TabsTrigger>
                  <TabsTrigger value="groq" className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Análise
                  </TabsTrigger>
                  <TabsTrigger value="gemini" className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Validação
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="report" className="mt-4">
                  <ScrollArea className="h-[400px] pr-4">
                    {currentAnalysis?.relatorio_markdown ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={currentAnalysis.relatorio_markdown} />
                      </div>
                    ) : analysisMutation.isPending ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                      </div>
                    ) : null}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="groq" className="mt-4">
                  <ScrollArea className="h-[400px] pr-4">
                    {currentAnalysis?.insights_groq ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={currentAnalysis.insights_groq} />
                      </div>
                    ) : analysisMutation.isPending ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                      </div>
                    ) : null}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="gemini" className="mt-4">
                  <ScrollArea className="h-[400px] pr-4">
                    {currentAnalysis?.complemento_gemini ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={currentAnalysis.complemento_gemini} />
                      </div>
                    ) : analysisMutation.isPending ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      </div>
                    ) : null}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Section */}
      <Collapsible open={showHistory} onOpenChange={setShowHistory}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="w-4 h-4" />
                  Histórico de Análises
                  {previousAnalyses && previousAnalyses.length > 0 && (
                    <Badge variant="secondary">{previousAnalyses.length}</Badge>
                  )}
                </CardTitle>
                {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : previousAnalyses && previousAnalyses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {previousAnalyses.map((analysis) => (
                    <Card 
                      key={analysis.id} 
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setSelectedReport(analysis)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={analysis.modo_rapido ? 'outline' : 'default'}>
                            {analysis.modo_rapido ? 'Rápido' : 'Completo'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">
                          {analysis.urls.length} fonte{analysis.urls.length > 1 ? 's' : ''} analisada{analysis.urls.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {analysis.urls[0]}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma análise anterior encontrada
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Report Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Relatório Completo
              {selectedReport && (
                <Badge variant="outline" className="ml-2">
                  {new Date(selectedReport.created_at).toLocaleString('pt-BR')}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedReport.relatorio_markdown && 
                    copyToClipboard(selectedReport.relatorio_markdown)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => selectedReport.relatorio_markdown &&
                    handlePdfDownloadClick(selectedReport.relatorio_markdown)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <FileDown className="w-4 h-4 mr-1" />
                  Baixar PDF
                </Button>
              </div>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedReport.relatorio_markdown ? (
                    <MarkdownRenderer content={selectedReport.relatorio_markdown} />
                  ) : (
                    <>
                      <h2>Análise</h2>
                      <MarkdownRenderer content={selectedReport.insights_claude || 'Não disponível'} />
                      <h2>Validação</h2>
                      <MarkdownRenderer content={selectedReport.complemento_gemini || 'Não disponível'} />
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Language Selection Modal for PDF Download */}
      <Dialog open={showLanguageModal} onOpenChange={setShowLanguageModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Selecionar Idioma do PDF
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escolha o idioma para o cabeçalho e rodapé do documento PDF:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {pdfLanguages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={selectedLanguage === lang.code ? "default" : "outline"}
                  className="justify-start gap-3 h-12"
                  onClick={() => setSelectedLanguage(lang.code)}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                  {selectedLanguage === lang.code && (
                    <CheckCircle className="w-4 h-4 ml-auto text-white" />
                  )}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowLanguageModal(false);
                  setPendingPdfMarkdown(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => downloadPDF(selectedLanguage)}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
