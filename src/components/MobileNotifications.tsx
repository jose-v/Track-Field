import React, { useState } from 'react';
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
    console.log('✅ Would delete notification:', notificationId);
    toast({
      title: '🗑️ Would delete',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
  };

  const handleMarkAsRead = (notificationId: string) => {
    console.log('✅ Would mark as read:', notificationId);
    toast({
      title: '📖 Would mark as read',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
  };

  const getSwipeHandlers = (notificationId: string) => {
    return useSwipeable({
      onSwipedLeft: () => {
        console.log('Swiped left on:', notificationId);
        setSwipingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
        setSwipeDirection(prev => {
          const newDir = {...prev};
          delete newDir[notificationId];
          return newDir;
        });
        setDeletingIds(prev => new Set(prev).add(notificationId));
        
        // Add delay for visual animation before action
        setTimeout(() => {
          handleDelete(notificationId);
          setDeletingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(notificationId);
            return newSet;
          });
        }, 300);
      },
      onSwipedRight: () => {
        console.log('Swiped right on:', notificationId);
        setSwipingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
        setSwipeDirection(prev => {
          const newDir = {...prev};
          delete newDir[notificationId];
          return newDir;
        });
        setMarkingAsReadIds(prev => new Set(prev).add(notificationId));
        
        // Add delay for visual animation before action
        setTimeout(() => {
          handleMarkAsRead(notificationId);
          setMarkingAsReadIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(notificationId);
            return newSet;
          });
        }, 300);
      },
      onSwiping: (eventData) => {
        console.log('🔄 SWIPING deltaX:', eventData.deltaX);
        if (Math.abs(eventData.deltaX) > 20) {
          console.log('📍 Setting swiping state for:', notificationId, 'direction:', eventData.deltaX > 0 ? 'right' : 'left');
          setSwipingIds(prev => new Set(prev).add(notificationId));
          setSwipeDirection(prev => ({
            ...prev,
            [notificationId]: eventData.deltaX > 0 ? 'right' : 'left'
          }));
        }
      },
      onSwiped: () => {
        // Keep swiping state until onSwipedLeft/Right handles cleanup
      },
      trackTouch: true,
      preventScrollOnSwipe: true,
    });
  };

  return (
    <Box w="100%" minH="100vh">
      {mockNotifications.map((notification) => {
        const swipeHandlers = getSwipeHandlers(notification.id);
        const isDeleting = deletingIds.has(notification.id);
        const isMarkingAsRead = markingAsReadIds.has(notification.id);
        const isSwiping = swipingIds.has(notification.id);
        const currentSwipeDirection = swipeDirection[notification.id];
        const showDeleteBackground = isDeleting || (isSwiping && currentSwipeDirection === 'left');
        const showReadBackground = isMarkingAsRead || (isSwiping && currentSwipeDirection === 'right');
        
        // Debug logging
        if (isSwiping || isDeleting || isMarkingAsRead) {
          console.log('🎨 RENDER DEBUG for', notification.id, {
            isSwiping,
            currentSwipeDirection,
            isDeleting,
            isMarkingAsRead,
            showDeleteBackground,
            showReadBackground
          });
        }

        return (
          <Box
            key={notification.id}
            {...swipeHandlers}
            position="relative"
            overflow="hidden"
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
                bgGradient="linear(to-l, red.500, red.400)"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="flex-end"
                pr={8}
                zIndex={-1}
              >
                <Box color="white" fontSize="3xl" mb={1}>
                  <FaTrash />
                </Box>
                <Text color="white" fontWeight="bold" fontSize="md">
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
                bgGradient="linear(to-r, blue.500, blue.400)"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="flex-start"
                pl={8}
                zIndex={-1}
              >
                <Box color="white" fontSize="3xl" mb={1}>
                  <FaEnvelopeOpen />
                </Box>
                <Text color="white" fontWeight="bold" fontSize="md">
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
              zIndex={1}
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
