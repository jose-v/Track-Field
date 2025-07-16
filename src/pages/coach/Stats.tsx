import { Box, Heading, Text, Flex, Avatar, Badge, SimpleGrid, VStack, Divider, useColorModeValue } from '@chakra-ui/react';

// Mock data for demonstration
const athlete = {
  name: 'Jane Doe',
  profilePic: 'https://randomuser.me/api/portraits/women/44.jpg',
  status: 'Active',
  last7Days: {
    workoutCompletion: 86,
    avgSleep: 7.2,
    wellnessScore: 8.4,
  },
};

function AthleteOverviewCard() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  return (
    <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="md" bg={cardBg} borderColor={border}>
      <Flex align="center" mb={4}>
        <Avatar size="lg" src={athlete.profilePic} name={athlete.name} mr={4} />
        <Box>
          <Heading size="md">{athlete.name}</Heading>
          <Badge colorScheme={athlete.status === 'Active' ? 'green' : 'yellow'} mt={1}>
            {athlete.status === 'Active' ? '✅ Active' : '⚠️ Needs attention'}
          </Badge>
        </Box>
      </Flex>
      <Divider my={3} />
      <SimpleGrid columns={3} spacing={4}>
        <VStack>
          <Text fontSize="sm" color="gray.500">Workout Completion</Text>
          <Text fontWeight="bold">{athlete.last7Days.workoutCompletion}%</Text>
        </VStack>
        <VStack>
          <Text fontSize="sm" color="gray.500">Avg Sleep</Text>
          <Text fontWeight="bold">{athlete.last7Days.avgSleep} hrs</Text>
        </VStack>
        <VStack>
          <Text fontSize="sm" color="gray.500">Wellness Score</Text>
          <Text fontWeight="bold">{athlete.last7Days.wellnessScore}</Text>
        </VStack>
      </SimpleGrid>
    </Box>
  );
}

// Placeholder components for other sections
function WorkoutCompletionPanel() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  return <Box p={6} borderWidth={1} borderRadius="lg" bg={cardBg} borderColor={border}>Workout Completion Panel (chart here)</Box>;
}
function SleepTracker() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  return <Box p={6} borderWidth={1} borderRadius="lg" bg={cardBg} borderColor={border}>Sleep Tracker (line graph here)</Box>;
}
function WellnessCheckins() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  return <Box p={6} borderWidth={1} borderRadius="lg" bg={cardBg} borderColor={border}>Wellness Check-ins (radar chart here)</Box>;
}
function TrendInsights() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  return <Box p={6} borderWidth={1} borderRadius="lg" bg={cardBg} borderColor={border}>Trend Insights / Flags</Box>;
}
function CoachActionPanel() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  return <Box p={6} borderWidth={1} borderRadius="lg" bg={cardBg} borderColor={border}>Coach Action Panel</Box>;
}

export function CoachStats() {
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  return (
    <Box py={8} px={{ base: 2, md: 8 }} bg={pageBg} minH="100vh">
      <Heading mb={6}>Athlete-Centered Dashboard</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <VStack spacing={6} align="stretch">
          <AthleteOverviewCard />
          <WorkoutCompletionPanel />
          <SleepTracker />
        </VStack>
        <VStack spacing={6} align="stretch">
          <WellnessCheckins />
          <TrendInsights />
          <CoachActionPanel />
        </VStack>
      </SimpleGrid>
    </Box>
  );
} 