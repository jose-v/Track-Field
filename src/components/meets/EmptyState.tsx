/**
 * Reusable empty state component for meets and events
 */

import React from 'react';
import {
  Box,
  Text,
  VStack,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  suggestions?: string[];
  debugInfo?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  suggestions = [],
  debugInfo
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');
  const descriptionBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box p={6} bg={cardBg} borderRadius="lg" shadow="md" textAlign="center">
      <VStack spacing={4}>
        <Text fontSize="lg" fontWeight="medium">
          {title}
        </Text>
        
        <Text color={mutedTextColor}>
          {description}
        </Text>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <VStack spacing={2}>
            <Text fontSize="sm" color={mutedTextColor}>
              This could be because:
            </Text>
            <VStack spacing={1} fontSize="sm" color={mutedTextColor} align="start">
              {suggestions.map((suggestion, index) => (
                <Text key={index}>• {suggestion}</Text>
              ))}
            </VStack>
          </VStack>
        )}

        {/* Action button */}
        {actionLabel && onAction && (
          <Button 
            leftIcon={<FaPlus />} 
            colorScheme="blue" 
            onClick={onAction}
            mt={4}
          >
            {actionLabel}
          </Button>
        )}

        {/* Debug info */}
        {debugInfo && (
          <Box 
            mt={4} 
            p={3} 
            bg={descriptionBg} 
            borderRadius="md" 
            fontSize="xs" 
            color={mutedTextColor}
            textAlign="left"
            width="100%"
          >
            {debugInfo}
          </Box>
        )}
      </VStack>
    </Box>
  );
}; 