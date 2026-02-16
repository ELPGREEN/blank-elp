/**
 * Edge Function: analisar-com-groq
 * Uses Groq API (FREE tier) for fast LLM analysis
 * Models: llama-3.3-70b-versatile, llama-3.1-70b-versatile, mixtral-8x7b-32768
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRUCTURED_PROMPT = `Você é um analista sênior de inteligência empresarial.
Analise os dados coletados de sites de concorrentes.
Extraia e responda SOMENTE em JSON válido:
{
  "dados_empresa": {
    "razao_social": "nome completo da empresa ou null",
    "cnpj_registro": "número de registro/CNPJ/Tax ID ou null",
    "endereco": "endereço completo ou null",
    "telefones": ["lista de telefones encontrados"],
    "emails": ["lista de emails encontrados"],
    "website": "URL do site oficial ou null"
  },
  "diretoria": [
    {"nome": "nome do diretor", "cargo": "cargo/função", "linkedin": "URL linkedin ou null"}
  ],
  "perfil_empresa": "descrição do que a empresa faz, setor, tamanho estimado",
  "resumo_executivo": "string com 2-3 parágrafos resumindo os principais achados",
  "precos_produtos": [{"produto": "string", "preco": "string", "url": "string"}],
  "estrategias_marketing": ["string"],
  "reclamacoes_clientes": ["string"],
  "oportunidades_diferencial": ["string"],
  "pontos_fortes": ["string"],
  "pontos_fracos": ["string"]
}

IMPORTANTE: Busque ativamente por:
- Número de registro comercial (CNPJ, Tax ID, Company Number)
- Telefones de contato
- Nomes de diretores, CEOs, fundadores e executivos
- Endereço da sede

Não adicione texto extra fora do JSON.

Conteúdo:
`;

// Groq context limit - 100K chars initial, with aggressive fallback
const MAX_CHARS = 100000;
const AGGRESSIVE_MAX_CHARS = 25000; // Fallback for 413/TPM errors

// Model priority - updated to current available models (Jan 2025)
// See: https://console.groq.com/docs/deprecations
// Decommissioned: llama-3.1-70b-versatile, llama-3.3-70b-specdec, llama3-groq-70b-8192-tool-use-preview
const GROQ_MODELS = {
  fast: ['llama-3.1-8b-instant', 'gemma2-9b-it'],
  full: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
};

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
        messages: [
          {
            role: 'system',
            content: 'Você é um analista de BI especializado. Responda sempre em português brasileiro. Forneça análises estruturadas e acionáveis.',
          },
          {
            role: 'user',
            content,
          },
        ],
        temperature: 0.3,
        max_tokens: modoRapido ? 2000 : 4000,
        response_format: { type: 'json_object' },
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errMsg = errorData.error?.message || `HTTP ${response.status}`;
      console.warn(`Groq ${model} error: ${response.status}`, errMsg);
      
      // Rate limit - retry with next model
      if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded', shouldRetry: true };
      }
      
      // Request too large - signal to truncate more aggressively
      if (response.status === 413 || errMsg.includes('Request too large') || errMsg.includes('TPM')) {
        return { success: false, error: 'REQUEST_TOO_LARGE', shouldRetry: true };
      }
      
      return { success: false, error: errMsg, shouldRetry: false };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    if (!text) {
      return { success: false, error: 'Empty response from Groq', shouldRetry: true };
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
    
    if (!groqKey) {
      console.error('GROQ_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configure GROQ_API_KEY no Supabase Secrets. Obtenha grátis em console.groq.com' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const finalPrompt = prompt_analise || STRUCTURED_PROMPT;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const modelList = modo_rapido ? GROQ_MODELS.fast : GROQ_MODELS.full;
    let lastError = '';
    let currentMaxChars = MAX_CHARS;

    console.log(`[Groq FREE] Attempting analysis. Input size: ${texto_completo.length} chars. Models: ${modelList.join(', ')}`);

    // Retry loop with aggressive truncation fallback
    for (let attempt = 0; attempt < 2; attempt++) {
      const truncatedText = texto_completo.length > currentMaxChars 
        ? texto_completo.substring(0, currentMaxChars) + '\n\n[... conteúdo truncado ...]'
        : texto_completo;
      
      const fullContent = `${finalPrompt}\n${truncatedText}`;
      console.log(`[Groq] Attempt ${attempt + 1}, content size: ${fullContent.length} chars (~${Math.ceil(fullContent.length / 4)} tokens)`);

      for (const model of modelList) {
        console.log(`[Groq] Trying model: ${model}`);
        
        const result = await callGroq(groqKey, model, fullContent, modo_rapido, controller.signal);
      
      if (result.success && result.text) {
        clearTimeout(timeoutId);
        
        const elapsed = Date.now() - startTime;
        console.log(`[Groq] Completed with ${model} in ${elapsed}ms`);

        // Try to parse JSON
        let parsedInsights = null;
        try {
          parsedInsights = JSON.parse(result.text);
        } catch {
          console.warn('[Groq] Response is not valid JSON, returning as text');
        }

        return new Response(
          JSON.stringify({
            success: true,
            insights: result.text,
            insights_parsed: parsedInsights,
            model: model,
            provider: 'groq',
            elapsed_ms: elapsed,
            cost: 'FREE',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
        lastError = result.error || 'Unknown error';
        
        // If request too large, break inner loop to retry with smaller text
        if (result.error === 'REQUEST_TOO_LARGE') {
          console.log(`[Groq] Request too large, will retry with aggressive truncation`);
          break;
        }
        
        if (!result.shouldRetry) break;
        
        // Small delay before trying next model
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // If last error was size-related, try again with aggressive truncation
      if (lastError === 'REQUEST_TOO_LARGE' && currentMaxChars > AGGRESSIVE_MAX_CHARS) {
        currentMaxChars = AGGRESSIVE_MAX_CHARS;
        console.log(`[Groq] Retrying with aggressive truncation: ${currentMaxChars} chars`);
        continue;
      }
      
      break; // No size error, don't retry outer loop
    }

    clearTimeout(timeoutId);

    console.error(`[Groq] All attempts failed. Last error: ${lastError}`);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Análise Groq falhou: ${lastError}. Verifique sua chave em console.groq.com` 
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Groq] Error in analisar-com-groq:', error);
    
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
