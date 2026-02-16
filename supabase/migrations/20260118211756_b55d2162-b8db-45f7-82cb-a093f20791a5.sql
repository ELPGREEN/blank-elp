-- Add rCB (Recovered Carbon Black) fields to feasibility_studies table
ALTER TABLE public.feasibility_studies 
ADD COLUMN IF NOT EXISTS rcb_price numeric DEFAULT 1000,
ADD COLUMN IF NOT EXISTS rcb_yield numeric DEFAULT 12;

-- Add comment explaining the fields
COMMENT ON COLUMN public.feasibility_studies.rcb_price IS 'Recovered Carbon Black price in USD per ton - Jan 2026 market: $800-1200/ton';
COMMENT ON COLUMN public.feasibility_studies.rcb_yield IS 'Recovered Carbon Black yield percentage from OTR tires - typically 10-15% of rubber content';