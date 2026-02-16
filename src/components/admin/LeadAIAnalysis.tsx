import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  BarChart3,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAnalyzeSentiment, useClassifyLead } from '@/hooks/useLeadAI';

interface LeadAIAnalysisProps {
  leadId: string;
  leadType: 'contact' | 'marketplace';
  message: string | null;
  currentPriority: string;
  currentLevel: string;
  onApplySuggestions?: (priority: string, level: string) => void;
}

export function LeadAIAnalysis({ 
  leadId, 
  leadType, 
  message, 
  currentPriority, 
  currentLevel,
  onApplySuggestions 
}: LeadAIAnalysisProps) {
  const [analysisResult, setAnalysisResult] = useState<{
    urgencyScore: number;
    sentimentLabel: string;
    classifications: Array<{ label: string; score: number }>;
    suggestedPriority: string;
    suggestedLevel: string;
    provider: string;
  } | null>(null);

  const analyzeSentiment = useAnalyzeSentiment();
  const classifyLead = useClassifyLead();

  const isAnalyzing = analyzeSentiment.isPending || classifyLead.isPending;

  const runAnalysis = async () => {
    if (!message) return;

    try {
      const [sentimentResult, classificationResult] = await Promise.all([
        analyzeSentiment.mutateAsync(message),
        classifyLead.mutateAsync({ text: message })
      ]);

      const topSentiment = sentimentResult.sentiment.reduce(
        (prev, curr) => (curr.score > prev.score ? curr : prev),
        { label: 'neutro', score: 0 }
      );

      setAnalysisResult({
        urgencyScore: sentimentResult.urgencyScore,
        sentimentLabel: topSentiment.label,
        classifications: classificationResult.classifications,
        suggestedPriority: classificationResult.suggestedPriority,
        suggestedLevel: classificationResult.suggestedLevel,
        provider: sentimentResult.provider
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 75) return 'text-red-600 bg-red-500/10';
    if (score >= 50) return 'text-amber-600 bg-amber-500/10';
    return 'text-green-600 bg-green-500/10';
  };

  const getUrgencyLabel = (score: number) => {
    if (score >= 75) return 'Alta Urgência';
    if (score >= 50) return 'Média Urgência';
    return 'Baixa Urgência';
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500/10 text-red-600 border-red-500/30',
      high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
      medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
      low: 'bg-slate-500/10 text-slate-600 border-slate-500/30'
    };
    return colors[priority] || colors.medium;
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      initial: 'bg-blue-500/10 text-blue-600',
      qualified: 'bg-purple-500/10 text-purple-600',
      project: 'bg-emerald-500/10 text-emerald-600'
    };
    return colors[level] || colors.initial;
  };

  if (!message) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground">
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma mensagem para analisar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Análise com IA</CardTitle>
              <CardDescription className="text-xs">HuggingFace NLP (gratuito)</CardDescription>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={runAnalysis} 
            disabled={isAnalyzing}
            variant={analysisResult ? "outline" : "default"}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : analysisResult ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reanalisar
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analisar Lead
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CardContent className="space-y-4">
              {/* Urgency Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Score de Urgência
                  </span>
                  <Badge className={getUrgencyColor(analysisResult.urgencyScore)}>
                    {getUrgencyLabel(analysisResult.urgencyScore)}
                  </Badge>
                </div>
                <Progress value={analysisResult.urgencyScore} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Baseado em análise de sentimento: {analysisResult.sentimentLabel}
                </p>
              </div>

              <Separator />

              {/* Classifications */}
              <div className="space-y-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Classificação do Lead
                </span>
                <div className="space-y-1.5">
                  {analysisResult.classifications.slice(0, 4).map((cls, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="capitalize">{cls.label}</span>
                          <span className="text-muted-foreground">
                            {(cls.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={cls.score * 100} className="h-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Suggestions */}
              <div className="space-y-3">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Sugestões da IA
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Prioridade Sugerida</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityBadge(analysisResult.suggestedPriority)}>
                        {analysisResult.suggestedPriority}
                      </Badge>
                      {analysisResult.suggestedPriority !== currentPriority && (
                        <TrendingUp className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Nível Sugerido</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getLevelBadge(analysisResult.suggestedLevel)}>
                        {analysisResult.suggestedLevel}
                      </Badge>
                      {analysisResult.suggestedLevel !== currentLevel && (
                        <TrendingUp className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Apply Suggestions Button */}
                {(analysisResult.suggestedPriority !== currentPriority || 
                  analysisResult.suggestedLevel !== currentLevel) && onApplySuggestions && (
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => onApplySuggestions(
                      analysisResult.suggestedPriority, 
                      analysisResult.suggestedLevel
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aplicar Sugestões
                  </Button>
                )}
              </div>

              {/* Provider Info */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  🤖 Powered by {analysisResult.provider}
                </p>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
