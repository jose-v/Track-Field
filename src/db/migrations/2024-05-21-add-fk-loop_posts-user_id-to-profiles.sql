-- Migration: Add foreign key from loop_posts.user_id to profiles.id for Supabase joins

-- Drop existing constraint if it exists (may reference auth.users)
ALTER TABLE loop_posts DROP CONSTRAINT IF EXISTS loop_posts_user_id_fkey;

-- Add new foreign key to profiles
ALTER TABLE loop_posts
  ADD CONSTRAINT loop_posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; 