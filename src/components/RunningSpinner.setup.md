# 🏃‍♂️ Running Man Spinner Setup

## 📋 **Required Files**

To use the running man spinner, you need to add sprite sheet images to your project:

### 1. **Main Sprite Sheet (Dark)**
- **File**: `public/images/running-man-sprite.png`
- **Description**: Black silhouette sprite sheet for light themes
- **Dimensions**: 768px × 128px (6 frames × 128px each)
- **Source**: Your provided sprite image

### 2. **Light Sprite Sheet (Optional)**
- **File**: `public/images/running-man-sprite-light.png`  
- **Description**: White/light silhouette for dark themes
- **Dimensions**: 768px × 128px (6 frames × 128px each)
- **Source**: Create by inverting colors of the main sprite

## 🛠️ **Setup Steps**

### Step 1: Save Your Sprite Image
1. Save your provided sprite sheet as:
   ```
   public/images/running-man-sprite.png
   ```

### Step 2: Create Light Version (Optional)
1. Open your sprite image in an image editor
2. Invert the colors (black → white)
3. Save as:
   ```
   public/images/running-man-sprite-light.png
   ```

### Step 3: Verify File Structure
```
public/
  images/
    running-man-sprite.png       ← Required (dark/black version)
    running-man-sprite-light.png ← Optional (light/white version)
```

### Step 4: Test the Component
```tsx
import { RunningSpinner } from '../components/RunningSpinner'

// Should work immediately after adding the sprite
<RunningSpinner size="lg" />
```

## 🎨 **Sprite Sheet Requirements**

### Format Specifications:
- **Frames**: Exactly 6 frames of running animation
- **Layout**: Horizontal sprite sheet (frames side by side)
- **Frame Size**: Square frames (128×128px recommended)
- **Total Size**: 768×128px (6 frames × 128px width)
- **Format**: PNG with transparency

### Frame Layout:
```
[Frame 1][Frame 2][Frame 3][Frame 4][Frame 5][Frame 6]
   0px     128px    256px    384px    512px    640px
```

## 🔧 **Customization**

### If Using Different Sprite Dimensions:
Update the `getSizeConfig` function in `RunningSpinner.tsx`:

```tsx
// Example for 100px frames instead of 128px
case 'xl':
  return { width: '100px', height: '100px', spriteWidth: '600px' } // 6 × 100px
```

### If Using Different Number of Frames:
Update the animation steps:

```tsx
// Example for 8 frames instead of 6
animation: `runCycle ${speed} steps(8) infinite`
```

## 🚨 **Fallback Behavior**

If sprite images are missing:
- Component will still render but show no animation
- No errors will be thrown
- Falls back gracefully to empty box
- Consider adding error boundaries for production

## ✅ **Verification Checklist**

- [ ] Sprite image saved to correct path
- [ ] Image dimensions are correct (768×128px)
- [ ] 6 frames visible in sprite sheet
- [ ] Component renders without errors
- [ ] Animation plays smoothly
- [ ] Works in both light/dark themes

---

*Once setup is complete, the running man spinner will be available throughout your application for a track & field themed loading experience!* 🏃‍♂️ 