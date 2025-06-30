import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  VStack, HStack, Button, Text, useToast, useColorModeValue, Box, Badge,
  Input, InputGroup, InputLeftElement, Checkbox, Avatar, Spinner, SimpleGrid,
  Card, CardBody, Icon
} from '@chakra-ui/react';
import { FaSearch, FaUsers, FaCalendarAlt, FaDumbbell } from 'react-icons/fa';
import { api } from '../services/api';
import type { Workout } from '../services/api';
import type { TrainingPlan } from '../services/dbSchema';
import { useCoachAthletes } from '../hooks/useCoachAthletes';
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
  const toast = useToast();
  
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
        const { data: workoutAssignments, error } = await supabase
          .from('athlete_workouts')
          .select('athlete_id')
          .eq('workout_id', workout.id);

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
    if (selectedAthletes.length === 0) {
      toast({
        title: 'No athletes selected',
        description: `Please select at least one athlete.`,
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      setLoading(true);

      const currentlyAssigned = athletesWithAssignments
        .filter(a => a.isAlreadyAssigned)
        .map(a => a.id);

      const athletesToAdd = selectedAthletes.filter(id => !currentlyAssigned.includes(id));
      const athletesToRemove = currentlyAssigned.filter(id => !selectedAthletes.includes(id));

      if (isWorkoutAssignment && workout) {
        if (athletesToAdd.length > 0) {
          await api.athleteWorkouts.assign(workout.id, athletesToAdd);
        }

        if (athletesToRemove.length > 0) {
          for (const athleteId of athletesToRemove) {
            await supabase
              .from('athlete_workouts')
              .delete()
              .eq('workout_id', workout.id)
              .eq('athlete_id', athleteId);
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
        if (athletesToAdd.length > 0) {
          await api.monthlyPlanAssignments.assign(
            monthlyPlan.id,
            athletesToAdd,
            monthlyPlan.start_date
          );
        }

        toast({
          title: 'Assignment Updated',
          description: `Training plan "${monthlyPlan.name}" assigned to ${selectedAthletes.length} athlete(s).`,
          status: 'success',
          duration: 4000,
          isClosable: true
        });
      }

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
              isDisabled={selectedAthletes.length === 0}
            >
              Update Assignment
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 