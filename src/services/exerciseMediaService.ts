import { supabase } from '../lib/supabase';

// Types for exercise media
interface ExerciseMediaUrls {
  image?: string;
  animation?: string;
  video?: string;
  thumbnail?: string;
}

interface ExerciseMedia {
  exerciseId: string;
  exerciseName: string;
  category: string;
  mediaType: 'image' | 'animation' | 'video' | 'image_video' | 'animation_video' | null;
  mediaSource: 'local' | 'youtube' | 'vimeo' | 'external' | null;
  urls: ExerciseMediaUrls;
  mediaPriority: string[];
  hasMedia: boolean;
}

// Utility to sanitize exercise names for file paths
const sanitizeExerciseName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

// Generate local file paths based on exercise name and category
const generateLocalPaths = (exerciseName: string, category: string): ExerciseMediaUrls => {
  const sanitizedName = sanitizeExerciseName(exerciseName);
  const basePath = `/exercise-media`;
  
  return {
    image: `${basePath}/images/${category}/${sanitizedName}.webp`,
    animation: `${basePath}/animations/${category}/${sanitizedName}.gif`,
    video: `${basePath}/videos/${category}/${sanitizedName}.mp4`,
    thumbnail: `${basePath}/thumbnails/${category}/${sanitizedName}.webp`,
  };
};

// Check if a local file exists (for client-side)
const checkFileExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// Legacy video URL mapping (keeping your existing hardcoded videos as fallback)
const getLegacyVideoUrl = (exerciseName: string): string | null => {
  const exercise = exerciseName.toLowerCase();
  
  const videoMappings: Record<string, string> = {
    'sprint': 'https://www.youtube.com/embed/6kNvYDTT-NU',
    'dash': 'https://www.youtube.com/embed/6kNvYDTT-NU',
    'hurdle': 'https://www.youtube.com/embed/6Wk65Jf_qSc',
    'jump': 'https://www.youtube.com/embed/7O454Z8efs0',
    'leap': 'https://www.youtube.com/embed/7O454Z8efs0',
    'shot put': 'https://www.youtube.com/embed/axc0FXuTdI8',
    'throw': 'https://www.youtube.com/embed/axc0FXuTdI8',
    'javelin': 'https://www.youtube.com/embed/ZG3_Rfo6_VE',
    'squat': 'https://www.youtube.com/embed/aclHkVaku9U',
    'push': 'https://www.youtube.com/embed/_l3ySVKYVJ8',
    'pushup': 'https://www.youtube.com/embed/_l3ySVKYVJ8',
    'lunge': 'https://www.youtube.com/embed/QOVaHwm-Q6U',
    'plank': 'https://www.youtube.com/embed/pSHjTRCQxIw',
    'deadlift': 'https://www.youtube.com/embed/r4MzxtBKyNE',
    'bench press': 'https://www.youtube.com/embed/SCVCLChPQFY',
    'stretch': 'https://www.youtube.com/embed/nPHfEnZD1Wk',
    'dynamic': 'https://www.youtube.com/embed/nPHfEnZD1Wk',
    'warm up': 'https://www.youtube.com/embed/R0mMyV5OtcM',
    'warmup': 'https://www.youtube.com/embed/R0mMyV5OtcM',
    'arm circles': 'https://www.youtube.com/embed/R0mMyV5OtcM',
  };

  // Check for exact matches first, then partial matches
  for (const [key, url] of Object.entries(videoMappings)) {
    if (exercise.includes(key)) {
      return url;
    }
  }
  
  return null;
};

// Get exercise media from database
export const getExerciseMedia = async (exerciseName: string): Promise<ExerciseMedia | null> => {
  try {
    const { data: exercise, error } = await supabase
      .from('exercise_library')
      .select('id, name, category, video_url, image_url, animation_url, thumbnail_url, has_media, media_type, media_source, media_priority')
      .eq('name', exerciseName)
      .single();

    if (error || !exercise) {
      console.warn(`Exercise not found in library: ${exerciseName}`);
      return null;
    }

    const urls: ExerciseMediaUrls = {
      video: exercise.video_url || undefined,
      image: exercise.image_url || undefined,
      animation: exercise.animation_url || undefined,
      thumbnail: exercise.thumbnail_url || undefined,
    };

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category || 'general',
      mediaType: exercise.media_type,
      mediaSource: exercise.media_source,
      urls,
      mediaPriority: exercise.media_priority || ['image', 'animation', 'video'],
      hasMedia: exercise.has_media || false,
    };
  } catch (error) {
    console.error('Error fetching exercise media:', error);
    return null;
  }
};

