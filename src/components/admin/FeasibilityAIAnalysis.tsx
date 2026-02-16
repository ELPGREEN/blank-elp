import { useState } from 'react';
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
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  getRegionIncentiveDetails, 
  OTR_TIRE_MODELS, 
  OTR_MARKET_PRICES,
  FISCAL_INCENTIVES_DATA 
} from './FiscalIncentivesTable';

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
}

interface AIAnalysisProps {
  study: FeasibilityStudy;
  onAnalysisComplete?: (analysis: string) => void;
}

type AnalysisModel = 'local' | 'flash' | 'pro' | 'collaborative';

interface CollaborativeStats {
  keys_used: number;
  successful_analyses: number;
  aspects_completed: {
    financial: boolean;
    regulatory: boolean;
    market: boolean;
    esg: boolean;
    synthesis: boolean;
  };
}

export function FeasibilityAIAnalysis({ study, onAnalysisComplete }: AIAnalysisProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AnalysisModel>('local');
  const [collaborativeScore, setCollaborativeScore] = useState<number | null>(null);
  const [collaborativeProviders, setCollaborativeProviders] = useState<string[]>([]);
  const [collaborativeStats, setCollaborativeStats] = useState<CollaborativeStats | null>(null);

  const getViabilityBadge = () => {
    const roi = study.roi_percentage || 0;
    const payback = study.payback_months || 999;
    const npv = study.npv_10_years || 0;
    
    if (roi > 25 && payback < 48 && npv > 0) {
      return { label: t('admin.feasibility.ai.excellent'), variant: 'default' as const, className: 'bg-green-500' };
    }
    if (roi > 15 && payback < 60 && npv > 0) {
      return { label: t('admin.feasibility.ai.good'), variant: 'default' as const, className: 'bg-primary' };
    }
    if (roi > 10 && payback < 84) {
      return { label: t('admin.feasibility.ai.moderate'), variant: 'secondary' as const, className: 'bg-amber-500 text-white' };
    }
    return { label: t('admin.feasibility.ai.risky'), variant: 'destructive' as const, className: '' };
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    setCollaborativeScore(null);
    setCollaborativeProviders([]);
    setCollaborativeStats(null);

    // Prepare OTR reference data for the analysis
    const otrReferenceData = {
      tireModels: OTR_TIRE_MODELS.map(t => ({
        model: t.model,
        weight: t.weight,
        composition: t.composition,
        recoverable: t.recoverable
      })),
      marketPrices: OTR_MARKET_PRICES,
      lastUpdated: 'January 2026'
    };

    // Get fiscal incentives for the selected country
    const fiscalIncentives = study.country ? (() => {
      const countryMap: Record<string, string> = {
        'Brasil': 'brazil', 'Brazil': 'brazil',
        'Australia': 'australia', 'Austrália': 'australia',
        'Chile': 'chile', 'USA': 'usa', 'United States': 'usa',
        'Italy': 'italy', 'Itália': 'italy',
        'Germany': 'germany', 'Alemanha': 'germany',
        'Mexico': 'mexico', 'México': 'mexico',
        'South Africa': 'southAfrica'
      };
      const key = countryMap[study.country];
      if (key && FISCAL_INCENTIVES_DATA[key]) {
        const data = FISCAL_INCENTIVES_DATA[key];
        return {
          country: study.country,
          corporateTax: data.corporateTax,
          regions: data.regions.map(r => ({
            id: r.id,
            name: r.nameKey,
            effectiveTax: r.effectiveTax,
            incentives: r.incentives,
            regulations: r.regulations
          }))
        };
      }
      return null;
    })() : null;

    try {
      // Use collaborative AI for comprehensive multi-key analysis
      if (selectedModel === 'collaborative') {
        // First try the new collaborative mode in analyze-feasibility
        const response = await supabase.functions.invoke('analyze-feasibility', {
          body: {
            study: {
              ...study,
              location: study.location || '',
              country: study.country || ''
            },
            language: i18n.language,
            model: 'collaborative',
            otrReference: otrReferenceData,
            fiscalIncentives: fiscalIncentives
          }
        });

        const { data, error: fnError } = response;

        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);

        setAnalysis(data.analysis);
        onAnalysisComplete?.(data.analysis);

        // Set collaborative stats if available
        if (data.collaborative_stats) {
          setCollaborativeStats(data.collaborative_stats);
          const aspects = data.collaborative_stats.aspects_completed;
          const completedAspects: string[] = [];
          if (aspects.financial) completedAspects.push('Financeiro');
          if (aspects.regulatory) completedAspects.push('Regulatório');
          if (aspects.market) completedAspects.push('Mercado');
          if (aspects.esg) completedAspects.push('ESG');
          if (aspects.synthesis) completedAspects.push('Síntese');
          setCollaborativeProviders(completedAspects);
          setCollaborativeScore(Math.round((data.collaborative_stats.successful_analyses / 5) * 100));
        }

        toast({
          title: t('admin.feasibility.ai.collaborativeComplete', 'Análise Colaborativa Completa'),
          description: `${data.collaborative_stats?.keys_used || 0} chaves utilizadas • ${data.collaborative_stats?.successful_analyses || 0} análises`,
        });
        return;
      }

      // Standard analysis with OTR and fiscal data
      const response = await supabase.functions.invoke('analyze-feasibility', {
        body: {
          study: {
            ...study,
            location: study.location || '',
            country: study.country || ''
          },
          language: i18n.language,
          model: selectedModel,
          otrReference: otrReferenceData,
          fiscalIncentives: fiscalIncentives
        }
      });

      const { data, error: fnError } = response;

      // Check if we got a rate limit error (429) - data will contain the error details
      if (fnError) {
        // For non-2xx responses, check if data contains error info
        if (data?.error) {
          const isRateLimited = data.error.includes('Rate limit') || data.recommended_model;
          if (isRateLimited) {
            const recommendedModel = data.recommended_model || (selectedModel === 'flash' ? 'pro' : 'flash');
            setError(t('admin.feasibility.ai.rateLimited', 'Rate limit reached. Please wait a moment and try again, or switch to another model.'));
            toast({
              title: t('admin.feasibility.ai.analysisFailed'),
              description: t('admin.feasibility.ai.rateLimitedSuggestion', {
                defaultValue: `Rate limit reached. Try switching to ${recommendedModel === 'pro' ? 'Complete (Pro)' : 'Quick (Flash)'} model.`
              }),
              variant: 'destructive'
            });
            setSelectedModel(recommendedModel as AnalysisModel);
            return;
          }
          throw new Error(data.error);
        }
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      onAnalysisComplete?.(data.analysis);

      if (data?.did_fallback) {
        toast({
          title: t('admin.feasibility.ai.fallbackTitle', 'Switched to Flash due to rate limits'),
          description: t('admin.feasibility.ai.fallbackDesc', 'The Pro model was temporarily rate-limited, so we generated the analysis using Flash.'),
        });
      } else {
        toast({
          title: t('admin.feasibility.ai.analysisComplete'),
          description: t('admin.feasibility.ai.analysisCompleteDesc'),
        });
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      
      const errorMessage = err instanceof Error ? err.message : (typeof err?.message === 'string' ? err.message : 'Unknown error');

      setError(errorMessage);
      toast({
        title: t('admin.feasibility.ai.analysisFailed'),
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const viability = getViabilityBadge();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {t('admin.feasibility.ai.title')}
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
            <span className="text-xs text-muted-foreground block">{t('admin.feasibility.roi')}</span>
            <span className={`font-bold text-sm ${study.roi_percentage > 20 ? 'text-green-600' : study.roi_percentage > 10 ? 'text-primary' : 'text-amber-600'}`}>
              {study.roi_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-center p-2 bg-background/50 rounded-lg">
            <span className="text-xs text-muted-foreground block">{t('admin.feasibility.irr')}</span>
            <span className={`font-bold text-sm ${study.irr_percentage > 15 ? 'text-green-600' : 'text-amber-600'}`}>
              {study.irr_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="text-center p-2 bg-background/50 rounded-lg">
            <span className="text-xs text-muted-foreground block">{t('admin.feasibility.payback')}</span>
            <span className={`font-bold text-sm ${study.payback_months < 48 ? 'text-green-600' : 'text-amber-600'}`}>
              {study.payback_months}m
            </span>
          </div>
          <div className="text-center p-2 bg-background/50 rounded-lg">
            <span className="text-xs text-muted-foreground block">{t('admin.feasibility.npv10Years')}</span>
            <span className={`font-bold text-sm ${study.npv_10_years > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {study.npv_10_years > 0 ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
              {' '}${(Math.abs(study.npv_10_years) / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>

        {/* Model Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {t('admin.feasibility.ai.selectModel', 'Select Analysis Type')}
          </label>
          <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AnalysisModel)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  <div>
                    <span className="font-medium">{t('admin.feasibility.ai.localAnalysis', 'Local Analysis')}</span>
                    <span className="text-xs text-muted-foreground ml-2">~1s</span>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="flash">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <div>
                    <span className="font-medium">{t('admin.feasibility.ai.flashAnalysis', 'Gemini Quick')}</span>
                    <span className="text-xs text-muted-foreground ml-2">~10s</span>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="pro">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-medium">{t('admin.feasibility.ai.proAnalysis', 'Gemini Pro')}</span>
                    <span className="text-xs text-muted-foreground ml-2">~30s</span>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="collaborative">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <div>
                    <span className="font-medium">{t('admin.feasibility.ai.collaborativeAnalysis', 'IA Colaborativa')}</span>
                    <span className="text-xs text-muted-foreground ml-2">~45s</span>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {selectedModel === 'local' 
              ? t('admin.feasibility.ai.localDesc', 'Fast template-based analysis. No external API calls.')
              : selectedModel === 'flash' 
                ? t('admin.feasibility.ai.flashDesc', 'Gemini AI quick analysis with key insights.')
                : selectedModel === 'pro'
                  ? t('admin.feasibility.ai.proDesc', 'Comprehensive Gemini AI analysis with detailed regulatory and strategic insights.')
                  : t('admin.feasibility.ai.collaborativeDesc', 'Análise multi-perspectiva usando até 7 chaves Gemini em paralelo (Financeiro + Regulatório + Mercado + ESG).')}
          </p>

          {/* Collaborative Stats Badge */}
          {collaborativeStats && (
            <div className="flex flex-col gap-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">
                  {collaborativeStats.keys_used} chaves • {collaborativeStats.successful_analyses} análises
                </span>
                {collaborativeScore !== null && (
                  <Badge variant="secondary" className="ml-auto text-xs bg-purple-500/20 text-purple-700">
                    Score: {collaborativeScore}%
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {collaborativeProviders.map((p, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Legacy Collaborative Score Badge (for generate-collaborative-document) */}
          {collaborativeScore !== null && !collaborativeStats && (
            <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Score: {collaborativeScore}/100</span>
              <div className="flex gap-1 ml-auto">
                {collaborativeProviders.map((p) => (
                  <Badge key={p} variant="secondary" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis Button */}
        <Button 
          onClick={runAnalysis} 
          disabled={isAnalyzing}
          className="w-full gap-2"
          variant={analysis ? "outline" : "default"}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('admin.feasibility.ai.analyzing')}
            </>
          ) : analysis ? (
            <>
              <RefreshCw className="h-4 w-4" />
              {t('admin.feasibility.ai.reanalyze')}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t('admin.feasibility.ai.runAnalysis')}
            </>
          )}
        </Button>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Result */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">{t('admin.feasibility.ai.analysisReady')}</span>
              </div>
              <div className="rounded-xl border border-border/50 bg-gradient-to-br from-background via-muted/30 to-background shadow-sm overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto p-5 space-y-4">
                  {analysis.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;

                    // Main section headers (## or **)
                    if (trimmed.startsWith('## ') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 6)) {
                      const text = trimmed.replace(/^## /, '').replace(/\*\*/g, '');
                      return (
                        <h3 key={i} className="flex items-center gap-2 text-base font-bold text-primary border-b border-primary/20 pb-2 mt-6 first:mt-0">
                          <span className="w-1.5 h-5 bg-primary rounded-full" />
                          {text}
                        </h3>
                      );
                    }

                    // Sub-headers (### or bold inline)
                    if (trimmed.startsWith('### ')) {
                      return (
                        <h4 key={i} className="text-sm font-semibold text-foreground/90 mt-4 mb-1">
                          {trimmed.replace(/^### /, '')}
                        </h4>
                      );
                    }

                    // Bullet points
                    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
                      const content = trimmed.replace(/^[-•*] /, '');
                      // Check for bold prefix in bullet
                      const boldMatch = content.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
                      if (boldMatch) {
                        return (
                          <div key={i} className="flex items-start gap-2 ml-3 text-sm text-muted-foreground">
                            <span className="text-primary mt-1.5">•</span>
                            <p>
                              <span className="font-semibold text-foreground">{boldMatch[1]}</span>
                              {boldMatch[2] && <span className="text-muted-foreground">: {boldMatch[2]}</span>}
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div key={i} className="flex items-start gap-2 ml-3 text-sm text-muted-foreground">
                          <span className="text-primary mt-1.5">•</span>
                          <p>{content}</p>
                        </div>
                      );
                    }

                    // Numbered lists
                    if (/^\d+\.\s/.test(trimmed)) {
                      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
                      if (match) {
                        return (
                          <div key={i} className="flex items-start gap-3 ml-1 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                              {match[1]}
                            </span>
                            <p className="text-foreground/80 pt-0.5">{match[2]}</p>
                          </div>
                        );
                      }
                    }

                    // Inline bold text formatting
                    const formattedLine = trimmed.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    });

                    // Regular paragraph
                    return (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {formattedLine}
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
