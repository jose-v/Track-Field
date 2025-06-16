-- Migration script to clean up base64 avatar data
-- This identifies profiles with base64 avatar_url data and sets them to NULL
-- so they can be properly re-uploaded to storage

-- First, let's see what we're dealing with
SELECT 
  id,
  email,
  first_name,
  last_name,
  CASE 
    WHEN avatar_url IS NULL THEN 'NULL'
    WHEN avatar_url LIKE 'data:image/%' THEN 'BASE64 (' || LENGTH(avatar_url) || ' chars)'
    WHEN avatar_url LIKE 'http%' THEN 'URL'
    ELSE 'OTHER'
  END as avatar_type,
  LENGTH(avatar_url) as avatar_size
FROM profiles
WHERE avatar_url IS NOT NULL
ORDER BY LENGTH(avatar_url) DESC;

-- Update base64 avatars to NULL so users can re-upload properly
-- We're setting them to NULL rather than trying to convert because:
-- 1. Converting base64 to storage requires file operations not available in SQL
-- 2. Users should re-upload for better quality control
-- 3. This immediately fixes the performance issue

UPDATE profiles 
SET 
  avatar_url = NULL,
  updated_at = NOW()
WHERE avatar_url LIKE 'data:image/%';

-- Show summary of changes
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN avatar_url IS NULL THEN 1 END) as null_avatars,
  COUNT(CASE WHEN avatar_url LIKE 'http%' THEN 1 END) as url_avatars,
  COUNT(CASE WHEN avatar_url LIKE 'data:image/%' THEN 1 END) as remaining_base64
FROM profiles;

-- Log the migration
INSERT INTO public.migration_log (
  migration_name,
  description,
  executed_at
) VALUES (
  'migrate_base64_avatars',
  'Converted base64 avatar_url data to NULL to fix performance issues',
  NOW()
) ON CONFLICT DO NOTHING;

-- Create migration_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_log (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 