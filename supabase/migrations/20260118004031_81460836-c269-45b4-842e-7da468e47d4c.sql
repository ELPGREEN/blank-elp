-- Drop the type check constraint to allow new document types
ALTER TABLE public.document_templates DROP CONSTRAINT IF EXISTS document_templates_type_check;

-- Fix RLS policies for document_templates
DROP POLICY IF EXISTS "Admins can manage doc templates" ON public.document_templates;
DROP POLICY IF EXISTS "Admins can view doc templates" ON public.document_templates;

CREATE POLICY "Admins and editors can view templates"
ON public.document_templates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins and editors can insert templates"
ON public.document_templates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins and editors can update templates"
ON public.document_templates FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can delete templates"
ON public.document_templates FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);