import React, { useState, useRef } from 'react';
import { Box, Flex, Avatar, Text, useToast } from '@chakra-ui/react';
import { FaTrash, FaEnvelopeOpen } from 'react-icons/fa';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  avatar_url?: string;
}

const MobileNotifications: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('Ready to swipe');
  const [swipeStates, setSwipeStates] = useState<{[key: string]: { 
    isDragging: boolean; 
    startX: number; 
    currentX: number; 
    direction: 'left' | 'right' | null 
  }}>({});
  const toast = useToast();

  // Mock data for testing
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Workout Assigned',
      message: 'New training plan has been assigned for tomorrow',
      is_read: false,
      created_at: '2024-01-15T10:30:00Z',
      avatar_url: undefined,
    },
    {
      id: '2',
      title: 'Meet Reminder',
      message: 'Track meet this Saturday at 9:00 AM',
      is_read: true,
      created_at: '2024-01-14T15:45:00Z',
      avatar_url: undefined,
    },
  ];

  const handleDelete = (notificationId: string) => {
    setDebugInfo(`Deleted notification ${notificationId}`);
    toast({
      title: '🗑️ Would delete',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
  };

  const handleMarkAsRead = (notificationId: string) => {
    setDebugInfo(`Marked as read notification ${notificationId}`);
    toast({
      title: '📖 Would mark as read',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
  };

  const handleTouchStart = (e: React.TouchEvent, notificationId: string) => {
    const touch = e.touches[0];
    setSwipeStates(prev => ({
      ...prev,
      [notificationId]: {
        isDragging: true,
        startX: touch.clientX,
        currentX: touch.clientX,
        direction: null
      }
    }));
    setDebugInfo(`Touch started on ${notificationId}`);
  };

  const handleTouchMove = (e: React.TouchEvent, notificationId: string) => {
    const state = swipeStates[notificationId];
    if (!state?.isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - state.startX;
    const direction = deltaX > 0 ? 'right' : 'left';

    setSwipeStates(prev => ({
      ...prev,
      [notificationId]: {
        ...state,
        currentX: touch.clientX,
        direction: Math.abs(deltaX) > 20 ? direction : null
      }
    }));

    setDebugInfo(`Swiping ${notificationId}: ${Math.round(deltaX)}px ${direction}`);
  };

  const handleTouchEnd = (e: React.TouchEvent, notificationId: string, notification: Notification) => {
    const state = swipeStates[notificationId];
    if (!state?.isDragging) return;

    const deltaX = state.currentX - state.startX;
    const distance = Math.abs(deltaX);

    // Reset drag state
    setSwipeStates(prev => {
      const newStates = { ...prev };
      delete newStates[notificationId];
      return newStates;
    });

    // Trigger actions if swipe was far enough
    if (distance > 80) {
      if (deltaX < 0) {
        // Swiped left - delete
        handleDelete(notificationId);
      } else if (deltaX > 0 && !notification.is_read) {
        // Swiped right - mark as read (only if unread)
        handleMarkAsRead(notificationId);
      } else {
        setDebugInfo(`Swipe right ignored - already read`);
      }
    } else {
      setDebugInfo(`Swipe canceled - not far enough (${Math.round(distance)}px)`);
    }
  };

  const getSwipeTransform = (notificationId: string) => {
    const state = swipeStates[notificationId];
    if (!state?.isDragging) return 'translateX(0px)';
    
    const deltaX = state.currentX - state.startX;
    const maxSwipe = 120;
    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    return `translateX(${clampedDelta}px)`;
  };

  const getBackgroundOpacity = (notificationId: string, direction: 'left' | 'right') => {
    const state = swipeStates[notificationId];
    if (!state?.isDragging) return 0;
    
    const deltaX = state.currentX - state.startX;
    const distance = Math.abs(deltaX);
    const opacity = Math.min(distance / 80, 1);
    
    if (direction === 'left' && deltaX < 0) return opacity;
    if (direction === 'right' && deltaX > 0) return opacity;
    return 0;
  };

  return (
    <Box w="100%" minH="100vh">
      {/* Visual Debug Overlay */}
      <Box
        position="sticky"
        top="0"
        bg="yellow.100"
        p={2}
        borderBottom="2px solid"
        borderColor="yellow.300"
        zIndex={10}
      >
        <Text fontSize="sm" fontWeight="bold" color="black">
          DEBUG: {debugInfo}
        </Text>
      </Box>

      {mockNotifications.map((notification) => (
        <Box key={notification.id} position="relative" w="100%" overflow="hidden">
          {/* Delete Background (Left) */}
          <Box
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            w="120px"
            bg="red.500"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            opacity={getBackgroundOpacity(notification.id, 'left')}
            transition="opacity 0.1s ease-out"
            zIndex={1}
          >
            <Box color="white" fontSize="3xl" mb={1}>
              <FaTrash />
            </Box>
            <Text color="white" fontWeight="bold" fontSize="sm">
              Delete
            </Text>
          </Box>

          {/* Mark as Read Background (Right) */}
          <Box
            position="absolute"
            top="0"
            left="0"
            bottom="0"
            w="120px"
            bg="blue.400"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            opacity={getBackgroundOpacity(notification.id, 'right')}
            transition="opacity 0.1s ease-out"
            zIndex={1}
          >
            <Box color="white" fontSize="3xl" mb={1}>
              <FaEnvelopeOpen />
            </Box>
            <Text color="white" fontWeight="bold" fontSize="sm">
              Read
            </Text>
          </Box>

          {/* Main notification content */}
          <Box
            bg="white"
            borderBottom="1px solid"
            borderColor="gray.200"
            position="relative"
            zIndex={2}
            transform={getSwipeTransform(notification.id)}
            transition={swipeStates[notification.id]?.isDragging ? 'none' : 'transform 0.3s ease-out'}
            onTouchStart={(e) => handleTouchStart(e, notification.id)}
            onTouchMove={(e) => handleTouchMove(e, notification.id)}
            onTouchEnd={(e) => handleTouchEnd(e, notification.id, notification)}
            onClick={() => setDebugInfo(`Clicked notification ${notification.id}`)}
            sx={{
              touchAction: 'pan-x',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            <Flex
              align="center"
              p={4}
              minH="80px"
            >
              {/* Avatar */}
              <Avatar
                size="md"
                src={notification.avatar_url}
                name={notification.title}
                mr={3}
                flexShrink={0}
              />

              {/* Content */}
              <Box flex="1" minW="0">
                <Text
                  fontWeight={notification.is_read ? 'normal' : 'bold'}
                  fontSize="md"
                  color={notification.is_read ? 'gray.600' : 'black'}
                  noOfLines={1}
                  mb={1}
                >
                  {notification.title}
                </Text>
                <Text fontSize="sm" color="gray.500" noOfLines={1}>
                  {notification.message}
                </Text>
              </Box>

              {/* Read indicator */}
              {!notification.is_read && (
                <Box
                  w="8px"
                  h="8px"
                  bg="blue.500"
                  borderRadius="full"
                  ml={3}
                  flexShrink={0}
                />
              )}
            </Flex>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default MobileNotifications;