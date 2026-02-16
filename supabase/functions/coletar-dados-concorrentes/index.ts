/**
 * Edge Function: coletar-dados-concorrentes
 * Uses Jina Reader (FREE, no API key) to convert URLs to clean markdown
 * https://r.jina.ai/{url} - completely free scraping
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeResult {
  url: string;
  markdown: string;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'URLs array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Jina Reader FREE] Starting to scrape ${urls.length} URLs`);

    const results: ScrapeResult[] = [];
    
    // Process URLs sequentially to be respectful to the free service
    for (const url of urls) {
      try {
        // Format URL
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          formattedUrl = `https://${formattedUrl}`;
        }

        console.log(`[Jina] Scraping: ${formattedUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout per URL

        // Jina Reader - FREE, no API key needed!
        const jinaUrl = `https://r.jina.ai/${encodeURIComponent(formattedUrl)}`;
        
        const response = await fetch(jinaUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/markdown',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const markdown = await response.text();
          
          results.push({
            url: formattedUrl,
            markdown: markdown || '',
            success: true,
          });
          console.log(`[Jina] Successfully scraped: ${formattedUrl} (${markdown.length} chars)`);
        } else {
          results.push({
            url: formattedUrl,
            markdown: '',
            success: false,
            error: `HTTP ${response.status}`,
          });
          console.warn(`[Jina] Failed to scrape ${formattedUrl}: HTTP ${response.status}`);
        }

        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (urlError) {
        const errorMsg = urlError instanceof Error ? urlError.message : 'Unknown error';
        console.error(`[Jina] Error scraping ${url}: ${errorMsg}`);
        results.push({
          url,
          markdown: '',
          success: false,
          error: errorMsg,
        });
      }
    }

    // Build concatenated text with separators
    const textoCompleto = results
      .filter(r => r.success && r.markdown)
      .map(r => `\n\n---\n\nURL: ${r.url}\n\n${r.markdown}`)
      .join('');

    const successCount = results.filter(r => r.success).length;
    console.log(`[Jina] Completed: ${successCount}/${urls.length} URLs scraped successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        texto_completo: textoCompleto,
        stats: {
          total: urls.length,
          success: successCount,
          failed: urls.length - successCount,
        },
        provider: 'jina-reader',
        cost: 'FREE',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Jina] Error in coletar-dados-concorrentes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to collect data';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
