-- =============================================
-- EMAIL INBOX SYSTEM
-- =============================================

-- Table to store received/sent emails for inbox functionality
CREATE TABLE public.admin_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  tags TEXT[] DEFAULT '{}',
  thread_id UUID,
  parent_email_id UUID REFERENCES public.admin_emails(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE
);

-- Email templates for quick responses
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject_pt TEXT NOT NULL,
  subject_en TEXT NOT NULL,
  subject_es TEXT NOT NULL,
  subject_zh TEXT NOT NULL,
  subject_it TEXT NOT NULL,
  body_pt TEXT NOT NULL,
  body_en TEXT NOT NULL,
  body_es TEXT NOT NULL,
  body_zh TEXT NOT NULL,
  body_it TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- DOCUMENT TEMPLATES SYSTEM
-- =============================================

-- Document templates for automated generation
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('nda', 'contract', 'report', 'proposal', 'loi', 'mou')),
  content_pt TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_es TEXT NOT NULL,
  content_zh TEXT NOT NULL,
  content_it TEXT NOT NULL,
  fields JSONB DEFAULT '[]', -- Dynamic fields like {{company_name}}, {{date}}
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated documents history
CREATE TABLE public.generated_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.document_templates(id),
  lead_id UUID,
  lead_type TEXT,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT,
  field_values JSONB DEFAULT '{}',
  language TEXT DEFAULT 'pt',
  generated_by UUID,
  sent_to_email TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- PARTNER REGISTRATION LEVELS (1, 2, 3)
-- =============================================

-- Extended partner information for level 2/3
CREATE TABLE public.partner_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  lead_type TEXT NOT NULL,
  
  -- Level 2 fields
  company_linkedin TEXT,
  company_website TEXT,
  company_registration_number TEXT,
  annual_revenue TEXT,
  employees_count TEXT,
  industry_sector TEXT,
  project_description TEXT,
  investment_capacity TEXT,
  
  -- Level 3 fields (KYC)
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_review', 'approved', 'rejected')),
  kyc_documents JSONB DEFAULT '[]',
  nda_signed BOOLEAN DEFAULT false,
  nda_signed_at TIMESTAMP WITH TIME ZONE,
  nda_document_url TEXT,
  due_diligence_status TEXT DEFAULT 'not_started' CHECK (due_diligence_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  due_diligence_notes TEXT,
  
  -- Verification
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- AUDIT LOG
-- =============================================

CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- ENABLE RLS
-- =============================================

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Admin emails - only admins/editors can access
CREATE POLICY "Admins can view emails" ON public.admin_emails
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins can insert emails" ON public.admin_emails
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins can update emails" ON public.admin_emails
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  ));

-- Email templates - admins can manage
CREATE POLICY "Admins can view templates" ON public.email_templates
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins can insert templates" ON public.email_templates
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update templates" ON public.email_templates
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete templates" ON public.email_templates
  FOR DELETE USING (is_admin(auth.uid()));

-- Document templates
CREATE POLICY "Admins can view doc templates" ON public.document_templates
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins can manage doc templates" ON public.document_templates
  FOR ALL USING (is_admin(auth.uid()));

-- Generated documents
CREATE POLICY "Admins can view generated docs" ON public.generated_documents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins can insert generated docs" ON public.generated_documents
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  ));

-- Partner profiles
CREATE POLICY "Admins can view partner profiles" ON public.partner_profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins can manage partner profiles" ON public.partner_profiles
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  ));

-- Audit log - only admins can view
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert audit log" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_admin_emails_status ON public.admin_emails(status);
CREATE INDEX idx_admin_emails_direction ON public.admin_emails(direction);
CREATE INDEX idx_admin_emails_thread ON public.admin_emails(thread_id);
CREATE INDEX idx_admin_emails_created ON public.admin_emails(created_at DESC);
CREATE INDEX idx_generated_docs_lead ON public.generated_documents(lead_id, lead_type);
CREATE INDEX idx_partner_profiles_lead ON public.partner_profiles(lead_id, lead_type);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);

-- =============================================
-- SEED EMAIL TEMPLATES
-- =============================================

