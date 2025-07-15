import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
  Flex,
  useColorModeValue,
  Badge,
  Progress,
  Divider,
} from '@chakra-ui/react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';
import { useSleepRecords } from '../hooks/useSleepRecords';
import { calculateSleepDuration, formatSleepDuration, getSleepQualityText } from '../utils/analytics/performance';

interface SleepAnalysisDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to format time strings
const formatTimeString = (timeString: string) => {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export const SleepAnalysisDrawer: React.FC<SleepAnalysisDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(today.setDate(diff));
  });

  // Fetch sleep records for the past 30 days to have enough data
  const { data: sleepRecords = [] } = useSleepRecords(30);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');
  const buttonActiveBg = useColorModeValue('blue.500', 'blue.600');
  const buttonInactiveBg = useColorModeValue('gray.100', 'gray.700');
  const chartBg = useColorModeValue('gray.50', 'gray.800');
  const barColor = '#6366F1'; // Indigo color matching the design

  // Generate week dates
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

  // Get week label
  const weekLabel = useMemo(() => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);
    
    const startMonth = currentWeekStart.toLocaleDateString('en-US', { month: 'long' });
    const startDay = currentWeekStart.getDate();
    const endDay = endDate.getDate();
    
    return `${startMonth} ${startDay}-${endDay}`;
  }, [currentWeekStart]);

  // Calculate bedtime range for the week
  const bedtimeRange = useMemo(() => {
    const weekRecords = sleepRecords.filter(record => {
      const recordDate = new Date(record.sleep_date);
      const weekStart = new Date(currentWeekStart);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return recordDate >= weekStart && recordDate <= weekEnd;
    });

    if (weekRecords.length === 0) return 'No data';

    const startTimes = weekRecords
      .map(record => record.start_time)
      .sort();
    
    const endTimes = weekRecords
      .map(record => record.end_time)
      .sort();

    const earliestBedtime = startTimes[0];
    const latestWakeup = endTimes[endTimes.length - 1];

    // Format times nicely
    const formatTime = (timeString: string) => {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    };

    return `${formatTime(earliestBedtime)} - ${formatTime(latestWakeup)}`;
  }, [sleepRecords, currentWeekStart]);

  // Get sleep data for the chart
  const chartData = useMemo(() => {
    return weekDates.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const record = sleepRecords.find(r => r.sleep_date === dateStr);
      
      if (!record) {
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          hasData: false,
          sleepStart: 0,
          sleepEnd: 0,
          duration: 0
        };
      }

      // Convert time strings to hour values for chart positioning
      const [startHours, startMinutes] = record.start_time.split(':').map(Number);
      const [endHours, endMinutes] = record.end_time.split(':').map(Number);
      
      let sleepStart = startHours + startMinutes / 60;
      let sleepEnd = endHours + endMinutes / 60;
      
      // Handle overnight sleep (bedtime after midnight)
      if (sleepStart > 12) sleepStart -= 24; // Convert to negative hours for evening
      if (sleepEnd < sleepStart) sleepEnd += 24; // Handle crossing midnight
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hasData: true,
        sleepStart,
        sleepEnd,
        duration: sleepEnd - sleepStart,
        record
      };
    });
  }, [weekDates, sleepRecords]);

  // Get recent bedtime routine entries
  const recentRoutineEntries = useMemo(() => {
    return sleepRecords
      .slice(0, 3)
      .map(record => {
        const date = new Date(record.sleep_date);
        const durationCalc = calculateSleepDuration(record.start_time, record.end_time);
        const durationFormatted = formatSleepDuration(durationCalc.total);
        const quality = getSleepQualityText(record.quality);
        
        // Calculate quality percentage
        const qualityPercentage = (record.quality / 4) * 100;
        
        return {
          date: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          }),
          timeRange: `${formatTimeString(record.start_time)} - ${formatTimeString(record.end_time)}`,
          duration: durationFormatted,
          quality,
          qualityPercentage,
          record
        };
      });
  }, [sleepRecords]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  // Sleep chart component
  const SleepChart = () => (
    <Box bg={chartBg} borderRadius="lg" p={4} position="relative">
      {/* Time labels on the right */}
      <Box position="absolute" right={2} top={4} bottom={4}>
        <VStack justify="space-between" h="full" spacing={0}>
          <Text fontSize="xs" color={textSecondary}>2am</Text>
          <Text fontSize="xs" color={textSecondary}>4am</Text>
          <Text fontSize="xs" color={textSecondary}>6am</Text>
          <Text fontSize="xs" color={textSecondary}>8am</Text>
          <Text fontSize="xs" color={textSecondary}>10am</Text>
        </VStack>
      </Box>

      {/* Chart area */}
      <HStack spacing={2} align="end" justify="space-between" h="120px" pr={8}>
        {chartData.map((day, index) => (
          <VStack key={index} spacing={1} align="center" flex={1}>
            {/* Sleep bar */}
            <Box 
              position="relative" 
              h="80px" 
              w="12px" 
              bg="gray.200" 
              borderRadius="full"
              overflow="hidden"
            >
              {day.hasData && (
                <>
                  {/* Sleep duration bar */}
                  <Box
                    position="absolute"
                    bottom={`${Math.max(0, (day.sleepStart + 12) / 16 * 100)}%`}
                    h={`${Math.min(80, Math.max(10, (day.duration / 12) * 80))}%`}
                    w="full"
                    bg={barColor}
                    borderRadius="full"
                  />
                  {/* Bedtime indicator (small circle) */}
                  <Box
                    position="absolute"
                    bottom={`${(day.sleepStart + 12) / 16 * 100}%`}
                    left="50%"
                    transform="translateX(-50%)"
                    w="6px"
                    h="6px"
                    bg={barColor}
                    borderRadius="full"
                    border="2px solid white"
                  />
                </>
              )}
            </Box>
            {/* Day label */}
            <Text fontSize="xs" color={textSecondary} fontWeight="medium">
              {day.day}
            </Text>
          </VStack>
        ))}
      </HStack>
    </Box>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      motionPreset="slideInBottom"
      closeOnOverlayClick={true}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        top="auto"
        height="85vh"
        maxHeight="85vh"
        minHeight="500px"
        borderRadius="16px 16px 0 0"
        bg={bgColor}
        border={`1px solid ${borderColor}`}
        boxShadow="2xl"
        margin="0"
        maxWidth="100vw"
        width="100vw"
        display="flex"
        flexDirection="column"
      >
        <ModalBody p={0} h="100%" display="flex" flexDirection="column" overflowY="auto">
          {/* Header */}
          <Flex 
            justify="space-between" 
            align="center" 
            p={6} 
            borderBottom={`1px solid ${borderColor}`}
            flexShrink={0}
          >
            <Text fontSize="xl" fontWeight="bold" color={textPrimary}>
              Sleep Analysis
            </Text>
            <IconButton
              aria-label="Close sleep analysis"
              icon={<FaTimes />}
              size="lg"
              variant="ghost"
              borderRadius="full"
              onClick={onClose}
              color={textPrimary}
              _hover={{ bg: buttonInactiveBg }}
              fontSize="18px"
            />
          </Flex>

          {/* Content */}
          <VStack spacing={6} p={6} align="stretch" flex={1}>
            {/* Week/Month Toggle */}
            <HStack spacing={0} bg={buttonInactiveBg} borderRadius="lg" p={1}>
              <Button
                size="sm"
                variant={viewMode === 'week' ? 'solid' : 'ghost'}
                bg={viewMode === 'week' ? buttonActiveBg : 'transparent'}
                color={viewMode === 'week' ? 'white' : textPrimary}
                borderRadius="md"
                flex={1}
                onClick={() => setViewMode('week')}
                _hover={{ bg: viewMode === 'week' ? buttonActiveBg : 'transparent' }}
              >
                Week
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'month' ? 'solid' : 'ghost'}
                bg={viewMode === 'month' ? buttonActiveBg : 'transparent'}
                color={viewMode === 'month' ? 'white' : textPrimary}
                borderRadius="md"
                flex={1}
                onClick={() => setViewMode('month')}
                _hover={{ bg: viewMode === 'month' ? buttonActiveBg : 'transparent' }}
              >
                Month
              </Button>
            </HStack>

            {/* Week Navigation */}
            <HStack justify="space-between" align="center">
              <IconButton
                aria-label="Previous week"
                icon={<FaChevronLeft />}
                size="sm"
                variant="ghost"
                onClick={() => navigateWeek('prev')}
                color={textPrimary}
              />
              <VStack spacing={1}>
                <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                  {weekLabel}
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  Bedtime between {bedtimeRange}
                </Text>
              </VStack>
              <IconButton
                aria-label="Next week"
                icon={<FaChevronRight />}
                size="sm"
                variant="ghost"
                onClick={() => navigateWeek('next')}
                color={textPrimary}
              />
              <IconButton
                aria-label="Calendar"
                icon={<FaCalendarAlt />}
                size="sm"
                variant="ghost"
                color={textPrimary}
              />
            </HStack>

            {/* Sleep Chart */}
            <SleepChart />

            {/* Bedtime Routine Section */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" color={textPrimary} mb={4}>
                Bedtime Routine
              </Text>
              <VStack spacing={3} align="stretch">
                {recentRoutineEntries.map((entry, index) => (
                  <HStack key={index} justify="space-between" align="center" p={3} bg={chartBg} borderRadius="lg">
                    <HStack spacing={3}>
                      <Box w="8px" h="8px" bg={barColor} borderRadius="full" />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="semibold" color={textPrimary}>
                          {entry.timeRange}
                        </Text>
                        <Text fontSize="xs" color={textSecondary}>
                          {entry.date}
                        </Text>
                      </VStack>
                    </HStack>
                    <VStack align="end" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                        {Math.round(entry.qualityPercentage)}%
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Suggestions Section */}
            <Box>
              <HStack justify="space-between" align="center" mb={4}>
                <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                  Suggestions
                </Text>
                <Text fontSize="sm" color="#6366F1" fontWeight="medium" cursor="pointer">
                  VIEW MORE
                </Text>
              </HStack>
              <VStack spacing={3} align="stretch">
                <Box p={3} bg={chartBg} borderRadius="lg">
                  <Text fontSize="sm" color={textPrimary}>
                    Try to maintain a consistent bedtime routine. Going to bed at the same time each night can improve your sleep quality.
                  </Text>
                </Box>
                <Box p={3} bg={chartBg} borderRadius="lg">
                  <Text fontSize="sm" color={textPrimary}>
                    Your average sleep duration this week is good. Keep aiming for 7-9 hours of quality sleep.
                  </Text>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 