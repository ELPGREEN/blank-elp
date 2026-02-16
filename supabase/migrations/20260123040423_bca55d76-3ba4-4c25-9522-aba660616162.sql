-- Create table for storing Duo BI analyses
CREATE TABLE public.analises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  insights_claude TEXT,
  complemento_gemini TEXT,
  relatorio_markdown TEXT,
  modo_rapido BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'completed',
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.analises ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own analyses" 
ON public.analises 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own analyses" 
ON public.analises 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" 
ON public.analises 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" 
ON public.analises 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can manage all analyses
CREATE POLICY "Admins can manage all analyses"
ON public.analises
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_analises_user_id ON public.analises(user_id);
CREATE INDEX idx_analises_created_at ON public.analises(created_at DESC);