import React, { useState } from 'react';
import { Box, Flex, Avatar, Text, HStack, useToast } from '@chakra-ui/react';
import { useSwipeable } from 'react-swipeable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  avatar_url?: string;
}

const MobileNotifications: React.FC = () => {
  const [swipingNotificationId, setSwipingNotificationId] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [processingNotifications, setProcessingNotifications] = useState<Set<string>>(new Set());
  const toast = useToast();
  const queryClient = useQueryClient();

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

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: (_, notificationId) => {
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Notification marked as read',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (_, notificationId) => {
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      toast({
        title: 'Failed to mark notification as read',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: (_, notificationId) => {
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Notification deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    },
    onError: (_, notificationId) => {
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      toast({
        title: 'Failed to delete notification',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  });

  const handleSwipeRight = (notificationId: string) => {
    if (processingNotifications.has(notificationId)) {
      console.log('⏳ Already processing notification:', notificationId);
      return;
    }
    
    console.log('Swiped right on notification:', notificationId);
    setProcessingNotifications(prev => new Set(prev).add(notificationId));
    markAsReadMutation.mutate(notificationId);
  };

  const handleSwipeLeft = (notificationId: string) => {
    if (processingNotifications.has(notificationId)) {
      console.log('⏳ Already processing notification:', notificationId);
      return;
    }
    
    console.log('Swiped left on notification:', notificationId);
    setProcessingNotifications(prev => new Set(prev).add(notificationId));
    deleteNotificationMutation.mutate(notificationId);
  };

  const getSwipeHandlers = (notificationId: string) => {
    return useSwipeable({
      onSwipedLeft: () => {
        console.log('✅ Completed swipe left on:', notificationId);
        setSwipingNotificationId(null);
        setSwipeDirection(null);
        if (!processingNotifications.has(notificationId)) {
          handleSwipeLeft(notificationId);
        }
      },
      onSwipedRight: () => {
        console.log('✅ Completed swipe right on:', notificationId);
        setSwipingNotificationId(null);
        setSwipeDirection(null);
        if (!processingNotifications.has(notificationId)) {
          handleSwipeRight(notificationId);
        }
      },
      onSwiping: (eventData) => {
        console.log('🔄 Swiping:', eventData.deltaX, 'px, velocity:', eventData.velocity);
        if (Math.abs(eventData.deltaX) > 15) {
          setSwipingNotificationId(notificationId);
          setSwipeDirection(eventData.deltaX > 0 ? 'right' : 'left');
        }
        
        // Trigger action if swipe is far enough
        if (Math.abs(eventData.deltaX) > 80 && !processingNotifications.has(notificationId)) {
          console.log('🚀 Auto-completing swipe at 80px');
          if (eventData.deltaX > 0) {
            console.log('✅ Auto-completed swipe right');
            setSwipingNotificationId(null);
            setSwipeDirection(null);
            handleSwipeRight(notificationId);
          } else {
            console.log('✅ Auto-completed swipe left');
            setSwipingNotificationId(null);
            setSwipeDirection(null);
            handleSwipeLeft(notificationId);
          }
        }
      },
      onSwiped: () => {
        console.log('🛑 Swipe ended');
        setSwipingNotificationId(null);
        setSwipeDirection(null);
      },
      trackMouse: true,
      trackTouch: true,
      delta: 10, // Very low threshold
      preventScrollOnSwipe: true,
      swipeDuration: 1000, // Allow longer swipes
      touchEventOptions: { passive: false },
      rotationAngle: 0,
    });
  };

  const handleNotificationClick = (notificationId: string) => {
    if (swipingNotificationId) return; // Prevent click during swipe
    console.log('Clicked notification:', notificationId);
  };

  return (
    <Box w="100%" minH="100vh">
      {mockNotifications.map((notification) => {
        const swipeHandlers = getSwipeHandlers(notification.id);
        const isCurrentlySwiping = swipingNotificationId === notification.id;
        
        return (
          <Box
            key={notification.id}
            {...swipeHandlers}
            position="relative"
            overflow="hidden"
          >
            {/* Background action indicators */}
            {isCurrentlySwiping && (
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                zIndex={0}
                bg={swipeDirection === 'right' ? 'blue.200' : 'red.200'}
                display="flex"
                alignItems="center"
                justifyContent={swipeDirection === 'right' ? 'flex-start' : 'flex-end'}
                px={6}
              >
                <Text
                  color={swipeDirection === 'right' ? 'blue.700' : 'red.700'}
                  fontWeight="bold"
                  fontSize="lg"
                >
                  {swipeDirection === 'right' ? '📖 Mark as Read' : '🗑️ Delete'}
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
              position="relative"
              zIndex={1}
              bg="white"
              style={{
                transform: isCurrentlySwiping && swipeDirection ? 
                  `translateX(${swipeDirection === 'right' ? '60px' : '-60px'})` : 
                  'translateX(0)',
                transition: isCurrentlySwiping ? 'none' : 'transform 0.2s ease',
                opacity: isCurrentlySwiping ? 0.9 : 1
              }}
              onClick={() => handleNotificationClick(notification.id)}
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
