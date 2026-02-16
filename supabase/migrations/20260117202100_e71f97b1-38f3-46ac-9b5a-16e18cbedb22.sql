-- Add Italian columns to articles table
ALTER TABLE public.articles 
ADD COLUMN title_it TEXT NOT NULL DEFAULT '',
ADD COLUMN excerpt_it TEXT NOT NULL DEFAULT '',
ADD COLUMN content_it TEXT NOT NULL DEFAULT '';

-- Copy English content as base for Italian
UPDATE public.articles SET 
  title_it = title_en,
  excerpt_it = excerpt_en,
  content_it = content_en;

-- Add Italian columns to press_releases table
ALTER TABLE public.press_releases 
ADD COLUMN title_it TEXT NOT NULL DEFAULT '',
ADD COLUMN content_it TEXT NOT NULL DEFAULT '';

-- Copy English content as base for Italian
UPDATE public.press_releases SET 
  title_it = title_en,
  content_it = content_en;