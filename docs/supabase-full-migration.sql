-- =============================================
-- ELP GREEN TECHNOLOGY - COMPLETE DATABASE MIGRATION
-- Execute this SQL in Supabase Dashboard > SQL Editor
-- Project: dlwafedtlvbvuoaopvsl
-- =============================================

-- =============================================
-- PARTE 0: EXTENSÕES NECESSÁRIAS
-- =============================================

-- Habilitar extensão pgcrypto para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PARTE 1: FUNÇÕES BASE E TIPOS
-- =============================================

-- Enum para roles de usuário (usar DROP TYPE IF EXISTS para evitar erro se já existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');
  END IF;
END $$;

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- PARTE 2: TABELAS PRINCIPAIS
-- =============================================

-- Contacts table for form submissions
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  channel TEXT DEFAULT 'general',
  status TEXT DEFAULT 'new',
  lead_level TEXT DEFAULT 'initial' CHECK (lead_level IN ('initial', 'qualified', 'project')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  language TEXT DEFAULT 'pt',
  interests TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Impact stats (counters)
CREATE TABLE IF NOT EXISTS public.impact_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value NUMERIC NOT NULL DEFAULT 0,
  suffix TEXT DEFAULT '',
  label_pt TEXT NOT NULL,
  label_en TEXT NOT NULL,
  label_es TEXT NOT NULL,
  label_zh TEXT NOT NULL,
  label_it TEXT NOT NULL DEFAULT '',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Profiles for admin users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'viewer',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (user_id, role)
);

-- Marketplace registrations
CREATE TABLE IF NOT EXISTS public.marketplace_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT NOT NULL,
  company_type TEXT NOT NULL CHECK (company_type IN ('buyer', 'seller', 'both')),
  products_interest TEXT[] NOT NULL,
  estimated_volume TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'qualified', 'converted')),
  lead_level TEXT DEFAULT 'initial' CHECK (lead_level IN ('initial', 'qualified', 'project')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- YouTube cache
CREATE TABLE IF NOT EXISTS public.youtube_cache (
  id TEXT PRIMARY KEY,
  videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- LOI documents
CREATE TABLE IF NOT EXISTS public.loi_documents (
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

-- Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}'::text[],
  language TEXT DEFAULT 'pt',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Push notifications history
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  topic TEXT DEFAULT 'general',
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Lead notes
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'note',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- OTR conversion goals
CREATE TABLE IF NOT EXISTS public.otr_conversion_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  target_leads INTEGER NOT NULL DEFAULT 10,
  target_conversions INTEGER NOT NULL DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(month, year)
);

-- Notification webhooks
CREATE TABLE IF NOT EXISTS public.notification_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_type TEXT NOT NULL CHECK (webhook_type IN ('slack', 'teams', 'discord')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  events TEXT[] NOT NULL DEFAULT ARRAY['lead_approved', 'lead_converted'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Lead documents
CREATE TABLE IF NOT EXISTS public.lead_documents (
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

-- Admin emails
CREATE TABLE IF NOT EXISTS public.admin_emails (
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

-- Email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
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

-- Document templates
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content_pt TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_es TEXT NOT NULL,
  content_zh TEXT NOT NULL,
  content_it TEXT NOT NULL,
  fields JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generated documents (FIX: signature_type CHECK constraint corrigido)
CREATE TABLE IF NOT EXISTS public.generated_documents (
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
  signature_data JSONB,
  signed_at TIMESTAMP WITH TIME ZONE,
  signer_name TEXT,
  signer_email TEXT,
  signature_type TEXT CHECK (signature_type IS NULL OR signature_type IN ('drawn', 'typed')),
  signature_hash TEXT,
  is_signed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Signature log
CREATE TABLE IF NOT EXISTS public.signature_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.generated_documents(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('drawn', 'typed')),
  signature_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Partner profiles
CREATE TABLE IF NOT EXISTS public.partner_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  lead_type TEXT NOT NULL,
  company_linkedin TEXT,
  company_website TEXT,
  company_registration_number TEXT,
  annual_revenue TEXT,
  employees_count TEXT,
  industry_sector TEXT,
  project_description TEXT,
  investment_capacity TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_review', 'approved', 'rejected')),
  kyc_documents JSONB DEFAULT '[]',
  nda_signed BOOLEAN DEFAULT false,
  nda_signed_at TIMESTAMP WITH TIME ZONE,
  nda_document_url TEXT,
  due_diligence_status TEXT DEFAULT 'not_started' CHECK (due_diligence_status IN ('not_started', 'in_progress', 'completed', 'failed')),
  due_diligence_notes TEXT,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
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

-- Feasibility studies
CREATE TABLE IF NOT EXISTS public.feasibility_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  study_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  country VARCHAR(100),
  plant_type VARCHAR(50) DEFAULT 'otr_recycling',
  daily_capacity_tons DECIMAL(10,2) DEFAULT 50,
  operating_days_per_year INTEGER DEFAULT 300,
  utilization_rate DECIMAL(5,2) DEFAULT 85,
  equipment_cost DECIMAL(15,2) DEFAULT 0,
  installation_cost DECIMAL(15,2) DEFAULT 0,
  infrastructure_cost DECIMAL(15,2) DEFAULT 0,
  working_capital DECIMAL(15,2) DEFAULT 0,
  other_capex DECIMAL(15,2) DEFAULT 0,
  raw_material_cost DECIMAL(15,2) DEFAULT 0,
  labor_cost DECIMAL(15,2) DEFAULT 0,
  energy_cost DECIMAL(15,2) DEFAULT 0,
  maintenance_cost DECIMAL(15,2) DEFAULT 0,
  logistics_cost DECIMAL(15,2) DEFAULT 0,
  administrative_cost DECIMAL(15,2) DEFAULT 0,
  other_opex DECIMAL(15,2) DEFAULT 0,
  rubber_granules_price DECIMAL(10,2) DEFAULT 150,
  rubber_granules_yield DECIMAL(5,2) DEFAULT 65,
  steel_wire_price DECIMAL(10,2) DEFAULT 200,
  steel_wire_yield DECIMAL(5,2) DEFAULT 15,
  textile_fiber_price DECIMAL(10,2) DEFAULT 50,
  textile_fiber_yield DECIMAL(5,2) DEFAULT 5,
  rcb_price NUMERIC DEFAULT 1000,
  rcb_yield NUMERIC DEFAULT 12,
  tax_rate DECIMAL(5,2) DEFAULT 25,
  depreciation_years INTEGER DEFAULT 10,
  discount_rate DECIMAL(5,2) DEFAULT 12,
  inflation_rate DECIMAL(5,2) DEFAULT 3,
  total_investment DECIMAL(15,2) DEFAULT 0,
  annual_revenue DECIMAL(15,2) DEFAULT 0,
  annual_opex DECIMAL(15,2) DEFAULT 0,
  annual_ebitda DECIMAL(15,2) DEFAULT 0,
  payback_months INTEGER DEFAULT 0,
  roi_percentage DECIMAL(8,2) DEFAULT 0,
  npv_10_years DECIMAL(15,2) DEFAULT 0,
  irr_percentage DECIMAL(8,2) DEFAULT 0,
  government_royalties_percent NUMERIC DEFAULT 0,
  environmental_bonus_per_ton NUMERIC DEFAULT 0,
  collection_model TEXT DEFAULT 'direct',
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  lead_id UUID,
  lead_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Articles (Blog)
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_pt TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  title_it TEXT NOT NULL DEFAULT '',
  excerpt_pt TEXT NOT NULL,
  excerpt_en TEXT NOT NULL,
  excerpt_es TEXT NOT NULL,
  excerpt_zh TEXT NOT NULL,
  excerpt_it TEXT NOT NULL DEFAULT '',
  content_pt TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_es TEXT NOT NULL,
  content_zh TEXT NOT NULL,
  content_it TEXT NOT NULL DEFAULT '',
  category TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Press releases
CREATE TABLE IF NOT EXISTS public.press_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_pt TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_es TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  title_it TEXT NOT NULL DEFAULT '',
  content_pt TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_es TEXT NOT NULL,
  content_zh TEXT NOT NULL,
  content_it TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- PARTE 3: ENABLE RLS EM TODAS AS TABELAS
-- =============================================

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loi_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otr_conversion_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feasibility_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_releases ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PARTE 4: FUNÇÕES DE SEGURANÇA
-- =============================================

-- Função para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Função para verificar se existe admin
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  )
$$;

-- Função para atribuir primeiro admin
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_any_admin() THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- Função para criar perfil (FIX: COALESCE para diferentes versões do Supabase)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name',
      ''
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para incrementar download LOI
CREATE OR REPLACE FUNCTION public.increment_loi_download(loi_token VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE public.loi_documents
  SET download_count = download_count + 1,
      last_accessed_at = now()
  WHERE token = loi_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- PARTE 5: TRIGGERS
-- =============================================

-- Drop triggers if exist to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
DROP TRIGGER IF EXISTS update_impact_stats_updated_at ON public.impact_stats;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_marketplace_registrations_updated_at ON public.marketplace_registrations;
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
DROP TRIGGER IF EXISTS update_otr_conversion_goals_updated_at ON public.otr_conversion_goals;
DROP TRIGGER IF EXISTS update_notification_webhooks_updated_at ON public.notification_webhooks;
DROP TRIGGER IF EXISTS update_lead_documents_updated_at ON public.lead_documents;
DROP TRIGGER IF EXISTS update_feasibility_studies_updated_at ON public.feasibility_studies;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_impact_stats_updated_at
  BEFORE UPDATE ON public.impact_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_registrations_updated_at
  BEFORE UPDATE ON public.marketplace_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_otr_conversion_goals_updated_at
  BEFORE UPDATE ON public.otr_conversion_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_webhooks_updated_at
  BEFORE UPDATE ON public.notification_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_documents_updated_at
  BEFORE UPDATE ON public.lead_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feasibility_studies_updated_at
  BEFORE UPDATE ON public.feasibility_studies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PARTE 6: RLS POLICIES
-- =============================================

-- Contacts
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contacts;
DROP POLICY IF EXISTS "Admins can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can delete contacts" ON public.contacts;

CREATE POLICY "Anyone can submit contact form" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view contacts" ON public.contacts FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update contacts" ON public.contacts FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE USING (public.is_admin(auth.uid()));

-- Newsletter
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can view subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can update subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can delete subscribers" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update subscribers" ON public.newsletter_subscribers FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete subscribers" ON public.newsletter_subscribers FOR DELETE USING (public.is_admin(auth.uid()));

-- Impact stats
DROP POLICY IF EXISTS "Anyone can view impact stats" ON public.impact_stats;
DROP POLICY IF EXISTS "Admins can insert impact stats" ON public.impact_stats;
DROP POLICY IF EXISTS "Admins can update impact stats" ON public.impact_stats;
DROP POLICY IF EXISTS "Admins can delete impact stats" ON public.impact_stats;

CREATE POLICY "Anyone can view impact stats" ON public.impact_stats FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert impact stats" ON public.impact_stats FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update impact stats" ON public.impact_stats FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete impact stats" ON public.impact_stats FOR DELETE USING (public.is_admin(auth.uid()));

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.is_admin(auth.uid()) AND user_id != auth.uid());

-- Marketplace registrations
DROP POLICY IF EXISTS "Anyone can register for marketplace" ON public.marketplace_registrations;
DROP POLICY IF EXISTS "Admins can view registrations" ON public.marketplace_registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON public.marketplace_registrations;
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.marketplace_registrations;

CREATE POLICY "Anyone can register for marketplace" ON public.marketplace_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view registrations" ON public.marketplace_registrations FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update registrations" ON public.marketplace_registrations FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete registrations" ON public.marketplace_registrations FOR DELETE USING (public.is_admin(auth.uid()));

-- YouTube cache
DROP POLICY IF EXISTS "Anyone can read YouTube cache" ON public.youtube_cache;
DROP POLICY IF EXISTS "Service role can update YouTube cache" ON public.youtube_cache;

CREATE POLICY "Anyone can read YouTube cache" ON public.youtube_cache FOR SELECT USING (true);
CREATE POLICY "Service role can update YouTube cache" ON public.youtube_cache FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- LOI documents
DROP POLICY IF EXISTS "LOI documents viewable with valid token" ON public.loi_documents;
DROP POLICY IF EXISTS "Admins can view all loi documents" ON public.loi_documents;
DROP POLICY IF EXISTS "Allow insert for loi documents" ON public.loi_documents;
DROP POLICY IF EXISTS "Admins can update loi documents" ON public.loi_documents;

CREATE POLICY "LOI documents viewable with valid token" ON public.loi_documents FOR SELECT USING (expires_at > now() AND token IS NOT NULL AND length(token) > 20);
CREATE POLICY "Admins can view all loi documents" ON public.loi_documents FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Allow insert for loi documents" ON public.loi_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update loi documents" ON public.loi_documents FOR UPDATE USING (public.is_admin(auth.uid()));

-- Push subscriptions
DROP POLICY IF EXISTS "Anyone can subscribe to push notifications" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Admins can view all push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.push_subscriptions;

CREATE POLICY "Anyone can subscribe to push notifications" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own subscriptions" ON public.push_subscriptions FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can update own subscriptions" ON public.push_subscriptions FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users can delete own subscriptions" ON public.push_subscriptions FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Admins can view all push subscriptions" ON public.push_subscriptions FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Service role can manage all subscriptions" ON public.push_subscriptions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Push notifications
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.push_notifications;
DROP POLICY IF EXISTS "Admins can view notifications" ON public.push_notifications;

CREATE POLICY "Admins can insert notifications" ON public.push_notifications FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can view notifications" ON public.push_notifications FOR SELECT USING (public.is_admin(auth.uid()));

-- Lead notes (FIX: schema-qualified user_roles references)
DROP POLICY IF EXISTS "Admins can view all lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Admins can create lead notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Admins can delete lead notes" ON public.lead_notes;

CREATE POLICY "Admins can view all lead notes" ON public.lead_notes FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can create lead notes" ON public.lead_notes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can delete lead notes" ON public.lead_notes FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));

-- Conversion goals and webhooks
DROP POLICY IF EXISTS "Admins can manage conversion goals" ON public.otr_conversion_goals;
DROP POLICY IF EXISTS "Admins can manage notification webhooks" ON public.notification_webhooks;

CREATE POLICY "Admins can manage conversion goals" ON public.otr_conversion_goals FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage notification webhooks" ON public.notification_webhooks FOR ALL USING (public.is_admin(auth.uid()));

-- Lead documents (FIX: schema-qualified user_roles references)
DROP POLICY IF EXISTS "Admins can view lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Admins can insert lead documents" ON public.lead_documents;
DROP POLICY IF EXISTS "Admins can update lead documents table" ON public.lead_documents;
DROP POLICY IF EXISTS "Admins can delete lead documents" ON public.lead_documents;

CREATE POLICY "Admins can view lead documents" ON public.lead_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can insert lead documents" ON public.lead_documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can update lead documents table" ON public.lead_documents FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can delete lead documents" ON public.lead_documents FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));

-- Admin emails (FIX: schema-qualified user_roles references)
DROP POLICY IF EXISTS "Admins can view emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can insert emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can update emails" ON public.admin_emails;

CREATE POLICY "Admins can view emails" ON public.admin_emails FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can insert emails" ON public.admin_emails FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can update emails" ON public.admin_emails FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));

-- Email templates (FIX: schema-qualified user_roles references)
DROP POLICY IF EXISTS "Admins can view templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can insert templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.email_templates;

CREATE POLICY "Admins can view templates" ON public.email_templates FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can insert templates" ON public.email_templates FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update templates" ON public.email_templates FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete templates" ON public.email_templates FOR DELETE USING (public.is_admin(auth.uid()));

-- Document templates (FIX: schema-qualified user_roles references)
DROP POLICY IF EXISTS "Admins and editors can view templates" ON public.document_templates;
DROP POLICY IF EXISTS "Public can view active templates" ON public.document_templates;
DROP POLICY IF EXISTS "Admins and editors can insert templates" ON public.document_templates;
DROP POLICY IF EXISTS "Admins and editors can update templates" ON public.document_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.document_templates;

CREATE POLICY "Admins and editors can view templates" ON public.document_templates FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Public can view active templates" ON public.document_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins and editors can insert templates" ON public.document_templates FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins and editors can update templates" ON public.document_templates FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can delete doc templates" ON public.document_templates FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role = 'admin'));

