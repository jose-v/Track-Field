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
  Icon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Card,
  CardBody
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
  FaUserTie,
  FaDownload,
  FaShare,
  FaUserFriends,
  FaFire,
  FaClock,
  FaHistory,
  FaClipboardList,
  FaDollarSign,
  FaInfoCircle,
  FaBoxOpen,
  FaTicketAlt,
  FaBook,
  FaFolder
} from 'react-icons/fa';
import { BiCalendar } from 'react-icons/bi';
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
import { categorizeMeetsByDate } from '../utils/meets';
import { CurrentLocationDisplay } from '../components/CurrentLocationDisplay';
import { RunTimeModal } from '../components/meets/RunTimeModal';
import { useMeetPDFGenerator } from '../components/meets/MeetPDFGenerator';
import { EventCreationModal } from '../components/meets/modals/EventCreationModal';
import { CoachEventBulkCreator } from '../components/meets/CoachEventBulkCreator';
import { CoachAthleteEventManager } from '../components/meets/CoachAthleteEventManager';
import { EventsListSection } from '../components/meets/EventsListSection';
import { MeetFilesList } from '../components/meets/MeetFilesList';
import PageHeader from '../components/PageHeader';
import { usePageHeader } from '../hooks/usePageHeader';
import { MobileMeetOptionsDrawer } from '../components/MobileMeetOptionsDrawer';

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
  onAddEvents?: (meet: TrackMeet) => void;
  onRefresh?: () => void;
  onOpenRunTimeModal?: (eventData: { eventId: string; eventName: string; currentTime?: string }) => void;
  onEditEvent?: (event: any, meet: TrackMeet) => void;
  onAssignAthletesToEvent?: (event: any, meet: TrackMeet) => void;
  athleteCount?: number;
  eventCount?: number;
  athleteNames?: string[];
  myAssignedEvents?: Array<{ 
    id: string; 
    name: string; 
    time: string | null;
    event_date?: string;
    event_day?: number;
    start_time?: string;
    heat?: number;
    event_type?: string;
    run_time?: string;
  }>;
  allEvents?: Array<{
    id: string;
    event_name: string;
    event_date?: string;
    event_day?: number;
    start_time?: string;
    heat?: number;
    event_type?: string;
    run_time?: string;
    athleteCount?: number;
    athleteNames?: string[];
  }>;
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
  onAddEvents,
  onRefresh,
  onOpenRunTimeModal,
  onEditEvent,
  onAssignAthletesToEvent,
  athleteCount = 0, 
  eventCount = 0, 
  athleteNames = [], 
  myAssignedEvents = [],
  allEvents = [],
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
  const { user } = useAuth();
  const toast = useToast();
  // Unified drawer state for both mobile and desktop
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();

  // PDF Generator hook
  const { generatePDF, shareViaMail, EmailModal } = useMeetPDFGenerator({
    meet,
    athleteNames,
    eventCount,
    assistantCoaches: [
      { name: assistantCoach1Name, phone: assistantCoach1Phone, email: assistantCoach1Email },
      { name: assistantCoach2Name, phone: assistantCoach2Phone, email: assistantCoach2Email },
      { name: assistantCoach3Name, phone: assistantCoach3Phone, email: assistantCoach3Email }
    ]
  });

  // Desktop hover state
  const [showToolbar, setShowToolbar] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Unified click handler for mobile
  const handleOptionsClick = () => {
    onDrawerOpen();
  };
  
  // Desktop hover handlers
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

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  // Format fees to show proper currency format
  const formatFee = (fee: string | number | undefined): string => {
    if (!fee) return '';
    const numericFee = typeof fee === 'string' ? parseFloat(fee) : fee;
    return `$${numericFee.toFixed(2)}`;
  };

  // Format address in the requested format
  const formatAddress = (
    address?: string, 
    city?: string, 
    state?: string, 
    zip?: string, 
    country?: string
  ): JSX.Element | null => {
    if (!address && !city && !state && !zip && !country) return null;
    
    return (
      <VStack align="start" spacing={0}>
        {address && <Text fontSize="xs" color="gray.300">{address}</Text>}
        <Text fontSize="xs" color="gray.300">
          {[city, state].filter(Boolean).join(' ')}
          {zip && `, ${zip}`}
        </Text>
        {country && <Text fontSize="xs" color="gray.300">{country}</Text>}
      </VStack>
    );
  };

  // Convert time from 24-hour to 12-hour format and remove seconds
  const formatTime = (timeString?: string): string => {
    if (!timeString) return '';
    
    // Remove seconds if present (e.g., "23:59:00" -> "23:59")
    const timeWithoutSeconds = timeString.split(':').slice(0, 2).join(':');
    
    // Parse the time
    const [hours, minutes] = timeWithoutSeconds.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return timeString;
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  // Generate Google Maps link for packet pickup address
  const generatePacketPickupMapsLink = (
    address?: string,
    city?: string,
    state?: string,
    zip?: string,
    country?: string
  ): string => {
    const addressParts = [address, city, state, zip, country].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  };

  // Generate Google Maps link for lodging address
  const generateLodgingMapsLink = (): string => {
    const addressParts = [
      meet.lodging_address,
      meet.lodging_city,
      meet.lodging_state,
      meet.lodging_zip
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
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


      {/* Top Right: Coach-only toolbar */}
      {/* Top Right: Coach-only toolbar */}
      {isCoach && (
        <Box 
          position="absolute" 
          top={6} 
          right={6}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Desktop Hover Toolbar */}
          <Box display={{ base: "none", md: "block" }}>
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
                  {/* Add Events */}
                  <Tooltip label="Add events to meet" placement="top" bg="gray.700" color="white" p={2}>
                    <IconButton
                      icon={<FaPlus size={22} color="currentColor" />}
                      variant="ghost"
                      size="lg"
                      color="white"
                      _hover={{ color: "gray.300" }}
                      aria-label="Add events"
                      onClick={() => onAddEvents?.(meet)}
                    />
                  </Tooltip>

                  {/* Manage Athletes */}
                  <Tooltip label="Manage athlete assignments" placement="top" bg="gray.700" color="white" p={2}>
                    <IconButton
                      icon={<FaUsers size={22} color="currentColor" />}
                      variant="ghost"
                      size="lg"
                      color="white"
                      _hover={{ color: "gray.300" }}
                      aria-label="Manage athletes"
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

                  {/* Download PDF */}
                  <Tooltip label="Download meet information" placement="top" bg="gray.700" color="white" p={2}>
                    <IconButton
                      icon={<FaDownload size={22} color="currentColor" />}
                      variant="ghost"
                      size="lg"
                      color="white"
                      _hover={{ color: "gray.300" }}
                      aria-label="Download meet info"
                      onClick={generatePDF}
                    />
                  </Tooltip>

                  {/* Share via Email */}
                  <Tooltip label="Share via email" placement="top" bg="gray.700" color="white" p={2}>
                    <IconButton
                      icon={<FaShare size={22} color="currentColor" />}
                      variant="ghost"
                      size="lg"
                      color="white"
                      _hover={{ color: "gray.300" }}
                      aria-label="Share meet info"
                      onClick={shareViaMail}
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

            {/* Desktop 3 Dots Button */}
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
          
          {/* Mobile 3 Dots Button */}
          <Box display={{ base: "block", md: "none" }}>
            <IconButton
              icon={<FaEllipsisV size={18} />}
              variant="ghost"
              size="sm"
              color="white"
              bg="gray.700"
              _hover={{ color: "white", bg: "gray.600" }}
              aria-label="Options"
              onClick={handleOptionsClick}
            />
          </Box>
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
          {/* Desktop Hover Toolbar */}
          <Box display={{ base: "none", md: "block" }}>
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
                  {/* Manage Events */}
                  <Tooltip label="View events" placement="top" bg="gray.700" color="white" p={2}>
                    <IconButton
                      icon={<FaRunning size={22} color="currentColor" />}
                      variant="ghost"
                      size="lg"
                      color="white"
                      _hover={{ color: "gray.300" }}
                      aria-label="View events"
                      onClick={() => onManageEvents?.(meet)}
                    />
                  </Tooltip>

                  {/* Divider */}
                  <Box w="1px" h="6" bg="gray.400" />

                  {/* Download PDF */}
                  <Tooltip label="Download meet information" placement="top" bg="gray.700" color="white" p={2}>
                    <IconButton
                      icon={<FaDownload size={22} color="currentColor" />}
                      variant="ghost"
                      size="lg"
                      color="white"
                      _hover={{ color: "gray.300" }}
                      aria-label="Download meet info"
                      onClick={generatePDF}
                    />
                  </Tooltip>

                  {/* Share via Email */}
                  <Tooltip label="Share via email" placement="top" bg="gray.700" color="white" p={2}>
                    <IconButton
                      icon={<FaShare size={22} color="currentColor" />}
                      variant="ghost"
                      size="lg"
                      color="white"
                      _hover={{ color: "gray.300" }}
                      aria-label="Share meet info"
                      onClick={shareViaMail}
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
                </HStack>
              </Box>
            )}

            {/* Desktop 3 Dots Button */}
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
          
          {/* Mobile 3 Dots Button */}
          <Box display={{ base: "block", md: "none" }}>
            <IconButton
              icon={<FaEllipsisV size={18} />}
              variant="ghost"
              size="sm"
              color="white"
              bg="gray.700"
              _hover={{ color: "white", bg: "gray.600" }}
              aria-label="Options"
              onClick={handleOptionsClick}
            />
          </Box>
        </Box>
      )}

      {/* Event Title */}
      <Heading size="lg" fontWeight="bold" mb={6} color="white" noOfLines={1}>
        {meet.name}
      </Heading>

      {/* Responsive Layout - Grid on desktop, VStack on mobile */}
      <Box color="white">
        {/* Desktop Layout (md and up) */}
        <Grid 
          templateColumns="40% 30% 30%" 
          gap={8} 
          alignItems="start" 
          minH="120px"
          display={{ base: "none", md: "grid" }}
        >
          {/* Column 1: Event Info */}
          <VStack align="start" spacing={3} pr={6}>
            {/* Event Date Ranges */}
            <VStack align="start" spacing={2}>
              {/* Multi Events Date Range */}
              {(meet.multi_events_start_date || meet.multi_events_end_date) && (
                <HStack spacing={2} color="white">
                  <FaCalendarAlt size={20} color="blue.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="blue.400" fontWeight="medium">Multi Events</Text>
                    <Text fontSize="md" color="white">
                      {meet.multi_events_start_date && formatDate(meet.multi_events_start_date)}
                      {meet.multi_events_end_date && meet.multi_events_start_date !== meet.multi_events_end_date && 
                        ` - ${formatDate(meet.multi_events_end_date)}`}
                    </Text>
                  </VStack>
                </HStack>
              )}
              
              {/* Track & Field Date Range */}
              {(meet.track_field_start_date || meet.track_field_end_date) && (
                <HStack spacing={2} color="white">
                  <FaCalendarAlt size={20} color="blue.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="blue.400" fontWeight="medium">Track & Field</Text>
                    <Text fontSize="md" color="white">
                      {meet.track_field_start_date && formatDate(meet.track_field_start_date)}
                      {meet.track_field_end_date && meet.track_field_start_date !== meet.track_field_end_date && 
                        ` - ${formatDate(meet.track_field_end_date)}`}
                    </Text>
                  </VStack>
                </HStack>
              )}
              
              {/* Fallback to original meet_date if no new dates */}
              {!meet.multi_events_start_date && !meet.multi_events_end_date && 
               !meet.track_field_start_date && !meet.track_field_end_date && (
            <HStack spacing={2} color="white">
              <FaCalendarAlt size={20} color="currentColor" />
              <Text fontSize="md" color="white">
                {formatDate(meet.meet_date)}
              </Text>
            </HStack>
              )}
            </VStack>

            {/* Location */}
            <HStack spacing={2} color="white" align="start">
              <FaMapMarkerAlt size={20} color="currentColor" />
              <VStack align="start" spacing={0}>
                <Text fontSize="md" color="white" fontWeight="medium">{meet.venue_name || "Venue TBD"}</Text>
                <Link 
                  href={generateMapsLink()}
                  isExternal
                  color="blue.400"
                  _hover={{ color: "blue.200", textDecorationColor: "blue.200" }}
                  textDecoration="underline"
                  textDecorationColor="blue.400"
                >
                  <VStack align="start" spacing={0}>
                    {meet.address ? (
                      <Text fontSize="xs">{meet.address}</Text>
                    ) : (
                      <Text fontSize="xs" color="gray.500" fontStyle="italic">No street address</Text>
                    )}
                    <Text fontSize="xs">
                      {[meet.city, meet.state].filter(Boolean).join(' ') || "Location TBD"}
                      {meet.zip && `, ${meet.zip}`}
                    </Text>
                    {meet.country && meet.country !== 'United States' && (
                      <Text fontSize="xs">{meet.country}</Text>
                    )}
                  </VStack>
                </Link>
              </VStack>
            </HStack>

            {/* Travel Distance/Time */}
            <TravelTimeForMeetsCard
              city={meet.city}
              state={meet.state}
              venueName={meet.venue_name}
            />
          </VStack>

          {/* Column 2: Registration */}
          <VStack align="start" spacing={4} borderX="1px solid" borderColor="gray.700" px={8}>
            {/* Registration Info */}
            <VStack align="start" spacing={3}>
              {/* Registration Link */}
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
                <Text fontSize="md" color="gray.400">No Registration Link</Text>
              )}
            </HStack>

              {/* Registration Fees */}
              {(meet.registration_fee || meet.processing_fee) && (
                <HStack spacing={2} color="white">
                  <FaDollarSign size={20} color="blue.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="blue.400" fontWeight="medium">Fees</Text>
                    <VStack align="start" spacing={0} width="full" maxW="180px">
                      {meet.registration_fee && (
                        <Flex justify="space-between" width="full">
                          <Text fontSize="sm" color="white">Registration:</Text>
                          <Text fontSize="sm" color="white" textAlign="right" ml={4}>{formatFee(meet.registration_fee)}</Text>
                        </Flex>
                      )}
                      {meet.processing_fee && (
                        <Flex justify="space-between" width="full">
                          <Text fontSize="sm" color="white">Processing:</Text>
                          <Text fontSize="sm" color="white" textAlign="right" ml={4}>{formatFee(meet.processing_fee)}</Text>
                        </Flex>
                      )}
                    </VStack>
                  </VStack>
                </HStack>
              )}

              {/* Entry Deadline */}
              {meet.entry_deadline_date && (
                <HStack spacing={2} color="white">
                  <FaClock size={20} color="blue.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="blue.400" fontWeight="medium">Entry Deadline</Text>
                    <Text fontSize="sm" color="white">
                      {formatDate(meet.entry_deadline_date)}
                      {meet.entry_deadline_time && ` at ${formatTime(meet.entry_deadline_time)}`}
                    </Text>
                  </VStack>
                </HStack>
              )}

              {/* Packet Pickup Info */}
              {meet.packet_pickup_date && (
                <HStack spacing={2} color="white" align="start">
                  <FaBoxOpen size={20} color="blue.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" color="blue.400" fontWeight="medium">Packet Pickup</Text>
                    <Text fontSize="sm" color="white">{formatDate(meet.packet_pickup_date)}</Text>
                    {(meet.packet_pickup_address || meet.packet_pickup_city) && (
                      <Link
                        href={generatePacketPickupMapsLink(
                          meet.packet_pickup_address,
                          meet.packet_pickup_city,
                          meet.packet_pickup_state,
                          meet.packet_pickup_zip,
                          meet.packet_pickup_country
                        )}
                        isExternal
                        color="blue.400"
                        _hover={{ color: "blue.200", textDecorationColor: "blue.200" }}
                        textDecoration="underline"
                        textDecorationColor="blue.400"
                      >
                        <VStack align="start" spacing={0}>
                          {meet.packet_pickup_address && (
                            <Text fontSize="xs">
                              {meet.packet_pickup_address}
                            </Text>
                          )}
                          <Text fontSize="xs">
                            {[meet.packet_pickup_city, meet.packet_pickup_state].filter(Boolean).join(' ')}
                            {meet.packet_pickup_zip && `, ${meet.packet_pickup_zip}`}
                          </Text>
                          {meet.packet_pickup_country && (
                            <Text fontSize="xs">
                              {meet.packet_pickup_country}
                            </Text>
                          )}
                        </VStack>
                      </Link>
                    )}
                  </VStack>
                </HStack>
              )}
            </VStack>
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
                {meet.description && (
                  <Box 
                    width={2} 
                    height={2} 
                    borderRadius="full" 
                    bg="green.400" 
                    ml={1}
                  />
                )}
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



            {/* Web Links */}
            {(meet.tickets_link || meet.visitor_guide_link) && (
              <VStack align="start" spacing={2}>
                {meet.tickets_link && (
                  <HStack spacing={2} color="white">
                    <FaTicketAlt size={20} color="blue.400" />
                    <Link
                      href={meet.tickets_link}
                      isExternal
                      color="blue.400"
                      _hover={{ color: "blue.200" }}
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      Tickets
                    </Link>
                  </HStack>
                )}
                {meet.visitor_guide_link && (
                  <HStack spacing={2} color="white">
                    <FaBook size={20} color="blue.400" />
                    <Link
                      href={meet.visitor_guide_link}
                      isExternal
                      color="blue.400"
                      _hover={{ color: "blue.200" }}
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      Visitor Guide <FaExternalLinkAlt size={10} color="currentColor" />
                    </Link>
                  </HStack>
                )}
              </VStack>
            )}

            {/* Files */}
            {meet.files && meet.files.length > 0 && (
              <VStack align="start" spacing={2}>
                <HStack spacing={2} color="white">
                  <FaFolder size={20} color="blue.400" />
                  <Text fontSize="sm" color="blue.400" fontWeight="medium">Files</Text>
                </HStack>
                <Box w="full">
                  <MeetFilesList files={meet.files} maxDisplay={5} showActions={false} />
                </Box>
              </VStack>
            )}
          </VStack>
        </Grid>

        {/* Mobile Layout (base to sm) */}
        <VStack 
          spacing={4} 
          align="stretch" 
          display={{ base: "flex", md: "none" }}
        >
          {/* Event Date Ranges */}
          {/* Multi Events Date Range */}
          {(meet.multi_events_start_date || meet.multi_events_end_date) && (
            <HStack spacing={3} color="white">
              <FaCalendarAlt size={18} color="blue.400" />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color="blue.400" fontWeight="medium">Multi Events</Text>
                <Text fontSize="md" color="white">
                  {meet.multi_events_start_date && formatDate(meet.multi_events_start_date)}
                  {meet.multi_events_end_date && meet.multi_events_start_date !== meet.multi_events_end_date && 
                    ` - ${formatDate(meet.multi_events_end_date)}`}
                </Text>
              </VStack>
            </HStack>
          )}
          
          {/* Track & Field Date Range */}
          {(meet.track_field_start_date || meet.track_field_end_date) && (
            <HStack spacing={3} color="white">
              <FaCalendarAlt size={18} color="blue.400" />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color="blue.400" fontWeight="medium">Track & Field</Text>
                <Text fontSize="md" color="white">
                  {meet.track_field_start_date && formatDate(meet.track_field_start_date)}
                  {meet.track_field_end_date && meet.track_field_start_date !== meet.track_field_end_date && 
                    ` - ${formatDate(meet.track_field_end_date)}`}
                </Text>
              </VStack>
            </HStack>
          )}
          
          {/* Fallback to original meet_date if no new dates */}
          {!meet.multi_events_start_date && !meet.multi_events_end_date && 
           !meet.track_field_start_date && !meet.track_field_end_date && (
          <HStack spacing={3} color="white">
            <FaCalendarAlt size={18} color="currentColor" />
            <Text fontSize="md" color="white" fontWeight="medium">
              {formatDate(meet.meet_date)}
            </Text>
          </HStack>
          )}

          {/* Location */}
          <HStack spacing={3} color="white" align="start">
            <FaMapMarkerAlt size={18} color="currentColor" />
            <VStack align="start" spacing={0}>
              <Text fontSize="md" color="white" fontWeight="medium">
                {meet.venue_name || "Venue TBD"}
              </Text>
              <Link 
                href={generateMapsLink()}
                isExternal
                color="blue.400"
                _hover={{ color: "blue.200", textDecorationColor: "blue.200" }}
                textDecoration="underline"
                textDecorationColor="blue.400"
              >
                <VStack align="start" spacing={0}>
                  {meet.address ? (
                    <Text fontSize="xs">{meet.address}</Text>
                  ) : (
                    <Text fontSize="xs" color="gray.500" fontStyle="italic">No street address</Text>
                  )}
                  <Text fontSize="xs">
                    {[meet.city, meet.state].filter(Boolean).join(' ') || "Location TBD"}
                    {meet.zip && `, ${meet.zip}`}
                  </Text>
                  {meet.country && meet.country !== 'United States' && (
                    <Text fontSize="xs">{meet.country}</Text>
                  )}
                </VStack>
              </Link>
            </VStack>
          </HStack>

          {/* Travel Distance */}
          <TravelTimeForMeetsCard
            city={meet.city}
            state={meet.state}
            venueName={meet.venue_name}
          />

          {/* Registration */}
          <HStack spacing={3} color="white">
            <FaFileAlt size={18} color="currentColor" />
            {meet.join_link ? (
              <Link
                href={meet.join_link}
                isExternal
                color="blue.400"
                _hover={{ color: "blue.200" }}
                fontSize="md"
                fontWeight="medium"
              >
                Registration
              </Link>
            ) : (
              <Text fontSize="md" color="gray.400">No Registration Link</Text>
            )}
          </HStack>

          {/* Registration Fees */}
          {(meet.registration_fee || meet.processing_fee) && (
            <HStack spacing={3} color="white" align="start">
              <FaDollarSign size={18} color="blue.400" />
              <VStack align="start" spacing={0} width="full" maxW="180px">
                <Text fontSize="sm" color="blue.400" fontWeight="medium">Fees</Text>
                {meet.registration_fee && (
                  <Flex justify="space-between" width="full">
                    <Text fontSize="sm" color="white">Registration:</Text>
                    <Text fontSize="sm" color="white" textAlign="right" ml={4}>{formatFee(meet.registration_fee)}</Text>
                  </Flex>
                )}
                {meet.processing_fee && (
                  <Flex justify="space-between" width="full">
                    <Text fontSize="sm" color="white">Processing:</Text>
                    <Text fontSize="sm" color="white" textAlign="right" ml={4}>{formatFee(meet.processing_fee)}</Text>
                  </Flex>
                )}
              </VStack>
            </HStack>
          )}

          {/* Entry Deadline */}
          {meet.entry_deadline_date && (
            <HStack spacing={3} color="white" align="start">
              <FaClock size={18} color="blue.400" />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color="blue.400" fontWeight="medium">Entry Deadline</Text>
                <Text fontSize="sm" color="white">
                  {formatDate(meet.entry_deadline_date)}
                  {meet.entry_deadline_time && ` at ${formatTime(meet.entry_deadline_time)}`}
                </Text>
              </VStack>
            </HStack>
          )}

          {/* Packet Pickup Info */}
          {meet.packet_pickup_date && (
            <HStack spacing={3} color="white" align="start">
              <FaBoxOpen size={18} color="blue.400" />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color="blue.400" fontWeight="medium">Packet Pickup</Text>
                <Text fontSize="sm" color="white">{formatDate(meet.packet_pickup_date)}</Text>
                {(meet.packet_pickup_address || meet.packet_pickup_city) && (
                  <Link
                    href={generatePacketPickupMapsLink(
                      meet.packet_pickup_address,
                      meet.packet_pickup_city,
                      meet.packet_pickup_state,
                      meet.packet_pickup_zip,
                      meet.packet_pickup_country
                    )}
                    isExternal
                    color="blue.400"
                    _hover={{ color: "blue.200", textDecorationColor: "blue.200" }}
                    textDecoration="underline"
                    textDecorationColor="blue.400"
                  >
                    <VStack align="start" spacing={0}>
                      {meet.packet_pickup_address && (
                        <Text fontSize="xs">
                          {meet.packet_pickup_address}
                        </Text>
                      )}
                      <Text fontSize="xs">
                        {[meet.packet_pickup_city, meet.packet_pickup_state].filter(Boolean).join(' ')}
                        {meet.packet_pickup_zip && `, ${meet.packet_pickup_zip}`}
                      </Text>
                      {meet.packet_pickup_country && (
                        <Text fontSize="xs">
                          {meet.packet_pickup_country}
                        </Text>
                      )}
                    </VStack>
                  </Link>
                )}
              </VStack>
            </HStack>
          )}

          {/* Web Links */}
          {meet.tickets_link && (
            <HStack spacing={3} color="white">
              <FaTicketAlt size={18} color="blue.400" />
              <Link
                href={meet.tickets_link}
                isExternal
                color="blue.400"
                _hover={{ color: "blue.200" }}
                fontSize="sm"
                fontWeight="medium"
              >
                Tickets
              </Link>
            </HStack>
          )}

          {meet.visitor_guide_link && (
            <HStack spacing={3} color="white">
              <FaBook size={18} color="blue.400" />
              <Link
                href={meet.visitor_guide_link}
                isExternal
                color="blue.400"
                _hover={{ color: "blue.200" }}
                fontSize="sm"
                fontWeight="medium"
              >
                Visitor Guide <FaExternalLinkAlt size={10} color="currentColor" />
              </Link>
            </HStack>
          )}

          {/* Files */}
          {meet.files && meet.files.length > 0 && (
            <VStack align="start" spacing={2}>
              <HStack spacing={3} color="white">
                <FaFolder size={18} color="blue.400" />
                <Text fontSize="sm" color="blue.400" fontWeight="medium">Files</Text>
              </HStack>
              <Box w="full" pl={7}>
                <MeetFilesList files={meet.files} maxDisplay={4} showActions={false} />
              </Box>
            </VStack>
          )}

          {/* Notes */}
          <HStack spacing={3} color="white">
            <FaStickyNote size={18} color="currentColor" />
            <Text fontSize="md" fontWeight="medium" color="white">Notes</Text>
            {meet.description && (
              <Box 
                width={2} 
                height={2} 
                borderRadius="full" 
                bg="green.400" 
                ml={1}
              />
            )}
          </HStack>

          {/* Events count */}
          <HStack spacing={3} color="white">
            <FaRunning size={18} color="currentColor" />
            <Text fontSize="md" fontWeight="medium" color="white">
              Events ({eventCount})
            </Text>
          </HStack>

          {/* Athletes count */}
          <HStack spacing={3} color="white">
            <FaUsers size={18} color="currentColor" />
            <Text fontSize="md" fontWeight="medium" color="white">
              Athletes ({athleteCount})
            </Text>
          </HStack>

          {/* Coach Contact Info - For athletes only */}
          {!isCoach && assignedByCoach && (
            <>
              <Box bg="gray.600" h="1px" my={4} />
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <FaChalkboardTeacher size={16} color="currentColor" />
                  <Text fontSize="sm" color="gray.300">Coach:</Text>
                  <Text fontSize="sm" fontWeight="medium" color="white">{assignedByCoach}</Text>
                </HStack>
                {coachPhone && (
                  <HStack spacing={2} pl={0}>
                    <FaPhoneAlt size={14} color="currentColor" />
                    <Text fontSize="sm" color="gray.300">
                      {(() => {
                        const phone = coachPhone.replace(/\D/g, '');
                        if (phone.length === 10) {
                          return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
                        }
                        return coachPhone;
                      })()}
                    </Text>
                  </HStack>
                )}
                {coachEmail && (
                  <HStack spacing={2} pl={0}>
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
                  </HStack>
                )}
              </VStack>
            </>
          )}

          {/* Assistant Coaches */}
          {(assistantCoach1Name || assistantCoach2Name || assistantCoach3Name) && (
            <>
              <Box bg="gray.600" h="1px" my={4} />
              <VStack spacing={1} align="start" w="full">
                {assistantCoach1Name && (
                  <VStack align="start" spacing={1} color="white">
                    <HStack spacing={2}>
                      <FaUserTie size={16} color="currentColor" />
                      <Text fontSize="sm" color="gray.400">Assistant:</Text>
                      <Text fontSize="sm" color="gray.200">{assistantCoach1Name}</Text>
                    </HStack>
                    {assistantCoach1Phone && (
                      <HStack spacing={2} pl={0}>
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
                      </HStack>
                    )}
                    {assistantCoach1Email && (
                      <HStack spacing={2} pl={0}>
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
                      </HStack>
                    )}
                  </VStack>
                )}

                {assistantCoach2Name && (
                  <VStack align="start" spacing={1} color="white">
                    <HStack spacing={2}>
                      <FaUserTie size={16} color="currentColor" />
                      <Text fontSize="sm" color="gray.400">Assistant:</Text>
                      <Text fontSize="sm" color="gray.200">{assistantCoach2Name}</Text>
                    </HStack>
                    {assistantCoach2Phone && (
                      <HStack spacing={2} pl={0}>
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
                      </HStack>
                    )}
                    {assistantCoach2Email && (
                      <HStack spacing={2} pl={0}>
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
                      </HStack>
                    )}
                  </VStack>
                )}

                {assistantCoach3Name && (
                  <VStack align="start" spacing={1} color="white">
                    <HStack spacing={2}>
                      <FaUserTie size={16} color="currentColor" />
                      <Text fontSize="sm" color="gray.400">Assistant:</Text>
                      <Text fontSize="sm" color="gray.200">{assistantCoach3Name}</Text>
                    </HStack>
                    {assistantCoach3Phone && (
                      <HStack spacing={2} pl={0}>
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
                      </HStack>
                    )}
                    {assistantCoach3Email && (
                      <HStack spacing={2} pl={0}>
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
                      </HStack>
                    )}
                  </VStack>
                )}
              </VStack>
            </>
          )}

          {/* Lodging Information */}
          {meet.lodging_type && (
            <>
              <Box bg="gray.600" h="1px" my={4} />
              <VStack spacing={2} align="start" w="full">
                <HStack spacing={2} color="white">
                  <FaBed size={16} color="currentColor" />
                  <Text fontSize="sm" color="gray.300" fontWeight="medium">Lodging:</Text>
                </HStack>
                
                <VStack align="start" spacing={3} pl={6} w="full">
                  {/* Place name and type */}
                  <Text fontSize="sm" fontWeight="medium" color="white">
                    {meet.lodging_place_name ? `${meet.lodging_place_name} (${meet.lodging_type})` : meet.lodging_type}
                  </Text>

                  {/* Address */}
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" color="gray.400" fontWeight="bold" textTransform="uppercase">
                      Address
                    </Text>
                    {(meet.lodging_address || meet.lodging_city || meet.lodging_state || meet.lodging_zip) ? (
                      <Link
                        href={generateLodgingMapsLink()}
                        isExternal
                        color="blue.400"
                        _hover={{ color: "blue.200", textDecorationColor: "blue.200" }}
                        textDecoration="underline"
                        textDecorationColor="blue.400"
                        w="full"
                      >
                        <VStack align="start" spacing={0}>
                          {meet.lodging_address && (
                            <Text fontSize="sm">
                              {meet.lodging_address}
                            </Text>
                          )}
                          {(meet.lodging_city || meet.lodging_state || meet.lodging_zip) && (
                            <Text fontSize="sm">
                              {[meet.lodging_city, meet.lodging_state, meet.lodging_zip].filter(Boolean).join(', ')}
                            </Text>
                          )}
                        </VStack>
                      </Link>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        No address provided
                      </Text>
                    )}
                  </VStack>

                  {/* Contact */}
                  {(meet.lodging_phone || meet.lodging_email || meet.lodging_website) && (
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" color="gray.400" fontWeight="bold" textTransform="uppercase">
                        Contact
                      </Text>
                      {meet.lodging_phone && (
                        <HStack spacing={2}>
                          <FaPhoneAlt size={12} color="currentColor" />
                          <Text fontSize="sm" color="gray.300">
                            {(() => {
                              const phone = meet.lodging_phone.replace(/\D/g, '');
                              if (phone.length === 10) {
                                return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
                              }
                              return meet.lodging_phone;
                            })()}
                          </Text>
                        </HStack>
                      )}
                      {meet.lodging_email && (
                        <HStack spacing={2}>
                          <FaAt size={12} color="currentColor" />
                          <Text 
                            fontSize="sm" 
                            color="blue.400"
                            _hover={{ color: "blue.300" }}
                            cursor="pointer"
                            onClick={() => window.open(`mailto:${meet.lodging_email}`, '_blank')}
                          >
                            {meet.lodging_email}
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
                    </VStack>
                  )}

                  {/* Schedule */}
                  {(meet.lodging_checkin_date || meet.lodging_checkout_date) && (
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
                    </VStack>
                  )}
                </VStack>
              </VStack>
            </>
          )}
        </VStack>
      </Box>

      {/* Separator line and Your Events section - Only for athletes */}
      {!isCoach && myAssignedEvents.length > 0 && (
        <>
          {/* Separator line */}
          <Box bg="gray.600" h="1px" my={4} />

                      <VStack align="start" spacing={2} w="full">
                        <HStack spacing={2} justify="space-between" w="full" color="white">
              <HStack spacing={2}>
                <FaRunning size={20} color="currentColor" />
                <Text fontSize="md" fontWeight="medium" color="white">Your Events ({myAssignedEvents.length})</Text>
              </HStack>
            </HStack>
            <VStack align="start" spacing={0} pl={6} w="full">
              {myAssignedEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <VStack 
                    spacing={1} 
                    align="stretch"
                    w="full"
                    py={2}
                  >
                    {/* Main event row */}
                    <HStack 
                      spacing={2} 
                      justify="space-between" 
                      w="full"
                    >
                      <Text fontSize="sm" color="gray.300" flex="1" fontWeight="medium">{event.name}</Text>
                      
                      <HStack spacing={2}>
                        {/* Time display only */}
                        {event.time && (
                          <Text fontSize="xs" fontWeight="medium" color="green.300">{event.time}</Text>
                        )}
                        
                        {/* Edit/Delete buttons */}
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          color="white"
                          _hover={{ color: "gray.300" }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              // Fetch full event data from database
                              const { data: fullEventData, error } = await supabase
                                .from('meet_events')
                                .select('*')
                                .eq('id', event.id)
                                .single();

                              if (error) {
                                console.error('Error fetching event data:', error);
                                toast({
                                  title: 'Error',
                                  description: 'Failed to load event data for editing',
                                  status: 'error',
                                  duration: 3000,
                                  isClosable: true,
                                });
                                return;
                              }

                              onEditEvent?.(fullEventData, meet);
                            } catch (error) {
                              console.error('Unexpected error:', error);
                              toast({
                                title: 'Error',
                                description: 'An unexpected error occurred',
                                status: 'error',
                                duration: 3000,
                                isClosable: true,
                              });
                            }
                          }}
                          aria-label={`Edit ${event.name}`}
                        >
                          <FaEdit />
                        </Button>
                        
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          color="white"
                          _hover={{ color: "gray.300" }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete the event "${event.name}"?`)) {
                              try {
                                // First, delete the athlete assignment
                                const { error: assignmentError } = await supabase
                                  .from('athlete_meet_events')
                                  .delete()
                                  .eq('meet_event_id', event.id)
                                  .eq('athlete_id', user?.id);

                                if (assignmentError) {
                                  console.error('Error deleting assignment:', assignmentError);
                                  toast({
                                    title: 'Error',
                                    description: 'Failed to delete event assignment',
                                    status: 'error',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                  return;
                                }

                                // Then delete the event itself
                                const { error: eventError } = await supabase
                                  .from('meet_events')
                                  .delete()
                                  .eq('id', event.id);

                                if (eventError) {
                                  console.error('Error deleting event:', eventError);
                                  toast({
                                    title: 'Error',
                                    description: 'Failed to delete event',
                                    status: 'error',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                  return;
                                }

                                toast({
                                  title: 'Success',
                                  description: `Event "${event.name}" deleted successfully`,
                                  status: 'success',
                                  duration: 3000,
                                  isClosable: true,
                                });

                                // Refresh the meets data
                                onRefresh?.();
                              } catch (error) {
                                console.error('Unexpected error deleting event:', error);
                                toast({
                                  title: 'Error',
                                  description: 'An unexpected error occurred',
                                  status: 'error',
                                  duration: 3000,
                                  isClosable: true,
                                });
                              }
                            }
                          }}
                          aria-label={`Delete ${event.name}`}
                        >
                          <FaTrash />
                        </Button>
                      </HStack>
                    </HStack>

                    {/* Event details - Desktop: horizontal row, Mobile: vertical list */}
                    {/* Desktop Layout */}
                    <HStack spacing={4} pl={2} wrap="wrap" display={{ base: "none", md: "flex" }}>
                      {event.event_date && (
                        <Text fontSize="xs" color="gray.500">
                          {formatEventDate(event.event_date)}
                        </Text>
                      )}
                      {event.event_day && (
                        <Text fontSize="xs" color="gray.500">
                          Day: {event.event_day}
                        </Text>
                      )}
                      {event.start_time && (
                        <Text fontSize="xs" color="gray.500">
                          Time: {event.start_time.slice(0, 5)}
                        </Text>
                      )}
                      {event.heat && (
                        <Text fontSize="xs" color="gray.500">
                          Heat: {event.heat}
                        </Text>
                      )}
                      {event.event_type && (
                        <Text fontSize="xs" color="gray.500">
                          Type: {event.event_type}
                        </Text>
                      )}
                    </HStack>

                    {/* Mobile Layout - Vertical List */}
                    <VStack spacing={1} align="start" pl={2} display={{ base: "flex", md: "none" }}>
                      {event.event_date && (
                        <Text fontSize="xs" color="gray.500">
                          {formatEventDate(event.event_date)}
                        </Text>
                      )}
                      {event.event_day && (
                        <Text fontSize="xs" color="gray.500">
                          Day: {event.event_day}
                        </Text>
                      )}
                      {event.start_time && (
                        <Text fontSize="xs" color="gray.500">
                          Time: {event.start_time.slice(0, 5)}
                        </Text>
                      )}
                      {event.event_type && (
                        <Text fontSize="xs" color="gray.500">
                          Type: {event.event_type}
                        </Text>
                      )}
                    </VStack>
                  </VStack>
                  
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
          </VStack>
        </>
      )}

      {/* Events List section - Only for coaches */}
      {isCoach && allEvents.length > 0 && (
        <>
          {/* Separator line */}
          <Box bg="gray.600" h="1px" my={4} />

          <Box color="white">
            <EventsListSection
              events={allEvents}
              onEditEvent={(event) => onEditEvent?.(event, meet)}
              onAssignAthletes={(event) => onAssignAthletesToEvent?.(event, meet)}
              onDeleteEvent={async (event) => {
                if (window.confirm(`Are you sure you want to delete "${event.event_name}"?`)) {
                  try {
                    const { error } = await supabase
                      .from('meet_events')
                      .delete()
                      .eq('id', event.id);

                    if (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to delete event',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                      });
                      return;
                    }

                    toast({
                      title: 'Success',
                      description: `Event "${event.event_name}" deleted successfully`,
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    });

                    // Refresh the meets data
                    onRefresh?.();
                  } catch (error) {
                    console.error('Unexpected error deleting event:', error);
                    toast({
                      title: 'Error',
                      description: 'An unexpected error occurred',
                      status: 'error',
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                }
              }}
              showActions={true}
            />
          </Box>
        </>
      )}

      {/* Assistant Coaches - Always show if present (regardless of coach/athlete status) */}
      {(assistantCoach1Name || assistantCoach2Name || assistantCoach3Name) && (
        <>
          {/* Separator line */}
          <Box bg="gray.600" h="1px" my={4} />
          
          <VStack spacing={1} align="start" w="full">
            {/* Assistant Coach 1 */}
            {assistantCoach1Name && (
              <VStack align="start" spacing={1} color="white">
                {/* Desktop Layout */}
                <HStack spacing={2} color="white" display={{ base: "none", md: "flex" }}>
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

                {/* Mobile Layout */}
                <VStack align="start" spacing={1} display={{ base: "flex", md: "none" }}>
                  <HStack spacing={2}>
                    <FaUserTie size={16} color="currentColor" />
                    <Text fontSize="sm" color="gray.400">Assistant:</Text>
                    <Text fontSize="sm" color="gray.200">{assistantCoach1Name}</Text>
                  </HStack>
                  {assistantCoach1Phone && (
                    <HStack spacing={2} pl={0}>
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
                    </HStack>
                  )}
                  {assistantCoach1Email && (
                    <HStack spacing={2} pl={0}>
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
                    </HStack>
                  )}
                </VStack>
              </VStack>
            )}
            
            {/* Assistant Coach 2 */}
            {assistantCoach2Name && (
              <VStack align="start" spacing={1} color="white">
                {/* Desktop Layout */}
                <HStack spacing={2} color="white" display={{ base: "none", md: "flex" }}>
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

                {/* Mobile Layout */}
                <VStack align="start" spacing={1} display={{ base: "flex", md: "none" }}>
                  <HStack spacing={2}>
                    <FaUserTie size={16} color="currentColor" />
                    <Text fontSize="sm" color="gray.400">Assistant:</Text>
                    <Text fontSize="sm" color="gray.200">{assistantCoach2Name}</Text>
                  </HStack>
                  {assistantCoach2Phone && (
                    <HStack spacing={2} pl={0}>
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
                    </HStack>
                  )}
                  {assistantCoach2Email && (
                    <HStack spacing={2} pl={0}>
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
                    </HStack>
                  )}
                </VStack>
              </VStack>
            )}
            
            {/* Assistant Coach 3 */}
            {assistantCoach3Name && (
              <VStack align="start" spacing={1} color="white">
                {/* Desktop Layout */}
                <HStack spacing={2} color="white" display={{ base: "none", md: "flex" }}>
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

                {/* Mobile Layout */}
                <VStack align="start" spacing={1} display={{ base: "flex", md: "none" }}>
                  <HStack spacing={2}>
                    <FaUserTie size={16} color="currentColor" />
                    <Text fontSize="sm" color="gray.400">Assistant:</Text>
                    <Text fontSize="sm" color="gray.200">{assistantCoach3Name}</Text>
                  </HStack>
                  {assistantCoach3Phone && (
                    <HStack spacing={2} pl={0}>
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
                    </HStack>
                  )}
                  {assistantCoach3Email && (
                    <HStack spacing={2} pl={0}>
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
                    </HStack>
                  )}
                </VStack>
              </VStack>
            )}
          </VStack>
        </>
      )}

      {/* Coach Information - Only show for athletes (not when coach views their own card) */}
      {!isCoach && assignedByCoach && (
        <>
          {/* Divider line between events and coach info */}
          <Box bg="gray.600" h="1px" w="full" my={3} />
          
          <VStack spacing={1} align="start" pt={2} w="full">
            {/* Desktop Layout */}
            <HStack spacing={2} color="white" display={{ base: "none", md: "flex" }}>
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

            {/* Mobile Layout */}
            <VStack align="start" spacing={1} display={{ base: "flex", md: "none" }}>
              <HStack spacing={2}>
                <FaChalkboardTeacher size={16} color="currentColor" />
                <Text fontSize="sm" color="gray.300">Coach:</Text>
                <Text fontSize="sm" fontWeight="medium" color="white">{assignedByCoach}</Text>
              </HStack>
              {coachPhone && (
                <HStack spacing={2} pl={0}>
                  <FaPhoneAlt size={14} color="currentColor" />
                  <Text fontSize="sm" color="gray.300">
                    {(() => {
                      const phone = coachPhone.replace(/\D/g, '');
                      if (phone.length === 10) {
                        return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
                      }
                      return coachPhone;
                    })()}
                  </Text>
                </HStack>
              )}
              {coachEmail && (
                <HStack spacing={2} pl={0}>
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
                </HStack>
              )}
            </VStack>
          </VStack>
        </>
      )}

      {/* Lodging information - Always show if present (regardless of coach/athlete status) */}
      {meet.lodging_type && (
        <>
          {/* Divider between previous section and lodging */}
          <Box bg="gray.600" h="1px" w="full" my={3} />
          
          <VStack spacing={2} align="start" w="full">
            <HStack spacing={2} color="white">
              <FaBed size={16} color="currentColor" />
              <Text fontSize="sm" color="gray.300" fontWeight="medium">Lodging:</Text>
            </HStack>
            
            {/* Responsive Lodging Layout */}
            <Box w="full" pl={6}>
              {/* Desktop Layout (md and up) */}
              <Grid 
                templateColumns="1fr 1fr 1fr" 
                gap={4} 
                w="full" 
                display={{ base: "none", md: "grid" }}
              >
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
                  {(meet.lodging_address || meet.lodging_city || meet.lodging_state || meet.lodging_zip) ? (
                    <Link
                      href={generateLodgingMapsLink()}
                      isExternal
                      color="blue.400"
                      _hover={{ color: "blue.200", textDecorationColor: "blue.200" }}
                      textDecoration="underline"
                      textDecorationColor="blue.400"
                      w="full"
                    >
                      <VStack align="start" spacing={0}>
                        {/* Street address */}
                        {meet.lodging_address && (
                          <Text fontSize="sm">
                            {meet.lodging_address}
                          </Text>
                        )}
                        
                        {/* City, State, Zip on one line */}
                        {(meet.lodging_city || meet.lodging_state || meet.lodging_zip) && (
                          <Text fontSize="sm">
                            {[meet.lodging_city, meet.lodging_state, meet.lodging_zip].filter(Boolean).join(', ')}
                          </Text>
                        )}
                      </VStack>
                    </Link>
                  ) : (
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
                  {meet.lodging_email && (
                    <HStack spacing={2}>
                      <FaAt size={12} color="currentColor" />
                      <Text 
                        fontSize="sm" 
                        color="blue.400"
                        _hover={{ color: "blue.300" }}
                        cursor="pointer"
                        onClick={() => window.open(`mailto:${meet.lodging_email}`, '_blank')}
                      >
                        {meet.lodging_email}
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
                  {!meet.lodging_phone && !meet.lodging_email && !meet.lodging_website && (
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

              {/* Mobile Layout (base to sm) */}
              <VStack 
                spacing={4} 
                align="stretch" 
                w="full"
                display={{ base: "flex", md: "none" }}
              >
                {/* Place name and type */}
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium" color="white">
                    {meet.lodging_place_name ? `${meet.lodging_place_name} (${meet.lodging_type})` : meet.lodging_type}
                  </Text>
                </VStack>

                {/* Address */}
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.400" fontWeight="bold" textTransform="uppercase">
                    Address
                  </Text>
                  {(meet.lodging_address || meet.lodging_city || meet.lodging_state || meet.lodging_zip) ? (
                    <Link
                      href={generateLodgingMapsLink()}
                      isExternal
                      color="blue.400"
                      _hover={{ color: "blue.200", textDecorationColor: "blue.200" }}
                      textDecoration="underline"
                      textDecorationColor="blue.400"
                      w="full"
                    >
                      <VStack align="start" spacing={0}>
                        {meet.lodging_address && (
                          <Text fontSize="sm">
                            {meet.lodging_address}
                          </Text>
                        )}
                        {(meet.lodging_city || meet.lodging_state || meet.lodging_zip) && (
                          <Text fontSize="sm">
                            {[meet.lodging_city, meet.lodging_state, meet.lodging_zip].filter(Boolean).join(', ')}
                          </Text>
                        )}
                      </VStack>
                    </Link>
                  ) : (
                    <Text fontSize="sm" color="gray.500">
                      No address provided
                    </Text>
                  )}
                </VStack>

                {/* Contact */}
                {(meet.lodging_phone || meet.lodging_email || meet.lodging_website) && (
                  <VStack align="start" spacing={2}>
                    <Text fontSize="sm" color="gray.400" fontWeight="bold" textTransform="uppercase">
                      Contact
                    </Text>
                    {meet.lodging_phone && (
                      <HStack spacing={2}>
                        <FaPhoneAlt size={12} color="currentColor" />
                        <Text fontSize="sm" color="gray.300">
                          {(() => {
                            const phone = meet.lodging_phone.replace(/\D/g, '');
                            if (phone.length === 10) {
                              return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
                            }
                            return meet.lodging_phone;
                          })()}
                        </Text>
                      </HStack>
                    )}
                    {meet.lodging_email && (
                      <HStack spacing={2}>
                        <FaAt size={12} color="currentColor" />
                        <Text 
                          fontSize="sm" 
                          color="blue.400"
                          _hover={{ color: "blue.300" }}
                          cursor="pointer"
                          onClick={() => window.open(`mailto:${meet.lodging_email}`, '_blank')}
                        >
                          {meet.lodging_email}
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
                  </VStack>
                )}

                {/* Schedule */}
                {(meet.lodging_checkin_date || meet.lodging_checkout_date) && (
                  <VStack align="start" spacing={2}>
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
                  </VStack>
                )}
              </VStack>
            </Box>
            
            {/* Additional details - full width below columns */}
            {meet.lodging_details && (
              <Text fontSize="sm" color="gray.400" fontStyle="italic" pl={6} pt={1}>
                {meet.lodging_details}
              </Text>
            )}
          </VStack>
        </>
      )}

      {/* Email Share Modal */}
      <EmailModal />
      
      {/* Unified Meet Options Drawer */}
      <MobileMeetOptionsDrawer
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        meet={meet}
        isCoach={isCoach}
        onEdit={onEdit}
        onDelete={onDelete}
        onAssignAthletes={onAssignAthletes}
        onManageEvents={onManageEvents}
        onAddEvents={onAddEvents}
        onDownloadPDF={generatePDF}
        onShareViaEmail={shareViaMail}
      />
    </Box>
  );
};

export const Meets: React.FC = () => {
  // Use page header hook
  usePageHeader({
    title: 'Meets',
    subtitle: 'Events & Competitions',
    icon: BiCalendar
  });

  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isEventDrawerOpen, onOpen: onEventDrawerOpen, onClose: onEventDrawerClose } = useDisclosure();
  const { isOpen: isAssignDrawerOpen, onOpen: onAssignDrawerOpen, onClose: onAssignDrawerClose } = useDisclosure();
  const { isOpen: isAddEventOpen, onOpen: onAddEventOpen, onClose: onAddEventClose } = useDisclosure();
  const { isOpen: isLocationSetupOpen, onOpen: onLocationSetupOpen, onClose: onLocationSetupClose } = useDisclosure();
  const { isOpen: isBulkCreatorOpen, onOpen: onBulkCreatorOpen, onClose: onBulkCreatorClose } = useDisclosure();
  const { isOpen: isAthleteManagerOpen, onOpen: onAthleteManagerOpen, onClose: onAthleteManagerClose } = useDisclosure();
  
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
    myAssignedEvents: Array<{ 
      id: string; 
      name: string; 
      time: string | null;
      event_date?: string;
      event_day?: number;
      start_time?: string;
      heat?: number;
      event_type?: string;
      run_time?: string;
    }>;
    allEvents: Array<{
      id: string;
      event_name: string;
      event_date?: string;
      event_day?: number;
      start_time?: string;
      heat?: number;
      event_type?: string;
      run_time?: string;
    }>;
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

  // Edit event modal state
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingMeet, setEditingMeet] = useState<any>(null);

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

  // Meet filtering logic using timezone-aware utilities
  const filteredMeets = useMemo(() => {
    return categorizeMeetsByDate(meets);
  }, [meets]);

  // Helper function to render meets with badges
  const renderMeets = (meetsToRender: TrackMeet[], showBadges = false) => {
    if (meetsToRender.length === 0) {
      // Check if this is truly the first meet (no meets at all) or just an empty filter
      const isFirstMeet = meets.length === 0;
      
      return (
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
            {userIsCoach 
              ? (isFirstMeet ? "Create your first track meet to get started." : "No meets found in this category.")
              : "No meets have been assigned to you yet."
            }
          </Text>
          {userIsCoach && (
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              onClick={handleCreateMeet}
            >
              {isFirstMeet ? "Create First Meet" : "Create Meet"}
            </Button>
          )}
        </Box>
      );
    }

    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <VStack spacing={4} align="stretch">
        {meetsToRender.map((meet) => {
          const meetDate = new Date(meet.meet_date);
          const isUpcoming = meetDate >= today;
          const isPast = meetDate < today;
          
          return (
            <Box key={meet.id} position="relative">
              <MeetCard
                meet={meet}
                isCoach={userIsCoach}
                onEdit={handleEditMeet}
                onDelete={handleDeleteMeet}
                onAssignAthletes={handleAssignAthletes}
                onManageEvents={handleManageEvents}
                onAddEvents={handleAddEvents}
                onRefresh={fetchMeets}
                onOpenRunTimeModal={openRunTimeModal}
                onEditEvent={(event, meet) => {
                  setEditingEvent(event);
                  setEditingMeet(meet);
                  setIsEditEventModalOpen(true);
                }}
                onAssignAthletesToEvent={(event, meet) => {
                  // TODO: Open athlete assignment drawer
                  console.log('Assign athletes to event:', event.event_name);
                }}
                athleteCount={meetData[meet.id]?.athleteCount || 0}
                eventCount={meetData[meet.id]?.eventCount || 0}
                athleteNames={meetData[meet.id]?.athleteNames || []}
                myAssignedEvents={meetData[meet.id]?.myAssignedEvents || []}
                allEvents={meetData[meet.id]?.allEvents || []}
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
            </Box>
          );
        })}
      </VStack>
    );
  };

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
            end_date,
            lodging_type, lodging_place_name, lodging_address, lodging_city, lodging_state, lodging_zip, 
            lodging_phone, lodging_website, lodging_checkin_date, lodging_checkout_date, 
            lodging_checkin_time, lodging_checkout_time, lodging_details,
            assistant_coach_1_name, assistant_coach_1_phone, assistant_coach_1_email,
            assistant_coach_2_name, assistant_coach_2_phone, assistant_coach_2_email,
            assistant_coach_3_name, assistant_coach_3_phone, assistant_coach_3_email,
            files:meet_files(*)
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
                end_date,
                lodging_type, lodging_place_name, lodging_address, lodging_city, lodging_state, lodging_zip, 
                lodging_phone, lodging_website, lodging_checkin_date, lodging_checkout_date, 
                lodging_checkin_time, lodging_checkout_time, lodging_details,
                assistant_coach_1_name, assistant_coach_1_phone, assistant_coach_1_email,
                assistant_coach_2_name, assistant_coach_2_phone, assistant_coach_2_email,
                assistant_coach_3_name, assistant_coach_3_phone, assistant_coach_3_email,
                files:meet_files(*)
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
      
      // Define fetchMeetData function with optimized bulk queries
      const fetchMeetData = async (meetsData: TrackMeet[], isCoachUser: boolean) => {
        const dataMap: Record<string, any> = {};
        
        // Initialize default data for all meets
        for (const meet of meetsData) {
          dataMap[meet.id] = {
            athleteCount: 0,
            eventCount: 0,
            athleteNames: [],
            myAssignedEvents: [],
            allEvents: [],
            assignedByCoach: null,
            coachPhone: null,
            coachEmail: null,
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
            distance: meet.city && meet.state ? `${meet.city}, ${meet.state}` : "Distance TBD"
          };
        }

        if (meetsData.length === 0) {
          setMeetData(dataMap);
          return;
        }

        try {
          const meetIds = meetsData.map(meet => meet.id);
          
          // 1. BULK QUERY: Get all meet events for all meets
          const { data: allMeetEvents } = await supabase
            .from('meet_events')
            .select('id, meet_id, event_name, event_date, event_day, start_time, heat, event_type, run_time')
            .in('meet_id', meetIds);

          if (!allMeetEvents || allMeetEvents.length === 0) {
            setMeetData(dataMap);
            return;
          }

          // Group events by meet_id and set event counts
          const eventsByMeet = allMeetEvents.reduce((acc, event) => {
            if (!acc[event.meet_id]) {
              acc[event.meet_id] = [];
            }
            acc[event.meet_id].push(event);
            return acc;
          }, {} as Record<string, any[]>);

          // Set event counts
          Object.keys(eventsByMeet).forEach(meetId => {
            if (dataMap[meetId]) {
              dataMap[meetId].eventCount = eventsByMeet[meetId].length;
            }
          });

          const allEventIds = allMeetEvents.map(event => event.id);

          // 2. BULK QUERY: Get all athlete assignments for all events
          const { data: allAthleteAssignments } = await supabase
            .from('athlete_meet_events')
            .select('meet_event_id, athlete_id, assigned_by, result, status')
            .in('meet_event_id', allEventIds);

          if (!allAthleteAssignments || allAthleteAssignments.length === 0) {
            // No assignments, but still set allEvents for coaches
            if (isCoachUser) {
              Object.keys(eventsByMeet).forEach(meetId => {
                if (dataMap[meetId]) {
                  dataMap[meetId].allEvents = eventsByMeet[meetId].map(event => ({
                    ...event,
                    athleteCount: 0,
                    athleteNames: []
                  }));
                }
              });
            }
            setMeetData(dataMap);
            return;
          }

          // 3. BULK QUERY: Get all athlete profiles needed
          const allAthleteIds = [...new Set(allAthleteAssignments.map(a => a.athlete_id))];
          const { data: allAthleteProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, phone, email')
            .in('id', allAthleteIds);

          // Create athlete profile lookup map
          const athleteProfileMap = (allAthleteProfiles || []).reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);

          // 4. BULK QUERY: Get coach profiles for athlete assignments
          const coachIds = [...new Set(allAthleteAssignments.map(a => a.assigned_by).filter(Boolean))];
          const { data: allCoachProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, phone, email')
            .in('id', coachIds);

          // Create coach profile lookup map
          const coachProfileMap = (allCoachProfiles || []).reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);

          // Group assignments by meet_event_id
          const assignmentsByEvent = allAthleteAssignments.reduce((acc, assignment) => {
            if (!acc[assignment.meet_event_id]) {
              acc[assignment.meet_event_id] = [];
            }
            acc[assignment.meet_event_id].push(assignment);
            return acc;
          }, {} as Record<string, any[]>);

          // Process data for each meet
          Object.keys(eventsByMeet).forEach(meetId => {
            if (!dataMap[meetId]) return;

            const meetEvents = eventsByMeet[meetId];
            const meetEventIds = meetEvents.map(e => e.id);
            
            // Get all assignments for this meet's events
            const meetAssignments = allAthleteAssignments.filter(a => 
              meetEventIds.includes(a.meet_event_id)
            );

            if (isCoachUser) {
              // Coach view: Get all athlete assignments for this meet
              const uniqueAthleteIds = [...new Set(meetAssignments.map(a => a.athlete_id))];
              
              dataMap[meetId].athleteCount = uniqueAthleteIds.length;
              dataMap[meetId].athleteNames = uniqueAthleteIds.map(athleteId => {
                const profile = athleteProfileMap[athleteId];
                return profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown Athlete';
              });

              // Add per-event athlete data
              dataMap[meetId].allEvents = meetEvents.map(event => {
                const eventAssignments = assignmentsByEvent[event.id] || [];
                return {
                  ...event,
                  athleteCount: eventAssignments.length,
                  athleteNames: eventAssignments.map(assignment => {
                    const profile = athleteProfileMap[assignment.athlete_id];
                    return profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown Athlete';
                  })
                };
              });

            } else {
              // Athlete view: Get only this athlete's assignments
              const myAssignments = meetAssignments.filter(a => a.athlete_id === user?.id);
              
              if (myAssignments.length > 0) {
                // Build myAssignedEvents
                const assignedEventIds = myAssignments.map(a => a.meet_event_id);
                const assignedEvents = meetEvents.filter(e => assignedEventIds.includes(e.id));
                
                dataMap[meetId].myAssignedEvents = assignedEvents.map(e => {
                  const assignment = myAssignments.find(a => a.meet_event_id === e.id);
                  return {
                    id: e.id,
                    name: e.event_name,
                    time: assignment?.result || null,
                    event_date: e.event_date,
                    event_day: e.event_day,
                    start_time: e.start_time,
                    heat: e.heat,
                    event_type: e.event_type,
                    run_time: e.run_time
                  };
                }).sort((a, b) => {
                  // Sort by date first, then by time
                  const dateA = a.event_date ? new Date(a.event_date) : new Date(0);
                  const dateB = b.event_date ? new Date(b.event_date) : new Date(0);
                  
                  if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime();
                  }
                  
                  // If dates are the same (or both null), sort by start_time
                  const timeA = a.start_time || '00:00:00';
                  const timeB = b.start_time || '00:00:00';
                  
                  return timeA.localeCompare(timeB);
                });

                // Get coach who assigned (use the first assignment's coach)
                const coachId = myAssignments[0]?.assigned_by;
                if (coachId && coachProfileMap[coachId]) {
                  const coachProfile = coachProfileMap[coachId];
                  dataMap[meetId].assignedByCoach = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
                  dataMap[meetId].coachPhone = coachProfile.phone || null;
                  dataMap[meetId].coachEmail = coachProfile.email || null;
                }

                dataMap[meetId].athleteCount = dataMap[meetId].myAssignedEvents.length;
              }

              // Also show all athletes assigned to this meet for the tooltip
              const uniqueAthleteIds = [...new Set(meetAssignments.map(a => a.athlete_id))];
              dataMap[meetId].athleteNames = uniqueAthleteIds.map(athleteId => {
                const profile = athleteProfileMap[athleteId];
                return profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown Athlete';
              });
              
              // Update athlete count to show total athletes, not just events
              if (dataMap[meetId].myAssignedEvents.length === 0) {
                dataMap[meetId].athleteCount = uniqueAthleteIds.length;
              }
            }
          });

        } catch (error) {
          console.error('Error in bulk fetchMeetData:', error);
          // Keep default data on error
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
    // Open the new athlete event manager for coaches
    if (userIsCoach) {
      onAthleteManagerOpen();
    } else {
      // Keep original behavior for athletes
      fetchMeetEventsForManagement(meet.id);
      onEventDrawerOpen();
    }
  }, [userIsCoach, onAthleteManagerOpen, onEventDrawerOpen]);

  const handleAddEvent = useCallback((meet: TrackMeet) => {
    setCurrentMeet(meet);
    onAddEventOpen();
  }, [onAddEventOpen]);

  const handleAddEvents = useCallback((meet: TrackMeet) => {
    setCurrentMeet(meet);
    onBulkCreatorOpen();
  }, [onBulkCreatorOpen]);

  const handleEventCreated = useCallback(async () => {
    // Refresh all meet data to update event counts and assignments
    await fetchMeets();
    onAddEventClose();
  }, [onAddEventClose]);

  const handleBulkEventsCreated = useCallback(async () => {
    // Refresh all meet data to update event counts and assignments
    await fetchMeets();
    onBulkCreatorClose();
  }, [fetchMeets, onBulkCreatorClose]);

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
        const { data: newEvent, error } = await supabase
          .from('meet_events')
          .insert([eventData])
          .select();
        
        if (error) throw error;
        
        // Auto-assign the athlete to the event they created (if user is athlete)
        if (newEvent && newEvent.length > 0 && user?.id && !userIsCoach) {
          const { error: assignmentError } = await supabase
            .from('athlete_meet_events')
            .insert([{
              athlete_id: user.id,
              meet_event_id: newEvent[0].id,
              assigned_by: user.id // Self-assigned
            }]);
          
          if (assignmentError) {
            console.error('Error auto-assigning athlete to event:', assignmentError);
            // Don't throw error - event was created successfully, assignment failed
          }
        }
        
        toast({
          title: 'Event added',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
      
      // Refresh events for this meet
      await fetchMeetEventsForManagement(currentMeet.id);
      // Refresh the main meets data to update event counts
      await fetchMeets();
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
      {/* Desktop Header */}
      <PageHeader
        title="Meets"
        subtitle="Events & Competitions"
        icon={BiCalendar}
      />
      
      {/* Desktop Action Buttons */}
      <Box py={4} display={{ base: "none", md: "block" }}>
        <Container maxW="7xl">
          <Flex justify="flex-end" align="center" w="100%">
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
          </Flex>
        </Container>
      </Box>

      {/* Mobile Header - Mobile Only */}
      {/* Removed - Create Meet button now only appears next to location card */}

      {/* Main Content */}
      <Flex 
        direction="column" 
        align="center" 
        p={0}
        color="gray.100"
      >
        {/* Meets Tabs */}
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
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList 
                display={{ base: "grid", md: "flex" }}
                gridTemplateColumns={{ base: "repeat(4, 1fr)", md: "unset" }}
                gap={{ base: 0, md: "unset" }}
                borderBottom="0px solid"
                borderColor="gray.600"
                borderRadius="lg"
                p={{ base: 2, md: 0 }}
              >
                <Tab 
                  flexDirection={{ base: "column", md: "row" }}
                  alignItems="center"
                  justifyContent="center"
                  py={{ base: 1, md: 0.5 }}
                  px={{ base: 3, md: 6 }}
                  minH={{ base: "28px", md: "24px" }}
                  minW={{ base: "auto", md: "70px" }}
                  flex={{ base: "1", md: "unset" }}
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="medium"
                  borderRadius="30"
                  position="relative"
                  _selected={{
                    bg: "gray.800",
                    color: "white",
                    borderColor: "gray.700"
                  }}
                >
                  <Text textAlign="center" lineHeight="1.2">
                    {filteredMeets.isCurrentMeet ? 'Current' : 'Next'}
                  </Text>
                  <Badge 
                    position={{ base: "absolute", md: "static" }}
                    top={{ base: "-6px", md: "auto" }}
                    right={{ base: "2px", md: "auto" }}
                    ml={{ base: 0, md: 2 }} 
                    mt={{ base: 0, md: 0 }}
                    colorScheme="red" 
                    variant="solid"
                    fontSize="xs"
                    minW="18px"
                    h="18px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={2}
                  >
                    {filteredMeets.nextMeet.length}
                  </Badge>
                </Tab>
                <Tab 
                  flexDirection={{ base: "column", md: "row" }}
                  alignItems="center"
                  justifyContent="center"
                  py={{ base: 1, md: 0.5 }}
                  px={{ base: 3, md: 6 }}
                  minH={{ base: "28px", md: "24px" }}
                  minW={{ base: "auto", md: "70px" }}
                  flex={{ base: "1", md: "unset" }}
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="medium"
                  borderRadius="30"
                  position="relative"
                  _selected={{
                    bg: "gray.800",
                    color: "white",
                    borderColor: "gray.700"
                  }}
                >
                  <Text textAlign="center" lineHeight="1.2">
                    Upcoming
                  </Text>
                  <Badge 
                    position={{ base: "absolute", md: "static" }}
                    top={{ base: "-6px", md: "auto" }}
                    right={{ base: "2px", md: "auto" }}
                    ml={{ base: 0, md: 2 }} 
                    mt={{ base: 0, md: 0 }}
                    colorScheme="red" 
                    variant="solid"
                    fontSize="xs"
                    minW="18px"
                    h="18px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={2}
                  >
                    {filteredMeets.upcoming.length}
                  </Badge>
                </Tab>
                <Tab 
                  flexDirection={{ base: "column", md: "row" }}
                  alignItems="center"
                  justifyContent="center"
                  py={{ base: 1, md: 0.5 }}
                  px={{ base: 3, md: 6 }}
                  minH={{ base: "28px", md: "24px" }}
                  minW={{ base: "auto", md: "70px" }}
                  flex={{ base: "1", md: "unset" }}
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="medium"
                  borderRadius="30"
                  position="relative"
                  _selected={{
                    bg: "gray.800",
                    color: "white",
                    borderColor: "gray.700"
                  }}
                >
                  <Text textAlign="center" lineHeight="1.2">
                    Past
                  </Text>
                  <Badge 
                    position={{ base: "absolute", md: "static" }}
                    top={{ base: "-6px", md: "auto" }}
                    right={{ base: "2px", md: "auto" }}
                    ml={{ base: 0, md: 2 }} 
                    mt={{ base: 0, md: 0 }}
                    colorScheme="red" 
                    variant="solid"
                    fontSize="xs"
                    minW="18px"
                    h="18px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={2}
                  >
                    {filteredMeets.past.length}
                  </Badge>
                </Tab>
                <Tab 
                  flexDirection={{ base: "column", md: "row" }}
                  alignItems="center"
                  justifyContent="center"
                  py={{ base: 1, md: 0.5 }}
                  px={{ base: 3, md: 6 }}
                  minH={{ base: "28px", md: "24px" }}
                  minW={{ base: "auto", md: "70px" }}
                  flex={{ base: "1", md: "unset" }}
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="medium"
                  borderRadius="30"
                  position="relative"
                  _selected={{
                    bg: "gray.800",
                    color: "white",
                    borderColor: "gray.700"
                  }}
                >
                  <Text textAlign="center" lineHeight="1.2">
                    All
                  </Text>
                  <Badge 
                    position={{ base: "absolute", md: "static" }}
                    top={{ base: "-6px", md: "auto" }}
                    right={{ base: "2px", md: "auto" }}
                    ml={{ base: 0, md: 2 }} 
                    mt={{ base: 0, md: 0 }}
                    colorScheme="red" 
                    variant="solid"
                    fontSize="xs"
                    minW="18px"
                    h="18px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    zIndex={2}
                  >
                    {filteredMeets.all.length}
                  </Badge>
                </Tab>
              </TabList>

              {/* Location Display - Shows on all tabs */}
              <Box 
                bg="gray.800" 
                borderLeft="4px solid" 
                borderColor="green.400" 
                p={3} 
                mb={4}
                mt={4}
                borderRadius="md"
                cursor="pointer"
                onClick={onLocationSetupOpen}
                _hover={{ bg: "gray.700" }}
              >
                <HStack spacing={2} justify="space-between">
                  <HStack spacing={2}>
                    <Tooltip label="Set your location for travel times" placement="top">
                      <Box>
                        <Icon as={FaMapMarkerAlt} color="green.400" size="sm" />
                      </Box>
                    </Tooltip>
                    <CurrentLocationDisplay />
                  </HStack>
                  
                  {/* Mobile Create Meet Button - Only on mobile */}
                  <Box display={{ base: "block", md: "none" }}>
                    <Button 
                      size="sm"
                      leftIcon={<FaPlus />} 
                      colorScheme="blue" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onFormOpen();
                      }}
                    >
                      Create Meet
                    </Button>
                  </Box>
                </HStack>
              </Box>

              <TabPanels>
                {/* Next/Current Meet Tab */}
                <TabPanel px={0}>
                  {renderMeets(filteredMeets.nextMeet, true)}
                </TabPanel>

                {/* Upcoming Meets Tab */}
                <TabPanel px={0}>
                  {renderMeets(filteredMeets.upcoming, true)}
                </TabPanel>

                {/* Past Meets Tab */}
                <TabPanel px={0}>
                  {renderMeets(filteredMeets.past, true)}
                </TabPanel>

                {/* All Meets Tab */}
                <TabPanel px={0}>
                  {renderMeets(filteredMeets.all, false)}
                </TabPanel>
              </TabPanels>
            </Tabs>
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

      {/* Edit Event Modal */}
      <EventCreationModal
        isOpen={isEditEventModalOpen}
        onClose={() => {
          setIsEditEventModalOpen(false);
          setEditingEvent(null);
          setEditingMeet(null);
        }}
        meet={editingMeet}
        editEvent={editingEvent}
        isEditMode={true}
        onEventCreated={() => {
          fetchMeets();
        }}
      />

      {/* Coach Event Bulk Creator */}
      <CoachEventBulkCreator
        isOpen={isBulkCreatorOpen}
        onClose={onBulkCreatorClose}
        meet={currentMeet}
        onEventsCreated={handleBulkEventsCreated}
      />

      {/* Coach Athlete Event Manager */}
      <CoachAthleteEventManager
        isOpen={isAthleteManagerOpen}
        onClose={onAthleteManagerClose}
        meet={currentMeet}
        onRefresh={fetchMeets}
      />
    </Box>
  );
}; 