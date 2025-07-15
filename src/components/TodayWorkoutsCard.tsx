import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Stack,
  Icon,
  Badge,
  Button,
  SimpleGrid,
  Skeleton,
  useColorModeValue,
  Heading,
  Divider,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Flex,
  Tag,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody
} from '@chakra-ui/react';
import { FaRunning, FaCalendarAlt, FaArrowRight, FaClock, FaFire, FaBed, FaDumbbell } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { UnifiedAssignmentCard } from './UnifiedAssignmentCard';
import { UnifiedWorkoutExecution } from './UnifiedWorkoutExecution';
import { useAuth } from '../contexts/AuthContext';
import { useUnifiedAssignments } from '../hooks/useUnifiedAssignments';
import { getTodayLocalDate, getYesterdayLocalDate } from '../utils/dateUtils';

interface TodayWorkoutsCardProps {
  profile: any;
  profileLoading: boolean;
}

const TodayWorkoutsCard: React.FC<TodayWorkoutsCardProps> = ({
  profile,
  profileLoading
}) => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Unified assignment system hooks - optimized to prevent duplicate API calls
  const { 
    data: assignments, 
    isLoading: assignmentsLoading, 
    error: assignmentsError 
  } = useUnifiedAssignments(user?.id);
  
  // State for workout execution
  const [executingAssignmentId, setExecutingAssignmentId] = useState<string | null>(null);
  
  // Video modal state
  const [videoModal, setVideoModal] = useState({ isOpen: false, videoUrl: '', exerciseName: '' });

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const cardShadow = useColorModeValue('none', 'lg');
  const emptyStateBg = useColorModeValue('gray.50', 'gray.700');
  const todayBg = useColorModeValue('teal.50', 'teal.900');
  const todayBorder = useColorModeValue('teal.200', 'teal.700');

  // Get today's date string once and reuse for filtering - using timezone-safe method
  const todayStr = getTodayLocalDate();
  const yesterdayStr = getYesterdayLocalDate();
  
  // Derive today's workout from assignments using flexible logic like MobileTodayCard
  // Priority order: 1) Today's date, 2) In progress, 3) Recent assignments
  const todaysWorkout = assignments?.find(assignment => {
    if (assignment.status === 'completed') return false;
    if (!assignment.start_date) return false;
    
    // Handle both date formats: YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS
    const assignmentDate = assignment.start_date.split('T')[0];
    
    // First priority: exact date match
    if (assignmentDate === todayStr || assignmentDate === yesterdayStr) {
      return true;
    }
    
    // Second priority: in-progress workouts (can be continued any day)
    if (assignment.status === 'in_progress') {
      return true;
    }
    
    // Third priority: recent assignments (within 3 days) that aren't completed
    const assignmentDateObj = new Date(assignmentDate);
    const todayDateObj = new Date(todayStr);
    const daysDiff = Math.abs((todayDateObj.getTime() - assignmentDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff <= 3 && assignment.status === 'assigned';
  }) || null;
  const todaysWorkoutLoading = assignmentsLoading; // Use same loading state
  const todaysWorkoutError = assignmentsError; // Use same error state

  // Filter assignments by date - keep strict filtering for display sections
  const todayAssignments = assignments?.filter(assignment => {
    if (!assignment.start_date) return false;
    // Handle both date formats: YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS
    const assignmentDate = assignment.start_date.split('T')[0];
    return assignmentDate === todayStr;
  }) || [];
  
  // For upcoming assignments, also include recent assignments if they're selected as today's workout
  const upcomingAssignments = assignments?.filter(assignment => {
    if (!assignment.start_date) return false;
    // Handle both date formats: YYYY-MM-DD and YYYY-MM-DDTHH:MM:SS
    const assignmentDate = assignment.start_date.split('T')[0];
    
    // Include if not today's date
    if (assignmentDate !== todayStr) {
      return true;
    }
    
    return false;
  }) || [];

  // If we have a selected workout that's not in today's assignments, add it to today's list
  const displayTodayAssignments = todaysWorkout && !todayAssignments.find(a => a.id === todaysWorkout.id) 
    ? [...todayAssignments, todaysWorkout] 
    : todayAssignments;



  // Calculate stats
  const totalWorkouts = displayTodayAssignments.length + upcomingAssignments.length;
  const completedToday = displayTodayAssignments.filter(a => a.status === 'completed').length;

  // Handle workout execution
  const handleExecuteWorkout = (assignmentId: string) => {
    setExecutingAssignmentId(assignmentId);
  };

  const handleCloseExecution = () => {
    setExecutingAssignmentId(null);
  };

  const handleShowVideo = (exerciseName: string, videoUrl: string) => {
    setVideoModal({
      isOpen: true,
      videoUrl,
      exerciseName
    });
  };

  // Loading state
  if (assignmentsLoading || todaysWorkoutLoading || profileLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={{ base: 4, md: 6 }}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
        mb={10}
      >
        <VStack spacing={4}>
          <Skeleton height="24px" width="200px" />
          <Skeleton height="100px" width="100%" />
          <Skeleton height="100px" width="100%" />
        </VStack>
      </Box>
    );
  }

  // Error state
  if (assignmentsError || todaysWorkoutError) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={{ base: 4, md: 6 }}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
        mb={10}
      >
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <VStack align="start" spacing={1} flex="1">
            <Text fontSize="sm" fontWeight="medium">
              Unable to load workout assignments
            </Text>
            <Text fontSize="xs" color={subtitleColor}>
              {assignmentsError?.message || todaysWorkoutError?.message || 'Please try refreshing the page'}
            </Text>
          </VStack>
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
      border="1px solid"
      borderColor={borderColor}
      boxShadow={cardShadow}
      mb={10}
      w="100%"
      maxW="100%"
      overflowX="hidden"
    >
      <VStack spacing={6} align="stretch">
        {/* Today's Workout from Monthly Plan */}
        {todaysWorkout && (
          <Box>
            <Box 
              bg={todayBg} 
              p={4} 
              borderRadius="lg" 
              border="1px solid" 
              borderColor={todayBorder}
            >
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Icon as={FaFire} color="teal.500" boxSize={5} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        Today's Training Plan
                      </Text>
                      <Text fontSize="sm" color={subtitleColor}>
                        From your monthly plan
                      </Text>
                    </VStack>
                  </HStack>
                  <Badge 
                    colorScheme={todaysWorkout.status === 'completed' ? 'green' : 'orange'} 
                    variant="solid"
                  >
                    {todaysWorkout.status === 'completed' ? 'Completed' : 
                     todaysWorkout.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                  </Badge>
                </Flex>
                
                <UnifiedAssignmentCard
                  assignment={todaysWorkout}
                  onExecute={handleExecuteWorkout}
                  showActions={true}
                  compact={false}
                />
              </VStack>
            </Box>
            
            {todayAssignments.length > 0 && <Divider />}
          </Box>
        )}

        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaRunning} boxSize={6} color="green.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {todaysWorkout ? "Additional Assignments" : "Today's Assignments"}
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                {totalWorkouts > 0 
                  ? `${completedToday} of ${totalWorkouts} completed`
                  : 'No assignments scheduled'
                }
              </Text>
            </VStack>
          </HStack>
          <VStack spacing={1} align="end">
            <Badge 
              colorScheme="green" 
              variant="solid" 
              fontSize="xs"
              px={2}
              py={1}
            >
              {totalWorkouts} Total
            </Badge>
            {totalWorkouts > 0 && (
              <Badge 
                colorScheme={completedToday === totalWorkouts ? "green" : "orange"} 
                variant="outline" 
                fontSize="xs"
                px={2}
                py={1}
              >
                {completedToday}/{totalWorkouts} Done
              </Badge>
            )}
          </VStack>
        </HStack>

        {/* Today's Assignments */}
        {displayTodayAssignments.length > 0 ? (
          <Box 
            overflowX={{ base: "hidden", md: "auto" }} 
            pb={4}
          >
            <Stack 
              direction={{ base: "column", md: "row" }}
              spacing={{ base: 4, md: 4 }} 
              align="start" 
              minW={{ base: "100%", md: "fit-content" }}
            >
              {displayTodayAssignments.map((assignment) => (
                <Box 
                  key={assignment.id}
                  w={{ base: "100%", md: "auto" }}
                  minW={{ base: "100%", md: "340px" }}
                >
                  <UnifiedAssignmentCard
                    assignment={assignment}
                    onExecute={handleExecuteWorkout}
                    showActions={true}
                    compact={false}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        ) : (
          <Box
            bg={emptyStateBg}
            p={6}
            borderRadius="lg"
            textAlign="center"
          >
            <VStack spacing={3}>
              <Icon as={FaCalendarAlt} boxSize={8} color={subtitleColor} />
              <Text fontSize="lg" fontWeight="medium" color={textColor}>
                No assignments scheduled for today
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                {upcomingAssignments.length > 0 
                  ? 'Check your upcoming assignments below'
                  : 'New assignments will appear here when available'
                }
              </Text>
            </VStack>
          </Box>
        )}

        {/* Upcoming Assignments */}
        {upcomingAssignments.length > 0 && (
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <HStack spacing={2}>
                <Icon as={FaCalendarAlt} color="blue.500" fontSize="lg" />
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  Upcoming Assignments
                </Text>
              </HStack>
              <Badge 
                colorScheme="blue" 
                variant="outline" 
                fontSize="xs"
                px={2}
                py={1}
              >
                {upcomingAssignments.length} upcoming
              </Badge>
            </HStack>
            
            <Box 
              overflowX={{ base: "hidden", md: "auto" }} 
              pb={4}
            >
              <Stack 
                direction={{ base: "column", md: "row" }}
                spacing={{ base: 4, md: 4 }} 
                align="start" 
                minW={{ base: "100%", md: "fit-content" }}
              >
                {upcomingAssignments.slice(0, 6).map((assignment) => (
                  <Box 
                    key={assignment.id}
                    w={{ base: "100%", md: "auto" }}
                    minW={{ base: "100%", md: "340px" }}
                  >
                    <UnifiedAssignmentCard
                      assignment={assignment}
                      onExecute={handleExecuteWorkout}
                      showActions={true}
                      compact={true}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        )}

        {/* Action Button */}
        {totalWorkouts === 0 && (
          <Button
            as={RouterLink}
            to="/athlete/workouts"
            colorScheme="green"
            size="lg"
            leftIcon={<Icon as={FaRunning} />}
            rightIcon={<Icon as={FaArrowRight} />}
          >
            View All Assignments
          </Button>
        )}
      </VStack>

      {/* Unified Workout Execution Modal */}
      {executingAssignmentId && (
        <UnifiedWorkoutExecution
          assignment={
            (todaysWorkout?.id === executingAssignmentId ? todaysWorkout : 
             [...todayAssignments, ...upcomingAssignments].find(a => a.id === executingAssignmentId)) || 
            todaysWorkout!
          }
          isOpen={!!executingAssignmentId}
          onExit={handleCloseExecution}
          onComplete={handleCloseExecution}
        />
      )}



      {/* Video Modal */}
      <Modal 
        isOpen={videoModal.isOpen} 
        onClose={() => setVideoModal({ ...videoModal, isOpen: false })} 
        size="xl"
        isCentered
        closeOnOverlayClick={true}
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg="white" color="black">
          <ModalHeader>How to: {videoModal.exerciseName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box position="relative" paddingTop="56.25%">
              <iframe
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                src={videoModal.videoUrl}
                title="Exercise Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TodayWorkoutsCard; 