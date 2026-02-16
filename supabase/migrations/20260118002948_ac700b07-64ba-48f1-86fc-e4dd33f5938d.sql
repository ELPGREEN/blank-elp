-- Storage policies for lead-documents bucket
-- Allow admins to upload files
CREATE POLICY "Admins can upload lead documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'lead-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editor')
  )
);

-- Allow admins to view files
CREATE POLICY "Admins can view lead documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'lead-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editor')
  )
);

-- Allow admins to update files
CREATE POLICY "Admins can update lead documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'lead-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editor')
  )
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete lead documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'lead-documents' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editor')
  )
);

-- Add UPDATE policy for lead_documents table
CREATE POLICY "Admins can update lead documents table" 
ON public.lead_documents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editor')
  )
);