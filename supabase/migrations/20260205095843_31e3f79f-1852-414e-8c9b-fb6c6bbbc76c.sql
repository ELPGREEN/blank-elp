-- Update all pending documents without email to use info@elpgreen.com
UPDATE generated_documents 
SET 
  pending_signer_email = 'info@elpgreen.com',
  signer_email = 'info@elpgreen.com'
WHERE signature_status IN ('pending', 'waiting_signature', 'partially_signed')
AND (pending_signer_email IS NULL OR pending_signer_email = '')