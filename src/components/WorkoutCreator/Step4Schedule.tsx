import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  Text,
  Card,
  CardBody,
  useColorModeValue,
  Badge,
  Icon,
  Alert,
  AlertIcon,
  SimpleGrid,
  Switch,
  Skeleton,
  useToast,
  Flex,
  Heading,
  Divider,
  FormErrorMessage,
} from '@chakra-ui/react';
import { Calendar, Clock, MapPin, CalendarDays, Users, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { WeeklyWorkoutSelector } from '../WeeklyWorkoutSelector';
import { DateTimePicker } from '../DateTimePicker';
import type { Workout } from '../../services/api';

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

interface Step4ScheduleProps {
  // Template type determines the UI
  templateType: 'single' | 'weekly' | 'monthly';
  
  // Single day scheduling
  date: string;
  time: string;
  location: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onLocationChange: (location: string) => void;
  
  // Duration field
  duration: string;
  onDurationChange: (duration: string) => void;
  
  // Template mode
  isTemplate: boolean;
  onIsTemplateChange: (isTemplate: boolean) => void;
  
  // Workout details
  workoutName: string;
  onWorkoutNameChange: (name: string) => void;
  
  // Weekly/Monthly plans data
  blocks: WorkoutBlock[];
  dailyBlocks: Record<string, WorkoutBlock[]>;
}

// Helper function to format date without timezone issues
const formatLocalDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString();
};

