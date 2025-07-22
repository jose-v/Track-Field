import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Button,
  useColorModeValue,
  useToast,
  Flex,
  Alert,
  AlertIcon,
  useDisclosure,
} from '@chakra-ui/react';
import { FaMoon, FaStar, FaBed, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { getSleepQualityText } from '../utils/analytics/performance';
import { useSleepRecords } from '../hooks/useSleepRecords';
import { ServiceMigration } from '../utils/migration/ServiceMigration';
import { getYesterdayLocalDate, getTodayLocalDate } from '../utils/dateUtils';
import { MobileFriendlySlider } from './MobileFriendlySlider';
import { SleepAnalysisDrawer } from './SleepAnalysisDrawer';

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
  
  // Sleep analysis drawer state
  const { isOpen: isAnalysisOpen, onOpen: onAnalysisOpen, onClose: onAnalysisClose } = useDisclosure();
  
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
    // Use timezone-aware date utilities to prevent timezone issues
    const todayStr = getTodayLocalDate();
    const lastNightStr = getYesterdayLocalDate();
    
    const todayLogs = recentRecords.filter(record => record.sleep_date === todayStr);
    const lastNightLogs = recentRecords.filter(record => record.sleep_date === lastNightStr);
    
    return {
      today: todayLogs,
      lastNight: lastNightLogs,
      hasTodayLogs: todayLogs.length > 0,
      hasLastNightLogs: lastNightLogs.length > 0
    };
  }, [recentRecords]);

  // Load existing values when there's a record for last night
  useEffect(() => {
    if (existingLogs.hasLastNightLogs && existingLogs.lastNight.length > 0) {
      const lastLog = existingLogs.lastNight[0];
      
      try {
        // Calculate duration from start_time and end_time
        if (lastLog.start_time && lastLog.end_time) {
          // Parse times in HH:MM:SS format
          const startTime = new Date(`2000-01-01T${lastLog.start_time}`);
          const endTime = new Date(`2000-01-01T${lastLog.end_time}`);
          
          if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
            let durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            
            // Handle overnight sleep (end time is next day)
            if (durationHours < 0) {
              durationHours += 24;
            }
            
            // Validate the duration is a valid number and within reasonable bounds
            if (!isNaN(durationHours) && durationHours > 0 && durationHours <= 24) {
              const validDuration = Math.round(durationHours * 2) / 2; // Round to nearest 0.5
              const clampedDuration = Math.max(4, Math.min(12, validDuration)); // Clamp between 4-12 hours
              setDuration(clampedDuration);
            } else {
              setDuration(8); // Default fallback
            }
          } else {
            setDuration(8); // Default fallback
          }
          
          // Set quality with validation
          const validQuality = lastLog.quality && !isNaN(lastLog.quality) ? lastLog.quality : 3;
          const clampedQuality = Math.max(1, Math.min(4, validQuality)); // Clamp between 1-4
          setQuality(clampedQuality);
          
        } else {
          setDuration(8); // Default fallback
        }
        
      } catch (error) {
        setDuration(8); // Default fallback
        setQuality(3); // Default fallback
      }
    }
  }, [existingLogs]);

  // Validate and set duration with bounds checking
  const setValidDuration = (value: number) => {
    const validValue = !isNaN(value) ? Math.max(4, Math.min(12, value)) : 8;
    setDuration(validValue);
  };

  // Validate and set quality with bounds checking
  const setValidQuality = (value: number) => {
    const validValue = !isNaN(value) ? Math.max(1, Math.min(4, value)) : 3;
    setQuality(validValue);
  };

  const handleQuickLog = async () => {
    if (!user) return;

    setIsLogging(true);
    try {
      // Use timezone-aware date utility to prevent timezone issues
      const sleepDate = getYesterdayLocalDate();
      
      // Calculate start and end times based on duration
      // Assume they woke up at current time and calculate backwards
      const wakeTime = new Date();
      const sleepTime = new Date(wakeTime.getTime() - (duration * 60 * 60 * 1000));
      
      // Format times as HH:MM:SS to match database format
      const startTime = sleepTime.toTimeString().slice(0, 8); // HH:MM:SS format
      const endTime = wakeTime.toTimeString().slice(0, 8); // HH:MM:SS format

      const recordData = {
        athlete_id: user.id,
        sleep_date: sleepDate,
        start_time: startTime,
        end_time: endTime,
        quality: quality, // Numeric value as per database schema
        notes: existingLogs.hasLastNightLogs ? 'Updated from dashboard' : 'Quick log from dashboard'
      };

      // Use the new service layer through ServiceMigration
      await ServiceMigration.sleep.createRecord(recordData);

      // Completely clear and refetch sleep data
      try {
        // Method 1: Remove all sleepRecords queries from cache completely
        queryClient.removeQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'sleepRecords';
          }
        });
        
        // Method 2: Immediately invalidate and refetch all sleep queries
        await queryClient.invalidateQueries({
          queryKey: ['sleepRecords'],
          refetchType: 'all'
        });
        
        // Method 3: Force immediate refetch of the specific queries used by components
        const refreshPromises = [
          // Refresh main sleep records
          queryClient.refetchQueries({
            queryKey: ['sleepRecords', user.id],
            type: 'active'
          }),
          // Refresh limited sleep records (used by stats)
          queryClient.refetchQueries({
            queryKey: ['sleepRecords', user.id, 7],
            type: 'active'
          })
        ];
        
        await Promise.all(refreshPromises);
        
        // Method 4: Wait a moment then trigger a final invalidation
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: ['sleepRecords'],
            refetchType: 'all'
          });
        }, 500);
        
        // Method 5: Force a complete cache reset for this specific data
        setTimeout(() => {
          queryClient.resetQueries({
            queryKey: ['sleepRecords', user.id, 7],
            exact: true
          });
        }, 1000);
        
      } catch (cacheError) {
        console.error('Error refreshing cache:', cacheError);
      }

      toast({
        title: 'Sleep logged successfully!',
        description: existingLogs.hasLastNightLogs ? 
          `Sleep updated: ${duration}h, ${getSleepQualityText(quality)} quality` :
          `${duration}h sleep, ${getSleepQualityText(quality)} quality`,
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
    <>
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
        <HStack spacing={3} justify="space-between">
          <HStack spacing={3}>
            <Icon as={FaMoon} boxSize={6} color="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                How did you sleep?
              </Text>
              <Text fontSize="sm" color={statLabelColor}>
                Log last night's sleep
              </Text>
            </VStack>
          </HStack>
          <Button
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={onAnalysisOpen}
            aria-label="View sleep analysis"
          >
            View Stats
          </Button>
        </HStack>

        {/* Existing Logs Alert */}
        {existingLogs.hasLastNightLogs && (
          <Alert status="info" borderRadius="md" py={2}>
            <AlertIcon as={FaCheckCircle} />
            <Text fontSize="sm" color={alertTextColor}>
              You already logged sleep for last night ({existingLogs.lastNight[0]?.quality && getSleepQualityText(existingLogs.lastNight[0].quality)} quality)
            </Text>
          </Alert>
        )}

        {/* Duration Slider */}
        <Box>
          <HStack justify="space-between" mb={6}>
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
          <Box maxW="100%" mx="auto">
            <MobileFriendlySlider
              value={duration}
              onChange={setValidDuration}
              min={4}
              max={12}
              step={0.5}
              colorScheme="blue"
            />
          </Box>
          <HStack justify="space-between" mt={1} maxW="100%" mx="auto">
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
                onClick={() => setValidQuality(rating)}
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
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when clicking button
            handleQuickLog();
          }}
          isLoading={isLogging}
          loadingText="Logging..."
          leftIcon={<Icon as={FaBed} />}
          variant={existingLogs.hasLastNightLogs ? "outline" : "solid"}
        >
          {existingLogs.hasLastNightLogs ? "Update" : "Log Sleep"}
        </Button>
      </VStack>
    </Box>

    {/* Sleep Analysis Drawer */}
    <SleepAnalysisDrawer 
      isOpen={isAnalysisOpen} 
      onClose={onAnalysisClose} 
    />
  </>
  );
};

export default SleepQuickLogCard; 