// Get the best available media for an exercise (with fallbacks)
export const getBestExerciseMedia = async (exerciseName: string): Promise<{
  type: 'image' | 'animation' | 'video' | 'none';
  url: string | null;
  source: 'database' | 'local' | 'legacy' | 'none';
}> => {
  // First, try to get from database
  const dbMedia = await getExerciseMedia(exerciseName);
  
  if (dbMedia && dbMedia.hasMedia) {
    // Check database URLs in priority order
    for (const mediaType of dbMedia.mediaPriority) {
      const url = dbMedia.urls[mediaType as keyof ExerciseMediaUrls];
      if (url) {
        return {
          type: mediaType as 'image' | 'animation' | 'video',
          url,
          source: 'database'
        };
      }
    }
  }

  // Fall back to checking local files
  const category = dbMedia?.category || 'general';
  const localPaths = generateLocalPaths(exerciseName, category);
  
  // Check local files in priority order
  const priorityOrder = ['image', 'animation', 'video'] as const;
  for (const mediaType of priorityOrder) {
    const url = localPaths[mediaType];
    if (url && await checkFileExists(url)) {
      return {
        type: mediaType,
        url,
        source: 'local'
      };
    }
  }

  // Final fallback to legacy video mapping
  const legacyVideo = getLegacyVideoUrl(exerciseName);
  if (legacyVideo) {
    return {
      type: 'video',
      url: legacyVideo,
      source: 'legacy'
    };
  }

  return {
    type: 'none',
    url: null,
    source: 'none'
  };
};

// Update exercise media in database
export const updateExerciseMedia = async (
  exerciseName: string,
  mediaUrls: Partial<ExerciseMediaUrls>
): Promise<boolean> => {
  try {
    const updateData: any = {};
    
    if (mediaUrls.image) updateData.image_url = mediaUrls.image;
    if (mediaUrls.animation) updateData.animation_url = mediaUrls.animation;
    if (mediaUrls.video) updateData.video_url = mediaUrls.video;
    if (mediaUrls.thumbnail) updateData.thumbnail_url = mediaUrls.thumbnail;
    
    // Determine media type and set flags
    const hasAnyMedia = Object.values(mediaUrls).some(url => url);
    if (hasAnyMedia) {
      updateData.has_media = true;
      
      // Determine primary media type
      if (mediaUrls.video && mediaUrls.image) {
        updateData.media_type = 'image_video';
      } else if (mediaUrls.video && mediaUrls.animation) {
        updateData.media_type = 'animation_video';
      } else if (mediaUrls.video) {
        updateData.media_type = 'video';
      } else if (mediaUrls.animation) {
        updateData.media_type = 'animation';
      } else if (mediaUrls.image) {
        updateData.media_type = 'image';
      }
      
      // Determine media source
      if (mediaUrls.video?.includes('youtube')) {
        updateData.media_source = 'youtube';
      } else if (mediaUrls.video?.includes('vimeo')) {
        updateData.media_source = 'vimeo';
      } else if (mediaUrls.video?.startsWith('http')) {
        updateData.media_source = 'external';
      } else {
        updateData.media_source = 'local';
      }
    }

    const { error } = await supabase
      .from('exercise_library')
      .update(updateData)
      .eq('name', exerciseName);

    if (error) {
      console.error('Error updating exercise media:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating exercise media:', error);
    return false;
  }
};

// Batch update multiple exercises (useful for initial setup)
export const batchUpdateExerciseMedia = async (
  updates: Array<{ exerciseName: string; mediaUrls: Partial<ExerciseMediaUrls> }>
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const update of updates) {
    const result = await updateExerciseMedia(update.exerciseName, update.mediaUrls);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
};

// Helper to get recommended file structure
export const getRecommendedFilePaths = (exerciseName: string, category: string) => {
  return generateLocalPaths(exerciseName, category);
}; 