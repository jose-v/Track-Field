import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Heading, Text, VStack, HStack, Button, Card, CardBody, 
  useColorModeValue, Flex, Badge, Icon, SimpleGrid, Avatar,
  Progress, Skeleton, Alert, AlertIcon, Divider, Tooltip,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  useDisclosure, Spinner, IconButton, useToast, 
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, 
  AlertDialogBody, AlertDialogFooter, Select, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { 
  FaCalendarAlt, FaUsers, FaEdit, FaPlus, FaDumbbell, FaBed, 
  FaChartLine, FaClock, FaCheck, FaTimes, FaEye, FaArrowLeft,
  FaTrash, FaSync, FaEllipsisV
} from 'react-icons/fa';
import { api } from '../services/api';
import { AssignmentModal } from './AssignmentModal';
import type { TrainingPlan, TrainingPlanAssignment } from '../services/dbSchema';
import type { Workout } from '../services/api';

interface PlanDetailViewProps {
  monthlyPlan: TrainingPlan;
  onBack: () => void;
  onEdit?: () => void;
  onAssign?: () => void;
  onAssignSuccess?: () => void;
}

interface AthleteWithProgress {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  assignment: TrainingPlanAssignment;
}

interface WeekWithWorkout {
  week_number: number;
  workout_id: string;
  is_rest_week: boolean;
  workout?: Workout;
}

