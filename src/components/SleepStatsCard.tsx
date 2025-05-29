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

  const headerGradient = useColorModeValue(
    'linear-gradient(135deg, #5B4B8A 0%, #7C66AA 100%)',
    'linear-gradient(135deg, #322659 0%, #6B46C1 100%)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        overflow="hidden"
        boxShadow="lg"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        h="330px"
      >
        <Box
          bgGradient={headerGradient}
          p={4}
          color="white"
        >
          <HStack spacing={3}>
            <FaBed size={20} />
            <Text fontSize="lg" fontWeight="bold">Sleep Analytics</Text>
          </HStack>
        </Box>
        <VStack p={6} spacing={4} justify="center" h="calc(100% - 72px)">
          <Text color={statLabelColor}>Loading sleep data...</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        overflow="hidden"
        boxShadow="lg"
        border="1px solid"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        h="330px"
      >
        <Box
          bgGradient={headerGradient}
          p={4}
          color="white"
        >
          <HStack spacing={3}>
            <FaBed size={20} />
            <Text fontSize="lg" fontWeight="bold">Sleep Analytics</Text>
          </HStack>
        </Box>
        <VStack p={6} spacing={4} justify="center" h="calc(100% - 72px)">
          <Text color="red.500">Error loading sleep data</Text>
        </VStack>
      </Box>
    );
  }

  const trendDisplay = getTrendDisplay(sleepStats.trend);

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="lg"
      border="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      h="330px"
    >
      {/* Header */}
      <Box
        bgGradient={headerGradient}
        p={4}
        color="white"
      >
        <HStack spacing={3} justify="space-between">
          <HStack spacing={3}>
            <FaBed size={20} />
            <Text fontSize="lg" fontWeight="bold">Sleep Analytics</Text>
          </HStack>
          <Badge colorScheme="purple" variant="solid" fontSize="xs">
            Last 7 Days
          </Badge>
        </HStack>
      </Box>

      {/* Content */}
      <VStack p={6} spacing={4} align="stretch" h="calc(100% - 72px)">
        {/* Main Stats */}
        <HStack spacing={6} justify="space-between">
          <Stat flex="1">
            <StatLabel fontSize="sm" color={statLabelColor}>Average Sleep</StatLabel>
            <StatNumber fontSize="xl" color={statNumberColor} fontWeight="bold">
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
            <StatNumber fontSize="xl" color={statNumberColor} fontWeight="bold">
              {sleepStats.recentRecord ? 
                getSleepQualityText(sleepStats.recentRecord.quality).charAt(0).toUpperCase() + 
                getSleepQualityText(sleepStats.recentRecord.quality).slice(1) : 
                'No data'
              }
            </StatNumber>
            <StatHelpText fontSize="xs" mb={0}>
              {sleepStats.recentRecord ? 
                formatDate(sleepStats.recentRecord.sleep_date) : 
                'No records yet'
              }
            </StatHelpText>
          </Stat>
        </HStack>

        {/* Quality Distribution */}
        <Box>
          <Text fontSize="sm" color={statLabelColor} mb={2}>Sleep Quality Distribution</Text>
          <HStack spacing={2} flexWrap="wrap">
            {Object.entries(sleepStats.countByQuality).map(([quality, count]) => (
              <Badge
                key={quality}
                colorScheme={
                  quality === 'excellent' ? 'green' :
                  quality === 'good' ? 'blue' :
                  quality === 'fair' ? 'yellow' : 'red'
                }
                variant="subtle"
                fontSize="xs"
                px={2}
                py={1}
              >
                {quality}: {count}
              </Badge>
            ))}
          </HStack>
        </Box>

        {/* Consistency Score */}
        {sleepStats.consistencyScore > 0 && (
          <Box>
            <Text fontSize="sm" color={statLabelColor} mb={1}>Consistency Score</Text>
            <HStack spacing={2}>
              <Box
                bg={useColorModeValue('gray.200', 'gray.600')}
                borderRadius="full"
                h="6px"
                flex="1"
                overflow="hidden"
              >
                <Box
                  bg={sleepStats.consistencyScore > 70 ? 'green.400' : 
                      sleepStats.consistencyScore > 50 ? 'yellow.400' : 'red.400'}
                  h="100%"
                  w={`${sleepStats.consistencyScore}%`}
                  borderRadius="full"
                />
              </Box>
              <Text fontSize="xs" color={statLabelColor} minW="fit-content">
                {sleepStats.consistencyScore}%
              </Text>
            </HStack>
          </Box>
        )}

        {/* View All Button */}
        <Flex justify="center" mt="auto">
          <Button
            as={Link}
            to={viewAllLink}
            size="sm"
            colorScheme="purple"
            variant="ghost"
            rightIcon={<FaArrowRight />}
            _hover={{ bg: useColorModeValue('purple.50', 'purple.900') }}
          >
            View All Records
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default SleepStatsCard 