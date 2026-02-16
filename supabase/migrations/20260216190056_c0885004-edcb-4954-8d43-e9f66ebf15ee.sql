-- Add admin SELECT policy for impact_stats (so admins can see all stats including inactive)
CREATE POLICY "Admins can view all impact stats"
ON public.impact_stats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  )
);

-- Add admin SELECT policy for contacts (currently uses is_admin, add editor/viewer access)
-- contacts already has "Admins can view contacts" with is_admin(), 
-- but editors/viewers who can access the admin panel can't see data
-- Let's add editor access
CREATE POLICY "Editors can view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('editor', 'viewer')
  )
);

-- Add editor access for marketplace_registrations
CREATE POLICY "Editors can view registrations"
ON public.marketplace_registrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('editor', 'viewer')
  )
);

-- Add editor access for newsletter_subscribers
CREATE POLICY "Editors can view subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('editor', 'viewer')
  )
);