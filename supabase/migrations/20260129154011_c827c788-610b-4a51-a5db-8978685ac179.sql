-- Add DELETE policy for report_verifications table
CREATE POLICY "Admins can delete report verifications" 
ON public.report_verifications 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = ANY (ARRAY['admin'::app_role, 'editor'::app_role])
));

-- Also add SELECT policy for admins to view all verifications
CREATE POLICY "Admins can view all report verifications" 
ON public.report_verifications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = ANY (ARRAY['admin'::app_role, 'editor'::app_role])
));