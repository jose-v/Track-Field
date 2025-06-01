import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorModeValue,
  useToast,
  SimpleGrid,
} from '@chakra-ui/react';
import { FaHeart, FaBolt, FaBrain, FaRunning } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WellnessQuickLogCardProps {
  onLogComplete?: () => void;
}

interface WellnessMetric {
  key: string;
  label: string;
  icon: any;
  color: string;
  value: number;
  setValue: (value: number) => void;
}

export const WellnessQuickLogCard: React.FC<WellnessQuickLogCardProps> = ({ onLogComplete }) => {
  const [fatigue, setFatigue] = useState(5);
  const [soreness, setSoreness] = useState(5);
  const [stress, setStress] = useState(5);
  const [motivation, setMotivation] = useState(7);
  const [isLogging, setIsLogging] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  const metrics: WellnessMetric[] = [
    {
      key: 'fatigue',
      label: 'Fatigue',
      icon: FaBolt,
      color: 'orange.500',
      value: fatigue,
      setValue: setFatigue,
    },
    {
      key: 'soreness',
      label: 'Soreness',
      icon: FaRunning,
      color: 'red.500',
      value: soreness,
      setValue: setSoreness,
    },
    {
      key: 'stress',
      label: 'Stress',
      icon: FaBrain,
      color: 'purple.500',
      value: stress,
      setValue: setStress,
    },
    {
      key: 'motivation',
      label: 'Motivation',
      icon: FaHeart,
      color: 'green.500',
      value: motivation,
      setValue: setMotivation,
    },
  ];

  const handleQuickLog = async () => {
    if (!user) return;

    setIsLogging(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('athlete_wellness_surveys')
        .insert({
          athlete_id: user.id,
          survey_date: today,
          fatigue_level: fatigue,
          muscle_soreness: soreness,
          stress_level: stress,
          motivation_level: motivation,
          overall_feeling: Math.round(((10 - fatigue) + (10 - soreness) + (10 - stress) + motivation) / 4),
          notes: 'Quick check-in from dashboard'
        });

      if (error) throw error;

      toast({
        title: 'Wellness logged successfully!',
        description: 'Daily check-in complete',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onLogComplete?.();
    } catch (error) {
      console.error('Error logging wellness:', error);
      toast({
        title: 'Error logging wellness',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLogging(false);
    }
  };

  const getScoreColor = (value: number, isReverse = false) => {
    // For fatigue/soreness/stress: lower is better (reverse scoring)
    // For motivation: higher is better (normal scoring)
    const normalizedValue = isReverse ? 10 - value : value;
    
    if (normalizedValue >= 7) return 'green.500';
    if (normalizedValue >= 5) return 'yellow.500';
    return 'red.500';
  };

  const getScoreText = (value: number, isReverse = false) => {
    const normalizedValue = isReverse ? 10 - value : value;
    
    if (normalizedValue >= 7) return 'Good';
    if (normalizedValue >= 5) return 'Fair';
    return 'Poor';
  };

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
    >
      <VStack spacing={5} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Icon as={FaHeart} boxSize={6} color="green.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                Daily Wellness Check
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                How are you feeling today?
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme="green" 
            variant="solid" 
            fontSize="xs"
            px={2}
            py={1}
          >
            Quick Check
          </Badge>
        </HStack>

        {/* Wellness Metrics */}
        <SimpleGrid columns={2} spacing={4}>
          {metrics.map((metric) => {
            const isReverse = ['fatigue', 'soreness', 'stress'].includes(metric.key);
            return (
              <Box key={metric.key}>
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <Icon as={metric.icon} color={metric.color} fontSize="sm" />
                    <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
                      {metric.label}
                    </Text>
                  </HStack>
                  <VStack spacing={0} align="end">
                    <Text fontSize="sm" fontWeight="bold" color={getScoreColor(metric.value, isReverse)}>
                      {getScoreText(metric.value, isReverse)}
                    </Text>
                    <Text fontSize="xs" color={statLabelColor}>
                      {metric.value}/10
                    </Text>
                  </VStack>
                </HStack>
                
                <Slider
                  value={metric.value}
                  onChange={metric.setValue}
                  min={1}
                  max={10}
                  step={1}
                  colorScheme={metric.color.split('.')[0]}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
                
                <HStack justify="space-between" mt={1}>
                  <Text fontSize="xs" color={statLabelColor}>
                    {isReverse ? 'High' : 'Low'}
                  </Text>
                  <Text fontSize="xs" color={statLabelColor}>
                    {isReverse ? 'Low' : 'High'}
                  </Text>
                </HStack>
              </Box>
            );
          })}
        </SimpleGrid>

        {/* Overall Wellness Score */}
        <Box 
          bg={useColorModeValue('gray.50', 'gray.700')} 
          p={4} 
          borderRadius="md"
          textAlign="center"
        >
          <Text fontSize="sm" color={statLabelColor} mb={1}>
            Overall Wellness Score
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={statNumberColor}>
            {Math.round(((10 - fatigue) + (10 - soreness) + (10 - stress) + motivation) / 4 * 10)}%
          </Text>
        </Box>

        {/* Action Button */}
        <Button
          colorScheme="green"
          size="md"
          onClick={handleQuickLog}
          isLoading={isLogging}
          loadingText="Logging..."
          leftIcon={<Icon as={FaHeart} />}
        >
          Complete Check-in
        </Button>
      </VStack>
    </Box>
  );
};

export default WellnessQuickLogCard; 