INSERT INTO public.email_templates (name, subject_pt, subject_en, subject_es, subject_zh, subject_it, body_pt, body_en, body_es, body_zh, body_it, category) VALUES
('Boas-vindas Parceiro', 
 'Bem-vindo à ELP Green Technology',
 'Welcome to ELP Green Technology',
 'Bienvenido a ELP Green Technology',
 '欢迎来到ELP绿色科技',
 'Benvenuto in ELP Green Technology',
 'Prezado(a) {{name}},\n\nObrigado por seu interesse em nossa empresa. Ficamos muito felizes em recebê-lo(a) como potencial parceiro.\n\nNossa equipe entrará em contato em breve para discutir as oportunidades de colaboração.\n\nAtenciosamente,\nEquipe ELP Green Technology',
 'Dear {{name}},\n\nThank you for your interest in our company. We are very pleased to welcome you as a potential partner.\n\nOur team will contact you soon to discuss collaboration opportunities.\n\nBest regards,\nELP Green Technology Team',
 'Estimado(a) {{name}},\n\nGracias por su interés en nuestra empresa. Estamos muy contentos de recibirlo(a) como potencial socio.\n\nNuestro equipo se pondrá en contacto pronto para discutir las oportunidades de colaboración.\n\nAtentamente,\nEquipo ELP Green Technology',
 '亲爱的 {{name}}，\n\n感谢您对我们公司的关注。我们非常高兴欢迎您成为潜在合作伙伴。\n\n我们的团队将很快与您联系，讨论合作机会。\n\n此致敬礼，\nELP绿色科技团队',
 'Gentile {{name}},\n\nGrazie per il Suo interesse nella nostra azienda. Siamo molto lieti di accoglierLa come potenziale partner.\n\nIl nostro team La contatterà presto per discutere le opportunità di collaborazione.\n\nCordiali saluti,\nTeam ELP Green Technology',
 'welcome'),

('Atualização Projeto Pirólise',
 'Atualização sobre Projeto de Pirólise',
 'Pyrolysis Project Update',
 'Actualización del Proyecto de Pirólisis',
 '热解项目更新',
 'Aggiornamento Progetto Pirolisi',
 'Prezado(a) {{name}},\n\nGostaríamos de compartilhar as últimas atualizações sobre o projeto de pirólise:\n\n{{project_details}}\n\nPróximos passos:\n{{next_steps}}\n\nEstamos à disposição para qualquer esclarecimento.\n\nAtenciosamente,\nEquipe ELP Green Technology',
 'Dear {{name}},\n\nWe would like to share the latest updates on the pyrolysis project:\n\n{{project_details}}\n\nNext steps:\n{{next_steps}}\n\nWe are available for any clarification.\n\nBest regards,\nELP Green Technology Team',
 'Estimado(a) {{name}},\n\nNos gustaría compartir las últimas actualizaciones sobre el proyecto de pirólisis:\n\n{{project_details}}\n\nPróximos pasos:\n{{next_steps}}\n\nEstamos a su disposición para cualquier aclaración.\n\nAtentamente,\nEquipo ELP Green Technology',
 '亲爱的 {{name}}，\n\n我们想分享热解项目的最新进展：\n\n{{project_details}}\n\n后续步骤：\n{{next_steps}}\n\n如有任何疑问，请随时联系我们。\n\n此致敬礼，\nELP绿色科技团队',
 'Gentile {{name}},\n\nVorremmo condividere gli ultimi aggiornamenti sul progetto di pirolisi:\n\n{{project_details}}\n\nProssimi passi:\n{{next_steps}}\n\nSiamo a disposizione per qualsiasi chiarimento.\n\nCordiali saluti,\nTeam ELP Green Technology',
 'project'),

('Solicitação de Documentos KYC',
 'Documentação Necessária - KYC',
 'Required Documentation - KYC',
 'Documentación Requerida - KYC',
 '所需文件 - KYC',
 'Documentazione Richiesta - KYC',
 'Prezado(a) {{name}},\n\nPara dar continuidade ao processo de parceria, solicitamos gentilmente os seguintes documentos:\n\n1. Contrato social ou estatuto da empresa\n2. Documentos dos sócios/diretores\n3. Comprovante de endereço da empresa\n4. Declaração de origem de fundos\n\nPor favor, envie os documentos digitalizados através do nosso portal seguro.\n\nAtenciosamente,\nEquipe ELP Green Technology',
 'Dear {{name}},\n\nTo continue with the partnership process, we kindly request the following documents:\n\n1. Articles of incorporation or company bylaws\n2. Directors/partners identification documents\n3. Company address verification\n4. Declaration of source of funds\n\nPlease submit the scanned documents through our secure portal.\n\nBest regards,\nELP Green Technology Team',
 'Estimado(a) {{name}},\n\nPara continuar con el proceso de asociación, solicitamos amablemente los siguientes documentos:\n\n1. Acta constitutiva o estatutos de la empresa\n2. Documentos de los socios/directores\n3. Comprobante de domicilio de la empresa\n4. Declaración de origen de fondos\n\nPor favor, envíe los documentos escaneados a través de nuestro portal seguro.\n\nAtentamente,\nEquipo ELP Green Technology',
 '亲爱的 {{name}}，\n\n为了继续合作流程，我们恳请提供以下文件：\n\n1. 公司章程或注册证明\n2. 董事/股东身份证明\n3. 公司地址证明\n4. 资金来源声明\n\n请通过我们的安全门户提交扫描文件。\n\n此致敬礼，\nELP绿色科技团队',
 'Gentile {{name}},\n\nPer proseguire con il processo di partnership, Le chiediamo gentilmente i seguenti documenti:\n\n1. Atto costitutivo o statuto aziendale\n2. Documenti dei soci/amministratori\n3. Verifica dell indirizzo aziendale\n4. Dichiarazione di provenienza dei fondi\n\nLa preghiamo di inviare i documenti scansionati attraverso il nostro portale sicuro.\n\nCordiali saluti,\nTeam ELP Green Technology',
 'kyc');

