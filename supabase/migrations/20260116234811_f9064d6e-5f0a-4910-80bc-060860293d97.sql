-- Fix profiles table: users can only view their own profile
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Fix contacts table: only admins can view and update
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON public.contacts;

CREATE POLICY "Admins can view contacts" ON public.contacts
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update contacts" ON public.contacts
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete contacts" ON public.contacts
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Fix impact_stats table: only admins can manage
DROP POLICY IF EXISTS "Authenticated users can manage impact stats" ON public.impact_stats;

CREATE POLICY "Admins can insert impact stats" ON public.impact_stats
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update impact stats" ON public.impact_stats
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete impact stats" ON public.impact_stats
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Fix newsletter_subscribers: only admins can view and update
DROP POLICY IF EXISTS "Authenticated users can view subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Authenticated users can update subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update subscribers" ON public.newsletter_subscribers
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Fix loi_documents: restrict update to admins
DROP POLICY IF EXISTS "Allow update for download tracking" ON public.loi_documents;
CREATE POLICY "Admins can update loi documents" ON public.loi_documents
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Fix function search_path for increment_loi_download
CREATE OR REPLACE FUNCTION public.increment_loi_download(loi_token character varying)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.loi_documents
  SET download_count = download_count + 1,
      last_accessed_at = now()
  WHERE token = loi_token;
END;
$function$;