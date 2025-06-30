import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  VStack, HStack, Button, Text, useToast, useColorModeValue, Box, Badge,
  Input, InputGroup, InputLeftElement, Checkbox, CheckboxGroup, Stack,
  Avatar, Flex, Divider, Alert, AlertIcon, Spinner, SimpleGrid,
  Card, CardBody, Icon, Tooltip, Center
} from '@chakra-ui/react';
import { FaSearch, FaUsers, FaDumbbell, FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';
import { api } from '../services/api';
import type { Workout } from '../services/api';
import { useCoachAthletes } from '../hooks/useCoachAthletes';
import { supabase } from '../lib/supabase';

interface WorkoutAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  workout: Workout;
}

interface AthleteWithAssignment {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  avatar_url?: string;
  isAlreadyAssigned?: boolean;
}

export function WorkoutAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  workout
}: WorkoutAssignmentModalProps) {
  const toast = useToast();
  
  // All hooks must be called before any conditional logic
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const workoutInfoBg = useColorModeValue('blue.50', 'blue.900');
  const selectedCardBg = useColorModeValue('blue.50', 'blue.900');

  // Athletes data
  const { data: coachAthletes, isLoading: athletesLoading } = useCoachAthletes();
  
  // Modal state
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAssignments, setCheckingAssignments] = useState(false);
  const [athletesWithAssignments, setAthletesWithAssignments] = useState<AthleteWithAssignment[]>([]);

  // Check for existing assignments
  const checkExistingAssignments = async () => {
    if (!coachAthletes?.length) return;

    try {
      setCheckingAssignments(true);
      
      // Get all assignments for this workout
      const { data: existingAssignments, error: assignmentsError } = await supabase
        .from('athlete_workouts')
        .select('athlete_id')
        .eq('workout_id', workout.id);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      const assignedAthleteIds = existingAssignments?.map(a => a.athlete_id) || [];

      // Process each athlete
      const athletesWithData = coachAthletes.map((athlete) => ({
        id: athlete.id,
        first_name: athlete.first_name,
        last_name: athlete.last_name,
        email: athlete.email || '',
        avatar_url: athlete.avatar_url,
        isAlreadyAssigned: assignedAthleteIds.includes(athlete.id)
      } as AthleteWithAssignment));

      setAthletesWithAssignments(athletesWithData);
      
      // Pre-select already assigned athletes
      setSelectedAthletes(assignedAthleteIds);
    } catch (error) {
      console.error('Error checking existing assignments:', error);
      toast({
        title: 'Error checking assignments',
        description: 'Unable to check for existing assignments. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setCheckingAssignments(false);
    }
  };

  // Load assignment data when modal opens
  useEffect(() => {
    if (isOpen && coachAthletes?.length) {
      checkExistingAssignments();
    }
  }, [isOpen, coachAthletes?.length, workout.id]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAthletes([]);
      setSearchQuery('');
      setAthletesWithAssignments([]);
    }
  }, [isOpen]);

  // Filter athletes based on search query
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
        description: 'Please select at least one athlete to assign the workout to.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      setLoading(true);

      // Get currently assigned athletes
      const currentlyAssigned = athletesWithAssignments
        .filter(a => a.isAlreadyAssigned)
        .map(a => a.id);

      // Determine which athletes to add and remove
      const athletesToAdd = selectedAthletes.filter(id => !currentlyAssigned.includes(id));
      const athletesToRemove = currentlyAssigned.filter(id => !selectedAthletes.includes(id));

      // Add new assignments
      if (athletesToAdd.length > 0) {
        await api.athleteWorkouts.assign(workout.id, athletesToAdd);
      }

      // Remove assignments
      if (athletesToRemove.length > 0) {
        for (const athleteId of athletesToRemove) {
          const { error } = await supabase
            .from('athlete_workouts')
            .delete()
            .eq('workout_id', workout.id)
            .eq('athlete_id', athleteId);

          if (error) {
            console.error('Error removing assignment:', error);
            throw error;
          }
        }
      }

      toast({
        title: 'Assignment Updated',
        description: `Workout "${workout.name}" has been assigned to ${selectedAthletes.length} athlete(s).`,
        status: 'success',
        duration: 4000,
        isClosable: true
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating workout assignments:', error);
      toast({
        title: 'Assignment Failed',
        description: 'There was an error updating the workout assignments. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const selectedCount = selectedAthletes.length;
  const totalAthletes = filteredAthletes.length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" closeOnOverlayClick={!loading}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <HStack>
              <Icon as={FaDumbbell} color="blue.500" />
              <Text color={titleColor}>Assign Workout to Athletes</Text>
            </HStack>
            <Text fontSize="sm" fontWeight="normal" color={infoColor}>
              Manage which athletes this workout is assigned to
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={loading} />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Workout Info */}
            <Card bg={workoutInfoBg} borderColor={borderColor}>
              <CardBody py={3}>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FaDumbbell} color="blue.600" />
                    <Text fontWeight="bold" color={titleColor}>{workout.name}</Text>
                    {workout.is_template && (
                      <Badge colorScheme="purple" size="sm">TEMPLATE</Badge>
                    )}
                  </HStack>
                  {workout.description && (
                    <Text fontSize="sm" color={infoColor} noOfLines={2}>
                      {workout.description}
                    </Text>
                  )}
                  <HStack spacing={4} fontSize="sm" color={infoColor}>
                    <HStack>
                      <Text fontWeight="medium">Type:</Text>
                      <Text>{workout.template_type || 'Single Workout'}</Text>
                    </HStack>
                    {workout.exercises && (
                      <HStack>
                        <Text fontWeight="medium">Exercises:</Text>
                        <Text>{workout.exercises.length}</Text>
                      </HStack>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Search Athletes */}
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontWeight="medium" color={titleColor}>
                  Select Athletes ({selectedCount}/{totalAthletes})
                </Text>
              </HStack>
              
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search athletes by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg={cardBg}
                />
              </InputGroup>
            </VStack>

            {/* Athletes List */}
            <Box maxH="400px" overflowY="auto">
              {athletesLoading || checkingAssignments ? (
                <Center py={8}>
                  <VStack spacing={3}>
                    <Spinner size="lg" color="blue.500" />
                    <Text color={infoColor}>Loading athletes...</Text>
                  </VStack>
                </Center>
              ) : filteredAthletes.length === 0 ? (
                <Center py={8}>
                  <VStack spacing={3}>
                    <Icon as={FaUsers} boxSize={8} color="gray.400" />
                    <Text color={infoColor} textAlign="center">
                      {searchQuery ? 'No athletes found matching your search.' : 'No athletes available for assignment.'}
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <SimpleGrid columns={1} spacing={3}>
                  {filteredAthletes.map((athlete) => (
                    <Card
                      key={athlete.id}
                      borderColor={selectedAthletes.includes(athlete.id) ? 'blue.300' : borderColor}
                      bg={selectedAthletes.includes(athlete.id) ? selectedCardBg : cardBg}
                      cursor="pointer"
                      _hover={{ borderColor: 'blue.300' }}
                      onClick={() => handleAthleteToggle(athlete.id)}
                    >
                      <CardBody py={3}>
                        <HStack spacing={3}>
                          <Checkbox
                            isChecked={selectedAthletes.includes(athlete.id)}
                            onChange={() => handleAthleteToggle(athlete.id)}
                            colorScheme="blue"
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
            <Button variant="ghost" onClick={handleClose} isDisabled={loading}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
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