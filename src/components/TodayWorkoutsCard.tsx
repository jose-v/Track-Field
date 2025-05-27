import React from 'react';
import {
  Box, Card, CardBody, Flex, Tag, Icon, Heading, Text, VStack, Button, SimpleGrid, Skeleton, useColorModeValue
} from '@chakra-ui/react';
import { FaRunning } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { WorkoutCard } from './WorkoutCard';

interface TodayWorkoutsCardProps {
  todayWorkouts: any[];
  upcomingWorkouts: any[];
  profile: any;
  getWorkoutProgressData: (workout: any) => any;
  handleStartWorkout: (workout: any) => void;
  workoutsLoading: boolean;
  profileLoading: boolean;
}

const TodayWorkoutsCard: React.FC<TodayWorkoutsCardProps> = ({
  todayWorkouts,
  upcomingWorkouts,
  profile,
  getWorkoutProgressData,
  handleStartWorkout,
  workoutsLoading,
  profileLoading
}) => {
  const headerGradient = useColorModeValue(
    'linear-gradient(90deg, #38A169 0%, #48BB78 100%)',
    'linear-gradient(90deg, #22543D 0%, #276749 100%)'
  );
  const cardBg = useColorModeValue('white', 'gray.900');
  const tagBg = useColorModeValue('whiteAlpha.300', 'whiteAlpha.300');
  const tagColor = useColorModeValue('white', 'white');

  if (profileLoading || workoutsLoading) {
    return <Skeleton height="200px" mb={10} borderRadius="lg" />;
  }

  return (
    <Card borderRadius="lg" boxShadow="md" mb={10} bg={cardBg}>
      {/* Header */}
      <Box
        h="80px"
        bg={headerGradient}
        position="relative"
        display="flex"
        alignItems="center"
        px={6}
        width="100%"
        borderTopLeftRadius="inherit"
        borderTopRightRadius="inherit"
      >
        <Flex
          bg={useColorModeValue('white', 'gray.800')}
          borderRadius="full"
          w="50px"
          h="50px"
          justifyContent="center"
          alignItems="center"
          boxShadow="none"
          mr={4}
        >
          <Icon as={FaRunning} w={6} h={6} color="green.500" />
        </Flex>
        <Tag
          size="lg"
          variant="subtle"
          bg={tagBg}
          color={tagColor}
          fontWeight="bold"
          px={4}
          py={2}
          borderRadius="md"
        >
          TODAY'S WORKOUTS
        </Tag>
      </Box>
      <CardBody>
        {todayWorkouts.length > 0 ? (
          <Box>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mb={6}>
              {todayWorkouts.map((workout, idx) => (
                <WorkoutCard
                  key={workout.id || idx}
                  workout={workout}
                  isCoach={profile?.role === 'coach'}
                  progress={getWorkoutProgressData(workout)}
                  onStart={() => handleStartWorkout(workout)}
                />
              ))}
            </SimpleGrid>
            {upcomingWorkouts.length > 0 && (
              <>
                <Heading size="md" mb={4}>Upcoming Workouts</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {upcomingWorkouts.map((workout, idx) => (
                    <WorkoutCard
                      key={workout.id || idx}
                      workout={workout}
                      isCoach={profile?.role === 'coach'}
                      progress={getWorkoutProgressData(workout)}
                      onStart={() => handleStartWorkout(workout)}
                    />
                  ))}
                </SimpleGrid>
              </>
            )}
          </Box>
        ) : (
          <VStack spacing={4} py={6} align="center">
            <Text>No workouts scheduled for today.</Text>
            {upcomingWorkouts.length > 0 ? (
              <>
                <Heading size="md" mt={2} mb={4}>Upcoming Workouts</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} width="100%">
                  {upcomingWorkouts.map((workout, idx) => (
                    <WorkoutCard
                      key={workout.id || idx}
                      workout={workout}
                      isCoach={profile?.role === 'coach'}
                      progress={getWorkoutProgressData(workout)}
                      onStart={() => handleStartWorkout(workout)}
                    />
                  ))}
                </SimpleGrid>
              </>
            ) : (
              <Button
                as={RouterLink}
                to={profile?.role === 'coach' ? "/coach/workouts" : "/athlete/workouts"}
                variant="solid"
                colorScheme="blue"
              >
                {profile?.role === 'coach' ? "Create Workouts" : "View Available Workouts"}
              </Button>
            )}
          </VStack>
        )}
      </CardBody>
    </Card>
  );
};

export default TodayWorkoutsCard; 