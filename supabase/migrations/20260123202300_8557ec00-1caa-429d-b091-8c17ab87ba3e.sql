-- Fix RLS policies to be more restrictive (cache tables managed via service_role only)

-- Drop overly permissive policies
DROP POLICY IF EXISTS "System can manage CNPJ cache" ON public.cnpj_cache;
DROP POLICY IF EXISTS "System can manage CPF cache" ON public.cpf_cache;
DROP POLICY IF EXISTS "System can manage CGU sanctions" ON public.cgu_sanctions_cache;

-- Create proper restrictive policies for cache management (service_role only)
CREATE POLICY "Service role can manage CNPJ cache" ON public.cnpj_cache FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage CPF cache" ON public.cpf_cache FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage CGU sanctions" ON public.cgu_sanctions_cache FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');