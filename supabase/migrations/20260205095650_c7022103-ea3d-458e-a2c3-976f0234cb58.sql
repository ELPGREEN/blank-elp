-- Drop the old trigger that gives admin to first user
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;

-- Drop the old function
DROP FUNCTION IF EXISTS public.assign_first_admin();

-- Create new function that only gives admin to info@elpgreen.com
CREATE OR REPLACE FUNCTION public.assign_admin_to_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign admin role to the owner email
  IF NEW.email = 'info@elpgreen.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create new trigger
CREATE TRIGGER on_auth_user_created_assign_owner_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_to_owner();

-- Ensure only info@elpgreen.com has admin role (cleanup any others)
DELETE FROM public.user_roles 
WHERE role = 'admin' 
AND user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'info@elpgreen.com'
);