import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, DrawerCloseButton,
  VStack, HStack, Button, Text, useToast, useColorModeValue, Box, Badge,
  Input, InputGroup, InputLeftElement, Checkbox, Avatar, Spinner,
  Card, CardBody, Icon, Flex, useBreakpointValue
} from '@chakra-ui/react';
import { FaSearch, FaUsers, FaCalendarAlt, FaDumbbell } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { Workout } from '../services/api';
import type { TrainingPlan } from '../services/dbSchema';
import { useCoachAthletes } from '../hooks/useCoachAthletes';
import { AssignmentService } from '../services/assignmentService';
import { getTodayLocalDate } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';

interface AssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  workout?: Workout;
  monthlyPlan?: TrainingPlan;
}

interface AthleteWithAssignment {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  avatar_url?: string;
  isAlreadyAssigned?: boolean;
  isMarkedForUnassignment?: boolean;
}

export function AssignmentDrawer({
  isOpen,
  onClose,
  onSuccess,
  workout,
  monthlyPlan
}: AssignmentDrawerProps) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Responsive: bottom drawer on mobile, right drawer on desktop
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Determine what we're assigning
  const isWorkoutAssignment = !!workout;
  const assignmentItem = workout || monthlyPlan;
  
  // Theme colors
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerText = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.100', 'gray.600');
  
  // State
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAssignments, setExistingAssignments] = useState<Set<string>>(new Set());
  const [athletesToUnassign, setAthletesToUnassign] = useState<Set<string>>(new Set());

  // Fetch athletes using the hook
  const { data: athletes = [], isLoading: athletesLoading } = useCoachAthletes();

  // Filter and process athletes
  const processedAthletes: AthleteWithAssignment[] = useMemo(() => {
    return athletes.map(athlete => ({
      ...athlete,
      isAlreadyAssigned: existingAssignments.has(athlete.id),
      isMarkedForUnassignment: athletesToUnassign.has(athlete.id)
    })).filter(athlete => {
      if (!searchTerm) return true;
      const fullName = `${athlete.first_name} ${athlete.last_name}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || 
             athlete.email?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [athletes, existingAssignments, athletesToUnassign, searchTerm]);

  // Load existing assignments when drawer opens
  useEffect(() => {
    if (isOpen && assignmentItem) {
      loadExistingAssignments();
    }
  }, [isOpen, assignmentItem]);

  const loadExistingAssignments = async () => {
    if (!assignmentItem || !user?.id) return;

    try {
      let assignedAthleteIds: Set<string>;

      if (isWorkoutAssignment) {
        // For workout assignments, check the unified_workout_assignments table
        // Determine assignment type based on workout template_type
        const assignmentType = (workout as any)?.template_type === 'weekly' ? 'weekly' : 
                               (workout as any)?.template_type === 'monthly' ? 'monthly' : 'single';
        
        // Look for assignments with the same workout name and meta.original_workout_id
        const { data, error } = await supabase
          .from('unified_workout_assignments')
          .select('athlete_id')
          .eq('assigned_by', user.id)
          .eq('assignment_type', assignmentType)
          .contains('meta', { original_workout_id: assignmentItem.id });

        if (error) throw error;
        assignedAthleteIds = new Set(data?.map(assignment => assignment.athlete_id) || []);
      } else {
        // For training plan assignments, check the training_plan_assignments table
        const { data, error } = await supabase
          .from('training_plan_assignments')
          .select('athlete_id')
          .eq('assigned_by', user.id)
          .eq('training_plan_id', assignmentItem.id);

        if (error) throw error;
        assignedAthleteIds = new Set(data?.map(assignment => assignment.athlete_id) || []);
      }

      setExistingAssignments(assignedAthleteIds);
    } catch (error) {
      console.error('Error loading existing assignments:', error);
      // Don't throw error - just log and continue with empty assignments
      setExistingAssignments(new Set());
    }
  };

  const handleAthleteToggle = (athleteId: string) => {
    const isCurrentlyAssigned = existingAssignments.has(athleteId);
    const isMarkedForUnassignment = athletesToUnassign.has(athleteId);
    const isSelected = selectedAthletes.has(athleteId);

    if (isCurrentlyAssigned) {
      // This athlete is already assigned - toggle unassignment
      const newUnassignSet = new Set(athletesToUnassign);
      if (isMarkedForUnassignment) {
        newUnassignSet.delete(athleteId);
      } else {
        newUnassignSet.add(athleteId);
      }
      setAthletesToUnassign(newUnassignSet);
    } else {
      // This athlete is not assigned - toggle selection for assignment
      const newSelected = new Set(selectedAthletes);
      if (isSelected) {
        newSelected.delete(athleteId);
      } else {
        newSelected.add(athleteId);
      }
      setSelectedAthletes(newSelected);
    }
  };

  const handleSelectAll = () => {
    const unassignedAthletes = processedAthletes.filter(athlete => !athlete.isAlreadyAssigned);
    if (selectedAthletes.size === unassignedAthletes.length) {
      setSelectedAthletes(new Set());
    } else {
      setSelectedAthletes(new Set(unassignedAthletes.map(athlete => athlete.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedAthletes.size === 0 && athletesToUnassign.size === 0 || !assignmentItem || !user?.id) {
      toast({
        title: 'No athletes selected',
        description: 'Please select at least one athlete to assign or unassign.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const athleteIdsToAssign = Array.from(selectedAthletes);
      const athleteIdsToUnassign = Array.from(athletesToUnassign);
      
      if (isWorkoutAssignment) {
        // Create assignments using AssignmentService
        const assignmentService = new AssignmentService();
        
        // Determine assignment type based on workout template_type
        const assignmentType = (workout as any)?.template_type === 'weekly' ? 'weekly' : 
                               (workout as any)?.template_type === 'monthly' ? 'monthly' : 'single';
        
        for (const athleteId of athleteIdsToAssign) {
          let exerciseBlock: any;
          let endDate: string;
          let metaWorkoutType: string;

          if (assignmentType === 'weekly') {
            // Weekly workout - convert blocks to daily_workouts format
            let dailyWorkouts: any = {};
            
            if ((workout as any)?.blocks) {
              // Parse blocks if it's a string
              let blocks: any = (workout as any).blocks;
              if (typeof blocks === 'string') {
                try {
                  blocks = JSON.parse(blocks);
                } catch (e) {
                  console.error('Failed to parse workout blocks:', e);
                  blocks = {};
                }
              }
              
              // Use the blocks structure as-is for daily_workouts
              if (typeof blocks === 'object' && blocks !== null) {
                dailyWorkouts = blocks;
              }
            }
            
            exerciseBlock = {
              workout_name: workout!.name,
              description: workout!.description || '',
              estimated_duration: workout!.duration,
              daily_workouts: dailyWorkouts
            };
            
            // Weekly assignments span 7 days
            const startDate = new Date();
            const endDateObj = new Date(startDate);
            endDateObj.setDate(startDate.getDate() + 6);
            endDate = endDateObj.toISOString().split('T')[0];
            metaWorkoutType = 'weekly';
          } else if (assignmentType === 'monthly') {
            // Monthly workout - similar structure but longer duration
            exerciseBlock = {
              workout_name: workout!.name,
              description: workout!.description || '',
              estimated_duration: workout!.duration,
              exercises: workout!.exercises || []
            };
            
            // Monthly assignments span 30 days
            const startDate = new Date();
            const endDateObj = new Date(startDate);
            endDateObj.setDate(startDate.getDate() + 29);
            endDate = endDateObj.toISOString().split('T')[0];
            metaWorkoutType = 'monthly';
          } else {
            // Single workout
            exerciseBlock = {
              workout_name: workout!.name,
              description: workout!.description || '',
              estimated_duration: workout!.duration,
              exercises: workout!.exercises || []
            };
            endDate = getTodayLocalDate();
            metaWorkoutType = 'single';
          }

          await assignmentService.createAssignment({
            athlete_id: athleteId,
            assignment_type: assignmentType,
            exercise_block: exerciseBlock,
            progress: {
              current_exercise_index: 0,
              current_set: 1,
              current_rep: 1,
              completed_exercises: [],
              total_exercises: 0,
              completion_percentage: 0
            },
            start_date: getTodayLocalDate(),
            end_date: endDate,
            assigned_at: new Date().toISOString(),
            assigned_by: user.id,
            status: 'assigned',
            meta: {
              original_workout_id: workout!.id,
              workout_type: metaWorkoutType
            }
          });
        }

        for (const athleteId of athleteIdsToUnassign) {
          await supabase
            .from('unified_workout_assignments')
            .delete()
            .eq('athlete_id', athleteId)
            .eq('assigned_by', user.id)
            .eq('assignment_type', assignmentType)
            .contains('meta', { original_workout_id: assignmentItem.id });
        }
        
        // Determine display text for assignment type
        const assignmentTypeText = assignmentType === 'weekly' ? 'Weekly workout' : 
                                   assignmentType === 'monthly' ? 'Monthly workout' : 'Workout';
        
        toast({
          title: `${assignmentTypeText} assigned/unassigned successfully`,
          description: `Assigned "${workout!.name}" to ${athleteIdsToAssign.length} athlete(s) and unassigned from ${athleteIdsToUnassign.length} athlete(s).`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      } else {
        // Use API for monthly plans
        if (athleteIdsToAssign.length > 0) {
          await api.monthlyPlanAssignments.assign(monthlyPlan!.id, athleteIdsToAssign, monthlyPlan!.start_date);
        }
        
        // Remove assignments for unassigned athletes
        for (const athleteId of athleteIdsToUnassign) {
          await api.trainingPlanAssignments.removeByPlanAndAthlete(monthlyPlan!.id, athleteId);
        }
        
        toast({
          title: 'Training plan assigned/unassigned successfully',
          description: `Assigned "${monthlyPlan!.name}" to ${athleteIdsToAssign.length} athlete(s) and unassigned from ${athleteIdsToUnassign.length} athlete(s).`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['athlete-assignments'] });

      // Reset state and close
      setSelectedAthletes(new Set());
      setAthletesToUnassign(new Set());
      setSearchTerm('');
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast({
        title: 'Assignment failed',
        description: error.message || 'There was an error assigning/unassigning the workout/plan.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setSelectedAthletes(new Set());
    setAthletesToUnassign(new Set());
    setSearchTerm('');
    setExistingAssignments(new Set());
  };

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  // Shared content component
  const AssignmentContent = () => (
    <>
      {/* Item info */}
      <VStack spacing={4} align="stretch" mb={6}>
        {assignmentItem && (
          <HStack spacing={3} align="center">
            <Icon 
              as={isWorkoutAssignment ? FaDumbbell : FaCalendarAlt} 
              color="blue.500" 
              boxSize={5}
            />
            <VStack spacing={1} align="start">
              <Text fontWeight="semibold" color={drawerText}>
                {assignmentItem.name}
              </Text>
              {assignmentItem.description && (
                <Text fontSize="sm" color="gray.500" noOfLines={2}>
                  {assignmentItem.description}
                </Text>
              )}
            </VStack>
          </HStack>
        )}

        {/* Search */}
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search athletes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg={inputBg}
            borderColor={borderColor}
          />
        </InputGroup>

        {/* Select All / Stats */}
        <HStack justify="space-between" align="center">
          <HStack spacing={4}>
            <Checkbox
              isChecked={selectedAthletes.size > 0 && selectedAthletes.size === processedAthletes.filter(a => !a.isAlreadyAssigned).length}
              isIndeterminate={selectedAthletes.size > 0 && selectedAthletes.size < processedAthletes.filter(a => !a.isAlreadyAssigned).length}
              onChange={handleSelectAll}
              isDisabled={processedAthletes.filter(a => !a.isAlreadyAssigned).length === 0}
            >
              <Text fontSize="sm" color={drawerText}>Select All</Text>
            </Checkbox>
          </HStack>
          
          <HStack spacing={3}>
            <Badge colorScheme="blue" px={2} py={1}>
              {selectedAthletes.size} to assign
            </Badge>
            {athletesToUnassign.size > 0 && (
              <Badge colorScheme="red" px={2} py={1}>
                {athletesToUnassign.size} to unassign
              </Badge>
            )}
            <Badge colorScheme="gray" px={2} py={1}>
              {processedAthletes.length} total
            </Badge>
          </HStack>
        </HStack>

        {/* Instructions */}
        <Box bg={useColorModeValue('blue.50', 'blue.900')} p={3} borderRadius="md">
          <Text fontSize="sm" color={useColorModeValue('blue.700', 'blue.200')}>
            💡 Click unassigned athletes to assign them. Click assigned athletes to unassign them.
          </Text>
        </Box>
      </VStack>

      {/* Athletes List */}
      <Box flex="1" overflowY="auto">
        {athletesLoading ? (
          <VStack spacing={4} py={8}>
            <Spinner size="lg" color="blue.500" />
            <Text color={drawerText}>Loading athletes...</Text>
          </VStack>
        ) : processedAthletes.length === 0 ? (
          <VStack spacing={4} py={8}>
            <Icon as={FaUsers} boxSize={12} color="gray.400" />
            <Text color="gray.500" textAlign="center">
              {searchTerm ? 'No athletes found matching your search.' : 'No athletes available for assignment.'}
            </Text>
          </VStack>
        ) : (
          <VStack spacing={2}>
            {processedAthletes.map((athlete) => {
              const isMarkedForUnassignment = (athlete as any).isMarkedForUnassignment;
              return (
                <Card
                  key={athlete.id}
                  bg={athlete.isAlreadyAssigned ? cardBg : inputBg}
                  cursor="pointer"
                  onClick={() => handleAthleteToggle(athlete.id)}
                  _hover={{ bg: cardHoverBg }}
                  opacity={isMarkedForUnassignment ? 0.7 : 1}
                  borderWidth="2px"
                  borderColor={
                    isMarkedForUnassignment
                      ? "red.500"
                      : athlete.isAlreadyAssigned 
                        ? "orange.300"
                        : selectedAthletes.has(athlete.id) 
                          ? "blue.500" 
                          : "transparent"
                  }
                  w="full"
                >
                  <CardBody px={3} py={0.5}>
                    <HStack spacing={3} align="center">
                      <Checkbox
                        isChecked={selectedAthletes.has(athlete.id) || isMarkedForUnassignment}
                        isDisabled={false}
                        pointerEvents="none"
                      />
                      
                      <Avatar
                        size="sm"
                        src={athlete.avatar_url}
                        name={`${athlete.first_name} ${athlete.last_name}`}
                      />
                      
                      <VStack spacing={0} align="start" flex="1" minW={0}>
                        <Text 
                          fontWeight="medium" 
                          color={drawerText}
                          noOfLines={1}
                        >
                          {athlete.first_name} {athlete.last_name}
                        </Text>
                        {athlete.email && (
                          <Text fontSize="xs" color="gray.500" noOfLines={1}>
                            {athlete.email}
                          </Text>
                        )}
                      </VStack>

                      {athlete.isAlreadyAssigned && !isMarkedForUnassignment && (
                        <Badge colorScheme="orange" size="sm">
                          Assigned
                        </Badge>
                      )}
                      {isMarkedForUnassignment && (
                        <Badge colorScheme="red" size="sm">
                          Unassign
                        </Badge>
                      )}
                    </HStack>
                  </CardBody>
                </Card>
              );
            })}
                      </VStack>
        )}
      </Box>

      {/* Action Buttons */}
      <VStack spacing={3} pt={6} borderTopWidth="1px" borderColor={borderColor}>
        <HStack spacing={3} w="full">
          <Button
            variant="outline"
            onClick={onClose}
            size="lg"
            flex="1"
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Processing..."
            size="lg"
            flex="2"
            isDisabled={selectedAthletes.size === 0 && athletesToUnassign.size === 0}
          >
            {(() => {
              const assignCount = selectedAthletes.size;
              const unassignCount = athletesToUnassign.size;
              
              if (assignCount > 0 && unassignCount > 0) {
                return `Assign ${assignCount} & Unassign ${unassignCount}`;
              } else if (assignCount > 0) {
                return `Assign to ${assignCount} Athlete${assignCount !== 1 ? 's' : ''}`;
              } else if (unassignCount > 0) {
                return `Unassign ${unassignCount} Athlete${unassignCount !== 1 ? 's' : ''}`;
              } else {
                return 'No Changes';
              }
            })()}
          </Button>
        </HStack>
      </VStack>
    </>
  );

  // Mobile: Bottom drawer using Drawer
  if (isMobile) {
    return (
      <Drawer isOpen={isOpen} placement="bottom" onClose={onClose} size="full">
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent bg={drawerBg} maxH="75vh" h="auto" borderTopRadius="xl">
          <DrawerCloseButton 
            size="lg" 
            color={drawerText}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
          />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} pr={12}>
            <Text fontSize="xl" fontWeight="bold" color={drawerText}>
              Assign {isWorkoutAssignment ? 'Workout' : 'Training Plan'}
            </Text>
          </DrawerHeader>
          <DrawerBody p={6} overflowY="auto" display="flex" flexDirection="column">
            <AssignmentContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Right drawer
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay bg="blackAlpha.600" />
      <DrawerContent bg={drawerBg} maxW="600px">
        <DrawerCloseButton 
          size="lg" 
          color={drawerText}
          _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
        />
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} pr={12}>
          <Text fontSize="xl" fontWeight="bold" color={drawerText}>
            Assign {isWorkoutAssignment ? 'Workout' : 'Training Plan'}
          </Text>
        </DrawerHeader>
        <DrawerBody p={6} display="flex" flexDirection="column">
          <AssignmentContent />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
} 