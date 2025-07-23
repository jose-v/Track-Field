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

  // Fetch athletes using the hook
  const { data: athletes = [], isLoading: athletesLoading } = useCoachAthletes();

  // Filter and process athletes
  const processedAthletes: AthleteWithAssignment[] = useMemo(() => {
    return athletes.map(athlete => ({
      ...athlete,
      isAlreadyAssigned: existingAssignments.has(athlete.id)
    })).filter(athlete => {
      if (!searchTerm) return true;
      const fullName = `${athlete.first_name} ${athlete.last_name}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || 
             athlete.email?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [athletes, existingAssignments, searchTerm]);

  // Load existing assignments when drawer opens
  useEffect(() => {
    if (isOpen && assignmentItem) {
      loadExistingAssignments();
    }
  }, [isOpen, assignmentItem]);

  const loadExistingAssignments = async () => {
    if (!assignmentItem || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('training_plan_assignments')
        .select('athlete_id')
        .eq('coach_id', user.id)
        .eq(isWorkoutAssignment ? 'workout_id' : 'monthly_plan_id', assignmentItem.id)
        .eq('assignment_type', isWorkoutAssignment ? 'single' : 'monthly');

      if (error) throw error;

      const assignedAthleteIds = new Set(data?.map(assignment => assignment.athlete_id) || []);
      setExistingAssignments(assignedAthleteIds);
    } catch (error) {
      console.error('Error loading existing assignments:', error);
    }
  };

  const handleAthleteToggle = (athleteId: string) => {
    const newSelected = new Set(selectedAthletes);
    if (newSelected.has(athleteId)) {
      newSelected.delete(athleteId);
    } else {
      newSelected.add(athleteId);
    }
    setSelectedAthletes(newSelected);
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
    if (selectedAthletes.size === 0 || !assignmentItem || !user?.id) {
      toast({
        title: 'No athletes selected',
        description: 'Please select at least one athlete to assign.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const athleteIds = Array.from(selectedAthletes);
      
      if (isWorkoutAssignment) {
        // Create assignments using AssignmentService
        const assignmentService = new AssignmentService();
        for (const athleteId of athleteIds) {
          await assignmentService.createAssignment({
            athlete_id: athleteId,
            assignment_type: 'single',
            exercise_block: {
              workout_name: workout!.name,
              description: workout!.description || '',
              estimated_duration: workout!.duration,
              exercises: workout!.exercises || []
            },
            progress: {
              current_exercise_index: 0,
              current_set: 1,
              current_rep: 1,
              completed_exercises: [],
              total_exercises: 0,
              completion_percentage: 0
            },
            start_date: getTodayLocalDate(),
            end_date: getTodayLocalDate(),
            assigned_at: new Date().toISOString(),
            assigned_by: user.id,
            status: 'assigned',
            meta: {
              original_workout_id: workout!.id,
              workout_type: 'single'
            }
          });
        }
        toast({
          title: 'Workout assigned successfully',
          description: `Assigned "${workout!.name}" to ${athleteIds.length} athlete(s).`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      } else {
        // Use API for monthly plans
        await api.monthlyPlanAssignments.assign(monthlyPlan!.id, athleteIds, monthlyPlan!.start_date);
        toast({
          title: 'Training plan assigned successfully',
          description: `Assigned "${monthlyPlan!.name}" to ${athleteIds.length} athlete(s).`,
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
      setSearchTerm('');
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast({
        title: 'Assignment failed',
        description: error.message || 'There was an error assigning the workout/plan.',
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
              {selectedAthletes.size} selected
            </Badge>
            <Badge colorScheme="gray" px={2} py={1}>
              {processedAthletes.length} total
            </Badge>
          </HStack>
        </HStack>
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
            {processedAthletes.map((athlete) => (
                              <Card
                  key={athlete.id}
                  bg={athlete.isAlreadyAssigned ? cardBg : inputBg}
                  cursor={athlete.isAlreadyAssigned ? 'not-allowed' : 'pointer'}
                  onClick={() => !athlete.isAlreadyAssigned && handleAthleteToggle(athlete.id)}
                  _hover={!athlete.isAlreadyAssigned ? { bg: cardHoverBg } : {}}
                  opacity={athlete.isAlreadyAssigned ? 0.6 : 1}
                  borderWidth="2px"
                  borderColor={
                    athlete.isAlreadyAssigned 
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
                      isChecked={selectedAthletes.has(athlete.id)}
                      isDisabled={athlete.isAlreadyAssigned}
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

                    {athlete.isAlreadyAssigned && (
                      <Badge colorScheme="orange" size="sm">
                        Assigned
                      </Badge>
                    )}
                  </HStack>
                </CardBody>
              </Card>
            ))}
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
            loadingText="Assigning..."
            size="lg"
            flex="2"
            isDisabled={selectedAthletes.size === 0}
          >
            Assign to {selectedAthletes.size} Athlete{selectedAthletes.size !== 1 ? 's' : ''}
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