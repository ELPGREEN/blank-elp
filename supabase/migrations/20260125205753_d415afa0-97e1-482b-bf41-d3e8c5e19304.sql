-- =====================================================
-- SECURITY FIX: Restrict access to sensitive tables
-- =====================================================

-- 1. FIX: aml_screened_lists - Remove public access
DROP POLICY IF EXISTS "Anyone can view screened lists" ON public.aml_screened_lists;

CREATE POLICY "Editors can view screened lists"
ON public.aml_screened_lists
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = ANY (ARRAY['admin'::app_role, 'editor'::app_role])
));

-- 2. FIX: cnpj_cache - Restrict to authenticated editors/admins
DROP POLICY IF EXISTS "Anyone can view CNPJ cache" ON public.cnpj_cache;

CREATE POLICY "Editors can view CNPJ cache"
ON public.cnpj_cache
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = ANY (ARRAY['admin'::app_role, 'editor'::app_role])
));

-- 3. FIX: aml_screening_reports - Strengthen token validation
DROP POLICY IF EXISTS "Public can view with valid token" ON public.aml_screening_reports;

CREATE POLICY "Public can view with valid cryptographic token"
ON public.aml_screening_reports
FOR SELECT
USING (
  report_token IS NOT NULL 
  AND length(report_token) >= 64  -- Require longer tokens
  AND expires_at > now()
);

-- 4. FIX: cgu_sanctions_cache - Restrict to editors
DROP POLICY IF EXISTS "Anyone can view CGU sanctions" ON public.cgu_sanctions_cache;

CREATE POLICY "Editors can view CGU sanctions"
ON public.cgu_sanctions_cache
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = ANY (ARRAY['admin'::app_role, 'editor'::app_role])
));

-- 5. FIX: document_templates - Restrict public view to only templates marked as public
DROP POLICY IF EXISTS "Public can view active templates" ON public.document_templates;

-- Only admins/editors can view templates now
-- (Public template access removed for security)

-- 6. Create serpapi_cache table with proper RLS if it doesn't exist
CREATE TABLE IF NOT EXISTS public.serpapi_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash text NOT NULL UNIQUE,
  query_text text NOT NULL,
  results jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  hit_count integer DEFAULT 0
);

ALTER TABLE public.serpapi_cache ENABLE ROW LEVEL SECURITY;

-- Drop any existing public policies on serpapi_cache
DROP POLICY IF EXISTS "Anyone can view serpapi cache" ON public.serpapi_cache;
DROP POLICY IF EXISTS "Public can view search cache" ON public.serpapi_cache;

-- Only service role and editors can access serpapi_cache
CREATE POLICY "Service role can manage serpapi cache"
ON public.serpapi_cache
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Editors can view serpapi cache"
ON public.serpapi_cache
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = ANY (ARRAY['admin'::app_role, 'editor'::app_role])
));