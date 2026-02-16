-- Allow admins to delete generated documents
CREATE POLICY "Admins can delete generated documents"
ON public.generated_documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  )
);