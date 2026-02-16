-- Create contacts table for form submissions
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  channel TEXT DEFAULT 'general', -- partnership, investor, compliance, general
  status TEXT DEFAULT 'new', -- new, read, replied, archived
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  language TEXT DEFAULT 'pt',
  interests TEXT[] DEFAULT '{}', -- circular_economy, technology, investments, esg
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Create impact stats table for CMS (counters)
CREATE TABLE public.impact_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE, -- co2_avoided, waste_processed, global_plants, countries
  value NUMERIC NOT NULL DEFAULT 0,
  suffix TEXT DEFAULT '', -- t, +, %, etc.
  label_pt TEXT NOT NULL,
  label_en TEXT NOT NULL,
  label_es TEXT NOT NULL,
  label_zh TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'viewer', -- admin, editor, viewer
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Contacts policies (public can insert, only authenticated admins can read)
CREATE POLICY "Anyone can submit contact form"
ON public.contacts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (true);

-- Newsletter policies (public can insert, authenticated can manage)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can view subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update subscribers"
ON public.newsletter_subscribers
FOR UPDATE
TO authenticated
USING (true);

-- Impact stats policies (public can read, authenticated can manage)
CREATE POLICY "Anyone can view impact stats"
ON public.impact_stats
FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can manage impact stats"
ON public.impact_stats
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_impact_stats_updated_at
  BEFORE UPDATE ON public.impact_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default impact stats
INSERT INTO public.impact_stats (key, value, suffix, label_pt, label_en, label_es, label_zh, display_order) VALUES
  ('co2_avoided', 125000, 't', 'CO₂ Evitado', 'CO₂ Avoided', 'CO₂ Evitado', 'CO₂减排', 1),
  ('waste_processed', 450000, 't', 'Resíduos Processados', 'Waste Processed', 'Residuos Procesados', '废物处理', 2),
  ('global_plants', 12, '', 'Plantas Globais', 'Global Plants', 'Plantas Globales', '全球工厂', 3),
  ('countries', 8, '', 'Países', 'Countries', 'Países', '国家', 4);