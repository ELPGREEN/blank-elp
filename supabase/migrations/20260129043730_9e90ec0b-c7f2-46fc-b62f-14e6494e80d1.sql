-- Drop and recreate the SELECT policy for pending documents with better NULL handling
DROP POLICY IF EXISTS "Public can view pending documents for signature" ON public.generated_documents;

CREATE POLICY "Public can view pending documents for signature"
ON public.generated_documents
FOR SELECT
USING (
  -- Document must not be fully signed
  (is_signed = false OR is_signed IS NULL)
  AND 
  -- Allow pending, partial, or NULL status (for legacy documents)
  (signature_status IN ('pending', 'partial') OR signature_status IS NULL)
);

-- Also fix the UPDATE policy to handle legacy documents
DROP POLICY IF EXISTS "Allow signature updates with valid data" ON public.generated_documents;

CREATE POLICY "Allow signature updates with valid data"
ON public.generated_documents
FOR UPDATE
USING (
  -- Can update if: not signed, NULL signed status, or partial with room for more signatures
  (is_signed = false) 
  OR (is_signed IS NULL) 
  OR (
    signature_status = 'partial' 
    AND current_signatures < required_signatures
  )
  -- Also allow legacy documents with NULL status
  OR (signature_status IS NULL)
)
WITH CHECK (
  -- New data must have valid signature info OR be a partial signature
  (
    signature_hash IS NOT NULL 
    AND length(signature_hash) >= 32 
    AND signer_email IS NOT NULL 
    AND signer_name IS NOT NULL
  ) 
  OR signature_status = 'partial'
);