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

  const metrics: WellnessMetric[] = [
    {
      key: 'fatigue',
      label: 'Fatigue',
      value: fatigue,
      setValue: setFatigue,
      isReverse: true // Lower fatigue = better
    },
    {
      key: 'performance',
      label: 'Motivation',
      value: performance,
      setValue: setPerformance,
      isReverse: false // Higher motivation = better
    },
    {
      key: 'soreness',
      label: 'Soreness',
      value: soreness,
      setValue: setSoreness,
      isReverse: true // Lower soreness = better
    },
    {
      key: 'stress',
      label: 'Stress',
      value: stress,
      setValue: setStress,
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
    <Box p={4}>
      <VStack spacing={3} align="stretch">
        {/* Top row: Badge only */}
        <Box>
          <Badge 
            colorScheme="gray" 
            variant="solid" 
            fontSize="xs"
            px={2}
            py={1}
            w="100%"
            textAlign="center"
            display="block"
          >
            {metric.label}
          </Badge>
        </Box>

        {/* Score display */}
        <Text fontSize="1xl" fontWeight="normal" color={getScoreColor(metric.value, metric.isReverse)} textAlign="center">
          {getScoreText(metric.value, metric.isReverse)}
        </Text>

        {/* Slider */}
        <Box>
          <MobileFriendlySlider
            value={metric.value}
            onChange={metric.setValue}
            min={1}
            max={10}
            step={1}
            colorScheme="blue"
          />
        </Box>
      </VStack>
    </Box>
  );

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      boxShadow="lg"
      w="100%"
      minH="300px"
    >
      <VStack spacing={6} align="stretch">
        {/* 2x2 Grid of Metrics */}
        <SimpleGrid columns={2} spacing={4}>
          {metrics.map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
        </SimpleGrid>

        {/* Wellness Check-in Button */}
        <Button
          bg={buttonBg}
          color={buttonTextColor}
          size="lg"
          onClick={handleWellnessLog}
          isLoading={isLogging}
          loadingText="Logging..."
          borderRadius="md"
          fontWeight="semibold"
          _hover={{ bg: 'gray.100' }}
          _active={{ bg: 'gray.200' }}
        >
          Wellness Check-in
        </Button>
      </VStack>
    </Box>
  );
}; 