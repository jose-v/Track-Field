/**
 * Tab component for displaying personal meets using hooks and shared components
 */

import React, { useState } from 'react';
import {
  Box,
  Flex,
  Spinner,
  VStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useDisclosure
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaRunning, FaEllipsisV } from 'react-icons/fa';
import { useMyMeets } from '../../../hooks/meets';
import { MeetCard, EmptyState } from '../index';
import type { TrackMeet } from '../../../types/meetTypes';

interface MyMeetsTabProps {
  onEditMeet: (meet: TrackMeet) => void;
  onSelectEvents: (meet: TrackMeet) => void;
  onDeleteMeet: (meet: TrackMeet) => void;
}

export const MyMeetsTab: React.FC<MyMeetsTabProps> = ({
  onEditMeet,
  onSelectEvents,
  onDeleteMeet
}) => {
  const {
    trackMeets,
    loading,
    meetEventCounts,
    fetchTrackMeets
  } = useMyMeets();

  if (loading) {
    return (
      <Flex justify="center" my={8}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (trackMeets.length === 0) {
    return (
      <EmptyState
        title="You haven't created any meets yet."
        description="Create your first meet to get started."
      />
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {trackMeets.map((meet) => {
        const actionButtons = (
          <>
            <Tooltip label="Select Events">
              <IconButton
                aria-label="Select events"
                icon={<FaRunning />}
                onClick={() => onSelectEvents(meet)}
                colorScheme="teal"
                variant="outline"
              />
            </Tooltip>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<FaEllipsisV />}
                variant="outline"
              />
              <MenuList>
                <MenuItem icon={<FaEdit />} onClick={() => onEditMeet(meet)}>
                  Edit
                </MenuItem>
                <MenuItem 
                  icon={<FaTrash />} 
                  onClick={() => onDeleteMeet(meet)}
                  color="red.500"
                >
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </>
        );

        return (
          <MeetCard
            key={meet.id}
            meet={meet}
            eventCount={meetEventCounts[meet.id] || 0}
            actionButtons={actionButtons}
            showTravelTime={true}
          />
        );
      })}
    </VStack>
  );
}; 