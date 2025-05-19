import {
  Box,
  Card,
  CardBody,
  Flex,
  Icon,
  Tag,
  Text,
  VStack,
  HStack,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner
} from '@chakra-ui/react'
import { FaBed, FaMoon } from 'react-icons/fa'
import React, { useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { getQualityText, useSleepStats } from '../hooks/useSleepRecords'
import type { SleepRecord } from '../hooks/useSleepRecords'

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
          "which maps to:", getQualityText(sleepStats.recentRecord.quality));
        console.log("Last recorded date:", sleepStats.recentRecord.sleep_date);
      }
    }
  }, [sleepStats, isLoading, error]);

  // Format average sleep duration as "Xh Ym"
  const formatSleepDuration = (duration: number) => {
    if (!duration) return "0h 0m";
    const hours = Math.floor(duration);
    const minutes = Math.round((duration % 1) * 60);
    return `${hours}h ${minutes}m`;
  };
  
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

  return (
    <Card 
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="md"
      height="100%"
      p="0"
      display="flex"
      flexDirection="column"
    >
      {/* Sleep Card Header */}
      <Box 
        h="80px" 
        bg="linear-gradient(135deg, #5B4B8A 0%, #7C66AA 100%)" 
        position="relative"
        display="flex"
        alignItems="center"
        px={6}
        margin="0"
        width="100%"
        borderTopLeftRadius="inherit"
        borderTopRightRadius="inherit"
      >
        <Flex 
          bg="white" 
          borderRadius="full" 
          w="50px" 
          h="50px" 
          justifyContent="center" 
          alignItems="center"
          boxShadow="none"
          mr={4}
        >
          <Icon as={FaBed} w={6} h={6} color="purple.500" />
        </Flex>
        <Tag
          size="lg"
          variant="subtle"
          bg="whiteAlpha.300"
          color="white"
          fontWeight="bold"
          px={4}
          py={2}
          borderRadius="md"
        >
          SLEEP STATS
        </Tag>
      </Box>
      <CardBody px={6} py={5} display="flex" flexDirection="column" flex="1">
        {isLoading ? (
          <Flex justify="center" align="center" flex="1">
            <Spinner size="xl" color="purple.500" />
          </Flex>
        ) : error ? (
          <VStack spacing={4} py={4} flex="1" justifyContent="center">
            <Text color="red.500">Error loading sleep data</Text>
            <Box mt="auto" width="100%">
              <Button 
                as={RouterLink}
                to={viewAllLink}
                variant="primary"
                size="md"
                width="full"
                leftIcon={<FaMoon />}
              >
                Try Again
              </Button>
            </Box>
          </VStack>
        ) : sleepStats.recentRecord ? (
          <VStack spacing={6} align="stretch" height="100%">
            <Box>
              <Text fontSize="md" fontWeight="500" color="gray.600">Average Sleep</Text>
              <Text fontSize="3xl" fontWeight="bold" mt={1} lineHeight="1">
                {formatSleepDuration(sleepStats.averageDuration)}
              </Text>
              <Text color="gray.500" fontSize="sm" mt={1}>Last 7 records</Text>
            </Box>
            
            <Flex width="100%" justifyContent="space-between" mt={2}>
              <Box>
                <Text fontSize="md" fontWeight="500" color="gray.600">Latest Quality</Text>
                <Text fontSize="2xl" fontWeight="bold" mt={1}>
                  {sleepStats.recentRecord.quality ? 
                    getQualityText(sleepStats.recentRecord.quality).charAt(0).toUpperCase() + 
                    getQualityText(sleepStats.recentRecord.quality).slice(1) : 
                    'N/A'}
                </Text>
              </Box>
              
              <Box textAlign="right">
                <Text fontSize="md" fontWeight="500" color="gray.600">Last Recorded</Text>
                <Text fontSize="2xl" fontWeight="bold" mt={1}>
                  {formatDate(sleepStats.recentRecord.sleep_date)}
                </Text>
              </Box>
            </Flex>
            
            <Box mt="auto" width="100%">
              <Button 
                as={RouterLink}
                to={viewAllLink}
                variant="primary"
                size="md"
                width="full"
                leftIcon={<FaMoon />}
              >
                View Sleep Records
              </Button>
            </Box>
          </VStack>
        ) : (
          <VStack spacing={4} py={4} flex="1" justifyContent="center">
            <Text>No sleep records found.</Text>
            <Box mt="auto" width="100%">
              <Button 
                as={RouterLink}
                to={viewAllLink}
                variant="primary"
                size="md"
                width="full"
                leftIcon={<FaMoon />}
              >
                Add Sleep Record
              </Button>
            </Box>
          </VStack>
        )}
      </CardBody>
    </Card>
  )
}

export default SleepStatsCard 