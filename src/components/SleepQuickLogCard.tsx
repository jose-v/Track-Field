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
  Flex,
} from '@chakra-ui/react';
import { FaMoon, FaStar, FaBed, FaClock } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getSleepQualityText } from '../utils/analytics/performance';

interface SleepQuickLogCardProps {
  onLogComplete?: () => void;
}

export const SleepQuickLogCard: React.FC<SleepQuickLogCardProps> = ({ onLogComplete }) => {
  const [duration, setDuration] = useState(8);
  const [quality, setQuality] = useState(3); // Use numeric values to match database (3 = good)
  const [isLogging, setIsLogging] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  const handleQuickLog = async () => {
    if (!user) return;

    setIsLogging(true);
    try {
      // Log yesterday's sleep by default (since most people log previous night's sleep)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const sleepDate = yesterday.toISOString().split('T')[0];
      
      // Calculate start and end times based on duration
      // Assume they woke up at current time and calculate backwards
      const wakeTime = new Date();
      const sleepTime = new Date(wakeTime.getTime() - (duration * 60 * 60 * 1000));
      
      const startTime = sleepTime.toTimeString().slice(0, 5); // HH:MM format
      const endTime = wakeTime.toTimeString().slice(0, 5); // HH:MM format

      const { error } = await supabase
        .from('sleep_records')
        .insert({
          athlete_id: user.id,
          sleep_date: sleepDate,
          start_time: startTime,
          end_time: endTime,
          quality: quality, // Numeric value as per database schema
          notes: 'Quick log from dashboard'
        });

      if (error) throw error;

      toast({
        title: 'Sleep logged successfully!',
        description: `${duration}h sleep, ${getSleepQualityText(quality)} quality`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onLogComplete?.();
    } catch (error) {
      console.error('Error logging sleep:', error);
      toast({
        title: 'Error logging sleep',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLogging(false);
    }
  };

  const getQualityColor = (rating: number) => {
    switch (rating) {
      case 4: return 'green.500';
      case 3: return 'blue.500';
      case 2: return 'yellow.500';
      case 1: return 'red.500';
      default: return 'gray.500';
    }
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
            <Icon as={FaMoon} boxSize={6} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                How did you sleep?
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                Log yesterday's sleep
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme="blue" 
            variant="solid" 
            fontSize="xs"
            px={2}
            py={1}
          >
            Quick Log
          </Badge>
        </HStack>

        {/* Duration Slider */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
              Sleep Duration
            </Text>
            <HStack spacing={1}>
              <Icon as={FaClock} color="blue.500" fontSize="sm" />
              <Text fontSize="sm" fontWeight="bold" color={statNumberColor}>
                {duration}h
              </Text>
            </HStack>
          </HStack>
          <Slider
            value={duration}
            onChange={setDuration}
            min={4}
            max={12}
            step={0.5}
            colorScheme="blue"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <HStack justify="space-between" mt={1}>
            <Text fontSize="xs" color={statLabelColor}>4h</Text>
            <Text fontSize="xs" color={statLabelColor}>12h</Text>
          </HStack>
        </Box>

        {/* Quality Rating */}
        <Box>
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
              Sleep Quality
            </Text>
            <HStack spacing={1}>
              <Text fontSize="sm" fontWeight="bold" color={getQualityColor(quality)}>
                {getSleepQualityText(quality).charAt(0).toUpperCase() + getSleepQualityText(quality).slice(1)}
              </Text>
              <Text fontSize="xs" color={statLabelColor}>
                ({quality}/4)
              </Text>
            </HStack>
          </HStack>
          
          <HStack spacing={2} justify="center">
            {[1, 2, 3, 4].map((rating) => (
              <Icon
                key={rating}
                as={FaStar}
                boxSize={6}
                color={rating <= quality ? getQualityColor(quality) : 'gray.300'}
                cursor="pointer"
                onClick={() => setQuality(rating)}
                _hover={{ transform: 'scale(1.1)' }}
                transition="all 0.2s"
              />
            ))}
          </HStack>
        </Box>

        {/* Action Button */}
        <Button
          colorScheme="blue"
          size="md"
          onClick={handleQuickLog}
          isLoading={isLogging}
          loadingText="Logging..."
          leftIcon={<Icon as={FaBed} />}
        >
          Log Sleep
        </Button>
      </VStack>
    </Box>
  );
};

export default SleepQuickLogCard; 