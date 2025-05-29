import React, { useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  useColorModeValue,
  Flex,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { FaBed, FaArrowRight, FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useSleepStats } from '../hooks/useSleepRecords';
import { formatSleepDuration, getSleepQualityText } from '../utils/analytics/performance';

interface SleepStatsCardProps {
  viewAllLink?: string;
}

export const SleepStatsCard: React.FC<SleepStatsCardProps> = ({ 
  viewAllLink = "/athlete/sleep"
}) => {
  // Fetch sleep stats directly from the database
  const { stats: sleepStats, isLoading, error } = useSleepStats();
  
  // Log the data for debugging
  useEffect(() => {
    if (!isLoading && !error) {
      console.log("Sleep stats from DB:", sleepStats);
      console.log("Average duration:", sleepStats.averageDuration);
      if (sleepStats.recentRecord) {
        console.log("Latest quality:", sleepStats.recentRecord.quality, 
          "which maps to:", getSleepQualityText(sleepStats.recentRecord.quality));
        console.log("Last recorded date:", sleepStats.recentRecord.sleep_date);
      }
    }
  }, [sleepStats, isLoading, error]);
  
  // Format date as MM/DD/YYYY
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  // Get trend icon and color
  const getTrendDisplay = (trend: string) => {
    switch (trend) {
      case 'improving':
        return { icon: FaArrowUp, color: 'green.500', text: 'Improving' };
      case 'declining':
        return { icon: FaArrowDown, color: 'red.500', text: 'Declining' };
      default:
        return { icon: FaMinus, color: 'gray.500', text: 'Stable' };
    }
  };

  // Color mode values matching quick-log cards
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
        minH="320px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={statLabelColor}>Loading sleep data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
        minH="320px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="red.500">Error loading sleep data</Text>
      </Box>
    );
  }

  const trendDisplay = getTrendDisplay(sleepStats.trend);

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
      minH="320px"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={5} align="stretch" flex="1">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaBed} boxSize={6} color="purple.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Sleep Analytics
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                Your sleep patterns & quality
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme="purple" 
            variant="solid" 
            fontSize="xs"
            px={2}
            py={1}
          >
            Last 7 Days
          </Badge>
        </HStack>

        {/* Main Stats */}
        <HStack spacing={6} justify="space-between">
          <Stat flex="1">
            <StatLabel fontSize="sm" color={statLabelColor}>Average Sleep</StatLabel>
            <StatNumber fontSize="2xl" color={statNumberColor} fontWeight="bold">
              {formatSleepDuration(sleepStats.averageDuration)}
            </StatNumber>
            <StatHelpText fontSize="xs" mb={0}>
              <HStack spacing={1} align="center">
                <Icon as={trendDisplay.icon} color={trendDisplay.color} />
                <Text color={trendDisplay.color}>{trendDisplay.text}</Text>
              </HStack>
            </StatHelpText>
          </Stat>

          <Stat flex="1">
            <StatLabel fontSize="sm" color={statLabelColor}>Latest Quality</StatLabel>
            <StatNumber fontSize="2xl" color={statNumberColor} fontWeight="bold">
              {sleepStats.recentRecord ? 
                getSleepQualityText(sleepStats.recentRecord.quality).charAt(0).toUpperCase() + 
                getSleepQualityText(sleepStats.recentRecord.quality).slice(1) : 
                'No data'
              }
            </StatNumber>
            <StatHelpText fontSize="xs" mb={0} color={statLabelColor}>
              {sleepStats.recentRecord ? 
                formatDate(sleepStats.recentRecord.sleep_date) : 
                'No records yet'
              }
            </StatHelpText>
          </Stat>
        </HStack>

        {/* Quality Distribution */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={3}>
            Sleep Quality Distribution
          </Text>
          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme="red" variant="subtle" fontSize="xs" px={2} py={1}>
              POOR: {sleepStats.countByQuality.poor || 0}
            </Badge>
            <Badge colorScheme="yellow" variant="subtle" fontSize="xs" px={2} py={1}>
              FAIR: {sleepStats.countByQuality.fair || 0}
            </Badge>
            <Badge colorScheme="blue" variant="subtle" fontSize="xs" px={2} py={1}>
              GOOD: {sleepStats.countByQuality.good || 0}
            </Badge>
            <Badge colorScheme="green" variant="subtle" fontSize="xs" px={2} py={1}>
              EXCELLENT: {sleepStats.countByQuality.excellent || 0}
            </Badge>
          </HStack>
        </Box>

        {/* Consistency Score */}
        {sleepStats.consistencyScore > 0 && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                Consistency Score
              </Text>
              <Text fontSize="sm" fontWeight="bold" color={
                sleepStats.consistencyScore > 70 ? 'green.500' : 
                sleepStats.consistencyScore > 50 ? 'yellow.500' : 'red.500'
              }>
                {sleepStats.consistencyScore.toFixed(1)}%
              </Text>
            </HStack>
            <Box
              bg={useColorModeValue('gray.200', 'gray.600')}
              borderRadius="full"
              h="8px"
              overflow="hidden"
            >
              <Box
                bg={sleepStats.consistencyScore > 70 ? 'green.400' : 
                    sleepStats.consistencyScore > 50 ? 'yellow.400' : 'red.400'}
                h="100%"
                w={`${sleepStats.consistencyScore}%`}
                borderRadius="full"
                transition="width 0.3s ease"
              />
            </Box>
          </Box>
        )}

        {/* View All Button */}
        <Button
          as={Link}
          to={viewAllLink}
          colorScheme="purple"
          variant="outline"
          size="sm"
          leftIcon={<Icon as={FaBed} />}
          rightIcon={<Icon as={FaArrowRight} />}
          mt="auto"
        >
          View All Records
        </Button>
      </VStack>
    </Box>
  );
};

export default SleepStatsCard 