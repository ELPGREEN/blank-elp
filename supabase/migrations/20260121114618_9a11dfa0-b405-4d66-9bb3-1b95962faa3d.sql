-- ==========================================
-- REFORÇO DE SEGURANÇA DAS POLÍTICAS RLS
-- ==========================================

-- 1. GENERATED_DOCUMENTS: Remover política duplicada muito permissiva
DROP POLICY IF EXISTS "Anyone can update document for signing" ON generated_documents;

-- 2. GENERATED_DOCUMENTS: Melhorar política de assinatura
DROP POLICY IF EXISTS "Allow signature updates only" ON generated_documents;

CREATE POLICY "Allow signature updates with valid data"
ON generated_documents
FOR UPDATE
TO public
USING (is_signed = false OR is_signed IS NULL)
WITH CHECK (
  is_signed = true 
  AND signature_hash IS NOT NULL 
  AND LENGTH(signature_hash) >= 32
  AND signer_email IS NOT NULL
  AND signer_name IS NOT NULL
);

-- 3. SIGNATURE_LOG: Melhorar validação de inserção
DROP POLICY IF EXISTS "Authenticated users can insert signature" ON signature_log;

CREATE POLICY "Insert signature with valid data"
ON signature_log
FOR INSERT
TO public
WITH CHECK (
  document_id IS NOT NULL
  AND signer_email IS NOT NULL
  AND signer_name IS NOT NULL
  AND signature_type IS NOT NULL
  AND signature_hash IS NOT NULL
  AND LENGTH(signature_hash) >= 32
);

-- 4. SIGNATURE_LOG: Restringir leitura apenas para admins/editores
DROP POLICY IF EXISTS "Authenticated users can view signature logs" ON signature_log;

CREATE POLICY "Admins can view signature logs"
ON signature_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editor')
  )
);

-- Permitir que o próprio assinante veja seu log
CREATE POLICY "Signers can view own logs"
ON signature_log
FOR SELECT
TO public
USING (signer_email = current_setting('request.jwt.claims', true)::json->>'email');

-- 5. CONTACTS: Adicionar rate limiting básico via validação
DROP POLICY IF EXISTS "Anyone can submit contact form" ON contacts;

CREATE POLICY "Anyone can submit contact form with valid data"
ON contacts
FOR INSERT
TO public
WITH CHECK (
  name IS NOT NULL 
  AND LENGTH(name) >= 2
  AND email IS NOT NULL 
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND message IS NOT NULL 
  AND LENGTH(message) >= 10
);

-- 6. NEWSLETTER_SUBSCRIBERS: Validar email
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;

CREATE POLICY "Anyone can subscribe with valid email"
ON newsletter_subscribers
FOR INSERT
TO public
WITH CHECK (
  email IS NOT NULL 
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- 7. MARKETPLACE_REGISTRATIONS: Validar dados obrigatórios
DROP POLICY IF EXISTS "Anyone can register for marketplace" ON marketplace_registrations;

CREATE POLICY "Anyone can register with valid data"
ON marketplace_registrations
FOR INSERT
TO public
WITH CHECK (
  company_name IS NOT NULL 
  AND LENGTH(company_name) >= 2
  AND contact_name IS NOT NULL 
  AND LENGTH(contact_name) >= 2
  AND email IS NOT NULL 
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND country IS NOT NULL
  AND company_type IS NOT NULL
);

-- 8. LOI_DOCUMENTS: Validar dados de LOI
DROP POLICY IF EXISTS "Allow insert for loi documents" ON loi_documents;

CREATE POLICY "Allow LOI insert with valid data"
ON loi_documents
FOR INSERT
TO public
WITH CHECK (
  company_name IS NOT NULL
  AND contact_name IS NOT NULL
  AND email IS NOT NULL 
  AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND country IS NOT NULL
  AND company_type IS NOT NULL
  AND token IS NOT NULL
  AND LENGTH(token) >= 20
);

-- 9. PUSH_SUBSCRIPTIONS: Validar dados da subscription
DROP POLICY IF EXISTS "Anyone can subscribe to push notifications" ON push_subscriptions;

CREATE POLICY "Anyone can subscribe with valid push data"
ON push_subscriptions
FOR INSERT
TO public
WITH CHECK (
  endpoint IS NOT NULL 
  AND LENGTH(endpoint) >= 10
  AND auth IS NOT NULL
  AND p256dh IS NOT NULL
)