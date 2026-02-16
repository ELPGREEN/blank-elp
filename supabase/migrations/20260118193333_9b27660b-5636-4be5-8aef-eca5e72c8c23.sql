-- Add fields for government partnership model (royalties and environmental bonus)
ALTER TABLE public.feasibility_studies 
ADD COLUMN IF NOT EXISTS government_royalties_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS environmental_bonus_per_ton numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS collection_model text DEFAULT 'direct';