-- Generated documents (FIX: schema-qualified user_roles references)
DROP POLICY IF EXISTS "Admins can view generated docs" ON public.generated_documents;
DROP POLICY IF EXISTS "Admins can insert generated docs" ON public.generated_documents;
DROP POLICY IF EXISTS "Anyone can update document for signing" ON public.generated_documents;

CREATE POLICY "Admins can view generated docs" ON public.generated_documents FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can insert generated docs" ON public.generated_documents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Anyone can update document for signing" ON public.generated_documents FOR UPDATE USING (true) WITH CHECK (true);

-- Signature log
DROP POLICY IF EXISTS "Authenticated users can view signature logs" ON public.signature_log;
DROP POLICY IF EXISTS "Anyone can insert signature logs" ON public.signature_log;

CREATE POLICY "Authenticated users can view signature logs" ON public.signature_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert signature logs" ON public.signature_log FOR INSERT WITH CHECK (true);

-- Partner profiles (FIX: schema-qualified user_roles references)
DROP POLICY IF EXISTS "Admins can view partner profiles" ON public.partner_profiles;
DROP POLICY IF EXISTS "Admins can manage partner profiles" ON public.partner_profiles;

CREATE POLICY "Admins can view partner profiles" ON public.partner_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can manage partner profiles" ON public.partner_profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));

