
-- Fix storage policy to properly allow public uploads of signed documents
-- The issue is that anon users cannot upload to the storage bucket

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Public can upload signed documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can read signed documents" ON storage.objects;

-- Create more permissive upload policy for signed documents
-- This allows the signing flow to work for anon users
CREATE POLICY "Public can upload signed documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lead-documents' 
  AND (
    storage.filename(name) ILIKE '%_SIGNED_%' 
    OR storage.filename(name) ILIKE '%SIGNED%'
  )
);

-- Create read policy for signed documents
CREATE POLICY "Public can read signed documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lead-documents' 
  AND (
    storage.filename(name) ILIKE '%_SIGNED_%' 
    OR storage.filename(name) ILIKE '%SIGNED%'
  )
);

-- Add UPDATE policy for anon users on generated_documents to update file_url
-- This was missing and prevents the file_url from being saved
DROP POLICY IF EXISTS "Allow anon to update file_url after signature" ON generated_documents;

CREATE POLICY "Allow anon to update file_url after signature"
ON public.generated_documents FOR UPDATE
USING (
  -- Allow update if document was just signed (has signature data)
  signature_status = 'complete' 
  AND is_signed = true
)
WITH CHECK (
  -- Only allow updating file_url when signature is already complete
  signature_status = 'complete'
  AND is_signed = true
  AND signature_hash IS NOT NULL
  AND length(signature_hash) >= 32
);
