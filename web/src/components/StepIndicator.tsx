import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const inactiveColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const activeTextColor = useColorModeValue('gray.800', 'white');

  return (
    <Box width="100%" mb={6}>
      {/* Progress bar with circles and connecting lines */}
      <Flex mb={6} position="relative" width="100%">
        {/* Connecting line through all steps */}
        <Box 
          position="absolute" 
          height="3px" 
          bg={inactiveColor} 
          top="50%" 
          transform="translateY(-50%)" 
          left="0" 
          right="0" 
          zIndex={0}
        />
        
        {/* Active part of connecting line */}
        <Box 
          position="absolute" 
          height="3px" 
          bg={activeColor} 
          top="50%" 
          transform="translateY(-50%)" 
          left="0" 
          width={`${((currentStep - 1) / (totalSteps - 1)) * 100}%`}
          zIndex={0}
        />
        
        {/* Circles */}
        <Flex width="100%" justify="space-between" position="relative" zIndex={1}>
          {Array.from({ length: totalSteps }).map((_, index) => {
            const isActive = index + 1 <= currentStep;
            
            return (
              <Flex 
                key={index} 
                alignItems="center" 
                justifyContent="center" 
                borderRadius="50%" 
                bg={isActive ? activeColor : inactiveColor} 
                color="white" 
                width="32px" 
                height="32px" 
                fontSize="sm" 
                fontWeight="bold"
              >
                {index + 1}
              </Flex>
            );
          })}
        </Flex>
      </Flex>
      
      {/* Step labels */}
      <Flex justify="space-between" width="100%">
        {stepLabels.map((label, index) => {
          const isActive = index + 1 === currentStep;
          const isCompleted = index + 1 < currentStep;
          
          return (
            <Box 
              key={index} 
              width={`${100 / totalSteps}%`} 
              textAlign={index === 0 ? "left" : index === totalSteps - 1 ? "right" : "center"}
              pl={index === 0 ? 0 : 1}
              pr={index === totalSteps - 1 ? 0 : 1}
            >
              <Text
                fontSize={{ base: 'xs', sm: 'sm' }}
                fontWeight={isActive || isCompleted ? 'medium' : 'normal'}
                color={isActive ? activeTextColor : textColor}
                noOfLines={2}
              >
                {label}
              </Text>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
} 