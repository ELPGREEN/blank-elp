-- Add signature columns to generated_documents table
ALTER TABLE public.generated_documents 
ADD COLUMN IF NOT EXISTS signature_data jsonb,
ADD COLUMN IF NOT EXISTS signed_at timestamptz,
ADD COLUMN IF NOT EXISTS signer_name text,
ADD COLUMN IF NOT EXISTS signer_email text,
ADD COLUMN IF NOT EXISTS signature_type text CHECK (signature_type IN ('drawn', 'typed', NULL)),
ADD COLUMN IF NOT EXISTS signature_hash text,
ADD COLUMN IF NOT EXISTS is_signed boolean DEFAULT false;

-- Create index for signed documents
CREATE INDEX IF NOT EXISTS idx_generated_documents_signed ON public.generated_documents(is_signed) WHERE is_signed = true;

-- Create signature audit log table
CREATE TABLE IF NOT EXISTS public.signature_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.generated_documents(id) ON DELETE CASCADE,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signature_type text NOT NULL CHECK (signature_type IN ('drawn', 'typed')),
  signature_hash text NOT NULL,
  ip_address text,
  user_agent text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signature_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for signature_log
CREATE POLICY "Authenticated users can view signature logs"
ON public.signature_log FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert signature logs"
ON public.signature_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE public.signature_log IS 'Audit log for all digital signatures with legal compliance data';
COMMENT ON COLUMN public.signature_log.signature_hash IS 'SHA-256 hash of the signature for integrity verification';