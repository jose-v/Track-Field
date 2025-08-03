import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
  SimpleGrid
} from '@chakra-ui/react';

interface RunTimesTableProps {
  analytics: any;
  dateRange: string;
}

export const RunTimesTable: React.FC<RunTimesTableProps> = ({
  analytics,
  dateRange
}) => {
  const textPrimary = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box px={{ base: 0, md: 0 }}>
        <VStack spacing={6} align="flex-end">
          <Text fontSize="sm" pr="12px" color={useColorModeValue('gray.600', 'yellow.500')} fontWeight="medium">
            Best Training Times
          </Text>
          <HStack spacing={2} divider={<Box w="1px" h="40px" bg={useColorModeValue('gray.200', 'gray.600')} />}>
            {(() => {
              // Find best times for different events
              const runsWithTime = analytics.runTimes.recentRuns.filter(run => run.has_time_data);
              const eventBestTimes = {};
              
              // Group runs by event and find best time for each
              runsWithTime.forEach(run => {
                const exerciseName = run.exercise_name.toLowerCase();
                let eventKey = null;
                
                if (exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter')) {
                  eventKey = '100m';
                } else if (exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter')) {
                  eventKey = '200m';
                } else if (exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter')) {
                  eventKey = '400m';
                } else if (exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter')) {
                  eventKey = '800m';
                } else if (exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter')) {
                  eventKey = '1500m';
                } else if (exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km')) {
                  eventKey = '5000m';
                }
                
                if (eventKey) {
                  const totalMs = ((run.time_minutes || 0) * 60 + (run.time_seconds || 0)) * 1000 + (run.time_hundredths || 0) * 10;
                  if (!eventBestTimes[eventKey] || totalMs < eventBestTimes[eventKey].totalMs) {
                    eventBestTimes[eventKey] = {
                      totalMs,
                      minutes: run.time_minutes || 0,
                      seconds: run.time_seconds || 0,
                      hundredths: run.time_hundredths || 0
                    };
                  }
                }
              });
              
              // Get top 3 events or all available events
              const availableEvents = Object.keys(eventBestTimes).slice(0, 3);
              
              if (availableEvents.length === 0) {
                return (
                  <VStack spacing={1} px={4}>
                    <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>No Events</Text>
                    <Text fontSize="sm" fontWeight="medium">N/A</Text>
                  </VStack>
                );
              }
              
              return availableEvents.map((event, index) => {
                const bestTime = eventBestTimes[event];
                const timeString = `${bestTime.minutes}:${bestTime.seconds.toString().padStart(2, '0')}.${bestTime.hundredths.toString().padStart(2, '0')}`;
                
                return (
                  <VStack key={index} spacing={1} px={4}>
                    <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>{event}</Text>
                    <Text fontSize="sm" fontWeight="medium">{timeString}</Text>
                  </VStack>
                );
              });
            })()}
          </HStack>
        </VStack>
      </Box>

      <Box>
        <Text fontWeight="bold" mb={3} px={{ base: 4, md: 0 }}>Recent Run Times</Text>
        {analytics.runTimes.recentRuns.length > 0 ? (
          <Box overflowX="auto" maxW="100vw">
            <Table size="sm" minW="500px">
              <Thead>
                <Tr>
                  <Th position="sticky" left={0} bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor}>Date</Th>
                  <Th position="sticky" left="80px" bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor}>Exercise</Th>
                  <Th>From Workout</Th>
                  <Th>Time</Th>
                  <Th>RPE</Th>
                </Tr>
              </Thead>
              <Tbody>
                {analytics.runTimes.recentRuns.slice(0, 10).map((run) => (
                  <Tr key={run.id} h="48px">
                    <Td position="sticky" left={0} bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor} fontSize="sm" fontWeight="medium" h="48px">
                      {formatDate(run.created_at)}
                    </Td>
                    <Td position="sticky" left="80px" bg={cardBg} zIndex={1} borderRight="1px solid" borderRightColor={borderColor} fontSize="sm" fontWeight="medium" h="48px">
                      {run.exercise_name}
                    </Td>
                    <Td fontSize="sm" fontWeight="medium" color="blue.500" maxW="150px" isTruncated h="48px">
                      {run.workout?.name || (run.workout_id ? `ID: ${run.workout_id.slice(0, 8)}` : 'Unknown')}
                    </Td>
                    <Td fontSize="sm" fontWeight="medium" h="48px">
                      {run.has_time_data ? (
                        <Text color="green.500" fontSize="sm" fontWeight="medium">
                          {`${run.time_minutes || 0}:${(run.time_seconds || 0).toString().padStart(2, '0')}.${(run.time_hundredths || 0).toString().padStart(2, '0')}`}
                        </Text>
                      ) : (
                        <Text color="gray.400" fontSize="sm" fontWeight="medium" fontStyle="italic">
                          Not logged
                        </Text>
                      )}
                    </Td>
                    <Td fontSize="sm" fontWeight="medium" h="48px">
                      {run.rpe_rating ? (
                        <Badge 
                          size="sm" 
                          colorScheme={run.rpe_rating <= 6 ? 'green' : run.rpe_rating <= 8 ? 'yellow' : 'red'}
                        >
                          {run.rpe_rating}
                        </Badge>
                      ) : (
                        <Text fontSize="sm" fontWeight="medium" color="gray.400">N/A</Text>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ) : (
          <Box px={{ base: 4, md: 0 }}>
            <VStack spacing={2} py={6}>
              <Text color="gray.500" textAlign="center">
                No running exercises found.
              </Text>
              <Text color="gray.400" fontSize="xs" textAlign="center">
                Complete workouts with running exercises to see them here.
              </Text>
            </VStack>
          </Box>
        )}
      </Box>
    </VStack>
  );
}; 