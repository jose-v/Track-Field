/**
 * Streamlined bulk event creator for coaches
 * Right-to-left drawer with categorized event checkboxes
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
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Badge,
  Box,
  useToast,
  Divider,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Flex
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useMeetEvents } from '../../hooks/meets';
import type { TrackMeet } from '../../types/meetTypes';
import trackEventsData from '../../data/trackEvents.json';
import { supabase } from '../../lib/supabase';

interface CoachEventBulkCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  meet: TrackMeet | null;
  onEventsCreated?: () => void;
}

interface TrackEvent {
  id: string;
  name: string;
  category: string;
}

interface EventWithDetails extends TrackEvent {
  event_date: string;
  event_day: number;
}

interface DateTab {
  id: string;
  date: string;
  dayNumber: number;
  selectedEvents: string[]; // Events to be added
  existingEvents: ExistingEvent[]; // Events already in database
}

interface ExistingEvent {
  id: string;
  event_name: string;
  event_date: string;
  event_day: number;
  start_time?: string;
  heat?: number;
  event_type?: string;
  run_time?: string;
}

export const CoachEventBulkCreator: React.FC<CoachEventBulkCreatorProps> = ({
  isOpen,
  onClose,
  meet,
  onEventsCreated
}) => {
  // Use meet ID as key for persistence
  const [meetDateTabs, setMeetDateTabs] = useState<Record<string, DateTab[]>>({});
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();
  const { handleCreateEventWithData } = useMeetEvents();

  // Get current meet's date tabs
  const dateTabs = meetDateTabs[meet?.id || ''] || [];

  // Color mode values to match MeetFormDrawer
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const modalHeaderBg = useColorModeValue('blue.50', 'blue.900');
  const modalHeaderColor = useColorModeValue('blue.800', 'blue.100');
  const defaultSettingsBg = useColorModeValue('gray.50', 'gray.700');
  const inputBg = useColorModeValue('white', 'gray.600');
  const inputBorderColor = useColorModeValue('gray.300', 'gray.500');
  const inputTextColor = useColorModeValue('gray.900', 'white');
  const labelColor = useColorModeValue('gray.800', 'gray.100');

  // Helper function to update date tabs for current meet
  const setDateTabs = (tabs: DateTab[] | ((prev: DateTab[]) => DateTab[])) => {
    if (!meet?.id) return;
    
    setMeetDateTabs(prev => ({
      ...prev,
      [meet.id]: typeof tabs === 'function' ? tabs(prev[meet.id] || []) : tabs
    }));
  };

  // Load existing events from database and populate tabs
  const loadExistingEvents = async () => {
    if (!meet?.id) return;

    try {
      const { data: existingEvents, error } = await supabase
        .from('meet_events')
        .select('*')
        .eq('meet_id', meet.id)
        .order('event_day', { ascending: true })
        .order('event_date', { ascending: true });

      if (error) throw error;

      if (existingEvents && existingEvents.length > 0) {
        // Group events by day
        const eventsByDay = existingEvents.reduce((acc, event) => {
          const day = event.event_day || 1;
          if (!acc[day]) {
            acc[day] = [];
          }
          acc[day].push(event);
          return acc;
        }, {} as Record<number, ExistingEvent[]>);

        // Create tabs for each day
        const newTabs: DateTab[] = Object.entries(eventsByDay).map(([dayStr, events]) => {
          const dayNumber = parseInt(dayStr);
          const dayEvents = events as ExistingEvent[];
          
          return {
            id: dayNumber.toString(),
            date: dayEvents[0]?.event_date || meet.meet_date,
            dayNumber,
            selectedEvents: [],
            existingEvents: dayEvents
          };
        });

        setDateTabs(newTabs);
      } else {
        // No existing events, create initial tab
        const initialTab: DateTab = {
          id: '1',
          date: meet.meet_date,
          dayNumber: 1,
          selectedEvents: [],
          existingEvents: []
        };
        setDateTabs([initialTab]);
      }
    } catch (error) {
      console.error('Error loading existing events:', error);
      // Fallback to initial tab
      const initialTab: DateTab = {
        id: '1',
        date: meet.meet_date,
        dayNumber: 1,
        selectedEvents: [],
        existingEvents: []
      };
      setDateTabs([initialTab]);
    }
  };

  // Load existing events when drawer opens
  useEffect(() => {
    if (isOpen && meet?.id) {
      loadExistingEvents();
    }
  }, [isOpen, meet?.id]);

  // Get all events flattened from categories
  const getAllEvents = (): TrackEvent[] => {
    const allEvents: TrackEvent[] = [];
    Object.entries(trackEventsData).forEach(([category, events]) => {
      allEvents.push(...events);
    });
    return allEvents;
  };

  // Get events by category for display
  const getEventsByCategory = () => {
    return Object.entries(trackEventsData).map(([categoryKey, events]) => ({
      categoryKey,
      categoryName: categoryKey.replace('_', ' ').toUpperCase(),
      events
    }));
  };

  // Helper functions for date tabs
  const addDateTab = () => {
    // Calculate next date based on the last tab's date
    let nextDate = meet?.meet_date || '';
    if (dateTabs.length > 0) {
      const lastTab = dateTabs[dateTabs.length - 1];
      const lastDate = new Date(lastTab.date);
      const nextDateObj = new Date(lastDate);
      nextDateObj.setDate(lastDate.getDate() + 1);
      nextDate = nextDateObj.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

    const newTab: DateTab = {
      id: Date.now().toString(),
      date: nextDate,
      dayNumber: dateTabs.length + 1,
      selectedEvents: [],
      existingEvents: []
    };
    setDateTabs(prev => [...prev, newTab]);
    setActiveTabIndex(dateTabs.length);
  };

  const removeDateTab = (tabId: string) => {
    if (dateTabs.length <= 1) return; // Keep at least one tab
    const newTabs = dateTabs.filter(tab => tab.id !== tabId);
    setDateTabs(newTabs);
    if (activeTabIndex >= newTabs.length) {
      setActiveTabIndex(newTabs.length - 1);
    }
  };

  const updateDateTab = (tabId: string, updates: Partial<DateTab>) => {
    setDateTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, ...updates } : tab
    ));
  };

  const getCurrentTab = () => dateTabs[activeTabIndex];

  const handleEventToggle = (eventId: string) => {
    const currentTab = getCurrentTab();
    if (!currentTab) return;

    const currentSelectedEvents = currentTab.selectedEvents;
    const newSelectedEvents = currentSelectedEvents.includes(eventId) 
      ? currentSelectedEvents.filter(id => id !== eventId)
      : [...currentSelectedEvents, eventId];

    updateDateTab(currentTab.id, { selectedEvents: newSelectedEvents });
  };

  const handleSelectAll = (categoryEvents: TrackEvent[]) => {
    const currentTab = getCurrentTab();
    if (!currentTab) return;

    const categoryEventIds = categoryEvents.map(e => e.id);
    const currentSelectedEvents = currentTab.selectedEvents;
    const allSelected = categoryEventIds.every(id => currentSelectedEvents.includes(id));
    
    if (allSelected) {
      // Deselect all in this category
      const newSelectedEvents = currentSelectedEvents.filter(id => !categoryEventIds.includes(id));
      updateDateTab(currentTab.id, { selectedEvents: newSelectedEvents });
    } else {
      // Select all in this category
      const newSelectedEvents = [...new Set([...currentSelectedEvents, ...categoryEventIds])];
      updateDateTab(currentTab.id, { selectedEvents: newSelectedEvents });
    }
  };

  const getTotalSelectedEvents = () => {
    return dateTabs.reduce((total, tab) => total + tab.selectedEvents.length, 0);
  };

  const handleCreateEvents = async () => {
    const totalEvents = getTotalSelectedEvents();
    if (!meet?.id || totalEvents === 0) {
      toast({
        title: "No events selected",
        description: "Please select at least one event to add",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsCreating(true);

    try {
      const allEvents = getAllEvents();
      
      // Create events for each date tab
      for (const tab of dateTabs) {
        if (tab.selectedEvents.length === 0) continue;
        
        const eventsToCreate: EventWithDetails[] = tab.selectedEvents.map(eventId => {
          const event = allEvents.find(e => e.id === eventId);
          return {
            ...event!,
            event_date: tab.date,
            event_day: tab.dayNumber
          };
        });

        // Create events one by one (could be optimized with bulk creation later)
        for (const event of eventsToCreate) {
          // Check for duplicates on same day
          const existingEvents = await supabase
            .from('meet_events')
            .select('event_name')
            .eq('meet_id', meet.id)
            .eq('event_date', event.event_date)
            .eq('event_name', event.name);

          if (existingEvents.data && existingEvents.data.length > 0) {
            console.warn(`Event ${event.name} already exists on ${event.event_date}`);
            continue; // Skip duplicate
          }

          // Create the event with data directly
          await handleCreateEventWithData(meet.id, {
            event_name: event.name,
            event_date: event.event_date,
            event_day: event.event_day.toString(),
            start_time: '',
            heat: '',
            event_type: '',
            run_time: ''
          });
        }
      }

      toast({
        title: "Events created successfully",
        description: `Added ${totalEvents} events to ${meet.name}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      if (onEventsCreated) {
        onEventsCreated();
      }

      // Reset selections after successful creation
      setDateTabs(prev => prev.map(tab => ({ ...tab, selectedEvents: [] })));
      onClose();

    } catch (error) {
      console.error('Error creating events:', error);
      toast({
        title: "Error creating events",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteExistingEvent = async (eventId: string, tabId: string) => {
    if (!meet?.id) return;

    try {
      // First, remove all athlete assignments for this event
      const { error: assignmentError } = await supabase
        .from('athlete_meet_events')
        .delete()
        .eq('meet_event_id', eventId);

      if (assignmentError) throw assignmentError;

      // Then delete the event itself
      const { error: eventError } = await supabase
        .from('meet_events')
        .delete()
        .eq('id', eventId)
        .eq('meet_id', meet.id);

      if (eventError) throw eventError;

      toast({
        title: "Event deleted",
        description: "Event and all athlete assignments have been removed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Reload existing events to refresh the UI
      loadExistingEvents();
      onEventsCreated?.(); // Refresh parent component

    } catch (error) {
      console.error('Error deleting existing event:', error);
      toast({
        title: "Error deleting event",
        description: "Please try again",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleClose = () => {
    // Don't reset selections when closing - remember them
    onClose();
  };

  const totalEvents = getTotalSelectedEvents();

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={handleClose} size="lg">
      <DrawerOverlay bg="blackAlpha.600" />
      <DrawerContent bg={bgColor} borderLeft="3px solid" borderColor="blue.500">
        <DrawerHeader 
          borderBottomWidth="2px" 
          borderColor={borderColor}
          bg={modalHeaderBg}
          color={modalHeaderColor}
          fontSize="lg"
          fontWeight="bold"
        >
          Event Manager - {meet?.name}
        </DrawerHeader>
        <DrawerCloseButton 
          color={modalHeaderColor}
          size="lg"
        />

        <DrawerBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Date Tabs */}
            <Box bg={defaultSettingsBg} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
              <HStack justify="space-between" mb={3}>
                <Text fontWeight="semibold" color={labelColor}>Event Days</Text>
                <Button 
                  size="sm" 
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={addDateTab}
                >
                  Add Day
                </Button>
              </HStack>
              
              <Tabs index={activeTabIndex} onChange={setActiveTabIndex}>
                <TabList>
                  {dateTabs.map((tab, index) => (
                    <Tab key={tab.id} fontSize="sm">
                      <HStack spacing={2}>
                        <Text>Day {tab.dayNumber}</Text>
                        {tab.existingEvents.length > 0 && (
                          <Badge colorScheme="green" size="sm">
                            {tab.existingEvents.length}
                          </Badge>
                        )}
                        {tab.selectedEvents.length > 0 && (
                          <Badge colorScheme="blue" size="sm">
                            +{tab.selectedEvents.length}
                          </Badge>
                        )}
                        {dateTabs.length > 1 && (
                          <IconButton
                            size="xs"
                            variant="ghost"
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDateTab(tab.id);
                            }}
                            aria-label="Remove day"
                          />
                        )}
                      </HStack>
                    </Tab>
                  ))}
                </TabList>

                <TabPanels>
                  {dateTabs.map((tab, index) => (
                    <TabPanel key={tab.id} px={0} py={4}>
                      {/* Date Settings */}
                      <HStack spacing={4} mb={4}>
                        <FormControl>
                          <FormLabel fontSize="sm" color={labelColor}>Event Date</FormLabel>
                          <Input 
                            type="date"
                            size="sm"
                            value={tab.date}
                            onChange={(e) => updateDateTab(tab.id, { date: e.target.value })}
                            bg={inputBg}
                            borderColor={inputBorderColor}
                            color={inputTextColor}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel fontSize="sm" color={labelColor}>Day Number</FormLabel>
                          <Input 
                            type="number"
                            size="sm"
                            min="1"
                            value={tab.dayNumber}
                            onChange={(e) => updateDateTab(tab.id, { dayNumber: parseInt(e.target.value) || 1 })}
                            bg={inputBg}
                            borderColor={inputBorderColor}
                            color={inputTextColor}
                          />
                        </FormControl>
                      </HStack>

                      {/* Existing Events */}
                      {tab.existingEvents.length > 0 && (
                        <VStack spacing={3} align="stretch" mb={6}>
                          <HStack justify="space-between">
                            <Text fontWeight="semibold" color={labelColor}>
                              Current Events for Day {tab.dayNumber}
                            </Text>
                            <Badge colorScheme="green" size="sm">
                              {tab.existingEvents.length} event{tab.existingEvents.length !== 1 ? 's' : ''}
                            </Badge>
                          </HStack>
                          
                          <VStack spacing={2} align="stretch">
                            {tab.existingEvents.map((event) => (
                              <Box 
                                key={event.id}
                                p={3}
                                bg={inputBg}
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor="green.500"
                                borderLeftWidth="4px"
                              >
                                <HStack justify="space-between" align="start">
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium" fontSize="sm" color={inputTextColor}>
                                      {event.event_name}
                                    </Text>
                                    <HStack spacing={3} wrap="wrap">
                                      {event.start_time && (
                                        <Text fontSize="xs" color="gray.500">
                                          {event.start_time}
                                        </Text>
                                      )}
                                      {event.event_type && (
                                        <Badge size="sm" colorScheme="blue">
                                          {event.event_type}
                                        </Badge>
                                      )}
                                      {event.heat && (
                                        <Text fontSize="xs" color="gray.500">
                                          Heat {event.heat}
                                        </Text>
                                      )}
                                    </HStack>
                                  </VStack>
                                  <IconButton
                                    size="xs"
                                    variant="ghost"
                                    icon={<DeleteIcon />}
                                    colorScheme="red"
                                    onClick={() => deleteExistingEvent(event.id, tab.id)}
                                    aria-label="Delete existing event"
                                  />
                                </HStack>
                              </Box>
                            ))}
                          </VStack>
                          
                          <Divider borderColor={borderColor} />
                        </VStack>
                      )}

                      {/* Available Events to Add */}
                      <Text fontWeight="semibold" color={labelColor} mb={4}>
                        Add More Events to Day {tab.dayNumber}
                      </Text>
                      
                      <VStack spacing={4} align="stretch">
                        {getEventsByCategory().map(({ categoryKey, categoryName, events }) => {
                          // Filter out events that already exist on this day
                          const availableEvents = events.filter(event => 
                            !tab.existingEvents.some(existing => existing.event_name === event.name)
                          );
                          
                          if (availableEvents.length === 0) return null;
                          
                          return (
                            <Box key={categoryKey}>
                              <HStack justify="space-between" mb={3}>
                                <Text fontWeight="semibold" color={labelColor}>
                                  {categoryName}
                                </Text>
                                <Button 
                                  size="xs" 
                                  variant="outline"
                                  colorScheme="blue"
                                  onClick={() => handleSelectAll(availableEvents)}
                                >
                                  {availableEvents.every(e => tab.selectedEvents.includes(e.id)) ? 'Deselect All' : 'Select All'}
                                </Button>
                              </HStack>
                              
                              <SimpleGrid columns={2} spacing={2}>
                                {availableEvents.map((event) => (
                                  <Checkbox
                                    key={event.id}
                                    isChecked={tab.selectedEvents.includes(event.id)}
                                    onChange={() => handleEventToggle(event.id)}
                                    size="sm"
                                    colorScheme="blue"
                                  >
                                    <Text fontSize="sm" color={inputTextColor}>{event.name}</Text>
                                  </Checkbox>
                                ))}
                              </SimpleGrid>
                              
                              <Divider mt={3} borderColor={borderColor} />
                            </Box>
                          );
                        })}
                      </VStack>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            </Box>

            {/* Custom Event Option */}
            <Box bg={defaultSettingsBg} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Need a custom event? Use the "Add Custom Event" button after creating these events.
              </Text>
            </Box>
          </VStack>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleCreateEvents}
            isLoading={isCreating}
            loadingText="Creating Events..."
            isDisabled={totalEvents === 0}
          >
            {totalEvents > 0 ? `Add ${totalEvents} New Event${totalEvents !== 1 ? 's' : ''}` : 'No New Events to Add'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}; 