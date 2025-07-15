import React, { useState, useRef } from 'react';
import { Box, Flex, Avatar, Text, useToast } from '@chakra-ui/react';
import { useSwipeable } from 'react-swipeable';
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
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [markingAsReadIds, setMarkingAsReadIds] = useState<Set<string>>(new Set());
  const [swipeOffsets, setSwipeOffsets] = useState<{ [key: string]: number }>({});
  const [debugInfo, setDebugInfo] = useState<string>('Ready to swipe');
  const swipeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
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
    toast({
      title: '🗑️ Would delete',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
  };

  const handleMarkAsRead = (notificationId: string) => {
    toast({
      title: '📖 Would mark as read',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
  };

  return (
    <Box w="100%" minH="100vh" sx={{ touchAction: 'pan-y' }}>
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

      {mockNotifications.map((notification) => {
        const isDeleting = deletingIds.has(notification.id);
        const isMarkingAsRead = markingAsReadIds.has(notification.id);
        const swipeOffset = swipeOffsets[notification.id] || 0;
        
        // Calculate opacity based on swipe progress (0-1 scale)
        const rightOpacity = Math.min(Math.max(swipeOffset / 80, 0), 1);
        const leftOpacity = Math.min(Math.max(-swipeOffset / 80, 0), 1);

        return (
          <Box key={notification.id} position="relative" w="100%">
            {/* Background Layers */}
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              zIndex={1}
              display="flex"
              justifyContent="space-between"
            >
              {/* Mark as read background */}
              <Box
                w="50%"
                bg="blue.400"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="flex-start"
                pl={8}
                opacity={rightOpacity}
                transition="opacity 0.1s ease-out"
              >
                <Box color="white" fontSize="4xl" mb={1}>
                  <FaEnvelopeOpen />
                </Box>
                <Text color="white" fontWeight="bold" fontSize="lg">
                  Read
                </Text>
              </Box>
              {/* Delete background */}
              <Box
                w="50%"
                bg="red.500"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="flex-end"
                pr={8}
                opacity={leftOpacity}
                transition="opacity 0.1s ease-out"
              >
                <Box color="white" fontSize="4xl" mb={1}>
                  <FaTrash />
                </Box>
                <Text color="white" fontWeight="bold" fontSize="lg">
                  Delete
                </Text>
              </Box>
            </Box>

            {/* Main notification content */}
            <Box
              {...useSwipeable({
                onSwiping: ({ deltaX }) => {
                  setDebugInfo(`Swiping ${notification.id} with deltaX: ${deltaX}`);
                  setSwipeOffsets(prev => ({
                    ...prev,
                    [notification.id]: Math.max(Math.min(deltaX, 120), -120),
                  }));
                },
                onSwipedLeft: () => {
                  const currentOffset = swipeOffsets[notification.id] || 0;
                  if (Math.abs(currentOffset) > 50) {
                    setDebugInfo(`Swiped left on ${notification.id} - deleting`);
                    setDeletingIds(prev => new Set(prev).add(notification.id));
                    const element = swipeRefs.current[notification.id];
                    if (element) {
                      element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                      element.style.transform = 'translateX(-100%)';
                      element.style.opacity = '0';
                    }
                    setTimeout(() => {
                      handleDelete(notification.id);
                      setDeletingIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(notification.id);
                        return newSet;
                      });
                      setSwipeOffsets(prev => {
                        const newOffsets = { ...prev };
                        delete newOffsets[notification.id];
                        return newOffsets;
                      });
                      setDebugInfo('Delete completed');
                    }, 300);
                  } else {
                    setSwipeOffsets(prev => {
                      const newOffsets = { ...prev };
                      delete newOffsets[notification.id];
                      return newOffsets;
                    });
                    setDebugInfo(`Swipe left canceled on ${notification.id}`);
                  }
                },
                onSwipedRight: () => {
                  const currentOffset = swipeOffsets[notification.id] || 0;
                  if (Math.abs(currentOffset) > 50 && !notification.is_read) {
                    setDebugInfo(`Swiped right on ${notification.id} - marking read`);
                    setMarkingAsReadIds(prev => new Set(prev).add(notification.id));
                    const element = swipeRefs.current[notification.id];
                    if (element) {
                      element.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
                      element.style.transform = 'translateX(100%)';
                      element.style.opacity = '0';
                    }
                    setTimeout(() => {
                      handleMarkAsRead(notification.id);
                      setMarkingAsReadIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(notification.id);
                        return newSet;
                      });
                      setSwipeOffsets(prev => {
                        const newOffsets = { ...prev };
                        delete newOffsets[notification.id];
                        return newOffsets;
                      });
                      setDebugInfo('Mark read completed');
                    }, 300);
                  } else {
                    setSwipeOffsets(prev => {
                      const newOffsets = { ...prev };
                      delete newOffsets[notification.id];
                      return newOffsets;
                    });
                    setDebugInfo(`Swipe right canceled on ${notification.id}`);
                  }
                },
                onSwiped: () => {
                  const element = swipeRefs.current[notification.id];
                  if (element) {
                    element.style.transition = 'transform 0.3s ease-out';
                    element.style.transform = 'translateX(0)';
                    element.style.opacity = '1';
                  }
                  setSwipeOffsets(prev => {
                    const newOffsets = { ...prev };
                    delete newOffsets[notification.id];
                    return newOffsets;
                  });
                  setDebugInfo(`Swipe reset on ${notification.id}`);
                },
                delta: 10,
                preventScrollOnSwipe: true,
                trackTouch: true,
                trackMouse: false,
              })}
              ref={(el) => (swipeRefs.current[notification.id] = el)}
              onTouchStart={() => {
                setDebugInfo(`Touch started on ${notification.id}`);
              }}
              onClick={() => setDebugInfo(`Clicked notification ${notification.id}`)}
              position="relative"
              zIndex={2}
              bg="white"
              transform={`translateX(${isDeleting ? '-100%' : isMarkingAsRead ? '100%' : swipeOffset}px)`}
              transition="transform 0.1s ease-out, opacity 0.1s ease-out"
              sx={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              <Flex
                align="center"
                p={4}
                borderBottom="1px solid"
                borderColor="gray.200"
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
        );
      })}
    </Box>
  );
};

export default MobileNotifications;