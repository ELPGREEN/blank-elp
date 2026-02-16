-- Create enum for screening types
CREATE TYPE public.screening_type AS ENUM ('sanctions', 'pep', 'criminal', 'watchlist', 'adverse_media');

-- Create enum for match status
CREATE TYPE public.match_status AS ENUM ('pending', 'confirmed', 'false_positive', 'escalated', 'cleared');

-- Main AML Screening Reports table
CREATE TABLE public.aml_screening_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Subject Information
  subject_name TEXT NOT NULL,
  subject_name_local TEXT, -- Local script name (e.g., 张三)
  subject_id_number TEXT,
  subject_date_of_birth DATE,
  subject_country TEXT,
  subject_gender TEXT,
  subject_company_name TEXT,
  subject_company_registration TEXT,
  
  -- Scan Configuration
  screening_types TEXT[] NOT NULL DEFAULT ARRAY['sanctions', 'pep'],
  jurisdictions TEXT[] NOT NULL DEFAULT ARRAY['All'],
  match_rate_threshold INTEGER NOT NULL DEFAULT 80,
  
  -- Results Summary
  total_matches INTEGER DEFAULT 0,
  total_screened_lists INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low', -- low, medium, high, critical
  status TEXT DEFAULT 'completed',
  
  -- Report Data
  report_token TEXT UNIQUE,
  report_markdown TEXT,
  pdf_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '90 days'),
  
  -- Browser/Session tracking
  browser_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT
);

-- Individual Match Results table
CREATE TABLE public.aml_screening_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.aml_screening_reports(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Match Information
  matched_name TEXT NOT NULL,
  matched_name_local TEXT,
  match_rate DECIMAL(5,2) NOT NULL,
  match_rank INTEGER,
  
  -- Entity Information
  entity_type TEXT DEFAULT 'individual', -- individual, organization
  tag TEXT, -- SAN, PEP, RCA, etc.
  nationality TEXT,
  id_number TEXT,
  date_of_birth DATE,
  gender TEXT,
  
  -- Source Information
  source_name TEXT NOT NULL,
  source_issuer TEXT,
  source_url TEXT,
  source_jurisdiction TEXT,
  
  -- Other Information
  alias TEXT[],
  place_of_birth TEXT,
  role_description TEXT,
  reason TEXT,
  address TEXT,
  remark TEXT,
  
  -- Important Dates
  disclosure_date DATE,
  start_date DATE,
  end_date DATE,
  delisting_date DATE,
  
  -- Associated Entities
  associated_companies JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  review_status match_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT
);

-- Screened Lists Reference table
CREATE TABLE public.aml_screened_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.aml_screening_reports(id) ON DELETE CASCADE,
  
  list_name TEXT NOT NULL,
  issuer TEXT,
  issuer_description TEXT,
  jurisdiction TEXT,
  jurisdiction_code TEXT,
  source_url TEXT,
  list_type TEXT DEFAULT 'sanctions', -- sanctions, pep, watchlist
  matches_found INTEGER DEFAULT 0
);

-- Screening History for audit
CREATE TABLE public.aml_screening_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  report_id UUID REFERENCES public.aml_screening_reports(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- created, viewed, exported, reviewed, escalated
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.aml_screening_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aml_screening_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aml_screened_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aml_screening_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for aml_screening_reports
CREATE POLICY "Admins can manage all screening reports"
ON public.aml_screening_reports FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Editors can view and create reports"
ON public.aml_screening_reports FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role IN ('admin', 'editor')
));

CREATE POLICY "Editors can insert reports"
ON public.aml_screening_reports FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role IN ('admin', 'editor')
));

CREATE POLICY "Public can view with valid token"
ON public.aml_screening_reports FOR SELECT
USING (report_token IS NOT NULL AND expires_at > now());

-- RLS Policies for aml_screening_matches
CREATE POLICY "Admins can manage all matches"
ON public.aml_screening_matches FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "Editors can view matches"
ON public.aml_screening_matches FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role IN ('admin', 'editor')
));

CREATE POLICY "Editors can insert matches"
ON public.aml_screening_matches FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role IN ('admin', 'editor')
));

-- RLS Policies for aml_screened_lists
CREATE POLICY "Anyone can view screened lists"
ON public.aml_screened_lists FOR SELECT
USING (true);

CREATE POLICY "Editors can manage screened lists"
ON public.aml_screened_lists FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role IN ('admin', 'editor')
));

-- RLS Policies for aml_screening_history
CREATE POLICY "Admins can view all history"
ON public.aml_screening_history FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert history"
ON public.aml_screening_history FOR INSERT
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_aml_reports_created_by ON public.aml_screening_reports(created_by);
CREATE INDEX idx_aml_reports_created_at ON public.aml_screening_reports(created_at DESC);
CREATE INDEX idx_aml_reports_token ON public.aml_screening_reports(report_token);
CREATE INDEX idx_aml_reports_subject ON public.aml_screening_reports(subject_name);
CREATE INDEX idx_aml_matches_report ON public.aml_screening_matches(report_id);
CREATE INDEX idx_aml_matches_rate ON public.aml_screening_matches(match_rate DESC);
CREATE INDEX idx_aml_history_report ON public.aml_screening_history(report_id);

-- Trigger for updated_at
CREATE TRIGGER update_aml_reports_updated_at
BEFORE UPDATE ON public.aml_screening_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();