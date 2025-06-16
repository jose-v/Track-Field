import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  Progress,
  IconButton,
  Badge,
  Checkbox,
  Select,
  useColorModeValue,
  Spinner,
  Center,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Target } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, type EnhancedWorkoutData } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import WorkoutCreatorNavigation from '../WorkoutCreatorNavigation';

// Lazy load step components to improve initial load time
const Step1WorkoutDetails = lazy(() => import('./Step1WorkoutDetails').then(module => ({ default: module.default })));
const Step2ExercisePlanning = lazy(() => import('./Step2ExercisePlanning').then(module => ({ default: module.default })));
const Step3AthleteAssignment = lazy(() => import('./Step3AthleteAssignment').then(module => ({ default: module.default })));
const Step4ReviewSave = lazy(() => import('./Step4ReviewSave').then(module => ({ default: module.default })));

// Mock data
const MOCK_EXERCISES = [
  { id: 'ex1', name: 'Barbell Squats', category: 'Lift', description: 'Compound lower body exercise targeting quads, glutes, and hamstrings.' },
  { id: 'ex2', name: 'Push-ups', category: 'Bodyweight', description: 'Upper body exercise targeting chest, shoulders, and triceps.' },
  { id: 'ex3', name: 'Running Sprints (100m)', category: 'Run Interval', description: 'High-intensity short distance running.' },
  { id: 'ex4', name: 'Plank', category: 'Core', description: 'Isometric core strength exercise.' },
  { id: 'ex5', name: 'Box Jumps', category: 'Plyometric', description: 'Explosive jump onto a raised platform.' },
];

const WORKOUT_CREATION_STEPS = [
  { 
    id: 1, 
    title: 'Workout Details', 
    shortTitle: 'Details',
    description: 'Name, type, and template settings'
  },
  { 
    id: 2, 
    title: 'Exercise Planning', 
    shortTitle: 'Exercises',
    description: 'Select exercises and plan workouts'
  },
  { 
    id: 3, 
    title: 'Athlete Assignment', 
    shortTitle: 'Athletes',
    description: 'Assign workout to team members'
  },
  { 
    id: 4, 
    title: 'Review & Save', 
    shortTitle: 'Review',
    description: 'Review and finalize workout'
  }
];

interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface SelectedExercise extends Exercise {
  instanceId: string;
  sets?: string;
  reps?: string;
  weight?: string;
  distance?: string;
  rest?: string;
  rpe?: string;
  notes?: string;
}

interface Athlete {
  id: string;
  name: string;
  event: string;
  avatar: string;
}

