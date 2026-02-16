-- Create lead_documents table for storing NDA, contracts, proposals
CREATE TABLE public.lead_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('contact', 'marketplace')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  document_type TEXT NOT NULL CHECK (document_type IN ('nda', 'contract', 'proposal', 'business_plan', 'loi', 'other')),
  notes TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lead_documents
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated admins can view lead documents
CREATE POLICY "Admins can view lead documents" 
ON public.lead_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- Policy: Only authenticated admins can insert lead documents
CREATE POLICY "Admins can insert lead documents" 
ON public.lead_documents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- Policy: Only authenticated admins can delete lead documents
CREATE POLICY "Admins can delete lead documents" 
ON public.lead_documents 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- Create storage bucket for lead documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lead-documents',
  'lead-documents',
  false,
  52428800, -- 50MB max
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
);

-- Storage policies for lead documents
CREATE POLICY "Admins can view lead document files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lead-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can upload lead document files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lead-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can delete lead document files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lead-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'editor')
  )
);

-- Create index for faster document lookup
CREATE INDEX idx_lead_documents_lead_id ON public.lead_documents(lead_id);
CREATE INDEX idx_lead_documents_lead_type ON public.lead_documents(lead_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_lead_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lead_documents_updated_at
BEFORE UPDATE ON public.lead_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_lead_documents_updated_at();