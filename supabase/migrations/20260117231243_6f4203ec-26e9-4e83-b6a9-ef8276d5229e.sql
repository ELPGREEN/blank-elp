-- Add lead_level column to contacts table for CRM pipeline stages
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS lead_level text DEFAULT 'initial' CHECK (lead_level IN ('initial', 'qualified', 'project'));

-- Add lead_level column to marketplace_registrations table
ALTER TABLE public.marketplace_registrations 
ADD COLUMN IF NOT EXISTS lead_level text DEFAULT 'initial' CHECK (lead_level IN ('initial', 'qualified', 'project'));

-- Add priority column for lead prioritization
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE public.marketplace_registrations 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add assigned_to for lead assignment
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

ALTER TABLE public.marketplace_registrations 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);

-- Add next_action and next_action_date for follow-up tracking
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS next_action text,
ADD COLUMN IF NOT EXISTS next_action_date timestamp with time zone;

ALTER TABLE public.marketplace_registrations 
ADD COLUMN IF NOT EXISTS next_action text,
ADD COLUMN IF NOT EXISTS next_action_date timestamp with time zone;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contacts_lead_level ON public.contacts(lead_level);
CREATE INDEX IF NOT EXISTS idx_contacts_priority ON public.contacts(priority);
CREATE INDEX IF NOT EXISTS idx_marketplace_lead_level ON public.marketplace_registrations(lead_level);
CREATE INDEX IF NOT EXISTS idx_marketplace_priority ON public.marketplace_registrations(priority);

-- Enable realtime for contacts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;