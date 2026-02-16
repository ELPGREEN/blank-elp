-- Create table to store accumulated company intelligence
CREATE TABLE public.company_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_name_normalized TEXT NOT NULL, -- lowercase, trimmed for matching
  country TEXT,
  industry TEXT,
  
  -- Accumulated data from analyses
  collected_urls JSONB DEFAULT '[]'::jsonb,
  collected_data TEXT, -- Raw scraped content accumulated
  ai_insights TEXT, -- Accumulated AI insights
  leadership_data JSONB DEFAULT '[]'::jsonb,
  products_services JSONB DEFAULT '[]'::jsonb,
  financial_data JSONB DEFAULT '{}'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '[]'::jsonb,
  
  -- Analysis metadata
  analysis_count INTEGER DEFAULT 1,
  last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create unique index for company matching
CREATE UNIQUE INDEX idx_company_intelligence_normalized 
ON public.company_intelligence(company_name_normalized);

-- Create index for search
CREATE INDEX idx_company_intelligence_name 
ON public.company_intelligence USING gin(to_tsvector('portuguese', company_name));

-- Enable RLS
ALTER TABLE public.company_intelligence ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage company intelligence"
ON public.company_intelligence
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role IN ('admin', 'editor')
));

CREATE POLICY "Users can view company intelligence"
ON public.company_intelligence
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role IN ('admin', 'editor', 'viewer')
));

-- Trigger for updated_at
CREATE TRIGGER update_company_intelligence_updated_at
BEFORE UPDATE ON public.company_intelligence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();