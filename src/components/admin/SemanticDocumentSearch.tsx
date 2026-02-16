import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  FileText, 
  Loader2,
  Sparkles,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSemanticSearch } from '@/hooks/useLeadAI';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  content: string;
  type: string;
  createdAt: string;
}

interface SemanticDocumentSearchProps {
  documents: Document[];
  onSelectDocument?: (doc: Document) => void;
}

export function SemanticDocumentSearch({ documents, onSelectDocument }: SemanticDocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{
    id: string;
    similarity: number;
    content: string;
  }>>([]);

  const semanticSearch = useSemanticSearch();

  const runSearch = async () => {
    if (!query.trim()) return;

    const searchResults = await semanticSearch.mutateAsync({
      query,
      documents: documents.map(d => ({ id: d.id, content: d.content }))
    });

    setResults(searchResults);
  };

  const copyClause = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Cláusula copiada!');
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'bg-green-500';
    if (similarity >= 0.6) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.8) return 'Muito Relevante';
    if (similarity >= 0.6) return 'Relevante';
    if (similarity >= 0.4) return 'Parcialmente Relevante';
    return 'Baixa Relevância';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Busca Semântica em Documentos</CardTitle>
            <CardDescription>
              Encontre cláusulas similares usando embeddings de IA
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ex: cláusula de confidencialidade, penalidades por descumprimento..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={runSearch}
            disabled={semanticSearch.isPending || !query.trim()}
          >
            {semanticSearch.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Document Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{documents.length} documentos indexados</span>
          {results.length > 0 && (
            <Badge variant="secondary">
              {results.filter(r => r.similarity >= 0.5).length} resultados relevantes
            </Badge>
          )}
        </div>

        {/* Loading */}
        <AnimatePresence>
          {semanticSearch.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center"
            >
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                Gerando embeddings e calculando similaridade...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && !semanticSearch.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {results.map((result, idx) => {
                    const doc = documents.find(d => d.id === result.id);
                    if (!doc) return null;

                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{doc.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {doc.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${getSimilarityColor(result.similarity)}`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {(result.similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        <Badge 
                          className={`mb-2 ${
                            result.similarity >= 0.8 ? 'bg-green-500/10 text-green-600' :
                            result.similarity >= 0.6 ? 'bg-amber-500/10 text-amber-600' :
                            'bg-slate-500/10 text-slate-600'
                          }`}
                        >
                          {getSimilarityLabel(result.similarity)}
                        </Badge>

                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {result.content.substring(0, 300)}...
                        </p>

                        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyClause(result.content)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar
                          </Button>
                          {onSelectDocument && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onSelectDocument(doc)}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Abrir
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {results.length === 0 && !semanticSearch.isPending && query && (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Digite uma busca e clique no botão</p>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground pt-2 border-t">
          🤖 Powered by HuggingFace sentence-transformers (gratuito)
        </p>
      </CardContent>
    </Card>
  );
}
