
-- Fix policies that incorrectly use {public} role instead of {authenticated}

-- 1. meetings: "Admins can insert meetings" should be authenticated
DROP POLICY IF EXISTS "Admins can insert meetings" ON public.meetings;
CREATE POLICY "Admins can insert meetings"
ON public.meetings FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  )
);

-- 2. push_notifications: "Admins can insert notifications" should be authenticated
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.push_notifications;
CREATE POLICY "Admins can insert notifications"
ON public.push_notifications FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 3. report_verifications: "Admins can insert report verifications" should be authenticated
DROP POLICY IF EXISTS "Admins can insert report verifications" ON public.report_verifications;
CREATE POLICY "Admins can insert report verifications"
ON public.report_verifications FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  )
);

-- 4. user_roles: "Admins can insert roles" should be authenticated
-- (DB trigger assign_admin_to_owner uses SECURITY DEFINER, bypasses RLS)
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 5. profiles: "Users can insert own profile" should be authenticated
-- (DB trigger handle_new_user uses SECURITY DEFINER, bypasses RLS)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
