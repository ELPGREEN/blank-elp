/**
 * Edge Function: analisar-com-gemini
 * Uses Gemini (free) for deep business intelligence analysis
 * Falls back to Groq (free) if Gemini fails
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_PROMPT = `Você é um analista sênior de inteligência empresarial.
Analise os dados coletados dos sites de concorrentes abaixo.
Extraia e estruture em JSON válido:
{
  "precos_produtos": [array de objetos {produto: string, preco: string, url: string}],
  "estrategias_marketing": [array de strings],
  "reclamacoes_clientes": [array de strings],
  "oportunidades_diferencial": [array de strings]
}
Depois do JSON, gere um resumo executivo em português (máx 400 palavras).`;

const MAX_CHARS = 190000; // Gemini has larger context

// Gemini models in priority order
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

// Groq models for fallback (all free tier)
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'];

// Pool of 7 Gemini API keys for automatic rotation
const GEMINI_API_KEY_POOL = [
  Deno.env.get('GEMINI_API_KEY'),
  Deno.env.get('GEMINI_API_KEY_2'),
  Deno.env.get('GEMINI_API_KEY_3'),
  Deno.env.get('GEMINI_API_KEY_4'),
  Deno.env.get('GEMINI_API_KEY_5'),
  Deno.env.get('GEMINI_API_KEY_6'),
  Deno.env.get('GEMINI_API_KEY_7'),
].filter(Boolean) as string[];

let currentKeyIndex = 0;
const failedKeyTimestamps = new Map<number, number>();
const KEY_COOLDOWN_MS = 60000; // 1 minute cooldown

function getNextAvailableKey(): { key: string; index: number } | null {
  if (GEMINI_API_KEY_POOL.length === 0) return null;
  
  const now = Date.now();
  // Clean expired cooldowns
  for (const [idx, ts] of failedKeyTimestamps) {
    if (now - ts > KEY_COOLDOWN_MS) failedKeyTimestamps.delete(idx);
  }
  
  // Find available key
  for (let i = 0; i < GEMINI_API_KEY_POOL.length; i++) {
    const idx = (currentKeyIndex + i) % GEMINI_API_KEY_POOL.length;
    if (!failedKeyTimestamps.has(idx)) {
      currentKeyIndex = idx;
      return { key: GEMINI_API_KEY_POOL[idx], index: idx };
    }
  }
  
  // All in cooldown, use oldest
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEY_POOL.length;
  return { key: GEMINI_API_KEY_POOL[currentKeyIndex], index: currentKeyIndex };
}

function markKeyAsFailed(index: number): void {
  failedKeyTimestamps.set(index, Date.now());
  console.log(`⛔ Gemini key ${index + 1}/${GEMINI_API_KEY_POOL.length} marked as failed (60s cooldown)`);
}

console.log(`analisar-com-gemini v2 - Gemini Keys: ${GEMINI_API_KEY_POOL.length}/7 loaded`);

async function callGemini(
  apiKey: string,
  model: string,
  content: string,
  modoRapido: boolean,
  signal: AbortSignal
): Promise<{ success: boolean; text?: string; error?: string; shouldRetry?: boolean }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: content }] }],
          generationConfig: {
            temperature: modoRapido ? 0.5 : 0.3,
            maxOutputTokens: modoRapido ? 2000 : 4000,
          },
        }),
        signal,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`Gemini ${model} error: ${response.status}`, errorData.error?.message || '');
      
      if (response.status === 429) {
        return { success: false, error: 'Rate limit', shouldRetry: true };
      }
      
      return { success: false, error: errorData.error?.message || `HTTP ${response.status}`, shouldRetry: false };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      return { success: false, error: 'Empty response', shouldRetry: true };
    }
    
    return { success: true, text };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Timeout', shouldRetry: false };
    }
    return { success: false, error: String(error), shouldRetry: true };
  }
}

async function callGroq(
  apiKey: string,
  model: string,
  content: string,
  modoRapido: boolean,
  signal: AbortSignal
): Promise<{ success: boolean; text?: string; error?: string; shouldRetry?: boolean }> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
        temperature: modoRapido ? 0.5 : 0.3,
        max_tokens: modoRapido ? 2000 : 4000,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`Groq ${model} error: ${response.status}`, errorData.error?.message || '');
      
      if (response.status === 429) {
        return { success: false, error: 'Rate limit', shouldRetry: true };
      }
      
      return { success: false, error: errorData.error?.message || `HTTP ${response.status}`, shouldRetry: false };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    if (!text) {
      return { success: false, error: 'Empty response', shouldRetry: true };
    }
    
    return { success: true, text };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'Timeout', shouldRetry: false };
    }
    return { success: false, error: String(error), shouldRetry: true };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { texto_completo, prompt_analise, modo_rapido = false } = await req.json();

    if (!texto_completo || typeof texto_completo !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'texto_completo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const groqKey = Deno.env.get('GROQ_API_KEY');

    if (GEMINI_API_KEY_POOL.length === 0 && !groqKey) {
      console.error('No AI API keys configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Configure pelo menos uma GEMINI_API_KEY ou GROQ_API_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Truncate if too long
    const truncatedText = texto_completo.length > MAX_CHARS 
      ? texto_completo.substring(0, MAX_CHARS) + '\n\n[... conteúdo truncado ...]'
      : texto_completo;

    const finalPrompt = prompt_analise || DEFAULT_PROMPT;
    const fullContent = `${finalPrompt}\n\nConteúdo dos sites:\n${truncatedText}`;

    console.log(`Analyzing with ${GEMINI_API_KEY_POOL.length} Gemini keys + Groq fallback. Text: ${truncatedText.length} chars, modo_rapido: ${modo_rapido}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let lastError = '';

    // Try Gemini with key rotation (7 keys pool)
    if (GEMINI_API_KEY_POOL.length > 0) {
      // Try each key with each model
      for (let keyAttempt = 0; keyAttempt < GEMINI_API_KEY_POOL.length; keyAttempt++) {
        const keyInfo = getNextAvailableKey();
        if (!keyInfo) break;
        
        for (const model of GEMINI_MODELS) {
          console.log(`🔑 Trying Gemini key ${keyInfo.index + 1}/${GEMINI_API_KEY_POOL.length} with ${model}`);
          
          const result = await callGemini(keyInfo.key, model, fullContent, modo_rapido, controller.signal);
          
          if (result.success && result.text) {
            clearTimeout(timeoutId);
            
            const elapsed = Date.now() - startTime;
            console.log(`✅ Completed with Gemini key ${keyInfo.index + 1} (${model}) in ${elapsed}ms`);

            return new Response(
              JSON.stringify({
                success: true,
                insights: result.text,
                model: model,
                provider: `gemini-key-${keyInfo.index + 1}`,
                keys_status: `${GEMINI_API_KEY_POOL.length - failedKeyTimestamps.size}/${GEMINI_API_KEY_POOL.length} available`,
                elapsed_ms: elapsed,
                cost: 'free',
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          lastError = result.error || 'Unknown error';
          
          // If rate limited, mark key and try next
          if (result.shouldRetry && (lastError.includes('Rate limit') || lastError.includes('429'))) {
            markKeyAsFailed(keyInfo.index);
            break; // Move to next key
          }
          
          if (!result.shouldRetry) break; // Move to next model
          
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      console.log(`⛔ All ${GEMINI_API_KEY_POOL.length} Gemini keys exhausted. Last error: ${lastError}`);
    }

    // Fallback to Groq (free tier)
    if (groqKey) {
      for (const model of GROQ_MODELS) {
        console.log(`🔄 Fallback: Trying Groq ${model}`);
        
        const result = await callGroq(groqKey, model, fullContent, modo_rapido, controller.signal);
        
        if (result.success && result.text) {
          clearTimeout(timeoutId);
          
          const elapsed = Date.now() - startTime;
          console.log(`✅ Completed with Groq ${model} in ${elapsed}ms`);

          return new Response(
            JSON.stringify({
              success: true,
              insights: result.text,
              model: model,
              provider: 'groq-fallback',
              elapsed_ms: elapsed,
              cost: 'free',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        lastError = result.error || 'Unknown error';
        if (!result.shouldRetry) break;
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    clearTimeout(timeoutId);

    console.error(`All providers failed. Last error: ${lastError}`);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Todos os provedores gratuitos falharam: ${lastError}` 
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analisar-com-gemini:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ success: false, error: 'Timeout: A análise demorou muito.' }),
        { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
