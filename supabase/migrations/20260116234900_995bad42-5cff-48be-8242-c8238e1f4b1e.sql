-- Fix loi_documents: require valid token in RLS policy (not just expiration check)
DROP POLICY IF EXISTS "LOI documents are publicly viewable via token" ON public.loi_documents;
CREATE POLICY "LOI documents viewable with valid token" ON public.loi_documents
  FOR SELECT USING (
    expires_at > now() 
    AND token IS NOT NULL 
    AND length(token) > 20
  );

-- Admins can view all LOI documents
CREATE POLICY "Admins can view all loi documents" ON public.loi_documents
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Fix marketplace_registrations: only admins can view
DROP POLICY IF EXISTS "Authenticated users can view registrations" ON public.marketplace_registrations;
CREATE POLICY "Admins can view registrations" ON public.marketplace_registrations
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update registrations" ON public.marketplace_registrations
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete registrations" ON public.marketplace_registrations
  FOR DELETE USING (public.is_admin(auth.uid()));