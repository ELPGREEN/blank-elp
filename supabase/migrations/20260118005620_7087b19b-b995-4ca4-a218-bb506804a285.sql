-- Fix RLS policies for document_templates - change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Admins and editors can view templates" ON document_templates;
DROP POLICY IF EXISTS "Admins and editors can insert templates" ON document_templates;
DROP POLICY IF EXISTS "Admins and editors can update templates" ON document_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON document_templates;

-- Create PERMISSIVE policies (default is PERMISSIVE when not specified)
CREATE POLICY "Admins and editors can view templates"
  ON document_templates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins and editors can insert templates"
  ON document_templates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins and editors can update templates"
  ON document_templates FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins can delete templates"
  ON document_templates FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  ));