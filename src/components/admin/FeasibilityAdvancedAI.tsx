import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Zap,
  Crown,
  Users,
  Calculator,
  Factory,
  Scale,
  Search,
  BarChart3,
  Leaf,
  Percent,
  ChevronDown,
  ChevronUp,
  Info,
  Copy,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// 7 Specialized AI Types
type AISpecialist = 
  | 'mathematical' 
  | 'industrial' 
  | 'economic' 
  | 'search' 
  | 'probability' 
  | 'legal' 
  | 'sustainability';

interface AISpecialistConfig {
  id: AISpecialist;
  icon: React.ReactNode;
  labelKey: string;
  descriptionKey: string;
  color: string;
  enabled: boolean;
}

interface FeasibilityStudy {
  id?: string;
  study_name: string;
  location?: string | null;
  country?: string | null;
  daily_capacity_tons: number;
  operating_days_per_year: number;
  utilization_rate: number;
  total_investment: number;
  annual_revenue: number;
  annual_opex: number;
  annual_ebitda: number;
  payback_months: number;
  roi_percentage: number;
  npv_10_years: number;
  irr_percentage: number;
  rubber_granules_price: number;
  rubber_granules_yield: number;
  steel_wire_price: number;
  steel_wire_yield: number;
  textile_fiber_price: number;
  textile_fiber_yield: number;
  tax_rate: number;
  discount_rate?: number;
  equipment_cost?: number;
  installation_cost?: number;
  infrastructure_cost?: number;
  working_capital?: number;
  labor_cost?: number;
  energy_cost?: number;
  maintenance_cost?: number;
  logistics_cost?: number;
  government_royalties_percent?: number;
  environmental_bonus_per_ton?: number;
  collection_model?: string;
}

interface AdvancedAIAnalysisProps {
  study: FeasibilityStudy;
  onAnalysisComplete?: (analysis: string, specialists: AISpecialist[]) => void;
}

interface SpecialistResult {
  specialist: AISpecialist;
  content: string | null;
  status: 'pending' | 'running' | 'success' | 'error';
  error?: string;
  duration?: number;
}

