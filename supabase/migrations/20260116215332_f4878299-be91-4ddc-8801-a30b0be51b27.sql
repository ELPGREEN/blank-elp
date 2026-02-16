-- Create table for LOI documents with unique tokens
CREATE TABLE public.loi_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token VARCHAR(64) NOT NULL UNIQUE,
  registration_id UUID REFERENCES public.marketplace_registrations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  company_type TEXT NOT NULL,
  products_interest TEXT[] NOT NULL,
  estimated_volume TEXT,
  message TEXT,
  language VARCHAR(5) NOT NULL DEFAULT 'pt',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '90 days'),
  download_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.loi_documents ENABLE ROW LEVEL SECURITY;

-- Allow public read access via token (for viewing LOI without auth)
CREATE POLICY "LOI documents are publicly viewable via token"
ON public.loi_documents
FOR SELECT
USING (expires_at > now());

-- Allow insert from edge functions (service role)
CREATE POLICY "Allow insert for authenticated and service role"
ON public.loi_documents
FOR INSERT
WITH CHECK (true);

-- Allow update for tracking downloads
CREATE POLICY "Allow update for download tracking"
ON public.loi_documents
FOR UPDATE
USING (true);

-- Create index for fast token lookups
CREATE INDEX idx_loi_documents_token ON public.loi_documents(token);

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_loi_download(loi_token VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE public.loi_documents
  SET download_count = download_count + 1,
      last_accessed_at = now()
  WHERE token = loi_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;