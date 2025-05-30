import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Container, VStack, HStack, Heading, Text, Button, Card, CardBody, CardHeader, Badge, SimpleGrid, Progress, Flex, Spacer, FormControl, FormLabel, Input, Textarea, Select, Stack, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, IconButton, Alert, AlertIcon, AlertTitle, AlertDescription, AvatarGroup, Avatar, useToast, Divider, Skeleton, SkeletonText, List, ListItem, Checkbox, RadioGroup, Radio, Tooltip, Tag, Grid, GridItem, Icon, InputGroup, InputLeftElement, TagCloseButton, useColorModeValue
} from '@chakra-ui/react';
import { Search, X, PlusCircle, GripVertical, Eye, Edit, Trash2, ArrowLeft, Users, ChevronLeft, ChevronRight, Save, Calendar, FileText, Dumbbell, Zap, Heart, User, Target, Clock, Copy, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRegClock } from 'react-icons/fa';

// --- 1. Define Types and Dummy Data ---

const WORKOUT_TYPES = [
  'Strength',
  'Running', 
  'Flexibility',
  'Recovery',
  'Custom'
];

const TEMPLATE_TYPES = [
  { value: 'single', label: 'Single Day Workout' },
  { value: 'weekly', label: 'Weekly Training Plan' }
];

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

// Step configuration for guided workflow
const WORKOUT_CREATION_STEPS = [
  { 
    id: 1, 
    title: 'Workout Details', 
    shortTitle: 'Details',
    description: 'Name, type, and template settings',
    tip: 'Give your workout a descriptive name and choose whether it\'s a single day or weekly plan.'
  },
  { 
    id: 2, 
    title: 'Exercise Planning', 
    shortTitle: 'Exercises',
    description: 'Select exercises and plan workouts',
    tip: 'Browse our exercise library and build your workout. For weekly plans, customize each day individually.'
  },
  { 
    id: 3, 
    title: 'Athlete Assignment', 
    shortTitle: 'Athletes',
    description: 'Assign workout to team members',
    tip: 'Choose which athletes will receive this workout template. You can search by name or event specialty.'
  },
  { 
    id: 4, 
    title: 'Review & Save', 
    shortTitle: 'Review',
    description: 'Review and finalize workout',
    tip: 'Review your workout and make final adjustments before saving. Click any section to edit quickly.'
  }
];

// Motion variants for step transitions
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

// Dummy athlete data for POC
const DUMMY_ATHLETES = [
  { id: 'ath1', name: 'Sarah Johnson', event: 'Sprint', avatar: 'https://bit.ly/sage-adebayo' },
  { id: 'ath2', name: 'Mike Chen', event: 'Distance', avatar: 'https://bit.ly/kent-c-dodds' },
  { id: 'ath3', name: 'Emma Davis', event: 'Hurdles', avatar: 'https://bit.ly/ryan-florence' },
  { id: 'ath4', name: 'James Wilson', event: 'Jumps', avatar: 'https://bit.ly/prosper-baba' },
  { id: 'ath5', name: 'Lisa Brown', event: 'Throws', avatar: 'https://bit.ly/code-beast' },
  { id: 'ath6', name: 'Alex Garcia', event: 'Sprint', avatar: 'https://bit.ly/sage-adebayo' },
  { id: 'ath7', name: 'Maria Lopez', event: 'Distance', avatar: 'https://bit.ly/kent-c-dodds' },
  { id: 'ath8', name: 'David Kim', event: 'Pole Vault', avatar: 'https://bit.ly/ryan-florence' },
  { id: 'ath9', name: 'Ashley White', event: 'Heptathlon', avatar: 'https://bit.ly/prosper-baba' },
  { id: 'ath10', name: 'Jordan Taylor', event: 'Decathlon', avatar: 'https://bit.ly/code-beast' },
];

const DUMMY_EXERCISES: Exercise[] = [
  { id: 'ex1', name: 'Barbell Squats', category: 'Lift', description: 'Compound lower body exercise targeting quads, glutes, and hamstrings.' },
  { id: 'ex2', name: 'Push-ups', category: 'Bodyweight', description: 'Upper body exercise targeting chest, shoulders, and triceps.' },
  { id: 'ex3', name: 'Running Sprints (100m)', category: 'Run Interval', description: 'High-intensity short distance running.' },
  { id: 'ex4', name: 'Plank', category: 'Core', description: 'Isometric core strength exercise.' },
  { id: 'ex5', name: 'Box Jumps', category: 'Plyometric', description: 'Explosive jump onto a raised platform.' },
  { id: 'ex6', name: 'Dynamic Warm-up Routine', category: 'Warm-up', description: 'Series of movements to prepare for exercise.' },
  { id: 'ex7', name: 'Static Stretching', category: 'Cool-down', description: 'Holding stretches to improve flexibility post-workout.' },
  { id: 'ex8', name: 'Kettlebell Swings', category: 'Lift', description: 'Full-body explosive exercise primarily targeting the posterior chain.' },
  { id: 'ex9', name: 'Burpees', category: 'Bodyweight', description: 'Full body exercise used in strength training and as an aerobic exercise.' },
  { id: 'ex10', name: 'High Knees', category: 'Drill', description: 'Running drill to improve form and leg speed.' },
  { id: 'ex11', name: 'Deadlifts', category: 'Lift', description: 'Compound exercise targeting the posterior chain, including glutes, hamstrings, and back.' },
  { id: 'ex12', name: 'Lunges', category: 'Bodyweight', description: 'Unilateral lower body exercise for quads, glutes, and hamstrings.' },
  { id: 'ex13', name: 'Interval Training (400m repeats)', category: 'Run Interval', description: 'Running workout involving repeated segments at a fast pace.' },
  { id: 'ex14', name: 'Russian Twists', category: 'Core', description: 'Core exercise targeting the obliques.' },
  { id: 'ex15', name: 'Depth Jumps', category: 'Plyometric', description: 'Advanced plyometric exercise involving stepping off a box and immediately jumping.' },
  { id: 'ex16', name: 'Foam Rolling', category: 'Cool-down', description: 'Self-myofascial release technique.' },
  { id: 'ex17', name: 'A-Skips', category: 'Drill', description: 'Running drill focusing on knee lift and coordination.' },
  { id: 'ex18', name: 'Bench Press', category: 'Lift', description: 'Upper body compound exercise primarily targeting the chest, shoulders, and triceps.' },
  { id: 'ex19', name: 'Pull-ups', category: 'Bodyweight', description: 'Upper body exercise targeting the back and biceps.' },
  { id: 'ex20', name: 'Tempo Run (20 min)', category: 'Run Interval', description: 'Sustained effort run at a comfortably hard pace.' },
];

const EXERCISE_CATEGORIES = ['All', ...new Set(DUMMY_EXERCISES.map(ex => ex.category))];

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
  notes?: string;
  weight?: string;
  distance?: string;
  rest?: string;
  rpe?: string;
}

interface DayWorkout {
  day: string;
  exercises: SelectedExercise[];
  isRestDay: boolean;
}

interface Athlete {
  id: string;
  name: string;
  event: string;
  avatar: string;
}

interface SavedWorkout {
  id: string;
  name: string;
  type: string;
  templateType: 'single' | 'weekly';
  // For single day workouts
  exercises?: SelectedExercise[];
  // For weekly plans
  weeklyPlan?: DayWorkout[];
  // Assigned athletes
  assignedAthletes: Athlete[];
  createdAt: Date;
  updatedAt: Date;
}

// --- 2. Main Workout Manager Component ---

