import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SentimentResult {
  label: string;
  score: number;
}

interface ClassificationResult {
  label: string;
  score: number;
}

interface EmbeddingResult {
  embeddings: number[];
  provider: string;
}

// Analyze sentiment of a lead message
export function useAnalyzeSentiment() {
  return useMutation({
    mutationFn: async (text: string): Promise<{ sentiment: SentimentResult[]; urgencyScore: number; provider: string }> => {
      const { data, error } = await supabase.functions.invoke('ai-hub', {
        body: {
          action: 'sentiment',
          text_for_sentiment: text
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Calculate urgency score based on sentiment
      // 1 star = very negative (urgent), 5 stars = very positive (low priority)
      const sentimentLabels = data.sentiment || [];
      let urgencyScore = 50; // Default medium

      const highestSentiment = sentimentLabels.reduce((prev: SentimentResult, curr: SentimentResult) => 
        (curr.score > prev.score) ? curr : prev, { label: '', score: 0 });

      if (highestSentiment.label.includes('1')) urgencyScore = 95; // Very urgent
      else if (highestSentiment.label.includes('2')) urgencyScore = 75;
      else if (highestSentiment.label.includes('3')) urgencyScore = 50;
      else if (highestSentiment.label.includes('4')) urgencyScore = 30;
      else if (highestSentiment.label.includes('5')) urgencyScore = 15; // Low priority

      return {
        sentiment: sentimentLabels,
        urgencyScore,
        provider: data.provider
      };
    },
    onError: (error: Error) => {
      toast.error(`Erro na análise de sentimento: ${error.message}`);
    }
  });
}

// Classify lead type/intent
export function useClassifyLead() {
  return useMutation({
    mutationFn: async ({ text, labels }: { text: string; labels?: string[] }): Promise<{ classifications: ClassificationResult[]; suggestedPriority: string; suggestedLevel: string; provider: string }> => {
      const defaultLabels = [
        'interesse urgente em comprar',
        'busca informações',
        'parceria estratégica',
        'investimento',
        'reclamação ou problema',
        'fornecedor de matéria-prima',
        'concorrente pesquisando'
      ];

      const { data, error } = await supabase.functions.invoke('ai-hub', {
        body: {
          action: 'classify',
          text_to_classify: text,
          labels: labels || defaultLabels
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const classifications = data.classifications || [];
      
      // Determine priority based on classification
      let suggestedPriority = 'medium';
      let suggestedLevel = 'initial';
      
      const topClass = classifications[0]?.label || '';
      const topScore = classifications[0]?.score || 0;

      if (topScore > 0.5) {
        if (topClass.includes('urgente') || topClass.includes('investimento')) {
          suggestedPriority = 'urgent';
          suggestedLevel = 'qualified';
        } else if (topClass.includes('parceria')) {
          suggestedPriority = 'high';
          suggestedLevel = 'qualified';
        } else if (topClass.includes('fornecedor')) {
          suggestedPriority = 'high';
          suggestedLevel = 'initial';
        } else if (topClass.includes('reclamação')) {
          suggestedPriority = 'urgent';
          suggestedLevel = 'initial';
        } else if (topClass.includes('concorrente')) {
          suggestedPriority = 'low';
          suggestedLevel = 'initial';
        }
      }

      return {
        classifications,
        suggestedPriority,
        suggestedLevel,
        provider: data.provider
      };
    },
    onError: (error: Error) => {
      toast.error(`Erro na classificação: ${error.message}`);
    }
  });
}

// Generate embeddings for semantic search
export function useGenerateEmbeddings() {
  return useMutation({
    mutationFn: async (text: string): Promise<EmbeddingResult> => {
      const { data, error } = await supabase.functions.invoke('ai-hub', {
        body: {
          action: 'embeddings',
          text_for_embeddings: text
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return {
        embeddings: data.embeddings,
        provider: data.provider
      };
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar embeddings: ${error.message}`);
    }
  });
}

// Batch analyze multiple leads
export function useBatchAnalyzeLeads() {
  const analyzeSentiment = useAnalyzeSentiment();
  const classifyLead = useClassifyLead();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leads: Array<{ id: string; type: 'contact' | 'marketplace'; message: string | null }>) => {
      const results: Array<{
        id: string;
        type: string;
        urgencyScore: number;
        suggestedPriority: string;
        suggestedLevel: string;
        topClassification: string;
      }> = [];

      for (const lead of leads) {
        if (!lead.message) continue;

        try {
          // Run sentiment and classification in parallel
          const [sentimentResult, classificationResult] = await Promise.all([
            analyzeSentiment.mutateAsync(lead.message),
            classifyLead.mutateAsync({ text: lead.message })
          ]);

          results.push({
            id: lead.id,
            type: lead.type,
            urgencyScore: sentimentResult.urgencyScore,
            suggestedPriority: classificationResult.suggestedPriority,
            suggestedLevel: classificationResult.suggestedLevel,
            topClassification: classificationResult.classifications[0]?.label || 'não classificado'
          });

          // Update the database with suggestions (optional auto-apply)
          const table = lead.type === 'marketplace' ? 'marketplace_registrations' : 'contacts';
          await supabase
            .from(table)
            .update({ 
              priority: classificationResult.suggestedPriority,
              // Don't auto-update lead_level to avoid overriding manual decisions
            })
            .eq('id', lead.id);

        } catch (error) {
          console.error(`Error analyzing lead ${lead.id}:`, error);
        }
      }

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-marketplace'] });

      return results;
    },
    onSuccess: (results) => {
      toast.success(`${results.length} leads analisados com IA!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro na análise em lote: ${error.message}`);
    }
  });
}

// Semantic search in documents
export function useSemanticSearch() {
  const generateEmbeddings = useGenerateEmbeddings();

  return useMutation({
    mutationFn: async ({ query, documents }: { query: string; documents: Array<{ id: string; content: string }> }): Promise<Array<{ id: string; similarity: number; content: string }>> => {
      // Generate query embedding
      const queryEmbedding = await generateEmbeddings.mutateAsync(query);
      
      // Generate embeddings for all documents (in a real scenario, these would be pre-computed)
      const docEmbeddings = await Promise.all(
        documents.map(async (doc) => ({
          id: doc.id,
          content: doc.content,
          embedding: (await generateEmbeddings.mutateAsync(doc.content.substring(0, 500))).embeddings
        }))
      );

      // Calculate cosine similarity
      const cosineSimilarity = (a: number[], b: number[]): number => {
        if (a.length !== b.length) return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
          dotProduct += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      };

      // Rank documents by similarity
      const results = docEmbeddings
        .map(doc => ({
          id: doc.id,
          content: doc.content,
          similarity: cosineSimilarity(queryEmbedding.embeddings, doc.embedding)
        }))
        .sort((a, b) => b.similarity - a.similarity);

      return results;
    },
    onError: (error: Error) => {
      toast.error(`Erro na busca semântica: ${error.message}`);
    }
  });
}
