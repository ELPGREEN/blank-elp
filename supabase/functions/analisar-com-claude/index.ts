/**
 * Edge Function: analisar-com-claude
 * Uses Anthropic Claude for deep business intelligence analysis
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

const MAX_CHARS = 140000; // Claude context limit safety margin

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { texto_completo, prompt_claude, modo_rapido = false } = await req.json();

    if (!texto_completo || typeof texto_completo !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'texto_completo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configure a ANTHROPIC_API_KEY nas configurações do Supabase Secrets' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Truncate text if too long
    const truncatedText = texto_completo.length > MAX_CHARS 
      ? texto_completo.substring(0, MAX_CHARS) + '\n\n[... conteúdo truncado por limite de tokens ...]'
      : texto_completo;

    const finalPrompt = prompt_claude || DEFAULT_PROMPT;
    const fullContent = `${finalPrompt}\n\nConteúdo dos sites:\n${truncatedText}`;

    console.log(`Analyzing with Claude. Text length: ${truncatedText.length} chars, modo_rapido: ${modo_rapido}`);

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modo_rapido ? 'claude-3-5-haiku-20241022' : 'claude-sonnet-4-20250514',
        max_tokens: modo_rapido ? 2000 : 4000,
        temperature: modo_rapido ? 0.5 : 0.3,
        messages: [
          {
            role: 'user',
            content: fullContent,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', response.status, errorData);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit atingido. Tente novamente em alguns segundos.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorData.error?.message || `Claude API error: ${response.status}` 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const analysisText = data.content?.[0]?.text || '';

    const elapsed = Date.now() - startTime;
    console.log(`Claude analysis completed in ${elapsed}ms. Response length: ${analysisText.length} chars`);

    return new Response(
      JSON.stringify({
        success: true,
        insights_claude: analysisText,
        model: modo_rapido ? 'claude-3-haiku' : 'claude-3.5-sonnet',
        tokens_used: data.usage,
        elapsed_ms: elapsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analisar-com-claude:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ success: false, error: 'Timeout: A análise demorou muito. Tente com menos URLs.' }),
        { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze with Claude';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