const WorkoutCreatorPOC: React.FC = () => {
  const toast = useToast();
  
  // Navigation state
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  
  // Step management for guided workflow
  const [currentStep, setCurrentStep] = useState(1);
  const [stepDirection, setStepDirection] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Form state for create/edit
  const [workoutName, setWorkoutName] = useState('My New Workout');
  const [workoutType, setWorkoutType] = useState('Strength');
  const [templateType, setTemplateType] = useState<'single' | 'weekly'>('single');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<DayWorkout[]>([]);
  const [currentDay, setCurrentDay] = useState('monday');
  const [isEditing, setIsEditing] = useState(false);
  
  // Exercise browser state (moved from modal to inline)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tempSelectedExercises, setTempSelectedExercises] = useState<Record<string, Exercise>>({});
  
  // Athlete assignment state
  const { isOpen: isAthleteModalOpen, onOpen: onAthleteModalOpen, onClose: onAthleteModalClose } = useDisclosure();
  const [selectedAthletes, setSelectedAthletes] = useState<Record<string, Athlete>>({});
  const [workoutToAssign, setWorkoutToAssign] = useState<string | null>(null);
  const [athleteSearchTerm, setAthleteSearchTerm] = useState('');
  
  // Storage state (in-memory for POC)
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  
  const [exerciseLibrary] = useState<Exercise[]>(DUMMY_EXERCISES);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

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

  useEffect(() => {
    setIsLoadingLibrary(true);
    const timer = setTimeout(() => {
      setIsLoadingLibrary(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize weekly plan when template type changes
  useEffect(() => {
    if (templateType === 'weekly' && weeklyPlan.length === 0) {
      const initialWeeklyPlan: DayWorkout[] = DAYS_OF_WEEK.map(day => ({
        day: day.value,
        exercises: [],
        isRestDay: false
      }));
      setWeeklyPlan(initialWeeklyPlan);
    }
  }, [templateType, weeklyPlan.length]);

  // Get current day's workout for weekly plans
  const getCurrentDayWorkout = (): DayWorkout | undefined => {
    return weeklyPlan.find(day => day.day === currentDay);
  };

  // Get exercises for current context (single day or current day of weekly plan)
  const getCurrentExercises = (): SelectedExercise[] => {
    if (templateType === 'single') {
      return selectedExercises;
    } else {
      return getCurrentDayWorkout()?.exercises || [];
    }
  };

  // Update exercises for current context
  const updateCurrentExercises = (exercises: SelectedExercise[]) => {
    if (templateType === 'single') {
      setSelectedExercises(exercises);
    } else {
      setWeeklyPlan(prev => prev.map(day => 
        day.day === currentDay 
          ? { ...day, exercises }
          : day
      ));
    }
  };

  // Filter exercises based on search term and category
  const filteredExercises = useMemo(() => {
    return exerciseLibrary.filter(exercise => {
      const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [exerciseLibrary, searchTerm, selectedCategory]);

  // Reset form
  const resetForm = () => {
    setWorkoutName('My New Workout');
    setWorkoutType('Strength');
    setTemplateType('single');
    setSelectedExercises([]);
    setWeeklyPlan([]);
    setCurrentDay('monday');
    setIsEditing(false);
    setSelectedWorkoutId(null);
    setSearchTerm('');
    setSelectedCategory('All');
    setTempSelectedExercises({});
    setSelectedAthletes({});
    setWorkoutToAssign(null);
    setAthleteSearchTerm('');
    setCurrentStep(1);
    setStepDirection(0);
    setHasUnsavedChanges(false);
    // Clear any saved draft
    localStorage.removeItem('workout_draft');
  };

  // Navigation functions
  const goToCreateView = () => {
    resetForm();
    setCurrentView('create');
    
    // Check for existing draft
    const draft = localStorage.getItem('workout_draft');
    if (draft) {
      // Show option to load draft
      setTimeout(() => {
        const shouldLoad = window.confirm(
          'A draft workout was found. Would you like to continue where you left off?'
        );
        if (shouldLoad) {
          loadDraft();
        } else {
          localStorage.removeItem('workout_draft');
        }
      }, 500);
    }
  };

  const goToListView = () => {
    setCurrentView('list');
  };

  const goToDetailView = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
    setCurrentView('detail');
  };

  // Step navigation functions
  const goToStep = (step: number) => {
    if (step < 1 || step > WORKOUT_CREATION_STEPS.length) return;
    
    const direction = step > currentStep ? 1 : -1;
    setStepDirection(direction);
    setCurrentStep(step);
  };

  const goToNextStep = () => {
    if (currentStep < WORKOUT_CREATION_STEPS.length) {
      const validation = validateCurrentStep();
      if (validation.isValid) {
        goToStep(currentStep + 1);
      } else if (validation.message) {
        toast({
          title: "Please complete this step",
          description: validation.message,
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // Validation with better feedback
  const validateCurrentStep = (): { isValid: boolean; message?: string } => {
    switch (currentStep) {
      case 1: // Workout Details
        if (!workoutName.trim()) {
          return { isValid: false, message: "Please enter a workout name." };
        }
        return { isValid: true };
      
      case 2: // Exercise Planning
        if (templateType === 'single') {
          if (selectedExercises.length === 0) {
            return { isValid: false, message: "Please add at least one exercise to continue." };
          }
        } else {
          const hasAnyExercises = weeklyPlan.some(day => !day.isRestDay && day.exercises.length > 0);
          if (!hasAnyExercises) {
            return { isValid: false, message: "Please add exercises to at least one day of the week." };
          }
        }
        return { isValid: true };
      
      case 3: // Athlete Assignment (optional, no validation needed)
        return { isValid: true };
      
      case 4: // Review (no validation needed)
        return { isValid: true };
      
      default:
        return { isValid: true };
    }
  };

  const autoSave = () => {
    // Auto-save draft to localStorage for data safety
    const draftWorkout = {
      workoutName,
      workoutType,
      templateType,
      selectedExercises,
      weeklyPlan,
      currentDay,
      selectedAthletes,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('workout_draft', JSON.stringify(draftWorkout));
    setHasUnsavedChanges(false);
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('workout_draft');
    if (draft) {
      try {
        const draftWorkout = JSON.parse(draft);
        setWorkoutName(draftWorkout.workoutName || 'My New Workout');
        setWorkoutType(draftWorkout.workoutType || 'Strength');
        setTemplateType(draftWorkout.templateType || 'single');
        setSelectedExercises(draftWorkout.selectedExercises || []);
        setWeeklyPlan(draftWorkout.weeklyPlan || []);
        setCurrentDay(draftWorkout.currentDay || 'monday');
        setSelectedAthletes(draftWorkout.selectedAthletes || {});
        
        toast({
          title: "Draft Loaded",
          description: "Previous workout draft has been restored.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  };

  // Auto-save when form data changes
  useEffect(() => {
    if (currentView === 'create' && (workoutName !== 'My New Workout' || selectedExercises.length > 0 || weeklyPlan.length > 0)) {
      setHasUnsavedChanges(true);
      const timeoutId = setTimeout(autoSave, 2000); // Auto-save after 2 seconds of inactivity
      return () => clearTimeout(timeoutId);
    }
  }, [workoutName, workoutType, templateType, selectedExercises, weeklyPlan, selectedAthletes]);

  const startEditingWorkout = (workout: SavedWorkout) => {
    setWorkoutName(workout.name);
    setWorkoutType(workout.type);
    setTemplateType(workout.templateType);
    if (workout.templateType === 'single') {
      setSelectedExercises(workout.exercises || []);
      setWeeklyPlan([]);
    } else {
      setSelectedExercises([]);
      setWeeklyPlan(workout.weeklyPlan || []);
    }
    
    // Load assigned athletes
    const athleteMap: Record<string, Athlete> = {};
    workout.assignedAthletes.forEach(athlete => {
      athleteMap[athlete.id] = athlete;
    });
    setSelectedAthletes(athleteMap);
    
    setSelectedWorkoutId(workout.id);
    setIsEditing(true);
    setCurrentStep(1); // Start from step 1 when editing
    setCurrentView('create');
  };

  // Exercise selection functions
  const handleSelectExercise = (exercise: Exercise) => {
    setTempSelectedExercises(prev => {
      const newSelected = { ...prev };
      if (newSelected[exercise.id]) {
        delete newSelected[exercise.id];
      } else {
        newSelected[exercise.id] = exercise;
      }
      return newSelected;
    });
  };

  const handleAddSelectedExercises = () => {
    const exercisesToAdd = Object.values(tempSelectedExercises);
    const newSelectedExercises = exercisesToAdd.map(ex => ({
      ...ex,
      instanceId: `${ex.id}-${Date.now()}-${Math.random()}`,
      sets: '3',
      reps: '10',
      notes: '',
    }));
    
    const currentExercises = getCurrentExercises();
    updateCurrentExercises([...currentExercises, ...newSelectedExercises]);
    setTempSelectedExercises({}); // Clear temp selection
  };

  const handleRemoveExercise = (instanceIdToRemove: string) => {
    const currentExercises = getCurrentExercises();
    updateCurrentExercises(currentExercises.filter(ex => ex.instanceId !== instanceIdToRemove));
  };

  const handleExerciseDetailChange = (instanceId: string, field: keyof SelectedExercise, value: string) => {
    const currentExercises = getCurrentExercises();
    updateCurrentExercises(
      currentExercises.map(ex => 
        ex.instanceId === instanceId ? { ...ex, [field]: value } : ex
      )
    );
  };

  // Toggle rest day for weekly plans
  const toggleRestDay = (day: string) => {
    setWeeklyPlan(prev => prev.map(dayWorkout => 
      dayWorkout.day === day 
        ? { ...dayWorkout, isRestDay: !dayWorkout.isRestDay, exercises: dayWorkout.isRestDay ? dayWorkout.exercises : [] }
        : dayWorkout
    ));
  };

  // Athlete assignment functions
  const openAthleteModal = (workoutId?: string) => {
    if (workoutId) {
      setWorkoutToAssign(workoutId);
      const workout = savedWorkouts.find(w => w.id === workoutId);
      if (workout) {
        const athleteMap: Record<string, Athlete> = {};
        workout.assignedAthletes.forEach(athlete => {
          athleteMap[athlete.id] = athlete;
        });
        setSelectedAthletes(athleteMap);
      }
    } else {
      // For create/edit view - no existing assignment
      setWorkoutToAssign(null);
      setSelectedAthletes({});
    }
    setAthleteSearchTerm('');
    onAthleteModalOpen();
  };

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

  const handleSaveAthleteAssignment = () => {
    const selectedAthleteList = Object.values(selectedAthletes);
    
    if (workoutToAssign) {
      // Update existing workout
      setSavedWorkouts(prev => 
        prev.map(workout => 
          workout.id === workoutToAssign 
            ? { ...workout, assignedAthletes: selectedAthleteList, updatedAt: new Date() }
            : workout
        )
      );
      toast({
        title: "Success",
        description: `Workout assigned to ${selectedAthleteList.length} athlete${selectedAthleteList.length !== 1 ? 's' : ''}!`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
    // For create/edit view, we'll handle this in the save workout function
    
    onAthleteModalClose();
  };

  const filteredAthletes = useMemo(() => {
    return DUMMY_ATHLETES.filter(athlete =>
      athlete.name.toLowerCase().includes(athleteSearchTerm.toLowerCase()) ||
      athlete.event.toLowerCase().includes(athleteSearchTerm.toLowerCase())
    );
  }, [athleteSearchTerm]);

  // Save/update workout
  const handleSaveWorkout = () => {
    if (!workoutName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workout name.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Validate based on template type
    if (templateType === 'single') {
      if (selectedExercises.length === 0) {
        toast({
          title: "Error", 
          description: "Please add at least one exercise.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    } else {
      // For weekly plans, check if at least one day has exercises
      const hasAnyExercises = weeklyPlan.some(day => !day.isRestDay && day.exercises.length > 0);
      if (!hasAnyExercises) {
        toast({
          title: "Error",
          description: "Please add exercises to at least one day of the week.",
          status: "error", 
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    const now = new Date();
    const selectedAthleteList = Object.values(selectedAthletes);
    
    if (isEditing && selectedWorkoutId) {
      // Update existing workout
      setSavedWorkouts(prev => 
        prev.map(workout => 
          workout.id === selectedWorkoutId 
            ? { 
                ...workout, 
                name: workoutName, 
                type: workoutType, 
                templateType,
                exercises: templateType === 'single' ? selectedExercises : undefined,
                weeklyPlan: templateType === 'weekly' ? weeklyPlan : undefined,
                assignedAthletes: selectedAthleteList,
                updatedAt: now 
              }
            : workout
        )
      );
      toast({
        title: "Success",
        description: "Workout updated successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Create new workout
      const newWorkout: SavedWorkout = {
        id: `workout-${Date.now()}`,
        name: workoutName,
        type: workoutType,
        templateType,
        exercises: templateType === 'single' ? selectedExercises : undefined,
        weeklyPlan: templateType === 'weekly' ? weeklyPlan : undefined,
        assignedAthletes: selectedAthleteList,
        createdAt: now,
        updatedAt: now,
      };
      setSavedWorkouts(prev => [...prev, newWorkout]);
      toast({
        title: "Success",
        description: "Workout created successfully!",
        status: "success", 
        duration: 3000,
        isClosable: true,
      });
    }
    
    goToListView();
  };

  // Delete workout
  const handleDeleteWorkout = (workoutId: string) => {
    setSavedWorkouts(prev => prev.filter(w => w.id !== workoutId));
    toast({
      title: "Deleted",
      description: "Workout deleted successfully.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
    if (currentView === 'detail' && selectedWorkoutId === workoutId) {
      goToListView();
    }
  };

  // Get current workout for detail view
  const currentWorkout = selectedWorkoutId 
    ? savedWorkouts.find(w => w.id === selectedWorkoutId)
    : null;

  // --- 4. Step Components for Guided Workflow ---

  // Calculate workout load/statistics
  const getWorkoutStats = () => {
    if (templateType === 'single') {
      const totalExercises = selectedExercises.length;
      const estimatedTime = totalExercises * 3; // rough estimate: 3 min per exercise
      const totalSets = selectedExercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0);
      return { totalExercises, estimatedTime, totalSets };
    } else {
      const trainingDays = weeklyPlan.filter(d => !d.isRestDay).length;
      const totalExercises = weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0);
      const estimatedTime = totalExercises * 3; // total for week
      return { trainingDays, totalExercises, estimatedTime };
    }
  };

  // Get warnings for review step
  const getWorkoutWarnings = () => {
    const warnings: string[] = [];
    
    if (templateType === 'weekly') {
      weeklyPlan.forEach(day => {
        if (!day.isRestDay && day.exercises.length === 0) {
          const dayName = DAYS_OF_WEEK.find(d => d.value === day.day)?.label;
          warnings.push(`${dayName} has no exercises planned`);
        }
      });
    }
    
    if (templateType === 'single' && selectedExercises.length === 0) {
      warnings.push('No exercises added to workout');
    }
    
    if (Object.keys(selectedAthletes).length === 0) {
      warnings.push('No athletes assigned to this workout');
    }
    
    return warnings;
  };

  // Clear all selected athletes
  const clearAllAthletes = () => {
    setSelectedAthletes({});
  };

  // Copy exercises from one day to another (for weekly plans)
  const copyDayExercises = (fromDay: string, toDay: string) => {
    const fromDayWorkout = weeklyPlan.find(d => d.day === fromDay);
    if (!fromDayWorkout) return;
    
    setWeeklyPlan(prev => prev.map(day => 
      day.day === toDay 
        ? { 
            ...day, 
            exercises: fromDayWorkout.exercises.map(ex => ({
              ...ex,
              instanceId: `${ex.id}-${Date.now()}-${Math.random()}` // New instance ID
            })),
            isRestDay: false
          }
        : day
    ));
    
    toast({
      title: "Exercises Copied",
      description: `Copied ${fromDayWorkout.exercises.length} exercises to ${DAYS_OF_WEEK.find(d => d.value === toDay)?.label}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Enhanced Step 2 with better visual hierarchy and UX
  const renderStep2ExercisePlanning = () => {
    const stats = getWorkoutStats();
    const currentDayName = DAYS_OF_WEEK.find(d => d.value === currentDay)?.label || 'Day';
    const currentExercises = getCurrentExercises();
    const hasExercises = currentExercises.length > 0;
    
    return (
      <Box w="100%" mb={0}>
        {/* Two Column Main Panel */}
        {(templateType === 'single' || !getCurrentDayWorkout()?.isRestDay) ? (
          <HStack spacing={4} align="start" w="100%" height="800px" style={{ height: '800px' }}>
            {/* Left Panel: Exercise Library */}
            <Card flex="1" height="100%" variant="outline" shadow="md">
              <CardHeader pb={3}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                  <HStack>
                    <div style={{ fontSize: '24px' }}>🏋️</div>
                    <Heading size="lg" color="gray.700">Exercise Library</Heading>
                    </HStack>
                    
                    {Object.keys(tempSelectedExercises).length > 0 && (
                      <Button
                        size="md"
                        colorScheme="blue"
                        onClick={handleAddSelectedExercises}
                        leftIcon={<PlusCircle size={16} />}
                      >
                        Add Selected ({Object.keys(tempSelectedExercises).length})
                      </Button>
                    )}
                  </HStack>
                  
                  {/* Search */}
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none">
                      <Search size={20} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search exercises by name, category, or muscle group..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      borderWidth="1px"
                      _focus={{ borderColor: "blue.400", shadow: "sm" }}
                    />
                  </InputGroup>

                  {/* Category Filters */}
                  <HStack spacing={2} flexWrap="wrap">
                    {EXERCISE_CATEGORIES.map((category) => (
                      <Button
                        key={category}
                        size="sm"
                        variant={selectedCategory === category ? 'solid' : 'outline'}
                        colorScheme={selectedCategory === category ? 'blue' : 'gray'}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </HStack>
                </VStack>
              </CardHeader>
              
              <CardBody pt={0} flex="1" overflow="hidden" display="flex" flexDirection="column">
                {/* Exercise List */}
                <Box flex="1" overflow="auto" pr={2}>
                  {filteredExercises.length === 0 ? (
                    <VStack spacing={4} py={8} textAlign="center">
                      <div style={{ fontSize: '48px', opacity: 0.5 }}>🔍</div>
                      <Text color="gray.500" fontSize="md" fontWeight="medium">
                        No exercises found
                      </Text>
                      <Text color="gray.400" fontSize="sm">
                        Try adjusting your search or category filter
                      </Text>
                    </VStack>
                  ) : (
                    <VStack spacing={2} align="stretch">
                      {filteredExercises.map((exercise) => {
                        const isSelected = !!tempSelectedExercises[exercise.id];
                        const isAlreadyAdded = currentExercises.some(ex => ex.id === exercise.id);
                        
                        return (
                          <Card
                            key={exercise.id}
                            variant="outline"
                            bg={isSelected ? "blue.50" : isAlreadyAdded ? "green.50" : "white"}
                            borderColor={isSelected ? "blue.300" : isAlreadyAdded ? "green.300" : "gray.200"}
                            borderWidth="1px"
                            cursor={isAlreadyAdded ? "not-allowed" : "pointer"}
                            opacity={isAlreadyAdded ? 0.7 : 1}
                            onClick={() => !isAlreadyAdded && handleSelectExercise(exercise)}
                            _hover={{ 
                              shadow: isAlreadyAdded ? undefined : "md",
                              borderColor: isAlreadyAdded ? undefined : (isSelected ? "blue.400" : "blue.200")
                            }}
                            transition="all 0.2s"
                            size="sm"
                          >
                            <CardBody px={4} pt={4} pb={2}>
                              <HStack justify="space-between" align="start">
                                <VStack align="start" spacing={2} flex="1">
                                  <HStack flexWrap="wrap">
                                    <Text fontWeight="bold" fontSize="md" color="gray.800">
                                      {exercise.name}
                                    </Text>
                                    <Tag size="sm" colorScheme="teal" variant="subtle">
                                      {exercise.category}
                                    </Tag>
                                    {isAlreadyAdded && (
                                      <Tag size="sm" colorScheme="green" variant="solid">
                                        ✓ Added
                                      </Tag>
                                    )}
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600" lineHeight="short">
                                    {exercise.description}
                                  </Text>
                                </VStack>
                                {!isAlreadyAdded && (
                                  <Button
                                    size="sm"
                                    colorScheme={isSelected ? "blue" : "gray"}
                                    variant={isSelected ? "solid" : "outline"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectExercise(exercise);
                                    }}
                                    leftIcon={isSelected ? <div>✓</div> : <PlusCircle size={14} />}
                                  >
                                    {isSelected ? "Selected" : "Add"}
                                  </Button>
                                )}
                              </HStack>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </VStack>
                  )}
                </Box>
              </CardBody>
            </Card>

            {/* Right Panel: Workout Exercises */}
            <Card flex="1" height="100%" variant="outline" shadow="md">
              <CardHeader pb={3}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <HStack>
                      <div style={{ fontSize: '24px' }}>📝</div>
                      <Heading size="lg" color="gray.700">
                        {templateType === 'weekly' ? `${currentDayName} Exercises` : 'Workout Exercises'}
                      </Heading>
                    </HStack>
                    <Badge colorScheme="blue" variant="solid" fontSize="md" px={3} py={1}>
                      {currentExercises.length} EXERCISES
                    </Badge>
                  </HStack>
                  
                  {/* Summary Stats */}
                  {hasExercises && (
                    <HStack spacing={8} justify="center" p={4} bg="gray.50" borderRadius="md">
                      <VStack spacing={0} align="center">
                        <Text fontSize="xl" fontWeight="bold" color="blue.600">
                          {templateType === 'single' ? currentExercises.length : stats.trainingDays}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {templateType === 'single' ? 'Total Exercises' : 'Training Days'}
                        </Text>
                      </VStack>
                      <VStack spacing={0} align="center">
                        <Text fontSize="xl" fontWeight="bold" color="blue.600">
                          {templateType === 'single' 
                            ? currentExercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0)
                            : stats.totalExercises
                          }
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {templateType === 'single' ? 'Total Sets' : 'Total Exercises'}
                        </Text>
                      </VStack>
                      <VStack spacing={0} align="center">
                        <Text fontSize="xl" fontWeight="bold" color="blue.600">
                          ~{templateType === 'single' 
                            ? currentExercises.length * 3
                            : Math.round(stats.estimatedTime / 7)
                          }
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {templateType === 'single' ? 'Minutes' : 'Min/Day Avg'}
                        </Text>
                      </VStack>
                    </HStack>
                  )}
                </VStack>
              </CardHeader>
              
              <CardBody pt={0} flex="1" overflow="hidden" display="flex" flexDirection="column">
                {/* Exercise List */}
                <Box flex="1" overflow="auto" pr={2}>
                  {currentExercises.length === 0 ? (
                    <VStack 
                      flex="1"
                      justify="center"
                      spacing={4}
                      p={8}
                      textAlign="center"
                      borderWidth="2px" 
                      borderStyle="dashed" 
                      borderColor="blue.200" 
                      borderRadius="lg"
                      bg="blue.25"
                      height="100%"
                    >
                      <div style={{ fontSize: '64px', opacity: 0.6 }}>🎯</div>
                      <VStack spacing={2}>
                        <Text color="blue.600" fontSize="lg" fontWeight="bold">
                          Ready to build your workout!
                        </Text>
                        <Text color="blue.500" fontSize="md">
                          Select exercises from the library to add them here
                        </Text>
                      </VStack>
                    </VStack>
                  ) : (
                    <VStack spacing={2} align="stretch">
                      {currentExercises.slice(0, Math.ceil(currentExercises.length / 2)).map((exercise, index) => (
                        <Card 
                          key={exercise.instanceId} 
                          variant="outline"
                          bg="white" 
                          borderWidth="1px"
                          borderColor="gray.200"
                          _hover={{ shadow: "md", borderColor: "blue.300" }}
                          transition="all 0.2s"
                          size="sm"
                        >
                          <CardBody px={4} pt={4} pb={2}>
                            <VStack spacing={2} align="stretch">
                              <HStack justify="space-between" align="start">
                                <VStack align="start" spacing={1} flex="1">
                                  <HStack>
                                    <Text fontWeight="bold" fontSize="md" color="gray.800">
                                      {index + 1}. {exercise.name}
                                    </Text>
                                    <Tag size="sm" colorScheme="teal" variant="subtle">
                                      {exercise.category}
                                    </Tag>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600" lineHeight="short">
                                    {exercise.description}
                                  </Text>
                                </VStack>
                                <IconButton
                                  icon={<X size={16} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  aria-label="Remove exercise"
                                  onClick={() => handleRemoveExercise(exercise.instanceId)}
                                  _hover={{ bg: "red.100" }}
                                />
                              </HStack>
                              
                              <HStack spacing={3}>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Sets</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.sets || ''} 
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'sets', e.target.value)}
                                    placeholder="e.g., 3"
                                  />
                                </FormControl>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Reps</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.reps || ''}
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'reps', e.target.value)}
                                    placeholder="e.g., 10"
                                  />
                                </FormControl>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Weight (kg)</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.weight || ''}
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'weight', e.target.value)}
                                    placeholder="e.g., 70"
                                  />
                                </FormControl>
                              </HStack>
                              
                              <HStack spacing={3}>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Distance (m)</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.distance || ''}
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'distance', e.target.value)}
                                    placeholder="e.g., 100"
                                  />
                                </FormControl>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Rest (seconds)</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.rest || ''}
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'rest', e.target.value)}
                                    placeholder="e.g., 60"
                                  />
                                </FormControl>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">RPE (1-10)</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.rpe || ''}
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'rpe', e.target.value)}
                                    placeholder="e.g., 8"
                                  />
                                </FormControl>
                              </HStack>
                              
                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Notes (optional)</FormLabel>
                                <Input 
                                  size="sm" 
                                  value={exercise.notes || ''}
                                  onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'notes', e.target.value)}
                                  placeholder="e.g., Focus on form, RPE 8, rest 60s"
                                />
                              </FormControl>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                      
                      {currentExercises.slice(Math.ceil(currentExercises.length / 2)).map((exercise, index) => (
                        <Card 
                          key={exercise.instanceId} 
                          variant="outline"
                          bg="white" 
                          borderWidth="1px"
                          borderColor="gray.200"
                          _hover={{ shadow: "md", borderColor: "blue.300" }}
                          transition="all 0.2s"
                          size="sm"
                        >
                          <CardBody px={4} pt={4} pb={2}>
                            <VStack spacing={2} align="stretch">
                              <HStack justify="space-between" align="start">
                                <VStack align="start" spacing={1} flex="1">
                                  <HStack>
                                    <Text fontWeight="bold" fontSize="md" color="gray.800">
                                      {Math.ceil(currentExercises.length / 2) + index + 1}. {exercise.name}
                                    </Text>
                                    <Tag size="sm" colorScheme="teal" variant="subtle">
                                      {exercise.category}
                                    </Tag>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600" lineHeight="short">
                                    {exercise.description}
                                  </Text>
                                </VStack>
                                <IconButton
                                  icon={<X size={16} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  aria-label="Remove exercise"
                                  onClick={() => handleRemoveExercise(exercise.instanceId)}
                                  _hover={{ bg: "red.100" }}
                                />
                              </HStack>
                              
                              <HStack spacing={3}>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Sets</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.sets || ''} 
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'sets', e.target.value)}
                                    placeholder="e.g., 3"
                                  />
                                </FormControl>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Reps</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.reps || ''}
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'reps', e.target.value)}
                                    placeholder="e.g., 10"
                                  />
                                </FormControl>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Weight (kg)</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.weight || ''}
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'weight', e.target.value)}
                                    placeholder="e.g., 70"
                                  />
                                </FormControl>
                              </HStack>
                              
                              <HStack spacing={3}>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Distance (m)</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.distance || ''}
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'distance', e.target.value)}
                                    placeholder="e.g., 100"
                                  />
                                </FormControl>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Rest (seconds)</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.rest || ''}
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'rest', e.target.value)}
                                    placeholder="e.g., 60"
                                  />
                                </FormControl>
                                <FormControl flex="1">
                                  <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">RPE (1-10)</FormLabel>
                                  <Input 
                                    size="sm" 
                                    value={exercise.rpe || ''}
                                    onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'rpe', e.target.value)}
                                    placeholder="e.g., 8"
                                  />
                                </FormControl>
                              </HStack>
                              
                              <FormControl>
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Notes (optional)</FormLabel>
                                <Input 
                                  size="sm" 
                                  value={exercise.notes || ''}
                                  onChange={(e) => handleExerciseDetailChange(exercise.instanceId, 'notes', e.target.value)}
                                  placeholder="e.g., Focus on form, RPE 8, rest 60s"
                                />
                              </FormControl>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </Box>
              </CardBody>
            </Card>
          </HStack>
        ) : (
          /* Rest Day Message */
          <Card variant="outline" shadow="md" p={8} textAlign="center">
            <CardBody>
              <VStack spacing={4}>
                <div style={{ fontSize: '80px' }}>🛌</div>
                <Heading size="lg" color="gray.600">
                  {currentDayName} is a Rest Day
                </Heading>
                <Text fontSize="md" color="gray.500" maxW="400px">
                  Recovery is just as important as training. Use this day for light stretching, 
                  relaxation, or complete rest.
                </Text>
                <Button
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => toggleRestDay(currentDay)}
                  leftIcon={<PlusCircle size={18} />}
                  size="lg"
                  mt={4}
                >
                  Add Exercises to This Day
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}
      </Box>
    );
  };

  // Step 3: Athlete Assignment
  const renderStep3AthleteAssignment = () => {
    const selectedCount = Object.keys(selectedAthletes).length;
    const totalAthletes = DUMMY_ATHLETES.length;
    
    return (
      <VStack spacing={6} align="stretch" w="100%">
        <HStack justify="space-between" align="center">
          <Heading as="h3" size="lg">Assign Athletes</Heading>
          <HStack spacing={4}>
            <Text fontSize="md" color="gray.600">
              <strong>{selectedCount}</strong> of {totalAthletes} athletes selected
            </Text>
            {selectedCount > 0 && (
              <Button size="sm" variant="outline" colorScheme="red" onClick={clearAllAthletes}>
                Clear All
              </Button>
            )}
          </HStack>
        </HStack>
        
        {/* Search Bar with better placeholder */}
        <Box>
          <FormLabel fontSize="md" fontWeight="semibold" mb={2}>Search Athletes</FormLabel>
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <Search size={20} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Type athlete name, event, or use filters below..."
              value={athleteSearchTerm}
              onChange={(e) => setAthleteSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Text fontSize="sm" color="gray.500" mt={1}>
            💡 Tip: Try searching for events like "Sprint" or "Distance" to find specialized athletes
          </Text>
        </Box>

        {/* Selected Athletes Display with better management */}
        {selectedCount > 0 && (
          <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
            <HStack justify="space-between" mb={3}>
              <Text fontSize="md" fontWeight="semibold" color="blue.700">
                Selected Athletes ({selectedCount})
              </Text>
              <Button size="sm" variant="ghost" colorScheme="blue" onClick={clearAllAthletes}>
                Deselect All
              </Button>
            </HStack>
            <HStack flexWrap="wrap" spacing={2}>
              {Object.values(selectedAthletes).map((athlete) => (
                <Tag
                  key={athlete.id}
                  size="lg"
                  colorScheme="blue"
                  variant="solid"
                  borderRadius="full"
                  py={2}
                  px={3}
                  cursor="pointer"
                >
                  <Avatar src={athlete.avatar} size="xs" mr={2} />
                  <Text>{athlete.name}</Text>
                  <TagCloseButton onClick={() => handleAthleteSelection(athlete)} />
                </Tag>
              ))}
            </HStack>
          </Box>
        )}

        {/* Most Used Athletes Section */}
        {athleteSearchTerm === '' && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={3}>Most Used Athletes</Text>
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} spacing={3}>
              {DUMMY_ATHLETES.slice(0, 10).map((athlete) => {
                const isSelected = !!selectedAthletes[athlete.id];
                
                return (
                  <Box
                    key={athlete.id}
                    p={3}
                    borderWidth="2px"
                    borderRadius="lg"
                    borderColor={isSelected ? "blue.300" : "gray.200"}
                    bg={isSelected ? "blue.50" : "white"}
                    cursor="pointer"
                    onClick={() => handleAthleteSelection(athlete)}
                    _hover={{ 
                      borderColor: isSelected ? "blue.400" : "blue.200",
                      bg: isSelected ? "blue.100" : "blue.50" 
                    }}
                    transition="all 0.2s"
                    shadow="sm"
                  >
                    <VStack spacing={2}>
                      <Avatar 
                        src={athlete.avatar} 
                        name={athlete.name} 
                        size="md"
                        borderWidth={isSelected ? "3px" : "2px"}
                        borderColor={isSelected ? "blue.400" : "white"}
                      />
                      <VStack spacing={0}>
                        <Text fontWeight="semibold" fontSize="sm" textAlign="center">
                          {athlete.name}
                        </Text>
                        <Text fontSize="xs" color="gray.600" textAlign="center">
                          {athlete.event}
                        </Text>
                      </VStack>
                    </VStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>
        )}

        {/* Search Results */}
        {athleteSearchTerm !== '' && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={3}>
              Search Results ({filteredAthletes.length})
            </Text>
            {filteredAthletes.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                No athletes found matching "{athleteSearchTerm}"
              </Text>
            ) : (
              <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 6 }} spacing={3}>
                {filteredAthletes.map((athlete) => {
                  const isSelected = !!selectedAthletes[athlete.id];
                  
                  return (
                    <Box
                      key={athlete.id}
                      p={3}
                      borderWidth="2px"
                      borderRadius="lg"
                      borderColor={isSelected ? "blue.300" : "gray.200"}
                      bg={isSelected ? "blue.50" : "white"}
                      cursor="pointer"
                      onClick={() => handleAthleteSelection(athlete)}
                      _hover={{ 
                        borderColor: isSelected ? "blue.400" : "blue.200",
                        bg: isSelected ? "blue.100" : "blue.50" 
                      }}
                      transition="all 0.2s"
                      shadow="sm"
                    >
                      <VStack spacing={2}>
                        <Avatar 
                          src={athlete.avatar} 
                          name={athlete.name} 
                          size="md"
                          borderWidth={isSelected ? "3px" : "2px"}
                          borderColor={isSelected ? "blue.400" : "white"}
                        />
                        <VStack spacing={0}>
                          <Text fontWeight="semibold" fontSize="sm" textAlign="center">
                            {athlete.name}
                          </Text>
                          <Text fontSize="xs" color="gray.600" textAlign="center">
                            {athlete.event}
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            )}
          </Box>
        )}

        {/* All Athletes Section */}
        {athleteSearchTerm === '' && (
          <Box>
            <Text fontSize="md" fontWeight="semibold" mb={3}>All Athletes</Text>
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 6 }} spacing={3}>
              {DUMMY_ATHLETES.map((athlete) => {
                const isSelected = !!selectedAthletes[athlete.id];
                
                return (
                  <Box
                    key={athlete.id}
                    p={3}
                    borderWidth="2px"
                    borderRadius="lg"
                    borderColor={isSelected ? "blue.300" : "gray.200"}
                    bg={isSelected ? "blue.50" : "white"}
                    cursor="pointer"
                    onClick={() => handleAthleteSelection(athlete)}
                    _hover={{ 
                      borderColor: isSelected ? "blue.400" : "blue.200",
                      bg: isSelected ? "blue.100" : "blue.50" 
                    }}
                    transition="all 0.2s"
                    shadow="sm"
                  >
                    <VStack spacing={2}>
                      <Avatar 
                        src={athlete.avatar} 
                        name={athlete.name} 
                        size="md"
                        borderWidth={isSelected ? "3px" : "2px"}
                        borderColor={isSelected ? "blue.400" : "white"}
                      />
                      <VStack spacing={0}>
                        <Text fontWeight="semibold" fontSize="sm" textAlign="center">
                          {athlete.name}
                        </Text>
                        <Text fontSize="xs" color="gray.600" textAlign="center">
                          {athlete.event}
                        </Text>
                      </VStack>
                    </VStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>
        )}
      </VStack>
    );
  };

  // Step 4: Review & Save
  const renderStep4Review = () => {
    const warnings = getWorkoutWarnings();
    const stats = getWorkoutStats();
    
    return (
      <VStack spacing={8} align="stretch" w="100%">
        {/* Warnings Section */}
        {warnings.length > 0 && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle fontSize="md">⚠️ Items that need attention:</AlertTitle>
              <AlertDescription>
                <VStack align="start" spacing={1} mt={2}>
                  {warnings.map((warning, index) => (
                    <Text key={index} fontSize="sm">• {warning}</Text>
                  ))}
                </VStack>
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Workout Summary with Inline Edit Links */}
        <Box p={8} bg="blue.50" borderRadius="lg" borderLeft="4px solid" borderLeftColor="blue.400" w="100%">
          <Heading as="h3" size="xl" mb={6} color="blue.700">Workout Summary</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => goToStep(1)} _hover={{ bg: 'blue.100' }} p={2} borderRadius="md" transition="all 0.2s">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg">Name:</Text>
                  <Text fontSize="lg">{workoutName}</Text>
                  <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                </VStack>
              </HStack>
              <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => goToStep(1)} _hover={{ bg: 'blue.100' }} p={2} borderRadius="md" transition="all 0.2s">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg">Type:</Text>
                  <Badge colorScheme="green" variant="subtle" fontSize="md" px={3} py={1}>{workoutType}</Badge>
                  <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                </VStack>
              </HStack>
            </VStack>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => goToStep(1)} _hover={{ bg: 'blue.100' }} p={2} borderRadius="md" transition="all 0.2s">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg">Template:</Text>
                  <Badge colorScheme={templateType === 'single' ? 'blue' : 'purple'} variant="subtle" fontSize="md" px={3} py={1}>
                    {templateType === 'single' ? 'Single Day' : 'Weekly Plan'}
                  </Badge>
                  <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                </VStack>
              </HStack>
              <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => goToStep(2)} _hover={{ bg: 'blue.100' }} p={2} borderRadius="md" transition="all 0.2s">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg">Exercises:</Text>
                  <Text fontSize="lg">
                    {templateType === 'single' 
                      ? `${selectedExercises.length} exercises`
                      : `${weeklyPlan.filter(d => !d.isRestDay).length} training days`
                    }
                  </Text>
                  <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                </VStack>
              </HStack>
            </VStack>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => goToStep(3)} _hover={{ bg: 'blue.100' }} p={2} borderRadius="md" transition="all 0.2s">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg">Athletes:</Text>
                  <Text fontSize="lg">{Object.keys(selectedAthletes).length} assigned</Text>
                  <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                </VStack>
              </HStack>
            </VStack>
            <VStack align="start" spacing={4}>
              <Box p={2} borderRadius="md">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg">Estimated Time:</Text>
                  <Text fontSize="lg">
                    {templateType === 'single' 
                      ? `~${stats.estimatedTime} minutes`
                      : `~${Math.round(stats.estimatedTime / 7)} min/day`
                    }
                  </Text>
                  <Text fontSize="xs" color="gray.500">Based on exercise count</Text>
                </VStack>
              </Box>
            </VStack>
          </SimpleGrid>
        </Box>

        {/* Exercise Preview */}
        <Box p={8} borderWidth="1px" borderRadius="lg" shadow="sm" bg="white" w="100%">
          <Heading as="h3" size="lg" mb={6}>Exercise Preview</Heading>
          {/* Debug info */}
          <Box p={3} bg="red.100" borderRadius="md" mb={4}>
            <Text fontSize="md" color="red.800" fontWeight="bold">
              🔍 DEBUG: Template = {templateType} | Weekly plan length = {weeklyPlan.length} | Total exercises = {weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0)}
            </Text>
          </Box>
          {templateType === 'single' ? (
            selectedExercises.length === 0 ? (
              <Text color="gray.500" fontStyle="italic" fontSize="lg">No exercises added</Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {selectedExercises.map((exercise, index) => (
                  <Card key={exercise.instanceId} variant="outline" p={4} bg="gray.50" borderRadius="lg">
                    <VStack spacing={4} align="stretch">
                      {/* Header with exercise name and category */}
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={1} flex="1">
                          <HStack>
                            <Badge colorScheme="blue" variant="solid" fontSize="xs" px={2}>
                              {index + 1}
                            </Badge>
                            <Text fontSize="lg" fontWeight="bold" color="gray.800">
                              {exercise.name}
                            </Text>
                            <Badge colorScheme="teal" variant="subtle" fontSize="xs">
                              {exercise.category}
                            </Badge>
                    </HStack>
                          <Text fontSize="sm" color="gray.600" lineHeight="short">
                            {exercise.description}
                          </Text>
                        </VStack>
                    </HStack>

                      {/* Exercise parameters grid */}
                      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        {/* Sets and Reps - always shown */}
                        <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                          <Text fontSize="xs" fontWeight="bold" color="blue.600" textTransform="uppercase">
                            Sets
                    </Text>
                          <Text fontSize="xl" fontWeight="bold" color="gray.800">
                            {exercise.sets || '-'}
                          </Text>
                        </VStack>
                        
                        <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                          <Text fontSize="xs" fontWeight="bold" color="green.600" textTransform="uppercase">
                            Reps
                          </Text>
                          <Text fontSize="xl" fontWeight="bold" color="gray.800">
                            {exercise.reps || '-'}
                          </Text>
                        </VStack>

                        {/* Weight - only if specified */}
                        {exercise.weight && (
                          <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xs" fontWeight="bold" color="purple.600" textTransform="uppercase">
                              Weight
                            </Text>
                            <Text fontSize="xl" fontWeight="bold" color="gray.800">
                              {exercise.weight} kg
                            </Text>
                          </VStack>
                        )}

                        {/* Distance - only if specified */}
                        {exercise.distance && (
                          <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xs" fontWeight="bold" color="orange.600" textTransform="uppercase">
                              Distance
                            </Text>
                            <Text fontSize="xl" fontWeight="bold" color="gray.800">
                              {exercise.distance} m
                            </Text>
                          </VStack>
                        )}

                        {/* Rest period - only if specified */}
                        {exercise.rest && (
                          <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xs" fontWeight="bold" color="red.600" textTransform="uppercase">
                              Rest
                            </Text>
                            <Text fontSize="xl" fontWeight="bold" color="gray.800">
                              {exercise.rest}s
                            </Text>
                          </VStack>
                        )}
                        
                        {/* RPE - only if specified */}
                        {exercise.rpe && (
                          <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xs" fontWeight="bold" color="pink.600" textTransform="uppercase">
                              RPE
                            </Text>
                            <Text fontSize="xl" fontWeight="bold" color="gray.800">
                              {exercise.rpe}/10
                            </Text>
                          </VStack>
                )}
              </SimpleGrid>

                      {/* Additional workout details */}
                      <HStack spacing={6} p={3} bg="blue.50" borderRadius="md">
                        <VStack spacing={0} align="center">
                          <Text fontSize="sm" fontWeight="bold" color="blue.700">
                            Estimated Volume
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            {(parseInt(exercise.sets || '0') * parseInt(exercise.reps || '0')) || 0} total reps
                          </Text>
                        </VStack>
                        
                        {exercise.weight && (
                          <VStack spacing={0} align="center">
                            <Text fontSize="sm" fontWeight="bold" color="blue.700">
                              Total Load
                            </Text>
                            <Text fontSize="sm" color="blue.600">
                              {((parseInt(exercise.sets || '0') * parseInt(exercise.reps || '0') * parseFloat(exercise.weight || '0')) || 0).toFixed(0)} kg
                            </Text>
                          </VStack>
                        )}
                        
                        {exercise.rest && (
                          <VStack spacing={0} align="center">
                            <Text fontSize="sm" fontWeight="bold" color="blue.700">
                              Rest Time
                            </Text>
                            <Text fontSize="sm" color="blue.600">
                              {Math.floor(parseInt(exercise.rest || '0') / 60) > 0 ? `${Math.floor(parseInt(exercise.rest || '0') / 60)}m ${parseInt(exercise.rest || '0') % 60}s` : `${exercise.rest}s`}
                            </Text>
                          </VStack>
                        )}
                        
                        <VStack spacing={0} align="center">
                          <Text fontSize="sm" fontWeight="bold" color="blue.700">
                            Est. Time
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            {Math.ceil((parseInt(exercise.sets || '0') * 2) + ((parseInt(exercise.rest || '60') * (parseInt(exercise.sets || '0') - 1)) / 60))} min
                          </Text>
                        </VStack>
                        
                        {exercise.rpe && (
                          <VStack spacing={0} align="center">
                            <Text fontSize="sm" fontWeight="bold" color="blue.700">
                              Target RPE
                            </Text>
                            <Text fontSize="sm" color="blue.600">
                              {exercise.rpe}/10 intensity
                            </Text>
                          </VStack>
                        )}
                      </HStack>
                      
                      {/* Exercise completeness indicator */}
                      <HStack justify="space-between" p={3} bg="gray.100" borderRadius="md">
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="bold" color="gray.700">
                            Exercise Specifications
                          </Text>
                          <HStack spacing={3}>
                            <HStack spacing={1}>
                              <Box w={2} h={2} borderRadius="full" bg={exercise.sets && exercise.reps ? "green.400" : "gray.300"} />
                              <Text fontSize="xs" color="gray.600">Sets & Reps</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <Box w={2} h={2} borderRadius="full" bg={exercise.weight ? "green.400" : "gray.300"} />
                              <Text fontSize="xs" color="gray.600">Weight</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <Box w={2} h={2} borderRadius="full" bg={exercise.distance ? "green.400" : "gray.300"} />
                              <Text fontSize="xs" color="gray.600">Distance</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <Box w={2} h={2} borderRadius="full" bg={exercise.rest ? "green.400" : "gray.300"} />
                              <Text fontSize="xs" color="gray.600">Rest</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <Box w={2} h={2} borderRadius="full" bg={exercise.rpe ? "green.400" : "gray.300"} />
                              <Text fontSize="xs" color="gray.600">RPE</Text>
                            </HStack>
                          </HStack>
                        </VStack>
                        
                        <VStack align="end" spacing={0}>
                          <Text fontSize="sm" fontWeight="bold" color="gray.700">
                            Completion
                          </Text>
                          <Text fontSize="sm" color={
                            [exercise.sets, exercise.reps, exercise.weight, exercise.distance, exercise.rest, exercise.rpe].filter(Boolean).length >= 3 
                              ? "green.600" 
                              : "orange.600"
                          }>
                            {[exercise.sets, exercise.reps, exercise.weight, exercise.distance, exercise.rest, exercise.rpe].filter(Boolean).length}/6 fields
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </Card>
                ))}
                
                {/* Workout summary footer */}
                <Card variant="outline" p={4} bg="gray.100" borderColor="gray.300">
                  <HStack justify="space-between" align="center">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        Workout Summary
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Complete overview for athlete reference
                      </Text>
                    </VStack>
                    
                    <HStack spacing={8}>
                      <VStack spacing={0} align="center">
                        <Text fontSize="xl" fontWeight="bold" color="blue.600">
                          {selectedExercises.length}
                        </Text>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                          Exercises
                        </Text>
                      </VStack>
                      
                      <VStack spacing={0} align="center">
                        <Text fontSize="xl" fontWeight="bold" color="green.600">
                          {selectedExercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0)}
                        </Text>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                          Total Sets
                        </Text>
                      </VStack>
                      
                      <VStack spacing={0} align="center">
                        <Text fontSize="xl" fontWeight="bold" color="purple.600">
                          {selectedExercises.reduce((sum, ex) => sum + ((parseInt(ex.sets || '0') * parseInt(ex.reps || '0')) || 0), 0)}
                        </Text>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                          Total Reps
                        </Text>
                      </VStack>
                      
                      <VStack spacing={0} align="center">
                        <Text fontSize="xl" fontWeight="bold" color="orange.600">
                          ~{selectedExercises.reduce((sum, ex) => {
                            const sets = parseInt(ex.sets || '0') || 0;
                            const rest = parseInt(ex.rest || '60') || 60;
                            return sum + Math.ceil((sets * 2) + ((rest * (sets - 1)) / 60));
                          }, 0)}
                        </Text>
                        <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                          Minutes
                        </Text>
                      </VStack>
                    </HStack>
                  </HStack>
                </Card>
              </VStack>
            )
          ) : (
            <VStack spacing={6} align="stretch">
              {DAYS_OF_WEEK.map((day) => {
                const dayWorkout = weeklyPlan.find(d => d.day === day.value);
                if (!dayWorkout || (dayWorkout.isRestDay && dayWorkout.exercises.length === 0)) {
                  return (
                    <Card key={day.value} variant="outline" p={6} bg="gray.50" borderRadius="lg">
                      <HStack justify="space-between" align="center">
                        <Text fontWeight="bold" fontSize="lg" color="gray.700">{day.label}</Text>
                        <Badge colorScheme="gray" variant="solid" size="lg">Rest Day</Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.500" fontStyle="italic" mt={2}>
                        Scheduled rest day - recovery and regeneration
                      </Text>
                    </Card>
                  );
                }
                
                if (dayWorkout.exercises.length === 0) {
                return (
                    <Card key={day.value} variant="outline" p={6} bg="gray.50" borderRadius="lg">
                      <HStack justify="space-between" align="center">
                        <Text fontWeight="bold" fontSize="lg" color="gray.700">{day.label}</Text>
                        <Badge colorScheme="orange" variant="subtle" size="lg">No Exercises</Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.500" fontStyle="italic" mt={2}>
                        No exercises planned for this day
                      </Text>
                    </Card>
                  );
                }
                
                return (
                  <Card key={day.value} variant="outline" p={6} bg="white" borderRadius="lg" shadow="sm">
                    <VStack spacing={4} align="stretch">
                      {/* Day Header */}
                      <HStack justify="space-between" align="center" pb={2} borderBottom="2px solid" borderBottomColor="blue.100">
                        <HStack spacing={3}>
                          <Text fontWeight="bold" fontSize="xl" color="blue.700">{day.label}</Text>
                          <Badge colorScheme="blue" variant="solid" size="lg">
                            {dayWorkout.exercises.length} exercise{dayWorkout.exercises.length !== 1 ? 's' : ''}
                      </Badge>
                        </HStack>
                        
                        {/* Day summary stats */}
                        <HStack spacing={6} p={3} bg="blue.50" borderRadius="md">
                          <VStack spacing={0} align="center">
                            <Text fontSize="lg" fontWeight="bold" color="blue.600">
                              {dayWorkout.exercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0)}
                            </Text>
                            <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                              Total Sets
                            </Text>
                          </VStack>
                          
                          <VStack spacing={0} align="center">
                            <Text fontSize="lg" fontWeight="bold" color="green.600">
                              {dayWorkout.exercises.reduce((sum, ex) => sum + ((parseInt(ex.sets || '0') * parseInt(ex.reps || '0')) || 0), 0)}
                            </Text>
                            <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                              Total Reps
                            </Text>
                          </VStack>
                          
                          <VStack spacing={0} align="center">
                            <Text fontSize="lg" fontWeight="bold" color="orange.600">
                              ~{dayWorkout.exercises.reduce((sum, ex) => {
                                const sets = parseInt(ex.sets || '0') || 0;
                                const rest = parseInt(ex.rest || '60') || 60;
                                return sum + Math.ceil((sets * 2) + ((rest * (sets - 1)) / 60));
                              }, 0)}
                            </Text>
                            <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                              Minutes
                            </Text>
                          </VStack>
                        </HStack>
                      </HStack>
                      
                      {/* Detailed Exercise Cards */}
                      <VStack spacing={4} align="stretch">
                        {dayWorkout.exercises.map((exercise, index) => (
                          <Card key={exercise.instanceId} variant="outline" p={4} bg="gray.50" borderRadius="lg">
                            <VStack spacing={4} align="stretch">
                              {/* Header with exercise name and category */}
                              <HStack justify="space-between" align="start">
                                <VStack align="start" spacing={1} flex="1">
                                  <HStack>
                                    <Badge colorScheme="blue" variant="solid" fontSize="xs" px={2}>
                                      {index + 1}
                                    </Badge>
                                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                                      {exercise.name}
                                    </Text>
                                    <Badge colorScheme="teal" variant="subtle" fontSize="xs">
                                      {exercise.category}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600" lineHeight="short">
                                    {exercise.description}
                                  </Text>
                                </VStack>
                              </HStack>

                              {/* Exercise parameters grid */}
                              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                                {/* Sets and Reps - always shown */}
                                <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                                  <Text fontSize="xs" fontWeight="bold" color="blue.600" textTransform="uppercase">
                                    Sets
                                  </Text>
                                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                                    {exercise.sets || '-'}
                                  </Text>
                                </VStack>
                                
                                <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                                  <Text fontSize="xs" fontWeight="bold" color="green.600" textTransform="uppercase">
                                    Reps
                                  </Text>
                                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                                    {exercise.reps || '-'}
                                  </Text>
                                </VStack>

                                {/* Weight - only if specified */}
                                {exercise.weight && (
                                  <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                                    <Text fontSize="xs" fontWeight="bold" color="purple.600" textTransform="uppercase">
                                      Weight
                                    </Text>
                                    <Text fontSize="xl" fontWeight="bold" color="gray.800">
                                      {exercise.weight} kg
                                    </Text>
                                  </VStack>
                                )}

                                {/* Distance - only if specified */}
                                {exercise.distance && (
                                  <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                                    <Text fontSize="xs" fontWeight="bold" color="orange.600" textTransform="uppercase">
                                      Distance
                                    </Text>
                                    <Text fontSize="xl" fontWeight="bold" color="gray.800">
                                      {exercise.distance} m
                                    </Text>
                                  </VStack>
                                )}

                                {/* Rest period - only if specified */}
                                {exercise.rest && (
                                  <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                                    <Text fontSize="xs" fontWeight="bold" color="red.600" textTransform="uppercase">
                                      Rest
                                    </Text>
                                    <Text fontSize="xl" fontWeight="bold" color="gray.800">
                                      {exercise.rest}s
                                    </Text>
                                  </VStack>
                                )}
                                
                                {/* RPE - only if specified */}
                                {exercise.rpe && (
                                  <VStack spacing={1} align="center" p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                                    <Text fontSize="xs" fontWeight="bold" color="pink.600" textTransform="uppercase">
                                      RPE
                                    </Text>
                                    <Text fontSize="xl" fontWeight="bold" color="gray.800">
                                      {exercise.rpe}/10
                                    </Text>
                                  </VStack>
                                )}
                              </SimpleGrid>

                              {/* Additional workout details */}
                              <HStack spacing={6} p={3} bg="blue.50" borderRadius="md">
                                <VStack spacing={0} align="center">
                                  <Text fontSize="sm" fontWeight="bold" color="blue.700">
                                    Estimated Volume
                                  </Text>
                                  <Text fontSize="sm" color="blue.600">
                                    {(parseInt(exercise.sets || '0') * parseInt(exercise.reps || '0')) || 0} total reps
                                  </Text>
                                </VStack>
                                
                                {exercise.weight && (
                                  <VStack spacing={0} align="center">
                                    <Text fontSize="sm" fontWeight="bold" color="blue.700">
                                      Total Load
                                    </Text>
                                    <Text fontSize="sm" color="blue.600">
                                      {((parseInt(exercise.sets || '0') * parseInt(exercise.reps || '0') * parseFloat(exercise.weight || '0')) || 0).toFixed(0)} kg
                                    </Text>
                                  </VStack>
                                )}
                                
                                {exercise.rest && (
                                  <VStack spacing={0} align="center">
                                    <Text fontSize="sm" fontWeight="bold" color="blue.700">
                                      Rest Time
                                    </Text>
                                    <Text fontSize="sm" color="blue.600">
                                      {Math.floor(parseInt(exercise.rest || '0') / 60) > 0 ? `${Math.floor(parseInt(exercise.rest || '0') / 60)}m ${parseInt(exercise.rest || '0') % 60}s` : `${exercise.rest}s`}
                                    </Text>
                                  </VStack>
                                )}
                                
                                <VStack spacing={0} align="center">
                                  <Text fontSize="sm" fontWeight="bold" color="blue.700">
                                    Est. Time
                                  </Text>
                                  <Text fontSize="sm" color="blue.600">
                                    {Math.ceil((parseInt(exercise.sets || '0') * 2) + ((parseInt(exercise.rest || '60') * (parseInt(exercise.sets || '0') - 1)) / 60))} min
                                  </Text>
                                </VStack>
                                
                                {exercise.rpe && (
                                  <VStack spacing={0} align="center">
                                    <Text fontSize="sm" fontWeight="bold" color="blue.700">
                                      Target RPE
                                    </Text>
                                    <Text fontSize="sm" color="blue.600">
                                      {exercise.rpe}/10 intensity
                                    </Text>
                                  </VStack>
                    )}
                  </HStack>
                              
                              {/* Exercise completeness indicator */}
                              <HStack justify="space-between" p={3} bg="gray.100" borderRadius="md">
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm" fontWeight="bold" color="gray.700">
                                    Exercise Specifications
                                  </Text>
                                  <HStack spacing={3}>
                                    <HStack spacing={1}>
                                      <Box w={2} h={2} borderRadius="full" bg={exercise.sets && exercise.reps ? "green.400" : "gray.300"} />
                                      <Text fontSize="xs" color="gray.600">Sets & Reps</Text>
                                    </HStack>
                                    <HStack spacing={1}>
                                      <Box w={2} h={2} borderRadius="full" bg={exercise.weight ? "green.400" : "gray.300"} />
                                      <Text fontSize="xs" color="gray.600">Weight</Text>
                                    </HStack>
                                    <HStack spacing={1}>
                                      <Box w={2} h={2} borderRadius="full" bg={exercise.distance ? "green.400" : "gray.300"} />
                                      <Text fontSize="xs" color="gray.600">Distance</Text>
                                    </HStack>
                                    <HStack spacing={1}>
                                      <Box w={2} h={2} borderRadius="full" bg={exercise.rest ? "green.400" : "gray.300"} />
                                      <Text fontSize="xs" color="gray.600">Rest</Text>
                                    </HStack>
                                    <HStack spacing={1}>
                                      <Box w={2} h={2} borderRadius="full" bg={exercise.rpe ? "green.400" : "gray.300"} />
                                      <Text fontSize="xs" color="gray.600">RPE</Text>
                                    </HStack>
                                  </HStack>
                                </VStack>
                                
                                <VStack align="end" spacing={0}>
                                  <Text fontSize="sm" fontWeight="bold" color="gray.700">
                                    Completion
                                  </Text>
                                  <Text fontSize="sm" color="green.600">
                                    {[exercise.sets, exercise.reps, exercise.weight, exercise.distance, exercise.rest, exercise.rpe].filter(Boolean).length}/6 fields
                                  </Text>
                                </VStack>
                              </HStack>
                              
                              {/* Notes section - only if specified */}
                              {exercise.notes && (
                                <Box p={3} bg="yellow.50" borderRadius="md" border="1px solid" borderColor="yellow.200">
                                  <HStack spacing={2} mb={1}>
                                    <Icon as={FaRegClock} color="yellow.600" boxSize={3} />
                                    <Text fontSize="sm" fontWeight="bold" color="yellow.700">
                                      Coach Notes
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" color="yellow.800" fontStyle="italic">
                                    {exercise.notes}
                                  </Text>
                                </Box>
                              )}
                            </VStack>
                          </Card>
                        ))}
                      </VStack>
                    </VStack>
                  </Card>
                );
              })}
              
              {/* Weekly summary footer */}
              <Card variant="outline" p={4} bg="gray.100" borderColor="gray.300">
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                      Weekly Training Summary
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Complete overview for athlete reference
                    </Text>
                  </VStack>
                  
                  <HStack spacing={8}>
                    <VStack spacing={0} align="center">
                      <Text fontSize="xl" fontWeight="bold" color="blue.600">
                        {weeklyPlan.filter(d => !d.isRestDay).length}
                      </Text>
                      <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                        Training Days
                      </Text>
                    </VStack>
                    
                    <VStack spacing={0} align="center">
                      <Text fontSize="xl" fontWeight="bold" color="green.600">
                        {weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0)}
                      </Text>
                      <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                        Total Exercises
                      </Text>
                    </VStack>
                    
                    <VStack spacing={0} align="center">
                      <Text fontSize="xl" fontWeight="bold" color="purple.600">
                        {weeklyPlan.reduce((sum, day) => 
                          sum + day.exercises.reduce((daySum, ex) => 
                            daySum + (parseInt(ex.sets || '0') || 0), 0), 0)}
                      </Text>
                      <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                        Total Sets
                      </Text>
                    </VStack>
                    
                    <VStack spacing={0} align="center">
                      <Text fontSize="xl" fontWeight="bold" color="orange.600">
                        ~{weeklyPlan.reduce((sum, day) => 
                          sum + day.exercises.reduce((daySum, ex) => {
                            const sets = parseInt(ex.sets || '0') || 0;
                            const rest = parseInt(ex.rest || '60') || 60;
                            return daySum + Math.ceil((sets * 2) + ((rest * (sets - 1)) / 60));
                          }, 0), 0)}
                      </Text>
                      <Text fontSize="xs" color="gray.600" textTransform="uppercase">
                        Total Minutes
                      </Text>
                    </VStack>
                  </HStack>
                </HStack>
              </Card>
            </VStack>
          )}
        </Box>

        {/* Athlete Assignment Preview */}
        {Object.keys(selectedAthletes).length > 0 && (
          <Box p={8} borderWidth="1px" borderRadius="lg" shadow="sm" bg="white" w="100%">
            <Heading as="h3" size="lg" mb={6}>Assigned Athletes</Heading>
            <VStack spacing={4} align="stretch">
              <AvatarGroup size="lg" max={20} spacing="-0.5rem">
                {Object.values(selectedAthletes).map((athlete) => (
                  <Avatar
                    key={athlete.id}
                    name={athlete.name}
                    src={athlete.avatar}
                    title={`${athlete.name} - ${athlete.event}`}
                    borderWidth="2px"
                    borderColor="white"
                  />
                ))}
              </AvatarGroup>
              <Text fontSize="md" color="gray.600" textAlign="center">
                This workout will be assigned to {Object.keys(selectedAthletes).length} athlete{Object.keys(selectedAthletes).length !== 1 ? 's' : ''}
              </Text>
            </VStack>
          </Box>
        )}
      </VStack>
    );
  };

  // --- 4. Render Functions for Different Views ---

  const renderWorkoutList = () => (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Heading as="h1" size="lg">Workout Templates ({savedWorkouts.length})</Heading>
        <Button leftIcon={<PlusCircle size={18} />} colorScheme="blue" onClick={goToCreateView}>
          Create New Workout
        </Button>
      </HStack>

      {savedWorkouts.length === 0 ? (
        <Box textAlign="center" py={12}>
          <Text color="gray.500" fontSize="lg" mb={4}>No workout templates created yet</Text>
          <Button leftIcon={<PlusCircle size={18} />} colorScheme="blue" onClick={goToCreateView}>
            Create Your First Workout
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {savedWorkouts.map((workout) => (
            <Card key={workout.id} variant="outline" _hover={{ shadow: 'md' }} transition="all 0.2s">
              <CardHeader pb={2}>
                <Flex>
                  <Box>
                    <Heading size="md">{workout.name}</Heading>
                    <Text color="gray.500" fontSize="sm">{workout.type}</Text>
                  </Box>
                  <Spacer />
                  <HStack>
                    <IconButton
                      icon={<Eye size={16} />}
                      size="sm"
                      variant="ghost"
                      aria-label="View workout"
                      onClick={() => goToDetailView(workout.id)}
                    />
                    <IconButton
                      icon={<Edit size={16} />}
                      size="sm"
                      variant="ghost"
                      aria-label="Edit workout"
                      onClick={() => startEditingWorkout(workout)}
                    />
                    <IconButton
                      icon={<Users size={16} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      aria-label="Assign athletes"
                      onClick={() => openAthleteModal(workout.id)}
                    />
                    <IconButton
                      icon={<Trash2 size={16} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      aria-label="Delete workout"
                      onClick={() => handleDeleteWorkout(workout.id)}
                    />
                  </HStack>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <HStack justify="space-between" mb={3}>
                  <Badge 
                    colorScheme={workout.templateType === 'single' ? 'blue' : 'purple'} 
                    variant="subtle"
                  >
                    {workout.templateType === 'single' ? 'Single Day' : 'Weekly Plan'}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    {workout.templateType === 'single' 
                      ? `${workout.exercises?.length || 0} exercise${workout.exercises?.length !== 1 ? 's' : ''}`
                      : `${workout.weeklyPlan?.filter(d => !d.isRestDay).length || 0} training days`
                    }
                  </Text>
                </HStack>
                
                {/* Assigned Athletes */}
                <VStack align="stretch" spacing={3} mb={3}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      Assigned Athletes ({workout.assignedAthletes.length})
                    </Text>
                    {workout.assignedAthletes.length > 0 && (
                      <AvatarGroup size="sm" max={4}>
                        {workout.assignedAthletes.map((athlete) => (
                          <Avatar
                            key={athlete.id}
                            name={athlete.name}
                            src={athlete.avatar}
                            title={`${athlete.name} - ${athlete.event}`}
                          />
                        ))}
                      </AvatarGroup>
                    )}
                  </HStack>
                  {workout.assignedAthletes.length === 0 && (
                    <Text fontSize="xs" color="gray.400" fontStyle="italic">
                      No athletes assigned
                    </Text>
                  )}
                </VStack>
                
                <HStack flexWrap="wrap">
                  {workout.templateType === 'single' ? (
                    workout.exercises?.slice(0, 3).map((ex) => (
                      <Tag key={ex.instanceId} size="sm" variant="subtle" colorScheme="teal">
                        {ex.name}
                      </Tag>
                    ))
                  ) : (
                    workout.weeklyPlan?.filter(d => !d.isRestDay).slice(0, 3).map((day) => (
                      <Tag key={day.day} size="sm" variant="subtle" colorScheme="purple">
                        {DAYS_OF_WEEK.find(d => d.value === day.day)?.label} ({day.exercises.length})
                      </Tag>
                    ))
                  )}
                  
                  {workout.templateType === 'single' && workout.exercises && workout.exercises.length > 3 && (
                    <Text fontSize="sm" color="gray.500">+{workout.exercises.length - 3} more</Text>
                  )}
                  {workout.templateType === 'weekly' && workout.weeklyPlan && workout.weeklyPlan.filter(d => !d.isRestDay).length > 3 && (
                    <Text fontSize="sm" color="gray.500">+{workout.weeklyPlan.filter(d => !d.isRestDay).length - 3} more days</Text>
                  )}
                </HStack>
                <Text fontSize="xs" color="gray.400" mt={3}>
                  Created: {workout.createdAt.toLocaleDateString()}
                </Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );

  const renderCreateEditView = () => (
    <>
      {/* Always show step header */}
      {renderStepHeader()}

      {/* Step Content with Animation */}
      <Box position="relative" minHeight="calc(100vh - 400px)" overflow="hidden" w="100%" mb={0}>
        <AnimatePresence mode="wait" custom={stepDirection}>
          <motion.div
            key={currentStep}
            custom={stepDirection}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            style={{ position: 'absolute', width: '100%', left: 0, top: 0 }}
          >
            {currentStep === 1 && renderStep1WorkoutDetails()}
            {currentStep === 2 && renderStep2ExercisePlanning()}
            {currentStep === 3 && renderStep3AthleteAssignment()}
            {currentStep === 4 && renderStep4Review()}
          </motion.div>
        </AnimatePresence>
      </Box>

      {renderStepNavigation()}
    </>
  );

  const renderDetailView = () => {
    if (!currentWorkout) {
      return (
        <VStack spacing={4}>
          <Text>Workout not found</Text>
          <Button onClick={goToListView}>Back to List</Button>
        </VStack>
      );
    }

    return (
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <HStack>
            <IconButton
              icon={<ArrowLeft size={18} />}
              variant="ghost"
              aria-label="Back to list"
              onClick={goToListView}
            />
            <Box>
              <Heading as="h1" size="lg">{currentWorkout.name}</Heading>
              <Text color="gray.500">{currentWorkout.type}</Text>
            </Box>
          </HStack>
          <HStack>
            <Button
              leftIcon={<Edit size={18} />}
              colorScheme="blue"
              onClick={() => startEditingWorkout(currentWorkout)}
            >
              Edit
            </Button>
            <Button
              leftIcon={<Trash2 size={18} />}
              colorScheme="red"
              variant="outline"
              onClick={() => handleDeleteWorkout(currentWorkout.id)}
            >
              Delete
            </Button>
          </HStack>
        </HStack>

        {/* Workout Info */}
        <Box p={5} borderWidth="1px" borderRadius="lg" shadow="sm">
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <HStack>
                <Badge 
                  colorScheme={currentWorkout.templateType === 'single' ? 'blue' : 'purple'} 
                  variant="subtle"
                >
                  {currentWorkout.templateType === 'single' ? 'Single Day Workout' : 'Weekly Training Plan'}
                </Badge>
                <Text>
                  {currentWorkout.templateType === 'single' 
                    ? `${currentWorkout.exercises?.length || 0} exercises`
                    : `${currentWorkout.weeklyPlan?.filter(d => !d.isRestDay).length || 0} training days`
                  }
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                Created: {currentWorkout.createdAt.toLocaleDateString()}
              </Text>
            </HStack>
            {currentWorkout.updatedAt.getTime() !== currentWorkout.createdAt.getTime() && (
              <Text fontSize="sm" color="gray.500">
                Last updated: {currentWorkout.updatedAt.toLocaleDateString()}
              </Text>
            )}
          </VStack>
        </Box>

        {/* Assigned Athletes */}
        <Box p={5} borderWidth="1px" borderRadius="lg" shadow="sm">
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading as="h2" size="md">
                Assigned Athletes ({currentWorkout.assignedAthletes.length})
              </Heading>
              <Button
                leftIcon={<Users size={18} />}
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() => openAthleteModal(currentWorkout.id)}
              >
                Edit Assignment
              </Button>
            </HStack>
            
            {currentWorkout.assignedAthletes.length > 0 ? (
              <VStack align="stretch" spacing={3}>
                <AvatarGroup size="lg" max={8}>
                  {currentWorkout.assignedAthletes.map((athlete) => (
                    <Avatar
                      key={athlete.id}
                      name={athlete.name}
                      src={athlete.avatar}
                      title={`${athlete.name} - ${athlete.event}`}
                    />
                  ))}
                </AvatarGroup>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {currentWorkout.assignedAthletes.map((athlete) => (
                    <HStack key={athlete.id} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                      <Avatar size="sm" name={athlete.name} src={athlete.avatar} />
                      <VStack align="start" spacing={0} flex="1">
                        <Text fontWeight="semibold" fontSize="sm">{athlete.name}</Text>
                        <Text fontSize="xs" color="gray.600">{athlete.event}</Text>
                      </VStack>
                    </HStack>
                  ))}
                </SimpleGrid>
              </VStack>
            ) : (
              <Text color="gray.500" textAlign="center" p={4} fontStyle="italic">
                This workout has not been assigned to any athletes yet.
              </Text>
            )}
          </VStack>
        </Box>

        {/* Exercise List - Read Only */}
        {currentWorkout.templateType === 'single' ? (
          <Box p={5} borderWidth="1px" borderRadius="lg" shadow="sm">
            <Heading as="h2" size="md" mb={4}>Exercises</Heading>
            
            {currentWorkout.exercises?.length === 0 ? (
              <Text color="gray.500" textAlign="center" p={4}>No exercises in this workout.</Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {currentWorkout.exercises?.map((exercise, index) => (
                  <Box key={exercise.instanceId} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                    <HStack justify="space-between" mb={2}>
                      <HStack>
                        <Text fontWeight="bold" fontSize="lg">{index + 1}. {exercise.name}</Text>
                        <Tag size="sm" colorScheme="teal" variant="subtle">{exercise.category}</Tag>
                      </HStack>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" mb={3}>{exercise.description}</Text>
                    
                    <HStack spacing={6} mb={2}>
                      {exercise.sets && (
                        <Text fontSize="sm"><strong>Sets:</strong> {exercise.sets}</Text>
                      )}
                      {exercise.reps && (
                        <Text fontSize="sm"><strong>Reps:</strong> {exercise.reps}</Text>
                      )}
                    </HStack>
                    
                    {exercise.notes && (
                      <Text fontSize="sm" color="gray.600">
                        <strong>Notes:</strong> {exercise.notes}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        ) : (
          <Box p={5} borderWidth="1px" borderRadius="lg" shadow="sm">
            <Heading as="h2" size="md" mb={4}>Weekly Training Plan</Heading>
            
            <VStack spacing={4} align="stretch">
              {DAYS_OF_WEEK.map((day) => {
                const dayWorkout = currentWorkout.weeklyPlan?.find(d => d.day === day.value);
                if (!dayWorkout) return null;
                
                return (
                  <Box key={day.value} p={4} borderWidth="1px" borderRadius="md" bg={dayWorkout.isRestDay ? "gray.50" : "white"}>
                    <HStack justify="space-between" mb={3}>
                      <Heading size="sm">{day.label}</Heading>
                      {dayWorkout.isRestDay ? (
                        <Badge colorScheme="gray" variant="solid">Rest Day</Badge>
                      ) : (
                        <Badge colorScheme="blue" variant="subtle">{dayWorkout.exercises.length} exercises</Badge>
                      )}
                    </HStack>
                    
                    {dayWorkout.isRestDay ? (
                      <Text fontSize="sm" color="gray.500" fontStyle="italic">Scheduled rest day</Text>
                    ) : dayWorkout.exercises.length === 0 ? (
                      <Text fontSize="sm" color="gray.500" fontStyle="italic">No exercises planned</Text>
                    ) : (
                      <VStack spacing={2} align="stretch">
                        {dayWorkout.exercises.map((exercise, index) => (
                          <Box key={exercise.instanceId} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                            <HStack justify="space-between" mb={1}>
                              <HStack>
                                <Text fontWeight="semibold" fontSize="sm">{index + 1}. {exercise.name}</Text>
                                <Tag size="xs" colorScheme="teal" variant="subtle">{exercise.category}</Tag>
                              </HStack>
                            </HStack>
                            <Text fontSize="xs" color="gray.600" mb={2}>{exercise.description}</Text>
                            
                            <HStack spacing={4}>
                              {exercise.sets && (
                                <Text fontSize="xs"><strong>Sets:</strong> {exercise.sets}</Text>
                              )}
                              {exercise.reps && (
                                <Text fontSize="xs"><strong>Reps:</strong> {exercise.reps}</Text>
                              )}
                            </HStack>
                            
                            {exercise.notes && (
                              <Text fontSize="xs" color="gray.600" mt={1}>
                                <strong>Notes:</strong> {exercise.notes}
                              </Text>
                            )}
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>
                );
              })}
            </VStack>
          </Box>
        )}
      </VStack>
    );
  };

  // Enhanced step header with clickable progress and better info
  const renderStepHeader = () => {
    const currentStepInfo = WORKOUT_CREATION_STEPS[currentStep - 1];
    const progressPercentage = (currentStep / WORKOUT_CREATION_STEPS.length) * 100;
    const validation = validateCurrentStep();
    
    return (
      <VStack spacing={0} align="stretch" mb={3}>
        {/* Full Screen Progress Bar */}
        <Box 
          position="fixed"
          top="85px"
          left={`${sidebarWidth}px`}
          right="0"
          zIndex="999"
          bg="white"
          borderBottom="1px solid"
          borderBottomColor="gray.200"
          transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        >
          <Progress 
            value={progressPercentage} 
            colorScheme="blue" 
            size="md" 
            borderRadius="0"
            height="8px"
          />
          
          {/* Clickable Step Labels */}
          <Box px={8} py={2}>
          <HStack justify="space-between" spacing={2}>
            {WORKOUT_CREATION_STEPS.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
                const isAccessible = step.id <= currentStep;
              
              return (
                <Button
                  key={step.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => isAccessible && goToStep(step.id)}
                  isDisabled={!isAccessible}
                  color={isCurrent ? 'blue.600' : isCompleted ? 'green.600' : 'gray.500'}
                  fontWeight={isCurrent ? 'bold' : 'normal'}
                  _hover={isAccessible ? { bg: 'gray.100' } : {}}
                  cursor={isAccessible ? 'pointer' : 'default'}
                  flex="1"
                  minW="0"
                >
                  <HStack spacing={1} minW="0">
                    <Text fontSize="xs">{step.id}</Text>
                    <Text fontSize="xs" isTruncated>{step.shortTitle}</Text>
                    {isCompleted && <Text fontSize="xs" color="green.500">✓</Text>}
                    {index < WORKOUT_CREATION_STEPS.length - 1 && <Text fontSize="xs" color="gray.400">→</Text>}
                  </HStack>
                </Button>
              );
            })}
          </HStack>
          </Box>
        </Box>

        {/* Spacer to account for fixed progress bar and step labels */}
        <Box height="80px" />

        {/* New Card Component - moved higher under the progress bar */}
        <Card variant="outline" shadow="sm" w="100%" mt={0} mb={2}>
          <CardBody p={4}>
            <VStack spacing={4} align="stretch" w="100%">
              <HStack justify="space-between" align="center" w="100%">
                <HStack spacing={4}>
                  <IconButton
                    icon={<ArrowLeft size={18} />}
                    variant="ghost"
                    aria-label="Back to list"
                    onClick={goToListView}
                  />
                  <VStack align="start" spacing={1}>
                    <Heading size="md" color="blue.700">
            {currentStepInfo.title}
          </Heading>
                    <Text fontSize="sm" color="blue.600">
            {currentStepInfo.description}
          </Text>
                    <VStack align="start" spacing={0}>
          <Text fontSize="sm" color="blue.500" fontStyle="italic">
                        Browse our exercise library and build your workout.
          </Text>
                      <Text fontSize="sm" color="blue.500" fontStyle="italic">
                        For weekly plans, customize each day individually.
                      </Text>
                    </VStack>
                  </VStack>
                </HStack>
                
                {/* Center Title for Step 1 */}
                {currentStep === 1 && (
                  <VStack spacing={2} align="center" flex="1">
                    <Box color="blue.500">
                      <Target size={32} />
                    </Box>
                    <Heading size="lg" color="blue.700" textAlign="center">
                      Let's Create Your Workout
                    </Heading>
                    <Text fontSize="sm" color="blue.600" textAlign="center">
                      Choose how you'll be using the workout creator
                    </Text>
                  </VStack>
                )}
                
                {/* Days of Week Selector in the middle */}
                {templateType === 'weekly' && currentStep === 2 && (
                  <VStack spacing={2} align="center">
                    <HStack spacing={2} justify="center" flexWrap="wrap">
                      {DAYS_OF_WEEK.map((day) => {
                        const dayWorkout = weeklyPlan.find(d => d.day === day.value);
                        const exerciseCount = dayWorkout?.exercises.length || 0;
                        const isRestDay = dayWorkout?.isRestDay || false;
                        const isActive = currentDay === day.value;
                        
                        return (
                          <Button
                            key={day.value}
                            size="sm"
                            colorScheme={isActive ? 'blue' : 'gray'}
                            variant={isActive ? 'solid' : 'outline'}
                            onClick={() => setCurrentDay(day.value)}
                            minWidth="70px"
                            height="35px"
                          >
                            <VStack spacing={0}>
                              <Text fontSize="xs" fontWeight="bold">
                                {day.label.slice(0, 3)}
                              </Text>
                              <Text fontSize="2xs" color={isActive ? "white" : "gray.500"}>
                                {isRestDay ? 'Rest' : `${exerciseCount}ex`}
                              </Text>
                            </VStack>
                          </Button>
                        );
                      })}
                    </HStack>
                    
                    {/* Rest Day and Copy Options */}
                    <HStack spacing={3}>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme={getCurrentDayWorkout()?.isRestDay ? "red" : "gray"}
                        onClick={() => toggleRestDay(currentDay)}
                      >
                        {getCurrentDayWorkout()?.isRestDay ? "Remove Rest Day" : "Set as Rest Day"}
                      </Button>
                      
                      <Select
                        placeholder="Copy from..."
                        size="xs"
                        maxWidth="120px"
                        onChange={(e) => {
                          if (e.target.value) {
                            copyDayExercises(e.target.value, currentDay);
                            e.target.value = ""; // Reset select
                          }
                        }}
                      >
                        {DAYS_OF_WEEK.filter(d => {
                          const dayWorkout = weeklyPlan.find(day => day.day === d.value);
                          return d.value !== currentDay && dayWorkout && !dayWorkout.isRestDay && dayWorkout.exercises.length > 0;
                        }).map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </Select>
                      
                      {getCurrentExercises().length > 0 && (
                        <Select
                          placeholder="Copy to..."
                          size="xs"
                          maxWidth="120px"
                          onChange={(e) => {
                            if (e.target.value) {
                              copyDayExercises(currentDay, e.target.value);
                              e.target.value = ""; // Reset select
                            }
                          }}
                        >
                          {DAYS_OF_WEEK.filter(d => d.value !== currentDay).map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </Select>
                      )}
                    </HStack>
                  </VStack>
                )}
                
                {/* Workout Stats on the right */}
                <HStack spacing={8} justify="center" p={4} bg="gray.50" borderRadius="md">
                  <VStack spacing={0} align="center">
                    <Text fontSize="xl" fontWeight="bold" color="blue.600">
                      {templateType === 'single' ? getCurrentExercises().length : weeklyPlan.filter(d => !d.isRestDay).length}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {templateType === 'single' ? 'Total Exercises' : 'Training Days'}
                    </Text>
                  </VStack>
                  <VStack spacing={0} align="center">
                    <Text fontSize="xl" fontWeight="bold" color="blue.600">
                      {templateType === 'single' 
                        ? getCurrentExercises().reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0)
                        : weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0)
                      }
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {templateType === 'single' ? 'Total Sets' : 'Total Exercises'}
                    </Text>
                  </VStack>
                  <VStack spacing={0} align="center">
                    <Text fontSize="xl" fontWeight="bold" color="blue.600">
                      ~{templateType === 'single' 
                        ? getCurrentExercises().length * 3
                        : Math.round((weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0) * 3) / 7)
                      }
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {templateType === 'single' ? 'Minutes' : 'Min/Day Avg'}
                    </Text>
                  </VStack>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
          
          {/* Validation Warning or Info as Card Footer */}
          {!validation.isValid && validation.message ? (
            <Box borderTop="1px solid" borderTopColor="gray.200" bg="orange.50" borderBottomRadius="md" px={6} py={3}>
              <HStack>
                <Box color="orange.500">⚠️</Box>
                <Text fontSize="sm" color="orange.700" fontWeight="medium">
                  {validation.message}
                </Text>
              </HStack>
            </Box>
          ) : currentStep === 2 && templateType === 'weekly' ? (
            <Box borderTop="1px solid" borderTopColor="gray.200" bg="blue.50" borderBottomRadius="md" px={6} py={3}>
              <HStack>
                <Box color="blue.500">💡</Box>
                <Text fontSize="sm" color="blue.700" fontWeight="medium">
                  You can continue adding exercises or proceed to assign athletes.
                </Text>
              </HStack>
            </Box>
          ) : null}
        </Card>
      </VStack>
    );
  };

  const renderStepNavigation = () => {
    const validation = validateCurrentStep();
    
    return (
      <Box 
        position="fixed" 
        bottom="0" 
        left={`${sidebarWidth}px`}
        right="0"
        bg="white" 
        borderTop="2px solid" 
        borderTopColor="gray.200" 
        p={6} 
        shadow="2xl"
        zIndex="1000"
        transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        <HStack justify="space-between" align="center" maxW="100%" mx="auto">
          <Button
            leftIcon={<ChevronLeft size={20} />}
            variant="outline"
            size="lg"
            onClick={goToPreviousStep}
            isDisabled={currentStep === 1}
            borderWidth="2px"
            _hover={{ bg: "gray.50", borderColor: "gray.400" }}
          >
            Previous
          </Button>
          
          {/* Enhanced Progress Dots */}
          <HStack spacing={4}>
            {WORKOUT_CREATION_STEPS.map((step, index) => (
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
                  shadow="md"
                  border="2px solid white"
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
                  color={step.id === currentStep ? 'blue.600' : step.id < currentStep ? 'green.600' : 'gray.400'}
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
            <Button
              rightIcon={<ChevronRight size={20} />}
              colorScheme="blue"
              size="lg"
              onClick={goToNextStep}
              isDisabled={!validation.isValid}
              borderWidth="2px"
              shadow="lg"
              _hover={{ 
                transform: validation.isValid ? "scale(1.05)" : "none",
                shadow: validation.isValid ? "xl" : "lg"
              }}
              _disabled={{
                opacity: 0.6,
                cursor: "not-allowed",
                transform: "none"
              }}
              transition="all 0.2s"
              fontWeight="bold"
              px={8}
            >
              {validation.isValid ? "Continue" : "Complete Step"}
            </Button>
          ) : (
            <Button
              rightIcon={<Save size={20} />}
              colorScheme="green"
              size="lg"
              onClick={handleSaveWorkout}
              borderWidth="2px"
              shadow="lg"
              _hover={{ 
                transform: "scale(1.05)",
                shadow: "xl"
              }}
              transition="all 0.2s"
              fontWeight="bold"
              px={8}
            >
              {isEditing ? 'Update Workout' : 'Save Workout'}
            </Button>
          )}
        </HStack>
      </Box>
    );
  };

  // Step 1: Workout Details
  const renderStep1WorkoutDetails = () => (
    <VStack spacing={8} align="stretch" w="100%" maxW="1200px" mx="auto">
      {/* Workout Name */}
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel fontSize="lg" fontWeight="semibold" color="gray.700">
            Workout Name <Text as="span" color="red.500">*</Text>
          </FormLabel>
          <Input 
            value={workoutName} 
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="My New Workout"
            size="lg"
            fontSize="lg"
            py={6}
            borderWidth="2px"
            _focus={{ borderColor: "blue.400", shadow: "lg" }}
            _hover={{ borderColor: "gray.400" }}
          />
        </FormControl>
      </VStack>

      {/* Template Type and Focus Side by Side */}
      <HStack spacing={8} align="start" w="100%">
        {/* Template Type Selection */}
        <VStack spacing={6} align="stretch" flex="1">
          <VStack spacing={2} align="center">
            <HStack>
              <Calendar size={24} color="var(--chakra-colors-blue-500)" />
              <Heading size="md" color="gray.700">
                Choose Your Template Type
              </Heading>
            </HStack>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              Will this be a single workout or a weekly training plan?
            </Text>
          </VStack>
          
          <VStack spacing={4}>
            {TEMPLATE_TYPES.map((type) => (
              <Card
                key={type.value}
                variant="outline"
                cursor="pointer"
                onClick={() => setTemplateType(type.value as 'single' | 'weekly')}
                bg={templateType === type.value ? "blue.50" : "white"}
                borderColor={templateType === type.value ? "blue.400" : "gray.200"}
                borderWidth={templateType === type.value ? "3px" : "2px"}
                _hover={{ 
                  shadow: "lg",
                  borderColor: templateType === type.value ? "blue.500" : "blue.300",
                  transform: "translateY(-2px)"
                }}
                transition="all 0.3s"
                w="100%"
                h="140px"
              >
                <CardBody p={6}>
                  <Flex justify="center" align="center" h="100%">
                    <HStack spacing={4} w="100%">
                      <Box color={templateType === type.value ? "blue.500" : "gray.500"}>
                        {type.value === 'single' ? <FileText size={32} /> : <Calendar size={32} />}
                      </Box>
                      <VStack spacing={2} align="start" flex="1">
                        <Heading size="sm" color={templateType === type.value ? "blue.700" : "gray.700"}>
                          {type.label}
                        </Heading>
                        <Text fontSize="xs" color="gray.600" lineHeight="short">
                          {type.value === 'single' 
                            ? 'Perfect for one-time workouts or specific training sessions'
                            : 'Create a complete weekly training schedule with different workouts'
                          }
                        </Text>
                        {templateType === type.value && (
                          <Badge colorScheme="blue" variant="solid" fontSize="xs" px={2} py={1}>
                            ✓ Selected
                          </Badge>
                        )}
                      </VStack>
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </VStack>

        {/* Workout Type Selection */}
        <VStack spacing={6} align="stretch" flex="1">
          <VStack spacing={2} align="center">
            <HStack>
              <Target size={24} color="var(--chakra-colors-green-500)" />
              <Heading size="md" color="gray.700">
                What's the Focus?
              </Heading>
            </HStack>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              Select the primary type of training for this workout
            </Text>
          </VStack>
          
          <SimpleGrid columns={2} spacing={3} w="100%">
            {WORKOUT_TYPES.map((type) => {
              const getTypeIcon = (workoutType: string) => {
                switch (workoutType) {
                  case 'Strength': return <Dumbbell size={20} />;
                  case 'Running': return <Zap size={20} />;
                  case 'Flexibility': return <Heart size={20} />;
                  case 'Recovery': return <Clock size={20} />;
                  case 'Custom': return <User size={20} />;
                  default: return <Dumbbell size={20} />;
                }
              };

              const getTypeDescription = (workoutType: string) => {
                switch (workoutType) {
                  case 'Strength': return 'Weight training & resistance exercises';
                  case 'Running': return 'Sprints, distance runs & cardio';
                  case 'Flexibility': return 'Stretching, yoga & mobility work';
                  case 'Recovery': return 'Light movement & regeneration';
                  case 'Custom': return 'Mix of different training types';
                  default: return 'General fitness training';
                }
              };

              return (
                <Card
                  key={type}
                  variant="outline"
                  cursor="pointer"
                  onClick={() => setWorkoutType(type)}
                  bg={workoutType === type ? "green.50" : "white"}
                  borderColor={workoutType === type ? "green.400" : "gray.200"}
                  borderWidth={workoutType === type ? "3px" : "2px"}
                  _hover={{ 
                    shadow: "md",
                    borderColor: workoutType === type ? "green.500" : "green.300",
                    transform: "translateY(-1px)"
                  }}
                  transition="all 0.3s"
                  h="100px"
                >
                  <CardBody p={4}>
                    <Flex justify="center" align="center" h="100%">
                      <VStack spacing={2} textAlign="center">
                        <Box color={workoutType === type ? "green.500" : "gray.500"}>
                          {getTypeIcon(type)}
                        </Box>
                        <VStack spacing={1}>
                          <Heading size="xs" color={workoutType === type ? "green.700" : "gray.700"}>
                            {type}
                          </Heading>
                          <Text fontSize="2xs" color="gray.600" lineHeight="short" noOfLines={2}>
                            {getTypeDescription(type)}
                          </Text>
                        </VStack>
                        {workoutType === type && (
                          <Badge colorScheme="green" variant="solid" fontSize="2xs" px={1}>
                            ✓
                          </Badge>
                        )}
                      </VStack>
                    </Flex>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        </VStack>
      </HStack>

      {/* Preview Section */}
      {/* Preview section removed to give more space to template type and focus sections */}
    </VStack>
  );

  return (
    <Box w="100%" height="100vh" position="relative" overflow="hidden" px={8}>
      {currentView === 'list' && renderWorkoutList()}
      {currentView === 'create' && renderCreateEditView()}
      {currentView === 'detail' && renderDetailView()}
      
      {/* Athlete Assignment Modal */}
      <Modal isOpen={isAthleteModalOpen} onClose={onAthleteModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Assign Athletes to Workout
            {workoutToAssign && (
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                {savedWorkouts.find(w => w.id === workoutToAssign)?.name}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Search */}
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Search size={18} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search athletes by name or event..."
                  value={athleteSearchTerm}
                  onChange={(e) => setAthleteSearchTerm(e.target.value)}
                />
              </InputGroup>

              {/* Selected count */}
              {Object.keys(selectedAthletes).length > 0 && (
                <HStack justify="space-between" p={3} bg="blue.50" borderRadius="md">
                  <Text fontWeight="semibold" color="blue.700">
                    {Object.keys(selectedAthletes).length} athlete{Object.keys(selectedAthletes).length !== 1 ? 's' : ''} selected
                  </Text>
                  <AvatarGroup size="sm" max={5}>
                    {Object.values(selectedAthletes).map((athlete) => (
                      <Avatar
                        key={athlete.id}
                        name={athlete.name}
                        src={athlete.avatar}
                        title={athlete.name}
                      />
                    ))}
                  </AvatarGroup>
                </HStack>
              )}

              <Divider />

              {/* Athletes List */}
              <Box
                height="400px"
                overflow="auto"
                borderWidth="1px"
                borderRadius="md"
                p={3}
                bg="gray.50"
              >
                {filteredAthletes.length === 0 ? (
                  <Text color="gray.500" textAlign="center" py={8}>
                    No athletes found. Try adjusting your search.
                  </Text>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {filteredAthletes.map((athlete) => {
                      const isSelected = !!selectedAthletes[athlete.id];
                      
                      return (
                        <Box
                          key={athlete.id}
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                          bg={isSelected ? "blue.50" : "white"}
                          borderColor={isSelected ? "blue.200" : "gray.200"}
                          cursor="pointer"
                          onClick={() => handleAthleteSelection(athlete)}
                          _hover={{ bg: isSelected ? "blue.100" : "gray.50" }}
                          transition="all 0.2s"
                        >
                          <HStack>
                            <Avatar size="sm" name={athlete.name} src={athlete.avatar} />
                            <VStack align="start" spacing={0} flex="1">
                              <Text fontWeight="semibold" fontSize="sm">
                                {athlete.name}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {athlete.event}
                              </Text>
                            </VStack>
                            <Checkbox
                              isChecked={isSelected}
                              onChange={() => handleAthleteSelection(athlete)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAthleteModalClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSaveAthleteAssignment}>
              {workoutToAssign ? 'Update Assignment' : 'Confirm Selection'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WorkoutCreatorPOC; 