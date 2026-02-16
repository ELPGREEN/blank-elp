import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fallback static videos if YouTube API fails
const FALLBACK_VIDEOS = [
  { id: 'NlEC0WsEkvQ', title: 'Conveyor Belt Systems for Seamless Mining Flow', tags: ['mining', 'equipment'] },
  { id: 'DmMLBxClxsA', title: 'High-Capacity Crushers – Built for Tough Conditions', tags: ['mining', 'equipment'] },
  { id: 'Th4KQR0lBCc', title: 'Pyrolysis Technology – Transforming Waste into Energy', tags: ['pyrolysis', 'sustainability'] },
  { id: 'G8mYBzeM9zo', title: 'From Scrap to Resource – The Tire Recycling Revolution', tags: ['recycling', 'sustainability'] },
  { id: 'cu2br5U8rzM', title: 'Revolutionize with Tire Recycling: ELP Green & Tops Recycling', tags: ['recycling', 'partnership'] },
  { id: 'ZSPuzTPJtXU', title: 'China-Brazil Partnership for Sustainability', tags: ['partnership', 'sustainability'] },
];

// Cache key for storing fetched videos
const CACHE_TABLE = 'youtube_cache';

// YouTube channel ID for @elpgreen
const CHANNEL_ID = 'UCxO9xD3J9Z9xQ9rVu9X9x9g'; // You may need to update this with actual channel ID

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching YouTube videos...");
    
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    
    if (!YOUTUBE_API_KEY) {
      console.log("No YouTube API key, returning fallback videos");
      return new Response(
        JSON.stringify({ videos: FALLBACK_VIDEOS, source: 'fallback' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL_SUPABASE") || Deno.env.get("URL_SUPABAS");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (24h validity)
    const { data: cachedData } = await supabase
      .from(CACHE_TABLE)
      .select('videos, updated_at')
      .eq('id', 'elpgreen_videos')
      .single();

    if (cachedData) {
      const cacheAge = Date.now() - new Date(cachedData.updated_at).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (cacheAge < twentyFourHours) {
        console.log("Returning cached videos, age:", Math.round(cacheAge / 1000 / 60), "minutes");
        return new Response(
          JSON.stringify({ videos: cachedData.videos, source: 'cache' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch from YouTube API - search for channel videos
    // First, get the channel's upload playlist
    const channelUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&order=date&type=video&key=${YOUTUBE_API_KEY}`;
    
    console.log("Fetching from YouTube API...");
    const response = await fetch(channelUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("YouTube API error:", response.status, errorText);
      
      // Return cached data if available, otherwise fallback
      if (cachedData) {
        return new Response(
          JSON.stringify({ videos: cachedData.videos, source: 'stale_cache' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ videos: FALLBACK_VIDEOS, source: 'fallback' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("YouTube API returned", data.items?.length || 0, "videos");

    // Transform API response to our format
    const videos = (data.items || []).map((item: any) => {
      const title = item.snippet.title;
      
      // Auto-tag based on title keywords
      const tags: string[] = [];
      const titleLower = title.toLowerCase();
      
      if (titleLower.includes('mining') || titleLower.includes('crusher') || titleLower.includes('mineral')) {
        tags.push('mining');
      }
      if (titleLower.includes('recycl') || titleLower.includes('tire') || titleLower.includes('rubber')) {
        tags.push('recycling');
      }
      if (titleLower.includes('pyrolysis') || titleLower.includes('waste to energy')) {
        tags.push('pyrolysis');
      }
      if (titleLower.includes('partner') || titleLower.includes('china') || titleLower.includes('tops') || titleLower.includes('alliance')) {
        tags.push('partnership');
      }
      if (titleLower.includes('machine') || titleLower.includes('equipment') || titleLower.includes('plant') || titleLower.includes('crusher') || titleLower.includes('shredder')) {
        tags.push('equipment');
      }
      if (titleLower.includes('eco') || titleLower.includes('green') || titleLower.includes('sustain') || titleLower.includes('circular')) {
        tags.push('sustainability');
      }
      
      // Default tag if none matched
      if (tags.length === 0) {
        tags.push('equipment');
      }

      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description?.slice(0, 200) || '',
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
        publishedAt: item.snippet.publishedAt,
        tags
      };
    });

    // Update cache
    await supabase
      .from(CACHE_TABLE)
      .upsert({
        id: 'elpgreen_videos',
        videos,
        updated_at: new Date().toISOString()
      });

    console.log("Returning", videos.length, "videos from YouTube API");
    
    return new Response(
      JSON.stringify({ videos, source: 'youtube_api' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ videos: FALLBACK_VIDEOS, source: 'fallback', error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
