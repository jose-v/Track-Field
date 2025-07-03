# Exercise Media Organization Guide

This guide explains how to organize and manage exercise media (images, animations, videos) for the Track & Field application's 400+ exercise library.

## 📁 File Organization Structure

```
public/exercise-media/
├── images/          # Static demonstration images (.webp, .png, .jpg)
│   ├── warmup/      # Warm-up exercises
│   ├── drill/       # Running drills
│   ├── plyometric/  # Explosive exercises
│   ├── strength/    # Strength training
│   ├── running/     # Running exercises
│   ├── flexibility/ # Stretching exercises
│   └── cooldown/    # Cool-down exercises
├── animations/      # Animated demonstrations (.gif, .webp)
│   ├── warmup/
│   ├── drill/
│   └── ... (same categories)
├── videos/          # Local video files (.mp4, .webm)
│   ├── warmup/
│   ├── drill/
│   └── ... (same categories)
└── thumbnails/      # Preview thumbnails (.webp, .png)
    ├── warmup/
    ├── drill/
    └── ... (same categories)
```

## 🗄️ Database Schema

### Exercise Library Table (Enhanced)

```sql
ALTER TABLE public.exercise_library ADD COLUMNS:
- image_url TEXT           -- URL/path to demonstration image
- animation_url TEXT       -- URL/path to animation (GIF/WebP)
- thumbnail_url TEXT       -- URL/path to thumbnail
- has_media BOOLEAN        -- Quick lookup flag
- media_type TEXT          -- 'image', 'animation', 'video', 'image_video', 'animation_video'
- media_source TEXT        -- 'local', 'youtube', 'vimeo', 'external'
- media_priority TEXT[]    -- Preferred display order ['image', 'animation', 'video']
```

## 🔧 Implementation Components

### 1. **ExerciseMediaService** (`src/services/exerciseMediaService.ts`)
- Handles media retrieval with intelligent fallbacks
- Manages database operations
- Provides utility functions for file organization

### 2. **ExerciseMediaDisplay** (`src/components/ExerciseMediaDisplay.tsx`)
- React component for displaying exercise media
- Supports images, animations, and videos
- Includes loading states and error handling

### 3. **Integration in Execution Modal**
- Media displays between timer and time input sections
- Maintains existing video functionality as fallback

## 🚀 Getting Started

### Step 1: Run Database Migration
```sql
-- Apply the media enhancement migration
\i migrations/add_exercise_media_fields.sql
```

### Step 2: Setup Initial Media
```sql
-- Run the setup script for existing exercises
\i scripts/setup-exercise-media.sql
```

### Step 3: Add Media for New Exercises

#### Option A: Direct Database Update
```sql
UPDATE public.exercise_library 
SET 
    image_url = '/exercise-media/images/strength/push-ups.webp',
    animation_url = '/exercise-media/animations/strength/push-ups.gif',
    video_url = 'https://www.youtube.com/embed/example',
    has_media = TRUE,
    media_type = 'image_video',
    media_source = 'local',
    media_priority = ARRAY['image', 'animation', 'video']
WHERE name = 'Push Ups';
```

#### Option B: Using the Service (Programmatic)
```typescript
import { updateExerciseMedia } from '../services/exerciseMediaService';

await updateExerciseMedia('Push Ups', {
  image: '/exercise-media/images/strength/push-ups.webp',
  animation: '/exercise-media/animations/strength/push-ups.gif',
  video: 'https://www.youtube.com/embed/example'
});
```

## 📏 File Naming Convention

### Automatic Naming
The system automatically generates file paths based on:
- **Exercise Name**: Sanitized to lowercase, spaces to hyphens
- **Category**: From exercise_library.category field
- **File Extension**: Based on media type

**Example:**
- Exercise: "Arm circles (backwards and forward)"
- Category: "warm_up"
- Generated Path: `/exercise-media/images/warmup/arm-circles.webp`

### Manual Naming Guidelines
If naming manually, follow this pattern:
```
[exercise-name-kebab-case].[extension]
```

**Examples:**
- `arm-circles.webp`
- `push-ups.gif`
- `squat-jumps.mp4`

## 🎯 Media Type Recommendations

### **Images** (.webp preferred, .png/.jpg acceptable)
- **Use for**: Static exercise positions, form demonstrations
- **Size**: 800x450px (16:9 aspect ratio)
- **File Size**: < 100KB for optimal loading

### **Animations** (.gif or .webp animated)
- **Use for**: Movement demonstrations, technique sequences
- **Duration**: 2-5 seconds, looping
- **File Size**: < 500KB
- **Frame Rate**: 10-15 FPS

### **Videos** (.mp4 preferred)
- **Use for**: Detailed tutorials, coaching cues
- **Duration**: 30-90 seconds
- **Resolution**: 720p minimum, 1080p preferred
- **Hosting**: YouTube/Vimeo for large files, local for short clips

