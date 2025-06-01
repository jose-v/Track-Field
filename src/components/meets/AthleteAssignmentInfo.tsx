/**
 * Component for displaying athlete assignment information
 */

import React from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import { FaRunning } from 'react-icons/fa';
import { getDisplayedAthletes } from '../../utils/meets';
import type { AthleteWithName } from '../../types/meetTypes';

interface AthleteAssignmentInfoProps {
  assignedByCoach?: string;
  athletes?: AthleteWithName[];
  maxDisplayed?: number;
}

export const AthleteAssignmentInfo: React.FC<AthleteAssignmentInfoProps> = ({
  assignedByCoach,
  athletes = [],
  maxDisplayed = 3
}) => {
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');

  if (!assignedByCoach && athletes.length === 0) {
    return null;
  }

  return (
    <VStack align="start" spacing={3}>
      {/* Coach Assignment Info */}
      {assignedByCoach && (
        <HStack align="start">
          <Box color="green.500" mt={1}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </Box>
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium" color="green.600">
              Assigned by Coach
            </Text>
            <Text fontSize="sm" color={mutedTextColor}>
              {assignedByCoach}
            </Text>
          </VStack>
        </HStack>
      )}

      {/* Athletes Attending */}
      {athletes.length > 0 && (
        <HStack align="start" spacing={2}>
          <FaRunning color="orange" />
          <VStack align="start" spacing={1} flex="1">
            <Text fontWeight="medium" color="orange.600">
              Athletes Attending ({athletes.length})
            </Text>
            <Box>
              {(() => {
                const { displayed, overflow } = getDisplayedAthletes(athletes, maxDisplayed);
                return (
                  <>
                    {displayed.map((athlete) => (
                      <Badge 
                        key={athlete.id} 
                        colorScheme="orange" 
                        variant="outline" 
                        mr={2} 
                        mb={1}
                        size="sm"
                      >
                        {athlete.first_name} {athlete.last_name}
                      </Badge>
                    ))}
                    {overflow > 0 && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        +{overflow} more athlete{overflow !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </>
                );
              })()}
            </Box>
          </VStack>
        </HStack>
      )}
    </VStack>
  );
}; 