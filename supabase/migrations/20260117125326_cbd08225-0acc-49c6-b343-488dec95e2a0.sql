-- Create table for OTR lead notes/history
CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  note_type TEXT DEFAULT 'note', -- 'note', 'status_change', 'email_sent', 'call', 'meeting'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Policies for admin access
CREATE POLICY "Admins can view all lead notes"
ON public.lead_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can create lead notes"
ON public.lead_notes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can delete lead notes"
ON public.lead_notes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'editor')
  )
);

-- Create index for faster lookups
CREATE INDEX idx_lead_notes_contact_id ON public.lead_notes(contact_id);
CREATE INDEX idx_lead_notes_created_at ON public.lead_notes(created_at DESC);