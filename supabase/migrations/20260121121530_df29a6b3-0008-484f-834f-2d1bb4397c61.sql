-- Create email signature settings table
CREATE TABLE public.email_signature_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  sender_name TEXT,
  sender_position TEXT,
  sender_phone TEXT,
  sender_photo_url TEXT,
  company_name TEXT DEFAULT 'ELP Green Technology',
  company_slogan TEXT DEFAULT 'Transforming Waste into Resources',
  company_website TEXT DEFAULT 'www.elpgreen.com',
  company_email TEXT DEFAULT 'info@elpgreen.com',
  company_phone TEXT DEFAULT '+39 350 102 1359',
  company_locations TEXT DEFAULT 'São Paulo, Brazil | Milan, Italy',
  include_social_links BOOLEAN DEFAULT true,
  linkedin_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_signature_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage email signature settings"
ON public.email_signature_settings
FOR ALL
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role IN ('admin', 'editor')
));

CREATE POLICY "Users can view own settings"
ON public.email_signature_settings
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
ON public.email_signature_settings
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
ON public.email_signature_settings
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_email_signature_settings_updated_at
BEFORE UPDATE ON public.email_signature_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();