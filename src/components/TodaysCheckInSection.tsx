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
import SleepQuickLogCard from './SleepQuickLogCard';
import WellnessQuickLogCard from './WellnessQuickLogCard';
import RPEPromptCard from './RPEPromptCard';

interface TodaysCheckInSectionProps {
  onDataUpdate?: () => void;
}

export const TodaysCheckInSection: React.FC<TodaysCheckInSectionProps> = ({ onDataUpdate }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  const handleLogComplete = () => {
    // Trigger refresh of components
    setRefreshKey(prev => prev + 1);
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