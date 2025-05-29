import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Icon,
  Badge,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Button,
  Divider,
} from '@chakra-ui/react';
import { 
  FaShieldAlt, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaArrowRight
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { 
  calculateACWR, 
  calculateATL, 
  calculateCTL, 
  getRiskZone,
  generateRiskAssessment 
} from '../../utils/analytics/injuryRisk';
import { TrainingLoadData } from '../../utils/analytics/types';

export const InjuryRiskCard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [riskData, setRiskData] = useState<any>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  // Mock training load data for demonstration
  const mockTrainingLoads: TrainingLoadData[] = [
    { date: '2024-01-15', rpe: 7, duration: 60, load: 420, workoutType: 'endurance' },
    { date: '2024-01-14', rpe: 8, duration: 45, load: 360, workoutType: 'speed' },
    { date: '2024-01-13', rpe: 6, duration: 90, load: 540, workoutType: 'recovery' },
    { date: '2024-01-12', rpe: 9, duration: 75, load: 675, workoutType: 'strength' },
    { date: '2024-01-11', rpe: 7, duration: 60, load: 420, workoutType: 'endurance' },
    { date: '2024-01-10', rpe: 8, duration: 50, load: 400, workoutType: 'speed' },
    { date: '2024-01-09', rpe: 5, duration: 30, load: 150, workoutType: 'recovery' },
    // Add more historical data for CTL calculation
    ...Array.from({ length: 21 }, (_, i) => ({
      date: new Date(2024, 0, 8 - i).toISOString().split('T')[0],
      rpe: Math.floor(Math.random() * 4) + 6, // RPE 6-9
      duration: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
      load: 0,
      workoutType: 'training'
    })).map(item => ({ ...item, load: item.rpe * item.duration }))
  ];

  useEffect(() => {
    const calculateRisk = () => {
      setIsLoading(true);
      
      try {
        // Calculate metrics using centralized analytics
        const atl = calculateATL(mockTrainingLoads);
        const ctl = calculateCTL(mockTrainingLoads);
        const acwr = calculateACWR(atl, ctl);
        const riskZone = getRiskZone(acwr);
        
        // Generate full risk assessment
        const assessment = generateRiskAssessment(
          user?.id || 'demo-user',
          mockTrainingLoads
        );

        setRiskData({
          atl,
          ctl,
          acwr,
          riskZone,
          assessment
        });
      } catch (error) {
        console.error('Error calculating injury risk:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateRisk();
  }, [user?.id]);

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return FaCheckCircle;
      case 'moderate': return FaInfoCircle;
      case 'high': 
      case 'very-high': return FaExclamationTriangle;
      default: return FaShieldAlt;
    }
  };

  const getRiskColorScheme = (level: string) => {
    switch (level) {
      case 'low': return 'green';
      case 'moderate': return 'yellow';
      case 'high': return 'orange';
      case 'very-high': return 'red';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
        h="400px"
      >
        <VStack spacing={4} justify="center" h="100%">
          <Spinner size="lg" color="blue.500" />
          <Text color={statLabelColor}>Calculating injury risk...</Text>
        </VStack>
      </Box>
    );
  }

  if (!riskData) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
      >
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>No Training Data</AlertTitle>
            <AlertDescription>
              Injury risk assessment requires training load data. Start logging workouts to see your risk analysis.
            </AlertDescription>
          </Box>
        </Alert>
      </Box>
    );
  }

  const { atl, ctl, acwr, riskZone, assessment } = riskData;

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaShieldAlt} boxSize={6} color="red.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Injury Risk Assessment
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                Based on ACWR methodology
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme={getRiskColorScheme(riskZone.level)} 
            variant="solid" 
            fontSize="sm"
            px={3}
            py={1}
          >
            {riskZone.level.toUpperCase()} RISK
          </Badge>
        </HStack>

        {/* ACWR Display */}
        <Box textAlign="center">
          <Text fontSize="sm" color={statLabelColor} mb={2}>
            Acute:Chronic Workload Ratio
          </Text>
          <Text fontSize="4xl" fontWeight="bold" color={statNumberColor}>
            {acwr.toFixed(2)}
          </Text>
          <HStack justify="center" spacing={2} mt={2}>
            <Icon 
              as={getRiskIcon(riskZone.level)} 
              color={`${getRiskColorScheme(riskZone.level)}.500`} 
            />
            <Text fontSize="sm" color={statLabelColor}>
              {riskZone.description}
            </Text>
          </HStack>
        </Box>

        {/* Training Load Metrics */}
        <HStack spacing={6} justify="space-around">
          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Acute Load (7-day)
            </StatLabel>
            <StatNumber fontSize="xl" color={statNumberColor}>
              {atl.toFixed(0)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Recent training
            </StatHelpText>
          </Stat>

          <Stat textAlign="center">
            <StatLabel fontSize="xs" color={statLabelColor}>
              Chronic Load (28-day)
            </StatLabel>
            <StatNumber fontSize="xl" color={statNumberColor}>
              {ctl.toFixed(0)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              Fitness baseline
            </StatHelpText>
          </Stat>
        </HStack>

        <Divider />

        {/* Risk Zone Indicator */}
        <Box>
          <Text fontSize="sm" color={statLabelColor} mb={3}>
            Risk Zone Analysis
          </Text>
          <Box position="relative">
            <Progress 
              value={Math.min((acwr / 2) * 100, 100)} 
              colorScheme={getRiskColorScheme(riskZone.level)}
              size="lg" 
              borderRadius="full"
            />
            <HStack justify="space-between" mt={2} fontSize="xs" color={statLabelColor}>
              <Text>0.0</Text>
              <Text>1.0</Text>
              <Text>2.0+</Text>
            </HStack>
          </Box>
        </Box>

        {/* Recommendations */}
        <Box>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor} mb={2}>
            Recommendations
          </Text>
          <VStack spacing={2} align="stretch">
            {assessment.recommendations.slice(0, 2).map((rec: string, index: number) => (
              <HStack key={index} spacing={2} align="start">
                <Icon as={FaArrowRight} color="blue.500" mt={0.5} fontSize="xs" />
                <Text fontSize="sm" color={statLabelColor}>
                  {rec}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* Action Button */}
        <Button
          size="sm"
          colorScheme="blue"
          variant="ghost"
          rightIcon={<FaArrowRight />}
          alignSelf="center"
        >
          View Detailed Analysis
        </Button>
      </VStack>
    </Box>
  );
};

export default InjuryRiskCard; 