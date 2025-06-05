/**
 * Meets page with minimalist wireframe design
 * Supports both coach and athlete views with real data
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  Badge,
  Link,
  Tooltip,
  IconButton,
  useColorModeValue,
  Flex,
  Grid,
  useDisclosure,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  SimpleGrid,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerFooter,
  CheckboxGroup,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormErrorMessage,
  Icon
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaCar, 
  FaPlane, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaExternalLinkAlt,
  FaEdit,
  FaTrash,
  FaUsers,
  FaRunning,
  FaStickyNote,
  FaCog,
  FaEllipsisV,
  FaFileAlt,
  FaPlus,
  FaChalkboardTeacher,
  FaPhoneAlt,
  FaAt,
  FaBed,
  FaGlobe,
  FaUserTie
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { MeetFormDrawer, type TrackMeetFormData, type TrackMeetData } from '../components/meets/MeetFormDrawer';
import type { TrackMeet } from '../types/trackMeets';
import { useForm } from 'react-hook-form';
import type { MeetEventFormData } from '../types/trackMeets';
import { calculateTravelTimes, getUserLocation, geocodeLocation, geocodeLocationFallback } from '../services/travelTime';
import { LocationSetup } from '../components/LocationSetup';
import { CurrentLocationDisplay } from '../components/CurrentLocationDisplay';
import { RunTimeModal } from '../components/meets/RunTimeModal';

// Info Badge Component - Shows database stats
const InfoBadge: React.FC<{ children: React.ReactNode; count?: number }> = ({ children, count }) => (
  <Text
    fontSize="xs"
    fontWeight="medium"
    color="white"
    bg="#1A202C"
    px={3}
    py={2}
    borderRadius="md"
  >
    {children} {count !== undefined && `(${count})`}
  </Text>
);

// Custom Travel Time Component for Dark Theme
const TravelTimeForMeetsCard: React.FC<{ 
  city?: string; 
  state?: string; 
  venueName?: string; 
}> = ({ city, state, venueName }) => {
  const [travelTimes, setTravelTimes] = useState<{driving: string; flying: string; distance: number} | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculateTimes = async () => {
      if (!city && !state && !venueName) return;
      
      setLoading(true);
      try {
        // Get user location directly from localStorage instead of using the hook
        let userLocation = null;
        try {
          const stored = localStorage.getItem('userHomeLocation');
          userLocation = stored ? JSON.parse(stored) : null;
        } catch (error) {
          console.warn('Failed to get home location:', error);
        }
        
        // If no stored location, try to get current location
        if (!userLocation) {
          try {
            userLocation = await getUserLocation();
            if (!userLocation) {
              setLoading(false);
              return;
            }
          } catch (err) {
            setLoading(false);
            return;
          }
        }
        
        const destParts = [venueName, city, state].filter(Boolean);
        const destinationQuery = destParts.join(', ');
        let destinationLocation = await geocodeLocation(destinationQuery);
        
        if (!destinationLocation) {
          destinationLocation = await geocodeLocationFallback(destinationQuery);
        }
        
        if (destinationLocation) {
          const times = calculateTravelTimes(userLocation, destinationLocation);
          setTravelTimes(times);
        }
      } catch (error) {
        console.error('Travel time calculation error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    calculateTimes();
  }, [city, state, venueName]);

  if (loading) {
    return (
      <VStack align="start" spacing={2} color="white">
        <HStack spacing={2}>
          <Spinner size="xs" color="white" />
          <Text fontSize="md" color="white">Calculating...</Text>
        </HStack>
      </VStack>
    );
  }

  if (!travelTimes) {
    return (
      <VStack align="start" spacing={2} color="white">
        <HStack spacing={2}>
          <FaCar size={20} color="currentColor" />
          <Text fontSize="md" color="white">Distance TBD</Text>
        </HStack>
        <HStack spacing={2}>
          <FaPlane size={20} color="currentColor" />
          <Text fontSize="md" color="white">Flight TBD</Text>
        </HStack>
      </VStack>
    );
  }

  return (
    <VStack align="start" spacing={2} color="white">
      <HStack spacing={2}>
        <FaCar size={20} color="currentColor" />
        <Text fontSize="md" color="white" fontWeight="medium">{travelTimes.driving}</Text>
      </HStack>
      {travelTimes.distance > 100 && (
        <HStack spacing={2}>
          <FaPlane size={20} color="currentColor" />
          <Text fontSize="md" color="white" fontWeight="medium">{travelTimes.flying}</Text>
        </HStack>
      )}
    </VStack>
  );
};

// Individual Meet Card Component - moved outside main component to prevent re-creation
interface MeetCardProps {
  meet: TrackMeet;
  isCoach: boolean;
  onEdit?: (meet: TrackMeet) => void;
  onDelete?: (meet: TrackMeet) => void;
  onAssignAthletes?: (meet: TrackMeet) => void;
  onManageEvents?: (meet: TrackMeet) => void;
  onOpenRunTimeModal?: (eventData: { eventId: string; eventName: string; currentTime?: string }) => void;
  athleteCount?: number;
  eventCount?: number;
  athleteNames?: string[];
  myAssignedEvents?: Array<{ id: string; name: string; time: string | null }>;
  assignedByCoach?: string | null;
  coachPhone?: string | null;
  coachEmail?: string | null;
  // Assistant coaches
  assistantCoach1Name?: string | null;
  assistantCoach1Phone?: string | null;
  assistantCoach1Email?: string | null;
  assistantCoach2Name?: string | null;
  assistantCoach2Phone?: string | null;
  assistantCoach2Email?: string | null;
  assistantCoach3Name?: string | null;
  assistantCoach3Phone?: string | null;
  assistantCoach3Email?: string | null;
  distance?: string;
}

const MeetCard: React.FC<MeetCardProps> = ({ 
  meet, 
  isCoach, 
  onEdit, 
  onDelete, 
  onAssignAthletes, 
  onManageEvents, 
  onOpenRunTimeModal,
  athleteCount = 0, 
  eventCount = 0, 
  athleteNames = [], 
  myAssignedEvents = [],
  assignedByCoach = null,
  coachPhone = null,
  coachEmail = null,
  assistantCoach1Name = null,
  assistantCoach1Phone = null,
  assistantCoach1Email = null,
  assistantCoach2Name = null,
  assistantCoach2Phone = null,
  assistantCoach2Email = null,
  assistantCoach3Name = null,
  assistantCoach3Phone = null,
  assistantCoach3Email = null,
  distance 
}) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle hover with delay
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowToolbar(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowToolbar(false);
    }, 100);
    setHoverTimeout(timeout);
  };

  const generateMapsLink = () => {
    const query = `${meet.venue_name || 'Venue TBD'}, ${[meet.city, meet.state].filter(Boolean).join(', ')}`;
    return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const assignDrawerHeaderBg = useColorModeValue('green.50', 'green.900');
  const assignDrawerHeaderColor = useColorModeValue('green.700', 'green.200');

  return (
    <Box
      bg="gray.800"
      borderRadius="2xl"
      shadow="2xl"
      w="full"
      p={8}
      position="relative"
      border="1px solid"
      borderColor="gray.700"
      mb={6}
    >
      {/* Individual Meet Badges */}
      <HStack spacing={3} mb={4}>
        {/* Status Badge */}
        <InfoBadge>
          {meet.status?.toUpperCase() || 'PLANNED'}
        </InfoBadge>
        
        {/* Venue Type Badge */}
        {meet.venue_type && (
          <InfoBadge>
            {meet.venue_type.toUpperCase()}
          </InfoBadge>
        )}
        
        {/* Multi-day Event Badge */}
        <InfoBadge>
          {meet.end_date && meet.end_date !== meet.meet_date ? 'MULTI-DAY' : 'SINGLE DAY'}
        </InfoBadge>
      </HStack>

      {/* Top Right: Coach-only toolbar */}
      {isCoach && (
        <Box 
          position="absolute" 
          top={6} 
          right={6}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Invisible extended hover area */}
          {showToolbar && (
            <Box
              position="absolute"
              top="-60px"
              right="-10px"
              width="120px"
              height="80px"
              zIndex={999}
            />
          )}

          {/* Hover Toolbar */}
          {showToolbar && (
            <Box
              position="absolute"
              bottom="100%"
              right="0"
              mb={3}
              zIndex={1000}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <HStack 
                spacing={4}
                bg="gray.600"
                px={4}
                py={3}
                borderRadius="xl"
                border="2px solid"
                borderColor="gray.500"
                shadow="xl"
              >
                {/* Assign Athletes */}
                <Tooltip label="Assign athletes to events" placement="top" bg="gray.700" color="white" p={2}>
                  <IconButton
                    icon={<FaUsers size={22} color="currentColor" />}
                    variant="ghost"
                    size="lg"
                    color="white"
                    _hover={{ color: "gray.300" }}
                    aria-label="Assign athletes"
                    onClick={() => onAssignAthletes?.(meet)}
                  />
                </Tooltip>

                {/* Manage Events */}
                <Tooltip label="Manage events" placement="top" bg="gray.700" color="white" p={2}>
                  <IconButton
                    icon={<FaRunning size={22} color="currentColor" />}
                    variant="ghost"
                    size="lg"
                    color="white"
                    _hover={{ color: "gray.300" }}
                    aria-label="Manage events"
                    onClick={() => onManageEvents?.(meet)}
                  />
                </Tooltip>

                {/* Divider */}
                <Box w="1px" h="6" bg="gray.400" />

                {/* Edit */}
                <Tooltip label="Edit meet details" placement="top" bg="gray.700" color="white" p={2}>
                  <IconButton
                    icon={<FaEdit size={22} color="currentColor" />}
                    variant="ghost"
                    size="lg"
                    color="white"
                    _hover={{ color: "gray.300" }}
                    aria-label="Edit meet"
                    onClick={() => onEdit?.(meet)}
                  />
                </Tooltip>

                {/* Delete */}
                <Tooltip label="Delete this meet" placement="top" bg="gray.700" color="white" p={2}>
                  <IconButton
                    icon={<FaTrash size={22} color="red.400" />}
                    variant="ghost"
                    size="lg"
                    color="red.400"
                    _hover={{ color: "red.300" }}
                    aria-label="Delete meet"
                    onClick={() => onDelete?.(meet)}
                  />
                </Tooltip>
              </HStack>
            </Box>
          )}

          {/* 3 Dots Button */}
          <IconButton
            icon={<FaEllipsisV size={18} />}
            variant="ghost"
            size="sm"
            color="white"
            bg="gray.700"
            _hover={{ color: "white", bg: "gray.600" }}
            aria-label="Options"
          />
        </Box>
      )}

      {/* Top Right: Athlete-only toolbar */}
      {!isCoach && (
        <Box 
          position="absolute" 
          top={6} 
          right={6}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Invisible extended hover area */}
          {showToolbar && (
            <Box
              position="absolute"
              top="-60px"
              right="-10px"
              width="80px"
              height="80px"
              zIndex={999}
            />
          )}

          {/* Hover Toolbar */}
          {showToolbar && (
            <Box
              position="absolute"
              bottom="100%"
              right="0"
              mb={3}
              zIndex={1000}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <HStack 
                spacing={4}
                bg="gray.600"
                px={4}
                py={3}
                borderRadius="xl"
                border="2px solid"
                borderColor="gray.500"
                shadow="xl"
              >
                {/* Edit */}
                <Tooltip label="Edit meet details" placement="top" bg="gray.700" color="white" p={2}>
                  <IconButton
                    icon={<FaEdit size={22} color="currentColor" />}
                    variant="ghost"
                    size="lg"
                    color="white"
                    _hover={{ color: "gray.300" }}
                    aria-label="Edit meet"
                    onClick={() => onEdit?.(meet)}
                  />
                </Tooltip>
              </HStack>
            </Box>
          )}

          {/* 3 Dots Button */}
          <IconButton
            icon={<FaEllipsisV size={18} />}
            variant="ghost"
            size="sm"
            color="white"
            bg="gray.700"
            _hover={{ color: "white", bg: "gray.600" }}
            aria-label="Options"
          />
        </Box>
      )}

      {/* Event Title */}
      <Heading size="lg" fontWeight="bold" mb={6} color="white" noOfLines={1}>
        {meet.name}
      </Heading>

      {/* 3-Column Layout */}
      <Grid templateColumns="40% 30% 30%" gap={8} color="white" alignItems="end" minH="120px">
        {/* Column 1: Event Info */}
        <VStack align="start" spacing={3} pr={6}>
          {/* Date */}
          <HStack spacing={2} color="white">
            <FaCalendarAlt size={20} color="currentColor" />
            <Text fontSize="md" color="white">
              {formatDate(meet.meet_date)}
            </Text>
          </HStack>

          {/* Location */}
          <HStack spacing={2} color="white" align="start">
            <FaMapMarkerAlt size={20} color="currentColor" />
            <VStack align="start" spacing={1}>
              <Text fontSize="md" color="white">{meet.venue_name || "Venue TBD"}</Text>
              <HStack spacing={2}>
                <Text fontSize="md" color="white">—</Text>
                <Text fontSize="md" color="white">
                  {[meet.city, meet.state].filter(Boolean).join(', ') || "Location TBD"}
                </Text>
                {meet.venue_name && (
                  <Link
                    href={generateMapsLink()}
                    isExternal
                    color="blue.400"
                    _hover={{ color: "blue.200" }}
                  >
                    <FaExternalLinkAlt size={13} color="currentColor" />
                  </Link>
                )}
              </HStack>
            </VStack>
          </HStack>
        </VStack>

        {/* Column 2: Travel & Registration */}
        <VStack align="start" spacing={4} borderX="1px solid" borderColor="gray.700" px={8}>
          <TravelTimeForMeetsCard
            city={meet.city}
            state={meet.state}
            venueName={meet.venue_name}
          />

          {/* Registration */}
          <HStack spacing={2} color="white">
            <FaFileAlt size={20} color="currentColor" />
            {meet.join_link ? (
              <Link
                href={meet.join_link}
                isExternal
                color="white"
                _hover={{ color: "gray.300" }}
                fontSize="md"
                fontWeight="medium"
              >
                Registration
              </Link>
            ) : (
              <Text fontSize="md" color="gray.400">No Registration</Text>
            )}
          </HStack>
        </VStack>

        {/* Column 3: Info Panel */}
        <VStack spacing={4} align="start" pl={0}>
          {/* Notes */}
          <Tooltip 
            label={meet.description || "No notes"} 
            placement="top"
            bg="gray.600"
            color="white"
            p={3}
            borderRadius="md"
            fontSize="sm"
          >
            <HStack spacing={2} color="white" cursor="pointer">
              <FaStickyNote size={20} color="currentColor" />
              <Text fontSize="md" fontWeight="medium" color="white">Notes</Text>
            </HStack>
          </Tooltip>

          {/* Events display for both coaches and athletes */}
          <HStack spacing={2} color="white">
            <FaRunning size={20} color="currentColor" />
            <Text fontSize="md" fontWeight="medium" color="white">Events</Text>
            <Text fontSize="md" color="white">({eventCount})</Text>
          </HStack>

          {/* Athletes with Tooltip - Show for both coaches and athletes */}
          <Tooltip 
            label={
              athleteNames.length > 0 ? (
                <VStack align="start" spacing={1}>
                  {athleteNames.map((name, idx) => (
                    <Text key={idx} fontSize="sm" color="white">
                      {name}
                    </Text>
                  ))}
                </VStack>
              ) : (
                "No athletes assigned"
              )
            }
            placement="top"
            bg="gray.600"
            color="white"
            p={3}
            borderRadius="md"
          >
            <HStack spacing={2} color="white" cursor="pointer">
              <FaUsers size={20} color="currentColor" />
              <Text fontSize="md" fontWeight="medium" color="white">Athletes</Text>
              <Text fontSize="md" color="white">({athleteCount})</Text>
            </HStack>
          </Tooltip>
        </VStack>
      </Grid>

      {/* Separator line and Your Events section - Only for athletes */}
      {!isCoach && myAssignedEvents.length > 0 && (
        <>
          {/* Separator line */}
          <Box bg="gray.600" h="1px" my={4} />

          <VStack align="start" spacing={2} w="full">
            <HStack spacing={2} color="white">
              <FaRunning size={20} color="currentColor" />
              <Text fontSize="md" fontWeight="medium" color="white">Your Events ({myAssignedEvents.length})</Text>
            </HStack>
            <VStack align="start" spacing={0} pl={6} w="full">
              {myAssignedEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <HStack 
                    spacing={2} 
                    justify="space-between" 
                    w="full"
                    py={2}
                  >
                    <Text fontSize="sm" color="gray.300" flex="1">{event.name}</Text>
                    
                    {/* Time display or Add Time button */}
                    {event.time ? (
                      <HStack spacing={2}>
                        <Text fontSize="xs" fontWeight="medium" color="green.300">{event.time}</Text>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => onOpenRunTimeModal?.({
                            eventId: event.id,
                            eventName: event.name,
                            currentTime: event.time || undefined
                          })}
                        >
                          Edit
                        </Button>
                      </HStack>
                    ) : (
                      <Button
                        size="xs"
                        colorScheme="blue"
                        variant="outline"
                        leftIcon={<FaPlus size={8} />}
                        onClick={() => onOpenRunTimeModal?.({
                          eventId: event.id,
                          eventName: event.name
                        })}
                      >
                        Add Time
                      </Button>
                    )}
                  </HStack>
                  
                  {/* Dotted separator line with equal margins */}
                  {index < myAssignedEvents.length - 1 && (
                    <Box
                      w="full"
                      borderBottom="1px dotted"
                      borderColor="gray.600"
                      my={3}
                    />
                  )}
                </React.Fragment>
              ))}
            </VStack>
            
            {/* Divider line between events and coach info */}
            {assignedByCoach && (
              <Box bg="gray.600" h="1px" w="full" my={3} />
            )}
            
            {/* Assigned by Coach info for athletes */}
            {assignedByCoach && (
              <VStack spacing={1} align="start" pt={2} w="full">
                <HStack spacing={2} color="white">
                  <FaChalkboardTeacher size={16} color="currentColor" />
                  <Text fontSize="sm" color="gray.300">Coach:</Text>
                  <Text fontSize="sm" fontWeight="medium" color="white">{assignedByCoach}</Text>
                  
                  {/* Coach Phone */}
                  {coachPhone && (
                    <>
                      <Text fontSize="sm" color="gray.400">|</Text>
                      <FaPhoneAlt size={14} color="currentColor" />
                      <Text fontSize="sm" color="gray.300">
                        {(() => {
                          // Format phone as (999) 999-9999
                          const phone = coachPhone.replace(/\D/g, '');
                          if (phone.length === 10) {
                            return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
                          }
                          return coachPhone;
                        })()}
                      </Text>
                    </>
                  )}
                  
                  {/* Coach Email */}
                  {coachEmail && (
                    <>
                      <Text fontSize="sm" color="gray.400">|</Text>
                      <FaAt size={14} color="currentColor" />
                      <Text 
                        fontSize="sm" 
                        color="blue.400"
                        _hover={{ color: "blue.300" }}
                        cursor="pointer"
                        onClick={() => window.open(`mailto:${coachEmail}`, '_blank')}
                      >
                        {coachEmail}
                      </Text>
                    </>
                  )}
                </HStack>
                
                {/* Assistant Coaches */}
                {(assistantCoach1Name || assistantCoach2Name || assistantCoach3Name) && (
                  <VStack spacing={1} align="start" pt={2} w="full" mt={2}>
                    {/* Assistant Coach 1 */}
                    {assistantCoach1Name && (
                      <HStack spacing={2} color="white">
                        <FaUserTie size={16} color="currentColor" />
                        <Text fontSize="sm" color="gray.400">Assistant:</Text>
                        <Text fontSize="sm" color="gray.200">{assistantCoach1Name}</Text>
                        
                        {/* Assistant Coach 1 Phone */}
                        {assistantCoach1Phone && (
                          <>
                            <Text fontSize="sm" color="gray.500">|</Text>
                            <FaPhoneAlt size={14} color="currentColor" />
                            <Text fontSize="sm" color="gray.300">
                              {(() => {
                                const phone = assistantCoach1Phone.replace(/\D/g, '');
                                if (phone.length === 10) {
                                  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
                                }
                                return assistantCoach1Phone;
                              })()}
                            </Text>
                          </>
                        )}
                        
                        {/* Assistant Coach 1 Email */}
                        {assistantCoach1Email && (
                          <>
                            <Text fontSize="sm" color="gray.500">|</Text>
                            <FaAt size={14} color="currentColor" />
                            <Text 
                              fontSize="sm" 
                              color="blue.400"
                              _hover={{ color: "blue.300" }}
                              cursor="pointer"
                              onClick={() => window.open(`mailto:${assistantCoach1Email}`, '_blank')}
                            >
                              {assistantCoach1Email}
                            </Text>
                          </>
                        )}
                      </HStack>
                    )}
                    
                    {/* Assistant Coach 2 */}
                    {assistantCoach2Name && (
                      <HStack spacing={2} color="white">
                        <FaUserTie size={16} color="currentColor" />
                        <Text fontSize="sm" color="gray.400">Assistant:</Text>
                        <Text fontSize="sm" color="gray.200">{assistantCoach2Name}</Text>
                        
                        {/* Assistant Coach 2 Phone */}
                        {assistantCoach2Phone && (
                          <>
                            <Text fontSize="sm" color="gray.500">|</Text>
                            <FaPhoneAlt size={14} color="currentColor" />
                            <Text fontSize="sm" color="gray.300">
                              {(() => {
                                const phone = assistantCoach2Phone.replace(/\D/g, '');
                                if (phone.length === 10) {
                                  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
                                }
                                return assistantCoach2Phone;
                              })()}
                            </Text>
                          </>
                        )}
                        
                        {/* Assistant Coach 2 Email */}
                        {assistantCoach2Email && (
                          <>
                            <Text fontSize="sm" color="gray.500">|</Text>
                            <FaAt size={14} color="currentColor" />
                            <Text 
                              fontSize="sm" 
                              color="blue.400"
                              _hover={{ color: "blue.300" }}
                              cursor="pointer"
                              onClick={() => window.open(`mailto:${assistantCoach2Email}`, '_blank')}
                            >
                              {assistantCoach2Email}
                            </Text>
                          </>
                        )}
                      </HStack>
                    )}
                    
                    {/* Assistant Coach 3 */}
                    {assistantCoach3Name && (
                      <HStack spacing={2} color="white">
                        <FaUserTie size={16} color="currentColor" />
                        <Text fontSize="sm" color="gray.400">Assistant:</Text>
                        <Text fontSize="sm" color="gray.200">{assistantCoach3Name}</Text>
                        
                        {/* Assistant Coach 3 Phone */}
                        {assistantCoach3Phone && (
                          <>
                            <Text fontSize="sm" color="gray.500">|</Text>
                            <FaPhoneAlt size={14} color="currentColor" />
                            <Text fontSize="sm" color="gray.300">
                              {(() => {
                                const phone = assistantCoach3Phone.replace(/\D/g, '');
                                if (phone.length === 10) {
                                  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
                                }
                                return assistantCoach3Phone;
                              })()}
                            </Text>
                          </>
                        )}
                        
                        {/* Assistant Coach 3 Email */}
                        {assistantCoach3Email && (
                          <>
                            <Text fontSize="sm" color="gray.500">|</Text>
                            <FaAt size={14} color="currentColor" />
                            <Text 
                              fontSize="sm" 
                              color="blue.400"
                              _hover={{ color: "blue.300" }}
                              cursor="pointer"
                              onClick={() => window.open(`mailto:${assistantCoach3Email}`, '_blank')}
                            >
                              {assistantCoach3Email}
                            </Text>
                          </>
                        )}
                      </HStack>
                    )}
                  </VStack>
                )}
              </VStack>
            )}
            
            {/* Divider between coach and lodging */}
            {meet.lodging_type && assignedByCoach && (
              <Box bg="gray.600" h="1px" w="full" my={3} />
            )}
            
            {/* Lodging information - display under coach */}
            {meet.lodging_type && (
              <VStack spacing={2} align="start" pt={assignedByCoach ? 0 : 2} w="full">
                <HStack spacing={2} color="white">
                  <FaBed size={16} color="currentColor" />
                  <Text fontSize="sm" color="gray.300" fontWeight="medium">Lodging:</Text>
                </HStack>
                
                {/* 3-Column Layout for Lodging */}
                <Grid templateColumns="1fr 1fr 1fr" gap={4} w="full" pl={6}>
                  {/* Column 1: Address Information */}
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="gray.400" fontWeight="bold" textTransform="uppercase">
                      Address
                    </Text>
                    
                    {/* Place name and type */}
                    <Text fontSize="sm" fontWeight="medium" color="white">
                      {meet.lodging_place_name ? `${meet.lodging_place_name} (${meet.lodging_type})` : meet.lodging_type}
                    </Text>
                    
                    {/* Complete address block */}
                    <VStack align="start" spacing={0} w="full">
                      {/* Street address */}
                      {meet.lodging_address && (
                        <Text fontSize="sm" color="gray.300">
                          {meet.lodging_address}
                        </Text>
                      )}
                      
                      {/* City, State, Zip on one line */}
                      {(meet.lodging_city || meet.lodging_state || meet.lodging_zip) && (
                        <Text fontSize="sm" color="gray.300">
                          {[meet.lodging_city, meet.lodging_state, meet.lodging_zip].filter(Boolean).join(', ')}
                        </Text>
                      )}
                    </VStack>
                    
                    {/* Fallback if no address info */}
                    {!meet.lodging_address && !meet.lodging_city && !meet.lodging_state && !meet.lodging_zip && (
                      <Text fontSize="sm" color="gray.500">
                        No address provided
                      </Text>
                    )}
                  </VStack>
                  
                  {/* Column 2: Contact Information */}
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="gray.400" fontWeight="bold" textTransform="uppercase">
                      Contact
                    </Text>
                    {meet.lodging_phone && (
                      <HStack spacing={2}>
                        <FaPhoneAlt size={12} color="currentColor" />
                        <Text fontSize="sm" color="gray.300">
                          {(() => {
                            // Format phone as (999) 999-9999
                            const phone = meet.lodging_phone.replace(/\D/g, '');
                            if (phone.length === 10) {
                              return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
                            }
                            return meet.lodging_phone;
                          })()}
                        </Text>
                      </HStack>
                    )}
                    {meet.lodging_website && (
                      <HStack 
                        as="a" 
                        href={meet.lodging_website} 
                        target="_blank" 
                        spacing={2}
                        color="blue.400"
                        _hover={{ color: "blue.300" }}
                        cursor="pointer"
                      >
                        <FaGlobe size={12} color="currentColor" />
                        <Text fontSize="sm">Website</Text>
                      </HStack>
                    )}
                    {!meet.lodging_phone && !meet.lodging_website && (
                      <Text fontSize="sm" color="gray.500">
                        No contact info
                      </Text>
                    )}
                  </VStack>
                  
                  {/* Column 3: Check-in/Check-out */}
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="gray.400" fontWeight="bold" textTransform="uppercase">
                      Schedule
                    </Text>
                    {meet.lodging_checkin_date && (
                      <Text fontSize="sm" color="gray.300">
                        Check-in: {(() => {
                          try {
                            const date = new Date(meet.lodging_checkin_date);
                            const formattedDate = date.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                            let result = formattedDate;
                            if (meet.lodging_checkin_time) {
                              const time = new Date(`2000-01-01T${meet.lodging_checkin_time}`);
                              const formattedTime = time.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              });
                              result += ` at ${formattedTime}`;
                            }
                            return result;
                          } catch (e) {
                            return meet.lodging_checkin_date + (meet.lodging_checkin_time ? ` at ${meet.lodging_checkin_time}` : '');
                          }
                        })()}
                      </Text>
                    )}
                    {meet.lodging_checkout_date && (
                      <Text fontSize="sm" color="gray.300">
                        Check-out: {(() => {
                          try {
                            const date = new Date(meet.lodging_checkout_date);
                            const formattedDate = date.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                            let result = formattedDate;
                            if (meet.lodging_checkout_time) {
                              const time = new Date(`2000-01-01T${meet.lodging_checkout_time}`);
                              const formattedTime = time.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              });
                              result += ` at ${formattedTime}`;
                            }
                            return result;
                          } catch (e) {
                            return meet.lodging_checkout_date + (meet.lodging_checkout_time ? ` at ${meet.lodging_checkout_time}` : '');
                          }
                        })()}
                      </Text>
                    )}
                    {!meet.lodging_checkin_date && !meet.lodging_checkout_date && (
                      <Text fontSize="sm" color="gray.500">
                        No schedule set
                      </Text>
                    )}
                  </VStack>
                </Grid>
                
                {/* Additional details - full width below columns */}
                {meet.lodging_details && (
                  <Text fontSize="sm" color="gray.400" fontStyle="italic" pl={6} pt={1}>
                    {meet.lodging_details}
                  </Text>
                )}
              </VStack>
            )}
          </VStack>
        </>
      )}
    </Box>
  );
};