-- Audit log
DROP POLICY IF EXISTS "Admins can view audit log" ON public.audit_log;
DROP POLICY IF EXISTS "System can insert audit log" ON public.audit_log;

CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert audit log" ON public.audit_log FOR INSERT WITH CHECK (true);

-- Feasibility studies (FIX: schema-qualified user_roles references)
DROP POLICY IF EXISTS "Admins can view all feasibility studies" ON public.feasibility_studies;
DROP POLICY IF EXISTS "Admins can create feasibility studies" ON public.feasibility_studies;
DROP POLICY IF EXISTS "Admins can update feasibility studies" ON public.feasibility_studies;
DROP POLICY IF EXISTS "Admins can delete feasibility studies" ON public.feasibility_studies;

CREATE POLICY "Admins can view all feasibility studies" ON public.feasibility_studies FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can create feasibility studies" ON public.feasibility_studies FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can update feasibility studies" ON public.feasibility_studies FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can delete feasibility studies" ON public.feasibility_studies FOR DELETE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role = 'admin'));

-- Articles
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can manage articles" ON public.articles;

CREATE POLICY "Anyone can view published articles" ON public.articles FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage articles" ON public.articles FOR ALL USING (public.is_admin(auth.uid()));

-- Press releases
DROP POLICY IF EXISTS "Anyone can view published press releases" ON public.press_releases;
DROP POLICY IF EXISTS "Admins can manage press releases" ON public.press_releases;

