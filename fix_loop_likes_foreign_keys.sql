-- Fix foreign key constraints for loop tables
-- This addresses 406 errors by ensuring proper FK relationships

-- First, check current foreign key constraints on loop_likes
SELECT 'CURRENT FOREIGN KEYS ON LOOP_LIKES' as info;
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'loop_likes'
    AND tc.constraint_type = 'FOREIGN KEY';

-- Drop existing foreign key constraints on loop_likes
ALTER TABLE loop_likes DROP CONSTRAINT IF EXISTS loop_likes_user_id_fkey;
ALTER TABLE loop_likes DROP CONSTRAINT IF EXISTS loop_likes_post_id_fkey;

-- Recreate foreign keys to reference the correct tables
-- user_id should reference profiles(id), not auth.users(id)
ALTER TABLE loop_likes
  ADD CONSTRAINT loop_likes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- post_id should reference loop_posts(id)
ALTER TABLE loop_likes
  ADD CONSTRAINT loop_likes_post_id_fkey
  FOREIGN KEY (post_id) REFERENCES loop_posts(id) ON DELETE CASCADE;

-- Also fix loop_comments if needed
ALTER TABLE loop_comments DROP CONSTRAINT IF EXISTS loop_comments_user_id_fkey;
ALTER TABLE loop_comments
  ADD CONSTRAINT loop_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- And loop_bookmarks
ALTER TABLE loop_bookmarks DROP CONSTRAINT IF EXISTS loop_bookmarks_user_id_fkey;
ALTER TABLE loop_bookmarks
  ADD CONSTRAINT loop_bookmarks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Check that the constraints were created successfully
SELECT 'UPDATED FOREIGN KEYS ON LOOP_LIKES' as info;
SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'loop_likes'
    AND tc.constraint_type = 'FOREIGN KEY';

-- Test that we can now query the table
SELECT 'FOREIGN KEY FIX COMPLETE' as status; 