export const Meets: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isEventDrawerOpen, onOpen: onEventDrawerOpen, onClose: onEventDrawerClose } = useDisclosure();
  const { isOpen: isAssignDrawerOpen, onOpen: onAssignDrawerOpen, onClose: onAssignDrawerClose } = useDisclosure();
  const { isOpen: isLocationSetupOpen, onOpen: onLocationSetupOpen, onClose: onLocationSetupClose } = useDisclosure();
  
  // State
  const [meets, setMeets] = useState<TrackMeet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMeet, setCurrentMeet] = useState<TrackMeet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [meetStats, setMeetStats] = useState({ planned: 0, completed: 0, total: 0 });
  const [meetData, setMeetData] = useState<Record<string, { 
    athleteCount: number; 
    eventCount: number; 
    athleteNames: string[]; 
    myAssignedEvents: Array<{ id: string; name: string; time: string | null }>;
    assignedByCoach: string | null;
    coachPhone: string | null;
    coachEmail: string | null;
    // Assistant coaches
    assistantCoach1Name: string | null;
    assistantCoach1Phone: string | null;
    assistantCoach1Email: string | null;
    assistantCoach2Name: string | null;
    assistantCoach2Phone: string | null;
    assistantCoach2Email: string | null;
    assistantCoach3Name: string | null;
    assistantCoach3Phone: string | null;
    assistantCoach3Email: string | null;
    distance?: string;
  }>>({});
  const [userIsCoach, setUserIsCoach] = useState(false);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [meetEvents, setMeetEvents] = useState<any[]>([]);
  const [athleteAssignments, setAthleteAssignments] = useState<Record<string, string[]>>({});
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [currentMeetEvent, setCurrentMeetEvent] = useState<any>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isEventSubmitting, setIsEventSubmitting] = useState(false);
  
  // Run time modal state for athletes
  const [isRunTimeModalOpen, setIsRunTimeModalOpen] = useState(false);
  const [currentEventForTime, setCurrentEventForTime] = useState<any>(null);
  const [runTimeInput, setRunTimeInput] = useState('');
  const [isSubmittingTime, setIsSubmittingTime] = useState(false);

  // Form hooks for event management
  const {
    register: registerEvent,
    handleSubmit: handleSubmitEvent,
    reset: resetEvent,
    formState: { errors: eventErrors }
  } = useForm<MeetEventFormData>();

  // Color mode values for event drawer
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');
  const whiteGrayBg = useColorModeValue('white', 'gray.700');
  const hoverBorderColor = useColorModeValue('gray.300', 'gray.500');
  const eventDrawerHeaderBg = useColorModeValue('blue.50', 'blue.900');
  const eventDrawerHeaderColor = useColorModeValue('blue.700', 'blue.200');
  const footerBg = useColorModeValue('gray.50', 'gray.700');
  const cancelRef = React.useRef(null);
  
  // Color mode values for assignment drawer
  const assignDrawerHeaderBg = useColorModeValue('green.50', 'green.900');
  const assignDrawerHeaderColor = useColorModeValue('green.700', 'green.200');

  // Fetch meets and related data
  const fetchMeets = useCallback(async () => {
    if (!user) return;
    try {
      // Check if user is coach from multiple sources
      let isCoachUser = user?.user_metadata?.user_type === 'coach' || user?.user_metadata?.role === 'coach';
      
      // Also check the profiles table for role
      if (!isCoachUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        isCoachUser = profileData?.role === 'coach';
      }
      
      // Set the coach state
      setUserIsCoach(isCoachUser);
      
      let meetsData: any[] = [];
      
      if (isCoachUser) {
        console.log('Fetching meets for coach:', user.id);
        const { data, error } = await supabase
          .from('track_meets')
          .select(`
            *, 
            lodging_type, lodging_place_name, lodging_address, lodging_city, lodging_state, lodging_zip, 
            lodging_phone, lodging_website, lodging_checkin_date, lodging_checkout_date, 
            lodging_checkin_time, lodging_checkout_time, lodging_details,
            assistant_coach_1_name, assistant_coach_1_phone, assistant_coach_1_email,
            assistant_coach_2_name, assistant_coach_2_phone, assistant_coach_2_email,
            assistant_coach_3_name, assistant_coach_3_phone, assistant_coach_3_email
          `)
          .eq('coach_id', user.id)
          .order('meet_date', { ascending: true });
        
        if (error) throw error;
        meetsData = data || [];
      } else {
        console.log('Fetching meets for athlete:', user.id);
        // For athletes, get meets they're assigned to through athlete_meet_events
        const { data: athleteEventAssignments } = await supabase
          .from('athlete_meet_events')
          .select('meet_event_id')
          .eq('athlete_id', user.id);
        
        if (athleteEventAssignments && athleteEventAssignments.length > 0) {
          const eventIds = athleteEventAssignments.map(a => a.meet_event_id);
          
          const { data: meetEventData } = await supabase
            .from('meet_events')
            .select('meet_id')
            .in('id', eventIds);
          
          const meetIds = [...new Set(meetEventData?.map(me => me.meet_id) || [])];
          
          if (meetIds.length > 0) {
            const { data, error } = await supabase
              .from('track_meets')
              .select(`
                *, 
                lodging_type, lodging_place_name, lodging_address, lodging_city, lodging_state, lodging_zip, 
                lodging_phone, lodging_website, lodging_checkin_date, lodging_checkout_date, 
                lodging_checkin_time, lodging_checkout_time, lodging_details,
                assistant_coach_1_name, assistant_coach_1_phone, assistant_coach_1_email,
                assistant_coach_2_name, assistant_coach_2_phone, assistant_coach_2_email,
                assistant_coach_3_name, assistant_coach_3_phone, assistant_coach_3_email
              `)
              .in('id', meetIds)
              .order('meet_date', { ascending: true });
            
            if (error) throw error;
            meetsData = data || [];
          }
          // If no meetIds, meetsData remains empty array
        }
        // If no assignments, meetsData remains empty array
      }
      
      console.log('Query result:', { data: meetsData, count: meetsData.length });
        
      setMeets(meetsData);
      
      // Calculate meet stats
      const planned = meetsData.filter(m => m.status === 'Planned').length;
      const completed = meetsData.filter(m => m.status === 'Completed').length;
      const total = meetsData.length;
      setMeetStats({ planned, completed, total });
      
      // Define fetchMeetData function
      const fetchMeetData = async (meetsData: TrackMeet[], isCoachUser: boolean) => {
        const dataMap: Record<string, any> = {};
        
        for (const meet of meetsData) {
          try {
            // Get event count for this meet
            const { count: eventCount } = await supabase
              .from('meet_events')
              .select('*', { count: 'exact', head: true })
              .eq('meet_id', meet.id);
            
            // Get assigned athletes for this meet
            const { data: meetEvents } = await supabase
              .from('meet_events')
              .select('id, event_name')
              .eq('meet_id', meet.id);
            
            const eventIds = meetEvents?.map(event => event.id) || [];
            
            let athleteCount = 0;
            let athleteNames: string[] = [];
            let myAssignedEvents: Array<{ id: string; name: string; time: string | null }> = [];
            let assignedByCoach: string | null = null;
            let coachPhone: string | null = null;
            let coachEmail: string | null = null;
            
            if (eventIds.length > 0) {
              if (isCoachUser) {
                // Coach view: Get all athlete assignments
                const { data: athleteAssignments } = await supabase
                  .from('athlete_meet_events')
                  .select(`
                    athlete_id
                  `)
                  .in('meet_event_id', eventIds);
                
                // Get unique athlete IDs
                const uniqueAthleteIds = [...new Set(athleteAssignments?.map(a => a.athlete_id) || [])];
                
                if (uniqueAthleteIds.length > 0) {
                  // Get athlete profiles separately  
                  const { data: athleteProfiles } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .in('id', uniqueAthleteIds);
                  
                  athleteCount = uniqueAthleteIds.length;
                  athleteNames = athleteProfiles?.map(profile => 
                    `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                  ) || [];
                }
              } else {
                // Athlete view: Get only this athlete's assignments
                try {
                  const { data: myAssignments, error: assignmentError } = await supabase
                    .from('athlete_meet_events')
                    .select(`
                      meet_event_id,
                      assigned_by,
                      result,
                      status
                    `)
                    .in('meet_event_id', eventIds)
                    .eq('athlete_id', user?.id);
                  
                  if (assignmentError) {
                    console.warn('Assignment query failed (likely RLS issue):', assignmentError);
                    // Fallback: no assignments for this athlete
                  } else if (myAssignments && myAssignments.length > 0) {
                    // Get the event names for assigned events
                    const assignedEventIds = myAssignments.map(a => a.meet_event_id);
                    const assignedEvents = meetEvents?.filter(e => assignedEventIds.includes(e.id)) || [];
                    
                    // Build event list with names and times
                    myAssignedEvents = assignedEvents.map(e => {
                      const assignment = myAssignments.find(a => a.meet_event_id === e.id);
                      return {
                        id: e.id,
                        name: e.event_name,
                        time: assignment?.result || null
                      };
                    });
                    
                    // Get coach who assigned (use the first assignment's coach)
                    const coachId = myAssignments[0]?.assigned_by;
                    if (coachId) {
                      try {
                        const { data: coachProfile, error: coachError } = await supabase
                          .from('profiles')
                          .select('first_name, last_name, phone, email')
                          .eq('id', coachId)
                          .single();
                        
                        if (!coachError && coachProfile) {
                          assignedByCoach = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
                          coachPhone = coachProfile.phone || null;
                          coachEmail = coachProfile.email || null;
                        }
                      } catch (coachErr) {
                        console.warn('Coach profile query failed:', coachErr);
                      }
                    }
                    
                    athleteCount = myAssignedEvents.length; // For athlete view, show event count instead
                  }
                  
                  // Also fetch all athletes assigned to this meet for the tooltip
                  // (so athletes can see who else is participating)
                  try {
                    const { data: allAssignments } = await supabase
                      .from('athlete_meet_events')
                      .select('athlete_id')
                      .in('meet_event_id', eventIds);
                    
                    const uniqueAthleteIds = [...new Set(allAssignments?.map(a => a.athlete_id) || [])];
                    
                    if (uniqueAthleteIds.length > 0) {
                      const { data: athleteProfiles } = await supabase
                        .from('profiles')
                        .select('id, first_name, last_name')
                        .in('id', uniqueAthleteIds);
                      
                      athleteNames = athleteProfiles?.map(profile => 
                        `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                      ) || [];
                      
                      // Update athlete count to show total athletes, not just events
                      athleteCount = uniqueAthleteIds.length;
                    }
                  } catch (error) {
                    console.warn('Failed to fetch all athlete assignments for tooltip:', error);
                  }
                } catch (error) {
                  console.warn('Failed to fetch athlete assignments:', error);
                  // Continue with empty assignments
                }
              }
            }
            
            // Calculate distance using basic geocoding (placeholder for now)
            let distance = "Distance TBD";
            if (meet.city && meet.state) {
              // This could be enhanced with actual geocoding API
              distance = `${meet.city}, ${meet.state}`;
            }
            
            dataMap[meet.id] = {
              athleteCount,
              eventCount: eventCount || 0,
              athleteNames,
              myAssignedEvents,
              assignedByCoach,
              coachPhone,
              coachEmail,
              // Assistant coaches from meet data
              assistantCoach1Name: meet.assistant_coach_1_name || null,
              assistantCoach1Phone: meet.assistant_coach_1_phone || null,
              assistantCoach1Email: meet.assistant_coach_1_email || null,
              assistantCoach2Name: meet.assistant_coach_2_name || null,
              assistantCoach2Phone: meet.assistant_coach_2_phone || null,
              assistantCoach2Email: meet.assistant_coach_2_email || null,
              assistantCoach3Name: meet.assistant_coach_3_name || null,
              assistantCoach3Phone: meet.assistant_coach_3_phone || null,
              assistantCoach3Email: meet.assistant_coach_3_email || null,
              distance
            };
          } catch (error) {
            console.error(`Error fetching data for meet ${meet.id}:`, error);
            // Set defaults on error
            dataMap[meet.id] = {
              athleteCount: 0,
              eventCount: 0,
              athleteNames: [],
              myAssignedEvents: [],
              assignedByCoach: null,
              coachPhone: null,
              coachEmail: null,
              // Assistant coaches - null on error
              assistantCoach1Name: null,
              assistantCoach1Phone: null,
              assistantCoach1Email: null,
              assistantCoach2Name: null,
              assistantCoach2Phone: null,
              assistantCoach2Email: null,
              assistantCoach3Name: null,
              assistantCoach3Phone: null,
              assistantCoach3Email: null,
              distance: "Distance TBD"
            };
          }
        }
        
        setMeetData(dataMap);
      };
      
      // Fetch additional data for each meet
      await fetchMeetData(meetsData, isCoachUser);
      
    } catch (error) {
      console.error('Error fetching meets:', error);
      toast({
        title: 'Error loading meets',
        description: 'Failed to load track meets',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMeets();
  }, [fetchMeets]);

  // Fetch athletes coached by this user - memoized
  const fetchAthletes = useCallback(async () => {
    try {
      // First get the list of athlete IDs this coach coaches
      const { data: coachAthleteData, error: relationError } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', user?.id);
      
      if (relationError) throw relationError;
      
      if (!coachAthleteData || coachAthleteData.length === 0) {
        setAthletes([]);
        return;
      }
      
      // Then fetch the profiles for these athletes
      const athleteIds = coachAthleteData.map((row: any) => row.athlete_id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', athleteIds);
      
      if (profileError) throw profileError;
      
      const formattedAthletes = profileData?.map((profile: any) => ({
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`
      })) || [];
      
      setAthletes(formattedAthletes);
    } catch (error) {
      console.error('Error fetching athletes:', error);
    }
  }, [user?.id]);

  // Fetch meet events for assignment drawer - memoized
  const fetchMeetEventsForAssignment = useCallback(async (meetId: string) => {
    try {
      setAssignmentLoading(true);
      
      const { data, error } = await supabase
        .from('meet_events')
        .select('*')
        .eq('meet_id', meetId)
        .order('event_day, start_time, event_name');
      
      if (error) throw error;
      
      setMeetEvents(data || []);
      
      // Fetch athlete assignments for these events
      if (data && data.length > 0) {
        await fetchAthleteAssignments(data.map((event: any) => event.id));
      } else {
        setAthleteAssignments({});
      }
    } catch (error) {
      console.error('Error fetching meet events:', error);
      setMeetEvents([]);
      setAthleteAssignments({});
    } finally {
      setAssignmentLoading(false);
    }
  }, []);

  // Fetch meet events for management drawer - memoized
  const fetchMeetEventsForManagement = useCallback(async (meetId: string) => {
    try {
      const { data, error } = await supabase
        .from('meet_events')
        .select('*')
        .eq('meet_id', meetId)
        .order('event_day, start_time, event_name');
      
      if (error) throw error;
      
      setMeetEvents(data || []);
    } catch (error) {
      console.error('Error fetching meet events:', error);
      setMeetEvents([]);
    }
  }, []);

  // Fetch athlete assignments for meet events - memoized
  const fetchAthleteAssignments = useCallback(async (eventIds: string[]) => {
    try {
      if (!eventIds.length) return;
      
      const { data, error } = await supabase
        .from('athlete_meet_events')
        .select('*')
        .in('meet_event_id', eventIds);
      
      if (error) throw error;
      
      // Organize assignments by event
      const assignments: Record<string, string[]> = {};
      
      // Initialize empty arrays for all event IDs
      eventIds.forEach(eventId => {
        assignments[eventId] = [];
      });
      
      // Then populate with actual assignments
      data?.forEach((assignment: any) => {
        if (assignments[assignment.meet_event_id]) {
          assignments[assignment.meet_event_id].push(assignment.athlete_id);
        } else {
          assignments[assignment.meet_event_id] = [assignment.athlete_id];
        }
      });
      
      setAthleteAssignments(assignments);
    } catch (error) {
      console.error('Error fetching athlete assignments:', error);
    }
  }, []);

  // Handlers - memoized to prevent re-creation
  const handleCreateMeet = useCallback(() => {
    setCurrentMeet(null);
    setIsEditing(false);
    onFormOpen();
  }, [onFormOpen]);

  const handleEditMeet = useCallback((meet: TrackMeet) => {
    setCurrentMeet(meet);
    setIsEditing(true);
    onFormOpen();
  }, [onFormOpen]);

  const handleDeleteMeet = useCallback((meet: TrackMeet) => {
    setCurrentMeet(meet);
    onDeleteOpen();
  }, [onDeleteOpen]);

  const confirmDelete = useCallback(async () => {
    if (!currentMeet) return;

    try {
      const { error } = await supabase
        .from('track_meets')
        .delete()
        .eq('id', currentMeet.id);

      if (error) throw error;

      setMeets(meets.filter(m => m.id !== currentMeet.id));
      toast({
        title: 'Meet deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting meet:', error);
      toast({
        title: 'Error deleting meet',
        description: 'Failed to delete track meet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      onDeleteClose();
    }
  }, [currentMeet, meets, toast, onDeleteClose]);

  const handleAssignAthletes = useCallback((meet: TrackMeet) => {
    setCurrentMeet(meet);
    // Fetch meet events and athletes for assignment
    fetchMeetEventsForAssignment(meet.id);
    fetchAthletes();
    onAssignDrawerOpen();
  }, [onAssignDrawerOpen]);

  const handleManageEvents = useCallback((meet: TrackMeet) => {
    setCurrentMeet(meet);
    // Fetch events for this meet
    fetchMeetEventsForManagement(meet.id);
    onEventDrawerOpen();
  }, [onEventDrawerOpen]);

  // Run time modal handlers for athletes - memoized
  const openRunTimeModal = useCallback((eventData: { eventId: string; eventName: string; currentTime?: string }) => {
    setCurrentEventForTime(eventData);
    setRunTimeInput(eventData.currentTime || '');
    setIsRunTimeModalOpen(true);
  }, []);

  const closeRunTimeModal = useCallback(() => {
    setIsRunTimeModalOpen(false);
    setCurrentEventForTime(null);
    setRunTimeInput('');
  }, []);

  const handleRunTimeSubmit = useCallback(async () => {
    if (!currentEventForTime || !runTimeInput.trim()) {
      toast({
        title: 'Please enter a valid run time',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsSubmittingTime(true);
      
      // Update the athlete's assignment record with the result
      const { error } = await supabase
        .from('athlete_meet_events')
        .update({ 
          result: runTimeInput.trim(),
          status: 'completed'
        })
        .eq('athlete_id', user?.id)
        .eq('meet_event_id', currentEventForTime.eventId);
      
      if (error) throw error;
      
      toast({
        title: 'Run time saved successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // Close modal and refresh meet data
      closeRunTimeModal();
      await fetchMeets();
      
    } catch (error) {
      console.error('Error saving run time:', error);
      toast({
        title: 'Error saving run time',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingTime(false);
    }
  }, [currentEventForTime, runTimeInput, toast, user?.id, closeRunTimeModal, fetchMeets]);

  const handleFormSuccess = useCallback(() => {
    fetchMeets();
  }, [fetchMeets]);

  const handleFormSubmit = useCallback(async (data: TrackMeetFormData) => {
    if (!user) return;

    try {
      if (isEditing && currentMeet) {
        const { error } = await supabase
          .from('track_meets')
          .update(data)
          .eq('id', currentMeet.id);
        
        if (error) throw error;
        
        toast({
          title: 'Meet updated',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        const { error } = await supabase
          .from('track_meets')
          .insert([{
            ...data,
            coach_id: user.id
          }]);
        
        if (error) throw error;
        
        toast({
          title: 'Meet created',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
      
      handleFormSuccess();
      onFormClose();
    } catch (error) {
      console.error('Error saving meet:', error);
      toast({
        title: 'Error saving meet',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [user, isEditing, currentMeet, toast, handleFormSuccess, onFormClose]);

  // Handler for event form submission - memoized
  const onSubmitEvent = useCallback(async (data: MeetEventFormData) => {
    try {
      if (!currentMeet) return;
      
      setIsEventSubmitting(true);
      
      // Prepare the data with proper type conversion
      const eventData = {
        meet_id: currentMeet.id,
        event_name: data.event_name.trim(),
        event_date: data.event_date || null,
        event_day: data.event_day ? parseInt(data.event_day.toString(), 10) : null,
        start_time: data.start_time || null,
        heat: data.heat ? parseInt(data.heat.toString(), 10) : null,
        event_type: data.event_type || null,
        run_time: data.run_time || null
      };
      
      if (isEditingEvent && currentMeetEvent) {
        // Update existing event
        const { error } = await supabase
          .from('meet_events')
          .update(eventData)
          .eq('id', currentMeetEvent.id);
        
        if (error) throw error;
        
        toast({
          title: 'Event updated',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        // Create new event
        const { error } = await supabase
          .from('meet_events')
          .insert([eventData]);
        
        if (error) throw error;
        
        toast({
          title: 'Event added',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
      
      // Refresh events for this meet
      await fetchMeetEventsForManagement(currentMeet.id);
      onEventDrawerClose();
      // Reset the form after successful submission
      resetEvent();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error saving event',
        description: (error as Error).message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsEventSubmitting(false);
    }
  }, [currentMeet, isEditingEvent, currentMeetEvent, toast, onEventDrawerClose, resetEvent]);

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.900" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900">
      {/* Header */}
      <Box py={4}>
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Button
                leftIcon={<FaArrowLeft size={14} />}
                variant="ghost"
                onClick={() => navigate(-1)}
                size="sm"
                color="gray.300"
                _hover={{ color: "white", bg: "gray.700" }}
              >
                Back
              </Button>
              <Heading size="lg" color="white">Track Meets</Heading>
            </HStack>
            
            <HStack spacing={4}>
              {/* Location Setup */}
              <HStack spacing={2}>
                <Tooltip label="Set your location for travel times" placement="bottom">
                  <IconButton
                    icon={<FaMapMarkerAlt />}
                    aria-label="Set location"
                    onClick={onLocationSetupOpen}
                    variant="ghost"
                    colorScheme="green"
                    size="sm"
                    color="gray.300"
                    _hover={{ color: "white", bg: "gray.700" }}
                  />
                </Tooltip>
                <CurrentLocationDisplay />
              </HStack>
              
              {userIsCoach && (
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  size="sm"
                  onClick={handleCreateMeet}
                >
                  Create Meet
                </Button>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Flex 
        direction="column" 
        align="center" 
        p={6}
        color="gray.100"
      >
        {/* Meets List */}
        <Box w="full" maxW="4xl">
          {meets.length === 0 ? (
            <Box
              bg="gray.800"
              borderRadius="2xl"
              p={16}
              textAlign="center"
              border="1px solid"
              borderColor="gray.700"
            >
              <FaCalendarAlt size={48} color="gray.600" style={{ margin: '0 auto 16px' }} />
              <Heading size="md" color="gray.400" mb={2}>No meets found</Heading>
              <Text color="gray.500" mb={6}>
                {userIsCoach ? "Create your first track meet to get started." : "No meets have been assigned to you yet."}
              </Text>
              {userIsCoach && (
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  onClick={handleCreateMeet}
                >
                  Create First Meet
                </Button>
              )}
            </Box>
          ) : (
            meets.map((meet) => (
              <MeetCard
                key={meet.id}
                meet={meet}
                isCoach={userIsCoach}
                onEdit={handleEditMeet}
                onDelete={handleDeleteMeet}
                onAssignAthletes={handleAssignAthletes}
                onManageEvents={handleManageEvents}
                onOpenRunTimeModal={openRunTimeModal}
                athleteCount={meetData[meet.id]?.athleteCount || 0}
                eventCount={meetData[meet.id]?.eventCount || 0}
                athleteNames={meetData[meet.id]?.athleteNames || []}
                myAssignedEvents={meetData[meet.id]?.myAssignedEvents || []}
                assignedByCoach={meetData[meet.id]?.assignedByCoach}
                coachPhone={meetData[meet.id]?.coachPhone}
                coachEmail={meetData[meet.id]?.coachEmail}
                assistantCoach1Name={meetData[meet.id]?.assistantCoach1Name}
                assistantCoach1Phone={meetData[meet.id]?.assistantCoach1Phone}
                assistantCoach1Email={meetData[meet.id]?.assistantCoach1Email}
                assistantCoach2Name={meetData[meet.id]?.assistantCoach2Name}
                assistantCoach2Phone={meetData[meet.id]?.assistantCoach2Phone}
                assistantCoach2Email={meetData[meet.id]?.assistantCoach2Email}
                assistantCoach3Name={meetData[meet.id]?.assistantCoach3Name}
                assistantCoach3Phone={meetData[meet.id]?.assistantCoach3Phone}
                assistantCoach3Email={meetData[meet.id]?.assistantCoach3Email}
                distance={meetData[meet.id]?.distance}
              />
            ))
          )}
        </Box>
      </Flex>

      {/* Form Drawer */}
      <MeetFormDrawer
        isOpen={isFormOpen}
        onClose={onFormClose}
        onSubmit={handleFormSubmit}
        currentMeet={currentMeet}
        isEditing={isEditing}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Meet
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{currentMeet?.name}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Athlete Assignment Drawer */}
      <Drawer
        isOpen={isAssignDrawerOpen}
        placement="right"
        onClose={onAssignDrawerClose}
        size="lg"
      >
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent bg={bgColor} borderLeft="3px solid" borderColor="green.500">
          <DrawerHeader 
            borderBottomWidth="2px" 
            borderColor={borderColor}
            bg={assignDrawerHeaderBg}
            color={assignDrawerHeaderColor}
            fontSize="lg"
            fontWeight="bold"
          >
            Assign Athletes to Events - {currentMeet?.name}
          </DrawerHeader>
          <DrawerCloseButton 
            color={assignDrawerHeaderColor}
            size="lg"
          />

          <DrawerBody py={6}>
            {assignmentLoading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="lg" />
              </Flex>
            ) : (
              <VStack spacing={6} align="stretch">
                {meetEvents.map((event) => (
                  <Box 
                    key={event.id}
                    p={6}
                    border="2px solid"
                    borderColor={borderColor}
                    borderRadius="lg"
                    bg={whiteGrayBg}
                  >
                    <Heading 
                      size="lg" 
                      mb={4}
                      color={subtextColor}
                      fontWeight="bold"
                    >
                      {event.event_name}
                    </Heading>
                    
                    <FormControl>
                      <FormLabel 
                        fontSize="md" 
                        fontWeight="semibold"
                        color={subtextColor}
                        mb={4}
                      >
                        Assign Athletes
                      </FormLabel>
                      <CheckboxGroup 
                        value={athleteAssignments[event.id] || []}
                        onChange={(values) => {
                          setAthleteAssignments(prev => ({
                            ...prev,
                            [event.id]: values as string[]
                          }));
                        }}
                      >
                        <VStack align="start" spacing={3}>
                          {athletes.map((athlete) => (
                            <Checkbox 
                              key={athlete.id} 
                              value={athlete.id}
                              size="lg"
                              colorScheme="green"
                              borderWidth="2px"
                              color={subtextColor}
                              fontSize="md"
                              fontWeight="medium"
                            >
                              {athlete.name}
                            </Checkbox>
                          ))}
                        </VStack>
                      </CheckboxGroup>
                    </FormControl>
                  </Box>
                ))}
              </VStack>
            )}
          </DrawerBody>

          <DrawerFooter 
            borderTopWidth="2px" 
            borderColor={borderColor}
            bg={footerBg}
          >
            <Button 
              variant="outline" 
              colorScheme="gray"
              mr={3} 
              onClick={onAssignDrawerClose}
              size="lg"
              borderWidth="2px"
            >
              Cancel
            </Button>
            <Button 
              variant="solid"
              colorScheme="green" 
              isLoading={assignmentLoading}
              onClick={async () => {
                try {
                  setAssignmentLoading(true);
                  
                  // Get current assignments
                  const { data: currentAssignments } = await supabase
                    .from('athlete_meet_events')
                    .select('*')
                    .in('meet_event_id', meetEvents.map(e => e.id));
                  
                  // Process each event
                  for (const eventId of Object.keys(athleteAssignments)) {
                    const currentAthletes = currentAssignments
                      ?.filter((a: any) => a.meet_event_id === eventId)
                      .map((a: any) => a.athlete_id) || [];
                    
                    const selectedAthletes = athleteAssignments[eventId] || [];
                    
                    // Athletes to remove
                    const athletesToRemove = currentAssignments
                      ?.filter((a: any) => 
                        a.meet_event_id === eventId && 
                        !selectedAthletes.includes(a.athlete_id)
                      )
                      .map((a: any) => a.id) || [];
                    
                    // Athletes to add
                    const athletesToAdd = selectedAthletes
                      .filter((athleteId: string) => 
                        !currentAthletes.includes(athleteId)
                      );
                    
                    // Process removals
                    if (athletesToRemove.length > 0) {
                      const { error: removeError } = await supabase
                        .from('athlete_meet_events')
                        .delete()
                        .in('id', athletesToRemove);
                      
                      if (removeError) throw removeError;
                    }
                    
                    // Process additions
                    if (athletesToAdd.length > 0) {
                      const newAssignments = athletesToAdd.map((athleteId: string) => ({
                        athlete_id: athleteId,
                        meet_event_id: eventId,
                        assigned_by: user?.id
                      }));
                      
                      const { error: addError } = await supabase
                        .from('athlete_meet_events')
                        .insert(newAssignments);
                      
                      if (addError) throw addError;
                    }
                  }
                  
                  toast({
                    title: 'Assignments saved',
                    description: 'Athletes have been assigned to events',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                  });
                  
                  onAssignDrawerClose();
                  // Refresh the meets data
                  await fetchMeets();
                } catch (error) {
                  console.error('Error saving assignments:', error);
                  toast({
                    title: 'Error saving assignments',
                    description: (error as Error).message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                  });
                } finally {
                  setAssignmentLoading(false);
                }
              }}
              size="lg"
              shadow="md"
            >
              Save Assignments
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Event Management Drawer */}
      <Drawer
        isOpen={isEventDrawerOpen}
        placement="right"
        onClose={onEventDrawerClose}
        size="lg"
      >
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent bg={bgColor} borderLeft="3px solid" borderColor="blue.500">
          <DrawerHeader 
            borderBottomWidth="2px" 
            borderColor={borderColor}
            bg={eventDrawerHeaderBg}
            color={eventDrawerHeaderColor}
            fontSize="lg"
            fontWeight="bold"
          >
            {isEditingEvent ? 'Edit Event' : 'Add Event'}
            {currentMeet && ` - ${currentMeet.name}`}
          </DrawerHeader>
          <DrawerCloseButton 
            color={eventDrawerHeaderColor}
            size="lg"
          />
          
          <DrawerBody py={6}>
            <form onSubmit={handleSubmitEvent(onSubmitEvent)}>
              <VStack spacing={6} pt={4}>
                <FormControl isInvalid={!!eventErrors.event_name} isRequired>
                  <FormLabel 
                    fontSize="md" 
                    fontWeight="semibold"
                    color={subtextColor}
                  >
                    Event Name
                  </FormLabel>
                  <Input 
                    {...registerEvent('event_name', { required: 'Event name is required' })} 
                    placeholder="e.g. 100m Dash"
                    size="lg"
                    borderWidth="2px"
                    borderColor={borderColor}
                    _hover={{ borderColor: hoverBorderColor }}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                    bg={whiteGrayBg}
                  />
                  <FormErrorMessage color="red.500" fontWeight="medium">
                    {eventErrors.event_name?.message}
                  </FormErrorMessage>
                </FormControl>
                
                <HStack spacing={4} w="full">
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Event Date
                    </FormLabel>
                    <Input 
                      type="date" 
                      {...registerEvent('event_date')} 
                      placeholder="Specific date for this event"
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    />
                  </FormControl>
                  
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Day Number
                    </FormLabel>
                    <Input 
                      type="number" 
                      {...registerEvent('event_day')} 
                      placeholder="1, 2, 3..."
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    />
                  </FormControl>
                </HStack>
                
                <HStack spacing={4} w="full">
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Start Time
                    </FormLabel>
                    <Input 
                      type="time" 
                      {...registerEvent('start_time')} 
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    />
                  </FormControl>
                  
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Heat Number
                    </FormLabel>
                    <Input 
                      type="number" 
                      {...registerEvent('heat')} 
                      placeholder="1, 2, 3..."
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    />
                  </FormControl>
                </HStack>
                
                <HStack spacing={4} w="full">
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Event Type
                    </FormLabel>
                    <Select 
                      {...registerEvent('event_type')} 
                      placeholder="Select event type"
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    >
                      <option value="Preliminary">Preliminary</option>
                      <option value="Qualifier">Qualifier</option>
                      <option value="Semifinal">Semifinal</option>
                      <option value="Finals">Finals</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl flex="1">
                    <FormLabel 
                      fontSize="md" 
                      fontWeight="semibold"
                      color={subtextColor}
                    >
                      Run Time (Post-Event)
                    </FormLabel>
                    <Input 
                      {...registerEvent('run_time')} 
                      placeholder="e.g. 10.85, 2:05.43"
                      size="lg"
                      borderWidth="2px"
                      borderColor={borderColor}
                      _hover={{ borderColor: hoverBorderColor }}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      bg={whiteGrayBg}
                    />
                  </FormControl>
                </HStack>
              </VStack>
            </form>
          </DrawerBody>
          
          <DrawerFooter 
            borderTopWidth="2px" 
            borderColor={borderColor}
            bg={footerBg}
          >
            <Button 
              variant="outline" 
              colorScheme="gray"
              mr={3} 
              onClick={onEventDrawerClose}
              size="lg"
              borderWidth="2px"
            >
              Cancel
            </Button>
            <Button 
              variant="solid"
              colorScheme="blue" 
              isLoading={isEventSubmitting}
              onClick={handleSubmitEvent(onSubmitEvent)}
              size="lg"
              shadow="md"
            >
              {isEditingEvent ? 'Update' : 'Add Event'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      {/* Location Setup Modal */}
      <LocationSetup
        isOpen={isLocationSetupOpen}
        onClose={onLocationSetupClose}
      />
      
      {/* Run Time Modal for Athletes */}
      <RunTimeModal
        isOpen={isRunTimeModalOpen}
        onClose={closeRunTimeModal}
        event={currentEventForTime ? {
          id: currentEventForTime.eventId,
          event_name: currentEventForTime.eventName,
          run_time: currentEventForTime.currentTime,
          meet_id: currentMeet?.id || ''
        } : null}
        runTime={runTimeInput}
        setRunTime={setRunTimeInput}
        onSubmit={handleRunTimeSubmit}
        isSubmitting={isSubmittingTime}
      />
    </Box>
  );
}; 