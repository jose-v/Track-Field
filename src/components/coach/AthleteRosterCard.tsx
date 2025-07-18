import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Avatar,
  Button,
  useColorModeValue,
  SimpleGrid,
  Flex,
  Tooltip,
  Progress,
  useToast,
  Skeleton,
  SkeletonCircle,
  Card,
  CardBody,
  CardHeader,
  Heading,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Code,
  Stack,
  AvatarGroup
} from '@chakra-ui/react';
import { FaRunning, FaExclamationTriangle, FaCheckCircle, FaUser, FaEye, FaUserPlus, FaTrash, FaUsers } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import { InviteAthletesDrawer } from '../InviteAthletesDrawer';
import { useQueryClient } from '@tanstack/react-query';

interface AthleteStatus {
  id: string;
  name: string;
  avatarUrl?: string;
  injuryRisk: 'low' | 'medium' | 'high';
  compliance: number; // percentage 0-100
  lastActivity: string;
  recentRPE?: number;
  missedWorkouts: number;
  totalWorkouts: number;
}

interface AthleteRosterCardProps {
  onAthleteClick?: (athleteId: string) => void;
}

const AthleteRosterCard: React.FC<AthleteRosterCardProps> = ({ onAthleteClick }) => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Use the existing useCoachAthletes hook for database-connected athletes
  const { data: coachAthletes = [], isLoading: athletesLoading, refetch } = useCoachAthletes();
  
  const [athletes, setAthletes] = useState<AthleteStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add athlete modal
  const { isOpen: isAddAthleteOpen, onOpen: onAddAthleteOpen, onClose: onAddAthleteClose } = useDisclosure();
  
  // Delete athlete confirmation
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [athleteToRemove, setAthleteToRemove] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Color mode values - ALL HOOKS MUST BE AT THE TOP
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');
  const athleteCardBg = useColorModeValue('gray.50', 'gray.700');
  const athleteItemHoverBg = useColorModeValue('gray.50', 'gray.700');
  const progressBg = useColorModeValue('gray.200', 'gray.600'); // Moved from conditional JSX



  useEffect(() => {
    if (user?.id && coachAthletes.length >= 0) { // Include case where array is empty but loaded
      fetchAthleteStatuses();
    }
  }, [user?.id, coachAthletes]);

  const fetchAthleteStatuses = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);

      // Use the athletes from the useCoachAthletes hook
      if (!coachAthletes || coachAthletes.length === 0) {
        setAthletes([]);
        setIsLoading(false);
        return;
      }

      const athleteIds = coachAthletes.map(athlete => athlete.id);

      // Get workout data for the past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: workoutData, error: workoutError } = await supabase
        .from('athlete_workouts')
        .select('athlete_id, assigned_at, status')
        .in('athlete_id', athleteIds)
        .gte('assigned_at', thirtyDaysAgo.toISOString())
        .order('assigned_at', { ascending: false });

      if (workoutError) throw workoutError;

      // Process athlete statuses using coachAthletes data
      const athleteStatuses: AthleteStatus[] = coachAthletes.map(athlete => {
        const athleteWorkouts = (workoutData || []).filter(w => w.athlete_id === athlete.id);
        
        // Calculate compliance (completed vs assigned workouts)
        const totalWorkouts = athleteWorkouts.length;
        const completedWorkouts = athleteWorkouts.filter(w => w.status === 'completed').length;
        const compliance = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
        const missedWorkouts = totalWorkouts - completedWorkouts;

        // Determine injury risk based on simple metrics
        let injuryRisk: 'low' | 'medium' | 'high' = 'low';
        if (missedWorkouts >= 3) {
          injuryRisk = 'high';
        } else if (missedWorkouts >= 2 || compliance < 60) {
          injuryRisk = 'medium';
        }

        // Get last activity
        const lastCompletedWorkout = athleteWorkouts
          .filter(w => w.status === 'completed')
          .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())[0];
        
        const lastActivity = lastCompletedWorkout 
          ? new Date(lastCompletedWorkout.assigned_at).toLocaleDateString()
          : 'No recent activity';

        return {
          id: athlete.id,
          name: `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim(),
          avatarUrl: athlete.avatar_url,
          injuryRisk,
          compliance,
          lastActivity,
          recentRPE: undefined, // Not available in current schema
          missedWorkouts,
          totalWorkouts
        };
      });

      // Sort by injury risk (high first) then by compliance (low first)
      athleteStatuses.sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        const riskDiff = riskOrder[b.injuryRisk] - riskOrder[a.injuryRisk];
        if (riskDiff !== 0) return riskDiff;
        return a.compliance - b.compliance;
      });

      setAthletes(athleteStatuses);

    } catch (error) {
      console.error('Error fetching athlete statuses:', error);
      toast({
        title: 'Error fetching athlete data',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high': return FaExclamationTriangle;
      case 'medium': return FaExclamationTriangle;
      case 'low': return FaCheckCircle;
      default: return FaUser;
    }
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 80) return 'green';
    if (compliance >= 60) return 'yellow';
    return 'red';
  };

  // Helper function to get Badge color based on completion rate
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'green';
    if (rate >= 60) return 'yellow';
    return 'red';
  };

  // Handle opening the delete confirmation dialog
  const handleOpenRemoveDialog = async (athlete: any) => {
    setAthleteToRemove(athlete);
    setDeleteError(null);
    setIsDeleteAlertOpen(true);
  };
  
  // Handle closing the delete confirmation dialog
  const handleCloseRemoveDialog = () => {
    setIsDeleteAlertOpen(false);
    setAthleteToRemove(null);
    setDeleteError(null);
  };
  
  // Handle removing an athlete from the team
  const handleRemoveAthlete = async () => {
    if (!athleteToRemove?.id || !user?.id) {
      setDeleteError("Missing athlete or user information");
      return;
    }
    
    try {
      setIsRemoving(true);
      setDeleteError(null);
      
      // Delete the coach-athlete relationship
      const { error } = await supabase
        .from('coach_athletes')
        .delete()
        .match({
          'athlete_id': athleteToRemove.id,
          'coach_id': user.id
        });
      
      if (error) {
        console.error('Error deleting coach-athlete relationship:', error);
        setDeleteError(`Delete failed: ${error.message}`);
        
        toast({
          title: 'Error',
          description: `Failed to remove athlete: ${error.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Force refresh all athlete-related queries
        await Promise.all([
          refetch(),
          queryClient.invalidateQueries({ queryKey: ['coach-athletes'] }),
          queryClient.invalidateQueries({ queryKey: ['coach-athletes', user.id] })
        ]);
        
        toast({
          title: 'Athlete Removed',
          description: `${athleteToRemove.name} has been removed from your team.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        handleCloseRemoveDialog();
        // Refresh athlete statuses
        fetchAthleteStatuses();
      }
    } catch (err) {
      console.error('Error removing athlete:', err);
      setDeleteError('An unexpected error occurred');
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
      >
        <HStack spacing={3} mb={4}>
          <Icon as={FaRunning} boxSize={6} color="blue.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
              Team Roster
            </Text>
            <Text fontSize="sm" color={statLabelColor}>
              Athlete status overview
            </Text>
          </VStack>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <HStack key={i} spacing={3} p={3} bg={athleteCardBg} borderRadius="md">
              <SkeletonCircle size="12" />
              <VStack align="start" spacing={1} flex={1}>
                <Skeleton height="16px" width="80%" />
                <Skeleton height="12px" width="60%" />
              </VStack>
            </HStack>
          ))}
        </SimpleGrid>
      </Box>
    );
  }

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow={cardShadow} borderRadius="xl">
      <CardHeader>
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaUsers} boxSize={6} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Heading size="md">Team Roster</Heading>
              <Text fontSize="sm" color={subtitleColor}>
                {coachAthletes.length} athletes • Performance monitoring
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              leftIcon={<Icon as={FaEye} />}
              as={RouterLink}
              to="/coach/athletes"
            >
              View All
            </Button>
            <IconButton
              icon={<FaUserPlus />}
              aria-label="Add athlete"
              onClick={onAddAthleteOpen}
              colorScheme="green"
              size="sm"
            />
          </HStack>
        </Flex>
      </CardHeader>

      <CardBody pt={0}>
        {athletesLoading || isLoading ? (
          <VStack spacing={3}>
            {[1, 2, 3].map(i => (
              <HStack key={i} spacing={3} w="100%" p={3} bg={athleteCardBg} borderRadius="md">
                <SkeletonCircle size="12" />
                <VStack align="start" spacing={1} flex={1}>
                  <Skeleton height="16px" width="80%" />
                  <Skeleton height="12px" width="60%" />
                </VStack>
              </HStack>
            ))}
          </VStack>
        ) : coachAthletes.length === 0 ? (
          <VStack spacing={4} py={8} textAlign="center">
            <Icon as={FaUsers} boxSize={12} color="gray.400" />
            <Text color={subtitleColor}>No athletes in your team yet</Text>
            <Button
              leftIcon={<FaUserPlus />}
              colorScheme="blue"
              onClick={onAddAthleteOpen}
            >
              Add Your First Athlete
            </Button>
          </VStack>
        ) : (
          <VStack spacing={3} maxH="500px" overflowY="auto">
            {/* Team Summary */}
            <Box w="100%" p={3} bg={athleteCardBg} borderRadius="md">
              <HStack spacing={4} justify="space-between">
                <HStack spacing={3}>
                  <AvatarGroup size="sm" max={5}>
                    {coachAthletes.slice(0, 5).map(athlete => (
                      <Avatar
                        key={athlete.id}
                        name={`${athlete.first_name} ${athlete.last_name}`}
                        src={athlete.avatar_url}
                      />
                    ))}
                  </AvatarGroup>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>
                      {coachAthletes.length} Team Members
                    </Text>
                    <Text fontSize="xs" color={subtitleColor}>
                      {athletes.filter(a => a.injuryRisk === 'high').length} high risk • {' '}
                      {athletes.filter(a => a.compliance >= 80).length} high compliance
                    </Text>
                  </VStack>
                </HStack>
                {athletes.length > 0 && (
                  <VStack align="end" spacing={0}>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>
                      {Math.round(athletes.reduce((sum, a) => sum + a.compliance, 0) / athletes.length)}%
                    </Text>
                    <Text fontSize="xs" color={subtitleColor}>Avg Compliance</Text>
                  </VStack>
                )}
              </HStack>
            </Box>

            {/* Individual Athletes */}
            {athletes.map(athlete => (
              <Box
                key={athlete.id}
                w="100%"
                p={3}
                bg={athleteCardBg}
                borderRadius="md"
                border="1px solid"
                borderColor={`${getRiskColor(athlete.injuryRisk)}.200`}
                _hover={{ bg: athleteItemHoverBg, transform: 'translateY(-1px)' }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => onAthleteClick?.(athlete.id)}
              >
                <HStack spacing={3} justify="space-between">
                  <HStack spacing={3} flex={1}>
                    <Avatar
                      size="md"
                      name={athlete.name}
                      src={athlete.avatarUrl}
                      bg={`${getRiskColor(athlete.injuryRisk)}.100`}
                    />
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack spacing={2} w="100%">
                        <Text fontSize="sm" fontWeight="bold" color={textColor} flex={1}>
                          {athlete.name}
                        </Text>
                        <Tooltip label={`${athlete.injuryRisk.charAt(0).toUpperCase() + athlete.injuryRisk.slice(1)} risk`}>
                          <Box as="span" display="inline-flex" alignItems="center">
                            {athlete.injuryRisk === 'high' ? (
                              <FaExclamationTriangle 
                                color={`var(--chakra-colors-${getRiskColor(athlete.injuryRisk)}-500)`}
                                size="16px"
                              />
                            ) : athlete.injuryRisk === 'medium' ? (
                              <FaExclamationTriangle 
                                color={`var(--chakra-colors-${getRiskColor(athlete.injuryRisk)}-500)`}
                                size="16px"
                              />
                            ) : (
                              <FaCheckCircle 
                                color={`var(--chakra-colors-${getRiskColor(athlete.injuryRisk)}-500)`}
                                size="16px"
                              />
                            )}
                          </Box>
                        </Tooltip>
                      </HStack>
                      
                      <HStack spacing={3} w="100%">
                        <Badge
                          colorScheme={getComplianceColor(athlete.compliance)}
                          variant="subtle"
                          fontSize="xs"
                        >
                          {athlete.compliance}% compliance
                        </Badge>
                      </HStack>

                      <Progress
                        value={athlete.compliance}
                        size="xs"
                        colorScheme={getComplianceColor(athlete.compliance)}
                        w="100%"
                        bg={progressBg}
                      />

                      <HStack spacing={4} w="100%">
                        <Text fontSize="xs" color={subtitleColor}>
                          Last: {athlete.lastActivity}
                        </Text>
                        {athlete.missedWorkouts > 0 && (
                          <Text fontSize="xs" color="red.500">
                            {athlete.missedWorkouts} missed
                          </Text>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>
                  
                  <IconButton
                    icon={<FaTrash />}
                    aria-label="Remove athlete"
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenRemoveDialog(athlete);
                    }}
                  />
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </CardBody>

      {/* Invite Athletes Drawer */}
      <InviteAthletesDrawer 
        isOpen={isAddAthleteOpen} 
        onClose={onAddAthleteClose}
        onAthleteInvited={() => {
          // Refresh data after athlete invitation
          refetch();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={handleCloseRemoveDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Athlete
            </AlertDialogHeader>

            <AlertDialogBody>
              {deleteError && (
                <Text color="red.500" fontSize="sm" mb={3}>
                  {deleteError}
                </Text>
              )}
              Are you sure you want to remove <strong>{athleteToRemove?.name}</strong> from your team?
              This will remove them from your coaching roster but won't delete their account.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleCloseRemoveDialog}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleRemoveAthlete}
                ml={3}
                isLoading={isRemoving}
                loadingText="Removing..."
              >
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Card>
  );
};

export default AthleteRosterCard; 