export function FeasibilityAdvancedAI({ study, onAnalysisComplete }: AdvancedAIAnalysisProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [expandedSpecialists, setExpandedSpecialists] = useState<Record<AISpecialist, boolean>>({
    mathematical: false,
    industrial: false,
    economic: false,
    search: false,
    probability: false,
    legal: false,
    sustainability: false
  });
  
  const [specialistResults, setSpecialistResults] = useState<SpecialistResult[]>([]);
  const [consolidatedAnalysis, setConsolidatedAnalysis] = useState<string | null>(null);
  const [analysisStats, setAnalysisStats] = useState<{
    totalTime: number;
    successCount: number;
    keysUsed: number;
  } | null>(null);

  // AI Specialists Configuration
  const specialists: AISpecialistConfig[] = [
    {
      id: 'mathematical',
      icon: <Calculator className="h-4 w-4" />,
      labelKey: 'admin.feasibility.ai.specialists.mathematical',
      descriptionKey: 'admin.feasibility.ai.specialists.mathematicalDesc',
      color: 'text-blue-500',
      enabled: true
    },
    {
      id: 'industrial',
      icon: <Factory className="h-4 w-4" />,
      labelKey: 'admin.feasibility.ai.specialists.industrial',
      descriptionKey: 'admin.feasibility.ai.specialists.industrialDesc',
      color: 'text-orange-500',
      enabled: true
    },
    {
      id: 'economic',
      icon: <TrendingUp className="h-4 w-4" />,
      labelKey: 'admin.feasibility.ai.specialists.economic',
      descriptionKey: 'admin.feasibility.ai.specialists.economicDesc',
      color: 'text-green-500',
      enabled: true
    },
    {
      id: 'search',
      icon: <Search className="h-4 w-4" />,
      labelKey: 'admin.feasibility.ai.specialists.search',
      descriptionKey: 'admin.feasibility.ai.specialists.searchDesc',
      color: 'text-purple-500',
      enabled: true
    },
    {
      id: 'probability',
      icon: <BarChart3 className="h-4 w-4" />,
      labelKey: 'admin.feasibility.ai.specialists.probability',
      descriptionKey: 'admin.feasibility.ai.specialists.probabilityDesc',
      color: 'text-cyan-500',
      enabled: true
    },
    {
      id: 'legal',
      icon: <Scale className="h-4 w-4" />,
      labelKey: 'admin.feasibility.ai.specialists.legal',
      descriptionKey: 'admin.feasibility.ai.specialists.legalDesc',
      color: 'text-amber-500',
      enabled: true
    },
    {
      id: 'sustainability',
      icon: <Leaf className="h-4 w-4" />,
      labelKey: 'admin.feasibility.ai.specialists.sustainability',
      descriptionKey: 'admin.feasibility.ai.specialists.sustainabilityDesc',
      color: 'text-emerald-500',
      enabled: true
    }
  ];

  const [enabledSpecialists, setEnabledSpecialists] = useState<Record<AISpecialist, boolean>>(
    specialists.reduce((acc, s) => ({ ...acc, [s.id]: s.enabled }), {} as Record<AISpecialist, boolean>)
  );

  const toggleSpecialist = (id: AISpecialist) => {
    setEnabledSpecialists(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getViabilityBadge = () => {
    const roi = study.roi_percentage || 0;
    const payback = study.payback_months || 999;
    const npv = study.npv_10_years || 0;
    
    if (roi > 25 && payback < 48 && npv > 0) {
      return { label: t('admin.feasibility.ai.excellent', 'Excelente'), variant: 'default' as const, className: 'bg-green-500' };
    }
    if (roi > 15 && payback < 60 && npv > 0) {
      return { label: t('admin.feasibility.ai.good', 'Bom'), variant: 'default' as const, className: 'bg-primary' };
    }
    if (roi > 10 && payback < 84) {
      return { label: t('admin.feasibility.ai.moderate', 'Moderado'), variant: 'secondary' as const, className: 'bg-amber-500 text-white' };
    }
    return { label: t('admin.feasibility.ai.risky', 'Arriscado'), variant: 'destructive' as const, className: '' };
  };

  const runAdvancedAnalysis = useCallback(async () => {
    const activeSpecialists = specialists.filter(s => enabledSpecialists[s.id]).map(s => s.id);
    
    if (activeSpecialists.length === 0) {
      toast({
        title: t('admin.feasibility.ai.noSpecialists', 'Nenhum Especialista Selecionado'),
        description: t('admin.feasibility.ai.selectAtLeastOne', 'Selecione pelo menos uma IA especialista.'),
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setCurrentPhase(t('admin.feasibility.ai.initializing', 'Inicializando análise avançada...'));
    setSpecialistResults([]);
    setConsolidatedAnalysis(null);
    setAnalysisStats(null);

    const startTime = Date.now();

    try {
      // Initialize results
      const initialResults: SpecialistResult[] = activeSpecialists.map(id => ({
        specialist: id,
        content: null,
        status: 'pending'
      }));
      setSpecialistResults(initialResults);

      // Call the advanced analysis endpoint
      setCurrentPhase(t('admin.feasibility.ai.callingAI', 'Chamando 7 IAs especializadas...'));
      setProgress(10);

      const response = await supabase.functions.invoke('analyze-feasibility', {
        body: {
          study: {
            ...study,
            location: study.location || '',
            country: study.country || ''
          },
          language: i18n.language,
          model: 'advanced-7ai',
          enabledSpecialists: activeSpecialists,
          advancedOptions: {
            includeMonteCarlo: true,
            includeNPVSensitivity: true,
            includeESGMetrics: true,
            includeLegalFramework: true,
            includeWebSearch: true,
            iterations: 1000
          }
        }
      });

      const { data, error: fnError } = response;

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setProgress(80);
      setCurrentPhase(t('admin.feasibility.ai.processing', 'Processando resultados...'));

      // Update specialist results from response
      if (data?.specialist_results) {
        const updatedResults: SpecialistResult[] = activeSpecialists.map(id => {
          const result = data.specialist_results[id];
          return {
            specialist: id,
            content: result?.content || null,
            status: result?.success ? 'success' : (result?.error ? 'error' : 'pending'),
            error: result?.error,
            duration: result?.duration
          };
        });
        setSpecialistResults(updatedResults);
      }

      // Set consolidated analysis
      if (data?.analysis) {
        setConsolidatedAnalysis(data.analysis);
        onAnalysisComplete?.(data.analysis, activeSpecialists);
      }

      // Set stats
      setAnalysisStats({
        totalTime: (Date.now() - startTime) / 1000,
        successCount: data?.stats?.successful_analyses || activeSpecialists.length,
        keysUsed: data?.stats?.keys_used || 7
      });

      setProgress(100);
      setCurrentPhase(t('admin.feasibility.ai.complete', 'Análise completa!'));

      toast({
        title: t('admin.feasibility.ai.analysisComplete', 'Análise Avançada Completa'),
        description: t('admin.feasibility.ai.analysisCompleteDesc', '7 IAs analisaram o estudo com sucesso.'),
      });

    } catch (err: any) {
      console.error('Advanced analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      toast({
        title: t('admin.feasibility.ai.analysisFailed', 'Falha na Análise'),
        description: errorMessage,
        variant: 'destructive'
      });

      setCurrentPhase(t('admin.feasibility.ai.failed', 'Falha na análise'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [study, enabledSpecialists, specialists, i18n.language, t, toast, onAnalysisComplete]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: t('common.copied', 'Copiado!'),
      description: t('common.copiedToClipboard', 'Conteúdo copiado para a área de transferência.')
    });
  };

  const viability = getViabilityBadge();

  const getSpecialistLabel = (id: AISpecialist): string => {
    const labels: Record<AISpecialist, string> = {
      mathematical: 'Engenharia Matemática',
      industrial: 'Implementação Industrial',
      economic: 'Viabilidade Econômica',
      search: 'Busca de Dados',
      probability: 'Análise Probabilística',
      legal: 'Conformidade Jurídica',
      sustainability: 'Sustentabilidade ESG'
    };
    return labels[id];
  };

  const getSpecialistColor = (id: AISpecialist): string => {
    const colors: Record<AISpecialist, string> = {
      mathematical: 'text-blue-500',
      industrial: 'text-orange-500',
      economic: 'text-green-500',
      search: 'text-purple-500',
      probability: 'text-cyan-500',
      legal: 'text-amber-500',
      sustainability: 'text-emerald-500'
    };
    return colors[id];
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {t('admin.feasibility.ai.advancedTitle', 'Análise Avançada - 7 IAs Especializadas')}
          </span>
          <Badge className={viability.className}>
            {viability.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Metrics Summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-background/50 rounded-lg">
            <span className="text-xs text-muted-foreground block">{t('admin.feasibility.roi', 'ROI')}</span>
            <span className={`font-bold text-sm ${study.roi_percentage > 20 ? 'text-green-600' : study.roi_percentage > 10 ? 'text-primary' : 'text-amber-600'}`}>
              {study.roi_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-center p-2 bg-background/50 rounded-lg">
            <span className="text-xs text-muted-foreground block">{t('admin.feasibility.irr', 'TIR')}</span>
            <span className={`font-bold text-sm ${study.irr_percentage > 15 ? 'text-green-600' : 'text-amber-600'}`}>
              {study.irr_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-center p-2 bg-background/50 rounded-lg">
            <span className="text-xs text-muted-foreground block">{t('admin.feasibility.payback', 'Payback')}</span>
            <span className={`font-bold text-sm ${study.payback_months < 48 ? 'text-green-600' : 'text-amber-600'}`}>
              {study.payback_months}m
            </span>
          </div>
          <div className="text-center p-2 bg-background/50 rounded-lg">
            <span className="text-xs text-muted-foreground block">{t('admin.feasibility.npv10Years', 'VPL 10a')}</span>
            <span className={`font-bold text-sm ${study.npv_10_years > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {study.npv_10_years > 0 ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
              {' '}${(Math.abs(study.npv_10_years) / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>

        {/* Specialists Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t('admin.feasibility.ai.selectSpecialists', 'Selecionar IAs Especialistas')}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const allEnabled = Object.values(enabledSpecialists).every(v => v);
                const newState = specialists.reduce((acc, s) => ({ ...acc, [s.id]: !allEnabled }), {} as Record<AISpecialist, boolean>);
                setEnabledSpecialists(newState);
              }}
            >
              {Object.values(enabledSpecialists).every(v => v) 
                ? t('common.deselectAll', 'Desmarcar Todos')
                : t('common.selectAll', 'Selecionar Todos')}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {specialists.map((specialist) => (
              <TooltipProvider key={specialist.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        enabledSpecialists[specialist.id] 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border bg-background/50 opacity-60'
                      }`}
                      onClick={() => toggleSpecialist(specialist.id)}
                    >
                      <Switch 
                        checked={enabledSpecialists[specialist.id]}
                        onCheckedChange={() => toggleSpecialist(specialist.id)}
                        className="scale-75"
                      />
                      <span className={specialist.color}>{specialist.icon}</span>
                      <span className="text-xs font-medium truncate">
                        {getSpecialistLabel(specialist.id)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">
                      {specialist.id === 'mathematical' && 'Cálculos avançados: integrais, NPV, IRR, simulações Monte Carlo'}
                      {specialist.id === 'industrial' && 'Otimização de processos, layout de plantas, escalabilidade fabril'}
                      {specialist.id === 'economic' && 'ROI, NPV, TIR, sensibilidade, análise de cenários'}
                      {specialist.id === 'search' && 'Busca de leis, preços de mercado, dados atualizados'}
                      {specialist.id === 'probability' && 'Distribuições estatísticas, risco, previsões'}
                      {specialist.id === 'legal' && '+20 leis por país, conformidade regulatória'}
                      {specialist.id === 'sustainability' && 'ESG Score, CO2, economia circular, Net Zero'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{currentPhase}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Run Analysis Button */}
        <Button 
          onClick={runAdvancedAnalysis} 
          disabled={isAnalyzing}
          className="w-full gap-2"
          variant={consolidatedAnalysis ? "outline" : "default"}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('admin.feasibility.ai.analyzing', 'Analisando...')}
            </>
          ) : consolidatedAnalysis ? (
            <>
              <RefreshCw className="h-4 w-4" />
              {t('admin.feasibility.ai.reanalyze', 'Reanalisar')}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t('admin.feasibility.ai.runAdvanced', 'Executar Análise com 7 IAs')}
            </>
          )}
        </Button>

        {/* Analysis Stats */}
        {analysisStats && (
          <div className="flex items-center justify-center gap-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="text-center">
              <span className="text-xs text-muted-foreground block">Tempo Total</span>
              <span className="font-bold text-sm">{analysisStats.totalTime.toFixed(1)}s</span>
            </div>
            <div className="text-center">
              <span className="text-xs text-muted-foreground block">IAs Utilizadas</span>
              <span className="font-bold text-sm">{analysisStats.keysUsed}</span>
            </div>
            <div className="text-center">
              <span className="text-xs text-muted-foreground block">Sucesso</span>
              <span className="font-bold text-sm text-green-600">{analysisStats.successCount}/7</span>
            </div>
          </div>
        )}

        {/* Specialist Results */}
        <AnimatePresence>
          {specialistResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Label className="text-sm font-medium">
                {t('admin.feasibility.ai.specialistResults', 'Resultados por Especialista')}
              </Label>
              
              {specialistResults.map((result) => (
                <Collapsible 
                  key={result.specialist}
                  open={expandedSpecialists[result.specialist]}
                  onOpenChange={(open) => setExpandedSpecialists(prev => ({ ...prev, [result.specialist]: open }))}
                >
                  <CollapsibleTrigger asChild>
                    <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                      result.status === 'success' ? 'border-green-500/30 bg-green-500/5' :
                      result.status === 'error' ? 'border-red-500/30 bg-red-500/5' :
                      result.status === 'running' ? 'border-blue-500/30 bg-blue-500/5' :
                      'border-border'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={getSpecialistColor(result.specialist)}>
                          {specialists.find(s => s.id === result.specialist)?.icon}
                        </span>
                        <span className="font-medium text-sm">{getSpecialistLabel(result.specialist)}</span>
                        {result.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {result.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {result.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.duration && (
                          <span className="text-xs text-muted-foreground">{result.duration.toFixed(1)}s</span>
                        )}
                        {expandedSpecialists[result.specialist] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {result.content && (
                      <div className="mt-2 p-3 bg-muted/30 rounded-lg border">
                        <div className="flex justify-end mb-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(result.content || '')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert max-h-[300px] overflow-y-auto">
                          {result.content.split('\n').map((line, i) => {
                            const trimmed = line.trim();
                            if (!trimmed) return null;
                            
                            if (trimmed.match(/^\d+\./)) {
                              return <p key={i} className="font-semibold mt-2">{trimmed}</p>;
                            }
                            return <p key={i} className="text-sm text-muted-foreground">{trimmed}</p>;
                          })}
                        </div>
                      </div>
                    )}
                    {result.error && (
                      <div className="mt-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="text-sm text-red-600">{result.error}</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Consolidated Analysis */}
        <AnimatePresence>
          {consolidatedAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('admin.feasibility.ai.analysisReady', 'Análise Consolidada Pronta')}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard(consolidatedAnalysis)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {t('common.copyAll', 'Copiar Tudo')}
                </Button>
              </div>
              
              <div className="rounded-xl border border-border/50 bg-gradient-to-br from-background via-muted/30 to-background shadow-sm overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto p-5 space-y-4">
                  {consolidatedAnalysis.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;

                    // Main section headers
                    if (trimmed.match(/^(##|[0-9]+\.)\s/) || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
                      const text = trimmed.replace(/^(##\s|\*\*|\*\*$)/g, '').replace(/\*\*/g, '');
                      return (
                        <h3 key={i} className="flex items-center gap-2 text-base font-bold text-primary border-b border-primary/20 pb-2 mt-6 first:mt-0">
                          <span className="w-1.5 h-5 bg-primary rounded-full" />
                          {text}
                        </h3>
                      );
                    }

                    // Bullet points
                    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
                      const content = trimmed.replace(/^[-•*]\s/, '');
                      return (
                        <div key={i} className="flex items-start gap-2 ml-3 text-sm text-muted-foreground">
                          <span className="text-primary mt-1.5">•</span>
                          <p>{content}</p>
                        </div>
                      );
                    }

                    // Regular paragraph
                    return (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
