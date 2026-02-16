-- Allow public read access to active document templates
CREATE POLICY "Public can view active templates"
ON public.document_templates
FOR SELECT
USING (is_active = true);