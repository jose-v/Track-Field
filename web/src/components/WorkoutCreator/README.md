# Workout Creator Wireframe Components

This directory contains wireframe components for the Workout Creator feature, designed to demonstrate the complete user flow and interface patterns.

## 📁 Components Overview

### `WorkoutCreatorWireframe.tsx`
The main orchestrator component that manages the multi-step workflow and demonstrates the complete user journey.

**Features:**
- 4-step guided workflow
- Progress tracking with visual indicators
- State management across all steps
- Navigation controls with validation
- Mock data for demonstration

### `Step1WorkoutDetails.tsx`
Initial setup step for defining workout basics.

**Features:**
- Workout name input with validation
- Template type selection (Single Day vs Weekly Plan)
- Workout focus selection (Strength, Running, etc.)
- Visual card-based selection interface
- Real-time form validation

### `Step2ExercisePlanning.tsx`
Exercise selection and workout building interface.

**Features:**
- Two-panel layout (Library + Workout Builder)
- Exercise search and filtering
- Category-based filtering
- Drag-and-drop style exercise management
- Sets, reps, and notes configuration
- Real-time workout statistics

### `Step3AthleteAssignment.tsx`
Athlete selection and assignment interface.

**Features:**
- Visual athlete selection with avatars
- Search functionality by name and event
- Bulk selection/deselection
- Selected athletes management
- Most-used athletes quick access

### `Step4ReviewSave.tsx`
Final review and confirmation step.

**Features:**
- Comprehensive workout summary
- Clickable edit links to previous steps
- Warning system for incomplete sections
- Exercise and athlete previews
- Estimated workout statistics

## 🎨 Design Patterns

### Visual Hierarchy
- **Primary Actions**: Blue color scheme for main CTA buttons
- **Secondary Actions**: Gray/outline buttons for navigation
- **Success States**: Green for completed steps and confirmations
- **Warning States**: Orange/yellow for validation messages

### Card-Based Interface
- Consistent card styling with hover effects
- Clear visual feedback for selections
- Proper spacing and typography hierarchy
- Responsive design patterns

### Progressive Disclosure
- Step-by-step revelation of complexity
- Contextual help and tips
- Smart defaults and suggestions
- Validation feedback at appropriate times

## 🚀 Usage

### Basic Implementation
```tsx
import { WorkoutCreatorWireframe } from '@/components/WorkoutCreator';

function App() {
  return <WorkoutCreatorWireframe />;
}
```

### Individual Step Usage
```tsx
import { 
  Step1WorkoutDetails,
  Step2ExercisePlanning,
  Step3AthleteAssignment,
  Step4ReviewSave 
} from '@/components/WorkoutCreator';

// Use individual steps in your own workflow
```

### Custom Integration
```tsx
import { Exercise, Athlete } from '@/components/WorkoutCreator';

// Use the interfaces for type safety in your implementation
```

## 📊 Mock Data

The wireframes include realistic mock data:

### Exercises
- 5 sample exercises across different categories
- Realistic names and descriptions
- Proper categorization (Lift, Bodyweight, Core, etc.)

### Athletes
- 5 sample athletes with different specialties
- Avatar URLs and event classifications
- Realistic names and event types

## 🎯 Key Features Demonstrated

### Navigation
- ✅ Step-by-step progression
- ✅ Back/forward navigation
- ✅ Direct step access (when unlocked)
- ✅ Progress visualization
- ✅ Fixed header/footer for context

### Validation
- ✅ Required field validation
- ✅ Step completion requirements
- ✅ Warning system for incomplete data
- ✅ Real-time feedback

### User Experience
- ✅ Visual feedback for all interactions
- ✅ Hover states and transitions
- ✅ Clear call-to-action hierarchy
- ✅ Contextual help and tips
- ✅ Responsive design considerations

### Data Management
- ✅ State persistence across steps
- ✅ Form data validation
- ✅ Real-time statistics calculation
- ✅ Selection management

## 🔧 Customization

### Styling
All components use Chakra UI components and can be customized through:
- Theme configuration
- Component prop overrides
- Custom CSS classes

### Data Sources
Replace mock data with real data sources:
- Exercise API integration
- Athlete database connection
- User preference storage

### Workflow Modification
- Add/remove steps by updating the `WORKOUT_CREATION_STEPS` array
- Modify validation rules in step navigation functions
- Customize the progress indicator appearance

## 🎨 Design Tokens

### Colors
- **Primary**: Blue (`blue.500`, `blue.600`, `blue.700`)
- **Secondary**: Green (`green.500`, `green.600`)
- **Neutral**: Gray (`gray.200`, `gray.500`, `gray.700`)
- **Warning**: Orange (`orange.500`)

### Spacing
- **Card Padding**: `p={4}`, `p={6}`, `p={8}`
- **Stack Spacing**: `spacing={2}`, `spacing={4}`, `spacing={6}`
- **Grid Gaps**: `spacing={3}`, `spacing={4}`

### Typography
- **Headings**: `size="lg"`, `size="md"`, `size="sm"`
- **Body Text**: `fontSize="md"`, `fontSize="sm"`
- **Helper Text**: `fontSize="xs"`

## 📱 Responsive Behavior

### Breakpoints
- **Base**: Mobile-first design
- **MD**: Tablet adaptations
- **LG**: Desktop optimizations

### Grid Adaptations
- Step 1: Template/Focus cards stack on mobile
- Step 2: Two-panel layout becomes single column on mobile
- Step 3: Athlete grid adjusts column count
- Step 4: Review sections stack appropriately

## 🔄 State Management

### Local State
Each step manages its own form state while sharing data through the main wireframe component.

### Validation States
- Form field validation
- Step completion tracking
- Warning message generation
- Progress calculation

## 🎯 Next Steps

### Integration
1. Replace mock data with real API calls
2. Add database persistence
3. Implement user authentication
4. Add workout scheduling features

### Enhancements
1. Add drag-and-drop exercise reordering
2. Implement exercise video previews
3. Add workout templates/presets
4. Include exercise substitution suggestions

### Testing
1. Unit tests for individual components
2. Integration tests for the complete flow
3. Accessibility testing
4. Cross-browser compatibility testing 