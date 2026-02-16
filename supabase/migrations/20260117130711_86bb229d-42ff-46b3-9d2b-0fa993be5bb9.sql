-- Create table for conversion goals
CREATE TABLE public.otr_conversion_goals (
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

-- Create table for webhook configurations (Slack/Teams)
CREATE TABLE public.notification_webhooks (
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

-- Enable RLS
ALTER TABLE public.otr_conversion_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_webhooks ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for conversion goals
CREATE POLICY "Admins can manage conversion goals"
ON public.otr_conversion_goals
FOR ALL
USING (public.is_admin(auth.uid()));

-- Admin-only policies for notification webhooks
CREATE POLICY "Admins can manage notification webhooks"
ON public.notification_webhooks
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at on goals
CREATE TRIGGER update_otr_conversion_goals_updated_at
BEFORE UPDATE ON public.otr_conversion_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on webhooks
CREATE TRIGGER update_notification_webhooks_updated_at
BEFORE UPDATE ON public.notification_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();