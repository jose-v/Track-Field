import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  VStack, HStack, Button, Text, useToast, useColorModeValue, Box, Badge,
  Input, InputGroup, InputLeftElement, Checkbox, Avatar, Spinner, SimpleGrid,
  Card, CardBody, Icon
} from '@chakra-ui/react';
import { FaSearch, FaUsers, FaCalendarAlt, FaDumbbell } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { Workout } from '../services/api';
import type { TrainingPlan } from '../services/dbSchema';
import { useCoachAthletes } from '../hooks/useCoachAthletes';
import { AssignmentService } from '../services/assignmentService';
import { supabase } from '../lib/supabase';

interface AssignmentModalProps {
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
}

export function AssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  workout,
  monthlyPlan
}: AssignmentModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Determine what we're assigning
  const isWorkoutAssignment = !!workout;
  const assignmentItem = workout || monthlyPlan;
  
  if (!assignmentItem) {
    return null;
  }
  
  // Theme colors
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const itemInfoBg = useColorModeValue(
    isWorkoutAssignment ? 'blue.50' : 'teal.50',
    isWorkoutAssignment ? 'blue.900' : 'teal.900'
  );

  // Athletes data
  const { data: coachAthletes, isLoading: athletesLoading } = useCoachAthletes();
  
  // Modal state
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [athletesWithAssignments, setAthletesWithAssignments] = useState<AthleteWithAssignment[]>([]);

  // Check for existing assignments
  const checkExistingAssignments = async () => {
    if (!coachAthletes?.length || !assignmentItem) return;

    try {
      let existingAssignments: any[] = [];
      
      if (isWorkoutAssignment && workout) {
        // Check unified assignment system for workout assignments
        // Determine assignment type based on workout template_type
        const assignmentType = workout.template_type === 'weekly' ? 'weekly' : 
                               workout.template_type === 'monthly' ? 'monthly' : 'single';
        
        const { data: workoutAssignments, error } = await supabase
          .from('unified_workout_assignments')
          .select('athlete_id')
          .eq('meta->>original_workout_id', workout.id)
          .eq('assignment_type', assignmentType);

        if (error) throw error;
        existingAssignments = workoutAssignments || [];
      } else if (monthlyPlan) {
        const planAssignments = await api.trainingPlanAssignments.getByPlan(monthlyPlan.id);
        existingAssignments = planAssignments.map(a => ({ athlete_id: a.athlete_id }));
      }

      const assignedAthleteIds = existingAssignments.map(a => a.athlete_id);

      const athletesWithData = coachAthletes.map((athlete) => ({
        id: athlete.id,
        first_name: athlete.first_name,
        last_name: athlete.last_name,
        email: athlete.email || '',
        avatar_url: athlete.avatar_url,
        isAlreadyAssigned: assignedAthleteIds.includes(athlete.id)
      } as AthleteWithAssignment));

      setAthletesWithAssignments(athletesWithData);
      setSelectedAthletes(assignedAthleteIds);
    } catch (error) {
      console.error('Error checking existing assignments:', error);
    }
  };

  useEffect(() => {
    if (isOpen && coachAthletes?.length && assignmentItem) {
      checkExistingAssignments();
    }
  }, [isOpen, coachAthletes?.length, assignmentItem?.id]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAthletes([]);
      setSearchQuery('');
      setAthletesWithAssignments([]);
    }
  }, [isOpen]);

  // Filter athletes
  const filteredAthletes = useMemo(() => {
    if (!athletesWithAssignments?.length) return [];
    
    return athletesWithAssignments.filter(athlete => {
      const fullName = `${athlete.first_name} ${athlete.last_name}`.toLowerCase();
      const email = athlete.email?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return fullName.includes(query) || email.includes(query);
    });
  }, [athletesWithAssignments, searchQuery]);

  // Handle athlete selection
  const handleAthleteToggle = (athleteId: string) => {
    setSelectedAthletes(prev => 
      prev.includes(athleteId)
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  // Handle assignment submission
  const handleAssign = async () => {
    // Check if there are any changes to make
    const currentlyAssigned = athletesWithAssignments
      .filter(a => a.isAlreadyAssigned)
      .map(a => a.id);

    const athletesToAdd = selectedAthletes.filter(id => !currentlyAssigned.includes(id));
    const athletesToRemove = currentlyAssigned.filter(id => !selectedAthletes.includes(id));

    // If no changes are being made, show a message
    if (athletesToAdd.length === 0 && athletesToRemove.length === 0) {
      toast({
        title: 'No changes made',
        description: 'The current assignments are already up to date.',
        status: 'info',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      setLoading(true);

      if (isWorkoutAssignment && workout) {
        const assignmentService = new AssignmentService();
        
        // Create unified assignments for new athletes
        if (athletesToAdd.length > 0) {
          // Determine assignment type based on workout template_type
          const assignmentType = workout.template_type === 'weekly' ? 'weekly' : 
                                 workout.template_type === 'monthly' ? 'monthly' : 'single';
          
          // Convert workout to unified format based on type
          let exerciseBlock: any;
          let endDate: string;
          
          if (assignmentType === 'weekly') {
            // Weekly workout - convert blocks to daily_workouts format
            let dailyWorkouts: any = {};
            
            if (workout.blocks) {
              // Parse blocks if it's a string
              let blocks: any = workout.blocks;
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
              workout_name: workout.name,
              description: workout.description || workout.notes || '',
              estimated_duration: workout.duration,
              location: workout.location,
              workout_type: workout.type || 'strength',
              daily_workouts: dailyWorkouts
            };
            
            // Weekly assignments span 7 days
            const startDate = workout.date || new Date().toISOString().split('T')[0];
            endDate = new Date(new Date(startDate).getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          } else {
            // Single workout - use exercises directly
            exerciseBlock = {
              workout_name: workout.name,
              description: workout.description || workout.notes || '',
              estimated_duration: workout.duration,
              location: workout.location,
              workout_type: workout.type || 'strength',
              exercises: workout.exercises || []
            };
            
            endDate = workout.date || new Date().toISOString().split('T')[0];
          }

          for (const athleteId of athletesToAdd) {
            try {
              const startDate = workout.date || new Date().toISOString().split('T')[0];
              await assignmentService.createAssignment({
                athlete_id: athleteId,
                assignment_type: assignmentType,
                exercise_block: exerciseBlock,
                progress: {
                  current_exercise_index: 0,
                  current_set: 1,
                  current_rep: 1,
                  completed_exercises: [],
                  total_exercises: 0, // Will be calculated by AssignmentService
                  completion_percentage: 0
                },
                start_date: startDate,
                end_date: endDate,
                assigned_at: new Date().toISOString(),
                assigned_by: user?.id,
                status: 'assigned',
                meta: {
                  original_workout_id: workout.id,
                  workout_type: assignmentType,
                  estimated_duration: workout.duration,
                  location: workout.location
                }
              });
            } catch (error) {
              console.error(`Failed to create unified assignment for athlete ${athleteId}:`, error);
            }
          }
        }

        // Remove assignments for unselected athletes
        if (athletesToRemove.length > 0) {
          for (const athleteId of athletesToRemove) {
            try {
              // Determine assignment type based on workout template_type  
              const assignmentType = workout.template_type === 'weekly' ? 'weekly' : 
                                     workout.template_type === 'monthly' ? 'monthly' : 'single';
              
              await supabase
                .from('unified_workout_assignments')
                .delete()
                .eq('athlete_id', athleteId)
                .eq('meta->>original_workout_id', workout.id)
                .eq('assignment_type', assignmentType);
            } catch (error) {
              console.error(`Failed to remove unified assignment for athlete ${athleteId}:`, error);
            }
          }
        }

        toast({
          title: 'Assignment Updated',
          description: `Workout "${workout.name}" assigned to ${selectedAthletes.length} athlete(s).`,
          status: 'success',
          duration: 4000,
          isClosable: true
        });
      } else if (monthlyPlan) {
        const assignmentService = new AssignmentService();
        
        // Add new monthly plan assignments
        if (athletesToAdd.length > 0) {
          await api.monthlyPlanAssignments.assign(
            monthlyPlan.id,
            athletesToAdd,
            monthlyPlan.start_date
          );
          
          // Also create unified assignments for monthly plans
          const exerciseBlock = {
            plan_name: monthlyPlan.name,
            description: monthlyPlan.description || '',
            duration_weeks: monthlyPlan.weeks?.length || 4,
            weekly_structure: monthlyPlan.weeks?.map((week: any, index: number) => ({
              week_number: index + 1,
              workout_id: week.workout_id,
              is_rest_week: week.is_rest_week || false
            })) || []
          };
          
          for (const athleteId of athletesToAdd) {
            try {
              const startDate = monthlyPlan.start_date || new Date().toISOString().split('T')[0];
              const endDate = new Date(new Date(startDate).getTime() + ((monthlyPlan.weeks?.length || 4) * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
              
              await assignmentService.createAssignment({
                athlete_id: athleteId,
                assignment_type: 'monthly',
                exercise_block: exerciseBlock,
                progress: {
                  current_exercise_index: 0,
                  current_set: 1,
                  current_rep: 1,
                  completed_exercises: [],
                  total_exercises: monthlyPlan.weeks?.filter((w: any) => !w.is_rest_week).length || 0,
                  completion_percentage: 0
                },
                start_date: startDate,
                end_date: endDate,
                assigned_at: new Date().toISOString(),
                assigned_by: user?.id,
                status: 'assigned',
                meta: {
                  original_plan_id: monthlyPlan.id,
                  plan_type: 'monthly',
                  total_weeks: monthlyPlan.weeks?.length || 4,
                  rest_weeks: monthlyPlan.weeks?.filter((w: any) => w.is_rest_week).length || 0
                }
              });
            } catch (error) {
              console.error(`Failed to create unified assignment for athlete ${athleteId}:`, error);
            }
          }
        }

        // Remove athletes that were unselected
        if (athletesToRemove.length > 0) {
          for (const athleteId of athletesToRemove) {
            await api.monthlyPlanAssignments.removeByPlanAndAthlete(monthlyPlan.id, athleteId);
            
            // Also remove unified assignments
            try {
              await supabase
                .from('unified_workout_assignments')
                .delete()
                .eq('athlete_id', athleteId)
                .eq('meta->>original_plan_id', monthlyPlan.id)
                .eq('assignment_type', 'monthly');
            } catch (error) {
              console.error(`Failed to remove unified assignment for athlete ${athleteId}:`, error);
            }
          }
        }

        // Create descriptive message based on what happened
        let description = '';
        if (athletesToAdd.length > 0 && athletesToRemove.length > 0) {
          description = `Added ${athletesToAdd.length} and removed ${athletesToRemove.length} athlete assignments.`;
        } else if (athletesToAdd.length > 0) {
          description = `Added ${athletesToAdd.length} athlete assignment(s).`;
        } else if (athletesToRemove.length > 0) {
          description = `Removed ${athletesToRemove.length} athlete assignment(s).`;
        }
        
        if (selectedAthletes.length === 0) {
          description += ' Training plan is now unassigned.';
        } else {
          description += ` Training plan is now assigned to ${selectedAthletes.length} athlete(s).`;
        }

        toast({
          title: 'Assignment Updated',
          description,
          status: 'success',
          duration: 4000,
          isClosable: true
        });
      }

      // Force refresh of athlete data for all affected athletes
      const affectedAthleteIds = [...new Set([...athletesToAdd, ...athletesToRemove])];
      affectedAthleteIds.forEach(athleteId => {
        // Invalidate the athlete's assigned workouts cache (old system)
        queryClient.invalidateQueries({ queryKey: ['athleteAssignedWorkouts', athleteId] });
        // Invalidate unified assignment queries (new system)
        queryClient.invalidateQueries({ queryKey: ['unifiedAssignments', athleteId] });
        queryClient.invalidateQueries({ queryKey: ['unifiedTodaysWorkout', athleteId] });
        // Also invalidate athlete's training plan assignments
        queryClient.invalidateQueries({ queryKey: ['athleteMonthlyPlanAssignments', athleteId] });
      });

      // Also invalidate general workout and training plan queries
      queryClient.invalidateQueries({ queryKey: ['workoutCompletionStats'] });
      queryClient.invalidateQueries({ queryKey: ['athleteWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyPlans'] });
      queryClient.invalidateQueries({ queryKey: ['trainingPlanAssignments'] });
      // Invalidate unified assignment queries
      queryClient.invalidateQueries({ queryKey: ['unifiedAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['unifiedTodaysWorkout'] });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating assignments:', error);
      toast({
        title: 'Assignment Failed',
        description: 'Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const itemDetails = isWorkoutAssignment && workout ? {
    title: 'Assign Workout to Athletes',
    itemName: workout.name,
    itemIcon: FaDumbbell,
    itemColor: 'blue'
  } : monthlyPlan ? {
    title: 'Assign Training Plan to Athletes',
    itemName: monthlyPlan.name,
    itemIcon: FaCalendarAlt,
    itemColor: 'teal'
  } : null;

  if (!itemDetails) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" closeOnOverlayClick={!loading}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={itemDetails.itemIcon} color={`${itemDetails.itemColor}.500`} />
            <Text color={titleColor}>{itemDetails.title}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={loading} />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Item Info */}
            <Card bg={itemInfoBg} borderColor={borderColor}>
              <CardBody py={3}>
                <HStack>
                  <Icon as={itemDetails.itemIcon} color={`${itemDetails.itemColor}.600`} />
                  <Text fontWeight="bold" color={titleColor}>{itemDetails.itemName}</Text>
                  {isWorkoutAssignment && workout?.is_template && (
                    <Badge colorScheme="purple" size="sm">TEMPLATE</Badge>
                  )}
                </HStack>
              </CardBody>
            </Card>

            {/* Search */}
            <InputGroup>
              <InputLeftElement>
                <Icon as={FaSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg={cardBg}
              />
            </InputGroup>

            {/* Athletes List */}
            <Box maxH="400px" overflowY="auto">
              {athletesLoading ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="lg" color={`${itemDetails.itemColor}.500`} />
                  <Text mt={4} color={infoColor}>Loading athletes...</Text>
                </Box>
              ) : filteredAthletes.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Icon as={FaUsers} boxSize={8} color="gray.400" />
                  <Text color={infoColor} mt={4}>No athletes found</Text>
                </Box>
              ) : (
                <SimpleGrid columns={1} spacing={3}>
                  {filteredAthletes.map((athlete) => (
                    <Card
                      key={athlete.id}
                      borderColor={selectedAthletes.includes(athlete.id) ? `${itemDetails.itemColor}.300` : borderColor}
                      bg={selectedAthletes.includes(athlete.id) ? itemInfoBg : cardBg}
                      cursor="pointer"
                      onClick={() => handleAthleteToggle(athlete.id)}
                    >
                      <CardBody py={3}>
                        <HStack spacing={3}>
                          <Checkbox
                            isChecked={selectedAthletes.includes(athlete.id)}
                            colorScheme={itemDetails.itemColor}
                          />
                          <Avatar
                            size="sm"
                            name={`${athlete.first_name} ${athlete.last_name}`}
                            src={athlete.avatar_url}
                          />
                          <VStack align="start" spacing={0} flex={1}>
                            <HStack>
                              <Text fontWeight="medium" color={titleColor}>
                                {athlete.first_name} {athlete.last_name}
                              </Text>
                              {athlete.isAlreadyAssigned && (
                                <Badge colorScheme="green" size="sm">ASSIGNED</Badge>
                              )}
                            </HStack>
                            {athlete.email && (
                              <Text fontSize="sm" color={infoColor}>
                                {athlete.email}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={loading}>
              Cancel
            </Button>
            <Button
              colorScheme={itemDetails.itemColor}
              onClick={handleAssign}
              isLoading={loading}
              loadingText="Updating..."
            >
              Update Assignment
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 