### **Thumbnails** (.webp preferred)
- **Use for**: Preview images, grid displays
- **Size**: 320x180px (16:9 aspect ratio)
- **File Size**: < 30KB

## 🔄 Fallback System

The system uses a smart fallback hierarchy:

1. **Database URLs** (highest priority)
   - Check `image_url`, `animation_url`, `video_url` in `media_priority` order

2. **Local Files** (automatic detection)
   - Generated paths based on exercise name and category
   - Checks for file existence

3. **Legacy Video Mapping** (compatibility)
   - Uses existing hardcoded YouTube URLs
   - Keyword-based matching

4. **No Media State** (graceful degradation)
   - Shows placeholder with exercise name

## 📊 Management Tools

### Check Media Coverage
```sql
-- See exercises with/without media
SELECT 
    category,
    COUNT(*) as total_exercises,
    COUNT(*) FILTER (WHERE has_media = true) as with_media,
    ROUND(
        COUNT(*) FILTER (WHERE has_media = true) * 100.0 / COUNT(*), 
        1
    ) as coverage_percentage
FROM public.exercise_library 
WHERE is_system_exercise = true
GROUP BY category
ORDER BY coverage_percentage DESC;
```

### Find Missing Media
```sql
-- List exercises without media
SELECT name, category 
FROM public.exercise_library 
WHERE is_system_exercise = true 
  AND (has_media = false OR has_media IS NULL)
ORDER BY category, name;
```

### Get Recommended File Paths
```typescript
import { getRecommendedFilePaths } from '../services/exerciseMediaService';

const paths = getRecommendedFilePaths('Push Ups', 'strength');
console.log(paths);
// {
//   image: '/exercise-media/images/strength/push-ups.webp',
//   animation: '/exercise-media/animations/strength/push-ups.gif',
//   video: '/exercise-media/videos/strength/push-ups.mp4',
//   thumbnail: '/exercise-media/thumbnails/strength/push-ups.webp'
// }
```

## 🎨 Integration Examples

### In Exercise Execution Modal
```tsx
<ExerciseMediaDisplay
  exerciseName={exerciseName}
  onVideoClick={handleVideoClick}
  size="md"
  showControls={true}
/>
```

### In Exercise Library
```tsx
<ExerciseMediaDisplay
  exerciseName="Push Ups"
  size="sm"
  showControls={false}
  priority="image"
/>
```

## 🔒 Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Images load only when needed
2. **WebP Format**: Smaller file sizes, better compression
3. **Responsive Images**: Different sizes for different screen sizes
4. **Caching**: Browser caches media files
5. **CDN Ready**: File structure supports CDN deployment

### File Size Guidelines
- **Thumbnails**: < 30KB
- **Images**: < 100KB
- **Animations**: < 500KB
- **Local Videos**: < 5MB (prefer external hosting for larger files)

## 🚀 Scaling for 400+ Exercises

### Batch Operations
```typescript
import { batchUpdateExerciseMedia } from '../services/exerciseMediaService';

const updates = [
  { 
    exerciseName: 'Push Ups', 
    mediaUrls: { image: '/exercise-media/images/strength/push-ups.webp' }
  },
  // ... more updates
];

const result = await batchUpdateExerciseMedia(updates);
console.log(`Success: ${result.success}, Failed: ${result.failed}`);
```

### Content Creation Workflow
1. **Prioritize**: Start with most common exercises
2. **Categorize**: Organize by exercise category
3. **Standardize**: Use consistent lighting, angles, backgrounds
4. **Automate**: Use scripts for batch file processing
5. **Validate**: Check file sizes and formats before upload

## 🛠️ Best Practices

### ✅ Do's
- Use consistent file naming
- Optimize images for web
- Provide multiple media types when possible
- Test on different devices
- Use descriptive alt text
- Monitor file sizes

### ❌ Don'ts
- Don't use spaces in filenames
- Don't upload unoptimized large files
- Don't rely on a single media type
- Don't ignore mobile performance
- Don't forget to update database records

## 🔍 Troubleshooting

### Common Issues

**Q: Media not displaying**
- Check file path in database
- Verify file exists in public directory
- Check browser network tab for 404 errors

**Q: Slow loading**
- Optimize image sizes
- Use WebP format
- Check file size guidelines

**Q: Database not updating**
- Verify exercise name spelling
- Check RLS policies
- Ensure user permissions

### Debug Tools
```typescript
// Check what media is available for an exercise
import { getBestExerciseMedia } from '../services/exerciseMediaService';

const media = await getBestExerciseMedia('Push Ups');
console.log(media);
```

This system provides a robust, scalable foundation for managing exercise media that will grow with your 400+ exercise library while maintaining excellent performance and user experience. 