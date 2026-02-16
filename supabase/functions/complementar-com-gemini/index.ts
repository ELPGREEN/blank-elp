/**
 * Edge Function: complementar-com-gemini
 * Uses Google Gemini to validate and complement Claude's analysis
 * Includes automatic retry, model fallback, and Groq as final fallback
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_PROMPT = `Valide e complemente a análise anterior.
Resuma os pontos principais em bullet points em português.
Sugira exatamente 3 gráficos úteis para um dashboard de BI (ex: linha de preços, barra de reclamações, radar de oportunidades).
Responda apenas com o resumo em bullets + as 3 sugestões de gráficos.`;

const ADDITIONAL_TEXT_PROMPT = `TAREFA: COMPLEMENTAR análise com TODOS os dados do texto adicional.

⚠️ REGRAS ABSOLUTAS:
1. NÃO RESUMA - liste TUDO na íntegra
2. Se há 50 empresas, liste as 50 COM SEUS SITES
3. NÃO use "etc", "entre outros", "principais"
4. CADA empresa DEVE ter seu site ao lado

FORMATO OBRIGATÓRIO:

## 📋 DADOS DO TEXTO ADICIONAL

### Informações Institucionais
[Copie missão, visão, valores, histórico COMPLETOS]

### Governança
[Órgãos, pessoas, cargos]

### Links Oficiais
[TODOS os links com descrições]

### Empresas Mantenedoras (TABELA COMPLETA)
| Empresa | Site |
|---------|------|
[LISTE CADA UMA - não omita nenhuma]

### Empresas Associadas (TABELA COMPLETA - TODAS COM SITES!)
| Empresa | Site |
|---------|------|
[LISTE TODAS - se são 47 empresas, a tabela deve ter 47 linhas]

⚠️ ATENÇÃO ESPECIAL: A tabela de Empresas Associadas DEVE conter TODAS as empresas listadas no texto com seus respectivos sites. Exemplo:
| ABB Automação | https://new.abb.com/br |
| Açokorte | https://www.acokorte.com.br/ |
| Alvarez & Marsal | https://www.alvarezandmarsal.com/ |
[Continue até a última empresa]

### Outros Dados
[Informações adicionais]

---

## 🔄 ANÁLISE INTEGRADA
[Insights combinando dados web + texto adicional]

## 📊 SUGESTÕES DE GRÁFICOS
1. [Gráfico 1]
2. [Gráfico 2]
3. [Gráfico 3]`;

const MAX_CHARS = 190000;

// Model priority list for fallback
const GEMINI_MODELS = {
  fast: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'],
  full: ['gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'],
};

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
            temperature: modoRapido ? 0.6 : 0.3,
            maxOutputTokens: modoRapido ? 2500 : 6000,
          },
        }),
        signal,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn(`Gemini ${model} error: ${response.status}`, errorData.error?.message || '');
      
      if (response.status === 429) {
        return { success: false, error: errorData.error?.message || 'Rate limit', shouldRetry: true };
      }
      
      return { success: false, error: errorData.error?.message || `HTTP ${response.status}`, shouldRetry: false };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      return { success: false, error: 'Empty response from Gemini', shouldRetry: true };
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
  content: string,
  modoRapido: boolean,
  signal: AbortSignal
): Promise<{ success: boolean; text?: string; error?: string }> {
  // Updated models (Jan 2025) - llama-3.1-70b-versatile, llama-3.3-70b-specdec, llama3-groq-70b-8192-tool-use-preview decommissioned
  const models = ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'];
  
  for (const model of models) {
    try {
      console.log(`Trying Groq model: ${model}`);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content }],
          temperature: modoRapido ? 0.6 : 0.3,
          max_tokens: modoRapido ? 2500 : 6000,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Groq ${model} error: ${response.status}`, errorData.error?.message || '');
        
        // Try next model on rate limit
        if (response.status === 429) continue;
        
        return { success: false, error: errorData.error?.message || `HTTP ${response.status}` };
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      
      if (!text) continue;
      
      return { success: true, text };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Timeout' };
      }
      console.warn(`Groq ${model} exception:`, error);
      continue;
    }
  }
  
  return { success: false, error: 'All Groq models failed' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { insights_claude, prompt_gemini, modo_rapido = false, additionalText } = await req.json();

    if (!insights_claude || typeof insights_claude !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'insights_claude é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const groqKey = Deno.env.get('GROQ_API_KEY');
    
    if (!geminiKey && !groqKey) {
      console.error('No AI API keys configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Configure GEMINI_API_KEY ou GROQ_API_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Truncate if needed
    const truncatedInsights = insights_claude.length > MAX_CHARS 
      ? insights_claude.substring(0, MAX_CHARS) + '\n\n[... conteúdo truncado ...]'
      : insights_claude;

    // Determine final prompt based on whether additional text was provided
    let finalPrompt: string;
    
    if (additionalText && additionalText.trim()) {
      // Use specialized prompt for additional text extraction
      console.log(`Processing additional text (${additionalText.length} chars)`);
      finalPrompt = ADDITIONAL_TEXT_PROMPT + `

=== TEXTO ADICIONAL FORNECIDO PELO USUÁRIO (ANALISE TUDO!) ===
${additionalText.trim()}
=== FIM DO TEXTO ADICIONAL ===

Agora analise DETALHADAMENTE o texto acima, extraia TODOS os dados e integre com a análise anterior:`;
    } else if (prompt_gemini) {
      // Use custom prompt if provided
      finalPrompt = prompt_gemini;
    } else {
      // Use default prompt
      finalPrompt = DEFAULT_PROMPT;
    }
    
    const fullContent = `${finalPrompt}\n\nAnálise Anterior:\n${truncatedInsights}`;

    console.log(`Total content length: ${fullContent.length} chars`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

    let lastError = '';
    let usedProvider = '';

    // Try Gemini first if available
    if (geminiKey) {
      const modelList = modo_rapido ? GEMINI_MODELS.fast : GEMINI_MODELS.full;
      console.log(`Attempting Gemini. Models: ${modelList.join(', ')}`);

      for (const model of modelList) {
        console.log(`Trying Gemini model: ${model}`);
        
        const result = await callGemini(geminiKey, model, fullContent, modo_rapido, controller.signal);
        
        if (result.success && result.text) {
          clearTimeout(timeoutId);
          
          const elapsed = Date.now() - startTime;
          console.log(`Completed with Gemini ${model} in ${elapsed}ms`);

          return new Response(
            JSON.stringify({
              success: true,
              complemento_gemini: result.text,
              model: model,
              provider: 'gemini',
              elapsed_ms: elapsed,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        lastError = result.error || 'Unknown error';
        
        if (!result.shouldRetry) break;
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`All Gemini models failed. Last error: ${lastError}`);
    }

    // Fallback to Groq with Llama 3.3 70B
    if (groqKey) {
      console.log('Falling back to Groq (Llama 3.3 70B)...');
      
      const groqResult = await callGroq(groqKey, fullContent, modo_rapido, controller.signal);
      
      if (groqResult.success && groqResult.text) {
        clearTimeout(timeoutId);
        
        const elapsed = Date.now() - startTime;
        console.log(`Completed with Groq in ${elapsed}ms`);

        return new Response(
          JSON.stringify({
            success: true,
            complemento_gemini: groqResult.text,
            model: 'llama-3.3-70b-versatile',
            provider: 'groq',
            elapsed_ms: elapsed,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      lastError = groqResult.error || lastError;
    }

    clearTimeout(timeoutId);

    console.error(`All providers failed. Last error: ${lastError}`);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Todos os provedores falharam: ${lastError}. Tente novamente em alguns minutos.` 
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in complementar-com-gemini:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ success: false, error: 'Timeout: O complemento demorou muito.' }),
        { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to complement analysis';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
