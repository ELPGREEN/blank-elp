-- Create table for push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  topics text[] DEFAULT '{}'::text[],
  language text DEFAULT 'pt',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (including anonymous users)
CREATE POLICY "Anyone can subscribe to push notifications"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (user_id = auth.uid() OR user_id IS NULL);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can send to all (needed for edge function)
CREATE POLICY "Service role can manage all subscriptions"
ON public.push_subscriptions
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create table for notification history
CREATE TABLE public.push_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  url text,
  topic text DEFAULT 'general',
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  sent_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notifications
CREATE POLICY "Admins can insert notifications"
ON public.push_notifications
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can view notifications"
ON public.push_notifications
FOR SELECT
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();