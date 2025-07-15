import React, { useState, useMemo } from 'react';
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
  const [swipingIds, setSwipingIds] = useState<Set<string>>(new Set());
  const [swipeDirection, setSwipeDirection] = useState<{[key: string]: 'left' | 'right'}>({});
  const [debugInfo, setDebugInfo] = useState<string>('Ready to swipe');
  const toast = useToast();

  // Mock data for testing
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Workout Assigned',
      message: 'New training plan has been assigned for tomorrow',
      is_read: false,
      created_at: '2024-01-15T10:30:00Z',
      avatar_url: undefined
    },
    {
      id: '2', 
      title: 'Meet Reminder',
      message: 'Track meet this Saturday at 9:00 AM',
      is_read: true,
      created_at: '2024-01-14T15:45:00Z',
      avatar_url: undefined
    }
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

  // Create swipe handlers for each notification using useMemo to avoid recreating on every render
  const swipeHandlers = useMemo(() => {
    const handlers: {[key: string]: any} = {};
    
    mockNotifications.forEach(notification => {
      handlers[notification.id] = useSwipeable({
        onSwipedLeft: () => {
          setDebugInfo(`Swiped left on ${notification.id} - deleting`);
          setSwipingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(notification.id);
            return newSet;
          });
          setSwipeDirection(prev => {
            const newDir = {...prev};
            delete newDir[notification.id];
            return newDir;
          });
          setDeletingIds(prev => new Set(prev).add(notification.id));
          
          // Add delay for visual animation before action
          setTimeout(() => {
            handleDelete(notification.id);
            setDeletingIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(notification.id);
              return newSet;
            });
            setDebugInfo('Delete completed');
          }, 300);
        },
        onSwipedRight: () => {
          setDebugInfo(`Swiped right on ${notification.id} - marking read`);
          setSwipingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(notification.id);
            return newSet;
          });
          setSwipeDirection(prev => {
            const newDir = {...prev};
            delete newDir[notification.id];
            return newDir;
          });
          setMarkingAsReadIds(prev => new Set(prev).add(notification.id));
          
          // Add delay for visual animation before action
          setTimeout(() => {
            handleMarkAsRead(notification.id);
            setMarkingAsReadIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(notification.id);
              return newSet;
            });
            setDebugInfo('Mark read completed');
          }, 300);
        },
        onSwiping: (eventData) => {
          setDebugInfo(`Swiping deltaX: ${eventData.deltaX}`);
          if (Math.abs(eventData.deltaX) > 20) {
            const direction = eventData.deltaX > 0 ? 'right' : 'left';
            setDebugInfo(`Setting ${direction} swipe for ${notification.id}`);
            setSwipingIds(prev => new Set(prev).add(notification.id));
            setSwipeDirection(prev => ({
              ...prev,
              [notification.id]: direction
            }));
          }
        },
        onSwiped: () => {
          // Keep swiping state until onSwipedLeft/Right handles cleanup
        },
        trackTouch: true,
        preventScrollOnSwipe: true,
      });
    });
    
    return handlers;
  }, [toast]); // Only recreate if toast changes

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
      
      {mockNotifications.map((notification) => {
        const currentSwipeHandlers = swipeHandlers[notification.id];
        
        const isDeleting = deletingIds.has(notification.id);
        const isMarkingAsRead = markingAsReadIds.has(notification.id);
        const isSwiping = swipingIds.has(notification.id);
        const currentSwipeDirection = swipeDirection[notification.id];
        const showDeleteBackground = isDeleting || (isSwiping && currentSwipeDirection === 'left');
        const showReadBackground = isMarkingAsRead || (isSwiping && currentSwipeDirection === 'right');
        
        return (
          <Box
            key={notification.id}
            {...currentSwipeHandlers}
            position="relative"
            overflow="hidden"
            onClick={() => setDebugInfo(`Clicked notification ${notification.id}`)}
            style={{
              transform: isDeleting ? 'translateX(-100%)' : 
                        isMarkingAsRead ? 'translateX(100%)' : 
                        'translateX(0)',
              transition: 'transform 0.3s ease-out',
            }}
          >
            {/* Delete background */}
            {showDeleteBackground && (
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg="red.500"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="flex-end"
                pr={8}
                zIndex={1}
              >
                <Box color="white" fontSize="4xl" mb={1}>
                  <FaTrash />
                </Box>
                <Text color="white" fontWeight="bold" fontSize="lg">
                  Delete
                </Text>
              </Box>
            )}

            {/* Mark as read background */}
            {showReadBackground && (
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg="blue.400"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="flex-start"
                pl={8}
                zIndex={1}
              >
                <Box color="white" fontSize="4xl" mb={1}>
                  <FaEnvelopeOpen />
                </Box>
                <Text color="white" fontWeight="bold" fontSize="lg">
                  Read
                </Text>
              </Box>
            )}

            {/* Main notification content */}
            <Flex
              align="center"
              p={4}
              borderBottom="1px solid"
              borderColor="gray.200"
              minH="80px"
              bg="white"
              position="relative"
              zIndex={2}
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
                  fontWeight={notification.is_read ? "normal" : "bold"}
                  fontSize="md"
                  color={notification.is_read ? "gray.600" : "black"}
                  noOfLines={1}
                  mb={1}
                >
                  {notification.title}
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.500"
                  noOfLines={1}
                >
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
        );
      })}
    </Box>
  );
};

export default MobileNotifications;
