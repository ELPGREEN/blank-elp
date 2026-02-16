-- Cache table for SerpAPI search results
CREATE TABLE public.serpapi_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_hash TEXT NOT NULL UNIQUE,
  query_text TEXT NOT NULL,
  country TEXT,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Index for fast lookups
CREATE INDEX idx_serpapi_cache_query_hash ON public.serpapi_cache(query_hash);
CREATE INDEX idx_serpapi_cache_expires ON public.serpapi_cache(expires_at);

-- Enable RLS
ALTER TABLE public.serpapi_cache ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users (edge functions use service role)
CREATE POLICY "Service role can manage cache"
ON public.serpapi_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Comment
COMMENT ON TABLE public.serpapi_cache IS 'Cache for SerpAPI search results to reduce API calls';