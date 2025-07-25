import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  IconButton,
  Button,
  Badge,
  useColorModeValue,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Divider,
} from '@chakra-ui/react';
import { FaTimes, FaCalendarAlt, FaShare, FaMapMarkerAlt, FaExternalLinkAlt, FaClock } from 'react-icons/fa';
import { BsThreeDots } from 'react-icons/bs';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface MobileEventCardProps {
  onEventClick?: () => void;
}

interface AthleteEvent {
  id: string;
  meet_id: string;
  meet_name: string;
  meet_date: string;
  location: string;
  event_name: string;
  description: string;
  registration_deadline: string;
  entry_deadline_date: string;
  venue_name: string;
  venue_type: string;
  event_day: number | null;
  event_type: string;
  start_time: string;
}

interface UpcomingEvent {
  id: string;
  date: string;
  title: string;
  location?: string;
  entryDeadline?: string;
  events?: AthleteEvent[];
  venue?: string;
  address?: string;
}

export const MobileEventCard: React.FC<MobileEventCardProps> = ({ onEventClick }) => {
  const [upcomingEvent, setUpcomingEvent] = useState<UpcomingEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dark theme colors to match screenshot
  const cardBg = 'gray.800';
  const textColor = 'white';
  const iconColor = 'white';
  const badgeBg = 'gray.600';
  
  // Drawer colors
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');
  const drawerText = useColorModeValue('gray.700', 'gray.200');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');

  useEffect(() => {
    const fetchAthleteEvents = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch athlete events from database using the same pattern as MobileCalendar
        const { data: eventAssignments, error } = await supabase
          .from('athlete_meet_events')
          .select(`
            meet_event_id,
            meet_events (
              id,
              meet_id,
              event_name,
              event_day,
              event_type,
              start_time,
              track_meets (
                id,
                name,
                meet_date,
                city,
                state,
                description,
                registration_deadline,
                entry_deadline_date,
                venue_name,
                venue_type
              )
            )
          `)
          .eq('athlete_id', user.id);

        if (error) {
          console.error('Error fetching athlete events:', error);
          setUpcomingEvent(null);
          return;
        }

        if (eventAssignments && eventAssignments.length > 0) {
          // Map the database results to athlete events
          const athleteEvents: AthleteEvent[] = eventAssignments.map(item => {
            const meetEvent = item.meet_events as any;
            const trackMeet = meetEvent?.track_meets as any;
            return {
              id: meetEvent?.id || '',
              meet_id: meetEvent?.meet_id || '',
              meet_name: trackMeet?.name || 'Unknown Meet',
              meet_date: trackMeet?.meet_date || '',
              location: `${trackMeet?.city || ''}, ${trackMeet?.state || ''}`.trim() || 'Unknown Location',
              event_name: meetEvent?.event_name || 'Unknown Event',
              description: trackMeet?.description || '',
              registration_deadline: trackMeet?.registration_deadline || '',
              entry_deadline_date: trackMeet?.entry_deadline_date || '',
              venue_name: trackMeet?.venue_name || '',
              venue_type: trackMeet?.venue_type || '',
              event_day: meetEvent?.event_day || null,
              event_type: meetEvent?.event_type || '',
              start_time: meetEvent?.start_time || ''
            };
          });

          // Filter to upcoming events (future dates)
          const currentDate = new Date();
          const upcomingEvents = athleteEvents.filter(event => 
            new Date(event.meet_date) >= currentDate
          ).sort((a, b) => new Date(a.meet_date).getTime() - new Date(b.meet_date).getTime());

          if (upcomingEvents.length > 0) {
            // Group events by meet and get the next upcoming meet
            const nextMeet = upcomingEvents[0];
            const nextMeetEvents = upcomingEvents.filter(event => 
              event.meet_id === nextMeet.meet_id
            );

            // Format the upcoming event for display
            const formattedEvent: UpcomingEvent = {
              id: nextMeet.meet_id,
              date: formatEventDate(nextMeet.meet_date),
              title: nextMeet.meet_name,
              location: nextMeet.location,
              entryDeadline: nextMeet.entry_deadline_date ? formatEventDate(nextMeet.entry_deadline_date) : undefined,
              events: nextMeetEvents,
              venue: nextMeet.venue_name,
              address: nextMeet.location // Could be enhanced with full address if available
            };

            setUpcomingEvent(formattedEvent);
          } else {
            setUpcomingEvent(null);
          }
        } else {
          setUpcomingEvent(null);
        }
      } catch (error) {
        console.error('Error fetching athlete events:', error);
        setUpcomingEvent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAthleteEvents();
  }, [user]);

  // Function to format date if needed
  const formatEventDate = (dateStr: string): string => {
    // If the date is already in the desired format, return as is
    if (dateStr.includes(',')) return dateStr;
    
    // Otherwise, try to format it
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Function to format individual event date in mm/dd format
  const formatEventDateShort = (meetDate: string, eventDay?: number | null): string => {
    try {
      const baseDate = new Date(meetDate);
      if (eventDay && eventDay > 1) {
        // Add days if event is on day 2, 3, etc.
        baseDate.setDate(baseDate.getDate() + (eventDay - 1));
      }
      
      return baseDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Function to handle location click - opens map app
  const handleLocationClick = () => {
    if (upcomingEvent?.address) {
      const encodedAddress = encodeURIComponent(upcomingEvent.address);
      // Try to open in native map app first, fallback to Google Maps
      const mapUrl = `https://maps.apple.com/?q=${encodedAddress}`;
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      
      // For iOS devices, try Apple Maps first
      if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        window.location.href = mapUrl;
      } else {
        window.open(googleMapsUrl, '_blank');
      }
    }
    setIsDrawerOpen(false);
  };

  // Function to handle view event details
  const handleViewEventDetails = () => {
    navigate('/athlete/meets');
    setIsDrawerOpen(false);
  };

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        boxShadow="lg"
        h="160px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={textColor} fontSize="sm">
          Loading events...
        </Text>
      </Box>
    );
  }

  if (!upcomingEvent) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        boxShadow="lg"
        h="160px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color={textColor} fontSize="sm">
          No upcoming events
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        boxShadow="lg"
        h="160px"
        cursor="pointer"
        onClick={onEventClick}
        transition="all 0.2s"
        position="relative"
      >
        <VStack spacing={4} align="stretch" height="100%" justify="space-between">
          {/* Top Row: Next Meet badge and Date */}
          <HStack justify="space-between" align="flex-start">
            <Badge
              bg={badgeBg}
              color={textColor}
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="lg"
              fontWeight="normal"
            >
              Next Meet
            </Badge>
            <Text 
              fontSize="sm" 
              fontWeight="normal" 
              color={textColor}
              textAlign="right"
              lineHeight="1.2"
            >
              {formatEventDate(upcomingEvent.date)}
            </Text>
          </HStack>

          {/* Center: Event Title */}
          <Flex flex="1" align="center" justify="center">
            <VStack spacing={1} textAlign="center">
              <Text 
                fontSize="xl" 
                fontWeight="bold" 
                color={textColor}
                lineHeight="1.3"
                textAlign="center"
                noOfLines={2}
              >
                {upcomingEvent.title}
              </Text>
            </VStack>
          </Flex>

          {/* Bottom Row: Three dots menu */}
          <Box position="absolute" bottom={4} right={4}>
            <IconButton
              aria-label="Menu"
              icon={<Icon as={BsThreeDots} />}
              w="38px"
              h="38px"
              variant="ghost"
              color={textColor}
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click when clicking menu
                setIsDrawerOpen(true);
              }}
              _hover={{ bg: 'gray.700' }}
            />
          </Box>
        </VStack>
      </Box>
      
      {/* Bottom Drawer Menu */}
      <Modal 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        motionPreset="slideInBottom"
        closeOnOverlayClick={true}
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent 
          position="fixed"
                      bottom="-12px"
          left="0"
          right="0"
          top="auto"
          height="auto"
          maxHeight="75vh"
          minHeight="300px"
          borderRadius="16px 16px 0 0"
          bg={drawerBg}
          border={`1px solid ${drawerBorder}`}
          boxShadow="2xl"
          margin="0"
          maxWidth="100vw"
          width="100vw"
          display="flex"
          flexDirection="column"
          paddingBottom="5px"
        >
          <ModalBody p={0} display="flex" flexDirection="column" overflowY="auto">
            {/* Header */}
            <Flex 
              justify="space-between" 
              align="center" 
              p={6} 
              borderBottom={`1px solid ${drawerBorder}`}
              flexShrink={0}
            >
              <Text fontSize="xl" fontWeight="bold" color={drawerText}>
                {upcomingEvent?.title || 'Event Details'}
              </Text>
              
              {/* Close Button */}
              <IconButton
                aria-label="Close menu"
                icon={<FaTimes />}
                size="lg"
                variant="ghost"
                borderRadius="full"
                onClick={() => setIsDrawerOpen(false)}
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                fontSize="18px"
              />
            </Flex>

            {/* Event Information */}
            <VStack spacing={4} align="stretch" p={6} pb={8}>
              {/* Top Section - 2 Columns */}
              <HStack spacing={6} align="start">
                {/* Left Column */}
                <VStack flex="1" spacing={4} align="stretch">
                  {/* Event Date */}
                  <HStack spacing={3}>
                    <Icon as={FaCalendarAlt} color="white" boxSize={5} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium" color={drawerText}>
                        Event Date
                      </Text>
                      <Text fontSize="md" color={drawerText}>
                        {upcomingEvent?.date}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Entry Deadline */}
                  {upcomingEvent?.entryDeadline && (
                    <HStack spacing={3}>
                      <Icon as={FaClock} color="white" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium" color={drawerText}>
                          Entry Deadline
                        </Text>
                        <Text fontSize="md" color={drawerText}>
                          {upcomingEvent.entryDeadline}
                        </Text>
                      </VStack>
                    </HStack>
                  )}
                </VStack>

                {/* Right Column - Your Events */}
                <VStack flex="1" align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="medium" color={drawerText}>
                    Your Events
                  </Text>
                  {upcomingEvent?.events && upcomingEvent.events.length > 0 && (
                    <VStack align="start" spacing={1} pl={0}>
                      {upcomingEvent.events.map((event, index) => {
                        const eventDate = formatEventDateShort(event.meet_date, event.event_day);
                        return (
                          <Text key={index} fontSize="md" color={drawerText}>
                            {eventDate} {event.event_name}
                          </Text>
                        );
                      })}
                    </VStack>
                  )}
                </VStack>
              </HStack>

              <Divider />

              {/* Action Buttons */}
              <VStack spacing={2} align="stretch">
                {/* View Event Details */}
                <Button
                  leftIcon={<Icon as={FaCalendarAlt} color="white" />}
                  variant="ghost"
                  size="lg"
                  justifyContent="flex-start"
                  h="50px"
                  color={drawerText}
                  _hover={{ bg: buttonHoverBg }}
                  onClick={handleViewEventDetails}
                >
                  View Event Details
                </Button>
                
                {/* Show Location */}
                <Button
                  leftIcon={<Icon as={FaMapMarkerAlt} color="white" />}
                  variant="ghost"
                  size="lg"
                  justifyContent="flex-start"
                  h="50px"
                  color={drawerText}
                  _hover={{ bg: buttonHoverBg }}
                  onClick={handleLocationClick}
                >
                  Show Location
                </Button>
                
                {/* Share Event */}
                <Button
                  leftIcon={<Icon as={FaShare} color="white" />}
                  variant="ghost"
                  size="lg"
                  justifyContent="flex-start"
                  h="50px"
                  color={drawerText}
                  _hover={{ bg: buttonHoverBg }}
                  onClick={() => {
                    setIsDrawerOpen(false);
                    // Add share functionality here
                  }}
                >
                  Share Event
                </Button>
              </VStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}; 