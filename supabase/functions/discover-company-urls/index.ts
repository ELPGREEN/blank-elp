/**
 * Edge Function: discover-company-urls
 * Automatically discovers relevant URLs about a company using multiple SerpAPI engines
 * Includes caching to reduce API calls (7-day TTL)
 * 
 * Engines used:
 * - Google Search, Google News, Google Maps, Google Scholar
 * - Bing Search, DuckDuckGo, Yahoo Search
 * - LinkedIn profiles (via Google)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveredUrl {
  url: string;
  title: string;
  snippet?: string;
  source: string;
  type?: string;
}

interface CacheEntry {
  id: string;
  query_hash: string;
  query_text: string;
  country: string | null;
  results: DiscoveredUrl[];
  created_at: string;
  expires_at: string;
}

// Create hash for cache key
function createQueryHash(query: string, country: string): string {
  const normalized = `${query.toLowerCase().trim()}|${country.toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `serpapi_multi_${Math.abs(hash).toString(36)}`;
}

// Check cache for existing results
async function getFromCache(supabase: any, queryHash: string): Promise<DiscoveredUrl[] | null> {
  try {
    const { data, error } = await supabase
      .from('serpapi_cache')
      .select('results, expires_at')
      .eq('query_hash', queryHash)
      .single();
    
    if (error || !data) return null;
    
    if (new Date(data.expires_at) < new Date()) {
      console.log('[Cache] Entry expired, will refresh');
      return null;
    }
    
    console.log('[Cache] Hit! Returning cached results');
    return data.results as DiscoveredUrl[];
  } catch {
    return null;
  }
}

// Save results to cache
async function saveToCache(
  supabase: any, 
  queryHash: string, 
  queryText: string, 
  country: string,
  results: DiscoveredUrl[]
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await supabase
      .from('serpapi_cache')
      .upsert({
        query_hash: queryHash,
        query_text: queryText,
        country,
        results,
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'query_hash' });
    
    console.log('[Cache] Saved results to cache');
  } catch (error) {
    console.warn('[Cache] Failed to save:', error);
  }
}

// Generic SerpAPI search function
async function searchSerpAPI(
  params: Record<string, string>,
  apiKey: string,
  source: string,
  parseResults: (data: any) => DiscoveredUrl[]
): Promise<DiscoveredUrl[]> {
  try {
    const searchParams = new URLSearchParams({ ...params, api_key: apiKey });
    const searchUrl = `https://serpapi.com/search?${searchParams.toString()}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    
    const response = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[${source}] Error ${response.status}`);
      return [];
    }

    const data = await response.json();
    return parseResults(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`[${source}] Timeout`);
    } else {
      console.error(`[${source}] Error:`, error);
    }
    return [];
  }
}

// Google Search
async function searchGoogle(query: string, apiKey: string): Promise<DiscoveredUrl[]> {
  return searchSerpAPI(
    { q: query, engine: 'google', num: '10', hl: 'pt-br', gl: 'br' },
    apiKey,
    'Google',
    (data) => {
      const results: DiscoveredUrl[] = [];
      
      // Knowledge graph
      if (data.knowledge_graph?.website) {
        results.push({
          url: data.knowledge_graph.website,
          title: data.knowledge_graph.title || 'Site Oficial',
          snippet: data.knowledge_graph.description,
          source: 'google-knowledge-graph',
          type: 'official',
        });
      }
      
      // Profiles from knowledge graph
      if (data.knowledge_graph?.profiles) {
        for (const profile of data.knowledge_graph.profiles) {
          if (profile.link) {
            results.push({
              url: profile.link,
              title: profile.name || 'Perfil',
              source: 'google-profile',
              type: 'social',
            });
          }
        }
      }
      
      // Organic results
      if (data.organic_results) {
        for (const result of data.organic_results) {
          if (result.link) {
            results.push({
              url: result.link,
              title: result.title || 'Resultado',
              snippet: result.snippet,
              source: 'google',
              type: 'organic',
            });
          }
        }
      }
      
      return results;
    }
  );
}

// Google News
async function searchGoogleNews(query: string, apiKey: string): Promise<DiscoveredUrl[]> {
  return searchSerpAPI(
    { q: query, engine: 'google_news', hl: 'pt-br', gl: 'br' },
    apiKey,
    'Google News',
    (data) => {
      const results: DiscoveredUrl[] = [];
      
      if (data.news_results) {
        for (const news of data.news_results.slice(0, 5)) {
          if (news.link) {
            results.push({
              url: news.link,
              title: news.title || 'Notícia',
              snippet: news.snippet || news.source?.name,
              source: 'google-news',
              type: 'news',
            });
          }
        }
      }
      
      return results;
    }
  );
}

// Google Maps / Local
async function searchGoogleMaps(query: string, apiKey: string): Promise<DiscoveredUrl[]> {
  return searchSerpAPI(
    { q: query, engine: 'google_maps', hl: 'pt-br', type: 'search' },
    apiKey,
    'Google Maps',
    (data) => {
      const results: DiscoveredUrl[] = [];
      
      if (data.local_results) {
        for (const place of data.local_results.slice(0, 3)) {
          if (place.website) {
            results.push({
              url: place.website,
              title: place.title || 'Empresa',
              snippet: `${place.address || ''} | ${place.phone || ''}`.trim(),
              source: 'google-maps',
              type: 'local',
            });
          }
        }
      }
      
      return results;
    }
  );
}

// Google Scholar
async function searchGoogleScholar(query: string, apiKey: string): Promise<DiscoveredUrl[]> {
  return searchSerpAPI(
    { q: query, engine: 'google_scholar', hl: 'pt-br' },
    apiKey,
    'Google Scholar',
    (data) => {
      const results: DiscoveredUrl[] = [];
      
      if (data.organic_results) {
        for (const paper of data.organic_results.slice(0, 3)) {
          if (paper.link) {
            results.push({
              url: paper.link,
              title: paper.title || 'Publicação',
              snippet: paper.snippet,
              source: 'google-scholar',
              type: 'academic',
            });
          }
        }
      }
      
      return results;
    }
  );
}

// Google Finance
async function searchGoogleFinance(query: string, apiKey: string): Promise<DiscoveredUrl[]> {
  return searchSerpAPI(
    { q: query, engine: 'google_finance' },
    apiKey,
    'Google Finance',
    (data) => {
      const results: DiscoveredUrl[] = [];
      
      if (data.summary?.extensions) {
        const ext = data.summary.extensions;
        if (ext.website) {
          results.push({
            url: ext.website,
            title: `${data.summary.title || query} - Finanças`,
            snippet: `Setor: ${ext.sector || 'N/A'}`,
            source: 'google-finance',
            type: 'finance',
          });
        }
      }
      
      return results;
    }
  );
}

// Bing Search
async function searchBing(query: string, apiKey: string): Promise<DiscoveredUrl[]> {
  return searchSerpAPI(
    { q: query, engine: 'bing', cc: 'BR', count: '10' },
    apiKey,
    'Bing',
    (data) => {
      const results: DiscoveredUrl[] = [];
      
      if (data.organic_results) {
        for (const result of data.organic_results.slice(0, 5)) {
          if (result.link) {
            results.push({
              url: result.link,
              title: result.title || 'Resultado',
              snippet: result.snippet,
              source: 'bing',
              type: 'organic',
            });
          }
        }
      }
      
      return results;
    }
  );
}

// DuckDuckGo Search
async function searchDuckDuckGo(query: string, apiKey: string): Promise<DiscoveredUrl[]> {
  return searchSerpAPI(
    { q: query, engine: 'duckduckgo', kl: 'br-pt' },
    apiKey,
    'DuckDuckGo',
    (data) => {
      const results: DiscoveredUrl[] = [];
      
      if (data.organic_results) {
        for (const result of data.organic_results.slice(0, 5)) {
          if (result.link) {
            results.push({
              url: result.link,
              title: result.title || 'Resultado',
              snippet: result.snippet,
              source: 'duckduckgo',
              type: 'organic',
            });
          }
        }
      }
      
      return results;
    }
  );
}

// Yahoo Search
async function searchYahoo(query: string, apiKey: string): Promise<DiscoveredUrl[]> {
  return searchSerpAPI(
    { p: query, engine: 'yahoo', vl: 'lang_pt' },
    apiKey,
    'Yahoo',
    (data) => {
      const results: DiscoveredUrl[] = [];
      
      if (data.organic_results) {
        for (const result of data.organic_results.slice(0, 5)) {
          if (result.link) {
            results.push({
              url: result.link,
              title: result.title || 'Resultado',
              snippet: result.snippet,
              source: 'yahoo',
              type: 'organic',
            });
          }
        }
      }
      
      return results;
    }
  );
}

// LinkedIn via Google
async function searchLinkedIn(query: string, apiKey: string): Promise<DiscoveredUrl[]> {
  return searchSerpAPI(
    { q: `${query} site:linkedin.com`, engine: 'google', num: '5', hl: 'pt-br' },
    apiKey,
    'LinkedIn',
    (data) => {
      const results: DiscoveredUrl[] = [];
      
      if (data.organic_results) {
        for (const result of data.organic_results.slice(0, 3)) {
          if (result.link && result.link.includes('linkedin.com')) {
            results.push({
              url: result.link,
              title: result.title || 'Perfil LinkedIn',
              snippet: result.snippet,
              source: 'linkedin',
              type: 'social',
            });
          }
        }
      }
      
      return results;
    }
  );
}

// Fallback: construct likely URLs from company name
function constructLikelyUrls(companyName: string, country: string): DiscoveredUrl[] {
  const results: DiscoveredUrl[] = [];
  
  const normalized = companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
  
  const variations = [
    normalized.replace(/\s+/g, ''),
    normalized.replace(/\s+/g, '-'),
    normalized.split(/\s+/).slice(0, 2).join(''),
    normalized.split(/\s+/)[0],
  ];
  
  const tlds: Record<string, string[]> = {
    'Brasil': ['.com.br', '.com', '.org.br'],
    'USA': ['.com', '.net', '.org'],
    'China': ['.cn', '.com.cn', '.com'],
    'Alemanha': ['.de', '.com', '.eu'],
    'Reino Unido': ['.co.uk', '.uk', '.com'],
    'França': ['.fr', '.com', '.eu'],
    'Itália': ['.it', '.com', '.eu'],
    'Espanha': ['.es', '.com', '.eu'],
    'Portugal': ['.pt', '.com'],
    'México': ['.mx', '.com.mx', '.com'],
    'Argentina': ['.ar', '.com.ar', '.com'],
    'Índia': ['.in', '.co.in', '.com'],
    'Japão': ['.jp', '.co.jp', '.com'],
  };
  
  const countryTlds = tlds[country] || ['.com', '.com.br', '.net'];
  const seenUrls = new Set<string>();
  
  for (const variation of variations) {
    if (variation.length < 3) continue;
    
    for (const tld of countryTlds) {
      const url = `https://www.${variation}${tld}`;
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        results.push({
          url,
          title: `Site oficial (estimado) - ${variation}${tld}`,
          source: 'constructed',
          type: 'estimated',
        });
      }
    }
  }
  
  return results.slice(0, 6);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { companyName, country, industry, deepSearch = false } = await req.json();

    if (!companyName || typeof companyName !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Company name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serpApiKey = Deno.env.get('SERPAPI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const supabase = supabaseUrl && supabaseKey 
      ? createClient(supabaseUrl, supabaseKey)
      : null;
    
    if (!serpApiKey) {
      console.warn('[Discover] SERPAPI_API_KEY not configured, using fallback');
    }

    console.log(`[Discover URLs] Starting multi-engine discovery for: ${companyName}`);

    const countryNormalized = (country || 'Brasil').trim();
    const queryHash = createQueryHash(companyName, countryNormalized);
    
    // Check cache first
    if (supabase) {
      const cached = await getFromCache(supabase, queryHash);
      if (cached && cached.length > 0) {
        return new Response(
          JSON.stringify({
            success: true,
            companyName,
            urls: cached,
            stats: {
              engines: 0,
              totalFound: cached.length,
              unique: cached.length,
              source: 'cache',
              cached: true,
              elapsed_ms: Date.now() - startTime,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const allUrls: DiscoveredUrl[] = [];
    const seenUrls = new Set<string>();
    let enginesUsed = 0;

    const baseQuery = companyName.trim();
    const industryQuery = industry ? `${baseQuery} ${industry}` : baseQuery;

    if (serpApiKey) {
      console.log('[Discover] Starting parallel multi-engine search...');
      
      // Execute searches in parallel batches
      const primarySearches = [
        searchGoogle(baseQuery, serpApiKey),
        searchGoogle(`${baseQuery} ${countryNormalized}`, serpApiKey),
        searchLinkedIn(baseQuery, serpApiKey),
        searchGoogleMaps(`${baseQuery} ${countryNormalized}`, serpApiKey),
      ];

      const secondarySearches = [
        searchGoogleNews(baseQuery, serpApiKey),
        searchBing(industryQuery, serpApiKey),
        searchDuckDuckGo(baseQuery, serpApiKey),
      ];

      // Deep search adds more engines
      const tertiarySearches = deepSearch ? [
        searchYahoo(baseQuery, serpApiKey),
        searchGoogleScholar(baseQuery, serpApiKey),
        searchGoogleFinance(baseQuery, serpApiKey),
      ] : [];

      // Execute all in parallel
      const allSearches = [...primarySearches, ...secondarySearches, ...tertiarySearches];
      const results = await Promise.allSettled(allSearches);

      for (const result of results) {
        if (result.status === 'fulfilled') {
          enginesUsed++;
          for (const url of result.value) {
            try {
              const urlObj = new URL(url.url);
              const normalizedUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`.replace(/\/$/, '');
              
              if (!seenUrls.has(normalizedUrl)) {
                seenUrls.add(normalizedUrl);
                allUrls.push(url);
              }
            } catch {
              // Invalid URL, skip
            }
          }
        }
      }

      console.log(`[Discover] ${enginesUsed} engines returned results, ${allUrls.length} total URLs`);
    }

    // Fallback if no results
    if (allUrls.length === 0) {
      console.log('[Discover] No search results, constructing likely URLs...');
      const constructed = constructLikelyUrls(companyName, countryNormalized);
      allUrls.push(...constructed);
    }

    // Filter and prioritize URLs
    const blockedDomains = ['youtube.com', 'youtu.be', 'facebook.com', 'twitter.com', 'instagram.com'];
    
    const prioritizedUrls = allUrls
      .filter(u => {
        try {
          const domain = new URL(u.url).hostname;
          // Keep LinkedIn but filter other social media
          if (domain.includes('linkedin.com')) return true;
          return !blockedDomains.some(b => domain.includes(b));
        } catch {
          return false;
        }
      })
      // Sort: official first, then local, then social, then organic
      .sort((a, b) => {
        const priority: Record<string, number> = {
          'official': 1,
          'local': 2,
          'finance': 3,
          'social': 4,
          'news': 5,
          'academic': 6,
          'organic': 7,
          'estimated': 8,
        };
        return (priority[a.type || 'organic'] || 7) - (priority[b.type || 'organic'] || 7);
      })
      .slice(0, 20);

    // Save to cache (non-blocking)
    if (supabase && prioritizedUrls.length > 0) {
      saveToCache(supabase, queryHash, companyName, countryNormalized, prioritizedUrls)
        .catch(err => console.warn('[Cache] Background save failed:', err));
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Discover URLs] Complete: ${prioritizedUrls.length} URLs from ${enginesUsed} engines in ${elapsed}ms`);

    // Group by source for stats
    const sourceStats: Record<string, number> = {};
    for (const url of prioritizedUrls) {
      sourceStats[url.source] = (sourceStats[url.source] || 0) + 1;
    }

    return new Response(
      JSON.stringify({
        success: true,
        companyName,
        urls: prioritizedUrls,
        stats: {
          engines: enginesUsed,
          totalFound: allUrls.length,
          unique: prioritizedUrls.length,
          bySource: sourceStats,
          source: serpApiKey ? 'serpapi-multi' : 'fallback',
          cached: false,
          elapsed_ms: elapsed,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Discover URLs] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to discover URLs';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
