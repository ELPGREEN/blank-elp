/**
 * SerpAPI "About This Result" Edge Function
 * Fetches verified company information from Google's Knowledge Graph
 * including: description, CEO, headquarters, founders, social links, reviews
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AboutThisResultRequest {
  url: string;
  companyName?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, companyName } = await req.json() as AboutThisResultRequest;

    if (!url && !companyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL or company name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('SERPAPI_API_KEY');
    if (!apiKey) {
      console.error('SERPAPI_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'SerpAPI key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the query - either "About https://url" or "About company name"
    const query = url 
      ? `About ${url.startsWith('http') ? url : `https://${url}`}`
      : `About ${companyName}`;

    console.log('SerpAPI About This Result query:', query);

    const searchParams = new URLSearchParams({
      engine: 'google_about_this_result',
      q: query,
      api_key: apiKey,
    });

    const response = await fetch(`https://serpapi.com/search.json?${searchParams.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: `SerpAPI request failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract the most useful information
    const aboutResult = data.about_this_result || {};
    const aboutSource = aboutResult.about_the_source || {};
    
    const enrichedData = {
      success: true,
      raw: data,
      extracted: {
        // Basic info
        title: aboutResult.title || null,
        link: aboutResult.link || null,
        source: aboutResult.source || null,
        favicon: aboutResult.favicon || null,
        
        // Company details
        companyName: aboutSource.title || aboutResult.title || null,
        subtitle: aboutSource.subtitle || null,
        
        // Description from Wikipedia/Knowledge Graph
        description: aboutSource.description?.snippet || null,
        descriptionSource: aboutSource.description?.link || null,
        
        // Company details (CEO, HQ, Founded, etc.)
        companyDetails: aboutSource.description?.snippet_details?.map((detail: Record<string, string>) => {
          const key = Object.keys(detail).find(k => k !== 'link');
          return key ? { field: key, value: detail[key], link: detail.link } : null;
        }).filter(Boolean) || [],
        
        // In their own words (from company website)
        ownDescription: aboutSource.in_their_own_words?.snippet || null,
        ownDescriptionLink: aboutSource.in_their_own_words?.link || null,
        
        // Social media links
        socialLinks: aboutSource.in_their_own_words?.social?.map((s: { name: string; link: string }) => ({
          platform: s.name,
          url: s.link
        })) || [],
        
        // Reviews
        reviews: aboutSource.reviews_from_the_web?.map((r: { source: string; rating: number; number_of_ratings: number; title: string; excerpt: string }) => ({
          source: r.source,
          rating: r.rating,
          count: r.number_of_ratings,
          title: r.title,
          excerpt: r.excerpt
        })) || [],
        
        // Store insights (for e-commerce)
        storeInsights: aboutSource.store_insights?.insights || null,
        
        // When first indexed
        firstIndexed: aboutSource.site_first_indexed_by_google?.snippet || null,
        archiveLink: aboutSource.site_first_indexed_by_google?.link || null,
        
        // Related web results
        relatedSources: aboutSource.web_results_about_the_source?.slice(0, 5).map((r: { title: string; link: string; source: string; snippet: string }) => ({
          title: r.title,
          link: r.link,
          source: r.source,
          snippet: r.snippet
        })) || [],
      }
    };

    console.log('Successfully fetched About This Result data');
    
    return new Response(
      JSON.stringify(enrichedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in serpapi-about:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch About This Result'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
