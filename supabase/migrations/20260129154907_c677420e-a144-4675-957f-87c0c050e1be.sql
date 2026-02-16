-- Drop old constraint that limits document types
ALTER TABLE public.lead_documents DROP CONSTRAINT IF EXISTS lead_documents_document_type_check;

-- Add new constraint with all document types used in the application
ALTER TABLE public.lead_documents ADD CONSTRAINT lead_documents_document_type_check 
CHECK (document_type = ANY (ARRAY[
  'nda'::text, 
  'contract'::text, 
  'proposal'::text, 
  'business_plan'::text, 
  'loi'::text, 
  'kyc'::text,
  'id_document'::text,
  'company_doc'::text,
  'financial'::text,
  'signed_report'::text,
  'other'::text
]));