-- Allow public to insert signed documents into lead_documents
-- This is needed for the signature flow to save the signed PDF reference
CREATE POLICY "Public can insert signed document records"
ON public.lead_documents
FOR INSERT
WITH CHECK (
  document_type = 'signed_report'
  AND file_name LIKE '%SIGNED%'
  AND notes LIKE '%assinado digitalmente%'
);