const WorkoutCreatorWireframe: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if we're editing a workout
  const editWorkoutId = searchParams.get('edit');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);
  
  // Theme-aware colors - moved to top level to fix Hooks rule violations
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const statsBg = useColorModeValue('blue.50', 'blue.900');
  const navBg = useColorModeValue('white', 'gray.800');

  // Sidebar state
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

  // Step navigation
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1 state - aligned with database schema
  const [workoutName, setWorkoutName] = useState('');
  const [templateType, setTemplateType] = useState<'single' | 'weekly'>('weekly');
  const [workoutType, setWorkoutType] = useState('Strength');
  const [date, setDate] = useState(''); // Use single date field as per schema
  const [time, setTime] = useState(''); // Use single time field as per schema  
  const [duration, setDuration] = useState(''); // Add duration field
  const [location, setLocation] = useState('');
  const [isTemplate, setIsTemplate] = useState(false); // Add isTemplate state
  
  // Lazy initialize complex state objects
  const [selectedExercises, setSelectedExercises] = useState<Record<string, SelectedExercise[]>>(() => ({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  }));
  
  // Step 2 state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentDay, setCurrentDay] = useState('monday');
  
  const [restDays, setRestDays] = useState<Record<string, boolean>>(() => ({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  }));
  
  const [copyFromDay, setCopyFromDay] = useState('');
  const [copyToDay, setCopyToDay] = useState('');
  
  // Step 3 state
  const [selectedAthletes, setSelectedAthletes] = useState<Record<string, Athlete>>({});
  const [athleteSearchTerm, setAthleteSearchTerm] = useState('');
  
  // Custom exercises state
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  // Load exercises from database
  const loadExercises = async () => {
    if (!user?.id) return;
    
    setIsLoadingExercises(true);
    try {
      const { data, error } = await supabase
        .from('exercise_library')
        .select('*')
        .or(`is_system_exercise.eq.true,and(user_id.eq.${user.id}),and(is_public.eq.true,is_system_exercise.eq.false)`)
        .order('is_system_exercise', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include created_by_name
      const transformedData = (data || []).map(exercise => ({
        ...exercise,
        created_by_name: exercise.is_system_exercise ? 'System' : 'User'
      }));
      
      setCustomExercises(transformedData);
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast({
        title: 'Error loading exercises',
        description: 'Could not load exercises. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingExercises(false);
    }
  };

  // Load exercises on component mount
  useEffect(() => {
    loadExercises();
  }, [user?.id]);
  
  // Add loading states
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Add coach-specific draft functionality state
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isDraftMode, setIsDraftMode] = useState(false);

  // Load workout data if editing
  useEffect(() => {
    if (editWorkoutId) {
      setIsEditing(true);
      setIsLoadingWorkout(true);
      loadWorkoutForEditing(editWorkoutId);
    } else if (isEditing) {
      // Reset edit mode when query param is cleared
      setIsEditing(false);
      resetFormState();
    }
  }, [editWorkoutId]);

  // Cleanup effect to prevent late setState calls
  useEffect(() => {
    return () => {
      // Component cleanup - cancel any pending async operations
      setIsLoadingWorkout(false);
      setIsLoadingAthletes(false);
    };
  }, []);

  const loadWorkoutForEditing = async (workoutId: string) => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Check if this is a draft
        const isDraft = data.is_draft === true;
        
        // Set draft mode and ID if this is a draft
        if (isDraft) {
          setCurrentDraftId(data.id);
          setIsDraftMode(true);
        }
        
        // Populate form with workout data
        setWorkoutName(data.name || '');
        setWorkoutType(data.type || 'Strength');
        setTemplateType(data.template_type as 'single' | 'weekly' || 'weekly');
        setDate(data.date || '');
        setTime(data.time || '');
        setDuration(data.duration || '');
        setLocation(data.location || '');
        setIsTemplate(data.is_template || false);
        
        // Handle exercises and weekly plan data
        if (data.exercises && Array.isArray(data.exercises)) {
          // Check if this is weekly plan data stored in exercises (for drafts)
          if (data.template_type === 'weekly' && data.exercises.length > 0 && data.exercises[0].day) {
            // This is weekly plan data stored in exercises field
            const weeklyExercises: Record<string, SelectedExercise[]> = {};
            const weeklyRestDays: Record<string, boolean> = {};
            
            data.exercises.forEach((dayPlan: { day: string; exercises: any[]; isRestDay: boolean }) => {
              weeklyExercises[dayPlan.day] = (dayPlan.exercises || []).map((ex: any) => ({
                ...ex,
                instanceId: `${ex.id || ex.name}-${Date.now()}-${Math.random()}`
              }));
              weeklyRestDays[dayPlan.day] = dayPlan.isRestDay || false;
            });
            
            setSelectedExercises(prev => ({ ...prev, ...weeklyExercises }));
            setRestDays(prev => ({ ...prev, ...weeklyRestDays }));
          } else if (data.template_type === 'single') {
            // For single day workouts, put exercises in Monday
            setSelectedExercises(prev => ({
              ...prev,
              monday: data.exercises.map((ex: any) => ({
                ...ex,
                instanceId: `${ex.id || ex.name}-${Date.now()}-${Math.random()}`
              }))
            }));
          }
        }
        
        // Load weekly plan if exists (for non-draft workouts)
        if (data.weekly_plan && Array.isArray(data.weekly_plan)) {
          const weeklyExercises: Record<string, SelectedExercise[]> = {};
          const weeklyRestDays: Record<string, boolean> = {};
          
          data.weekly_plan.forEach((dayPlan: { day: string; exercises: any[]; isRestDay: boolean }) => {
            weeklyExercises[dayPlan.day] = (dayPlan.exercises || []).map((ex: any) => ({
              ...ex,
              instanceId: `${ex.id || ex.name}-${Date.now()}-${Math.random()}`
            }));
            weeklyRestDays[dayPlan.day] = dayPlan.isRestDay || false;
          });
          
          setSelectedExercises(prev => ({ ...prev, ...weeklyExercises }));
          setRestDays(prev => ({ ...prev, ...weeklyRestDays }));
        }
        
        // Load athlete assignments (only for non-draft workouts)
        if (!isDraft) {
          const { data: assignments } = await supabase
            .from('athlete_workouts')
            .select('athlete_id')
            .eq('workout_id', workoutId);
            
          if (assignments && assignments.length > 0) {
            const athleteIds = assignments.map(a => a.athlete_id);
            // Load athlete details
            const { data: athleteData } = await supabase
              .from('athletes')
              .select('id, first_name, last_name')
              .in('id', athleteIds);
              
            if (athleteData) {
              const athleteMap: Record<string, Athlete> = {};
              athleteData.forEach(athlete => {
                athleteMap[athlete.id] = {
                  id: athlete.id,
                  name: `${athlete.first_name} ${athlete.last_name}`,
                  event: 'N/A', // We don't have event info in this context
                  avatar: '' // No avatar in this context
                };
              });
              setSelectedAthletes(athleteMap);
            }
          }
        }
        
        toast({
          title: isDraft ? 'Draft Loaded' : 'Workout Loaded',
          description: `${isDraft ? 'Editing draft' : 'Editing'} "${data.name}"`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      toast({
        title: 'Error Loading Workout',
        description: 'Could not load workout data for editing.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingWorkout(false);
    }
  };

  // Helper function to reset form to initial state
  const resetFormState = () => {
    setWorkoutName('');
    setTemplateType('weekly');
    setWorkoutType('Strength');
    setDate('');
    setTime('');
    setDuration('');
    setLocation('');
    setSelectedExercises({
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    });
    setRestDays({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    });
    setSelectedAthletes({});
    setCurrentStep(1);
    setIsEditing(false);
    setIsTemplate(false);
    
    // Clear draft-related state
    setCurrentDraftId(null);
    setIsDraftMode(false);
    setLastSavedTime(null);
    
    // Clear any existing auto-save timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(null);
    }
  };

  // Handle cancel action - with confirmation for unsaved changes
  const handleCancel = () => {
    if (isEditing) {
      // For editing, just navigate back without confirmation
      navigate(getWorkoutsRoute());
    } else {
      // For new workouts, could add confirmation if there are unsaved changes
      const hasUnsavedChanges = workoutName.trim() || Object.values(selectedExercises).some(exercises => exercises.length > 0);
      
      if (hasUnsavedChanges) {
        if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
          resetFormState();
          navigate(getWorkoutsRoute());
        }
      } else {
        navigate(getWorkoutsRoute());
      }
    }
  };

  // Helper function to get the correct workouts route based on user role
  const getWorkoutsRoute = () => {
    // Ensure userProfile exists and has a valid role
    if (!userProfile || !userProfile.role) {
      // If no profile or role, try to determine from user context
      // For safety, default to athlete route rather than coach route
      return '/athlete/workouts';
    }
    
    switch (userProfile.role) {
      case 'coach':
        return '/coach/workouts';
      case 'athlete':
        return '/athlete/workouts';
      case 'team_manager':
        return '/coach/workouts'; // Team managers use coach routes
      default:
        // More cautious fallback - default to athlete rather than coach
        return '/athlete/workouts';
    }
  };

  // Navigation functions
  const goToStep = (step: number) => {
    if (step >= 1 && step <= WORKOUT_CREATION_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const goToNextStep = () => {
    if (currentStep < WORKOUT_CREATION_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Exercise functions
  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: SelectedExercise = {
      ...exercise,
      instanceId: `${exercise.id}-${Date.now()}-${Math.random()}`,
      sets: '3',
      reps: '10',
      weight: '',
      distance: '',
      rest: '',
      rpe: '',
      notes: '',
    };
    setSelectedExercises(prev => ({
      ...prev,
      [currentDay]: [...(prev[currentDay] || []), newExercise]
    }));
  };

  const handleRemoveExercise = (instanceId: string) => {
    setSelectedExercises(prev => ({
      ...prev,
      [currentDay]: prev[currentDay].filter(ex => ex.instanceId !== instanceId)
    }));
  };

  const handleUpdateExercise = (instanceId: string, field: string, value: string) => {
    setSelectedExercises(prev => ({
      ...prev,
      [currentDay]: prev[currentDay].map(ex => 
        ex.instanceId === instanceId ? { ...ex, [field]: value } : ex
      )
    }));
  };

  const handleReorderExercises = (reorderedExercises: SelectedExercise[]) => {
    setSelectedExercises(prev => ({
      ...prev,
      [currentDay]: reorderedExercises
    }));
  };

  // Handle weekly plan updates for drag and drop
  const handleUpdateWeeklyPlan = (newWeeklyPlan: Array<{day: string, exercises: SelectedExercise[], isRestDay: boolean}>) => {
    const updatedExercises: Record<string, SelectedExercise[]> = {};
    
    newWeeklyPlan.forEach(dayData => {
      updatedExercises[dayData.day] = dayData.exercises;
    });
    
    setSelectedExercises(prev => ({
      ...prev,
      ...updatedExercises
    }));
  };

  // Handle single day exercise updates for drag and drop
  const handleUpdateSingleDayExercises = (newExercises: SelectedExercise[]) => {
    setSelectedExercises(prev => ({
      ...prev,
      [currentDay]: newExercises
    }));
  };

  // Handle rest day toggle
  const handleToggleRestDay = (day: string, isRest: boolean) => {
    setRestDays(prev => ({
      ...prev,
      [day]: isRest
    }));
  };

  // Handle copy exercises from one day to another
  const handleCopyExercises = (fromDay: string, toDay: string) => {
    const exercisesToCopy = selectedExercises[fromDay] || [];
    if (exercisesToCopy.length === 0) return;

    // Create copies with new instance IDs
    const copiedExercises = exercisesToCopy.map(exercise => ({
      ...exercise,
      instanceId: `${exercise.id}-${Date.now()}-${Math.random()}`
    }));

    setSelectedExercises(prev => ({
      ...prev,
      [toDay]: [...(prev[toDay] || []), ...copiedExercises]
    }));
  };

  // Athlete functions
  const handleAthleteSelection = (athlete: Athlete) => {
    setSelectedAthletes(prev => {
      const newSelected = { ...prev };
      if (newSelected[athlete.id]) {
        delete newSelected[athlete.id];
      } else {
        newSelected[athlete.id] = athlete;
      }
      return newSelected;
    });
  };

  const handleClearAllAthletes = () => {
    setSelectedAthletes({});
  };

  // Custom exercise functions
  const handleAddCustomExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('exercise_library')
      .insert([{
        ...exerciseData,
        user_id: user.id,
        is_system_exercise: false,
        is_public: false, // Private by default
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select('*')
      .single();

    if (error) throw error;
    
    // Transform data to include created_by_name
    const transformedData = {
      ...data,
      created_by_name: 'You'
    };
    
    setCustomExercises(prev => [transformedData, ...prev]);
  };

  const handleUpdateCustomExercise = async (id: string, exerciseData: Omit<Exercise, 'id'>) => {
    const { data, error } = await supabase
      .from('exercise_library')
      .update({
        ...exerciseData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    
    // Transform data to include created_by_name
    const transformedData = {
      ...data,
      created_by_name: 'You'
    };
    
    setCustomExercises(prev => 
      prev.map(ex => ex.id === id ? transformedData : ex)
    );
  };

  const handleDeleteCustomExercise = async (id: string) => {
    const { error } = await supabase
      .from('exercise_library')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setCustomExercises(prev => prev.filter(ex => ex.id !== id));
  };

  // Get warnings for review step
  const getWarnings = () => {
    const warnings: string[] = [];
    
    if (Object.values(selectedExercises).flat().length === 0) {
      warnings.push('No exercises added to workout');
    }
    
    // Only show athlete assignment warning for coaches and team managers when NOT creating templates
    // Athletes are expected to create workouts for themselves
    if (Object.keys(selectedAthletes).length === 0 && userProfile?.role !== 'athlete' && !isTemplate) {
      warnings.push('No athletes assigned to this workout');
    }
    
    return warnings;
  };

  const currentStepInfo = WORKOUT_CREATION_STEPS[currentStep - 1];

  // Add coach-specific auto-save functionality
  useEffect(() => {
    // Only enable auto-save for coaches when in the workout creator
    if (userProfile?.role === 'coach' && isDraftMode && !isEditing) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      const timer = setTimeout(() => {
        handleSaveDraft();
      }, 30000); // 30 seconds
      
      setAutoSaveTimer(timer);
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [workoutName, templateType, workoutType, selectedExercises, isDraftMode, userProfile?.role]);

  // Cleanup auto-save timer when component unmounts
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        setAutoSaveTimer(null);
      }
    };
  }, []);

  // Add coach-specific draft saving function
  const handleSaveDraft = async () => {
    // Only allow coaches to save drafts
    if (userProfile?.role !== 'coach') {
      toast({
        title: 'Draft save unavailable',
        description: 'Only coaches can save drafts.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save drafts.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!workoutName.trim()) {
      toast({
        title: 'Workout name required',
        description: 'Please enter a workout name before saving as draft.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const draftData = {
        id: currentDraftId || undefined, // Include ID if updating existing draft
        user_id: user.id,
        name: workoutName,
        description: `Draft workout - ${templateType === 'weekly' ? 'Weekly Training Plan' : 'Single Day Workout'}`,
        type: workoutType,
        template_type: templateType,
        location: location,
        date: date && date.trim() !== '' ? date : null,
        time: time && time.trim() !== '' ? time : null,
        duration: duration && duration.trim() !== '' ? duration : null,
        is_template: isTemplate,
        is_draft: true,
        exercises: templateType === 'single' ? (selectedExercises.monday || []) : [],
        weekly_plan: templateType === 'weekly' ? Object.keys(selectedExercises).map(day => ({
          day,
          exercises: selectedExercises[day] || [],
          isRestDay: restDays[day] || false
        })) : undefined
      };
      
      const savedDraft = await api.workouts.saveDraft(draftData);
      
      // Update state to reflect that we're now working with this draft
      setCurrentDraftId(savedDraft.id);
      setLastSavedTime(new Date());
      setIsDraftMode(true);
      
      toast({
        title: currentDraftId ? 'Draft Updated' : 'Draft Saved',
        description: currentDraftId 
          ? 'Your workout draft has been updated.' 
          : 'Your workout progress has been saved as a draft.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: 'Error saving draft',
        description: error instanceof Error ? error.message : 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Enhanced save workout function with coach-specific Save + New and Save + Done options
  const handleSaveWorkout = async (action: 'save' | 'save_new' | 'save_done' = 'save') => {
    if (!workoutName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a workout name.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const workoutData: EnhancedWorkoutData = {
        name: workoutName,
        type: workoutType,
        template_type: templateType,
        date: date,
        time: time,
        duration: duration,
        location: location,
        is_template: isTemplate,
        description: templateType === 'weekly' ? 'Weekly Training Plan' : 'Single Day Workout',
        exercises: templateType === 'single' ? (selectedExercises.monday || []) : [],
        weekly_plan: templateType === 'weekly' ? Object.keys(selectedExercises).map(day => ({
          day,
          exercises: selectedExercises[day] || [],
          isRestDay: restDays[day] || false
        })) : undefined
      };

      // Use atomic transaction for update operations
      const athleteIds = Object.keys(selectedAthletes);
      
      let savedWorkout;
      
      // If we have a draft (coaches only), promote it to a final workout
      if (currentDraftId && isDraftMode && userProfile?.role === 'coach') {
        savedWorkout = await api.workouts.promoteDraft(currentDraftId, workoutData);
      } else if (isEditing && editWorkoutId) {
        // Start a Supabase transaction for atomic updates
        const { data, error } = await supabase.rpc('update_workout_with_athletes', {
          p_workout_id: editWorkoutId,
          p_workout_data: {
            name: workoutData.name,
            type: workoutData.type,
            template_type: workoutData.template_type,
            date: workoutData.date,
            time: workoutData.time,
            duration: workoutData.duration,
            location: workoutData.location,
            description: workoutData.description,
            is_template: workoutData.is_template,
            exercises: workoutData.exercises,
            weekly_plan: workoutData.weekly_plan
          },
          p_athlete_ids: athleteIds
        });
        
        if (error) {
          // Fallback to manual transaction if RPC doesn't exist
          await updateWorkoutWithAthletesManually(editWorkoutId, workoutData, athleteIds);
        }
        savedWorkout = { id: editWorkoutId };
      } else {
        // Create new workout with atomic assignment
        const newWorkout = await api.workouts.createEnhanced(workoutData);
        savedWorkout = newWorkout;
        
        // For athletes creating their own workouts, automatically assign to themselves
        if (userProfile?.role === 'athlete' && newWorkout?.id) {
          await api.athleteWorkouts.assign(newWorkout.id, [userProfile.id]);
        }
        
        // Assign athletes in the same operation context
        if (athleteIds.length > 0) {
          await api.athleteWorkouts.assign(newWorkout.id, athleteIds);
        }
      }

      // Clear draft state since workout is now finalized (coaches only)
      if (currentDraftId && userProfile?.role === 'coach') {
        setCurrentDraftId(null);
        setIsDraftMode(false);
      }

      toast({
        title: isEditing ? 'Workout Updated Successfully!' : 'Workout Saved Successfully!',
        description: `"${workoutName}" has been ${isEditing ? 'updated' : 'created'} and ${athleteIds.length > 0 ? `assigned to ${athleteIds.length} athlete(s)` : 'is ready to be assigned'}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Handle different save actions (coach-specific)
      if (userProfile?.role === 'coach') {
        switch (action) {
          case 'save_new':
            // Reset form and start new workout
            resetFormState();
            setCurrentStep(1);
            break;
          case 'save_done':
            // Navigate to training plans for coaches
            navigate('/coach/training-plans');
            break;
          default:
            // Regular save - navigate to workouts list
            navigate(getWorkoutsRoute());
            break;
        }
      } else {
        // For non-coaches, always navigate back to workouts list
        navigate(getWorkoutsRoute());
      }

    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: 'Error',
        description: isEditing ? 'There was an error updating the workout.' : 'There was an error creating the workout.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Manual atomic transaction fallback
  const updateWorkoutWithAthletesManually = async (
    workoutId: string, 
    workoutData: EnhancedWorkoutData, 
    athleteIds: string[]
  ) => {
    // Prepare the data to store based on whether we're dealing with a draft or regular workout
    let exercisesToStore: any[] = workoutData.exercises || [];
    
    // For weekly workouts, store weekly_plan data in exercises field (since weekly_plan column doesn't exist)
    if (workoutData.template_type === 'weekly' && workoutData.weekly_plan) {
      exercisesToStore = workoutData.weekly_plan;
    }
    
    // Use Supabase transaction pattern
    const { error: updateError } = await supabase
      .from('workouts')
      .update({
        name: workoutData.name,
        type: workoutData.type,
        template_type: workoutData.template_type,
        date: workoutData.date,
        time: workoutData.time,
        duration: workoutData.duration,
        location: workoutData.location,
        description: workoutData.description,
        is_template: workoutData.is_template,
        exercises: exercisesToStore, // Store exercises or weekly plan data
        // Note: not storing weekly_plan since that column doesn't exist
      })
      .eq('id', workoutId);
      
    if (updateError) throw updateError;
    
    // Only proceed with athlete assignment if workout update succeeded and this isn't a draft
    if (athleteIds.length > 0) {
      // Clear existing assignments first
      const { error: deleteError } = await supabase
        .from('athlete_workouts')
        .delete()
        .eq('workout_id', workoutId);
        
      if (deleteError) throw deleteError;
      
      // Add new assignments
      await api.athleteWorkouts.assign(workoutId, athleteIds);
    }
  };

  // Load user profile and athletes when component mounts
  useEffect(() => {
    const loadUserAndAthletes = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setUserProfile({ ...profile, id: user.id });
        }

        // Load athletes based on user role
        if (profile?.role === 'coach') {
          await loadCoachAthletes(user.id);
        } else if (profile?.role === 'team_manager') {
          await loadAllAthletes();
        }
        // Athletes don't need to load other athletes since they create workouts for themselves
      } catch (error) {
        console.error('Error loading user and athletes:', error);
      }
    };

    loadUserAndAthletes();
  }, []);

  const loadCoachAthletes = async (coachId: string) => {
    setIsLoadingAthletes(true);
    try {
      // Try the API method first, but catch and handle specific errors
      let athleteData = [];
      try {
        athleteData = await api.athletes.getByCoach(coachId);
      } catch (error: any) {
        console.warn('Could not load athletes via getByCoach, trying alternative approach:', error);
        
        // Fallback: Try to get athlete IDs directly and then fetch athlete profiles
        try {
          const athleteIds = await api.athletes.getAthleteIdsByCoach(coachId);
          if (athleteIds.length > 0) {
            // Get athlete profiles directly from profiles table
            const { data: profiles, error: profileError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, avatar_url')
              .in('id', athleteIds)
              .eq('role', 'athlete');
            
            if (!profileError && profiles) {
              athleteData = profiles.map(profile => ({
                id: profile.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
                avatar_url: profile.avatar_url,
                events: [] // Default empty events
              }));
            }
          }
        } catch (fallbackError) {
          // If all methods fail, we'll just continue with empty array
        }
      }
      
      // Transform API data to match component interface
      const transformedAthletes: Athlete[] = athleteData.map(athlete => ({
        id: athlete.id,
        name: athlete.full_name || `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Unknown Athlete',
        event: athlete.events && athlete.events.length > 0 ? athlete.events.join(', ') : 'No events',
        avatar: athlete.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${athlete.id}`
      }));
      
      setAthletes(transformedAthletes);
    } catch (error) {
      console.error('Error loading coach athletes:', error);
      // Only show toast for critical errors, not database view issues
      if (error instanceof Error && !error.message.includes('relation') && !error.message.includes('view')) {
        toast({
          title: 'Failed to Load Athletes',
          description: 'Could not load your assigned athletes. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      setAthletes([]);
    } finally {
      setIsLoadingAthletes(false);
    }
  };

  const loadAllAthletes = async () => {
    setIsLoadingAthletes(true);
    try {
      // Try the API method first, but catch and handle specific errors
      let athleteData = [];
      try {
        athleteData = await api.athletes.getAll();
      } catch (error: any) {
        console.warn('Could not load athletes via getAll, trying alternative approach:', error);
        
        // Fallback: Get all athlete profiles directly from profiles table
        try {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .eq('role', 'athlete');
          
          if (!profileError && profiles) {
            athleteData = profiles.map(profile => ({
              id: profile.id,
              first_name: profile.first_name,
              last_name: profile.last_name,
              full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
              avatar_url: profile.avatar_url,
              events: [] // Default empty events
            }));
          }
        } catch (fallbackError) {
          // If all methods fail, we'll just continue with empty array
        }
      }
      
      // Transform API data to match component interface
      const transformedAthletes: Athlete[] = athleteData.map(athlete => ({
        id: athlete.id,
        name: athlete.full_name || `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'Unknown Athlete',
        event: athlete.events && athlete.events.length > 0 ? athlete.events.join(', ') : 'No events',
        avatar: athlete.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${athlete.id}`
      }));
      
      setAthletes(transformedAthletes);
    } catch (error) {
      console.error('Error loading all athletes:', error);
      // Only show toast for critical errors, not database view issues
      if (error instanceof Error && !error.message.includes('relation') && !error.message.includes('view')) {
        toast({
          title: 'Failed to Load Athletes',
          description: 'Could not load athlete data. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      setAthletes([]);
    } finally {
      setIsLoadingAthletes(false);
    }
  };

  const renderStepHeader = () => (
    <VStack spacing={0} align="stretch" mb={3}>
      {/* Step Header Card - with fixed top margin to account for always-visible progress bar */}
      <Card 
        variant="outline" 
        shadow="none" 
        mb={2} 
        mt="76px" // Adjusted for always-visible progress bar (64px nav + 8px progress + 4px padding)
        mx={6} 
        bg={cardBg} 
        borderColor={borderColor}
      >
        <CardBody p={1} minH="40px" display="flex" alignItems="center">
          <HStack justify="space-between" align="center" w="100%" spacing={3}>
            <HStack spacing={2}>
              <IconButton
                icon={<ArrowLeft size={16} />}
                variant="ghost"
                aria-label={isEditing ? "Cancel editing" : "Back to list"}
                onClick={handleCancel}
                color={textColor}
                _hover={{ bg: 'blue.100' }}
                size="xs"
              />
              <VStack align="start" spacing={0}>
                <Heading size="md" color="blue.600">
                  {isEditing ? `Edit: ${currentStepInfo.title}` : currentStepInfo.title}
                </Heading>
                <Text fontSize="sm" color={subtitleColor}>
                  {isEditing ? `Editing "${workoutName}" - ${currentStepInfo.description}` : currentStepInfo.description}
                </Text>
              </VStack>
            </HStack>
            
            {/* Workout Stats */}
            <HStack spacing={4} p={1} bg={statsBg} borderRadius="md">
              <VStack spacing={0} align="center">
                <Text fontSize="md" fontWeight="bold" color="blue.600">
                  {Object.values(selectedExercises).flat().length}
                </Text>
                <Text fontSize="xs" color={subtitleColor}>
                  Total Exercises
                </Text>
              </VStack>
              <VStack spacing={0} align="center">
                <Text fontSize="md" fontWeight="bold" color="blue.600">
                  {Object.values(selectedExercises).flat().reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0)}
                </Text>
                <Text fontSize="xs" color={subtitleColor}>
                  Total Sets
                </Text>
              </VStack>
              <VStack spacing={0} align="center">
                <Text fontSize="md" fontWeight="bold" color="blue.600">
                  ~{Object.values(selectedExercises).flat().length * 3}
                </Text>
                <Text fontSize="xs" color={subtitleColor}>
                  Minutes
                </Text>
              </VStack>
            </HStack>
          </HStack>
        </CardBody>
      </Card>
    </VStack>
  );

  const renderStepNavigation = () => (
    <Box 
      position="fixed" 
      bottom="0" 
      left={`${sidebarWidth}px`}
      right="0"
      bg={bgColor} 
      borderTop="2px solid" 
      borderTopColor={borderColor} 
      p={6} 
      px={6}
      zIndex="999"
      transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <HStack justify="space-between" align="center" maxW="100%" mx="auto">
        <HStack spacing={3}>
          <Button
            leftIcon={<ChevronLeft size={20} />}
            variant="outline"
            size="lg"
            onClick={goToPreviousStep}
            isDisabled={currentStep === 1}
            borderWidth="2px"
            borderColor={borderColor}
            color={textColor}
            _hover={{ bg: 'blue.100', borderColor: 'blue.300' }}
          >
            Previous
          </Button>
          
          {/* Coach-specific draft controls */}
          {userProfile?.role === 'coach' && (
            <Tooltip
              label="Please enter a workout name to save draft"
              isDisabled={workoutName.trim() !== ''}
              placement="top"
              hasArrow
              bg="orange.500"
              color="white"
            >
              <Button
                variant="outline"
                size="lg"
                onClick={handleSaveDraft}
                colorScheme="teal"
                borderWidth="2px"
                isDisabled={workoutName.trim() === ''}
                _hover={{ 
                  transform: workoutName.trim() === '' ? "none" : "scale(1.05)"
                }}
                transition="all 0.2s"
                fontWeight="bold"
                px={6}
                opacity={workoutName.trim() === '' ? 0.4 : 1}
                cursor={workoutName.trim() === '' ? 'not-allowed' : 'pointer'}
              >
                Save Draft
              </Button>
            </Tooltip>
          )}
        </HStack>
        
        {/* Coach-specific draft status (moved to center if needed) */}
        {userProfile?.role === 'coach' && isDraftMode && lastSavedTime && (
          <Text fontSize="xs" color="gray.500">
            Draft saved {lastSavedTime.toLocaleTimeString()}
          </Text>
        )}
        
        {/* Progress Dots */}
        <HStack spacing={4}>
          {WORKOUT_CREATION_STEPS.map((step) => (
            <VStack key={step.id} spacing={1} align="center">
              <Box
                w={6}
                h={6}
                borderRadius="full"
                bg={step.id === currentStep ? 'blue.500' : step.id < currentStep ? 'green.500' : 'gray.300'}
                cursor="pointer"
                onClick={() => step.id <= currentStep && goToStep(step.id)}
                transition="all 0.3s"
                _hover={{ transform: step.id <= currentStep ? 'scale(1.2)' : 'none' }}
                border="2px solid"
                borderColor={step.id === currentStep ? 'blue.300' : 'gray.300'}
                position="relative"
              >
                {step.id < currentStep && (
                  <Text
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    ✓
                  </Text>
                )}
                {step.id === currentStep && (
                  <Text
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {step.id}
                  </Text>
                )}
              </Box>
              <Text 
                fontSize="xs" 
                color={step.id === currentStep ? 'blue.600' : step.id < currentStep ? 'green.600' : subtitleColor}
                fontWeight={step.id === currentStep ? 'bold' : 'medium'}
                textAlign="center"
                maxW="60px"
                lineHeight="tight"
              >
                {step.shortTitle}
              </Text>
            </VStack>
          ))}
        </HStack>

        {currentStep < WORKOUT_CREATION_STEPS.length ? (
          <HStack spacing={3}>
            {isEditing && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleCancel}
                borderWidth="2px"
                borderColor="gray.300"
                color={textColor}
                _hover={{ 
                  bg: 'gray.100',
                  borderColor: 'gray.400'
                }}
                transition="all 0.2s"
                px={6}
              >
                Cancel
              </Button>
            )}
            <Tooltip
              label={
                currentStep === 1 && workoutName.trim() === '' 
                  ? "Please enter a workout name to continue"
                  : currentStep === 2 && Object.values(selectedExercises).flat().length === 0
                  ? "Add at least 1 exercise to continue"
                  : ""
              }
              isDisabled={
                (currentStep === 1 && workoutName.trim() !== '') ||
                (currentStep === 2 && Object.values(selectedExercises).flat().length > 0) ||
                (currentStep !== 1 && currentStep !== 2)
              }
              placement="top"
              hasArrow
              bg="orange.500"
              color="white"
            >
              <Button
                rightIcon={<ChevronRight size={20} />}
                colorScheme="blue"
                size="lg"
                onClick={goToNextStep}
                isDisabled={
                  (currentStep === 1 && workoutName.trim() === '') ||
                  (currentStep === 2 && Object.values(selectedExercises).flat().length === 0)
                }
                borderWidth="2px"
                _hover={{ 
                  transform: 
                    (currentStep === 1 && workoutName.trim() === '') ||
                    (currentStep === 2 && Object.values(selectedExercises).flat().length === 0)
                      ? "none" 
                      : "scale(1.05)"
                }}
                transition="all 0.2s"
                fontWeight="bold"
                px={8}
                opacity={
                  (currentStep === 1 && workoutName.trim() === '') ||
                  (currentStep === 2 && Object.values(selectedExercises).flat().length === 0)
                    ? 0.4 
                    : 1
                }
                cursor={
                  (currentStep === 1 && workoutName.trim() === '') ||
                  (currentStep === 2 && Object.values(selectedExercises).flat().length === 0)
                    ? 'not-allowed' 
                    : 'pointer'
                }
              >
                Continue
              </Button>
            </Tooltip>
          </HStack>
        ) : (
          <HStack spacing={3}>
            {isEditing && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleCancel}
                borderWidth="2px"
                borderColor="gray.300"
                color={textColor}
                _hover={{ 
                  bg: 'gray.100',
                  borderColor: 'gray.400'
                }}
                transition="all 0.2s"
                px={6}
              >
                Cancel
              </Button>
            )}
            
            {/* Coach-specific save buttons */}
            {userProfile?.role === 'coach' ? (
              <>
                {/* Save + New Button */}
                <Button
                  rightIcon={<Target size={20} />}
                  colorScheme="blue"
                  variant="outline"
                  size="lg"
                  onClick={() => handleSaveWorkout('save_new')}
                  borderWidth="2px"
                  _hover={{ 
                    transform: "scale(1.05)"
                  }}
                  transition="all 0.2s"
                  fontWeight="bold"
                  px={6}
                >
                  Save + New
                </Button>
                
                {/* Save + Done Button */}
                <Button
                  rightIcon={<Save size={20} />}
                  colorScheme="green"
                  size="lg"
                  onClick={() => handleSaveWorkout('save_done')}
                  borderWidth="2px"
                  _hover={{ 
                    transform: "scale(1.05)"
                  }}
                  transition="all 0.2s"
                  fontWeight="bold"
                  px={8}
                >
                  Save + Done
                </Button>
              </>
            ) : (
              /* Regular save button for non-coaches */
              <Button
                rightIcon={<Save size={20} />}
                colorScheme="green"
                size="lg"
                onClick={() => handleSaveWorkout()}
                borderWidth="2px"
                _hover={{ 
                  transform: "scale(1.05)"
                }}
                transition="all 0.2s"
                fontWeight="bold"
                px={8}
              >
                {isEditing ? 'Update Workout' : 'Save Workout'}
              </Button>
            )}
          </HStack>
        )}
      </HStack>
    </Box>
  );

  const renderCurrentStep = () => {
    const LoadingFallback = () => (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color={textColor}>Loading step content...</Text>
        </VStack>
      </Center>
    );

    switch (currentStep) {
      case 1:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Step1WorkoutDetails
              workoutName={workoutName}
              setWorkoutName={setWorkoutName}
              templateType={templateType}
              setTemplateType={setTemplateType}
              workoutType={workoutType}
              setWorkoutType={setWorkoutType}
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              duration={duration}
              setDuration={setDuration}
              location={location}
              setLocation={setLocation}
              isTemplate={isTemplate}
              setIsTemplate={setIsTemplate}
            />
          </Suspense>
        );
      case 2:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Step2ExercisePlanning
              exercises={customExercises}
              selectedExercises={selectedExercises[currentDay] || []}
              onAddExercise={handleAddExercise}
              onRemoveExercise={handleRemoveExercise}
              onUpdateExercise={handleUpdateExercise}
              onReorderExercises={handleReorderExercises}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              currentDay={currentDay}
              setCurrentDay={setCurrentDay}
              templateType={templateType}
              isRestDay={restDays[currentDay]}
              customExercises={customExercises}
              onAddCustomExercise={handleAddCustomExercise}
              onUpdateCustomExercise={handleUpdateCustomExercise}
              onDeleteCustomExercise={handleDeleteCustomExercise}
              isLoadingExercises={isLoadingExercises}
              currentUserId={user?.id}
              onToggleRestDay={handleToggleRestDay}
              onCopyExercises={handleCopyExercises}
            />
          </Suspense>
        );
      case 3:
        return (
          <Suspense fallback={<LoadingFallback />}>
            {/* Check if coach is creating a template - if so, show disabled message */}
            {isTemplate && userProfile?.role === 'coach' ? (
              <Center h="400px">
                <VStack spacing={4}>
                  <Text color={textColor} fontSize="lg" fontWeight="semibold">Templates Don't Need Athletes</Text>
                  <Text color={subtitleColor} textAlign="center" maxW="400px">
                    You cannot assign athletes when creating a template. Templates are saved for future use and can be assigned to athletes later.
                  </Text>
                </VStack>
              </Center>
            ) : isLoadingAthletes ? (
              <Center h="400px">
                <VStack spacing={4}>
                  <Spinner size="xl" color="blue.500" thickness="4px" />
                  <Text color={textColor}>Loading athletes...</Text>
                </VStack>
              </Center>
            ) : athletes.length === 0 ? (
              <Center h="400px">
                <VStack spacing={4}>
                  <Text color={textColor} fontSize="lg" fontWeight="semibold">No Athletes Available</Text>
                  <Text color={subtitleColor} textAlign="center" maxW="400px">
                    {userProfile?.role === 'coach' 
                      ? 'You don\'t have any athletes assigned to you yet. Contact your team manager to get athletes assigned.'
                      : userProfile?.role === 'athlete'
                      ? 'Athletes cannot assign workouts to others. This workout will be saved for your own use.'
                      : 'No athletes found in the system. You can still create and save this workout.'
                    }
                  </Text>
                </VStack>
              </Center>
            ) : (
              <Step3AthleteAssignment
                athletes={athletes}
                selectedAthletes={selectedAthletes}
                onAthleteSelection={handleAthleteSelection}
                onClearAllAthletes={handleClearAllAthletes}
                searchTerm={athleteSearchTerm}
                setSearchTerm={setAthleteSearchTerm}
              />
            )}
          </Suspense>
        );
      case 4:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Step4ReviewSave
              workoutName={workoutName}
              templateType={templateType}
              workoutType={workoutType}
              selectedExercises={templateType === 'single' ? (selectedExercises.monday || []) : []}
              weeklyPlan={templateType === 'weekly' ? Object.keys(selectedExercises).map(day => ({
                day,
                exercises: selectedExercises[day] || [],
                isRestDay: restDays[day] || false
              })) : []}
              selectedAthletes={selectedAthletes}
              warnings={getWarnings()}
              onGoToStep={(step: number) => goToStep(step)}
              location={location}
              startDate={date}
              endDate={duration}
              onUpdateWeeklyPlan={handleUpdateWeeklyPlan}
              onUpdateSingleDayExercises={handleUpdateSingleDayExercises}
              isTemplate={isTemplate}
            />
          </Suspense>
        );
      default:
        return <Box>Unknown step</Box>;
    }
  };

  // Add early return for loading state
  if (isLoadingWorkout) {
    return (
      <Box w="100%" position="relative" bg={bgColor} minH="100vh">
        <Center h="100vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color={textColor} fontSize="lg">Loading workout for editing...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box w="100%" position="relative" bg={bgColor} minH="100vh">
      {/* Unified Navigation Component */}
      <WorkoutCreatorNavigation
        currentStep={currentStep}
        totalSteps={WORKOUT_CREATION_STEPS.length}
        steps={WORKOUT_CREATION_STEPS}
        onStepClick={goToStep}
        sidebarWidth={sidebarWidth}
      />
      
      {renderStepHeader()}
      
      {/* Step Content - with bottom padding to account for fixed bottom nav */}
      <Box position="relative" w="100%" pb="220px" px={6} bg={bgColor} overflow="auto">
        {renderCurrentStep()}
      </Box>

      {renderStepNavigation()}
    </Box>
  );
};

export default WorkoutCreatorWireframe; 