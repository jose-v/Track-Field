-- Setup script for exercise media
-- This includes the migration and populates the "Arm circles (backwards and forward)" exercise with media

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

-- Update the arm circles exercise with image URL
UPDATE public.exercise_library 
SET 
    image_url = '/exercise-media/images/warmup/arm-circles.png',
    has_media = TRUE,
    media_type = 'image',
    media_source = 'local',
    media_priority = ARRAY['image', 'video']
WHERE name = 'Arm circles (backwards and forward)';

-- Verify the update
SELECT 
    name,
    category,
    image_url,
    video_url,
    has_media,
    media_type,
    media_source,
    media_priority
FROM public.exercise_library 
WHERE name = 'Arm circles (backwards and forward)';

-- Example of how to add media for other exercises
-- UPDATE public.exercise_library 
-- SET 
--     image_url = '/exercise-media/images/strength/push-ups.webp',
--     animation_url = '/exercise-media/animations/strength/push-ups.gif',
--     video_url = 'https://www.youtube.com/embed/example',
--     thumbnail_url = '/exercise-media/thumbnails/strength/push-ups.webp',
--     has_media = TRUE,
--     media_type = 'image_video',
--     media_source = 'local',
--     media_priority = ARRAY['image', 'animation', 'video']
-- WHERE name = 'Push Ups'; 