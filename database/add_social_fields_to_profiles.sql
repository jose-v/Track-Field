-- Add social media and personal website fields to profiles table
-- This migration adds optional social media links for team manager profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.profiles.twitter_url IS 'Twitter profile URL';
COMMENT ON COLUMN public.profiles.website_url IS 'Personal website URL';

-- Add constraints to ensure URLs are properly formatted (optional)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_linkedin_url_format 
  CHECK (linkedin_url IS NULL OR linkedin_url ~ '^https?://.*'),
ADD CONSTRAINT profiles_twitter_url_format 
  CHECK (twitter_url IS NULL OR twitter_url ~ '^https?://.*'),
ADD CONSTRAINT profiles_website_url_format 
  CHECK (website_url IS NULL OR website_url ~ '^https?://.*'); 