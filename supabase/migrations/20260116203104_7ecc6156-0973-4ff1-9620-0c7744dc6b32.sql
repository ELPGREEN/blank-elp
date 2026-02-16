-- Create cache table for YouTube videos
CREATE TABLE IF NOT EXISTS public.youtube_cache (
  id TEXT PRIMARY KEY,
  videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public read (videos are public content)
ALTER TABLE public.youtube_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached videos
CREATE POLICY "Anyone can read YouTube cache"
  ON public.youtube_cache
  FOR SELECT
  USING (true);

-- Only service role can update cache (from edge function)
CREATE POLICY "Service role can update YouTube cache"
  ON public.youtube_cache
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');