/**
 * Meets page with minimalist wireframe design
 * Supports both coach and athlete views with real data
 */

import React, { useState, useEffect } from 'react';
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
  SimpleGrid
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
  FaPlus
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { MeetFormDrawer, type TrackMeetFormData, type TrackMeetData } from '../components/meets/MeetFormDrawer';
import type { TrackMeet } from '../types/trackMeets';

// Filter Tag Component
const FilterTag: React.FC<{ children: React.ReactNode; isActive?: boolean; onClick?: () => void }> = ({ 
  children, 
  isActive = false,
  onClick
}) => (
  <Text
    fontSize="xs"
    fontWeight="medium"
    color="white"
    bg={isActive ? "#1A202C" : "gray.600"}
    px={3}
    py={2}
    borderRadius="md"
    cursor="pointer"
    onClick={onClick}
    _hover={{ bg: "#1A202C" }}
  >
    {children}
  </Text>
);

// Individual Meet Card Component
const MeetCard: React.FC<{ 
  meet: TrackMeet; 
  isCoach: boolean;
  onEdit?: (meet: TrackMeet) => void;
  onDelete?: (meet: TrackMeet) => void;
  onAssignAthletes?: (meet: TrackMeet) => void;
  onManageEvents?: (meet: TrackMeet) => void;
}> = ({ meet, isCoach, onEdit, onDelete, onAssignAthletes, onManageEvents }) => {
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
            icon={<FaEllipsisV size={18} color="white" />}
            variant="ghost"
            size="sm"
            color="gray.300"
            _hover={{ color: "white", bg: "gray.700" }}
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
          <HStack spacing={2} color="white">
            <FaCar size={20} color="currentColor" />
            <Text fontSize="md" color="white">Travel TBD</Text>
          </HStack>
          
          <HStack spacing={2} color="white">
            <FaPlane size={20} color="currentColor" />
            <Text fontSize="md" color="white">Flight TBD</Text>
          </HStack>

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
              <Text fontSize="md" color="gray.400">No Link Provided</Text>
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

          {/* Events */}
          <HStack spacing={2} color="white">
            <FaRunning size={20} color="currentColor" />
            <Text fontSize="md" fontWeight="medium" color="white">Events</Text>
            <Text fontSize="md" color="white">(0)</Text>
          </HStack>

          {/* Athletes */}
          <HStack spacing={2} color="white">
            <FaUsers size={20} color="currentColor" />
            <Text fontSize="md" fontWeight="medium" color="white">Athletes</Text>
            <Text fontSize="md" color="white">(0)</Text>
          </HStack>
        </VStack>
      </Grid>
    </Box>
  );
};

export const Meets: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // State
  const [meets, setMeets] = useState<TrackMeet[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMeet, setCurrentMeet] = useState<TrackMeet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'planned' | 'completed'>('all');
  const cancelRef = React.useRef(null);

  // Check if user is coach
  const isCoach = user?.user_metadata?.user_type === 'coach';

  // Fetch meets
  useEffect(() => {
    const fetchMeets = async () => {
      if (!user) return;
      
      try {
        let query = supabase.from('track_meets').select('*');
        
        if (isCoach) {
          query = query.eq('coach_id', user.id);
        } else {
          // For athletes, get meets they're assigned to
          // This would need additional logic based on your athlete-meet relationships
          query = query.eq('coach_id', user.id); // Placeholder
        }
        
        const { data, error } = await query.order('meet_date', { ascending: true });
          
        if (error) throw error;
        setMeets(data || []);
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
    };

    fetchMeets();
  }, [user, isCoach, toast]);

  // Handlers
  const handleCreateMeet = () => {
    setCurrentMeet(null);
    setIsEditing(false);
    onFormOpen();
  };

  const handleEditMeet = (meet: TrackMeet) => {
    setCurrentMeet(meet);
    setIsEditing(true);
    onFormOpen();
  };

  const handleDeleteMeet = (meet: TrackMeet) => {
    setCurrentMeet(meet);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
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
  };

  const handleAssignAthletes = (meet: TrackMeet) => {
    // Navigate to athlete assignment page
    navigate(`/coach/meets/${meet.id}/athletes`);
  };

  const handleManageEvents = (meet: TrackMeet) => {
    // Navigate to events management page
    navigate(`/coach/meets/${meet.id}/events`);
  };

  const handleFormSuccess = () => {
    // Refresh meets list
    window.location.reload();
  };

  const handleFormSubmit = async (data: TrackMeetFormData) => {
    if (!user) return;

    try {
      if (isEditing && currentMeet) {
        // Update existing meet
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
        // Create new meet
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
      
      // Refresh meets and close form
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
  };

  // Filter meets
  const filteredMeets = meets.filter(meet => {
    if (activeFilter === 'all') return true;
    // Add filtering logic based on meet status
    return true; // Placeholder
  });

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
      <Box bg="gray.800" borderBottom="1px solid" borderColor="gray.700" py={4}>
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
            
            {isCoach && (
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

      {/* Main Content */}
      <Flex 
        direction="column" 
        align="center" 
        p={6}
        color="gray.100"
      >
        {/* Filter Tags */}
        <Box w="full" maxW="4xl" mb={2.5}>
          <HStack spacing={3}>
            <FilterTag isActive={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
              ALL
            </FilterTag>
            <FilterTag isActive={activeFilter === 'planned'} onClick={() => setActiveFilter('planned')}>
              PLANNED
            </FilterTag>
            <FilterTag isActive={activeFilter === 'completed'} onClick={() => setActiveFilter('completed')}>
              COMPLETED
            </FilterTag>
          </HStack>
        </Box>

        {/* Meets List */}
        <Box w="full" maxW="4xl">
          {filteredMeets.length === 0 ? (
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
                {isCoach 
                  ? (meets.length === 0 ? "Create your first track meet to get started." : "No meets found in this category.")
                  : "No meets have been assigned to you yet."
                }
              </Text>
              {isCoach && (
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  onClick={handleCreateMeet}
                >
                  {meets.length === 0 ? "Create First Meet" : "Create Meet"}
                </Button>
              )}
            </Box>
          ) : (
            filteredMeets.map((meet) => (
              <MeetCard
                key={meet.id}
                meet={meet}
                isCoach={isCoach}
                onEdit={handleEditMeet}
                onDelete={handleDeleteMeet}
                onAssignAthletes={handleAssignAthletes}
                onManageEvents={handleManageEvents}
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
    </Box>
  );
}; 