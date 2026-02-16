-- Add Italian label column to impact_stats table
ALTER TABLE public.impact_stats 
ADD COLUMN label_it TEXT NOT NULL DEFAULT '';

-- Update existing rows with Italian translations (copying from English as base)
UPDATE public.impact_stats SET label_it = label_en;