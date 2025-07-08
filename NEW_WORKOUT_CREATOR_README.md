# New Block-First Workout Creator

## 🎯 **What We Built**

A complete redesign of the workout creation experience with a **block-first approach** that prioritizes structure and training methodology over individual exercises.

## 🚀 **How to Test**

### **Option 1: Via Training Plans Page (Recommended)**
1. Navigate to **Coach → Training Plans** (or `/coach/training-plans`)
2. Click **"Create Workout"** button in the sidebar
3. You'll see the **Choice Page** with both experiences

### **Option 2: Direct Navigation**
- **Choice Page**: `/coach/workout-creator-choice`
- **New Experience**: `/coach/workout-creator-new`  
- **Legacy Experience**: `/coach/workout-creator`

## 🏗️ **New 5-Step Workflow**

### **Step 1: Choose Template Type**
- **Single Day Workout**: Quick single session creation
- **Weekly Training Plan**: 7-day training schedule  
- **Monthly Plan**: Long-term periodized planning (marked as "Advanced")

**Template Options:**
- **Classic Strength**: Warm-up → Main Strength → Cool-down
- **Speed Circuit**: Dynamic Warm-up → Circuit Training → Recovery
- **Daily EMOM**: Activation → EMOM Block → Cool-down
- **Start from Scratch**: Custom build

### **Step 2: Build Workout Structure**
- **Quick Add Blocks**: Warm-up, Main Set, Accessory, Conditioning, Cool-down, Custom
- **Block Configuration**: 
  - **Flow Types**: Sequential, Circuit, Superset, EMOM, AMRAP
  - **Smart Defaults**: Auto rest times based on block category
  - **Advanced Settings**: Rounds, time limits, custom rest periods
- **Drag & Drop**: Reorder blocks naturally
- **Visual Organization**: Color-coded blocks with clear flow indicators

### **Step 3: Add Exercises** *(In Progress)*
- Exercise library integration with block-specific adding
- Drag exercises directly into blocks
- Per-exercise configuration within block context

### **Step 4: Set Schedule** *(In Progress)*
- Date/time selection for single workouts
- Weekly calendar for weekly plans  
- Monthly planning interface

### **Step 5: Assign Athletes**
- Reused existing athlete assignment component
- Multiple save options: Save, Save as Template, Save & Assign

## 🎨 **Key UX Improvements**

### **Block-First Philosophy**
- Build structure **before** adding exercises
- Mix different training styles in one workout
- Logical progression: Structure → Content → Schedule → Assignment

### **Smart Features**
- **Template-Driven Start**: Quick setup with proven structures
- **Category-Based Defaults**: Automatic rest times (Warm-up: 60s, Main: 90s, etc.)
- **Flow-Specific Configuration**: EMOM and AMRAP show time limits, Circuits show rounds
- **Progressive Disclosure**: Simple start → advanced options as needed

### **Visual Design**
- **Progress Tracking**: Step completion indicators and validation
- **Color-Coded Blocks**: Warm-up (Orange), Main (Blue), Conditioning (Red), etc.
- **Flow Icons**: Visual indicators for Sequential, Circuit, EMOM, etc.
- **Responsive Layout**: Works on all device sizes

## 🏛️ **Architecture**

### **Component Structure**
```
src/components/WorkoutCreator/
├── legacy/                    # Backed up original components
│   ├── WorkoutCreatorWireframe.tsx
│   ├── Step1WorkoutDetails.tsx
│   ├── Step2ExercisePlanning.tsx
│   └── ...
├── NewWorkoutCreator.tsx      # Main orchestrator
├── Step1TemplateSelection.tsx # Template & type selection
├── Step2BlockBuilder.tsx      # Block creation & configuration
└── index.ts                   # Exports both old and new
```

### **New Routes Added**
- `/coach/workout-creator-choice` - Side-by-side comparison page
- `/coach/workout-creator-new` - New block-first experience
- `/team-manager/workout-creator-choice` - Team manager access
- `/team-manager/workout-creator-new` - Team manager access

### **Data Compatibility**
- ✅ **Reuses existing database schemas** - No breaking changes
- ✅ **Block system already exists** - Leverages current `blocks` column
- ✅ **Monthly plan compatible** - Block workouts work in monthly plans
- ✅ **Execution modal ready** - BlockWorkoutExecution handles new workouts

## 🔄 **Migration Strategy**

### **Phase 1: Parallel Operation** *(Current)*
- Both experiences run simultaneously
- Users can choose which to use
- Legacy system remains fully functional
- Easy rollback if needed

### **Phase 2: Feature Completion** *(Next)*
- Complete Step 3 (Exercise Integration)
- Complete Step 4 (Schedule Configuration)  
- Add smart prompts and wizard features
- Enhanced template system

### **Phase 3: Gradual Migration** *(Future)*
- Collect user feedback on both experiences
- Improve new experience based on feedback
- Gradually migrate default links to new experience
- Sunset legacy system when ready

## 🧪 **Testing Notes**

### **What Works Now**
- ✅ Template type selection
- ✅ Template starter options
- ✅ Block creation and configuration
- ✅ Block reordering (drag & drop)
- ✅ Flow type configuration (Sequential, Circuit, EMOM, etc.)
- ✅ Smart defaults for rest times
- ✅ Progress tracking and step validation
- ✅ Multiple save options

### **What's In Progress**
- 🔄 Exercise library integration with blocks
- 🔄 Schedule configuration UI
- 🔄 Weekly/monthly specific workflows
- 🔄 Smart prompts and suggestions
- 🔄 Template expansion

### **Known Issues**
- Exercise adding currently shows placeholder
- Schedule step needs implementation  
- Weekly day selection needs block context
- Some import paths may need adjustment

## 🎯 **Next Development Priorities**

1. **Complete Exercise Integration**
   - Connect ExerciseLibrary with block exercise adding
   - Implement drag-to-block functionality
   - Add exercise parameter configuration within blocks

2. **Schedule Configuration**
   - Date/time picker for single workouts
   - Weekly calendar interface
   - Monthly planning integration

3. **Smart Features**
   - Auto-grouping suggestions ("Make these a superset?")
   - Time cap recommendations
   - Beginner wizard mode

## 🔗 **Key Files**

- **Main Component**: `src/components/WorkoutCreator/NewWorkoutCreator.tsx`
- **Template Selection**: `src/components/WorkoutCreator/Step1TemplateSelection.tsx`  
- **Block Builder**: `src/components/WorkoutCreator/Step2BlockBuilder.tsx`
- **Choice Page**: `src/pages/coach/CreateWorkoutChoice.tsx`
- **Routes**: `src/routes/AppRoutes.tsx` (lines 141-143, 157-159)
- **Legacy Backup**: `src/components/WorkoutCreator/legacy/`

## 🏃‍♂️ **Quick Start Testing**

1. Start development server (`npm run dev`)
2. Login as a coach
3. Go to **Training Plans** page
4. Click **"Create Workout"**
5. Choose **"New Block-First Creator"**
6. Walk through the 5-step process!

---

*This implementation maintains 100% backward compatibility while introducing a modern, block-first approach to workout creation that better reflects how coaches actually think about programming.* 