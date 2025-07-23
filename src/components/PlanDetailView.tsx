import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Heading, Text, VStack, HStack, Button, Card, CardBody, 
  useColorModeValue, Flex, Badge, Icon, SimpleGrid, Avatar,
  Progress, Skeleton, Alert, AlertIcon, Divider, Tooltip,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  useDisclosure, Spinner, IconButton, useToast, 
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, 
  AlertDialogBody, AlertDialogFooter, Select, Menu, MenuButton, MenuList, MenuItem,
  useBreakpointValue, Collapse
} from '@chakra-ui/react';
import { 
  FaCalendarAlt, FaUsers, FaEdit, FaPlus, FaDumbbell, FaBed, 
  FaChartLine, FaClock, FaCheck, FaTimes, FaEye, FaArrowLeft,
  FaTrash, FaSync, FaEllipsisV, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { api } from '../services/api';
import { AssignmentDrawer } from './AssignmentDrawer';
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
  dailyBreakdown?: Array<{
    day: string;
    blocks: any[];
    totalExercises: number;
  }>;
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
  const dayBlockBg = useColorModeValue('gray.50', 'gray.700');
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
  
  // Mobile accordion state - only one week can be expanded at a time
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Handle week accordion toggle for mobile
  const handleWeekToggle = (weekNumber: number) => {
    if (!isMobile) return; // Only works on mobile
    setExpandedWeek(expandedWeek === weekNumber ? null : weekNumber);
  };
  
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
              workout: undefined,
              dailyBreakdown: []
            };
          }
          
          try {
            // Get all workouts and find the one we need
            const allWorkouts = await api.workouts.getAll();
            const workout = allWorkouts.find(w => w.id === week.workout_id);
            
            // Extract daily breakdown from weekly workout
            let dailyBreakdown: any[] = [];
            if (workout) {
              try {
                let blocks = workout.blocks;
                
                // Handle blocks data - could be string or object
                if (typeof blocks === 'string') {
                  blocks = JSON.parse(blocks);
                }
                
                if (blocks) {
                  // For weekly workouts, blocks should be organized by day
                  if (typeof blocks === 'object' && !Array.isArray(blocks)) {
                    // This is a daily blocks structure (monday, tuesday, etc.)
                    const dayMapping = [
                      { key: 'monday', display: 'Monday' },
                      { key: 'tuesday', display: 'Tuesday' },
                      { key: 'wednesday', display: 'Wednesday' },
                      { key: 'thursday', display: 'Thursday' },
                      { key: 'friday', display: 'Friday' },
                      { key: 'saturday', display: 'Saturday' },
                      { key: 'sunday', display: 'Sunday' }
                    ];
                    
                    dailyBreakdown = dayMapping.map(dayInfo => {
                      const dayBlocks = Array.isArray(blocks[dayInfo.key]) ? blocks[dayInfo.key] : [];
                      return {
                        day: dayInfo.display,
                        blocks: dayBlocks,
                        totalExercises: Array.isArray(dayBlocks) ? dayBlocks.reduce((total: number, block: any) => 
                          total + (block.exercises?.length || 0), 0) : 0
                      };
                    }).filter(dayData => Array.isArray(dayData.blocks) && dayData.blocks.length > 0);
                  } else if (Array.isArray(blocks)) {
                    // Single day blocks - create one day entry
                    dailyBreakdown = [{
                      day: 'Training Day',
                      blocks: blocks,
                      totalExercises: Array.isArray(blocks) ? blocks.reduce((total: number, block: any) => 
                        total + (block.exercises?.length || 0), 0) : 0
                    }];
                  }
                }
              } catch (parseError) {
                console.error('Error parsing workout blocks for', workout.name, ':', parseError);
              }
            }
            
            return {
              ...week,
              workout,
              dailyBreakdown
            };
          } catch (error) {
            console.error(`Error loading workout ${week.workout_id}:`, error);
            return {
              ...week,
              workout: undefined,
              dailyBreakdown: []
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
    <Box minH="100vh" bg={bgColor} p={4}>
      <VStack spacing={6} align="stretch" w="full">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap="20px">
          <HStack spacing={2}>
            <IconButton
              icon={<FaArrowLeft />}
              variant="ghost"
              onClick={onBack}
              size="md"
              aria-label="Back"
            />
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

          <HStack spacing={3} w="full" flex="1">
            {onEdit && (
              <Button
                leftIcon={<FaEdit />}
                variant="outline"
                colorScheme="teal"
                onClick={onEdit}
                size="md"
                flex="1"
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
                flex="1"
              >
                Athletes
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Overview Statistics - Full Width */}
        <HStack spacing={4} justify="space-between" align="center" w="full">
          <VStack spacing={0} align="center" flex="1">
            <Text fontSize="xl" fontWeight="bold" color="teal.500">
              {totalWeeks}
            </Text>
            <Text fontSize="xs" color={infoColor}>Total Weeks</Text>
          </VStack>
          <Divider orientation="vertical" h="40px" />
          <VStack spacing={0} align="center" flex="1">
            <Text fontSize="xl" fontWeight="bold" color="blue.500">
              {trainingWeeks}
            </Text>
            <Text fontSize="xs" color={infoColor}>Training</Text>
          </VStack>
          <Divider orientation="vertical" h="40px" />
          <VStack spacing={0} align="center" flex="1">
            <Text fontSize="xl" fontWeight="bold" color="green.500">
              {assignedAthletes.length}
            </Text>
            <Text fontSize="xs" color={infoColor}>Athletes</Text>
          </VStack>
          <Divider orientation="vertical" h="40px" />
          <VStack spacing={0} align="center" flex="1">
            <Text fontSize="xl" fontWeight="bold" color="orange.500">
              {completionPercentage.toFixed(0)}%
            </Text>
            <Text fontSize="xs" color={infoColor}>Complete</Text>
          </VStack>
        </HStack>

        {/* Weekly Timeline - Full Width */}
        <VStack spacing={4} align="stretch" w="full">
            <HStack justify="space-between" align="center">
              <Heading size="md" color={titleColor}>
                Weekly Timeline
              </Heading>
              <Badge colorScheme="blue" px={3} py={1}>
                {totalWeeks} weeks
              </Badge>
            </HStack>

            {workoutsLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} height="400px" borderRadius="md" w="full" />
                ))}
              </SimpleGrid>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="full">
                {weeksWithWorkouts
                  .sort((a, b) => a.week_number - b.week_number)
                  .map((week) => (
                    <Card 
                      key={week.week_number}
                      bg={cardBg} 
                      borderColor={borderColor} 
                      borderWidth="1px"
                      borderRadius="xl"
                      h={isMobile ? "auto" : "100%"}
                      w="full"
                    >
                      <CardBody p={1}>
                        <VStack spacing={2} align="stretch">
                          {/* Week Header - Clickable on mobile for accordion */}
                          <HStack 
                            justify="space-between" 
                            align="center"
                            cursor={isMobile ? "pointer" : "default"}
                            onClick={() => isMobile && handleWeekToggle(week.week_number)}
                            borderRadius="md"
                            p={2}
                          >
                            <HStack spacing={1}>
                              <Icon 
                                as={week.is_rest_week ? FaBed : FaDumbbell} 
                                color={week.is_rest_week ? 'orange.400' : infoColor}
                                boxSize={5}
                              />
                              <Text fontWeight="semibold" color={titleColor}>
                                Week {week.week_number}
                              </Text>
                              <Badge 
                                colorScheme={week.is_rest_week ? 'orange' : 'gray'}
                                fontSize="xs"
                              >
                                {week.is_rest_week ? 'Rest Week' : 'Training Week'}
                              </Badge>
                            </HStack>
                            
                            <HStack spacing={1}>
                              {/* Week Management Menu */}
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<FaEllipsisV />}
                                  variant="ghost"
                                  size="sm"
                                  isLoading={updating}
                                  onClick={(e) => e.stopPropagation()}
                                  color="white"
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
                              
                              {/* Mobile accordion chevron */}
                              {isMobile && (
                                <Icon 
                                  as={expandedWeek === week.week_number ? FaChevronUp : FaChevronDown}
                                  color={infoColor}
                                  boxSize={4}
                                />
                              )}
                            </HStack>
                          </HStack>

                          {/* Week Content - Collapsible on mobile */}
                          <Collapse in={!isMobile || expandedWeek === week.week_number} animateOpacity>
                            {week.is_rest_week ? (
                              <Text fontSize="sm" color={infoColor} fontStyle="italic" px={2}>
                                Recovery and rest week - no scheduled workouts
                              </Text>
                            ) : week.workout ? (
                              <VStack align="start" spacing={3} px={2}>
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
                                    <HStack spacing={1}>
                                      <Icon as={FaDumbbell} color={infoColor} boxSize={3} />
                                      <Text fontSize="sm" color={infoColor}>
                                        {week.dailyBreakdown && Array.isArray(week.dailyBreakdown) ? week.dailyBreakdown.reduce((total, day) => total + day.totalExercises, 0) : 0} total exercises
                                      </Text>
                                    </HStack>
                                  </HStack>
                                </VStack>

                                {/* Daily Breakdown - What Athletes Actually See */}
                                {week.dailyBreakdown && Array.isArray(week.dailyBreakdown) && week.dailyBreakdown.length > 0 && (
                                  <Box w="full">
                                    <Box fontSize="sm" fontWeight="semibold" color={titleColor} mb={2}>
                                      Daily Schedule (Athlete View):
                                    </Box>
                                    <VStack spacing={2} align="stretch" w="full">
                                      {week.dailyBreakdown.map((day, dayIndex) => (
                                        <Box 
                                          key={dayIndex}
                                          bg={dayBlockBg}
                                          borderRadius="md"
                                          p={6}
                                          borderWidth="1px"
                                          borderColor={borderColor}
                                          w="full"
                                        >
                                          <HStack justify="space-between" mb={3}>
                                            <Box fontSize="md" fontWeight="bold" color={titleColor}>
                                              {day.day}
                                            </Box>
                                            <Badge colorScheme="gray" size="md" px={3} py={1}>
                                              {day.totalExercises} exercises
                                            </Badge>
                                          </HStack>
                                          
                                          {/* Exercise Blocks - Expanded */}
                                          <VStack spacing={4} align="stretch" w="full">
                                            {day.blocks.map((block: any, blockIndex: number) => (
                                              <Box 
                                                 key={blockIndex}
                                                 bg={useColorModeValue('gray.50', 'gray.600')}
                                                 p={4}
                                                 borderRadius="md"
                                                 borderWidth="1px"
                                                 borderColor={borderColor}
                                                 w="full"
                                               >
                                                 <HStack spacing={3} mb={2}>
                                                   <Box as="span" fontSize="sm" color={titleColor} fontWeight="bold">
                                                     {block.name || `Block ${blockIndex + 1}`}
                                                   </Box>
                                                   <Badge colorScheme="gray" size="sm" variant="outline">
                                                     {block.exercises?.length || 0} exercises
                                                   </Badge>
                                                 </HStack>
                                                {block.exercises && block.exercises.length > 0 && (
                                                  <VStack spacing={1} align="start" pl={0}>
                                                    {block.exercises.map((ex: any, exIndex: number) => (
                                                      <HStack key={exIndex} spacing={2}>
                                                        <Box 
                                                           w="4px" 
                                                           h="4px" 
                                                           bg={infoColor} 
                                                           borderRadius="full" 
                                                           mt={1}
                                                         />
                                                        <Text fontSize="sm" color={titleColor} fontWeight="medium">
                                                          {ex.name}
                                                        </Text>
                                                        {ex.sets && (
                                                          <Text fontSize="xs" color={infoColor}>
                                                            ({ex.sets} sets)
                                                          </Text>
                                                        )}
                                                      </HStack>
                                                    ))}
                                                  </VStack>
                                                )}
                                              </Box>
                                            ))}
                                          </VStack>
                                        </Box>
                                      ))}
                                    </VStack>
                                  </Box>
                                )}

                                {/* Show if no daily breakdown available */}
                                {(!week.dailyBreakdown || !Array.isArray(week.dailyBreakdown) || week.dailyBreakdown.length === 0) && week.workout && (
                                  <Alert status="info" size="sm">
                                    <AlertIcon />
                                    <Box fontSize="sm">
                                      {week.workout.is_block_based 
                                        ? "Unable to parse daily schedule from this workout structure."
                                        : "This is a legacy workout template. Daily breakdown not available."
                                      }
                                    </Box>
                                  </Alert>
                                )}
                              </VStack>
                            ) : (
                              <Alert status="warning" size="sm" mx={2}>
                                <AlertIcon />
                                <Text fontSize="sm">Workout template not found</Text>
                              </Alert>
                            )}
                          </Collapse>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
              </SimpleGrid>
            )}
          </VStack>


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

      {/* Plan Assignment Drawer */}
      <AssignmentDrawer
        isOpen={isAssignModalOpen}
        onClose={onAssignModalClose}
        onSuccess={handleAssignmentSuccess}
        monthlyPlan={monthlyPlan}
      />
    </Box>
  );
} 