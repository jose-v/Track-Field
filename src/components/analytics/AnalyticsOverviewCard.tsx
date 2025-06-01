import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Badge,
  Progress,
} from '@chakra-ui/react';
import { 
  FaBed, 
  FaShieldAlt, 
  FaDumbbell, 
  FaHeartbeat,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

export const AnalyticsOverviewCard: React.FC = () => {
  const { user } = useAuth();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  // Mock data for demonstration - in real app this would come from analytics services
  const overviewData = {
    sleepScore: 85,
    injuryRisk: 'Low',
    trainingLoad: 'Moderate',
    wellnessScore: 78,
    dataCompleteness: 92,
    lastUpdated: new Date().toLocaleDateString()
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'green';
      case 'moderate': return 'yellow';
      case 'high': return 'red';
      default: return 'gray';
    }
  };

  const getLoadColor = (load: string) => {
    switch (load.toLowerCase()) {
      case 'low': return 'blue';
      case 'moderate': return 'green';
      case 'high': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow={cardShadow}
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              Analytics Overview
            </Text>
            <Text fontSize="sm" color={statLabelColor}>
              Real-time insights from your data
            </Text>
          </VStack>
          <VStack align="end" spacing={1}>
            <HStack spacing={2}>
              <Icon as={FaCheckCircle} color="green.500" />
              <Text fontSize="sm" color={statLabelColor}>
                System Active
              </Text>
            </HStack>
            <Text fontSize="xs" color={statLabelColor}>
              Last updated: {overviewData.lastUpdated}
            </Text>
          </VStack>
        </HStack>

        {/* Key Metrics Grid */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
          {/* Sleep Score */}
          <Stat>
            <StatLabel fontSize="sm" color={statLabelColor}>
              <HStack spacing={2}>
                <Icon as={FaBed} color="purple.500" />
                <Text>Sleep Score</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="2xl" color={textColor}>
              {overviewData.sleepScore}%
            </StatNumber>
            <StatHelpText fontSize="xs">
              <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                Excellent
              </Badge>
            </StatHelpText>
          </Stat>

          {/* Injury Risk */}
          <Stat>
            <StatLabel fontSize="sm" color={statLabelColor}>
              <HStack spacing={2}>
                <Icon as={FaShieldAlt} color="red.500" />
                <Text>Injury Risk</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="2xl" color={textColor}>
              {overviewData.injuryRisk}
            </StatNumber>
            <StatHelpText fontSize="xs">
              <Badge 
                colorScheme={getRiskColor(overviewData.injuryRisk)} 
                variant="subtle" 
                fontSize="xs"
              >
                ACWR: 1.1
              </Badge>
            </StatHelpText>
          </Stat>

          {/* Training Load */}
          <Stat>
            <StatLabel fontSize="sm" color={statLabelColor}>
              <HStack spacing={2}>
                <Icon as={FaDumbbell} color="blue.500" />
                <Text>Training Load</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="2xl" color={textColor}>
              {overviewData.trainingLoad}
            </StatNumber>
            <StatHelpText fontSize="xs">
              <Badge 
                colorScheme={getLoadColor(overviewData.trainingLoad)} 
                variant="subtle" 
                fontSize="xs"
              >
                7-day avg
              </Badge>
            </StatHelpText>
          </Stat>

          {/* Wellness Score */}
          <Stat>
            <StatLabel fontSize="sm" color={statLabelColor}>
              <HStack spacing={2}>
                <Icon as={FaHeartbeat} color="green.500" />
                <Text>Wellness</Text>
              </HStack>
            </StatLabel>
            <StatNumber fontSize="2xl" color={textColor}>
              {overviewData.wellnessScore}%
            </StatNumber>
            <StatHelpText fontSize="xs">
              <Badge colorScheme="green" variant="subtle" fontSize="xs">
                Good
              </Badge>
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Data Completeness */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" color={statLabelColor}>
              Data Completeness
            </Text>
            <Text fontSize="sm" color={textColor} fontWeight="medium">
              {overviewData.dataCompleteness}%
            </Text>
          </HStack>
          <Progress 
            value={overviewData.dataCompleteness} 
            colorScheme="blue" 
            size="sm" 
            borderRadius="full"
          />
          <Text fontSize="xs" color={statLabelColor} mt={1}>
            Higher data completeness improves analytics accuracy
          </Text>
        </Box>

        {/* Quick Actions */}
        <HStack spacing={4} flexWrap="wrap">
          <Badge colorScheme="blue" variant="outline" fontSize="xs">
            Real-time Processing
          </Badge>
          <Badge colorScheme="green" variant="outline" fontSize="xs">
            AI-Powered Insights
          </Badge>
          <Badge colorScheme="purple" variant="outline" fontSize="xs">
            Trend Analysis
          </Badge>
          <Badge colorScheme="orange" variant="outline" fontSize="xs">
            Predictive Modeling
          </Badge>
        </HStack>
      </VStack>
    </Box>
  );
};

export default AnalyticsOverviewCard; 