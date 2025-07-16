-- Migration: Create meet_files table for file uploads (Fixed version)
-- Date: 2024-12-XX

-- Create meet_files table
CREATE TABLE IF NOT EXISTS meet_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meet_id UUID REFERENCES track_meets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT, -- 'image', 'document', 'spreadsheet', 'other'
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_meet_files_meet_id ON meet_files(meet_id);
CREATE INDEX IF NOT EXISTS idx_meet_files_uploaded_by ON meet_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_meet_files_category ON meet_files(category);

-- Add comments for documentation
COMMENT ON TABLE meet_files IS 'Files uploaded for track meets (images, documents, schedules, etc.)';
COMMENT ON COLUMN meet_files.meet_id IS 'Reference to the track meet this file belongs to';
COMMENT ON COLUMN meet_files.file_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN meet_files.file_path IS 'Path to file in Supabase storage';
COMMENT ON COLUMN meet_files.file_type IS 'MIME type or file extension';
COMMENT ON COLUMN meet_files.file_size IS 'File size in bytes';
COMMENT ON COLUMN meet_files.category IS 'File category: image, document, spreadsheet, other';
COMMENT ON COLUMN meet_files.uploaded_by IS 'User who uploaded the file';

-- Enable RLS (Row Level Security)
ALTER TABLE meet_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view meet files for meets they have access to" ON meet_files;
DROP POLICY IF EXISTS "Coaches can manage files for their meets" ON meet_files;

-- Create RLS policies
CREATE POLICY "Users can view meet files for meets they have access to" ON meet_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM track_meets tm 
      WHERE tm.id = meet_files.meet_id 
      AND (tm.coach_id = auth.uid() OR tm.athlete_id = auth.uid())
    )
  );

CREATE POLICY "Coaches can manage files for their meets" ON meet_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM track_meets tm 
      WHERE tm.id = meet_files.meet_id 
      AND tm.coach_id = auth.uid()
    )
  );

-- Create storage bucket for meet files (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
SELECT 'meet-files', 'meet-files', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'meet-files'
); 