import React from 'react';
import {
  Box, Card, CardBody, Flex, Heading, Icon, Tag, Text, VStack, Button, HStack, useColorModeValue
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import type { CardProps } from '@chakra-ui/react';

// Helper function to format date
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateStr;
  }
}

// Meet event interface
interface MeetEvent {
  id: string;
  event_name: string;
  meet_id: string;
}

// Track meet interface
interface TrackMeet {
  id: string;
  name: string;
  meet_date?: string;
  city?: string;
  state?: string;
  status?: string;
  assigned_events?: MeetEvent[];
  total_events?: number;
  assigned_events_count?: number;
}

interface TrackMeetsCardProps extends CardProps {
  trackMeets: TrackMeet[];
  coachMeets: TrackMeet[];
  isLoading?: boolean;
  viewAllLink?: string;
}

const TrackMeetsCard: React.FC<TrackMeetsCardProps> = ({
  trackMeets = [],
  coachMeets = [],
  isLoading = false,
  viewAllLink = "/athlete/events",
  ...rest
}) => {
  const iconBg = useColorModeValue('white', 'gray.800');
  const headerGradient = useColorModeValue(
    'linear-gradient(135deg, #2B6CB0 0%, #4299E1 100%)',
    'linear-gradient(135deg, #1A365D 0%, #2A4365 100%)'
  );
  
  return (
    <Card 
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="md"
      p="0"
      height="100%"
      display="flex"
      flexDirection="column"
      bg={useColorModeValue('white', 'gray.800')}
      borderWidth="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      {...rest}
    >
      {/* Header */}
      <Box 
        h="80px" 
        bg={headerGradient}
        position="relative"
        display="flex"
        alignItems="center"
        px={6}
        margin="0"
        width="100%"
        borderTopLeftRadius="inherit"
        borderTopRightRadius="inherit"
      >
        <Flex 
          bg={iconBg} 
          borderRadius="full" 
          w="50px" 
          h="50px" 
          justifyContent="center" 
          alignItems="center"
          boxShadow="none"
          mr={4}
        >
          <Icon as={FaMapMarkerAlt} w={6} h={6} color="blue.500" />
        </Flex>
        <Tag
          size="lg"
          variant="subtle"
          bg="whiteAlpha.300"
          color="white"
          fontWeight="bold"
          px={4}
          py={2}
          borderRadius="md"
        >
          TRACK MEETS
        </Tag>
      </Box>
      <CardBody px={4} py={4} display="flex" flexDirection="column" flex="1" bg={useColorModeValue('white', 'gray.800')} borderRadius="inherit">
        {trackMeets.length === 0 && coachMeets.length === 0 ? (
          <VStack spacing={4} py={4} flex="1" justifyContent="center">
            <Text color={useColorModeValue('gray.700', 'gray.200')}>No upcoming track meets found.</Text>
            <Box mt="auto" width="100%">
              <Button 
                as={RouterLink}
                to={viewAllLink}
                variant="primary"
                size="md"
                leftIcon={<FaCalendarAlt />}
                width="full"
              >
                View All Track Meets
              </Button>
            </Box>
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch" height="100%">
            <Box flex="1">
              {/* Show athlete's track meets */}
              {trackMeets.length > 0 && (
                <>
                  <Heading size="sm" color={useColorModeValue('gray.800', 'gray.100')}>My Track Meets</Heading>
                  {trackMeets.slice(0, 2).map(meet => (
                    <Box key={meet.id} width="100%" p={2} borderWidth="1px" borderRadius="md" mt={2} borderColor={useColorModeValue('gray.200', 'gray.700')} bg={useColorModeValue('gray.50', 'gray.700')}>
                      <Flex justify="space-between" align="center">
                        <Heading size="xs" color={useColorModeValue('gray.800', 'gray.100')}>{meet.name}</Heading>
                        <Tag size="sm" colorScheme={
                          meet.status === 'Completed' ? 'green' : 
                          meet.status === 'Cancelled' ? 'red' : 'blue'
                        }>
                          {meet.status}
                        </Tag>
                      </Flex>
                      <Text fontSize="sm" mt={1} color={useColorModeValue('gray.700', 'gray.300')}>
                        {formatDate(meet.meet_date)}
                      </Text>
                      {meet.city && meet.state && (
                        <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                          {meet.city}, {meet.state}
                        </Text>
                      )}
                      {/* Display assigned events */}
                      {meet.assigned_events && meet.assigned_events.length > 0 && (
                        <Box mt={2}>
                          <Text fontSize="xs" fontWeight="medium" color={useColorModeValue('blue.700', 'blue.200')}>
                            Your events: {meet.assigned_events_count} of {meet.total_events}
                          </Text>
                          <Flex flexWrap="wrap" mt={1} gap={1}>
                            {meet.assigned_events.slice(0, 3).map((event) => (
                              <Tag key={event.id} size="sm" variant="subtle" colorScheme="blue" fontSize="xs">
                                {event.event_name}
                              </Tag>
                            ))}
                            {meet.assigned_events.length > 3 && (
                              <Tag size="sm" variant="subtle" colorScheme="gray" fontSize="xs">
                                +{meet.assigned_events.length - 3} more
                              </Tag>
                            )}
                          </Flex>
                        </Box>
                      )}
                    </Box>
                  ))}
                </>
              )}
              
              {/* Show coach's track meets */}
              {coachMeets.length > 0 && (
                <>
                  <Heading size="sm" mt={trackMeets.length > 0 ? 2 : 0} color={useColorModeValue('gray.800', 'gray.100')}>Coach's Meets</Heading>
                  {coachMeets.slice(0, 2).map(meet => (
                    <Box key={meet.id} width="100%" p={2} borderWidth="1px" borderRadius="md" mt={2} borderColor={useColorModeValue('gray.200', 'gray.700')} bg={useColorModeValue('gray.50', 'gray.700')}>
                      <Flex justify="space-between" align="center">
                        <Heading size="xs" color={useColorModeValue('gray.800', 'gray.100')}>{meet.name}</Heading>
                        <Tag size="sm" colorScheme={
                          meet.status === 'Completed' ? 'green' : 
                          meet.status === 'Cancelled' ? 'red' : 'blue'
                        }>
                          {meet.status}
                        </Tag>
                      </Flex>
                      <Text fontSize="sm" mt={1} color={useColorModeValue('gray.700', 'gray.300')}>
                        {formatDate(meet.meet_date)}
                      </Text>
                      {meet.city && meet.state && (
                        <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                          {meet.city}, {meet.state}
                        </Text>
                      )}
                      {/* Display assigned events */}
                      {meet.assigned_events && meet.assigned_events.length > 0 && (
                        <Box mt={2}>
                          <Text fontSize="xs" fontWeight="medium" color={useColorModeValue('blue.700', 'blue.200')}>
                            Your events: {meet.assigned_events_count} of {meet.total_events}
                          </Text>
                          <Flex flexWrap="wrap" mt={1} gap={1}>
                            {meet.assigned_events.slice(0, 3).map((event) => (
                              <Tag key={event.id} size="sm" variant="subtle" colorScheme="blue" fontSize="xs">
                                {event.event_name}
                              </Tag>
                            ))}
                            {meet.assigned_events.length > 3 && (
                              <Tag size="sm" variant="subtle" colorScheme="gray" fontSize="xs">
                                +{meet.assigned_events.length - 3} more
                              </Tag>
                            )}
                          </Flex>
                        </Box>
                      )}
                    </Box>
                  ))}
                </>
              )}
            </Box>
            
            <Box mt="auto" width="100%">
              <Button 
                as={RouterLink}
                to={viewAllLink}
                variant="primary"
                size="md"
                width="full"
                leftIcon={<FaCalendarAlt />}
              >
                View All Track Meets
              </Button>
            </Box>
          </VStack>
        )}
      </CardBody>
    </Card>
  );
};

export default TrackMeetsCard; 