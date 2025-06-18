/**
 * Modal component for creating new events
 */

import React, { useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  VStack,
  HStack
} from '@chakra-ui/react';
import { useMeetEvents } from '../../../hooks/meets';
import type { TrackMeet } from '../../../types/meetTypes';

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  meet: TrackMeet | null;
  onEventCreated?: () => void;
  editEvent?: {
    id: string;
    event_name: string;
    event_date?: string;
    event_day?: number;
    start_time?: string;
    heat?: number;
    event_type?: string;
    run_time?: string;
  } | null;
  isEditMode?: boolean;
}

export const EventCreationModal: React.FC<EventCreationModalProps> = ({
  isOpen,
  onClose,
  meet,
  onEventCreated,
  editEvent = null,
  isEditMode = false
}) => {
  const {
    eventFormData,
    setEventFormData,
    handleCreateEvent,
    handleUpdateEvent,
    resetEventForm,
    loadEventForEdit
  } = useMeetEvents();

  // Load event data when in edit mode
  useEffect(() => {
    if (isEditMode && editEvent) {
      loadEventForEdit(editEvent);
    } else if (!isEditMode) {
      resetEventForm();
    }
  }, [isEditMode, editEvent, loadEventForEdit, resetEventForm]);

  const handleSubmit = async () => {
    if (isEditMode && editEvent) {
      await handleUpdateEvent(editEvent.id);
    } else {
      if (!meet?.id) return;
      await handleCreateEvent(meet.id);
    }
    
    if (onEventCreated) {
      onEventCreated();
    }
    
    onClose();
  };

  const handleClose = () => {
    resetEventForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isEditMode ? `Edit Event: ${editEvent?.event_name}` : `Add New Event to ${meet?.name}`}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel htmlFor="event_name">Event Name</FormLabel>
              <Input 
                id="event_name" 
                value={eventFormData.event_name}
                onChange={(e) => setEventFormData({
                  ...eventFormData, 
                  event_name: e.target.value
                })}
                placeholder="e.g., 100m Sprint, Long Jump"
              />
            </FormControl>
            
            <HStack spacing={4}>
              <FormControl>
                <FormLabel htmlFor="event_date">Event Date</FormLabel>
                <Input 
                  id="event_date" 
                  type="date"
                  value={eventFormData.event_date}
                  onChange={(e) => setEventFormData({
                    ...eventFormData, 
                    event_date: e.target.value
                  })}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="event_day">Day Number</FormLabel>
                <Input 
                  id="event_day" 
                  type="number"
                  min="1"
                  value={eventFormData.event_day}
                  onChange={(e) => setEventFormData({
                    ...eventFormData, 
                    event_day: e.target.value
                  })}
                  placeholder="1"
                />
              </FormControl>
            </HStack>
            
            <HStack spacing={4}>
              <FormControl>
                <FormLabel htmlFor="start_time">Start Time</FormLabel>
                <Input 
                  id="start_time" 
                  type="time"
                  value={eventFormData.start_time}
                  onChange={(e) => setEventFormData({
                    ...eventFormData, 
                    start_time: e.target.value
                  })}
                />
              </FormControl>
                
              <FormControl>
                <FormLabel htmlFor="heat">Heat Number</FormLabel>
                <Input 
                  id="heat" 
                  type="number"
                  min="1"
                  value={eventFormData.heat}
                  onChange={(e) => setEventFormData({
                    ...eventFormData, 
                    heat: e.target.value
                  })}
                  placeholder="1"
                />
              </FormControl>
            </HStack>
            
            <FormControl>
              <FormLabel htmlFor="event_type">Event Type</FormLabel>
              <Select 
                id="event_type" 
                value={eventFormData.event_type}
                onChange={(e) => setEventFormData({
                  ...eventFormData, 
                  event_type: e.target.value
                })}
                placeholder="Select event type"
              >
                <option value="Preliminary">Preliminary</option>
                <option value="Qualifier">Qualifier</option>
                <option value="Semifinal">Semifinal</option>
                <option value="Finals">Finals</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel htmlFor="run_time">Run Time (Post-Event)</FormLabel>
              <Input 
                id="run_time" 
                value={eventFormData.run_time}
                onChange={(e) => setEventFormData({
                  ...eventFormData, 
                  run_time: e.target.value
                })}
                placeholder="e.g., 10.85, 2:05.43"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit}>
            {isEditMode ? 'Update Event' : 'Add Event'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 