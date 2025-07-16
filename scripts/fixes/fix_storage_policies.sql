-- Fix storage bucket policies for meet-files
-- Run this in Supabase SQL Editor

-- First, ensure the storage bucket exists
INSERT INTO storage.buckets (id, name, public) 
SELECT 'meet-files', 'meet-files', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'meet-files'
);

-- Remove any existing storage policies
DROP POLICY IF EXISTS "Users can upload meet files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view meet files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete meet files" ON storage.objects;

-- Create storage policies for the meet-files bucket
CREATE POLICY "Users can upload meet files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'meet-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view meet files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'meet-files'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete meet files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'meet-files'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update the meet_files table RLS policies to be more permissive
DROP POLICY IF EXISTS "Users can view meet files for meets they have access to" ON meet_files;
DROP POLICY IF EXISTS "Coaches can manage files for their meets" ON meet_files;

-- More permissive policies for testing
CREATE POLICY "Authenticated users can view meet files" ON meet_files
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert meet files" ON meet_files
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' 
  AND uploaded_by = auth.uid()
);

CREATE POLICY "Users can delete their own meet files" ON meet_files
FOR DELETE USING (
  auth.role() = 'authenticated' 
  AND uploaded_by = auth.uid()
);

CREATE POLICY "Users can update their own meet files" ON meet_files
FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND uploaded_by = auth.uid()
); 