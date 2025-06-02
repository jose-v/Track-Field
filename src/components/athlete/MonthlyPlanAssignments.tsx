import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
  Text,
  Heading,
  Badge,
  Icon,
  Button,
  Progress,
  SimpleGrid,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Tooltip,
  Flex,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Stack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tag,
  TagLabel,
  TagLeftIcon,
  Collapse,
  useBreakpointValue,
  Skeleton,
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaClock,
  FaCheck,
  FaEye,
  FaRunning,
  FaPlay,
  FaChartLine,
  FaDumbbell,
  FaExpandArrowsAlt,
  FaChevronDown,
  FaChevronRight,
  FaBed,
  FaFire,
  FaStopwatch,
  FaRuler,
  FaRedoAlt,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { MonthlyPlanAssignment } from '../../services/dbSchema';

interface AssignmentWithPlan extends MonthlyPlanAssignment {
  monthly_plans: {
    id: string;
    name: string;
    description: string;
    month: number;
    year: number;
    weeks: any[];
  };
}

interface MonthlyPlanAssignmentsProps {
  onViewPlan?: (assignment: AssignmentWithPlan) => void;
}

export function MonthlyPlanAssignments({ onViewPlan }: MonthlyPlanAssignmentsProps) {
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.800', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const drawerBg = useColorModeValue('white', 'gray.800');
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.700');
  const restDayBg = useColorModeValue('orange.50', 'orange.900');
  const trainingDayBg = useColorModeValue('blue.50', 'blue.900');
  
  // State
  const [assignments, setAssignments] = useState<AssignmentWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithPlan | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [weeksWithDetails, setWeeksWithDetails] = useState<any[]>([]);
  const [loadingWeekDetails, setLoadingWeekDetails] = useState(false);

  // Responsive drawer size
  const drawerSize = useBreakpointValue({ base: 'full', md: 'xl' });

  // Get month name helper
  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  // Load assignments
  const loadAssignments = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await api.monthlyPlanAssignments.getByAthlete(user.id);
      setAssignments(data as AssignmentWithPlan[]);
    } catch (error) {
      console.error('Error loading monthly plan assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAssignments();
  }, [user?.id]);

  // Load detailed workout information for weeks
  const loadWeekDetails = async (planWeeks: any[]) => {
    if (!planWeeks || planWeeks.length === 0) return [];

    try {
      setLoadingWeekDetails(true);
      
      const weeksWithWorkouts = await Promise.all(
        planWeeks.map(async (week) => {
          if (week.is_rest_week || !week.workout_id) {
            return {
              ...week,
              workout: null,
              daily_workouts: []
            };
          }

          try {
            // Fetch the workout template details
            const allWorkouts = await api.workouts.getAll();
            const workout = allWorkouts.find(w => w.id === week.workout_id);
            
            if (!workout) {
              return {
                ...week,
                workout: null,
                daily_workouts: []
              };
            }

            // Parse daily workouts from the weekly template
            let dailyWorkouts: any[] = [];
            
            if (workout.template_type === 'weekly' && workout.exercises) {
              // If it's a weekly template, exercises contains the daily breakdown
              if (Array.isArray(workout.exercises)) {
                // Check if it's the old format (array of daily objects)
                dailyWorkouts = workout.exercises.map((dayData: any, index: number) => {
                  if (dayData.day && dayData.exercises) {
                    // New format: { day: 'monday', exercises: [...], isRestDay: false }
                    return {
                      day_of_week: getDayOfWeekNumber(dayData.day),
                      exercises: dayData.exercises || [],
                      is_rest_day: dayData.isRestDay || false,
                      description: `${dayData.day.charAt(0).toUpperCase() + dayData.day.slice(1)} Training`,
                      estimated_duration: workout.duration
                    };
                  } else {
                    // Single day format converted to weekly
                    return {
                      day_of_week: index,
                      exercises: [dayData],
                      is_rest_day: false,
                      description: `Day ${index + 1} Training`,
                      estimated_duration: workout.duration
                    };
                  }
                });
              }
            } else {
              // If it's a single workout, create a single day
              dailyWorkouts = [{
                day_of_week: 1, // Monday
                exercises: workout.exercises || [],
                is_rest_day: false,
                description: workout.name,
                estimated_duration: workout.duration
              }];
            }

            return {
              ...week,
              workout,
              daily_workouts: dailyWorkouts
            };
          } catch (error) {
            console.error(`Error loading workout details for week ${week.week_number}:`, error);
            return {
              ...week,
              workout: null,
              daily_workouts: []
            };
          }
        })
      );

      return weeksWithWorkouts;
    } catch (error) {
      console.error('Error loading week details:', error);
      return planWeeks.map(week => ({
        ...week,
        workout: null,
        daily_workouts: []
      }));
    } finally {
      setLoadingWeekDetails(false);
    }
  };

  // Helper function to convert day name to number
  const getDayOfWeekNumber = (dayName: string): number => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const index = days.indexOf(dayName.toLowerCase());
    return index === -1 ? 1 : index; // Default to Monday if not found
  };

  // Handle view plan details
  const handleViewPlan = async (assignment: AssignmentWithPlan) => {
    setSelectedAssignment(assignment);
    
    // Load detailed week information when opening the drawer
    const detailedWeeks = await loadWeekDetails(assignment.monthly_plans.weeks);
    setWeeksWithDetails(detailedWeeks);
    
    if (onViewPlan) {
      onViewPlan(assignment);
    } else {
      onOpen();
    }
  };

  // Update plan status
  const updatePlanStatus = async (assignmentId: string, status: 'in_progress' | 'completed') => {
    try {
      await api.monthlyPlanAssignments.updateStatus(assignmentId, status);
      
      // Update local state
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, status }
            : assignment
        )
      );
    } catch (error) {
      console.error('Error updating plan status:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'assigned': return 'gray';
      default: return 'gray';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return FaCheck;
      case 'in_progress': return FaClock;
      case 'assigned': return FaEye;
      default: return FaEye;
    }
  };

  // Current date for comparison
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Separate assignments into current, upcoming, and past
  const currentAssignments = assignments.filter(a => 
    a.monthly_plans.month === currentMonth && a.monthly_plans.year === currentYear
  );
  
  const upcomingAssignments = assignments.filter(a => 
    (a.monthly_plans.year > currentYear) || 
    (a.monthly_plans.year === currentYear && a.monthly_plans.month > currentMonth)
  );
  
  const pastAssignments = assignments.filter(a => 
    (a.monthly_plans.year < currentYear) || 
    (a.monthly_plans.year === currentYear && a.monthly_plans.month < currentMonth)
  );

  // Helper functions for detailed view
  const getDayName = (dayNumber: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || `Day ${dayNumber}`;
  };

  const toggleWeekExpansion = (weekIndex: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekIndex)) {
      newExpanded.delete(weekIndex);
    } else {
      newExpanded.add(weekIndex);
    }
    setExpandedWeeks(newExpanded);
  };

  const toggleDayExpansion = (weekIndex: number, dayIndex: number) => {
    const dayKey = `${weekIndex}-${dayIndex}`;
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  const renderExerciseDetails = (exercise: any, exerciseIndex: number) => {
    return (
      <Card key={exerciseIndex} bg={exerciseCardBg} size="sm" mb={2}>
        <CardBody p={3}>
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={0} flex="1">
                <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                  {exercise.name || `Exercise ${exerciseIndex + 1}`}
                </Text>
                {exercise.description && (
                  <Text fontSize="xs" color={textSecondary} noOfLines={2}>
                    {exercise.description}
                  </Text>
                )}
              </VStack>
              <Badge colorScheme="blue" fontSize="xs">
                #{exerciseIndex + 1}
              </Badge>
            </HStack>

            {/* Exercise Parameters */}
            <HStack spacing={4} flexWrap="wrap">
              {exercise.sets && (
                <HStack spacing={1}>
                  <Icon as={FaRedoAlt} color="green.500" boxSize={3} />
                  <Text fontSize="xs" color={textSecondary}>
                    {exercise.sets} sets
                  </Text>
                </HStack>
              )}
              
              {exercise.reps && (
                <HStack spacing={1}>
                  <Icon as={FaDumbbell} color="purple.500" boxSize={3} />
                  <Text fontSize="xs" color={textSecondary}>
                    {exercise.reps} reps
                  </Text>
                </HStack>
              )}
              
              {exercise.duration && (
                <HStack spacing={1}>
                  <Icon as={FaStopwatch} color="orange.500" boxSize={3} />
                  <Text fontSize="xs" color={textSecondary}>
                    {exercise.duration}
                  </Text>
                </HStack>
              )}
              
              {exercise.distance && (
                <HStack spacing={1}>
                  <Icon as={FaRuler} color="teal.500" boxSize={3} />
                  <Text fontSize="xs" color={textSecondary}>
                    {exercise.distance}
                  </Text>
                </HStack>
              )}
              
              {exercise.weight && (
                <HStack spacing={1}>
                  <Icon as={FaDumbbell} color="red.500" boxSize={3} />
                  <Text fontSize="xs" color={textSecondary}>
                    {exercise.weight}
                  </Text>
                </HStack>
              )}
            </HStack>

            {/* Exercise Notes */}
            {exercise.notes && (
              <Text fontSize="xs" color={textSecondary} fontStyle="italic" p={2} bg={cardBg} borderRadius="md">
                💡 {exercise.notes}
              </Text>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  const renderDailyWorkout = (dailyWorkout: any, weekIndex: number, dayIndex: number) => {
    const dayKey = `${weekIndex}-${dayIndex}`;
    const isExpanded = expandedDays.has(dayKey);
    const isRestDay = dailyWorkout.is_rest_day;
    const exerciseCount = dailyWorkout.exercises?.length || 0;

    return (
      <Card 
        key={dayIndex} 
        bg={isRestDay ? restDayBg : trainingDayBg} 
        borderWidth="1px" 
        borderColor={borderColor}
        mb={2}
      >
        <CardBody p={3}>
          <VStack spacing={3} align="stretch">
            {/* Day Header */}
            <HStack 
              justify="space-between" 
              align="center" 
              cursor="pointer"
              onClick={() => !isRestDay && exerciseCount > 0 && toggleDayExpansion(weekIndex, dayIndex)}
            >
              <HStack spacing={3}>
                <Icon 
                  as={isRestDay ? FaBed : FaRunning} 
                  color={isRestDay ? "orange.500" : "blue.500"} 
                  boxSize={4}
                />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                    {getDayName(dailyWorkout.day_of_week)} - Day {dayIndex + 1}
                  </Text>
                  {isRestDay ? (
                    <Text fontSize="xs" color="orange.600">
                      Rest & Recovery Day
                    </Text>
                  ) : (
                    <Text fontSize="xs" color={textSecondary}>
                      {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                      {dailyWorkout.estimated_duration && ` • ${dailyWorkout.estimated_duration}`}
                    </Text>
                  )}
                </VStack>
              </HStack>

              <HStack spacing={2}>
                {!isRestDay && (
                  <Badge 
                    colorScheme={exerciseCount > 0 ? "green" : "gray"} 
                    fontSize="xs"
                  >
                    <Icon as={FaFire} mr={1} />
                    {exerciseCount}
                  </Badge>
                )}
                
                {!isRestDay && exerciseCount > 0 && (
                  <Icon 
                    as={isExpanded ? FaChevronDown : FaChevronRight} 
                    color={textSecondary} 
                    boxSize={3}
                  />
                )}
              </HStack>
            </HStack>

            {/* Day Description/Notes */}
            {dailyWorkout.description && (
              <Text fontSize="xs" color={textSecondary} p={2} bg={cardBg} borderRadius="md">
                📝 {dailyWorkout.description}
              </Text>
            )}

            {/* Exercises List */}
            {!isRestDay && exerciseCount > 0 && (
              <Collapse in={isExpanded} animateOpacity>
                <VStack spacing={2} align="stretch" pt={2}>
                  <Divider />
                  <Text fontSize="xs" fontWeight="medium" color={textPrimary} mb={1}>
                    Exercises:
                  </Text>
                  {dailyWorkout.exercises.map((exercise: any, exerciseIndex: number) => 
                    renderExerciseDetails(exercise, exerciseIndex)
                  )}
                </VStack>
              </Collapse>
            )}

            {/* Rest Day Message */}
            {isRestDay && (
              <Text fontSize="xs" color="orange.600" textAlign="center" p={2}>
                🛌 Focus on recovery, hydration, and light stretching
              </Text>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  const renderWeeklyPlan = (week: any, weekIndex: number) => {
    const isExpanded = expandedWeeks.has(weekIndex);
    const dailyWorkouts = week.daily_workouts || [];
    const totalExercises = dailyWorkouts.reduce((sum: number, day: any) => 
      sum + (day.exercises?.length || 0), 0
    );
    const trainingDays = dailyWorkouts.filter((day: any) => !day.is_rest_day).length;
    const restDays = dailyWorkouts.filter((day: any) => day.is_rest_day).length;

    return (
      <Card key={weekIndex} bg={cardBg} borderWidth="1px" borderColor={borderColor} mb={4}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Week Header */}
            <HStack 
              justify="space-between" 
              align="center" 
              cursor="pointer"
              onClick={() => toggleWeekExpansion(weekIndex)}
              p={2}
              borderRadius="md"
              _hover={{ bg: bgColor }}
            >
              <HStack spacing={3}>
                <Icon 
                  as={week.is_rest_week ? FaBed : FaRunning} 
                  color={week.is_rest_week ? "orange.500" : "blue.500"} 
                  boxSize={5}
                />
                <VStack align="start" spacing={0}>
                  <Text fontSize="md" fontWeight="bold" color={textPrimary}>
                    Week {week.week_number}
                    {week.workout?.name && ` - ${week.workout.name}`}
                  </Text>
                  <Text fontSize="sm" color={textSecondary}>
                    {week.start_date && week.end_date ? `${week.start_date} - ${week.end_date}` : `Week ${week.week_number}`}
                  </Text>
                </VStack>
              </HStack>

              <HStack spacing={2}>
                <Badge 
                  colorScheme={week.is_rest_week ? 'orange' : 'blue'} 
                  fontSize="xs"
                  px={2}
                  py={1}
                >
                  {week.is_rest_week ? 'Rest Week' : 'Training Week'}
                </Badge>
                
                <Icon 
                  as={isExpanded ? FaChevronDown : FaChevronRight} 
                  color={textSecondary} 
                  boxSize={4}
                />
              </HStack>
            </HStack>

            {/* Week Statistics */}
            {!week.is_rest_week && dailyWorkouts.length > 0 && (
              <SimpleGrid columns={3} spacing={3} p={2} bg={bgColor} borderRadius="md">
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" color="blue.500">
                    {trainingDays}
                  </Text>
                  <Text fontSize="xs" color={textSecondary}>Training Days</Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" color="green.500">
                    {totalExercises}
                  </Text>
                  <Text fontSize="xs" color={textSecondary}>Total Exercises</Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" color="orange.500">
                    {restDays}
                  </Text>
                  <Text fontSize="xs" color={textSecondary}>Rest Days</Text>
                </Box>
              </SimpleGrid>
            )}

            {/* Workout Info */}
            {!week.is_rest_week && week.workout && (
              <Box p={3} bg={bgColor} borderRadius="md">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                    📋 Workout: {week.workout.name}
                  </Text>
                  {week.workout.description && (
                    <Text fontSize="xs" color={textSecondary}>
                      {week.workout.description}
                    </Text>
                  )}
                  <HStack spacing={4}>
                    {week.workout.duration && (
                      <Text fontSize="xs" color={textSecondary}>
                        ⏱️ {week.workout.duration}
                      </Text>
                    )}
                    {week.workout.type && (
                      <Text fontSize="xs" color={textSecondary}>
                        🏷️ {week.workout.type}
                      </Text>
                    )}
                  </HStack>
                </VStack>
              </Box>
            )}

            {/* Week Notes */}
            {week.notes && (
              <Text fontSize="sm" color={textSecondary} p={3} bg={bgColor} borderRadius="md">
                📋 <strong>Week Notes:</strong> {week.notes}
              </Text>
            )}

            {/* Daily Workouts */}
            <Collapse in={isExpanded} animateOpacity>
              <VStack spacing={3} align="stretch" pt={2}>
                <Divider />
                <Text fontSize="sm" fontWeight="medium" color={textPrimary}>
                  Daily Breakdown:
                </Text>
                
                {week.is_rest_week ? (
                  <Card bg={restDayBg} borderColor="orange.200">
                    <CardBody p={4} textAlign="center">
                      <VStack spacing={2}>
                        <Icon as={FaBed} color="orange.500" boxSize={8} />
                        <Text fontSize="md" fontWeight="medium" color="orange.700">
                          Complete Rest Week
                        </Text>
                        <Text fontSize="sm" color="orange.600">
                          Focus on recovery, sleep, and light activities
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                ) : dailyWorkouts.length > 0 ? (
                  <VStack spacing={2} align="stretch">
                    {dailyWorkouts.map((dailyWorkout: any, dayIndex: number) => 
                      renderDailyWorkout(dailyWorkout, weekIndex, dayIndex)
                    )}
                  </VStack>
                ) : (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="medium">
                        No daily workout details available
                      </Text>
                      <Text fontSize="xs" color={textSecondary}>
                        {week.workout ? 
                          "This workout template doesn't have daily breakdowns." :
                          "Workout template not found or not accessible."
                        }
                      </Text>
                    </VStack>
                  </Alert>
                )}
              </VStack>
            </Collapse>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color={textSecondary}>Loading monthly plans...</Text>
      </Box>
    );
  }

  if (assignments.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <VStack align="start" spacing={0}>
          <Text fontWeight="medium">No Monthly Plans Assigned</Text>
          <Text fontSize="sm">Your coach hasn't assigned any monthly training plans yet.</Text>
        </VStack>
      </Alert>
    );
  }

  const renderAssignmentCard = (assignment: AssignmentWithPlan) => {
    const plan = assignment.monthly_plans;
    const trainingWeeks = plan.weeks.filter(w => !w.is_rest_week).length;
    const restWeeks = plan.weeks.filter(w => w.is_rest_week).length;
    
    return (
      <Card 
        key={assignment.id}
        bg={cardBg} 
        borderColor={borderColor} 
        borderWidth="1px"
        cursor="pointer"
        onClick={() => handleViewPlan(assignment)}
        _hover={{ 
          transform: 'translateY(-2px)', 
          shadow: 'lg',
          borderColor: 'blue.300'
        }}
        transition="all 0.2s"
      >
        <CardBody p={5}>
          <VStack spacing={4} align="stretch">
            {/* Header */}
            <Flex justify="space-between" align="start">
              <VStack align="start" spacing={1} flex="1">
                <Heading size="md" color={textPrimary}>
                  {plan.name}
                </Heading>
                <HStack spacing={2}>
                  <Icon as={FaCalendarAlt} color="blue.500" />
                  <Text fontSize="sm" color={textSecondary}>
                    {getMonthName(plan.month)} {plan.year}
                  </Text>
                </HStack>
              </VStack>
              
              <Badge 
                colorScheme={getStatusColor(assignment.status)} 
                px={3} 
                py={1}
                borderRadius="full"
              >
                <Icon as={getStatusIcon(assignment.status)} mr={1} />
                {assignment.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </Flex>

            {/* Description */}
            {plan.description && (
              <Text fontSize="sm" color={textSecondary} noOfLines={2}>
                {plan.description}
              </Text>
            )}

            {/* Plan Statistics */}
            <SimpleGrid columns={3} spacing={4}>
              <Box textAlign="center">
                <Text fontSize="xl" fontWeight="bold" color="blue.500">
                  {plan.weeks.length}
                </Text>
                <Text fontSize="xs" color={textSecondary}>Total Weeks</Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="xl" fontWeight="bold" color="green.500">
                  {trainingWeeks}
                </Text>
                <Text fontSize="xs" color={textSecondary}>Training</Text>
              </Box>
              <Box textAlign="center">
                <Text fontSize="xl" fontWeight="bold" color="orange.500">
                  {restWeeks}
                </Text>
                <Text fontSize="xs" color={textSecondary}>Rest</Text>
              </Box>
            </SimpleGrid>

            {/* Assignment Date */}
            <Divider />
            <Flex justify="space-between" align="center">
              <Text fontSize="xs" color={textSecondary}>
                Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
              </Text>
              
              <HStack spacing={2}>
                {assignment.status === 'assigned' && (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    leftIcon={<FaPlay />}
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePlanStatus(assignment.id, 'in_progress');
                    }}
                  >
                    Start
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FaEye />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewPlan(assignment);
                  }}
                >
                  View
                </Button>
              </HStack>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Current Month Plans */}
        {currentAssignments.length > 0 && (
          <Box>
            <Heading size="md" mb={4} color={textPrimary}>
              <Icon as={FaRunning} mr={2} color="blue.500" />
              Current Month
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {currentAssignments.map(renderAssignmentCard)}
            </SimpleGrid>
          </Box>
        )}

        {/* Upcoming Plans */}
        {upcomingAssignments.length > 0 && (
          <Box>
            <Heading size="md" mb={4} color={textPrimary}>
              <Icon as={FaClock} mr={2} color="orange.500" />
              Upcoming Plans
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {upcomingAssignments.map(renderAssignmentCard)}
            </SimpleGrid>
          </Box>
        )}

        {/* Past Plans */}
        {pastAssignments.length > 0 && (
          <Box>
            <Heading size="md" mb={4} color={textPrimary}>
              <Icon as={FaChartLine} mr={2} color="green.500" />
              Completed Plans
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {pastAssignments.map(renderAssignmentCard)}
            </SimpleGrid>
          </Box>
        )}
      </VStack>

      {/* Comprehensive Plan Detail Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size={drawerSize}>
        <DrawerOverlay />
        <DrawerContent bg={drawerBg} maxW={{ base: "100vw", md: "50vw", lg: "40vw" }}>
          <DrawerCloseButton size="lg" />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} pb={4}>
            <VStack align="start" spacing={2}>
              <HStack spacing={3}>
                <Icon as={FaExpandArrowsAlt} color="blue.500" />
                <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                  {selectedAssignment?.monthly_plans.name}
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FaCalendarAlt} color="blue.400" boxSize={4} />
                <Text fontSize="sm" color={textSecondary}>
                  {selectedAssignment && getMonthName(selectedAssignment.monthly_plans.month)} {selectedAssignment?.monthly_plans.year}
                </Text>
                <Badge 
                  colorScheme={getStatusColor(selectedAssignment?.status || '')} 
                  px={2} 
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                >
                  <Icon as={getStatusIcon(selectedAssignment?.status || '')} mr={1} />
                  {selectedAssignment?.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </HStack>
            </VStack>
          </DrawerHeader>

          <DrawerBody p={0}>
            <Box p={4}>
              {selectedAssignment && (
                <VStack spacing={6} align="stretch">
                  {/* Plan Overview */}
                  <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {/* Plan Description */}
                        {selectedAssignment.monthly_plans.description && (
                          <Box>
                            <Text fontSize="sm" fontWeight="medium" mb={2} color={textPrimary}>
                              📋 Plan Description:
                            </Text>
                            <Text fontSize="sm" color={textSecondary}>
                              {selectedAssignment.monthly_plans.description}
                            </Text>
                          </Box>
                        )}

                        {/* Plan Statistics */}
                        <SimpleGrid columns={3} spacing={4}>
                          <Box textAlign="center" p={3} bg={cardBg} borderRadius="md">
                            <Text fontSize="xl" fontWeight="bold" color="blue.500">
                              {selectedAssignment.monthly_plans.weeks.length}
                            </Text>
                            <Text fontSize="xs" color={textSecondary}>Total Weeks</Text>
                          </Box>
                          <Box textAlign="center" p={3} bg={cardBg} borderRadius="md">
                            <Text fontSize="xl" fontWeight="bold" color="green.500">
                              {selectedAssignment.monthly_plans.weeks.filter(w => !w.is_rest_week).length}
                            </Text>
                            <Text fontSize="xs" color={textSecondary}>Training Weeks</Text>
                          </Box>
                          <Box textAlign="center" p={3} bg={cardBg} borderRadius="md">
                            <Text fontSize="xl" fontWeight="bold" color="orange.500">
                              {selectedAssignment.monthly_plans.weeks.filter(w => w.is_rest_week).length}
                            </Text>
                            <Text fontSize="xs" color={textSecondary}>Rest Weeks</Text>
                          </Box>
                        </SimpleGrid>

                        {/* Assignment Info */}
                        <Divider />
                        <VStack spacing={1} align="start">
                          <Text fontSize="sm" color={textSecondary}>
                            📅 Assigned: {new Date(selectedAssignment.assigned_at).toLocaleDateString()}
                          </Text>
                          {selectedAssignment.start_date && (
                            <Text fontSize="sm" color={textSecondary}>
                              🚀 Started: {new Date(selectedAssignment.start_date).toLocaleDateString()}
                            </Text>
                          )}
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Detailed Weekly Breakdown */}
                  <Box>
                    <HStack justify="space-between" align="center" mb={4}>
                      <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                        📚 Detailed Weekly Breakdown
                      </Text>
                      <HStack spacing={2}>
                        {loadingWeekDetails && (
                          <Spinner size="sm" color="blue.500" />
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (expandedWeeks.size === selectedAssignment.monthly_plans.weeks.length) {
                              setExpandedWeeks(new Set());
                              setExpandedDays(new Set());
                            } else {
                              setExpandedWeeks(new Set(Array.from({ length: selectedAssignment.monthly_plans.weeks.length }, (_, i) => i)));
                            }
                          }}
                        >
                          {expandedWeeks.size === selectedAssignment.monthly_plans.weeks.length ? 'Collapse All' : 'Expand All'}
                        </Button>
                      </HStack>
                    </HStack>
                    
                    {loadingWeekDetails ? (
                      <VStack spacing={3}>
                        {[...Array(selectedAssignment.monthly_plans.weeks.length)].map((_, i) => (
                          <Skeleton key={i} height="120px" borderRadius="md" />
                        ))}
                      </VStack>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        {weeksWithDetails.length > 0 ? 
                          weeksWithDetails.map((week, index) => renderWeeklyPlan(week, index)) :
                          selectedAssignment.monthly_plans.weeks.map((week, index) => renderWeeklyPlan(week, index))
                        }
                      </VStack>
                    )}
                  </Box>
                </VStack>
              )}
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
} 