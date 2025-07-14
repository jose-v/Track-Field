import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Button,
  Badge,
  useColorModeValue,
  useToast,
  Flex,
} from '@chakra-ui/react';
import { FaStar, FaBed } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { getSleepQualityText } from '../utils/analytics/performance';
import { useSleepRecords } from '../hooks/useSleepRecords';
import { ServiceMigration } from '../utils/migration/ServiceMigration';
import { MobileFriendlySlider } from './MobileFriendlySlider';

interface MobileSleepCardProps {
  onLogComplete?: () => void;
}

export const MobileSleepCard: React.FC<MobileSleepCardProps> = ({ onLogComplete }) => {
  const [duration, setDuration] = useState(8);
  const [quality, setQuality] = useState(3);
  const [isLogging, setIsLogging] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  
  // Get recent sleep records to check for today's logs
  const { data: recentRecords = [] } = useSleepRecords(7);

  // Dark theme colors to match screenshot
  const cardBg = 'gray.800';
  const textColor = 'white';
  const subtitleColor = 'gray.300';
  const buttonBg = 'white';
  const buttonTextColor = 'gray.800';
  const badgeBg = 'gray.600';

  // Check if there are any sleep logs for last night
  const existingLogs = useMemo(() => {
    const now = new Date();
    const lastNight = new Date(now);
    lastNight.setDate(lastNight.getDate() - 1);
    const lastNightStr = lastNight.getFullYear() + '-' + 
      String(lastNight.getMonth() + 1).padStart(2, '0') + '-' + 
      String(lastNight.getDate()).padStart(2, '0');
    
    const lastNightLogs = recentRecords.filter(record => record.sleep_date === lastNightStr);
    
    return {
      lastNight: lastNightLogs,
      hasLastNightLogs: lastNightLogs.length > 0
    };
  }, [recentRecords]);

  // Load last logged values when there's an existing log
  useEffect(() => {
    if (existingLogs.hasLastNightLogs && existingLogs.lastNight.length > 0) {
      const lastLog = existingLogs.lastNight[0];
      // Calculate duration from start and end times if available
      if (lastLog.start_time && lastLog.end_time) {
        const startTime = new Date(`2000-01-01T${lastLog.start_time}`);
        const endTime = new Date(`2000-01-01T${lastLog.end_time}`);
        const diffMs = endTime.getTime() - startTime.getTime();
        const hours = Math.max(4, Math.min(12, diffMs / (1000 * 60 * 60)));
        setDuration(hours);
      }
      setQuality(lastLog.quality || 3);
    }
  }, [existingLogs]);

  const setValidDuration = (value: number) => {
    const validValue = !isNaN(value) ? Math.max(4, Math.min(12, value)) : 8;
    setDuration(validValue);
  };

  const setValidQuality = (value: number) => {
    const validValue = !isNaN(value) ? Math.max(1, Math.min(4, value)) : 3;
    setQuality(validValue);
  };

  const handleQuickLog = async () => {
    if (!user) return;

    setIsLogging(true);
    try {
      const now = new Date();
      const lastNight = new Date(now);
      lastNight.setDate(lastNight.getDate() - 1);
      
      const sleepDate = lastNight.getFullYear() + '-' + 
        String(lastNight.getMonth() + 1).padStart(2, '0') + '-' + 
        String(lastNight.getDate()).padStart(2, '0');
      
      const wakeTime = new Date();
      const sleepTime = new Date(wakeTime.getTime() - (duration * 60 * 60 * 1000));
      
      const startTime = sleepTime.toTimeString().slice(0, 8);
      const endTime = wakeTime.toTimeString().slice(0, 8);

      const recordData = {
        athlete_id: user.id,
        sleep_date: sleepDate,
        start_time: startTime,
        end_time: endTime,
        quality: quality,
        notes: existingLogs.hasLastNightLogs ? 'Updated from mobile dashboard' : 'Quick log from mobile dashboard'
      };

      await ServiceMigration.sleep.createRecord(recordData);
      
      const wasUpdate = existingLogs.hasLastNightLogs;
      
      toast({
        title: 'Sleep logged successfully!',
        description: wasUpdate ? 
          `Sleep updated (${getSleepQualityText(quality)} quality, ${duration}h)` : 
          `Sleep logged (${getSleepQualityText(quality)} quality, ${duration}h)`,
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
      case 4: return 'blue.400';
      case 3: return 'blue.400';
      case 2: return 'blue.400';
      case 1: return 'gray.400';
      default: return 'gray.400';
    }
  };

  const getQualityText = (rating: number) => {
    switch (rating) {
      case 4: return 'Excellent';
      case 3: return 'Good';
      case 2: return 'Fair';
      case 1: return 'Poor';
      default: return 'Fair';
    }
  };

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      boxShadow="lg"
      h="200px"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <VStack spacing={4} align="stretch" flex="1">
        {/* Top Row: Sleep badge | Quality text | Hours */}
        <HStack justify="space-between" align="center">
          <Badge
            bg={badgeBg}
            color={textColor}
            fontSize="sm"
            px={3}
            py={1}
            borderRadius="lg"
            fontWeight="normal"
          >
            Sleep
          </Badge>
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            {getQualityText(quality)}
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            {duration}h
          </Text>
        </HStack>

        {/* Second Row: Star Rating */}
        <HStack spacing={2} justify="center">
          {[1, 2, 3, 4].map((rating) => (
            <Icon
              key={rating}
              as={FaStar}
              boxSize={6}
              color={rating <= quality ? getQualityColor(quality) : 'gray.600'}
              cursor="pointer"
              onClick={() => setValidQuality(rating)}
              _hover={{ transform: 'scale(1.1)' }}
              transition="all 0.2s"
            />
          ))}
        </HStack>

        {/* Third Row: Hours Slider */}
        <Box flex="1" display="flex" flexDirection="column" justifyContent="center">
          <MobileFriendlySlider
            value={duration}
            onChange={setValidDuration}
            min={4}
            max={12}
            step={0.5}
            colorScheme="blue"
          />
        </Box>

        {/* Fourth Row: Submit Button */}
        <Button
          bg={buttonBg}
          color={buttonTextColor}
          size="md"
          onClick={handleQuickLog}
          isLoading={isLogging}
          loadingText="Logging..."
          borderRadius="md"
          fontWeight="semibold"
          _hover={{ bg: 'gray.100' }}
          _active={{ bg: 'gray.200' }}
        >
          Log Sleep
        </Button>
      </VStack>
    </Box>
  );
}; 