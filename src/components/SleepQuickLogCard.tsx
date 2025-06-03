import React, { useState, useMemo } from 'react';
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
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FaMoon, FaStar, FaBed, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getSleepQualityText } from '../utils/analytics/performance';
import { useSleepRecords } from '../hooks/useSleepRecords';

interface SleepQuickLogCardProps {
  onLogComplete?: () => void;
}

export const SleepQuickLogCard: React.FC<SleepQuickLogCardProps> = ({ onLogComplete }) => {
  const [duration, setDuration] = useState(8);
  const [quality, setQuality] = useState(3); // Use numeric values to match database (3 = good)
  const [isLogging, setIsLogging] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Get recent sleep records to check for today's logs
  const { data: recentRecords = [] } = useSleepRecords(7);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');
  const alertTextColor = useColorModeValue('gray.800', 'white');

  // Check if there are any sleep logs for today or yesterday
  const existingLogs = useMemo(() => {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.getFullYear() + '-' + 
      String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
      String(yesterday.getDate()).padStart(2, '0');
    
    const todayLogs = recentRecords.filter(record => record.sleep_date === todayStr);
    const yesterdayLogs = recentRecords.filter(record => record.sleep_date === yesterdayStr);
    
    return {
      today: todayLogs,
      yesterday: yesterdayLogs,
      hasTodayLogs: todayLogs.length > 0,
      hasYesterdayLogs: yesterdayLogs.length > 0
    };
  }, [recentRecords]);

  const handleQuickLog = async () => {
    if (!user) return;

    setIsLogging(true);
    try {
      // Use local timezone to avoid date shifting issues
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - 1); // Set to yesterday
      
      // Format date as YYYY-MM-DD in local timezone
      const sleepDate = targetDate.getFullYear() + '-' + 
        String(targetDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(targetDate.getDate()).padStart(2, '0');
      
      // Calculate start and end times based on duration
      // Assume they woke up at current time and calculate backwards
      const wakeTime = new Date();
      const sleepTime = new Date(wakeTime.getTime() - (duration * 60 * 60 * 1000));
      
      const startTime = sleepTime.toTimeString().slice(0, 5); // HH:MM format
      const endTime = wakeTime.toTimeString().slice(0, 5); // HH:MM format

      const recordData = {
        athlete_id: user.id,
        sleep_date: sleepDate,
        start_time: startTime,
        end_time: endTime,
        quality: quality, // Numeric value as per database schema
        notes: 'Quick log from dashboard'
      };

      const { data: insertedData, error } = await supabase
        .from('sleep_records')
        .insert(recordData)
        .select(); // Add select to return the inserted data

      if (error) throw error;

      // Verify the data was saved by checking the database
      const { data: verifyData, error: verifyError } = await supabase
        .from('sleep_records')
        .select('*')
        .eq('athlete_id', user.id)
        .eq('sleep_date', sleepDate)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (verifyError) {
        console.error('Error verifying saved record:', verifyError);
      }

      // Completely clear and refetch sleep data
      try {
        // Method 1: Remove all sleepRecords queries from cache completely
        queryClient.removeQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'sleepRecords';
          }
        });
        
        // Method 2: Wait a moment then force fresh fetch
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Method 3: Trigger fresh fetch of all sleep data
        await queryClient.fetchQuery({
          queryKey: ['sleepRecords', user?.id],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('sleep_records')
              .select('*')
              .eq('athlete_id', user?.id)
              .order('sleep_date', { ascending: false });
            
            if (error) throw error;
            return data || [];
          },
          staleTime: 0,
        });
        
        // Method 4: Force reload the page if we're on the sleep page
        if (window.location.pathname.includes('/athlete/sleep')) {
          setTimeout(() => window.location.reload(), 500);
        }
      } catch (cacheError) {
        console.error('Error refreshing cache:', cacheError);
      }

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

        {/* Existing Logs Alert */}
        {existingLogs.hasYesterdayLogs && (
          <Alert status="info" borderRadius="md" py={2}>
            <AlertIcon as={FaCheckCircle} />
            <Text fontSize="sm" color={alertTextColor}>
              You already logged sleep for yesterday ({existingLogs.yesterday[0]?.quality && getSleepQualityText(existingLogs.yesterday[0].quality)} quality)
            </Text>
          </Alert>
        )}

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
          variant={existingLogs.hasYesterdayLogs ? "outline" : "solid"}
        >
          {existingLogs.hasYesterdayLogs ? "Log Again" : "Log Sleep"}
        </Button>
      </VStack>
    </Box>
  );
};

export default SleepQuickLogCard; 