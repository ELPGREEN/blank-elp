-- Add support for documents requiring multiple signatures
ALTER TABLE public.generated_documents
ADD COLUMN IF NOT EXISTS required_signatures integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_signatures integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS all_signatures_data jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pending_signer_email text,
ADD COLUMN IF NOT EXISTS pending_signer_name text,
ADD COLUMN IF NOT EXISTS signature_status text DEFAULT 'pending';

-- Add comment to explain the fields
COMMENT ON COLUMN public.generated_documents.required_signatures IS 'Number of signatures required for this document';
COMMENT ON COLUMN public.generated_documents.current_signatures IS 'Number of signatures collected so far';
COMMENT ON COLUMN public.generated_documents.all_signatures_data IS 'Array of all signature data collected';
COMMENT ON COLUMN public.generated_documents.pending_signer_email IS 'Email of the next person who needs to sign';
COMMENT ON COLUMN public.generated_documents.pending_signer_name IS 'Name of the next person who needs to sign';
COMMENT ON COLUMN public.generated_documents.signature_status IS 'Status: pending, partial, complete';

-- Update RLS policy to allow partial signature updates
DROP POLICY IF EXISTS "Allow signature updates with valid data" ON public.generated_documents;

CREATE POLICY "Allow signature updates with valid data" 
ON public.generated_documents 
FOR UPDATE 
USING (
  (is_signed = false) OR 
  (is_signed IS NULL) OR
  (signature_status = 'partial' AND current_signatures < required_signatures)
)
WITH CHECK (
  (signature_hash IS NOT NULL AND length(signature_hash) >= 32 AND signer_email IS NOT NULL AND signer_name IS NOT NULL) OR
  (signature_status = 'partial')
);

-- Create index for pending signatures
CREATE INDEX IF NOT EXISTS idx_generated_documents_pending_signer 
ON public.generated_documents(pending_signer_email) 
WHERE signature_status IN ('pending', 'partial');