/**
 * Modal component for selecting events and creating new events
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
  Button,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Text
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { useMeetEvents } from '../../../hooks/meets';
import { formatEventTime } from '../../../utils/meets';
import type { TrackMeet } from '../../../types/meetTypes';

interface EventSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  meet: TrackMeet | null;
  onAddNewEvent: () => void;
}

export const EventSelectionModal: React.FC<EventSelectionModalProps> = ({
  isOpen,
  onClose,
  meet,
  onAddNewEvent
}) => {
  const {
    meetEvents,
    selectedEvents,
    fetchMeetEvents,
    toggleEventSelection,
    saveEventSelections
  } = useMeetEvents();

  // Fetch events when modal opens and meet changes
  React.useEffect(() => {
    if (isOpen && meet?.id) {
      fetchMeetEvents(meet.id);
    }
  }, [isOpen, meet?.id, fetchMeetEvents]);

  const handleSave = async () => {
    await saveEventSelections();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Select Events for {meet?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex justifyContent="flex-end" mb={4}>
            <Button 
              leftIcon={<FaPlus />} 
              colorScheme="green" 
              size="sm" 
              onClick={onAddNewEvent}
            >
              Add New Event
            </Button>
          </Flex>
          
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Event</Th>
                <Th>Day</Th>
                <Th>Time</Th>
                <Th>Participate</Th>
              </Tr>
            </Thead>
            <Tbody>
              {meetEvents.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center">
                    No events available for this meet
                  </Td>
                </Tr>
              ) : (
                meetEvents.map((event) => (
                  <Tr key={event.id}>
                    <Td>{event.event_name}</Td>
                    <Td>{event.event_day ? `Day ${event.event_day}` : '-'}</Td>
                    <Td>
                      {event.start_time 
                        ? formatEventTime(event.start_time)
                        : '-'
                      }
                    </Td>
                    <Td>
                      <Checkbox 
                        isChecked={selectedEvents.includes(event.id)}
                        onChange={() => toggleEventSelection(event.id)}
                      />
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save Selections
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 