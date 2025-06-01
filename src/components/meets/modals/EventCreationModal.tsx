/**
 * Modal component for creating new events
 */

import React from 'react';
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
}

export const EventCreationModal: React.FC<EventCreationModalProps> = ({
  isOpen,
  onClose,
  meet
}) => {
  const {
    eventFormData,
    setEventFormData,
    handleCreateEvent,
    resetEventForm
  } = useMeetEvents();

  const handleSubmit = async () => {
    if (!meet?.id) return;
    
    await handleCreateEvent(meet.id);
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
        <ModalHeader>Add New Event to {meet?.name}</ModalHeader>
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
              <FormControl flex="1">
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
              
              <FormControl flex="1">
                <FormLabel htmlFor="event_day">Day Number</FormLabel>
                <Select 
                  id="event_day" 
                  value={eventFormData.event_day}
                  onChange={(e) => setEventFormData({
                    ...eventFormData, 
                    event_day: e.target.value
                  })}
                >
                  {[1, 2, 3, 4, 5].map(day => (
                    <option key={day} value={day}>Day {day}</option>
                  ))}
                </Select>
              </FormControl>
            </HStack>
            
            <HStack spacing={4}>
              <FormControl flex="1">
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
                
              <FormControl flex="1">
                <FormLabel htmlFor="heat">Heat Number</FormLabel>
                <Input 
                  id="heat" 
                  type="number"
                  value={eventFormData.heat}
                  onChange={(e) => setEventFormData({
                    ...eventFormData, 
                    heat: e.target.value
                  })}
                  placeholder="1, 2, 3..."
                />
              </FormControl>
            </HStack>
            
            <HStack spacing={4}>
              <FormControl flex="1">
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
              
              <FormControl flex="1">
                <FormLabel htmlFor="run_time">Run Time (Post-Event)</FormLabel>
                <Input 
                  id="run_time" 
                  value={eventFormData.run_time}
                  onChange={(e) => setEventFormData({
                    ...eventFormData, 
                    run_time: e.target.value
                  })}
                  placeholder="e.g. 10.85, 2:05.43"
                />
              </FormControl>
            </HStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="green" 
            onClick={handleSubmit}
            isDisabled={!eventFormData.event_name.trim()}
          >
            Create Event
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 