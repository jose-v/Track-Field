import { ExerciseBlock } from '../types/workout-blocks';

// Pre-built block templates for common workout patterns
export const BLOCK_TEMPLATES: Record<string, ExerciseBlock> = {
  // Warm-up Templates
  dynamicWarmup: {
    id: 'template-dynamic-warmup',
    name: 'Dynamic Warm-up',
    category: 'warmup',
    flow: 'sequential',
    restBetweenExercises: 30,
    exercises: [
      { name: 'Light Jogging', sets: 1, reps: 1, distance: 400, notes: '5 minutes easy pace' },
      { name: 'Dynamic Leg Swings', sets: 2, reps: 10, notes: 'Forward/back and side to side' },
      { name: 'High Knees', sets: 2, reps: 20, notes: 'Focus on quick turnover' },
      { name: 'Butt Kicks', sets: 2, reps: 20, notes: 'Heel to glute contact' },
      { name: 'Walking Lunges', sets: 1, reps: 20, notes: 'Alternating legs' },
      { name: 'Leg Cradles', sets: 1, reps: 10, notes: 'Each leg' },
    ]
  },

  trackWarmup: {
    id: 'template-track-warmup',
    name: 'Track Warm-up',
    category: 'warmup',
    flow: 'sequential',
    restBetweenExercises: 45,
    exercises: [
      { name: 'Easy Jog', sets: 1, reps: 1, distance: 800, notes: '2 laps at 70% effort' },
      { name: 'A-Skips', sets: 3, reps: 20, notes: '20m each' },
      { name: 'B-Skips', sets: 3, reps: 20, notes: '20m each' },
      { name: 'Carioca', sets: 2, reps: 1, distance: 40, notes: '20m each direction' },
      { name: 'Build-ups', sets: 4, reps: 1, distance: 60, notes: 'Gradual acceleration' },
    ]
  },

  // Main Set Templates
  sprintIntervals: {
    id: 'template-sprint-intervals',
    name: 'Sprint Intervals',
    category: 'main',
    flow: 'circuit',
    rounds: 6,
    restBetweenExercises: 90,
    restBetweenRounds: 120,
    exercises: [
      { name: '200m Sprint', sets: 1, reps: 1, distance: 200, notes: '90-95% effort' },
      { name: 'Active Recovery Walk', sets: 1, reps: 1, distance: 100, notes: 'Keep moving' },
    ]
  },

  strengthCircuit: {
    id: 'template-strength-circuit',
    name: 'Strength Circuit',
    category: 'main',
    flow: 'circuit',
    rounds: 3,
    restBetweenExercises: 45,
    restBetweenRounds: 180,
    exercises: [
      { name: 'Squats', sets: 1, reps: 12, weight: 135, notes: 'Bodyweight or loaded' },
      { name: 'Push-ups', sets: 1, reps: 15, notes: 'Full range of motion' },
      { name: 'Pull-ups', sets: 1, reps: 8, notes: 'Assisted if needed' },
      { name: 'Plank Hold', sets: 1, reps: 1, rest: 60, notes: '60 seconds' },
    ]
  },

  plyometrics: {
    id: 'template-plyometrics',
    name: 'Plyometric Power',
    category: 'main',
    flow: 'sequential',
    restBetweenExercises: 120,
    exercises: [
      { name: 'Box Jumps', sets: 4, reps: 6, notes: '24-30 inch box' },
      { name: 'Broad Jumps', sets: 4, reps: 5, notes: 'Maximum distance' },
      { name: 'Single Leg Bounds', sets: 3, reps: 8, notes: 'Each leg' },
      { name: 'Depth Jumps', sets: 3, reps: 5, notes: '18 inch drop' },
    ]
  },

  // Conditioning Templates
  runningConditioning: {
    id: 'template-running-conditioning',
    name: 'Running Conditioning',
    category: 'conditioning',
    flow: 'circuit',
    rounds: 4,
    restBetweenRounds: 180,
    exercises: [
      { name: '400m Run', sets: 1, reps: 1, distance: 400, notes: '85% effort' },
      { name: 'Mountain Climbers', sets: 1, reps: 30, notes: 'Fast tempo' },
      { name: 'Burpees', sets: 1, reps: 10, notes: 'Full body movement' },
    ]
  },

  emomCardio: {
    id: 'template-emom-cardio',
    name: 'EMOM Cardio',
    category: 'conditioning',
    flow: 'emom',
    timeCapMinutes: 12,
    exercises: [
      { name: 'Sprint', sets: 1, reps: 1, distance: 100, notes: 'Every minute on the minute' },
    ]
  },

  // Cool-down Templates
  staticCooldown: {
    id: 'template-static-cooldown',
    name: 'Static Cool-down',
    category: 'cooldown',
    flow: 'sequential',
    restBetweenExercises: 10,
    exercises: [
      { name: 'Hamstring Stretch', sets: 2, reps: 1, rest: 30, notes: '30 seconds each leg' },
      { name: 'Quad Stretch', sets: 2, reps: 1, rest: 30, notes: '30 seconds each leg' },
      { name: 'Calf Stretch', sets: 2, reps: 1, rest: 30, notes: '30 seconds each leg' },
      { name: 'Hip Flexor Stretch', sets: 2, reps: 1, rest: 30, notes: '30 seconds each leg' },
      { name: 'Seated Spinal Twist', sets: 2, reps: 1, rest: 30, notes: '30 seconds each side' },
    ]
  },

  recoveryFlow: {
    id: 'template-recovery-flow',
    name: 'Recovery Flow',
    category: 'cooldown',
    flow: 'sequential',
    restBetweenExercises: 0,
    exercises: [
      { name: 'Easy Walk', sets: 1, reps: 1, distance: 400, notes: '5 minutes slow pace' },
      { name: 'Deep Breathing', sets: 3, reps: 10, notes: '4-7-8 pattern' },
      { name: 'Foam Rolling', sets: 1, reps: 1, rest: 300, notes: '5 minutes full body' },
    ]
  },
};

