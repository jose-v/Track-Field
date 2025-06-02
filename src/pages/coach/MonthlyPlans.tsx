import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Text, SimpleGrid, Button, HStack, VStack, useDisclosure,
  useToast, Skeleton, Card, CardBody, useColorModeValue, Flex, 
  IconButton, Badge, Alert, AlertIcon, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel
} from '@chakra-ui/react';
import { FaCalendarAlt, FaPlus, FaRedo, FaUsers, FaChartLine, FaLayerGroup } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { MonthlyPlanCard } from '../../components/MonthlyPlanCard';
import { MonthlyPlanCreator } from '../../components/MonthlyPlanCreator';
import { PlanAssignmentModal } from '../../components/PlanAssignmentModal';
import { PlanDetailView } from '../../components/PlanDetailView';
import { WorkoutCard } from '../../components/WorkoutCard';
import type { MonthlyPlan } from '../../services/dbSchema';
import type { Workout } from '../../services/api';
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
  
  // Data state for monthly plans
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlanWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedPlanForAssignment, setSelectedPlanForAssignment] = useState<MonthlyPlan | null>(null);
  const [selectedPlanForView, setSelectedPlanForView] = useState<MonthlyPlan | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);

  // Data state for template workouts
  const [templateWorkouts, setTemplateWorkouts] = useState<Workout[]>([]);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateRefreshing, setTemplateRefreshing] = useState(false);

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

  // Load template workouts
  const loadTemplateWorkouts = async () => {
    if (!user?.id) return;

    try {
      setTemplateLoading(true);
      const templates = await api.workouts.getTemplates(user.id);
      // Filter for templates that are specifically for monthly plans (weekly template type)
      const monthlyPlanTemplates = templates.filter(t => t.template_type === 'weekly' || t.is_template);
      setTemplateWorkouts(monthlyPlanTemplates);
    } catch (error) {
      console.error('Error loading template workouts:', error);
      toast({
        title: 'Error loading template workouts',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setTemplateLoading(false);
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
    loadTemplateWorkouts();
  }, [user?.id]);

  // Handle refresh for monthly plans
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

  // Handle refresh for template workouts
  const handleTemplateRefresh = async () => {
    setTemplateRefreshing(true);
    await loadTemplateWorkouts();
    setTemplateRefreshing(false);
    
    toast({
      title: 'Template workouts refreshed',
      status: 'success',
      duration: 2000,
      isClosable: true
    });
  };

  // Handle plan creation success
  const handleCreationSuccess = () => {
    loadMonthlyPlans();
  };

  // Handle plan assignment
  const handleAssignPlan = (plan: MonthlyPlan) => {
    setSelectedPlanForAssignment(plan);
    onAssignmentOpen();
  };

  // Handle assignment success
  const handleAssignmentSuccess = () => {
    loadMonthlyPlans(); // Reload to update stats
  };

  // Handle view plan details
  const handleViewPlan = (plan: MonthlyPlan) => {
    setSelectedPlanForView(plan);
    setShowDetailView(true);
  };

  // Handle edit plan
  const handleEditPlan = (plan: MonthlyPlan) => {
    // TODO: Implement edit functionality
    toast({
      title: 'Edit functionality',
      description: 'Plan editing will be available soon.',
      status: 'info',
      duration: 3000,
      isClosable: true
    });
  };

  // Render template workout cards
  const renderTemplateWorkouts = () => {
    if (templateLoading) {
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height="200px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      );
    }

    if (templateWorkouts.length === 0) {
      return (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">No Template Workouts</Text>
            <Text fontSize="sm">Create workouts and save them as templates to use in monthly plans.</Text>
          </VStack>
        </Alert>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {templateWorkouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            isCoach={true}
            isTemplate={true}
            progress={{ completed: 0, total: workout.exercises?.length || 0, percentage: 0 }}
            onStart={() => {
              // Navigate to workout details or edit
              window.location.href = `/coach/workouts/${workout.id}`;
            }}
          />
        ))}
      </SimpleGrid>
    );
  };

  // Show detail view if selected
  if (showDetailView && selectedPlanForView) {
    return (
      <PlanDetailView
        monthlyPlan={selectedPlanForView}
        onBack={() => {
          setShowDetailView(false);
          setSelectedPlanForView(null);
        }}
        onEdit={() => handleEditPlan(selectedPlanForView)}
        onAssign={() => handleAssignPlan(selectedPlanForView)}
        onAssignSuccess={() => {
          // Reload plan stats after successful assignment
          loadAssignmentStats([selectedPlanForView]);
        }}
      />
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 6 }}>
        {/* Header */}
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="start" spacing={1}>
              <Heading size="xl" color={useColorModeValue('gray.800', 'gray.100')}>
                Monthly Training Plans
              </Heading>
              <Text color={useColorModeValue('gray.600', 'gray.300')}>
                Create and manage monthly training plans for your athletes
              </Text>
            </VStack>
            
            <Button
              leftIcon={<FaPlus />}
              colorScheme="teal"
              onClick={onCreatorOpen}
              size="lg"
            >
              Create Plan
            </Button>
          </Flex>

          {/* Tabs */}
          <Tabs variant="enclosed" colorScheme="teal">
            <TabList>
              <Tab>
                <FaCalendarAlt style={{ marginRight: '8px' }} />
                Monthly Plans ({monthlyPlans.length})
              </Tab>
              <Tab>
                <FaLayerGroup style={{ marginRight: '8px' }} />
                Template Workouts ({templateWorkouts.length})
              </Tab>
            </TabList>

            <TabPanels>
              {/* Monthly Plans Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  {/* Stats and Actions */}
                  <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                    <HStack spacing={4}>
                      <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                        {monthlyPlans.length} Plans Created
                      </Badge>
                      {athletes && (
                        <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                          {athletes.length} Athletes
                        </Badge>
                      )}
                    </HStack>
                    
                    <Button
                      leftIcon={<FaRedo />}
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      isLoading={refreshing}
                    >
                      Refresh
                    </Button>
                  </Flex>

                  {/* Monthly Plans Grid */}
                  {loading ? (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} height="300px" borderRadius="lg" />
                      ))}
                    </SimpleGrid>
                  ) : monthlyPlans.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">No Monthly Plans Created</Text>
                        <Text fontSize="sm">Create your first monthly training plan to get started.</Text>
                      </VStack>
                    </Alert>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                      {monthlyPlans.map((plan) => (
                        <MonthlyPlanCard
                          key={plan.id}
                          monthlyPlan={plan}
                          onView={() => handleViewPlan(plan)}
                          onEdit={() => handleEditPlan(plan)}
                          onAssign={() => handleAssignPlan(plan)}
                          completionStats={plan.assignmentStats}
                          statsLoading={statsLoading}
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </VStack>
              </TabPanel>

              {/* Template Workouts Tab */}
              <TabPanel px={0}>
                <VStack spacing={6} align="stretch">
                  {/* Stats and Actions */}
                  <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="lg" fontWeight="semibold" color={useColorModeValue('gray.800', 'gray.100')}>
                        Template Workouts
                      </Text>
                      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
                        Workouts saved as templates for creating monthly plans
                      </Text>
                    </VStack>
                    
                    <Button
                      leftIcon={<FaRedo />}
                      variant="outline"
                      size="sm"
                      onClick={handleTemplateRefresh}
                      isLoading={templateRefreshing}
                    >
                      Refresh
                    </Button>
                  </Flex>

                  {/* Template Workouts Grid */}
                  {renderTemplateWorkouts()}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>

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
            onClose={onAssignmentClose}
            onSuccess={handleAssignmentSuccess}
            monthlyPlan={selectedPlanForAssignment}
          />
        )}
      </Box>
    </Box>
  );
} 