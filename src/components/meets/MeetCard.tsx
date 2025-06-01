/**
 * Reusable MeetCard component for displaying track meet information
 */

import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Flex,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { FaCalendarAlt, FaMapMarkerAlt, FaRunning } from 'react-icons/fa';
import { TravelTimeDisplay } from '../TravelTimeDisplay';
import { 
  formatMeetDate, 
  generateMapsLink, 
  getStatusColor,
  formatDateRange,
  isMultiDayEvent 
} from '../../utils/meets';
import type { TrackMeet } from '../../types/meetTypes';

interface MeetCardProps {
  meet: TrackMeet;
  eventCount?: number;
  actionButtons?: React.ReactNode;
  children?: React.ReactNode;
  showTravelTime?: boolean;
}

export const MeetCard: React.FC<MeetCardProps> = ({
  meet,
  eventCount,
  actionButtons,
  children,
  showTravelTime = true
}) => {
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.300');
  const descriptionBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Card
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      p="0"
      bg={cardBg}
      borderWidth="1px" 
      borderColor={borderColor}
      _dark={{ bg: 'gray.800' }}
    >
      {/* Card header with gradient background */}
      <Box 
        bg="linear-gradient(135deg, #2B6CB0 0%, #4299E1 100%)" 
        py={4} 
        px={5}
        margin="0"
        width="100%"
        borderTopLeftRadius="inherit"
        borderTopRightRadius="inherit"
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="md" color="white">{meet.name}</Heading>
          <Badge 
            colorScheme={getStatusColor(meet.status)} 
            variant="solid" 
            px={2} 
            py={1} 
            borderRadius="md"
          >
            {meet.status || 'Upcoming'}
          </Badge>
        </Flex>
      </Box>
      
      {/* Card body */}
      <CardBody px={4} py={4} bg={cardBg} _dark={{ bg: 'gray.800' }}>
        <Flex justify="space-between" align="flex-start">
          <VStack align="start" spacing={4} flex="1">
            {/* Date Information */}
            <HStack spacing={2}>
              <FaCalendarAlt color="blue" />
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">
                  {isMultiDayEvent(meet.meet_date, meet.end_date) 
                    ? formatDateRange(meet.meet_date, meet.end_date)
                    : formatMeetDate(meet.meet_date)
                  }
                </Text>
                {isMultiDayEvent(meet.meet_date, meet.end_date) && (
                  <Text fontSize="sm" color="blue.600" fontWeight="medium">
                    Multi-day event
                  </Text>
                )}
              </VStack>
            </HStack>
            
            {/* Location Information */}
            {(meet.city || meet.state || meet.venue_name) && (
              <HStack spacing={2} align="start">
                <FaMapMarkerAlt color="blue" />
                <VStack align="start" spacing={1} flex="1">
                  {meet.venue_name && (
                    <Text fontWeight="medium">
                      {meet.venue_name}
                      {meet.venue_type && (
                        <Badge ml={2} colorScheme="purple" size="sm">
                          {meet.venue_type}
                        </Badge>
                      )}
                    </Text>
                  )}
                  {(meet.city || meet.state) && (
                    <Text fontSize="sm" color={mutedTextColor}>
                      {[meet.city, meet.state].filter(Boolean).join(', ')}
                    </Text>
                  )}
                  {/* Maps Link */}
                  {generateMapsLink(meet.venue_name, meet.city, meet.state) && (
                    <Button
                      as="a"
                      href={generateMapsLink(meet.venue_name, meet.city, meet.state)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      variant="outline"
                      colorScheme="green"
                      leftIcon={<FaMapMarkerAlt />}
                      mt={1}
                    >
                      Open in Maps
                    </Button>
                  )}
                  {/* Travel Time Display */}
                  {showTravelTime && (
                    <TravelTimeDisplay
                      city={meet.city}
                      state={meet.state}
                      venueName={meet.venue_name}
                      size="sm"
                    />
                  )}
                </VStack>
              </HStack>
            )}
            
            {/* Event Count */}
            {eventCount !== undefined && (
              <HStack spacing={2}>
                <FaRunning color="green" />
                <Text fontSize="sm" fontWeight="medium">
                  Events: <Text as="span" fontWeight="bold">{eventCount}</Text>
                </Text>
              </HStack>
            )}

            {/* Registration Link */}
            {meet.join_link && (
              <Button
                as="a"
                href={meet.join_link}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                variant="outline"
                colorScheme="blue"
                leftIcon={<FaCalendarAlt />}
              >
                Registration
              </Button>
            )}
            
            {/* Description */}
            {meet.description && (
              <Box 
                p={3} 
                bg={descriptionBg} 
                borderRadius="md" 
                borderLeft="4px solid" 
                borderLeftColor="blue.400"
                width="100%"
              >
                <Text fontSize="sm" color={mutedTextColor} lineHeight="1.5">
                  {meet.description}
                </Text>
              </Box>
            )}

            {/* Additional content */}
            {children}
          </VStack>
          
          {/* Action buttons */}
          {actionButtons && (
            <VStack spacing={2}>
              {actionButtons}
            </VStack>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
}; 