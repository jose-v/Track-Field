import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  VStack, HStack, Button, Text, useToast, useColorModeValue, Box, Badge,
  Input, InputGroup, InputLeftElement, Checkbox, CheckboxGroup, Stack,
  Avatar, Flex, Divider, Alert, AlertIcon, Spinner, SimpleGrid,
  Card, CardBody, Icon, Tooltip
} from '@chakra-ui/react';
import { FaSearch, FaUsers, FaCalendarAlt, FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';
import { api } from '../services/api';
import type { TrainingPlan } from '../services/dbSchema';
import { useCoachAthletes } from '../hooks/useCoachAthletes';
import { supabase } from '../lib/supabase';

interface PlanAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  monthlyPlan: TrainingPlan;
}

interface AthleteWithAssignment {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  avatar_url?: string;
  hasConflict?: boolean;
  conflictPlan?: string;
  isAlreadyAssigned?: boolean;
}

export function PlanAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  monthlyPlan
}: PlanAssignmentModalProps) {
  const toast = useToast();
  
  // All hooks must be called before any conditional logic
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const planInfoBg = useColorModeValue('teal.50', 'teal.900');
  const selectedCardBg = useColorModeValue('teal.50', 'teal.900');

  // Helper function to format date without timezone issues
  const formatLocalDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString();
  };

  // Athletes data
  const { data: coachAthletes, isLoading: athletesLoading } = useCoachAthletes();
  
  // Modal state
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [athletesWithAssignments, setAthletesWithAssignments] = useState<AthleteWithAssignment[]>([]);



  // Check for existing assignments and conflicts
  const checkAssignmentConflicts = async () => {
    if (!coachAthletes?.length) return;

    try {
      setCheckingConflicts(true);
      
      // Get all assignments for these athletes in one query to avoid relationship issues
      const athleteIds = coachAthletes.map(athlete => athlete.id);
      
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from('training_plan_assignments')
        .select('athlete_id, training_plan_id, status')
        .in('athlete_id', athleteIds);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        throw assignmentsError;
      }

      // Process each athlete
      const athletesWithData = await Promise.all(
        coachAthletes.map(async (athlete) => {
          try {
            // Find assignments for this athlete
            const athleteAssignments = allAssignments?.filter(a => a.athlete_id === athlete.id) || [];
            
            // Check if athlete already has this plan assigned
            const hasThisPlan = athleteAssignments.some(assignment => 
              assignment.training_plan_id === monthlyPlan.id
            );
            
            // For now, we'll only check if athlete already has this specific plan
            // TODO: Implement proper date-based conflict detection in the future
            const hasOtherPlans = false; // Simplified: allow assignment to athletes with other plans

            return {
              id: athlete.id,
              first_name: athlete.first_name,
              last_name: athlete.last_name,
              email: athlete.email || '',
              avatar_url: athlete.avatar_url,
              hasConflict: hasOtherPlans,
              conflictPlan: hasOtherPlans ? 'Another training plan' : undefined,
              isAlreadyAssigned: hasThisPlan
            } as AthleteWithAssignment;
          } catch (error) {
            console.error(`Error checking conflicts for athlete ${athlete.id}:`, error);
            return {
              id: athlete.id,
              first_name: athlete.first_name,
              last_name: athlete.last_name,
              email: athlete.email || '',
              avatar_url: athlete.avatar_url,
              hasConflict: false,
              isAlreadyAssigned: false
            } as AthleteWithAssignment;
          }
        })
      );

      setAthletesWithAssignments(athletesWithData);
    } catch (error) {
      console.error('Error checking assignment conflicts:', error);
      toast({
        title: 'Error checking assignments',
        description: 'Unable to check for existing assignments. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setCheckingConflicts(false);
    }
  };

  // Load assignment data when modal opens
  useEffect(() => {
    if (isOpen && coachAthletes?.length) {
      checkAssignmentConflicts();
    }
  }, [isOpen, coachAthletes?.length, monthlyPlan.id]);

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
        description: 'Please select at least one athlete to assign the plan to.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    try {
      setLoading(true);

      // Filter out athletes that are already assigned (in case the UI missed some)
      const athletesToAssign = selectedAthletes.filter(athleteId => {
        const athlete = athletesWithAssignments.find(a => a.id === athleteId);
        return athlete && !athlete.isAlreadyAssigned;
      });

      if (athletesToAssign.length === 0) {
        toast({
          title: 'No new assignments needed',
          description: 'All selected athletes already have this plan assigned.',
          status: 'info',
          duration: 3000,
          isClosable: true
        });
        return;
      }

      // Assign plan to selected athletes
      await api.monthlyPlanAssignments.assign(
        monthlyPlan.id,
        athletesToAssign,
        monthlyPlan.start_date
      );

      const skippedCount = selectedAthletes.length - athletesToAssign.length;
      const successMessage = skippedCount > 0 
        ? `Plan assigned to ${athletesToAssign.length} athlete${athletesToAssign.length > 1 ? 's' : ''}. ${skippedCount} athlete${skippedCount > 1 ? 's were' : ' was'} already assigned.`
        : `Plan assigned to ${athletesToAssign.length} athlete${athletesToAssign.length > 1 ? 's' : ''}.`;

      toast({
        title: 'Assignment successful!',
        description: `"${monthlyPlan.name}" has been assigned. ${successMessage}`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error assigning plan:', error);
      
      let errorMessage = 'Please try again later.';
      if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          errorMessage = 'Some athletes already have this plan assigned. The assignment has been updated.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error assigning plan',
        description: errorMessage,
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

  // Count statistics
  const availableAthletes = filteredAthletes.filter(a => !a.isAlreadyAssigned && !a.hasConflict);
  const conflictAthletes = filteredAthletes.filter(a => a.hasConflict);
  const alreadyAssignedAthletes = filteredAthletes.filter(a => a.isAlreadyAssigned);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={FaUsers} color="teal.500" boxSize={6} />
            <VStack align="start" spacing={0}>
              <Text color={titleColor}>Assign Training Plan</Text>
              <Text fontSize="sm" color={infoColor} fontWeight="normal">
                {monthlyPlan.name} • Starting {formatLocalDate(monthlyPlan.start_date)}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={loading} />

        <ModalBody>
          <VStack spacing={5} align="stretch">
            {/* Plan Info */}
            <Card bg={planInfoBg} borderColor={borderColor}>
              <CardBody p={4}>
                <HStack spacing={3}>
                  <Icon as={FaCalendarAlt} color="teal.500" boxSize={5} />
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="semibold" color={titleColor}>
                      {monthlyPlan.name}
                    </Text>
                    <Text fontSize="sm" color={infoColor}>
                      {monthlyPlan.weeks.length} weeks • {formatLocalDate(monthlyPlan.start_date)} - {formatLocalDate(monthlyPlan.end_date)}
                    </Text>
                    {monthlyPlan.description && (
                      <Text fontSize="sm" color={infoColor}>
                        {monthlyPlan.description}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </CardBody>
            </Card>



            {/* Search */}
            <Box>
              <InputGroup>
                <InputLeftElement>
                  <Icon as={FaSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search athletes by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading || checkingConflicts}
                />
              </InputGroup>
            </Box>

            {/* Loading state */}
            {(athletesLoading || checkingConflicts) && (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" color="teal.500" />
                <Text mt={4} color={infoColor}>
                  {athletesLoading ? 'Loading athletes...' : 'Checking for conflicts...'}
                </Text>
              </Box>
            )}

            {/* Athletes list */}
            {!athletesLoading && !checkingConflicts && (
              <>
                {/* Statistics */}
                <SimpleGrid columns={3} spacing={4}>
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody p={3} textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="green.500">
                        {availableAthletes.length}
                      </Text>
                      <Text fontSize="xs" color={infoColor}>Available</Text>
                    </CardBody>
                  </Card>
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody p={3} textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                        {conflictAthletes.length}
                      </Text>
                      <Text fontSize="xs" color={infoColor}>Conflicts</Text>
                    </CardBody>
                  </Card>
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody p={3} textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                        {alreadyAssignedAthletes.length}
                      </Text>
                      <Text fontSize="xs" color={infoColor}>Assigned</Text>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Athletes selection */}
                {filteredAthletes.length === 0 ? (
                  <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
                    <CardBody p={8} textAlign="center">
                      <Text color={infoColor}>
                        {searchQuery ? 'No athletes found matching your search.' : 'No athletes available.'}
                      </Text>
                    </CardBody>
                  </Card>
                ) : (
                  <VStack spacing={3} align="stretch" maxH="300px" overflowY="auto">
                    {filteredAthletes.map((athlete) => {
                      const isSelected = selectedAthletes.includes(athlete.id);
                      const isDisabled = athlete.isAlreadyAssigned || athlete.hasConflict;
                      
                      return (
                        <Card
                          key={athlete.id}
                          borderColor={isSelected ? 'teal.300' : borderColor}
                          borderWidth="2px"
                          bg={isSelected ? selectedCardBg : cardBg}
                          opacity={isDisabled ? 0.6 : 1}
                          cursor={isDisabled ? 'not-allowed' : 'pointer'}
                          onClick={() => !isDisabled && handleAthleteToggle(athlete.id)}
                          _hover={!isDisabled ? { borderColor: 'teal.300' } : {}}
                        >
                          <CardBody p={4}>
                            <Flex align="center" justify="space-between">
                              <HStack spacing={3} flex="1">
                                <Checkbox
                                  isChecked={isSelected}
                                  isDisabled={isDisabled}
                                  onChange={() => !isDisabled && handleAthleteToggle(athlete.id)}
                                  colorScheme="teal"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Avatar
                                  size="sm"
                                  name={`${athlete.first_name} ${athlete.last_name}`}
                                  src={athlete.avatar_url}
                                />
                                <VStack align="start" spacing={0} flex="1">
                                  <Text fontWeight="medium" color={titleColor}>
                                    {athlete.first_name} {athlete.last_name}
                                  </Text>
                                  <Text fontSize="sm" color={infoColor}>
                                    {athlete.email}
                                  </Text>
                                </VStack>
                              </HStack>
                              
                              <HStack spacing={2}>
                                {athlete.isAlreadyAssigned && (
                                  <Tooltip label="Already assigned to this plan">
                                    <Badge colorScheme="blue" fontSize="xs">
                                      <Icon as={FaCheck} mr={1} />
                                      Assigned
                                    </Badge>
                                  </Tooltip>
                                )}
                                {athlete.hasConflict && (
                                  <Tooltip label={`Has conflicting plan: ${athlete.conflictPlan}`}>
                                    <Badge colorScheme="orange" fontSize="xs">
                                      <Icon as={FaExclamationTriangle} mr={1} />
                                      Conflict
                                    </Badge>
                                  </Tooltip>
                                )}
                              </HStack>
                            </Flex>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </VStack>
                )}
              </>
            )}

            {/* Selection summary */}
            {selectedAthletes.length > 0 && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  {selectedAthletes.length} athlete{selectedAthletes.length > 1 ? 's' : ''} selected for assignment
                </Text>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              <Icon as={FaTimes} mr={2} />
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleAssign}
              isLoading={loading}
              loadingText="Assigning..."
              disabled={loading || selectedAthletes.length === 0}
            >
              <Icon as={FaCheck} mr={2} />
              Assign to {selectedAthletes.length} Athlete{selectedAthletes.length !== 1 ? 's' : ''}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 