import React from 'react';
import {
  Box,
  Text,
  VStack,
  Badge,
  CircularProgress,
  CircularProgressLabel,
  useColorModeValue,
} from '@chakra-ui/react';

export interface MacroProgressCardProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  status: 'under' | 'over' | 'on target';
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'on target': return 'green';
    case 'under': return 'blue';
    case 'over': return 'orange';
    default: return 'gray';
  }
};

export const MacroProgressCard: React.FC<MacroProgressCardProps> = ({ 
  label, 
  value, 
  goal, 
  unit, 
  color, 
  status 
}) => {
  const percentage = Math.min((value / goal) * 100, 100);
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');

  return (
    <Box
      bg={cardBg}
      p={5}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="md"
      textAlign="center"
      position="relative"
    >
      <VStack spacing={4}>
        <CircularProgress 
          value={percentage} 
          size="80px" 
          color={color}
          thickness="8px"
        >
          <CircularProgressLabel>
            <VStack spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={statNumberColor}>
                {value}
              </Text>
              <Text fontSize="xs" color={statLabelColor}>
                {unit}
              </Text>
            </VStack>
          </CircularProgressLabel>
        </CircularProgress>
        
        <VStack spacing={1}>
          <Text fontSize="sm" fontWeight="medium" color={statNumberColor}>
            {label}
          </Text>
          <Badge 
            colorScheme={getStatusColor(status)} 
            variant="solid" 
            fontSize="xs"
            px={2}
            py={1}
            borderRadius="full"
          >
            {status}
          </Badge>
          <Text fontSize="xs" color={statLabelColor}>
            Goal: {goal}{unit}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

export default MacroProgressCard; 