interface AssignedAthleteWithDetails {
  assignment: TrainingPlanAssignment;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function PlanDetailView({
  monthlyPlan,
  onBack,
  onEdit,
  onAssign,
  onAssignSuccess
}: PlanDetailViewProps) {
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const progressCardBg = useColorModeValue('blue.50', 'blue.900');
  const toast = useToast();

  // Refs
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // State
  const [assignedAthletes, setAssignedAthletes] = useState<AthleteWithProgress[]>([]);
  const [weeksWithWorkouts, setWeeksWithWorkouts] = useState<WeekWithWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [templateWorkouts, setTemplateWorkouts] = useState<Workout[]>([]);
  
  // UI state
  const [athleteToRemove, setAthleteToRemove] = useState<AthleteWithProgress | null>(null);
  const [weekToEdit, setWeekToEdit] = useState<WeekWithWorkout | null>(null);
  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Modals
  const { isOpen: isRemoveOpen, onOpen: onRemoveOpen, onClose: onRemoveClose } = useDisclosure();
  const { isOpen: isEditWeekOpen, onOpen: onEditWeekOpen, onClose: onEditWeekClose } = useDisclosure();
  const { isOpen: isAssignModalOpen, onOpen: onAssignModalOpen, onClose: onAssignModalClose } = useDisclosure();

  // Get month name helper
  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  // Load plan data
  const loadPlanData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load assigned athletes - this is already filtered to only show approved relationships
      const assignments = await api.trainingPlanAssignments.getByPlan(monthlyPlan.id);
      
      // Transform assignments to athlete data - no need to call api.athletes.getById() 
      // since the assignments already contain the athlete profile data from approved relationships
      const athletesWithProgress = assignments.map(assignment => {
        const profile = assignment.athlete_profile || assignment.profiles;
        if (!profile) {
          console.warn(`No profile found for assignment ${assignment.id}`);
          return null;
        }
        
        return {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          assignment
        };
      }).filter(Boolean) as AthleteWithProgress[];

      setAssignedAthletes(athletesWithProgress);
    } catch (error) {
      console.error('Error loading plan data:', error);
    } finally {
      setLoading(false);
    }
  }, [monthlyPlan.id]);

  // Load workout details for training weeks
  const loadWorkoutDetails = useCallback(async () => {
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
  }, [monthlyPlan.weeks]);

  // Load template workouts for replacement options
  const loadTemplateWorkouts = useCallback(async () => {
    try {
      const templates = await api.workouts.getTemplates(monthlyPlan.coach_id);
      setTemplateWorkouts(templates.filter(t => t.template_type === 'weekly' || t.is_template));
    } catch (error) {
      console.error('Error loading template workouts:', error);
    }
  }, [monthlyPlan.coach_id]);

  // Load data on mount
  useEffect(() => {
    loadPlanData();
    loadWorkoutDetails();
    loadTemplateWorkouts();
  }, [loadPlanData, loadWorkoutDetails, loadTemplateWorkouts]);

  // Calculate statistics
  const totalWeeks = monthlyPlan.weeks.length;
  const trainingWeeks = monthlyPlan.weeks.filter(w => !w.is_rest_week).length;
  const restWeeks = monthlyPlan.weeks.filter(w => w.is_rest_week).length;
  const completedAssignments = assignedAthletes.filter(a => a.assignment.status === 'completed').length;
  const inProgressAssignments = assignedAthletes.filter(a => a.assignment.status === 'in_progress').length;
  const completionPercentage = assignedAthletes.length > 0 
    ? (completedAssignments / assignedAthletes.length) * 100 
    : 0;

  // Handle athlete removal
  const handleRemoveAthlete = (athlete: AthleteWithProgress) => {
    setAthleteToRemove(athlete);
    onRemoveOpen();
  };

  // Confirm athlete removal
  const confirmRemoveAthlete = async () => {
    if (!athleteToRemove) return;
    
    try {
      setRemoving(true);
      await api.trainingPlanAssignments.remove(athleteToRemove.assignment.id);
      
      // Update local state
      setAssignedAthletes(prev => 
        prev.filter(a => a.assignment.id !== athleteToRemove.assignment.id)
      );
      
      toast({
        title: 'Athlete removed',
        description: `${athleteToRemove.first_name} ${athleteToRemove.last_name} has been removed from this plan.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      onRemoveClose();
      setAthleteToRemove(null);
    } catch (error) {
      console.error('Error removing athlete:', error);
      toast({
        title: 'Error removing athlete',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setRemoving(false);
    }
  };

  // Handle week editing
  const handleEditWeek = (week: WeekWithWorkout) => {
    setWeekToEdit(week);
    onEditWeekOpen();
  };

  // Handle week removal (set to rest week)
  const handleRemoveWeek = async (week: WeekWithWorkout) => {
    try {
      setUpdating(true);
      
      // Update the weeks array to set this week as rest week
      const updatedWeeks = monthlyPlan.weeks.map(w => 
        w.week_number === week.week_number 
          ? { ...w, is_rest_week: true, workout_id: '' }
          : w
      );
      
      await api.trainingPlans.updateWeeks(monthlyPlan.id, updatedWeeks);
      
      // Update local state
      setWeeksWithWorkouts(prev => 
        prev.map(w => 
          w.week_number === week.week_number 
            ? { ...w, is_rest_week: true, workout_id: '', workout: undefined }
            : w
        )
      );
      
      toast({
        title: 'Week updated',
        description: `Week ${week.week_number} has been set as a rest week.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error updating week:', error);
      toast({
        title: 'Error updating week',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle workout replacement
  const handleReplaceWorkout = async (weekNumber: number, newWorkoutId: string) => {
    try {
      setUpdating(true);
      
      // Find the new workout details
      const newWorkout = templateWorkouts.find(w => w.id === newWorkoutId);
      
      // Update the weeks array
      const updatedWeeks = monthlyPlan.weeks.map(w => 
        w.week_number === weekNumber 
          ? { ...w, workout_id: newWorkoutId, is_rest_week: false }
          : w
      );
      
      await api.trainingPlans.updateWeeks(monthlyPlan.id, updatedWeeks);
      
      // Update local state
      setWeeksWithWorkouts(prev => 
        prev.map(w => 
          w.week_number === weekNumber 
            ? { ...w, workout_id: newWorkoutId, is_rest_week: false, workout: newWorkout }
            : w
        )
      );
      
      toast({
        title: 'Workout replaced',
        description: `Week ${weekNumber} workout has been updated.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      onEditWeekClose();
      setWeekToEdit(null);
    } catch (error) {
      console.error('Error replacing workout:', error);
      toast({
        title: 'Error updating workout',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle assignment success
  const handleAssignmentSuccess = useCallback(() => {
    // Reload plan data to reflect new assignments
    loadPlanData();
    
    // Call parent callback if provided
    if (onAssignSuccess) {
      onAssignSuccess();
    }
  }, [loadPlanData, onAssignSuccess]);

  // Handle assign click - open internal modal instead of calling parent
  const handleAssignClick = () => {
    onAssignModalOpen();
  };

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
                  {getMonthName(new Date(monthlyPlan.start_date).getMonth() + 1)} {new Date(monthlyPlan.start_date).getFullYear()}
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
                onClick={handleAssignClick}
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
                            
                            {/* Week Management Menu */}
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FaEllipsisV />}
                                variant="ghost"
                                size="sm"
                                isLoading={updating}
                              />
                              <MenuList>
                                {!week.is_rest_week && (
                                  <MenuItem
                                    icon={<FaEdit />}
                                    onClick={() => handleEditWeek(week)}
                                  >
                                    Replace Workout
                                  </MenuItem>
                                )}
                                {!week.is_rest_week && (
                                  <MenuItem
                                    icon={<FaBed />}
                                    onClick={() => handleRemoveWeek(week)}
                                  >
                                    Set as Rest Week
                                  </MenuItem>
                                )}
                                {week.is_rest_week && (
                                  <MenuItem
                                    icon={<FaDumbbell />}
                                    onClick={() => handleEditWeek(week)}
                                  >
                                    Add Training Week
                                  </MenuItem>
                                )}
                              </MenuList>
                            </Menu>
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
                      onClick={handleAssignClick}
                    >
                      Assign Athletes
                    </Button>
                  )}
                </CardBody>
              </Card>
            ) : (
              <VStack spacing={3} align="stretch">
                {/* Progress Summary */}
                <Card bg={progressCardBg} borderColor="blue.200">
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
                          
                          {/* Remove athlete button */}
                          <Tooltip label="Remove athlete from plan" placement="top">
                            <IconButton
                              icon={<FaTimes />}
                              colorScheme="red"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAthlete(athlete)}
                              aria-label="Remove athlete"
                            />
                          </Tooltip>
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
      
      {/* Remove Athlete Confirmation Dialog */}
      <AlertDialog
        isOpen={isRemoveOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRemoveClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent minHeight="220px">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Athlete from Plan
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} minHeight="100px">
                {athleteToRemove && (
                  <Text>
                    Are you sure you want to remove{' '}
                    <strong>{athleteToRemove.first_name} {athleteToRemove.last_name}</strong>{' '}
                    from this monthly plan? This action cannot be undone.
                  </Text>
                )}
              </VStack>
              {/* Action buttons styled as a footer */}
              <HStack width="100%" justifyContent="flex-end" pt={4} spacing={4}>
                <Button 
                  ref={cancelRef} 
                  onClick={onRemoveClose}
                  variant="ghost"
                  colorScheme="gray"
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={confirmRemoveAthlete}
                  isLoading={removing}
                  variant="solid"
                >
                  Remove Athlete
                </Button>
              </HStack>
            </AlertDialogBody>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Edit Week Modal */}
      <Modal isOpen={isEditWeekOpen} onClose={onEditWeekClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {weekToEdit?.is_rest_week ? 'Add Training Week' : 'Replace Workout'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {weekToEdit && (
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color={infoColor}>
                  {weekToEdit.is_rest_week 
                    ? `Select a workout template to replace the rest week ${weekToEdit.week_number}:`
                    : `Select a new workout template to replace week ${weekToEdit.week_number}:`
                  }
                </Text>
                
                <Select
                  placeholder="Select a workout template"
                  onChange={(e) => {
                    if (e.target.value && weekToEdit) {
                      handleReplaceWorkout(weekToEdit.week_number, e.target.value);
                    }
                  }}
                  disabled={updating}
                >
                  {templateWorkouts.map((workout) => (
                    <option key={workout.id} value={workout.id}>
                      {workout.name} {workout.template_type === 'weekly' ? '(Weekly Plan)' : '(Template)'}
                    </option>
                  ))}
                </Select>
                
                {templateWorkouts.length === 0 && (
                  <Alert status="info" size="sm">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="medium">No template workouts available</Text>
                      <Text fontSize="xs">Create workout templates first to use them in monthly plans.</Text>
                    </VStack>
                  </Alert>
                )}
                
                {updating && (
                  <HStack spacing={2}>
                    <Spinner size="sm" />
                    <Text fontSize="sm" color={infoColor}>Updating week...</Text>
                  </HStack>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Plan Assignment Modal */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={onAssignModalClose}
        onSuccess={handleAssignmentSuccess}
        monthlyPlan={monthlyPlan}
      />
    </Box>
  );
} 