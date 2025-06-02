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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stack,
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaClock,
  FaCheck,
  FaEye,
  FaRunning,
  FaPlay,
  FaChartLine,
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
  
  // State
  const [assignments, setAssignments] = useState<AssignmentWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithPlan | null>(null);

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

  // Handle view plan details
  const handleViewPlan = (assignment: AssignmentWithPlan) => {
    setSelectedAssignment(assignment);
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

      {/* Plan Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text>{selectedAssignment?.monthly_plans.name}</Text>
              <Text fontSize="sm" fontWeight="normal" color={textSecondary}>
                {selectedAssignment && getMonthName(selectedAssignment.monthly_plans.month)} {selectedAssignment?.monthly_plans.year}
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedAssignment && (
              <VStack spacing={4} align="stretch">
                {/* Status */}
                <HStack justify="space-between" align="center">
                  <Text fontWeight="medium">Status:</Text>
                  <Badge 
                    colorScheme={getStatusColor(selectedAssignment.status)} 
                    px={3} 
                    py={1}
                    borderRadius="full"
                  >
                    <Icon as={getStatusIcon(selectedAssignment.status)} mr={1} />
                    {selectedAssignment.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </HStack>

                {/* Description */}
                {selectedAssignment.monthly_plans.description && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>Description:</Text>
                    <Text color={textSecondary}>
                      {selectedAssignment.monthly_plans.description}
                    </Text>
                  </Box>
                )}

                {/* Weekly Breakdown */}
                <Box>
                  <Text fontWeight="medium" mb={3}>Weekly Plan:</Text>
                  <VStack spacing={2} align="stretch">
                    {selectedAssignment.monthly_plans.weeks.map((week, index) => (
                      <Card key={index} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                        <CardBody p={3}>
                          <HStack justify="space-between" align="center">
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">
                                Week {week.week_number}
                              </Text>
                              <Text fontSize="xs" color={textSecondary}>
                                {week.start_date} - {week.end_date}
                              </Text>
                            </VStack>
                            
                            <Badge 
                              colorScheme={week.is_rest_week ? 'orange' : 'blue'} 
                              fontSize="xs"
                            >
                              {week.is_rest_week ? 'Rest Week' : 'Training Week'}
                            </Badge>
                          </HStack>
                          
                          {week.notes && (
                            <Text fontSize="xs" color={textSecondary} mt={2}>
                              {week.notes}
                            </Text>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                </Box>

                {/* Assignment Info */}
                <Divider />
                <Box>
                  <Text fontSize="sm" color={textSecondary}>
                    Assigned on {new Date(selectedAssignment.assigned_at).toLocaleDateString()}
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
} 