-- =============================================
-- SEED DOCUMENT TEMPLATES
-- =============================================

INSERT INTO public.document_templates (name, type, content_pt, content_en, content_es, content_zh, content_it, fields) VALUES
('NDA Padrão',
 'nda',
 'ACORDO DE CONFIDENCIALIDADE\n\nEntre ELP Alliance S/A e {{company_name}}\nData: {{date}}\n\nAs partes concordam em manter sigilo sobre todas as informações trocadas...',
 'NON-DISCLOSURE AGREEMENT\n\nBetween ELP Alliance S/A and {{company_name}}\nDate: {{date}}\n\nThe parties agree to maintain confidentiality regarding all information exchanged...',
 'ACUERDO DE CONFIDENCIALIDAD\n\nEntre ELP Alliance S/A y {{company_name}}\nFecha: {{date}}\n\nLas partes acuerdan mantener la confidencialidad sobre toda la información intercambiada...',
 '保密协议\n\n在ELP Alliance S/A与{{company_name}}之间\n日期：{{date}}\n\n双方同意对所有交换的信息保密...',
 'ACCORDO DI RISERVATEZZA\n\nTra ELP Alliance S/A e {{company_name}}\nData: {{date}}\n\nLe parti concordano di mantenere la riservatezza su tutte le informazioni scambiate...',
 '[{"name": "company_name", "label": "Nome da Empresa", "type": "text", "required": true}, {"name": "date", "label": "Data", "type": "date", "required": true}, {"name": "contact_name", "label": "Nome do Contato", "type": "text", "required": true}]'),

('Relatório de Sustentabilidade',
 'report',
 'RELATÓRIO DE IMPACTO AMBIENTAL\n\nEmpresa: {{company_name}}\nPeríodo: {{period}}\n\nMétricas ESG:\n- CO2 evitado: {{co2_avoided}} toneladas\n- Pneus reciclados: {{tires_recycled}} unidades\n- Materiais recuperados: {{materials_recovered}} kg',
 'ENVIRONMENTAL IMPACT REPORT\n\nCompany: {{company_name}}\nPeriod: {{period}}\n\nESG Metrics:\n- CO2 avoided: {{co2_avoided}} tons\n- Tires recycled: {{tires_recycled}} units\n- Materials recovered: {{materials_recovered}} kg',
 'INFORME DE IMPACTO AMBIENTAL\n\nEmpresa: {{company_name}}\nPeríodo: {{period}}\n\nMétricas ESG:\n- CO2 evitado: {{co2_avoided}} toneladas\n- Neumáticos reciclados: {{tires_recycled}} unidades\n- Materiales recuperados: {{materials_recovered}} kg',
 '环境影响报告\n\n公司：{{company_name}}\n期间：{{period}}\n\nESG指标：\n- 避免CO2排放：{{co2_avoided}}吨\n- 回收轮胎：{{tires_recycled}}个\n- 回收材料：{{materials_recovered}}公斤',
 'RAPPORTO DI IMPATTO AMBIENTALE\n\nAzienda: {{company_name}}\nPeriodo: {{period}}\n\nMetriche ESG:\n- CO2 evitata: {{co2_avoided}} tonnellate\n- Pneumatici riciclati: {{tires_recycled}} unità\n- Materiali recuperati: {{materials_recovered}} kg',
 '[{"name": "company_name", "label": "Nome da Empresa", "type": "text"}, {"name": "period", "label": "Período", "type": "text"}, {"name": "co2_avoided", "label": "CO2 Evitado (ton)", "type": "number"}, {"name": "tires_recycled", "label": "Pneus Reciclados", "type": "number"}, {"name": "materials_recovered", "label": "Materiais Recuperados (kg)", "type": "number"}]');

-- Add lead location fields for global map
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE public.marketplace_registrations ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.marketplace_registrations ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);