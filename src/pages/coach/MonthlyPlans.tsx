import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Text, SimpleGrid, Button, HStack, VStack, useDisclosure,
  useToast, Skeleton, Card, CardBody, useColorModeValue, Flex, 
  IconButton, Badge, Alert, AlertIcon, Spinner
} from '@chakra-ui/react';
import { FaCalendarAlt, FaPlus, FaRedo, FaUsers, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { MonthlyPlanCard } from '../../components/MonthlyPlanCard';
import { MonthlyPlanCreator } from '../../components/MonthlyPlanCreator';
import { PlanAssignmentModal } from '../../components/PlanAssignmentModal';
import type { MonthlyPlan } from '../../services/dbSchema';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';

// Type for monthly plan with assignment stats
interface MonthlyPlanWithStats extends MonthlyPlan {
  assignmentStats?: {
    totalAssigned: number;
    completed: number;
    inProgress: number;
    percentage: number;
  };
}

export function CoachMonthlyPlans() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: athletes, isLoading: athletesLoading } = useCoachAthletes();
  
  // Modal state
  const { isOpen: isCreatorOpen, onOpen: onCreatorOpen, onClose: onCreatorClose } = useDisclosure();
  const { isOpen: isAssignmentOpen, onOpen: onAssignmentOpen, onClose: onAssignmentClose } = useDisclosure();
  
  // Data state
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlanWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedPlanForAssignment, setSelectedPlanForAssignment] = useState<MonthlyPlan | null>(null);

  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load monthly plans
  const loadMonthlyPlans = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const plans = await api.monthlyPlans.getByCoach(user.id);
      setMonthlyPlans(plans);
      
      // Load assignment stats for each plan
      loadAssignmentStats(plans);
    } catch (error) {
      console.error('Error loading monthly plans:', error);
      toast({
        title: 'Error loading monthly plans',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Load assignment statistics for plans
  const loadAssignmentStats = async (plans: MonthlyPlan[]) => {
    if (!plans.length) return;

    try {
      setStatsLoading(true);
      
      // Load assignment stats for each plan
      const plansWithStats = await Promise.all(
        plans.map(async (plan) => {
          try {
            const assignments = await api.monthlyPlanAssignments.getByPlan(plan.id);
            
            // Calculate stats
            const totalAssigned = assignments.length;
            const completed = assignments.filter(a => a.status === 'completed').length;
            const inProgress = assignments.filter(a => a.status === 'in_progress').length;
            const percentage = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;
            
            return {
              ...plan,
              assignmentStats: {
                totalAssigned,
                completed,
                inProgress,
                percentage
              }
            };
          } catch (error) {
            console.error(`Error loading stats for plan ${plan.id}:`, error);
            return plan;
          }
        })
      );
      
      setMonthlyPlans(plansWithStats);
    } catch (error) {
      console.error('Error loading assignment stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadMonthlyPlans();
  }, [user?.id]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMonthlyPlans();
    setRefreshing(false);
    
    toast({
      title: 'Monthly plans refreshed',
      status: 'success',
      duration: 2000,
      isClosable: true
    });
  };

  // Handle plan creation success
  const handleCreationSuccess = () => {
    loadMonthlyPlans();
  };

  // Handle plan editing (placeholder for future)
  const handleEditPlan = (plan: MonthlyPlan) => {
    toast({
      title: 'Edit functionality',
      description: 'Plan editing will be available soon!',
      status: 'info',
      duration: 3000,
      isClosable: true
    });
  };

  // Handle plan deletion
  const handleDeletePlan = async (plan: MonthlyPlan) => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.monthlyPlans.delete(plan.id);
      
      toast({
        title: 'Monthly plan deleted',
        description: `"${plan.name}" has been deleted successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      
      loadMonthlyPlans();
    } catch (error) {
      console.error('Error deleting monthly plan:', error);
      toast({
        title: 'Error deleting monthly plan',
        description: error instanceof Error ? error.message : 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  // Handle plan assignment (placeholder for future)
  const handleAssignPlan = (plan: MonthlyPlan) => {
    setSelectedPlanForAssignment(plan);
    onAssignmentOpen();
  };

  // Handle assignment modal success
  const handleAssignmentSuccess = () => {
    loadMonthlyPlans(); // Refresh data to update assignment stats
    setSelectedPlanForAssignment(null);
  };

  // Handle assignment modal close
  const handleAssignmentClose = () => {
    setSelectedPlanForAssignment(null);
    onAssignmentClose();
  };

  // Handle view plan details
  const handleViewPlan = (plan: MonthlyPlan) => {
    toast({
      title: 'Plan details',
      description: 'Detailed plan view will be available soon!',
      status: 'info',
      duration: 3000,
      isClosable: true
    });
  };

  // Skeleton loading cards
  const renderSkeletonCards = () => (
    <>
      {[...Array(6)].map((_, index) => (
        <Card 
          key={index}
          borderRadius="xl" 
          overflow="hidden" 
          borderWidth="1px" 
          borderColor={borderColor}
          bg={cardBg}
          h="400px"
        >
          <CardBody p={5}>
            <VStack align="stretch" spacing={4}>
              <Skeleton height="24px" width="70%" />
              <Skeleton height="16px" width="50%" />
              <Skeleton height="60px" width="100%" />
              <Skeleton height="40px" width="100%" />
              <Skeleton height="80px" width="100%" />
              <Skeleton height="32px" width="100%" />
            </VStack>
          </CardBody>
        </Card>
      ))}
    </>
  );

  if (loading && monthlyPlans.length === 0) {
    return (
      <Box minH="100vh" bg={bgColor} p={6}>
        <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={2}>
              <HStack spacing={3}>
                <FaCalendarAlt size={24} color="teal" />
                <Heading size="lg">Monthly Plans</Heading>
              </HStack>
              <Text color="gray.600">Create and manage monthly training plans for your athletes</Text>
            </VStack>
            <HStack spacing={3}>
              <Skeleton height="40px" width="120px" />
              <Skeleton height="40px" width="140px" />
            </HStack>
          </Flex>

          {/* Loading grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {renderSkeletonCards()}
          </SimpleGrid>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} p={6}>
      <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <VStack align="start" spacing={2}>
            <HStack spacing={3}>
              <FaCalendarAlt size={24} color="teal" />
              <Heading size="lg">Monthly Plans</Heading>
              {monthlyPlans.length > 0 && (
                <Badge colorScheme="teal" px={3} py={1} borderRadius="md">
                  {monthlyPlans.length} plan{monthlyPlans.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </HStack>
            <Text color="gray.600">
              Create and manage monthly training plans for your athletes
            </Text>
          </VStack>

          <HStack spacing={3}>
            <IconButton
              aria-label="Refresh plans"
              icon={refreshing ? <Spinner size="sm" /> : <FaRedo />}
              onClick={handleRefresh}
              isDisabled={refreshing}
              variant="outline"
            />
            <Button
              leftIcon={<FaPlus />}
              colorScheme="teal"
              onClick={onCreatorOpen}
              size="md"
            >
              Create Monthly Plan
            </Button>
          </HStack>
        </Flex>

        {/* Content */}
        {monthlyPlans.length === 0 ? (
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardBody p={12}>
              <VStack spacing={6}>
                <Box textAlign="center">
                  <FaCalendarAlt size={64} color="gray" opacity={0.3} />
                </Box>
                <VStack spacing={3} textAlign="center">
                  <Heading size="md" color="gray.600">
                    No monthly plans yet
                  </Heading>
                  <Text color="gray.500" maxW="400px">
                    Get started by creating your first monthly training plan. 
                    Use weekly workout templates to build comprehensive training schedules.
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="teal"
                  size="lg"
                  onClick={onCreatorOpen}
                >
                  Create Your First Monthly Plan
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Stats Summary */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody p={5}>
                <HStack spacing={8} justify="center">
                  <VStack spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="teal.500">
                      {monthlyPlans.length}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Total Plans</Text>
                  </VStack>
                  <VStack spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                      {monthlyPlans.reduce((sum, plan) => 
                        sum + (plan.assignmentStats?.totalAssigned || 0), 0
                      )}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Total Assignments</Text>
                  </VStack>
                  <VStack spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {monthlyPlans.reduce((sum, plan) => 
                        sum + (plan.assignmentStats?.completed || 0), 0
                      )}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Completed</Text>
                  </VStack>
                  <VStack spacing={1}>
                    <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                      {monthlyPlans.reduce((sum, plan) => 
                        sum + (plan.assignmentStats?.inProgress || 0), 0
                      )}
                    </Text>
                    <Text fontSize="sm" color="gray.600">In Progress</Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            {/* Plans Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {monthlyPlans.map((plan) => (
                <MonthlyPlanCard
                  key={plan.id}
                  monthlyPlan={plan}
                  isCoach={true}
                  completionStats={plan.assignmentStats}
                  statsLoading={statsLoading}
                  onEdit={() => handleEditPlan(plan)}
                  onDelete={() => handleDeletePlan(plan)}
                  onAssign={() => handleAssignPlan(plan)}
                  onView={() => handleViewPlan(plan)}
                />
              ))}
            </SimpleGrid>
          </>
        )}

        {/* Monthly Plan Creator Modal */}
        <MonthlyPlanCreator
          isOpen={isCreatorOpen}
          onClose={onCreatorClose}
          onSuccess={handleCreationSuccess}
        />

        {/* Plan Assignment Modal */}
        {selectedPlanForAssignment && (
          <PlanAssignmentModal
            isOpen={isAssignmentOpen}
            onClose={handleAssignmentClose}
            onSuccess={handleAssignmentSuccess}
            monthlyPlan={selectedPlanForAssignment}
          />
        )}
      </VStack>
    </Box>
  );
} 