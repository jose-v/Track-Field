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
  StatHelpText
} from '@chakra-ui/react'
import { FaBed, FaMoon } from 'react-icons/fa'
import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { getQualityText } from '../hooks/useSleepRecords'
import type { SleepRecord } from '../hooks/useSleepRecords'

interface SleepStatsCardProps {
  sleepStats: {
    averageDuration: number;
    bestQuality: string;
    latestBedtime: string;
    countByQuality: {
      poor: number;
      fair: number;
      good: number;
      excellent: number;
    };
    recentRecord: SleepRecord | null;
  };
  isLoading: boolean;
}

export const SleepStatsCard: React.FC<SleepStatsCardProps> = ({ 
  sleepStats,
  isLoading 
}) => {
  return (
    <Card 
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="md"
      height="100%"
    >
      {/* Sleep Card Header */}
      <Box 
        h="80px" 
        bg="linear-gradient(135deg, #5B4B8A 0%, #7C66AA 100%)" 
        position="relative"
        display="flex"
        alignItems="center"
        px={6}
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
      <CardBody>
        {sleepStats.recentRecord ? (
          <VStack spacing={4} align="start">
            <Stat>
              <StatLabel>Average Sleep</StatLabel>
              <StatNumber>
                {sleepStats.averageDuration ? 
                  `${Math.floor(sleepStats.averageDuration)}h ${Math.round((sleepStats.averageDuration % 1) * 60)}m` : 
                  'No data'}
              </StatNumber>
              <StatHelpText>Last 7 records</StatHelpText>
            </Stat>
            
            <HStack width="100%" justifyContent="space-between">
              <Stat>
                <StatLabel>Latest Quality</StatLabel>
                <StatNumber fontSize="xl">
                  {sleepStats.recentRecord ? 
                    (() => {
                      const qualityText = getQualityText(sleepStats.recentRecord.quality);
                      return qualityText.charAt(0).toUpperCase() + qualityText.slice(1);
                    })() : 
                    'N/A'}
                </StatNumber>
              </Stat>
              <Stat textAlign="right">
                <StatLabel>Last Recorded</StatLabel>
                <StatNumber fontSize="xl">
                  {new Date(sleepStats.recentRecord.sleep_date).toLocaleDateString()}
                </StatNumber>
              </Stat>
            </HStack>
            
            <Button 
              as={RouterLink}
              to="/athlete/sleep"
              colorScheme="purple"
              size="sm"
              width="full"
              mt={2}
              leftIcon={<FaMoon />}
            >
              View Sleep Records
            </Button>
          </VStack>
        ) : (
          <VStack spacing={4} py={4}>
            <Text>No sleep records found.</Text>
            <Button 
              as={RouterLink}
              to="/athlete/sleep"
              colorScheme="purple"
              size="sm"
              leftIcon={<FaMoon />}
            >
              Add Sleep Record
            </Button>
          </VStack>
        )}
      </CardBody>
    </Card>
  )
}

export default SleepStatsCard 