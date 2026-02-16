-- Fix 1: Allow public INSERT to signature_log (anonymous users)
DROP POLICY IF EXISTS "Insert signature with valid data" ON public.signature_log;

CREATE POLICY "Public can log signatures with valid data"
ON public.signature_log
FOR INSERT
TO anon, authenticated
WITH CHECK (
  document_id IS NOT NULL 
  AND signer_email IS NOT NULL 
  AND signer_name IS NOT NULL 
  AND signature_type IS NOT NULL 
  AND signature_hash IS NOT NULL 
  AND length(signature_hash) >= 32
);

-- Fix 2: Allow public to view their own signature logs by document hash
DROP POLICY IF EXISTS "Signers can view own logs" ON public.signature_log;

CREATE POLICY "Public can view logs by document hash"
ON public.signature_log
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.generated_documents gd 
    WHERE gd.id = signature_log.document_id 
    AND (gd.is_signed = true OR gd.signature_status IN ('partial', 'complete'))
  )
);

-- Fix 3: Storage policies for lead-documents bucket - allow public uploads for signed documents
-- First allow public to upload signed PDFs
CREATE POLICY "Public can upload signed documents"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'lead-documents'
  AND (storage.filename(name) ILIKE '%_SIGNED_%' OR storage.filename(name) ILIKE '%SIGNED%')
);

-- Allow public to read signed documents
CREATE POLICY "Public can read signed documents"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'lead-documents'
  AND (storage.filename(name) ILIKE '%_SIGNED_%' OR storage.filename(name) ILIKE '%SIGNED%')
);

-- Fix 4: Allow public to update generated_documents after signing (with validation)
DROP POLICY IF EXISTS "Allow signature updates with valid data" ON public.generated_documents;

CREATE POLICY "Allow signature updates with valid data"
ON public.generated_documents
FOR UPDATE
TO anon, authenticated
USING (
  (is_signed = false OR is_signed IS NULL)
  OR (signature_status = 'partial' AND current_signatures < required_signatures)
)
WITH CHECK (
  (signature_hash IS NOT NULL AND length(signature_hash) >= 32 AND signer_email IS NOT NULL AND signer_name IS NOT NULL)
  OR signature_status = 'partial'
);