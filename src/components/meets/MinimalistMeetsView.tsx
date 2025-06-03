/**
 * Minimalistic Track Meets View - Clean interface matching the wireframe design
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Flex,
  Tooltip,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Divider,
  Tag,
  TagLabel,
  Link,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useToast
} from '@chakra-ui/react';
import { 
  FaCar, 
  FaPlane, 
  FaEdit, 
  FaTrash, 
  FaCog,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaRunning,
  FaStickyNote,
  FaUserFriends
} from 'react-icons/fa';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { TravelTimeDisplay } from '../TravelTimeDisplay';
import type { TrackMeet } from '../../types/meetTypes';

// Enhanced interfaces for the minimalist view
interface EnhancedTrackMeet extends TrackMeet {
  event_count: number;
  assigned_athletes: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
}

interface MinimalistMeetsViewProps {
  onEditMeet?: (meet: TrackMeet) => void;
  onDeleteMeet?: (meet: TrackMeet) => void;
  onManageEvents?: (meet: TrackMeet) => void;
}

// Filter types
type FilterType = 'all' | 'planned' | 'outdoor' | 'multi-day';

export const MinimalistMeetsView: React.FC<MinimalistMeetsViewProps> = ({
  onEditMeet,
  onDeleteMeet,
  onManageEvents
}) => {
  const { user } = useAuth();
  const toast = useToast();
  
  // State
  const [meets, setMeets] = useState<EnhancedTrackMeet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [selectedMeet, setSelectedMeet] = useState<EnhancedTrackMeet | null>(null);
  
  // Modal states
  const { isOpen: isNotesOpen, onOpen: onNotesOpen, onClose: onNotesClose } = useDisclosure();
  
  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.400');
  const tooltipColor = useColorModeValue('yellow.500', 'yellow.300');

  // Fetch meets data
  const fetchMeets = async () => {
    try {
      setLoading(true);
      
      // First, fetch all meets for this coach
      const { data: meetsData, error } = await supabase
        .from('track_meets')
        .select('*')
        .eq('coach_id', user?.id)
        .order('meet_date', { ascending: true });
        
      if (error) throw error;
      
      // Process each meet to get additional data
      const processedMeets: EnhancedTrackMeet[] = await Promise.all(
        (meetsData || []).map(async (meet) => {
          // Get event count for this meet
          const { count: eventCount } = await supabase
            .from('meet_events')
            .select('*', { count: 'exact', head: true })
            .eq('meet_id', meet.id);
          
          // Get assigned athletes for this meet
          const { data: athleteAssignments } = await supabase
            .from('athlete_meet_events')
            .select(`
              athlete_id,
              athletes!inner(
                id,
                profiles!inner(first_name, last_name)
              )
            `)
            .in('meet_event_id', (
              await supabase
                .from('meet_events')
                .select('id')
                .eq('meet_id', meet.id)
            ).data?.map(event => event.id) || []);
          
          // Extract unique athletes
          const uniqueAthletes = new Map();
          athleteAssignments?.forEach((assignment: any) => {
            const athlete = assignment.athletes;
            if (athlete && athlete.profiles) {
              uniqueAthletes.set(athlete.id, {
                id: athlete.id,
                first_name: athlete.profiles.first_name || '',
                last_name: athlete.profiles.last_name || ''
              });
            }
          });
          
          return {
            ...meet,
            event_count: eventCount || 0,
            assigned_athletes: Array.from(uniqueAthletes.values())
          };
        })
      );
      
      setMeets(processedMeets);
    } catch (error) {
      console.error('Error fetching meets:', error);
      toast({
        title: 'Error loading meets',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMeets();
    }
  }, [user]);

  // Filter meets based on selected filter
  const filteredMeets = meets.filter(meet => {
    switch (selectedFilter) {
      case 'planned':
        return meet.status === 'Planned' || !meet.status;
      case 'outdoor':
        return meet.venue_type === 'Outdoor';
      case 'multi-day':
        return meet.end_date && meet.end_date !== meet.meet_date;
      default:
        return true;
    }
  });

  // Helper functions
  const formatDateRange = (startDate: string, endDate?: string) => {
    const start = parseISO(startDate);
    if (endDate && endDate !== startDate) {
      const end = parseISO(endDate);
      return `${format(start, 'MMM d, yyyy')} → ${format(end, 'MMM d, yyyy')}`;
    }
    return format(start, 'MMM d, yyyy');
  };

  const generateMapsLink = (meet: EnhancedTrackMeet) => {
    const parts = [meet.venue_name, meet.city, meet.state].filter(Boolean);
    const query = parts.join(', ');
    return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
  };

  const handleSettingsClick = (meet: EnhancedTrackMeet) => {
    setSelectedMeet(meet);
  };

  const handleNotesClick = (meet: EnhancedTrackMeet) => {
    setSelectedMeet(meet);
    onNotesOpen();
  };

  if (loading) {
    return (
      <Box minH="400px" display="flex" alignItems="center" justifyContent="center">
        <Text color={subtextColor}>Loading meets...</Text>
      </Box>
    );
  }

  if (meets.length === 0) {
    return (
      <Box minH="400px" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text color={subtextColor} fontSize="lg">No meets found</Text>
          <Text color={subtextColor} fontSize="sm">Create your first meet to get started.</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      {/* Filter Tabs */}
      <HStack spacing={2} mb={8}>
        {[
          { key: 'all', label: 'ALL' },
          { key: 'planned', label: 'PLANNED' },
          { key: 'outdoor', label: 'OUTDOOR' },
          { key: 'multi-day', label: 'Multi-day event' }
        ].map(filter => (
          <Button
            key={filter.key}
            variant={selectedFilter === filter.key ? 'solid' : 'ghost'}
            colorScheme={selectedFilter === filter.key ? 'blue' : 'gray'}
            size="sm"
            borderRadius="full"
            px={6}
            onClick={() => setSelectedFilter(filter.key as FilterType)}
            fontWeight="medium"
            textTransform={filter.key === 'multi-day' ? 'none' : 'uppercase'}
            fontSize="xs"
            letterSpacing={filter.key === 'multi-day' ? 'normal' : '0.5px'}
          >
            {filter.label}
          </Button>
        ))}
      </HStack>

      {/* Main Content */}
      <Flex gap={8} direction={{ base: 'column', lg: 'row' }}>
        {/* Left Section - Meet Details */}
        <Box flex="2" maxW={{ lg: '60%' }}>
          {filteredMeets.map((meet) => (
            <Box
              key={meet.id}
              bg={cardBg}
              borderRadius="2xl"
              p={8}
              border="1px solid"
              borderColor={borderColor}
              mb={6}
              position="relative"
              _hover={{ shadow: 'md' }}
              transition="all 0.2s"
            >
              {/* Meet Title */}
              <Text fontSize="2xl" fontWeight="bold" color={textColor} mb={4}>
                {meet.name}
              </Text>

              {/* Date and Location */}
              <VStack align="start" spacing={3} mb={6}>
                <HStack spacing={3}>
                  <Box w="2" h="2" bg="blue.500" borderRadius="full" />
                  <Text fontSize="lg" color={textColor}>
                    {formatDateRange(meet.meet_date, meet.end_date)}
                  </Text>
                </HStack>
                
                <HStack spacing={3}>
                  <FaMapMarkerAlt color={useColorModeValue('#4A5568', '#A0AEC0')} />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="md" color={textColor}>
                      {meet.venue_name || 'Venue TBD'}
                    </Text>
                    <HStack spacing={2}>
                      <Text fontSize="sm" color={subtextColor}>
                        {[meet.city, meet.state].filter(Boolean).join(', ')}
                      </Text>
                      <Link
                        href={generateMapsLink(meet)}
                        isExternal
                        color="blue.500"
                        fontSize="xs"
                        _hover={{ color: 'blue.600' }}
                      >
                        <FaExternalLinkAlt />
                      </Link>
                    </HStack>
                  </VStack>
                </HStack>
              </VStack>

              {/* Travel Times */}
              <HStack spacing={8} mb={6}>
                <TravelTimeDisplay
                  city={meet.city}
                  state={meet.state}
                  venueName={meet.venue_name}
                  size="md"
                />
              </HStack>

              {/* Registration Link */}
              {meet.join_link && (
                <HStack spacing={3} mb={4}>
                  <Box w="2" h="2" bg="green.500" borderRadius="full" />
                  <Link
                    href={meet.join_link}
                    isExternal
                    color="blue.500"
                    fontSize="md"
                    fontWeight="medium"
                    _hover={{ color: 'blue.600' }}
                  >
                    Registration
                    <Box as="span" ml={2}>
                      <FaExternalLinkAlt size="12px" />
                    </Box>
                  </Link>
                </HStack>
              )}

              {/* Settings Button */}
              <Tooltip label="Manage events" placement="top">
                <Box position="absolute" top={4} right={4}>
                  <Button
                    variant="solid"
                    colorScheme="gray"
                    size="sm"
                    borderRadius="full"
                    px={4}
                    onClick={() => onManageEvents?.(meet)}
                  >
                    Manage events
                  </Button>
                </Box>
              </Tooltip>
            </Box>
          ))}
        </Box>

        {/* Right Section - Info Panel */}
        <Box flex="1" minW="300px">
          {filteredMeets.length > 0 && (
            <VStack spacing={6} align="stretch">
              {/* Settings Popup */}
              <Box
                bg={cardBg}
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor={borderColor}
              >
                <HStack justify="space-between" mb={3}>
                  <Text fontSize="sm" fontWeight="medium" color={textColor}>
                    Quick Actions
                  </Text>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FaCog />}
                      variant="ghost"
                      size="sm"
                      borderRadius="full"
                    />
                    <MenuList>
                      <MenuItem icon={<FaUserFriends />}>
                        Manage Athletes
                      </MenuItem>
                      <MenuItem icon={<FaEdit />}>
                        Edit Meet
                      </MenuItem>
                      <MenuItem icon={<FaTrash />} color="red.500">
                        Delete Meet
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
                <HStack spacing={2}>
                  <IconButton
                    icon={<FaUserFriends />}
                    aria-label="Manage athletes"
                    size="sm"
                    variant="outline"
                    borderRadius="full"
                  />
                  <IconButton
                    icon={<FaRunning />}
                    aria-label="Manage events"
                    size="sm"
                    variant="outline"
                    borderRadius="full"
                  />
                  <IconButton
                    icon={<FaEdit />}
                    aria-label="Edit meet"
                    size="sm"
                    variant="outline"
                    borderRadius="full"
                  />
                  <IconButton
                    icon={<FaTrash />}
                    aria-label="Delete meet"
                    size="sm"
                    variant="outline"
                    borderRadius="full"
                    colorScheme="red"
                  />
                </HStack>
              </Box>

              {/* AAU Notice */}
              <Box
                bg="orange.50"
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor="orange.200"
              >
                <Text fontSize="sm" color="orange.800" fontWeight="medium">
                  Need to join AAU
                </Text>
              </Box>

              {/* Notes Section */}
              <Box
                bg={cardBg}
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor={borderColor}
              >
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <FaStickyNote color={useColorModeValue('#4A5568', '#A0AEC0')} />
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      Notes
                    </Text>
                  </HStack>
                </HStack>
                <Text fontSize="xs" color={subtextColor}>
                  Click to add notes for this meet...
                </Text>
              </Box>

              {/* Events and Athletes */}
              <Box
                bg={cardBg}
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor={borderColor}
              >
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <FaRunning color={useColorModeValue('#4A5568', '#A0AEC0')} />
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        Events
                      </Text>
                    </HStack>
                    <Badge colorScheme="blue" variant="subtle" borderRadius="full">
                      {filteredMeets[0]?.event_count || 0}
                    </Badge>
                  </HStack>
                  
                  <Divider />
                  
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <FaUserFriends color={useColorModeValue('#4A5568', '#A0AEC0')} />
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        Athletes
                      </Text>
                    </HStack>
                    <Badge colorScheme="green" variant="subtle" borderRadius="full">
                      {filteredMeets[0]?.assigned_athletes?.length || 0}
                    </Badge>
                  </HStack>
                  
                  {/* Athletes List */}
                  {filteredMeets[0]?.assigned_athletes?.length > 0 && (
                    <VStack align="start" spacing={1} pl={6}>
                      {filteredMeets[0].assigned_athletes.slice(0, 5).map((athlete) => (
                        <Text key={athlete.id} fontSize="xs" color={subtextColor}>
                          {athlete.first_name} {athlete.last_name}
                        </Text>
                      ))}
                      {filteredMeets[0].assigned_athletes.length > 5 && (
                        <Text fontSize="xs" color={subtextColor} fontStyle="italic">
                          +{filteredMeets[0].assigned_athletes.length - 5} more
                        </Text>
                      )}
                    </VStack>
                  )}
                </VStack>
              </Box>
            </VStack>
          )}
        </Box>
      </Flex>

      {/* Notes Modal */}
      <Modal isOpen={isNotesOpen} onClose={onNotesClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold">
                Notes for {selectedMeet?.name}
              </Text>
              <Text fontSize="sm" color={subtextColor}>
                Add notes and reminders for this meet...
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 