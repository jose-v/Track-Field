import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Text, VStack, HStack, Button, Card, CardBody, 
  useColorModeValue, Flex, Badge, Icon, SimpleGrid, Avatar,
  Progress, Skeleton, Alert, AlertIcon, Divider, Tooltip,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  useDisclosure, Spinner
} from '@chakra-ui/react';
import { 
  FaCalendarAlt, FaUsers, FaEdit, FaPlus, FaDumbbell, FaBed, 
  FaChartLine, FaClock, FaCheck, FaTimes, FaEye, FaArrowLeft
} from 'react-icons/fa';
import { api } from '../services/api';
import type { MonthlyPlan, MonthlyPlanAssignment } from '../services/dbSchema';
import type { Workout } from '../services/api';

interface PlanDetailViewProps {
  monthlyPlan: MonthlyPlan;
  onBack: () => void;
  onEdit?: () => void;
  onAssign?: () => void;
}

interface AthleteWithProgress {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  assignment: MonthlyPlanAssignment;
}

interface WeekWithWorkout {
  week_number: number;
  workout_id: string;
  is_rest_week: boolean;
  workout?: Workout;
}

export function PlanDetailView({
  monthlyPlan,
  onBack,
  onEdit,
  onAssign
}: PlanDetailViewProps) {
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // State
  const [assignedAthletes, setAssignedAthletes] = useState<AthleteWithProgress[]>([]);
  const [weeksWithWorkouts, setWeeksWithWorkouts] = useState<WeekWithWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);

  // Get month name helper
  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  // Load plan data
  const loadPlanData = async () => {
    try {
      setLoading(true);
      
      // Load assigned athletes
      const assignments = await api.monthlyPlanAssignments.getByPlan(monthlyPlan.id);
      
      // Get athlete details for each assignment
      const athletesWithProgress = await Promise.all(
        assignments.map(async (assignment) => {
          try {
            const athlete = await api.athletes.getById(assignment.athlete_id);
            return {
              id: athlete.id,
              first_name: athlete.first_name,
              last_name: athlete.last_name,
              email: athlete.email,
              avatar_url: athlete.avatar_url,
              assignment
            };
          } catch (error) {
            console.error(`Error loading athlete ${assignment.athlete_id}:`, error);
            return null;
          }
        })
      );

      setAssignedAthletes(athletesWithProgress.filter(Boolean) as AthleteWithProgress[]);
    } catch (error) {
      console.error('Error loading plan data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load workout details for training weeks
  const loadWorkoutDetails = async () => {
    try {
      setWorkoutsLoading(true);
      
      const weeksWithDetails = await Promise.all(
        monthlyPlan.weeks.map(async (week) => {
          if (week.is_rest_week || !week.workout_id) {
            return {
              ...week,
              workout: undefined
            };
          }
          
          try {
            // Get all workouts and find the one we need
            const allWorkouts = await api.workouts.getAll();
            const workout = allWorkouts.find(w => w.id === week.workout_id);
            return {
              ...week,
              workout
            };
          } catch (error) {
            console.error(`Error loading workout ${week.workout_id}:`, error);
            return {
              ...week,
              workout: undefined
            };
          }
        })
      );

      setWeeksWithWorkouts(weeksWithDetails);
    } catch (error) {
      console.error('Error loading workout details:', error);
    } finally {
      setWorkoutsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadPlanData();
    loadWorkoutDetails();
  }, [monthlyPlan.id]);

  // Calculate statistics
  const totalWeeks = monthlyPlan.weeks.length;
  const trainingWeeks = monthlyPlan.weeks.filter(w => !w.is_rest_week).length;
  const restWeeks = monthlyPlan.weeks.filter(w => w.is_rest_week).length;
  const completedAssignments = assignedAthletes.filter(a => a.assignment.status === 'completed').length;
  const inProgressAssignments = assignedAthletes.filter(a => a.assignment.status === 'in_progress').length;
  const completionPercentage = assignedAthletes.length > 0 
    ? (completedAssignments / assignedAthletes.length) * 100 
    : 0;

  return (
    <Box minH="100vh" bg={bgColor} p={6}>
      <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <HStack spacing={4}>
            <Button
              leftIcon={<FaArrowLeft />}
              variant="ghost"
              onClick={onBack}
              size="md"
            >
              Back to Plans
            </Button>
            <Divider orientation="vertical" h="40px" />
            <VStack align="start" spacing={1}>
              <HStack spacing={3}>
                <Icon as={FaCalendarAlt} color="teal.500" boxSize={6} />
                <Heading size="lg" color={titleColor}>
                  {monthlyPlan.name}
                </Heading>
                <Badge colorScheme="teal" px={3} py={1} borderRadius="md">
                  {getMonthName(monthlyPlan.month)} {monthlyPlan.year}
                </Badge>
              </HStack>
              {monthlyPlan.description && (
                <Text color={infoColor} maxW="600px">
                  {monthlyPlan.description}
                </Text>
              )}
            </VStack>
          </HStack>

          <HStack spacing={3}>
            {onEdit && (
              <Button
                leftIcon={<FaEdit />}
                variant="outline"
                colorScheme="teal"
                onClick={onEdit}
                size="md"
              >
                Edit Plan
              </Button>
            )}
            {onAssign && (
              <Button
                leftIcon={<FaPlus />}
                colorScheme="teal"
                onClick={onAssign}
                size="md"
              >
                Assign Athletes
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Overview Statistics */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody p={4} textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="teal.500">
                {totalWeeks}
              </Text>
              <Text fontSize="sm" color={infoColor}>Total Weeks</Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody p={4} textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {trainingWeeks}
              </Text>
              <Text fontSize="sm" color={infoColor}>Training Weeks</Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody p={4} textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {assignedAthletes.length}
              </Text>
              <Text fontSize="sm" color={infoColor}>Assigned Athletes</Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody p={4} textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                {completionPercentage.toFixed(0)}%
              </Text>
              <Text fontSize="sm" color={infoColor}>Completion Rate</Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Main Content Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Weekly Timeline */}
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" align="center">
              <Heading size="md" color={titleColor}>
                Weekly Timeline
              </Heading>
              <Badge colorScheme="blue" px={3} py={1}>
                {totalWeeks} weeks
              </Badge>
            </HStack>

            {workoutsLoading ? (
              <VStack spacing={3}>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} height="120px" borderRadius="md" />
                ))}
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                {weeksWithWorkouts
                  .sort((a, b) => a.week_number - b.week_number)
                  .map((week) => (
                    <Card 
                      key={week.week_number}
                      bg={cardBg} 
                      borderColor={borderColor} 
                      borderWidth="1px"
                      borderLeftWidth="4px"
                      borderLeftColor={week.is_rest_week ? 'orange.400' : 'teal.400'}
                    >
                      <CardBody p={4}>
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between" align="center">
                            <HStack spacing={3}>
                              <Icon 
                                as={week.is_rest_week ? FaBed : FaDumbbell} 
                                color={week.is_rest_week ? 'orange.400' : 'teal.400'}
                                boxSize={5}
                              />
                              <Text fontWeight="semibold" color={titleColor}>
                                Week {week.week_number}
                              </Text>
                              <Badge 
                                colorScheme={week.is_rest_week ? 'orange' : 'teal'}
                                fontSize="xs"
                              >
                                {week.is_rest_week ? 'Rest Week' : 'Training Week'}
                              </Badge>
                            </HStack>
                          </HStack>

                          {week.is_rest_week ? (
                            <Text fontSize="sm" color={infoColor} fontStyle="italic">
                              Recovery and rest week - no scheduled workouts
                            </Text>
                          ) : week.workout ? (
                            <VStack align="start" spacing={2}>
                              <Text fontWeight="medium" color={titleColor}>
                                {week.workout.name}
                              </Text>
                              <Text fontSize="sm" color={infoColor}>
                                {week.workout.description || 'Weekly Training Plan'}
                              </Text>
                              <HStack spacing={4}>
                                <HStack spacing={1}>
                                  <Icon as={FaClock} color={infoColor} boxSize={3} />
                                  <Text fontSize="sm" color={infoColor}>
                                    {week.workout.duration || 'Variable'} min
                                  </Text>
                                </HStack>
                                {week.workout.exercises && (
                                  <HStack spacing={1}>
                                    <Icon as={FaDumbbell} color={infoColor} boxSize={3} />
                                    <Text fontSize="sm" color={infoColor}>
                                      {week.workout.exercises.length} exercises
                                    </Text>
                                  </HStack>
                                )}
                              </HStack>
                            </VStack>
                          ) : (
                            <Alert status="warning" size="sm">
                              <AlertIcon />
                              <Text fontSize="sm">Workout template not found</Text>
                            </Alert>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
              </VStack>
            )}
          </VStack>

          {/* Assigned Athletes */}
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" align="center">
              <Heading size="md" color={titleColor}>
                Assigned Athletes
              </Heading>
              <Badge colorScheme="green" px={3} py={1}>
                {assignedAthletes.length} athletes
              </Badge>
            </HStack>

            {loading ? (
              <VStack spacing={3}>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} height="80px" borderRadius="md" />
                ))}
              </VStack>
            ) : assignedAthletes.length === 0 ? (
              <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                <CardBody p={8} textAlign="center">
                  <Icon as={FaUsers} boxSize={12} color="gray.300" mb={4} />
                  <Text color={infoColor} mb={4}>
                    No athletes assigned to this plan yet
                  </Text>
                  {onAssign && (
                    <Button
                      leftIcon={<FaPlus />}
                      colorScheme="teal"
                      size="sm"
                      onClick={onAssign}
                    >
                      Assign Athletes
                    </Button>
                  )}
                </CardBody>
              </Card>
            ) : (
              <VStack spacing={3} align="stretch">
                {/* Progress Summary */}
                <Card bg={useColorModeValue('blue.50', 'blue.900')} borderColor="blue.200">
                  <CardBody p={4}>
                    <VStack spacing={3}>
                      <HStack justify="space-between" w="100%">
                        <Text fontSize="sm" fontWeight="medium" color={titleColor}>
                          Overall Progress
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" color="blue.500">
                          {completionPercentage.toFixed(1)}%
                        </Text>
                      </HStack>
                      <Progress 
                        value={completionPercentage} 
                        colorScheme="blue" 
                        size="md" 
                        w="100%" 
                        borderRadius="full"
                      />
                      <HStack justify="space-between" w="100%" fontSize="xs">
                        <Text color={infoColor}>
                          {completedAssignments} completed
                        </Text>
                        <Text color={infoColor}>
                          {inProgressAssignments} in progress
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Athletes List */}
                {assignedAthletes.map((athlete) => (
                  <Card 
                    key={athlete.id}
                    bg={cardBg} 
                    borderColor={borderColor} 
                    borderWidth="1px"
                  >
                    <CardBody p={4}>
                      <Flex align="center" justify="space-between">
                        <HStack spacing={3}>
                          <Avatar
                            size="md"
                            name={`${athlete.first_name} ${athlete.last_name}`}
                            src={athlete.avatar_url}
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium" color={titleColor}>
                              {athlete.first_name} {athlete.last_name}
                            </Text>
                            <Text fontSize="sm" color={infoColor}>
                              {athlete.email}
                            </Text>
                            <Text fontSize="xs" color={infoColor}>
                              Assigned {new Date(athlete.assignment.assigned_at).toLocaleDateString()}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <VStack spacing={1} align="end">
                          <Badge 
                            colorScheme={
                              athlete.assignment.status === 'completed' ? 'green' :
                              athlete.assignment.status === 'in_progress' ? 'blue' : 'gray'
                            }
                            fontSize="xs"
                            px={2}
                            py={1}
                          >
                            <Icon 
                              as={
                                athlete.assignment.status === 'completed' ? FaCheck :
                                athlete.assignment.status === 'in_progress' ? FaClock : FaEye
                              } 
                              mr={1} 
                            />
                            {athlete.assignment.status.replace('_', ' ')}
                          </Badge>
                        </VStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </VStack>
        </SimpleGrid>
      </VStack>
    </Box>
  );
} 