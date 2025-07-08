import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Progress,
  Text,
  useColorModeValue,
  useToast,
  IconButton,
  Container,
  Flex,
  Badge,
  Card,
  CardBody,
  Heading,
  Icon,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Divider,
  Switch,
  Alert,
  AlertIcon,
  SimpleGrid,
} from '@chakra-ui/react';
import { ArrowLeft, ArrowRight, Save, Sparkles, Users, Calendar, CalendarDays } from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';

// Import new step components
import Step1TemplateSelection from './Step1TemplateSelection';
import Step2BlockBuilder from './Step2BlockBuilder';
import WeeklyDaySelector from './WeeklyDaySelector';
import Step4Schedule from './Step4Schedule';
import Step5AthleteAssignment from './Step5AthleteAssignment';
import { WeeklyWorkoutSelector } from '../WeeklyWorkoutSelector';
import { DateTimePicker } from '../DateTimePicker';
import Step3ExerciseAssignment from './Step3ExerciseAssignment';

interface WorkoutBlock {
  id: string;
  name: string;
  category: 'warmup' | 'main' | 'accessory' | 'conditioning' | 'cooldown' | 'custom';
  flow: 'sequential' | 'circuit' | 'superset' | 'emom' | 'amrap';
  exercises: any[];
  restBetweenExercises: number;
  rounds?: number;
  timeLimit?: number;
  description?: string;
}

interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
  sets?: string;
  reps?: string;
  weight?: string;
  distance?: string;
  rest?: string;
  rpe?: string;
  notes?: string;
  contacts?: string;
  intensity?: string;
  direction?: string;
  movement_notes?: string;
}

interface Athlete {
  id: string;
  name: string;
  event: string;
  avatar: string;
}

const WORKFLOW_STEPS = [
  { 
    id: 1, 
    title: 'Choose Template', 
    shortTitle: 'Template',
    description: 'Select workout type and starting template'
  },
  { 
    id: 2, 
    title: 'Build Blocks', 
    shortTitle: 'Blocks',
    description: 'Create workout structure with training blocks'
  },
  { 
    id: 3, 
    title: 'Add Exercises', 
    shortTitle: 'Exercises',
    description: 'Add exercises to your blocks'
  },
  { 
    id: 4, 
    title: 'Set Schedule', 
    shortTitle: 'Schedule',
    description: 'Configure dates and timing'
  },
  { 
    id: 5, 
    title: 'Assign Athletes', 
    shortTitle: 'Athletes',
    description: 'Choose who gets this workout'
  }
];

// Dynamic workflow steps based on template type
const getWorkflowSteps = (templateType: 'single' | 'weekly' | 'monthly') => {
  if (templateType === 'monthly') {
    return [
      { 
        id: 1, 
        title: 'Choose Template', 
        shortTitle: 'Template',
        description: 'Select monthly plan template'
      },
      { 
        id: 2, 
        title: 'Weekly Builder', 
        shortTitle: 'Builder',
        description: 'Build your weekly schedule with workout templates'
      },
      { 
        id: 3, 
        title: 'Name & Schedule', 
        shortTitle: 'Schedule',
        description: 'Set plan name, details and training dates'
      },
      { 
        id: 4, 
        title: 'Assign Athletes', 
        shortTitle: 'Athletes',
        description: 'Choose who gets this monthly plan'
      }
    ];
  }
  
  return WORKFLOW_STEPS;
};

