/**
 * Shopify-style athlete assignment drawer for coaches
 * Allows assigning multiple athletes to events with tag-style selection
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Checkbox,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Box,
  FormControl,
  FormLabel,
  Select,
  Badge,
  Avatar,
  useToast,
  SimpleGrid
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { MeetEvent } from '../../types/meetTypes';

interface CoachAthleteAssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: MeetEvent | null;
  onAssignmentsUpdated?: () => void;
}

interface Athlete {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  specialties?: string[];
}

interface AthleteWithAssignment extends Athlete {
  isAssigned: boolean;
}

export const CoachAthleteAssignmentDrawer: React.FC<CoachAthleteAssignmentDrawerProps> = ({
  isOpen,
  onClose,
  event,
  onAssignmentsUpdated
}) => {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<AthleteWithAssignment[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteWithAssignment[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Event details for editing
  const [eventDate, setEventDate] = useState('');
  const [eventDay, setEventDay] = useState(1);
  const [startTime, setStartTime] = useState('');
  const [heatNumber, setHeatNumber] = useState('');
  const [eventType, setEventType] = useState('');

  // Load athletes and current assignments
  useEffect(() => {
    if (isOpen && event) {
      loadAthletesAndAssignments();
      loadEventDetails();
    }
  }, [isOpen, event]);

  // Filter athletes based on search and category
  useEffect(() => {
    let filtered = athletes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(athlete =>
        athlete.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter (placeholder for when we have specialty data)
    if (filterCategory !== 'all') {
      // This would filter by athlete specialties when available
      // filtered = filtered.filter(athlete => athlete.specialties?.includes(filterCategory));
    }

    setFilteredAthletes(filtered);
  }, [athletes, searchTerm, filterCategory]);

  const loadAthletesAndAssignments = async () => {
    if (!event) return;
    
    setIsLoading(true);
    try {
      // Get all athletes from the team
      const { data: athletesData, error: athletesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('role', 'athlete');

      if (athletesError) throw athletesError;

      // Get current assignments for this event
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('athlete_meet_events')
        .select('athlete_id')
        .eq('meet_event_id', event.id);

      if (assignmentsError) throw assignmentsError;

      const assignedAthleteIds = assignmentsData?.map(a => a.athlete_id) || [];

      // Combine data
      const athletesWithAssignments: AthleteWithAssignment[] = (athletesData || []).map(athlete => ({
        ...athlete,
        isAssigned: assignedAthleteIds.includes(athlete.id)
      }));

      setAthletes(athletesWithAssignments);
      setSelectedAthletes(assignedAthleteIds);

    } catch (error) {
      console.error('Error loading athletes:', error);
      toast({
        title: "Error loading athletes",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventDetails = () => {
    if (!event) return;
    
    // Note: event_date is not stored in MeetEvent, it would come from the meet
    setEventDate(''); // Will need to be set from parent meet data
    setEventDay(event.event_day || 1);
    setStartTime(event.start_time || '');
    setHeatNumber(event.heat?.toString() || '');
    setEventType(event.event_type || '');
  };

  const handleAthleteToggle = (athleteId: string) => {
    setSelectedAthletes(prev => 
      prev.includes(athleteId) 
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  const handleRemoveAthlete = (athleteId: string) => {
    setSelectedAthletes(prev => prev.filter(id => id !== athleteId));
  };

  const handleSaveAssignments = async () => {
    if (!event) return;

    setIsSaving(true);
    try {
      // First, remove all existing assignments for this event
      const { error: deleteError } = await supabase
        .from('athlete_meet_events')
        .delete()
        .eq('meet_event_id', event.id);

      if (deleteError) throw deleteError;

      // Then add new assignments
      if (selectedAthletes.length > 0) {
        const assignments = selectedAthletes.map(athleteId => ({
          athlete_id: athleteId,
          meet_event_id: event.id,
          assigned_by: user?.id
        }));

        const { error: insertError } = await supabase
          .from('athlete_meet_events')
          .insert(assignments);

        if (insertError) throw insertError;
        
        // Create notifications for the newly assigned athletes
        try {
          // Import notification service dynamically to avoid circular imports
          const { createBulkMeetAssignmentNotifications, getMeetEventDetails, getCoachName } = await import('../../services/notificationService');
          
          // Get event and meet details
          const { eventName, meetName } = await getMeetEventDetails(event.id);
          const coachName = user?.id ? await getCoachName(user.id) : 'Your Coach';
          
          // Create notifications for all newly assigned athletes
          await createBulkMeetAssignmentNotifications(
            selectedAthletes,
            event.id,
            eventName,
            meetName,
            user?.id || '',
            coachName
          );
          
          console.log(`Created meet assignment notifications for ${selectedAthletes.length} athletes`);
        } catch (notifError) {
          console.error('Error creating meet assignment notifications:', notifError);
          // Don't throw here - assignment should succeed even if notifications fail
        }
      }

      // Update event details if changed
      const eventUpdates = {
        event_date: eventDate || null,
        event_day: eventDay,
        start_time: startTime || null,
        heat: heatNumber ? parseInt(heatNumber) : null,
        event_type: eventType || null
      };

      const { error: updateError } = await supabase
        .from('meet_events')
        .update(eventUpdates)
        .eq('id', event.id);

      if (updateError) throw updateError;

      toast({
        title: "Assignments saved successfully",
        description: `${selectedAthletes.length} athletes assigned to ${event.event_name}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      if (onAssignmentsUpdated) {
        onAssignmentsUpdated();
      }

      onClose();

    } catch (error) {
      console.error('Error saving assignments:', error);
      toast({
        title: "Error saving assignments",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedAthletes = () => {
    return athletes.filter(athlete => selectedAthletes.includes(athlete.id));
  };

  const handleClose = () => {
    setSearchTerm('');
    setFilterCategory('all');
    setSelectedAthletes([]);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={handleClose} size="lg">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          Assign Athletes to {event?.event_name}
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={6} align="stretch">
            {/* Event Details Section */}
            <Box bg="gray.50" p={4} borderRadius="md">
              <Text fontWeight="semibold" mb={3}>Event Details</Text>
              <SimpleGrid columns={2} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Event Date</FormLabel>
                  <Input 
                    type="date"
                    size="sm"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Day Number</FormLabel>
                  <Input 
                    type="number"
                    size="sm"
                    min="1"
                    value={eventDay}
                    onChange={(e) => setEventDay(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Start Time</FormLabel>
                  <Input 
                    type="time"
                    size="sm"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Heat Number</FormLabel>
                  <Input 
                    type="number"
                    size="sm"
                    min="1"
                    value={heatNumber}
                    onChange={(e) => setHeatNumber(e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl mt={3}>
                <FormLabel fontSize="sm">Event Type</FormLabel>
                <Select 
                  size="sm"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="Select event type"
                >
                  <option value="Preliminary">Preliminary</option>
                  <option value="Qualifier">Qualifier</option>
                  <option value="Semifinal">Semifinal</option>
                  <option value="Finals">Finals</option>
                </Select>
              </FormControl>
            </Box>

            {/* Selected Athletes Tags */}
            {selectedAthletes.length > 0 && (
              <Box>
                <HStack justify="space-between" mb={3}>
                  <Text fontWeight="semibold">Selected Athletes</Text>
                  <Badge colorScheme="blue">{selectedAthletes.length}</Badge>
                </HStack>
                <Wrap>
                  {getSelectedAthletes().map((athlete) => (
                    <WrapItem key={athlete.id}>
                      <Tag size="md" colorScheme="blue" borderRadius="full">
                        <Avatar size="xs" name={athlete.full_name} src={athlete.avatar_url} mr={2} />
                        <TagLabel>{athlete.full_name}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveAthlete(athlete.id)} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            {/* Search and Filter */}
            <VStack spacing={3} align="stretch">
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search athletes by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <HStack>
                <Text fontSize="sm" color="gray.600">Filter:</Text>
                <Select 
                  size="sm" 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  maxW="200px"
                >
                  <option value="all">All Athletes</option>
                  <option value="sprints">Sprinters</option>
                  <option value="distance">Distance</option>
                  <option value="field">Field Events</option>
                  <option value="relays">Relay Specialists</option>
                </Select>
              </HStack>
            </VStack>

            {/* Athletes List */}
            <Box>
              <Text fontWeight="semibold" mb={3}>
                Available Athletes ({filteredAthletes.length})
              </Text>
              
              {isLoading ? (
                <Text color="gray.500">Loading athletes...</Text>
              ) : (
                <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
                  {filteredAthletes.map((athlete) => (
                    <Box 
                      key={athlete.id}
                      p={3} 
                      borderRadius="md" 
                      border="1px solid"
                      borderColor="gray.200"
                      bg={selectedAthletes.includes(athlete.id) ? "blue.50" : "white"}
                      _hover={{ bg: "gray.50" }}
                      cursor="pointer"
                      onClick={() => handleAthleteToggle(athlete.id)}
                    >
                      <HStack>
                        <Checkbox 
                          isChecked={selectedAthletes.includes(athlete.id)}
                          onChange={() => handleAthleteToggle(athlete.id)}
                        />
                        <Avatar size="sm" name={athlete.full_name} src={athlete.avatar_url} />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="medium" fontSize="sm">{athlete.full_name}</Text>
                          <Text fontSize="xs" color="gray.600">{athlete.email}</Text>
                        </VStack>
                        {athlete.isAssigned && (
                          <Badge colorScheme="green" size="sm">Currently Assigned</Badge>
                        )}
                      </HStack>
                    </Box>
                  ))}
                  
                  {filteredAthletes.length === 0 && (
                    <Text color="gray.500" textAlign="center" py={4}>
                      No athletes found matching your search.
                    </Text>
                  )}
                </VStack>
              )}
            </Box>
          </VStack>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSaveAssignments}
            isLoading={isSaving}
            loadingText="Saving..."
          >
            Save Assignments ({selectedAthletes.length})
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}; 