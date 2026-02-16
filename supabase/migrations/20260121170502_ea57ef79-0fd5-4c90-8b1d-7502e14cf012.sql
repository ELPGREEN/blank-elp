-- Create meetings table for meeting management
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'commercial', -- commercial, technical, follow_up, negotiation
  plant_type TEXT, -- otr_recycling, pyrolysis, tire_recycling, msw
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  
  -- Participants
  lead_id UUID,
  lead_type TEXT, -- contact, marketplace
  participants JSONB DEFAULT '[]'::jsonb, -- [{name, email, role, company}]
  
  -- Documents
  agenda_content TEXT,
  agenda_generated_at TIMESTAMP WITH TIME ZONE,
  summary_content TEXT,
  summary_generated_at TIMESTAMP WITH TIME ZONE,
  convocation_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- AI suggestions
  ai_suggested_topics JSONB DEFAULT '[]'::jsonb,
  ai_context_summary TEXT,
  attached_documents JSONB DEFAULT '[]'::jsonb, -- [{document_id, document_name, summary}]
  
  -- Status
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  notes TEXT,
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Policies for admin/editor access
CREATE POLICY "Admins can view all meetings"
  ON public.meetings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins can insert meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins can update meetings"
  ON public.meetings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'editor')
  ));

CREATE POLICY "Admins can delete meetings"
  ON public.meetings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  ));

-- Trigger for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_meetings_plant_type ON public.meetings(plant_type);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);
CREATE INDEX idx_meetings_lead_id ON public.meetings(lead_id);