import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Zap,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBatchAnalyzeLeads } from '@/hooks/useLeadAI';

interface Lead {
  id: string;
  type: 'contact' | 'marketplace';
  name: string;
  email: string;
  message: string | null;
  priority: string;
  lead_level: string;
}

interface BatchLeadAnalysisProps {
  leads: Lead[];
  onComplete?: () => void;
}

export function BatchLeadAnalysis({ leads, onComplete }: BatchLeadAnalysisProps) {
  const [results, setResults] = useState<Array<{
    id: string;
    type: string;
    urgencyScore: number;
    suggestedPriority: string;
    suggestedLevel: string;
    topClassification: string;
  }>>([]);

  const batchAnalyze = useBatchAnalyzeLeads();

  const leadsWithMessage = leads.filter(l => l.message && l.message.length > 10);

  const runBatchAnalysis = async () => {
    const analysisResults = await batchAnalyze.mutateAsync(
      leadsWithMessage.map(l => ({
        id: l.id,
        type: l.type,
        message: l.message
      }))
    );
    setResults(analysisResults);
    onComplete?.();
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 75) return 'bg-red-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-amber-600',
      low: 'text-slate-600'
    };
    return colors[priority] || 'text-slate-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Análise em Lote com IA</CardTitle>
              <CardDescription>
                Analise múltiplos leads simultaneamente usando HuggingFace
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Users className="w-3 h-3" />
            {leadsWithMessage.length} leads
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Preview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold">{leads.length}</p>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold">{leadsWithMessage.length}</p>
            <p className="text-xs text-muted-foreground">Com Mensagem</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold">{results.length}</p>
            <p className="text-xs text-muted-foreground">Analisados</p>
          </div>
        </div>

        {/* Run Button */}
        {results.length === 0 && (
          <Button 
            className="w-full" 
            size="lg"
            onClick={runBatchAnalysis}
            disabled={batchAnalyze.isPending || leadsWithMessage.length === 0}
          >
            {batchAnalyze.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando {leadsWithMessage.length} leads...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analisar Todos os Leads
              </>
            )}
          </Button>
        )}

        {/* Progress */}
        <AnimatePresence>
          {batchAnalyze.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processando...</span>
                <span className="font-medium">HuggingFace AI</span>
              </div>
              <Progress value={undefined} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Resultados da Análise
                </h4>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setResults([])}
                >
                  Limpar
                </Button>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {results.map((result, idx) => {
                    const lead = leads.find(l => l.id === result.id);
                    if (!lead) return null;

                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{lead.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {lead.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${getUrgencyColor(result.urgencyScore)}`} 
                              title={`Urgência: ${result.urgencyScore}%`}
                            />
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(result.suggestedPriority)}`}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            {result.suggestedPriority}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            {result.topClassification}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Summary */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {results.length} leads analisados e priorizados automaticamente
                  </span>
                </div>
                <p className="text-xs text-green-600/80 mt-1">
                  As prioridades foram atualizadas no banco de dados
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Messages Warning */}
        {leadsWithMessage.length === 0 && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-amber-700">
              Nenhum lead com mensagem para analisar
            </p>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground">
          🤖 Powered by HuggingFace BART-MNLI & Sentiment Analysis (gratuito)
        </p>
      </CardContent>
    </Card>
  );
}