const NewWorkoutCreator: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  // Parse URL params
  const searchParams = new URLSearchParams(location.search);
  const action = searchParams.get('action');
  const isTemplate = action === 'template';
  const editWorkoutId = searchParams.get('edit');
  const isEditing = !!editWorkoutId;

  // Sidebar width state management
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Check localStorage for the saved sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarWidth(event.detail.width);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.900', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const summaryBg = useColorModeValue('gray.50', 'gray.700');
  const summaryBorder = useColorModeValue('gray.200', 'gray.600');

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Form state
  const [workoutName, setWorkoutName] = useState('');
  const [selectedTemplateType, setSelectedTemplateType] = useState<'single' | 'weekly' | 'monthly'>('single');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<Record<string, Athlete>>({});
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [workoutLocation, setWorkoutLocation] = useState('');
  const [isTemplateMode, setIsTemplateMode] = useState(false);

  // Weekly/monthly specific state
  const [currentDay, setCurrentDay] = useState('monday');
  const [dailyBlocks, setDailyBlocks] = useState<Record<string, WorkoutBlock[]>>({
    monday: [], tuesday: [], wednesday: [], thursday: [], 
    friday: [], saturday: [], sunday: []
  });
  const [restDays, setRestDays] = useState<Record<string, boolean>>({
    monday: false, tuesday: false, wednesday: false, thursday: false,
    friday: false, saturday: false, sunday: false
  });

  // Monthly plan state
  const [monthlyPlanWeeks, setMonthlyPlanWeeks] = useState<{
    week_number: number;
    workout_id: string;
    is_rest_week: boolean;
  }[]>([
    { week_number: 1, workout_id: '', is_rest_week: false },
    { week_number: 2, workout_id: '', is_rest_week: false },
    { week_number: 3, workout_id: '', is_rest_week: false },
    { week_number: 4, workout_id: '', is_rest_week: false }
  ]);
  const [availableWeeklyWorkouts, setAvailableWeeklyWorkouts] = useState<any[]>([]);
  const [loadingWeeklyWorkouts, setLoadingWeeklyWorkouts] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);

  // Initialize workout name based on template
  useEffect(() => {
    if (selectedTemplateType && selectedTemplate && !workoutName) {
      const timestamp = new Date().toLocaleDateString();
      const templateName = selectedTemplate === 'scratch' ? 'Custom' : selectedTemplate;
      const typeName = selectedTemplateType.charAt(0).toUpperCase() + selectedTemplateType.slice(1);
      setWorkoutName(`${templateName} ${typeName} - ${timestamp}`);
    }
  }, [selectedTemplateType, selectedTemplate, workoutName]);

  // Step validation
  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        // In edit mode, if we have a template type, we can proceed (template selection is already done)
        if (isEditing) {
          return selectedTemplateType !== null;
        }
        return selectedTemplateType !== null && selectedTemplate !== '';
      case 2:
        if (selectedTemplateType === 'monthly') {
          // For monthly plans, step 2 is weekly template selection
          return monthlyPlanWeeks.some(week => !week.is_rest_week && week.workout_id !== '');
        }
        if (selectedTemplateType === 'weekly') {
          return Object.values(dailyBlocks).some(dayBlocks => dayBlocks.length > 0);
        }
        return blocks.length > 0;
      case 3:
        if (selectedTemplateType === 'monthly') {
          // For monthly plans, step 3 is plan details
          return workoutName.trim() !== '';
        }
        // At least one block should have exercises
        const allBlocks = selectedTemplateType === 'weekly' 
          ? Object.values(dailyBlocks).flat()
          : blocks;
        return allBlocks.some(block => block.exercises.length > 0);
      case 4:
        if (selectedTemplateType === 'monthly') {
          // For monthly plans, step 4 is athlete assignment (optional)
          return true;
        }
        return workoutName.trim() !== '';
      case 5:
        // Only for single/weekly workflows
        return selectedTemplateType !== 'monthly';
      default:
        return true;
    }
  }, [selectedTemplateType, selectedTemplate, blocks, dailyBlocks, workoutName, monthlyPlanWeeks, isEditing]);

  // Navigation handlers
  const handleNext = () => {
    const currentWorkflowSteps = getWorkflowSteps(selectedTemplateType);
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => Math.min(prev + 1, currentWorkflowSteps.length));
    } else {
      toast({
        title: 'Step incomplete',
        description: 'Please complete the current step before proceeding.',
        status: 'warning',
        duration: 3000,
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step);
    }
  };

  // Template handlers
  const handleTemplateTypeSelect = (type: 'single' | 'weekly' | 'monthly') => {
    setSelectedTemplateType(type);
    setSelectedTemplate(''); // Reset template selection
    setBlocks([]); // Reset blocks
    setDailyBlocks({
      monday: [], tuesday: [], wednesday: [], thursday: [], 
      friday: [], saturday: [], sunday: []
    });
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    
    // Auto-populate blocks based on template
    if (template !== 'scratch') {
      // Add template-specific blocks
      // This could be expanded with more sophisticated template logic
      const templateBlocks = getTemplateBlocks(template);
      setBlocks(templateBlocks);
    }
  };

  // Get template blocks (simplified)
  const getTemplateBlocks = (template: string): WorkoutBlock[] => {
    const templates = {
      strength: [
        {
          id: 'warmup-1',
          name: 'Dynamic Warm-up',
          category: 'warmup' as const,
          flow: 'sequential' as const,
          exercises: [],
          restBetweenExercises: 60
        },
        {
          id: 'main-1',
          name: 'Strength Training',
          category: 'main' as const,
          flow: 'sequential' as const,
          exercises: [],
          restBetweenExercises: 90
        },
        {
          id: 'cooldown-1',
          name: 'Cool-down',
          category: 'cooldown' as const,
          flow: 'sequential' as const,
          exercises: [],
          restBetweenExercises: 30
        }
      ],
      circuit: [
        {
          id: 'warmup-1',
          name: 'Dynamic Warm-up',
          category: 'warmup' as const,
          flow: 'sequential' as const,
          exercises: [],
          restBetweenExercises: 60
        },
        {
          id: 'circuit-1',
          name: 'Speed Circuit',
          category: 'conditioning' as const,
          flow: 'circuit' as const,
          exercises: [],
          restBetweenExercises: 75,
          rounds: 3
        },
        {
          id: 'cooldown-1',
          name: 'Recovery',
          category: 'cooldown' as const,
          flow: 'sequential' as const,
          exercises: [],
          restBetweenExercises: 30
        }
      ]
    };
    
    return templates[template as keyof typeof templates] || [];
  };

  // Block handlers
  const handleUpdateBlocks = (newBlocks: WorkoutBlock[]) => {
    if (selectedTemplateType === 'weekly') {
      setDailyBlocks(prev => ({
        ...prev,
        [currentDay]: newBlocks
      }));
    } else {
      setBlocks(newBlocks);
    }
  };

  // Weekly day management
  const handleDaySelect = (day: string) => {
    setCurrentDay(day);
  };

  const handleToggleRestDay = (day: string) => {
    setRestDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
    
    // If marking as rest day, clear any blocks for that day
    if (!restDays[day]) {
      setDailyBlocks(prev => ({
        ...prev,
        [day]: []
      }));
    }
  };

  const handleCopyDay = (fromDay: string, toDay: string) => {
    const fromBlocks = dailyBlocks[fromDay] || [];
    if (fromBlocks.length === 0) {
      toast({
        title: 'Nothing to copy',
        description: `${fromDay.charAt(0).toUpperCase() + fromDay.slice(1)} has no blocks to copy`,
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Deep copy blocks with new IDs
    const copiedBlocks = fromBlocks.map(block => ({
      ...block,
      id: `${block.id}-copy-${Date.now()}`,
      exercises: block.exercises.map(ex => ({
        ...ex,
        instanceId: `${ex.instanceId || ex.id}-copy-${Date.now()}`
      }))
    }));

    setDailyBlocks(prev => ({
      ...prev,
      [toDay]: copiedBlocks
    }));

    // Clear rest day status when copying blocks
    setRestDays(prev => ({
      ...prev,
      [toDay]: false
    }));

    toast({
      title: 'Day copied successfully',
      description: `Copied ${fromBlocks.length} block(s) from ${fromDay} to ${toDay}`,
      status: 'success',
      duration: 3000,
    });
  };

  // Athlete assignment handler
  const handleAthleteSelection = (athleteIds: string[]) => {
    setSelectedAthleteIds(athleteIds);
  };

  // Save handlers
  const handleSave = async (action: 'save' | 'save_template' | 'save_assign' = 'save') => {
    try {
      setIsSaving(true);
      
      // Helper function to extract exercises from blocks
      const extractExercisesFromBlocks = (blockList: WorkoutBlock[]): Exercise[] => {
        return blockList.flatMap(block => 
          block.exercises.map(exercise => ({
            id: exercise.id || `${exercise.name}-${Date.now()}`,
            name: exercise.name,
            category: exercise.category || block.category,
            description: exercise.description || '',
            sets: exercise.sets || '',
            reps: exercise.reps || '',
            weight: exercise.weight || '',
            distance: exercise.distance || '',
            rest: exercise.rest || block.restBetweenExercises?.toString() || '',
            rpe: exercise.rpe || '',
            notes: exercise.notes || '',
            contacts: exercise.contacts || '',
            intensity: exercise.intensity || '',
            direction: exercise.direction || '',
            movement_notes: exercise.movement_notes || ''
          }))
        );
      };

      // Calculate total exercises for better description
      let totalExercises = 0;
      let allBlocks: WorkoutBlock[] = [];
      
      if (selectedTemplateType === 'weekly') {
        allBlocks = Object.values(dailyBlocks).flat();
        totalExercises = allBlocks.reduce((total, block) => total + block.exercises.length, 0);
      } else {
        allBlocks = blocks;
        totalExercises = blocks.reduce((total, block) => total + block.exercises.length, 0);
      }

      let savedWorkout;
      
      if (selectedTemplateType === 'monthly') {
        // Monthly plans are saved in training_plans table, not workouts table
        const planData = {
          name: workoutName,
          description: `Monthly training plan with ${monthlyPlanWeeks.filter(w => !w.is_rest_week).length} training weeks`,
          month: date ? new Date(date).getMonth() + 1 : new Date().getMonth() + 1,
          year: date ? new Date(date).getFullYear() : new Date().getFullYear(),
          weeks: monthlyPlanWeeks
        };
        
        if (isEditing && editWorkoutId) {
          // Update existing monthly plan
          savedWorkout = await api.monthlyPlans.update(editWorkoutId, planData);
        } else {
          // Create new monthly plan
          savedWorkout = await api.monthlyPlans.create(planData);
        }
        
        // Assign to athletes if selected
        if (selectedAthleteIds.length > 0) {
          const startDate = date || new Date().toISOString().split('T')[0];
          await api.monthlyPlanAssignments.assign(savedWorkout.id, selectedAthleteIds, startDate);
        }
        
        // 🔧 FIX: Mark weekly workouts as templates when used in monthly plans
        // This ensures they don't show up in regular workout lists
        const weeklyWorkoutIds = monthlyPlanWeeks
          .filter(week => !week.is_rest_week && week.workout_id)
          .map(week => week.workout_id);
        
        if (weeklyWorkoutIds.length > 0) {
          try {
            // Mark each weekly workout as a template
            await Promise.all(
              weeklyWorkoutIds.map(async (workoutId) => {
                return api.workouts.markAsTemplate(workoutId, true);
              })
            );
            console.log(`✅ Marked ${weeklyWorkoutIds.length} weekly workouts as templates`);
          } catch (templateError) {
            console.error('Warning: Failed to mark weekly workouts as templates:', templateError);
            // Don't fail the entire save operation for this
          }
        }
      } else {
        // Regular workouts (single or weekly)
        const workoutData: any = {
          name: workoutName,
          type: selectedTemplateType,
          template_type: selectedTemplateType,
          date: !isTemplateMode ? date : null,
          time: !isTemplateMode ? time : null,
          duration: duration || null,
          location: workoutLocation || null,
          is_template: isTemplateMode || action === 'save_template', // 🔧 FIX: Use isTemplateMode state from toggle
          is_block_based: true,
          blocks: selectedTemplateType === 'weekly' ? dailyBlocks : blocks, // Store as proper JSON, not string
          block_version: 1,
          description: `${selectedTemplateType.charAt(0).toUpperCase() + selectedTemplateType.slice(1)} workout with ${allBlocks.length} block${allBlocks.length !== 1 ? 's' : ''} and ${totalExercises} exercise${totalExercises !== 1 ? 's' : ''}`,
          exercises: selectedTemplateType === 'single' ? extractExercisesFromBlocks(blocks) : [] // Add exercises for single workouts
        };

        if (isEditing && editWorkoutId) {
          savedWorkout = await api.workouts.update(editWorkoutId, workoutData as any);
        } else {
          savedWorkout = await api.workouts.create(workoutData as any);
        }

        // Assign to athletes if selected
        if (selectedAthleteIds.length > 0) {
          await api.athleteWorkouts.assign(savedWorkout.id, selectedAthleteIds);
        }
      }

      toast({
        title: isEditing 
          ? (selectedTemplateType === 'monthly' ? 'Monthly plan updated!' : 'Workout updated!') 
          : (selectedTemplateType === 'monthly' ? 'Monthly plan created!' : 'Workout created!'),
        description: (isTemplateMode || action === 'save_template')
          ? 'Saved as template for future use'
          : selectedAthleteIds.length > 0
          ? `Assigned to ${selectedAthleteIds.length} athlete(s)`
          : 'Successfully saved',
        status: 'success',
        duration: 4000,
      });

      // Navigate to appropriate page based on what was created
      if (selectedTemplateType === 'monthly') {
        navigate('/coach/training-plans');
      } else {
        navigate('/coach/workouts');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: 'Error saving workout',
        description: error instanceof Error ? error.message : 'Please try again',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Load weekly workouts for monthly plans
  const loadWeeklyWorkouts = useCallback(async () => {
    if (selectedTemplateType !== 'monthly') return;
    
    try {
      setLoadingWeeklyWorkouts(true);
      // Load all workouts and filter for weekly ones
      const allWorkouts = await api.workouts.getAll();
      const weeklyWorkouts = allWorkouts.filter(workout => 
        workout.template_type === 'weekly' && 
        (workout.is_template || workout.name.toLowerCase().includes('weekly'))
      );
      setAvailableWeeklyWorkouts(weeklyWorkouts);
    } catch (error) {
      console.error('Error loading weekly workouts:', error);
      toast({
        title: 'Error loading weekly workouts',
        description: 'Failed to load available weekly workouts for monthly plan',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoadingWeeklyWorkouts(false);
    }
  }, [selectedTemplateType, toast]);

  // Load weekly workouts when template type changes to monthly
  useEffect(() => {
    if (selectedTemplateType === 'monthly') {
      loadWeeklyWorkouts();
    }
  }, [selectedTemplateType, loadWeeklyWorkouts]);

  // Load workout data if editing
  useEffect(() => {
    if (editWorkoutId) {
      loadWorkoutForEditing(editWorkoutId);
    }
  }, [editWorkoutId]);

  const loadWorkoutForEditing = async (workoutId: string) => {
    try {
      setIsLoadingWorkout(true);
      
      // First try to fetch from workouts table
      let { data: workout, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();
      
      // If not found in workouts, try training_plans table (for monthly plans)
      if (error?.code === 'PGRST116') { // Row not found error
        const { data: monthlyPlan, error: planError } = await supabase
          .from('training_plans')
          .select('*')
          .eq('id', workoutId)
          .single();
        
        if (planError) throw planError;
        
        if (monthlyPlan) {
          // Convert monthly plan to workout-like structure for form
          workout = {
            id: monthlyPlan.id,
            name: monthlyPlan.name,
            description: monthlyPlan.description,
            template_type: 'monthly',
            is_template: false,
            // Convert plan data back to form structure
            date: monthlyPlan.start_date,
            location: null,
            time: null,
            duration: null,
            is_block_based: false,
            blocks: null
          };
          
          // Load the weeks structure
          if (monthlyPlan.weeks_structure) {
            const weeks = monthlyPlan.weeks_structure.map((workoutId: string | null, index: number) => ({
              week_number: index + 1,
              workout_id: workoutId || '',
              is_rest_week: workoutId === null
            }));
            setMonthlyPlanWeeks(weeks);
          }
        }
      } else if (error) {
        throw error;
      }
      
      if (workout) {
        // Populate form with workout data
        setWorkoutName(workout.name || '');
        setSelectedTemplateType(workout.template_type as 'single' | 'weekly' | 'monthly' || 'single');
        setDate(workout.date || '');
        setTime(workout.time || '');
        setDuration(workout.duration || '');
        setWorkoutLocation(workout.location || '');
        setIsTemplateMode(workout.is_template || false);
        
        // Set a default template for editing mode - this ensures step 1 validation passes
        setSelectedTemplate('scratch'); // Indicate this is an existing workout being edited
        
        // Handle block-based workout data
        if (workout.is_block_based && workout.blocks) {
          try {
            const blocks = typeof workout.blocks === 'string' 
              ? JSON.parse(workout.blocks) 
              : workout.blocks;
            
            if (workout.template_type === 'weekly') {
              // For weekly workouts, blocks are stored per day
              setDailyBlocks(blocks || {
                monday: [], tuesday: [], wednesday: [], thursday: [], 
                friday: [], saturday: [], sunday: []
              });
            } else {
              // For single workouts
              setBlocks(Array.isArray(blocks) ? blocks : []);
            }
          } catch (error) {
            console.error('Error parsing workout blocks:', error);
          }
        }
        
        // Load athlete assignments if not a template
        if (!workout.is_template) {
          try {
            const { data: assignments, error: assignmentError } = await supabase
              .from('athlete_workouts')
              .select('athlete_id')
              .eq('workout_id', workoutId);
            
            if (assignmentError) throw assignmentError;
            
            const athleteMap: Record<string, Athlete> = {};
            const athleteIds: string[] = [];
            
            if (assignments && assignments.length > 0) {
              assignments.forEach(assignment => {
                if (assignment.athlete_id) {
                  athleteIds.push(assignment.athlete_id);
                  // You might want to load full athlete details here
                  athleteMap[assignment.athlete_id] = {
                    id: assignment.athlete_id,
                    name: `Athlete ${assignment.athlete_id}`, // Placeholder
                    event: 'N/A',
                    avatar: ''
                  };
                }
              });
            }
            
            setSelectedAthletes(athleteMap);
            setSelectedAthleteIds(athleteIds);
          } catch (error) {
            console.error('Error loading athlete assignments:', error);
          }
        }
        
        toast({
          title: 'Workout loaded for editing',
          description: `Editing "${workout.name}"`,
          status: 'info',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      toast({
        title: 'Error loading workout',
        description: 'Could not load workout data for editing.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoadingWorkout(false);
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1TemplateSelection
            selectedTemplateType={selectedTemplateType}
            onTemplateTypeSelect={handleTemplateTypeSelect}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            workoutName={workoutName}
            onWorkoutNameChange={setWorkoutName}
          />
        );
      case 2:
        // Monthly plans: Weekly Schedule Builder
        if (selectedTemplateType === 'monthly') {
          return (
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="xl" color={textColor} mb={2}>
                  Weekly Builder
                </Heading>
                <Text fontSize="lg" color={subtitleColor}>
                  Build your monthly training plan by selecting weekly workout templates for each week.
                </Text>
              </Box>
              
              {/* Weekly Schedule Builder */}
              <Box>
                <VStack align="stretch" spacing={4}>
                  {/* Real Weekly Workout Selector */}
                  <WeeklyWorkoutSelector
                    weeks={monthlyPlanWeeks}
                    availableWorkouts={availableWeeklyWorkouts}
                    loading={loadingWeeklyWorkouts}
                    onChange={setMonthlyPlanWeeks}
                    maxWeeks={6}
                  />
                </VStack>
              </Box>
            </VStack>
          );
        }
        
        // Regular workflow for single/weekly
        return (
          <VStack spacing={6} align="stretch">
            {/* Header for Step 2 */}
            <Box>
              <Heading size="xl" color={textColor} mb={2}>
                Build Your Workout Structure
              </Heading>
              <Text fontSize="lg" color={subtitleColor}>
                Add blocks to create your workout. Each block can have different training styles.
                {selectedTemplateType === 'weekly' && currentDay && (
                  <Text mt={1} fontWeight="medium">Currently building: {currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}</Text>
                )}
              </Text>
            </Box>

            {selectedTemplateType === 'weekly' && (
              <WeeklyDaySelector
                currentDay={currentDay}
                onDaySelect={handleDaySelect}
                dailyBlocks={dailyBlocks}
                restDays={restDays}
                onToggleRestDay={handleToggleRestDay}
                onCopyDay={handleCopyDay}
              />
            )}
            <Step2BlockBuilder
              blocks={selectedTemplateType === 'weekly' ? dailyBlocks[currentDay] : blocks}
              onUpdateBlocks={handleUpdateBlocks}
              templateType={selectedTemplateType}
              currentDay={selectedTemplateType === 'weekly' ? currentDay : undefined}
              selectedTemplate={selectedTemplate}
            />
          </VStack>
        );
      case 3:
        // Monthly plans: Plan Details with Calendar/Time Picker
        if (selectedTemplateType === 'monthly') {
          return (
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="xl" color={textColor} mb={2}>
                  Name & Schedule
                </Heading>
                <Text fontSize="lg" color={subtitleColor}>
                  Set the plan name, details, and training schedule for your monthly plan.
                </Text>
              </Box>
              
              {/* Plan Details */}
              <Card bg={cardBg} borderColor={borderColor} position="relative">
                <CardBody>
                  {/* Save as Template Toggle - Top Right Corner */}
                  <HStack spacing={2} position="absolute" top={4} right={4} zIndex={1}>
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Save as Template</Text>
                    <Switch
                      id="monthly-template-mode"
                      isChecked={isTemplateMode}
                      onChange={(e) => setIsTemplateMode(e.target.checked)}
                      colorScheme="green"
                      size="md"
                    />
                  </HStack>
                  
                  {/* Name and Description in 2 columns */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={2}>
                    <FormControl>
                      <FormLabel>Plan Name</FormLabel>
                      <Input
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        placeholder="e.g., January Training Block"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Description (Optional)</FormLabel>
                      <Textarea
                        value={workoutLocation} // Using location field to store description
                        onChange={(e) => setWorkoutLocation(e.target.value)}
                        placeholder="Describe the goals and focus of this monthly plan..."
                        rows={3}
                        resize="vertical"
                      />
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              <Divider />

              {/* Calendar & Time Picker */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <VStack spacing={2} align="start">
                      <Heading size="md" color={textColor}>
                        Training Schedule
                      </Heading>
                      <Text fontSize="sm" color={subtitleColor}>
                        {isTemplateMode ? "Optional for templates" : "Select the start date for your monthly plan"}
                      </Text>
                    </VStack>

                    {/* Show date/time picker only if not creating a template */}
                    {!isTemplateMode && (
                      <Box w="100%" overflow="hidden">
                        <DateTimePicker
                          selectedDates={date ? [date] : []}
                          selectedStartTime={time}
                          isMultiSelect={false}
                          onDateSelect={(dates) => setDate(dates[0] || '')}
                          onTimeSelect={(startTime) => setTime(startTime)}
                        />
                      </Box>
                    )}

                    {/* Show message when creating template */}
                    {isTemplateMode && (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <Text fontSize="sm">
                          Templates don't require specific dates. Athletes can schedule them when assigned.
                        </Text>
                      </Alert>
                    )}
                  </VStack>
                </CardBody>
              </Card>
              
              {/* Monthly Plan Summary */}
              <Card bg={summaryBg} borderColor={summaryBorder}>
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold" color={textColor}>Monthly Plan Summary</Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      4-week training plan with {monthlyPlanWeeks.filter(w => !w.is_rest_week).length} training weeks
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      Weekly schedule configured in Step 2
                    </Text>
                    {isTemplateMode && (
                      <Badge colorScheme="green">Will be saved as template</Badge>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          );
        }
        
        // Regular workflow for single/weekly: Exercise Assignment
        return (
          <VStack spacing={6} align="stretch">
            {selectedTemplateType === 'weekly' && (
              <WeeklyDaySelector
                currentDay={currentDay}
                onDaySelect={handleDaySelect}
                dailyBlocks={dailyBlocks}
                restDays={restDays}
                onToggleRestDay={handleToggleRestDay}
                onCopyDay={handleCopyDay}
              />
            )}
            <Step3ExerciseAssignment
              blocks={selectedTemplateType === 'weekly' ? dailyBlocks[currentDay] : blocks}
              onUpdateBlocks={handleUpdateBlocks}
              templateType={selectedTemplateType}
              currentDay={selectedTemplateType === 'weekly' ? currentDay : undefined}
            />
          </VStack>
        );
      case 4:
        // Monthly plans: Assign Athletes (was Step 5)
        if (selectedTemplateType === 'monthly') {
          return (
            <Step5AthleteAssignment
              templateType={selectedTemplateType}
              selectedAthletes={selectedAthleteIds}
              onAthleteSelection={handleAthleteSelection}
              workoutName={workoutName}
            />
          );
        }
        
        // Regular workflow: Plan Details
        return (
          <Step4Schedule
            templateType={selectedTemplateType}
            date={date}
            time={time}
            location={workoutLocation}
            onDateChange={setDate}
            onTimeChange={setTime}
            onLocationChange={setWorkoutLocation}
            duration={duration}
            onDurationChange={setDuration}
            isTemplate={isTemplateMode}
            onIsTemplateChange={setIsTemplateMode}
            workoutName={workoutName}
            onWorkoutNameChange={setWorkoutName}
            blocks={blocks}
            dailyBlocks={dailyBlocks}
          />
        );
      case 5:
        // Only for single/weekly workflows
        if (selectedTemplateType !== 'monthly') {
          return (
            <Step5AthleteAssignment
              templateType={selectedTemplateType}
              selectedAthletes={selectedAthleteIds}
              onAthleteSelection={handleAthleteSelection}
              workoutName={workoutName}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <Box w="100%" position="relative" bg={bgColor} minH="100vh">
      {/* Top Navigation Bar - Fixed positioned with sidebar offset */}
      <Box 
        position="fixed" 
        top={0} 
        left={`${sidebarWidth}px`}
        right={0} 
        zIndex={1000}
        bg={cardBg} 
        borderBottom="1px" 
        borderColor={borderColor} 
        shadow="sm"
        transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <VStack spacing={0} align="stretch">
          {/* Progress Bar - Full Width at Top */}
          <Progress 
            value={(currentStep / getWorkflowSteps(selectedTemplateType).length) * 100} 
            colorScheme="blue" 
            size="sm"
            bg={useColorModeValue('gray.100', 'gray.700')}
            borderRadius={0}
          />
          
          <Box py={4} px={6}>
            <VStack spacing={4} align="stretch">
              {/* Back Arrow and Step Navigation on Same Line */}
              <HStack spacing={6} justify="space-between" w="100%" align="center">
                <IconButton
                  icon={<ArrowLeft size={20} />}
                  variant="ghost"
                  aria-label="Go back"
                  onClick={() => navigate('/coach/workouts')}
                  size="sm"
                />
                
                {/* Step Navigation - Centered */}
                <HStack spacing={6} justify="center" flex="1">
                  {getWorkflowSteps(selectedTemplateType).map((step, index) => {
                    const stepColor = currentStep === step.id 
                      ? "blue.500" 
                      : completedSteps.has(step.id) 
                      ? "green.500" 
                      : textColor;
                    
                    return (
                      <HStack 
                        key={step.id}
                        spacing={2}
                        cursor="pointer"
                        onClick={() => handleStepClick(step.id)}
                        opacity={step.id > currentStep && !completedSteps.has(step.id - 1) ? 0.5 : 1}
                        color={stepColor}
                        fontWeight="normal"
                        fontSize="xs"
                        transition="all 0.2s"
                        _hover={{
                          color: step.id <= currentStep || completedSteps.has(step.id - 1) ? "blue.500" : undefined
                        }}
                      >
                        <Text>{step.id}</Text>
                        <Text>{step.shortTitle}</Text>
                        {index < getWorkflowSteps(selectedTemplateType).length - 1 && (
                          <Box color={stepColor}>
                            <ArrowRight size={14} />
                          </Box>
                        )}
                      </HStack>
                    );
                  })}
                </HStack>
                
                {/* Empty space for balance */}
                <Box w="40px" />
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* Main Content Area - Simple structure like old creator */}
      <Box 
        position="relative" 
        w="100%" 
        pb="220px" 
        px={6} 
        pt="10px"
        bg={bgColor} 
        overflow="auto"
      >
        <Card bg="transparent" borderColor={borderColor} minH="600px" maxW="7xl" mx="auto">
          <CardBody p={8}>
            {renderCurrentStep()}
          </CardBody>
        </Card>
      </Box>

      {/* Bottom Navigation Bar - Fixed positioned with sidebar offset */}
      <Box 
        position="fixed" 
        bottom={0} 
        left={`${sidebarWidth}px`}
        right={0} 
        zIndex={999}
        bg={cardBg} 
        borderTop="1px" 
        borderColor={borderColor} 
        shadow="sm"
        p={6}
        transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <Flex justify="space-between" align="center" maxW="100%" mx="auto">
          <Button
            leftIcon={<ArrowLeft size={16} />}
            variant="outline"
            onClick={handlePrevious}
            isDisabled={currentStep === 1}
            size="lg"
          >
            Previous
          </Button>
          
          <Button
            rightIcon={currentStep === getWorkflowSteps(selectedTemplateType).length ? <Save size={16} /> : <ArrowRight size={16} />}
            colorScheme="blue"
            onClick={currentStep === getWorkflowSteps(selectedTemplateType).length ? () => handleSave('save') : handleNext}
            isDisabled={!validateStep(currentStep)}
            isLoading={currentStep === getWorkflowSteps(selectedTemplateType).length ? isSaving : false}
            size="lg"
            minW="120px"
          >
            {currentStep === getWorkflowSteps(selectedTemplateType).length ? 'Save' : 'Continue'}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default NewWorkoutCreator; 