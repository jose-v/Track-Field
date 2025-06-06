import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import SleepQuickLogCard from './SleepQuickLogCard';
import WellnessQuickLogCard from './WellnessQuickLogCard';
import RPEPromptCard from './RPEPromptCard';

interface TodaysCheckInSectionProps {
  onDataUpdate?: () => void;
}

export const TodaysCheckInSection: React.FC<TodaysCheckInSectionProps> = ({ onDataUpdate }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardShadow = useColorModeValue('none', 'lg');

  const handleLogComplete = () => {
    // Trigger refresh of components
    setRefreshKey(prev => prev + 1);
    
    // Force refetch of sleep and wellness data using predicates
    queryClient.refetchQueries({
      predicate: (query) => {
        return query.queryKey[0] === 'sleepRecords';
      }
    });
    queryClient.refetchQueries({
      predicate: (query) => {
        return query.queryKey[0] === 'wellnessRecords';
      }
    });
    
    onDataUpdate?.();
  };

  return (
    <Box my={10}>
      {/* Section Header */}
      <HStack spacing={3} mb={6}>
        <Icon as={FaCheckCircle} boxSize={6} color="green.500" />
        <VStack align="start" spacing={0}>
          <Text fontSize="xl" fontWeight="bold" color={statNumberColor}>
            Today's Check-in
          </Text>
          <Text fontSize="sm" color={statLabelColor}>
            Quick logging for your daily tracking
          </Text>
        </VStack>
      </HStack>

      {/* Quick Log Cards */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Sleep Quick Log */}
        <SleepQuickLogCard 
          key={`sleep-${refreshKey}`}
          onLogComplete={handleLogComplete} 
        />
        
        {/* Wellness Quick Log */}
        <WellnessQuickLogCard 
          key={`wellness-${refreshKey}`}
          onLogComplete={handleLogComplete} 
        />
        
        {/* RPE Prompt */}
        <RPEPromptCard 
          key={`rpe-${refreshKey}`}
          onLogComplete={handleLogComplete} 
        />
      </SimpleGrid>
    </Box>
  );
};

export default TodaysCheckInSection; 