-- Add comprehensive media support to exercise_library table
-- This enhances the existing video_url field with additional media types

ALTER TABLE public.exercise_library 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS animation_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS has_media BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'animation', 'video', 'image_video', 'animation_video')),
ADD COLUMN IF NOT EXISTS media_source TEXT CHECK (media_source IN ('local', 'youtube', 'vimeo', 'external')),
ADD COLUMN IF NOT EXISTS media_priority TEXT[] DEFAULT ARRAY['image', 'animation', 'video'];

-- Create indexes for media queries
CREATE INDEX IF NOT EXISTS idx_exercise_library_has_media ON public.exercise_library(has_media);
CREATE INDEX IF NOT EXISTS idx_exercise_library_media_type ON public.exercise_library(media_type);

-- Update existing exercises with video_url to set has_media flag
UPDATE public.exercise_library 
SET has_media = TRUE, 
    media_type = 'video',
    media_source = CASE 
        WHEN video_url LIKE '%youtube%' THEN 'youtube'
        WHEN video_url LIKE '%vimeo%' THEN 'vimeo'
        ELSE 'external'
    END
WHERE video_url IS NOT NULL AND video_url != '';

-- Add comments for documentation
COMMENT ON COLUMN public.exercise_library.image_url IS 'URL or path to exercise demonstration image';
COMMENT ON COLUMN public.exercise_library.animation_url IS 'URL or path to exercise animation (GIF/WebP)';
COMMENT ON COLUMN public.exercise_library.thumbnail_url IS 'URL or path to thumbnail image for previews';
COMMENT ON COLUMN public.exercise_library.has_media IS 'Quick lookup flag for exercises with any media';
COMMENT ON COLUMN public.exercise_library.media_type IS 'Primary media type available for this exercise';
COMMENT ON COLUMN public.exercise_library.media_source IS 'Source type for media hosting';
COMMENT ON COLUMN public.exercise_library.media_priority IS 'Preferred order of media types to display'; 