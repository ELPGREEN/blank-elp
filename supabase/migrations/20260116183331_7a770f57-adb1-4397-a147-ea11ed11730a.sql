-- Create marketplace_registrations table for B2B pre-registration
CREATE TABLE public.marketplace_registrations (
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.marketplace_registrations ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting registrations (anyone can register)
CREATE POLICY "Anyone can register for marketplace" 
ON public.marketplace_registrations 
FOR INSERT 
WITH CHECK (true);

-- Create policy for admins to view all registrations
CREATE POLICY "Authenticated users can view registrations" 
ON public.marketplace_registrations 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_marketplace_registrations_updated_at
BEFORE UPDATE ON public.marketplace_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();