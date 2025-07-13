import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  Icon,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { FaDumbbell, FaRedo, FaListOl, FaLayerGroup } from 'react-icons/fa';

interface DetailedProgressProps {
  // Exercise-level progress
  exerciseProgress: {
    current: number;
    total: number;
    currentExerciseName?: string;
  };
  
  // Set-level progress (for current exercise)
  setProgress?: {
    current: number;
    total: number;
  };
  
  // Rep-level progress (for current set)
  repProgress?: {
    current: number;
    total: number;
  };
  
  // Block-level progress (for block-based workouts)
  blockProgress?: {
    current: number;
    total: number;
    currentBlockName?: string;
  };
  
  // Layout options
  layout?: 'vertical' | 'horizontal' | 'compact';
  showLabels?: boolean;
  showPercentages?: boolean;
}

export function DetailedProgressDisplay({
  exerciseProgress,
  setProgress,
  repProgress,
  blockProgress,
  layout = 'vertical',
  showLabels = true,
  showPercentages = false
}: DetailedProgressProps) {
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  
  // Calculate percentages
  const exercisePercentage = exerciseProgress.total > 0 
    ? (exerciseProgress.current / exerciseProgress.total) * 100 
    : 0;
  
  const setPercentage = setProgress && setProgress.total > 0 
    ? (setProgress.current / setProgress.total) * 100 
    : 0;
  
  const repPercentage = repProgress && repProgress.total > 0 
    ? (repProgress.current / repProgress.total) * 100 
    : 0;
  
  const blockPercentage = blockProgress && blockProgress.total > 0 
    ? (blockProgress.current / blockProgress.total) * 100 
    : 0;

  // Progress item component
  const ProgressItem = ({ 
    icon, 
    label, 
    current, 
    total, 
    percentage, 
    colorScheme, 
    subtitle 
  }: {
    icon: any;
    label: string;
    current: number;
    total: number;
    percentage: number;
    colorScheme: string;
    subtitle?: string;
  }) => (
    <Box width="100%">
      <Flex justify="space-between" align="center" mb={1}>
        <HStack spacing={2}>
          <Icon as={icon} boxSize={4} color={`${colorScheme}.500`} />
          {showLabels && (
            <Text fontSize="sm" fontWeight="medium" color={textColor}>
              {label}
            </Text>
          )}
        </HStack>
        <HStack spacing={1}>
          <Badge colorScheme={colorScheme} variant="subtle">
            {current}/{total}
          </Badge>
          {showPercentages && (
            <Text fontSize="xs" color={secondaryTextColor}>
              {Math.round(percentage)}%
            </Text>
          )}
        </HStack>
      </Flex>
      
      <Progress 
        value={percentage} 
        colorScheme={colorScheme} 
        size="sm" 
        borderRadius="full"
        bg={useColorModeValue('gray.200', 'gray.600')}
      />
      
      {subtitle && (
        <Text fontSize="xs" color={secondaryTextColor} mt={1} noOfLines={1}>
          {subtitle}
        </Text>
      )}
    </Box>
  );

  // Compact layout for small spaces
  if (layout === 'compact') {
    return (
      <VStack spacing={2} width="100%">
        {blockProgress && blockProgress.total > 0 && (
          <ProgressItem
            icon={FaLayerGroup}
            label="Blocks"
            current={blockProgress.current}
            total={blockProgress.total}
            percentage={blockPercentage}
            colorScheme="purple"
          />
        )}
        
        <ProgressItem
          icon={FaDumbbell}
          label="Exercises"
          current={exerciseProgress.current}
          total={exerciseProgress.total}
          percentage={exercisePercentage}
          colorScheme="blue"
        />
        
        {setProgress && setProgress.total > 0 && (
          <ProgressItem
            icon={FaRedo}
            label="Sets"
            current={setProgress.current}
            total={setProgress.total}
            percentage={setPercentage}
            colorScheme="green"
          />
        )}
        
        {repProgress && repProgress.total > 0 && (
          <ProgressItem
            icon={FaListOl}
            label="Reps"
            current={repProgress.current}
            total={repProgress.total}
            percentage={repPercentage}
            colorScheme="orange"
          />
        )}
      </VStack>
    );
  }

  // Horizontal layout
  if (layout === 'horizontal') {
    return (
      <HStack spacing={6} width="100%">
        {blockProgress && blockProgress.total > 0 && (
          <ProgressItem
            icon={FaLayerGroup}
            label="Blocks"
            current={blockProgress.current}
            total={blockProgress.total}
            percentage={blockPercentage}
            colorScheme="purple"
            subtitle={blockProgress.currentBlockName}
          />
        )}
        
        <ProgressItem
          icon={FaDumbbell}
          label="Exercises"
          current={exerciseProgress.current}
          total={exerciseProgress.total}
          percentage={exercisePercentage}
          colorScheme="blue"
          subtitle={exerciseProgress.currentExerciseName}
        />
        
        {setProgress && setProgress.total > 0 && (
          <ProgressItem
            icon={FaRedo}
            label="Sets"
            current={setProgress.current}
            total={setProgress.total}
            percentage={setPercentage}
            colorScheme="green"
          />
        )}
        
        {repProgress && repProgress.total > 0 && (
          <ProgressItem
            icon={FaListOl}
            label="Reps"
            current={repProgress.current}
            total={repProgress.total}
            percentage={repPercentage}
            colorScheme="orange"
          />
        )}
      </HStack>
    );
  }

  // Vertical layout (default)
  return (
    <VStack spacing={3} width="100%" p={3} bg={bgColor} borderRadius="md">
      {blockProgress && blockProgress.total > 0 && (
        <ProgressItem
          icon={FaLayerGroup}
          label="Block Progress"
          current={blockProgress.current}
          total={blockProgress.total}
          percentage={blockPercentage}
          colorScheme="purple"
          subtitle={blockProgress.currentBlockName}
        />
      )}
      
      <ProgressItem
        icon={FaDumbbell}
        label="Exercise Progress"
        current={exerciseProgress.current}
        total={exerciseProgress.total}
        percentage={exercisePercentage}
        colorScheme="blue"
        subtitle={exerciseProgress.currentExerciseName}
      />
      
      {setProgress && setProgress.total > 0 && (
        <ProgressItem
          icon={FaRedo}
          label="Set Progress"
          current={setProgress.current}
          total={setProgress.total}
          percentage={setPercentage}
          colorScheme="green"
        />
      )}
      
      {repProgress && repProgress.total > 0 && (
        <ProgressItem
          icon={FaListOl}
          label="Rep Progress"
          current={repProgress.current}
          total={repProgress.total}
          percentage={repPercentage}
          colorScheme="orange"
        />
      )}
    </VStack>
  );
} 