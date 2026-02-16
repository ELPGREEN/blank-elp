-- Add policy to allow public users to update documents for signing
CREATE POLICY "Anyone can update document for signing"
ON public.generated_documents
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add policy to allow anyone to insert signature logs
DROP POLICY IF EXISTS "Authenticated users can insert signature logs" ON public.signature_log;
CREATE POLICY "Anyone can insert signature logs"
ON public.signature_log
FOR INSERT
WITH CHECK (true);