CREATE POLICY "Anyone can view published press releases" ON public.press_releases FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage press releases" ON public.press_releases FOR ALL USING (public.is_admin(auth.uid()));

-- =============================================
-- PARTE 7: INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_loi_documents_token ON public.loi_documents(token);
CREATE INDEX IF NOT EXISTS idx_lead_notes_contact_id ON public.lead_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_level ON public.contacts(lead_level);
CREATE INDEX IF NOT EXISTS idx_contacts_priority ON public.contacts(priority);
CREATE INDEX IF NOT EXISTS idx_marketplace_lead_level ON public.marketplace_registrations(lead_level);
CREATE INDEX IF NOT EXISTS idx_marketplace_priority ON public.marketplace_registrations(priority);
CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id ON public.lead_documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_type ON public.lead_documents(lead_type);
CREATE INDEX IF NOT EXISTS idx_admin_emails_status ON public.admin_emails(status);
CREATE INDEX IF NOT EXISTS idx_admin_emails_direction ON public.admin_emails(direction);
CREATE INDEX IF NOT EXISTS idx_admin_emails_thread ON public.admin_emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_admin_emails_created ON public.admin_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_docs_lead ON public.generated_documents(lead_id, lead_type);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_lead ON public.partner_profiles(lead_id, lead_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_documents_signed ON public.generated_documents(is_signed) WHERE is_signed = true;

-- =============================================
-- PARTE 8: REALTIME (com verificação condicional)
-- =============================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Remover tabelas se já existirem na publicação para evitar erro
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.marketplace_registrations';
    EXCEPTION WHEN OTHERS THEN
      -- Ignorar erro se tabela não estiver na publicação
    END;
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.contacts';
    EXCEPTION WHEN OTHERS THEN
      -- Ignorar erro se tabela não estiver na publicação
    END;
    
    -- Adicionar tabelas à publicação
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_registrations';
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts';
  END IF;
END $$;

-- =============================================
-- PARTE 9: STORAGE BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lead-documents',
  'lead-documents',
  false,
  52428800,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Admins can upload lead documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view lead documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update lead documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete lead documents" ON storage.objects;

CREATE POLICY "Admins can upload lead documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lead-documents' AND EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can view lead documents" ON storage.objects FOR SELECT USING (bucket_id = 'lead-documents' AND EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can update lead documents" ON storage.objects FOR UPDATE USING (bucket_id = 'lead-documents' AND EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));
CREATE POLICY "Admins can delete lead documents" ON storage.objects FOR DELETE USING (bucket_id = 'lead-documents' AND EXISTS (SELECT 1 FROM public.user_roles WHERE public.user_roles.user_id = auth.uid() AND public.user_roles.role IN ('admin', 'editor')));

-- =============================================
-- PARTE 10: DADOS INICIAIS
-- =============================================

-- Impact stats
INSERT INTO public.impact_stats (key, value, suffix, label_pt, label_en, label_es, label_zh, label_it, display_order) VALUES
  ('co2_avoided', 125000, 't', 'CO₂ Evitado', 'CO₂ Avoided', 'CO₂ Evitado', 'CO₂减排', 'CO₂ Evitata', 1),
  ('waste_processed', 450000, 't', 'Resíduos Processados', 'Waste Processed', 'Residuos Procesados', '废物处理', 'Rifiuti Trattati', 2),
  ('global_plants', 12, '', 'Plantas Globais', 'Global Plants', 'Plantas Globales', '全球工厂', 'Impianti Globali', 3),
  ('countries', 8, '', 'Países', 'Countries', 'Países', '国家', 'Paesi', 4)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- FIM DA MIGRAÇÃO
-- =============================================