// Template categories for organization
export const TEMPLATE_CATEGORIES = {
  warmup: {
    name: 'Warm-up',
    templates: ['dynamicWarmup', 'trackWarmup'],
    color: 'orange',
    description: 'Prepare your body for training'
  },
  main: {
    name: 'Main Training',
    templates: ['sprintIntervals', 'strengthCircuit', 'plyometrics'],
    color: 'blue',
    description: 'Primary workout activities'
  },
  conditioning: {
    name: 'Conditioning',
    templates: ['runningConditioning', 'emomCardio'],
    color: 'red',
    description: 'Cardiovascular and metabolic training'
  },
  cooldown: {
    name: 'Cool-down',
    templates: ['staticCooldown', 'recoveryFlow'],
    color: 'purple',
    description: 'Recovery and flexibility work'
  },
};

// Helper functions for template management
export class BlockTemplateService {
  
  /**
   * Get all templates for a specific category
   */
  static getTemplatesByCategory(category: string): ExerciseBlock[] {
    const categoryData = TEMPLATE_CATEGORIES[category];
    if (!categoryData) return [];
    
    return categoryData.templates.map(templateId => ({
      ...BLOCK_TEMPLATES[templateId],
      id: `${templateId}-${Date.now()}`, // Generate unique ID for instances
    }));
  }

  /**
   * Get a specific template by ID
   */
  static getTemplate(templateId: string): ExerciseBlock | null {
    const template = BLOCK_TEMPLATES[templateId];
    if (!template) return null;
    
    return {
      ...template,
      id: `${templateId}-${Date.now()}`, // Generate unique ID for instances
    };
  }

  /**
   * Create a custom template from an existing block
   */
  static createCustomTemplate(
    block: ExerciseBlock,
    name: string,
    description?: string
  ): ExerciseBlock {
    return {
      ...block,
      id: `custom-${Date.now()}`,
      name,
      notes: description,
    };
  }

  /**
   * Get suggested templates based on workout goals
   */
  static getSuggestedTemplates(goals: string[]): ExerciseBlock[] {
    const suggestions: string[] = [];

    // Always suggest warm-up
    suggestions.push('dynamicWarmup');

    // Goal-based suggestions
    if (goals.includes('speed')) {
      suggestions.push('sprintIntervals', 'plyometrics');
    }
    if (goals.includes('strength')) {
      suggestions.push('strengthCircuit');
    }
    if (goals.includes('endurance')) {
      suggestions.push('runningConditioning');
    }
    if (goals.includes('power')) {
      suggestions.push('plyometrics', 'emomCardio');
    }

    // Always suggest cool-down
    suggestions.push('staticCooldown');

    return suggestions.map(templateId => ({
      ...BLOCK_TEMPLATES[templateId],
      id: `${templateId}-${Date.now()}`,
    }));
  }

  /**
   * Search templates by name or exercise content
   */
  static searchTemplates(query: string): ExerciseBlock[] {
    const searchTerm = query.toLowerCase();
    
    return Object.values(BLOCK_TEMPLATES)
      .filter(template => {
        const nameMatch = template.name?.toLowerCase().includes(searchTerm);
        const exerciseMatch = template.exercises.some(ex => 
          ex.name.toLowerCase().includes(searchTerm)
        );
        const categoryMatch = template.category?.toLowerCase().includes(searchTerm);
        
        return nameMatch || exerciseMatch || categoryMatch;
      })
      .map(template => ({
        ...template,
        id: `${template.id}-${Date.now()}`,
      }));
  }
} 