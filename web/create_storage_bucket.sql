-- Supabase SQL script to create a storage bucket
-- You can run this in the Supabase SQL Editor

-- Create a new storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 
  'storage', -- Use 'storage' as the bucket name and ID
  'storage', 
  TRUE -- This makes the bucket public (anyone can see files)
WHERE 
  NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'storage');

-- Set up RLS (Row Level Security) policies to allow authenticated users to upload files
DO $$
BEGIN
  -- Enable authenticated users to upload files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow authenticated users to upload files'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'storage');
  END IF;

  -- Allow authenticated users to update their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow authenticated users to update their files'
  ) THEN
    CREATE POLICY "Allow authenticated users to update their files"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'storage' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'storage' AND owner = auth.uid());
  END IF;

  -- Allow authenticated users to delete their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow authenticated users to delete their files'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete their files"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'storage' AND owner = auth.uid());
  END IF;

  -- Allow anyone to read public files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'storage');
  END IF;
END $$; 