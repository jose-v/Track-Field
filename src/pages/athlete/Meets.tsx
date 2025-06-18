import React, { useState } from 'react';
import {
  Box,
  Heading,
  Flex,
  IconButton,
  Button,
  HStack,
  Tooltip,
  useDisclosure,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '@chakra-ui/react';
import { FaPlus, FaSync, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { LocationSetup } from '../../components/LocationSetup';
import { CurrentLocationDisplay } from '../../components/CurrentLocationDisplay';
import { MeetFormDrawer, type TrackMeetFormData, type TrackMeetData } from '../../components/meets/MeetFormDrawer';

// Import our new tab components
import { AssignedMeetsTab, CoachMeetsTab, MyMeetsTab } from '../../components/meets/tabs';

// Import our new modal components
import { EventSelectionModal, EventCreationModal, DeleteConfirmationModal } from '../../components/meets/modals';

// Import our hooks
import { useMyMeets } from '../../hooks/meets';

// Import consolidated types
import type { TrackMeet } from '../../types/meetTypes';

export function AthleteMeets() {
  const { user } = useAuth();
  
  // Modal states
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isEventsOpen, onOpen: onEventsOpen, onClose: onEventsClose } = useDisclosure();
  const { isOpen: isAddEventOpen, onOpen: onAddEventOpen, onClose: onAddEventClose } = useDisclosure();
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  const { isOpen: isLocationSetupOpen, onOpen: onLocationSetupOpen, onClose: onLocationSetupClose } = useDisclosure();
  
  // Form and editing states
  const [currentMeet, setCurrentMeet] = useState<TrackMeet | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get coaches from useMyMeets hook
  const { coaches, fetchTrackMeets } = useMyMeets();

  // Handle creating a new meet
  const handleCreateMeet = () => {
    setIsEditing(false);
    setCurrentMeet(null);
    onFormOpen();
  };

  // Handle editing an existing meet
  const handleEditMeet = (meet: TrackMeet) => {
    setIsEditing(true);
    setCurrentMeet(meet);
    onFormOpen();
  };

  // Handle selecting events for a meet
  const handleSelectEvents = (meet: TrackMeet) => {
    setCurrentMeet(meet);
    onEventsOpen();
  };

  // Handle deleting a meet
  const handleDeleteMeet = (meet: TrackMeet) => {
    setCurrentMeet(meet);
    onDeleteConfirmOpen();
  };

  // Handle event creation callback
  const handleEventCreated = () => {
    // Refresh all meet data to update event counts
    fetchTrackMeets();
  };

  // Handle meet form submission
  const handleMeetSubmit = async (data: TrackMeetFormData) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing && currentMeet) {
        // Update handled by useMyMeets hook
        await fetchTrackMeets(); // Refresh the data
      } else {
        // Create new meet - handled by useMyMeets hook
        await fetchTrackMeets(); // Refresh the data
        
        // After creating, open event selection
        onFormClose();
        // Note: In a real implementation, we'd want to get the new meet ID
        // and open the events modal for that specific meet
      }
      
      if (isEditing) {
        onFormClose();
      }
      
    } catch (error) {
      console.error('Error saving track meet:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box py={8}>
      {/* Header with controls */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Track Meets</Heading>
        
        {/* Action Buttons */}
        <HStack spacing={2}>
          <HStack spacing={2}>
            <Tooltip label="Set your location for travel times">
              <IconButton
                icon={<FaMapMarkerAlt />}
                aria-label="Set location"
                onClick={onLocationSetupOpen}
                variant="ghost"
                colorScheme="green"
                size="md" 
              />
            </Tooltip>
            <CurrentLocationDisplay />
          </HStack>
          <Tooltip label="Refresh meets">
            <IconButton
              icon={<FaSync />}
              aria-label="Refresh meets"
              onClick={fetchTrackMeets}
              variant="ghost"
              colorScheme="blue"
              size="md" 
            />
          </Tooltip>
          <Button 
            variant="solid"
            leftIcon={<FaPlus />} 
            colorScheme="blue" 
            onClick={handleCreateMeet}
          >
            Create New Meet
          </Button>
        </HStack>
      </Flex>
      
      {/* Tabs for different meet types */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Assigned Meets</Tab>
          <Tab>Coach Meets</Tab>
          <Tab>My Meets</Tab>
        </TabList>
        
        <TabPanels>
          {/* Assigned Meets Tab */}
          <TabPanel px={0}>
            <AssignedMeetsTab />
          </TabPanel>
          
          {/* Coach Meets Tab */}
          <TabPanel px={0}>
            <CoachMeetsTab />
          </TabPanel>
          
          {/* My Meets Tab */}
          <TabPanel px={0}>
            <MyMeetsTab
              onEditMeet={handleEditMeet}
              onSelectEvents={handleSelectEvents}
              onDeleteMeet={handleDeleteMeet}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Event Selection Modal */}
      <EventSelectionModal
        isOpen={isEventsOpen}
        onClose={onEventsClose}
        meet={currentMeet}
        onAddNewEvent={onAddEventOpen}
      />
      
      {/* Event Creation Modal */}
      <EventCreationModal
        isOpen={isAddEventOpen}
        onClose={onAddEventClose}
        meet={currentMeet}
        onEventCreated={handleEventCreated}
      />
      
      {/* Create/Edit Track Meet Modal */}
      <MeetFormDrawer
        isOpen={isFormOpen}
        onClose={onFormClose}
        isEditing={isEditing}
        currentMeet={currentMeet as TrackMeetData}
        onSubmit={handleMeetSubmit}
        isSubmitting={isSubmitting}
        showCoachSelection={true}
        coaches={coaches.map(coach => ({ id: coach.id, name: coach.name }))}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={onDeleteConfirmClose}
        meet={currentMeet}
      />
      
      {/* Location Setup Modal */}
      <LocationSetup
        isOpen={isLocationSetupOpen}
        onClose={onLocationSetupClose}
      />
    </Box>
  );
} 