import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  SimpleGrid,
  Flex,
  Badge,
} from '@chakra-ui/react';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { saveWellnessSurvey } from '../services/analytics/wellnessService';
import { MobileFriendlySlider } from './MobileFriendlySlider';

interface MobileWellnessCardProps {
  onLogComplete?: () => void;
}

interface WellnessMetric {
  key: string;
  label: string;
  value: number;
  setValue: (value: number) => void;
  isReverse?: boolean; // For metrics where lower is better
}

export const MobileWellnessCard: React.FC<MobileWellnessCardProps> = ({ onLogComplete }) => {
  const [fatigue, setFatigue] = useState(5);
  const [performance, setPerformance] = useState(9);
  const [soreness, setSoreness] = useState(2);
  const [stress, setStress] = useState(8);
  const [isLogging, setIsLogging] = useState(false);
  const [recentWellnessRecords, setRecentWellnessRecords] = useState<any[]>([]);
  const { user } = useAuth();
  const toast = useToast();

  // Dark theme colors to match screenshot
  const cardBg = 'gray.800';
  const textColor = 'white';
  const subtitleColor = 'gray.300';
  const buttonBg = 'white';
  const buttonTextColor = 'gray.800';

  // Fetch recent wellness records
  useEffect(() => {
    const fetchRecentWellness = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('athlete_wellness_surveys')
          .select('*')
          .eq('athlete_id', user.id)
          .order('survey_date', { ascending: false })
          .limit(7);

        if (error) throw error;
        setRecentWellnessRecords(data || []);
      } catch (error) {
        console.error('Error fetching wellness records:', error);
      }
    };

    fetchRecentWellness();
  }, [user]);

  // Check if there are any wellness logs for today
  const existingLogs = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = recentWellnessRecords.filter(record => record.survey_date === todayStr);
    
    return {
      today: todayLogs,
      hasTodayLogs: todayLogs.length > 0
    };
  }, [recentWellnessRecords]);

  // Load last logged values when there's an existing log for today
  useEffect(() => {
    if (existingLogs.hasTodayLogs && existingLogs.today.length > 0) {
      const lastLog = existingLogs.today[0];
      setFatigue(lastLog.fatigue_level || 5);
      setPerformance(lastLog.motivation_level || 9); // Using motivation as performance proxy
      setSoreness(lastLog.muscle_soreness || 2);
      setStress(lastLog.stress_level || 8);
    }
  }, [existingLogs]);

  // Validation functions to ensure values stay within bounds (like sleep card)
  const setValidFatigue = React.useCallback((value: number) => {
    const validValue = !isNaN(value) ? Math.max(1, Math.min(10, value)) : 5;
    setFatigue(validValue);
  }, []);

  const setValidPerformance = React.useCallback((value: number) => {
    const validValue = !isNaN(value) ? Math.max(1, Math.min(10, value)) : 9;
    setPerformance(validValue);
  }, []);

  const setValidSoreness = React.useCallback((value: number) => {
    const validValue = !isNaN(value) ? Math.max(1, Math.min(10, value)) : 2;
    setSoreness(validValue);
  }, []);

  const setValidStress = React.useCallback((value: number) => {
    const validValue = !isNaN(value) ? Math.max(1, Math.min(10, value)) : 8;
    setStress(validValue);
  }, []);

  const metrics: WellnessMetric[] = [
    {
      key: 'fatigue',
      label: 'Fatigue',
      value: fatigue,
      setValue: setValidFatigue,
      isReverse: true // Lower fatigue = better
    },
    {
      key: 'performance',
      label: 'Motivation',
      value: performance,
      setValue: setValidPerformance,
      isReverse: false // Higher motivation = better
    },
    {
      key: 'soreness',
      label: 'Soreness',
      value: soreness,
      setValue: setValidSoreness,
      isReverse: true // Lower soreness = better
    },
    {
      key: 'stress',
      label: 'Stress',
      value: stress,
      setValue: setValidStress,
      isReverse: true // Lower stress = better
    }
  ];

  const handleWellnessLog = async () => {
    if (!user) return;

    setIsLogging(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await saveWellnessSurvey(user.id, {
        fatigue,
        soreness,
        stress,
        motivation: performance, // Using performance as motivation
        overallFeeling: Math.round(((10 - fatigue) + performance + (10 - soreness) + (10 - stress)) / 4),
        sleepQuality: undefined,
        sleepDuration: undefined
      }, today);

      const wasUpdate = existingLogs.hasTodayLogs;

      // Refresh wellness records
      const { data: updatedRecords } = await supabase
        .from('athlete_wellness_surveys')
        .select('*')
        .eq('athlete_id', user.id)
        .order('survey_date', { ascending: false })
        .limit(7);
      
      setRecentWellnessRecords(updatedRecords || []);
      
      toast({
        title: 'Wellness logged successfully!',
        description: wasUpdate ? 'Daily check-in updated' : 'Daily check-in complete',
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
    const normalizedValue = isReverse ? 10 - value : value;
    
    if (normalizedValue >= 8) return 'green.400';
    if (normalizedValue >= 6) return 'blue.400';
    if (normalizedValue >= 4) return 'yellow.400';
    return 'red.400';
  };

  const getScoreText = (value: number, isReverse = false) => {
    const normalizedValue = isReverse ? 10 - value : value;
    
    if (normalizedValue >= 8) return 'Excellent';
    if (normalizedValue >= 6) return 'Good';
    if (normalizedValue >= 4) return 'Fair';
    return 'Poor';
  };

  const MetricCard = ({ metric }: { metric: WellnessMetric }) => (
    <Box p={2} display="flex" flexDirection="column" height="100%">
      {/* Top row: Badge with fixed width */}
      <Box mb={2}>
        <Badge 
          colorScheme="gray" 
          variant="solid" 
          fontSize="xs"
          px={2}
          py={1}
          w="100%"
          textAlign="center"
          display="block"
          minW="80px"
        >
          {metric.label}
        </Badge>
      </Box>

      {/* Score display with fixed width to prevent layout shift */}
      <Text 
        fontSize="md" 
        fontWeight="normal" 
        color={getScoreColor(metric.value, metric.isReverse)} 
        textAlign="center"
        minH="24px"
        minW="80px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        mb={4} // increased margin below label
      >
        {getScoreText(metric.value, metric.isReverse)}
      </Text>

      {/* Touch-friendly slider - full width, more space */}
      <Box flex="1" display="flex" flexDirection="column" justifyContent="center" minH="60px" width="100%">
        <MobileFriendlySlider
          value={metric.value}
          onChange={metric.setValue}
          min={1}
          max={10}
          step={1}
          colorScheme="blue"
        />
      </Box>
    </Box>
  );

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      boxShadow="lg"
      w="100%"
      minH="320px"
      display="flex"
      flexDirection="column"
    >
      <VStack spacing={4} align="stretch" flex="1">
        {/* 2x2 grid using flexbox, no SimpleGrid or VStack */}
        <Box display="flex" flexWrap="wrap" gap={0}>
          <Box width="50%" p={3} boxSizing="border-box" display="flex" flexDirection="column" alignItems="center" minH="140px">
            <Badge colorScheme="gray" variant="solid" fontSize="xs" px={2} py={1} w="100%" textAlign="center" display="block" minW="80px">Fatigue</Badge>
            <Text fontSize="md" fontWeight="normal" color={getScoreColor(fatigue, true)} textAlign="center" minH="24px" minW="80px" paddingTop="25px" display="flex" alignItems="center" justifyContent="center" flexGrow={1}>{getScoreText(fatigue, true)}</Text>
            <Box display="flex" flexDirection="column" justifyContent="flex-end" minH="35px" width="100%">
              <MobileFriendlySlider value={fatigue} onChange={setValidFatigue} min={1} max={10} step={1} colorScheme="blue" />
            </Box>
          </Box>
          <Box width="50%" p={3} boxSizing="border-box" display="flex" flexDirection="column" alignItems="center" minH="140px">
            <Badge colorScheme="gray" variant="solid" fontSize="xs" px={2} py={1} w="100%" textAlign="center" display="block" minW="80px">Performance</Badge>
            <Text fontSize="md" fontWeight="normal" color={getScoreColor(performance, false)} textAlign="center" minH="24px" minW="80px" paddingTop="25px" display="flex" alignItems="center" justifyContent="center" flexGrow={1}>{getScoreText(performance, false)}</Text>
            <Box display="flex" flexDirection="column" justifyContent="flex-end" minH="35px" width="100%">
              <MobileFriendlySlider value={performance} onChange={setValidPerformance} min={1} max={10} step={1} colorScheme="blue" />
            </Box>
          </Box>
          {/* Spacer between rows */}
          <Box width="100%" height="55px" display="flex" alignItems="center" justifyContent="center">
  <Box width="95%" height="1px" bg="gray.600" borderRadius="full" />
</Box>
          <Box width="50%" p={3} boxSizing="border-box" display="flex" flexDirection="column" alignItems="center" minH="140px">
            <Badge colorScheme="gray" variant="solid" fontSize="xs" px={2} py={1} w="100%" textAlign="center" display="block" minW="80px">Soreness</Badge>
            <Text fontSize="md" fontWeight="normal" color={getScoreColor(soreness, true)} textAlign="center" minH="24px" minW="80px" paddingTop="25px" display="flex" alignItems="center" justifyContent="center" flexGrow={1}>{getScoreText(soreness, true)}</Text>
            <Box display="flex" flexDirection="column" justifyContent="flex-end" minH="35px" width="100%">
              <MobileFriendlySlider value={soreness} onChange={setValidSoreness} min={1} max={10} step={1} colorScheme="blue" />
            </Box>
          </Box>
          <Box width="50%" p={3} boxSizing="border-box" display="flex" flexDirection="column" alignItems="center" minH="140px">
            <Badge colorScheme="gray" variant="solid" fontSize="xs" px={2} py={1} w="100%" textAlign="center" display="block" minW="80px">Stress</Badge>
            <Text fontSize="md" fontWeight="normal" color={getScoreColor(stress, true)} textAlign="center" minH="24px" minW="80px" paddingTop="25px" display="flex" alignItems="center" justifyContent="center" flexGrow={1}>{getScoreText(stress, true)}</Text>
            <Box display="flex" flexDirection="column" justifyContent="flex-end" minH="35px" width="100%">
              <MobileFriendlySlider value={stress} onChange={setValidStress} min={1} max={10} step={1} colorScheme="blue" />
            </Box>
          </Box>
        </Box>

        {/* Header above button */}
        <Text fontSize="sm" color={subtitleColor} textAlign="center" mt={2}>
          {existingLogs.hasTodayLogs 
            ? "You already logged wellness for today" 
            : "How are you feeling today?"
          }
        </Text>

        {/* Wellness Check-in Button */}
        <Button
          bg={buttonBg}
          color={buttonTextColor}
          size="md"
          onClick={handleWellnessLog}
          isLoading={isLogging}
          loadingText="Logging..."
          borderRadius="md"
          fontWeight="semibold"
          _hover={{ bg: 'gray.100' }}
          _active={{ bg: 'gray.200' }}
          mt={2}
        >
          {existingLogs.hasTodayLogs ? 'Update Wellness' : 'Wellness Check-in'}
        </Button>
      </VStack>
    </Box>
  );
}; 