const Step4Schedule: React.FC<Step4ScheduleProps> = ({
  templateType,
  date,
  time,
  location,
  onDateChange,
  onTimeChange,
  onLocationChange,
  duration,
  onDurationChange,
  isTemplate,
  onIsTemplateChange,
  workoutName,
  onWorkoutNameChange,
  blocks,
  dailyBlocks,
}) => {
  const toast = useToast();
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');
  const summaryBg = useColorModeValue('blue.50', 'blue.900');
  const summaryBorder = useColorModeValue('blue.200', 'blue.700');
  
  // Monthly plan specific state
  const [monthlyPlanData, setMonthlyPlanData] = useState({
    name: workoutName,
    description: '',
    startDate: (() => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    })(),
    weeks: [
      { week_number: 1, workout_id: '', is_rest_week: false },
      { week_number: 2, workout_id: '', is_rest_week: false },
      { week_number: 3, workout_id: '', is_rest_week: false },
      { week_number: 4, workout_id: '', is_rest_week: false }
    ]
  });
  
  // Available weekly workout templates for monthly plans
  const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Load available weekly workout templates when in monthly mode
  useEffect(() => {
    if (templateType === 'monthly') {
      loadAvailableWorkouts();
    }
  }, [templateType]);
  
  // Sync workout name with monthly plan name
  useEffect(() => {
    if (templateType === 'monthly') {
      setMonthlyPlanData(prev => ({
        ...prev,
        name: workoutName
      }));
    }
  }, [workoutName, templateType]);
  
  const loadAvailableWorkouts = async () => {
    try {
      setWorkoutsLoading(true);
      
      // Load all workouts, then filter for weekly ones
      const allWorkouts = await api.workouts.getAll();
      
      // Filter for weekly workouts (both templates and regular workouts)
      const weeklyWorkouts = allWorkouts.filter(workout => 
        workout.template_type === 'weekly' || 
        (workout.type === 'weekly' && workout.template_type !== 'single')
      );
      
      setAvailableWorkouts(weeklyWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
      toast({
        title: 'Error loading workouts',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setWorkoutsLoading(false);
    }
  };
  
  // Validation for monthly plans
  const validateMonthlyPlan = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!monthlyPlanData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (!monthlyPlanData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const today = new Date();
      const todayString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      if (monthlyPlanData.startDate < todayString) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    // Check that non-rest weeks have workouts selected
    const trainingWeeks = monthlyPlanData.weeks.filter(w => !w.is_rest_week);
    const incompleteWeeks = trainingWeeks.filter(w => !w.workout_id);
    
    if (incompleteWeeks.length > 0) {
      newErrors.weeks = `Please select workouts for all training weeks (Week${incompleteWeeks.length > 1 ? 's' : ''} ${incompleteWeeks.map(w => w.week_number).join(', ')})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Render single day scheduling
  const renderSingleDaySchedule = () => (
    <VStack spacing={6} align="stretch">
      <Card bg="transparent" borderColor={borderColor} variant="outline" position="relative">
        <CardBody>
          {/* Save as Template Toggle - Top Right Corner */}
          <HStack spacing={2} position="absolute" top={4} right={4} zIndex={1}>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">Save as Template</Text>
            <Switch
              id="template-mode"
              isChecked={isTemplate}
              onChange={(e) => onIsTemplateChange(e.target.checked)}
              colorScheme="green"
              size="md"
            />
          </HStack>
          
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Workout Name</FormLabel>
              <Input
                value={workoutName}
                onChange={(e) => onWorkoutNameChange(e.target.value)}
                placeholder="Enter workout name"
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Date & Time Card - separate from details */}
      <Card bg="transparent" borderColor={borderColor} variant="outline">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Date & Time</FormLabel>
              <Box w="100%" overflow="hidden">
                <DateTimePicker
                  selectedDates={date ? [date] : []}
                  selectedStartTime={time}
                  isMultiSelect={false}
                  onDateSelect={(dates) => onDateChange(dates[0] || '')}
                  onTimeSelect={(startTime) => onTimeChange(startTime)}
                />
              </Box>
            </FormControl>
            
            <FormControl>
              <FormLabel>Duration (Optional)</FormLabel>
              <Input
                value={duration}
                onChange={(e) => onDurationChange(e.target.value)}
                placeholder="e.g., 60 minutes, 1.5 hours"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Location (Optional)</FormLabel>
              <Input
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder="Enter workout location"
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      
      {/* Workout Summary */}
      <Card bg="transparent" borderColor={summaryBorder} variant="outline">
        <CardBody>
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold" color={textColor}>Workout Summary</Text>
            <Text fontSize="sm" color={subtitleColor}>
              {blocks.length} block{blocks.length !== 1 ? 's' : ''} • {blocks.reduce((total, block) => total + block.exercises.length, 0)} exercise{blocks.reduce((total, block) => total + block.exercises.length, 0) !== 1 ? 's' : ''}
            </Text>
            {isTemplate && (
              <Badge colorScheme="green">Will be saved as template</Badge>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
  
  // Render weekly plan scheduling
  const renderWeeklySchedule = () => (
    <VStack spacing={6} align="stretch">
      <Card bg="transparent" borderColor={borderColor} variant="outline" position="relative">
        <CardBody>
          {/* Save as Template Toggle - Top Right Corner */}
          <HStack spacing={2} position="absolute" top={4} right={4} zIndex={1}>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">Save as Template</Text>
            <Switch
              id="weekly-template-mode"
              isChecked={isTemplate}
              onChange={(e) => onIsTemplateChange(e.target.checked)}
              colorScheme="green"
              size="md"
            />
          </HStack>
          
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Weekly Plan Name</FormLabel>
              <Input
                value={workoutName}
                onChange={(e) => onWorkoutNameChange(e.target.value)}
                placeholder="Enter weekly plan name"
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Date & Time Card - separate from details */}
      <Card bg="transparent" borderColor={borderColor} variant="outline">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Start Date & Time</FormLabel>
              <Box w="100%" overflow="hidden">
                <DateTimePicker
                  selectedDates={date ? [date] : []}
                  selectedStartTime={time}
                  isMultiSelect={false}
                  onDateSelect={(dates) => onDateChange(dates[0] || '')}
                  onTimeSelect={(startTime) => onTimeChange(startTime)}
                />
              </Box>
            </FormControl>
            
            <FormControl>
              <FormLabel>Duration (Optional)</FormLabel>
              <Input
                value={duration}
                onChange={(e) => onDurationChange(e.target.value)}
                placeholder="e.g., 60 minutes, 1.5 hours"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Location (Optional)</FormLabel>
              <Input
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder="Enter training location"
              />
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      
      {/* Weekly Summary */}
      <Card bg="transparent" borderColor={summaryBorder} variant="outline">
        <CardBody>
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold" color={textColor}>Weekly Plan Summary</Text>
            <SimpleGrid columns={2} spacing={4} w="full">
              {Object.entries(dailyBlocks).map(([day, dayBlocks]) => (
                <HStack key={day} justify="space-between">
                  <Text fontSize="sm" textTransform="capitalize" color={textColor}>
                    {day}:
                  </Text>
                  <Text fontSize="sm" color={subtitleColor}>
                    {dayBlocks.length} block{dayBlocks.length !== 1 ? 's' : ''}
                  </Text>
                </HStack>
              ))}
            </SimpleGrid>
            {isTemplate && (
              <Badge colorScheme="green">Will be saved as template</Badge>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
  
  // Render monthly plan builder
  const renderMonthlyPlan = () => (
    <VStack spacing={6} align="stretch">
      {/* Plan Details */}
      <Card bg="transparent" borderColor={borderColor} variant="outline" position="relative">
        <CardBody>
          {/* Save as Template Toggle - Top Right Corner */}
          <HStack spacing={2} position="absolute" top={4} right={4} zIndex={1}>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">Save as Template</Text>
            <Switch
              id="monthly-template-mode"
              isChecked={isTemplate}
              onChange={(e) => onIsTemplateChange(e.target.checked)}
              colorScheme="green"
              size="md"
            />
          </HStack>
          
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Plan Name</FormLabel>
              <Input
                value={workoutName}
                onChange={(e) => onWorkoutNameChange(e.target.value)}
                placeholder="e.g., January Training Block"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Training Start Date</FormLabel>
              <Box w="100%" overflow="hidden">
                <DateTimePicker
                  selectedDates={date ? [date] : []}
                  selectedStartTime={time}
                  isMultiSelect={false}
                  onDateSelect={(dates) => onDateChange(dates[0] || '')}
                  onTimeSelect={(startTime) => onTimeChange(startTime)}
                />
              </Box>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Monthly Plan Summary */}
      <Card bg="transparent" borderColor={summaryBorder} variant="outline">
        <CardBody>
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold" color={textColor}>Monthly Plan Summary</Text>
            <Text fontSize="sm" color={subtitleColor}>
              4-week training plan ready for athlete assignment
            </Text>
            <Text fontSize="sm" color={subtitleColor}>
              Weekly schedule configured in Step 2
            </Text>
            {isTemplate && (
              <Badge colorScheme="green">Will be saved as template</Badge>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
  
  // Main render based on template type
  return (
    <VStack spacing={6} align="stretch" w="100%">
      {/* Header */}
      <Box>
        <Heading size="xl" color={textColor} mb={2}>
          Schedule & Details
        </Heading>
        <Text fontSize="lg" color={subtitleColor}>
          Configure the timing and final details for your {templateType === 'single' ? 'workout' : templateType === 'weekly' ? 'weekly plan' : 'monthly plan'}
        </Text>
      </Box>

      {templateType === 'single' && renderSingleDaySchedule()}
      {templateType === 'weekly' && renderWeeklySchedule()}
      {templateType === 'monthly' && renderMonthlyPlan()}
    </VStack>
  );
};

export default Step4Schedule; 