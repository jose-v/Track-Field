import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex, Avatar, Text, useToast, useColorModeValue } from '@chakra-ui/react';
import { FaTrash, FaEnvelopeOpen } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  metadata: any;
  created_at: string;
  is_read: boolean;
  is_archived?: boolean;
}

const MobileNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({});
  const [debugInfo, setDebugInfo] = useState<string>('Ready to swipe');
  const [swipeStates, setSwipeStates] = useState<{[key: string]: { 
    isDragging: boolean; 
    startX: number; 
    currentX: number; 
    direction: 'left' | 'right' | null 
  }}>({});
  const toast = useToast();

  // Light/Dark mode colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const unreadTextColor = useColorModeValue('black', 'white');
  const readTextColor = useColorModeValue('gray.600', 'gray.400');
  const loadingBg = useColorModeValue('gray.50', 'gray.700');
  const emptyTextColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setNotifications(data || []);

      // Extract user IDs from notification metadata to fetch avatars
      if (data && data.length > 0) {
        const userIds = new Set<string>();
        
        data.forEach(notification => {
          if (notification.metadata) {
            if (notification.metadata.coach_id) {
              userIds.add(notification.metadata.coach_id);
            }
            if (notification.metadata.athlete_id) {
              userIds.add(notification.metadata.athlete_id);
            }
            if (notification.metadata.sender_id) {
              userIds.add(notification.metadata.sender_id);
            }
          }
        });

        // Fetch user profiles for avatars
        if (userIds.size > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', Array.from(userIds));

          if (!profilesError && profiles) {
            const profilesMap = profiles.reduce((acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            }, {} as { [key: string]: any });
            
            setUserProfiles(profilesMap);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );

      setDebugInfo(`Deleted notification ${notificationId}`);
      toast({
        title: '🗑️ Notification deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );

      setDebugInfo(`Marked as read notification ${notificationId}`);
      toast({
        title: '📖 Marked as read',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark as read',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getUserProfileForNotification = (notification: Notification) => {
    if (!notification.metadata) return null;
    
    let userId = null;
    if (notification.metadata.coach_id) {
      userId = notification.metadata.coach_id;
    } else if (notification.metadata.athlete_id) {
      userId = notification.metadata.athlete_id;
    } else if (notification.metadata.sender_id) {
      userId = notification.metadata.sender_id;
    }
    
    return userId ? userProfiles[userId] : null;
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return format(date, 'h:mm a');
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'MMM d');
      }
    } catch {
      return 'Recently';
    }
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

    // Trigger actions if swipe was far enough (increased from 80px to 120px)
    if (distance > 120) {
      if (deltaX < 0) {
        // Swiped left - delete
        deleteNotification(notificationId);
      } else if (deltaX > 0 && !notification.is_read) {
        // Swiped right - mark as read (only if unread)
        markAsRead(notificationId);
      } else {
        setDebugInfo(`Swipe right ignored - already read`);
      }
    } else {
      setDebugInfo(`Swipe canceled - not far enough (${Math.round(distance)}px, need 120px)`);
    }
  };

  const getSwipeTransform = (notificationId: string) => {
    const state = swipeStates[notificationId];
    if (!state?.isDragging) return 'translateX(0px)';
    
    const deltaX = state.currentX - state.startX;
    const maxSwipe = 150; // Increased max swipe distance
    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    return `translateX(${clampedDelta}px)`;
  };

  const getBackgroundOpacity = (notificationId: string, direction: 'left' | 'right') => {
    const state = swipeStates[notificationId];
    if (!state?.isDragging) return 0;
    
    const deltaX = state.currentX - state.startX;
    const distance = Math.abs(deltaX);
    const opacity = Math.min(distance / 120, 1); // Updated to match new threshold
    
    if (direction === 'left' && deltaX < 0) return opacity;
    if (direction === 'right' && deltaX > 0) return opacity;
    return 0;
  };

  if (isLoading) {
    return (
      <Box w="100%" minH="100vh" bg={loadingBg} display="flex" alignItems="center" justifyContent="center">
        <Text color={textColor}>Loading notifications...</Text>
      </Box>
    );
  }

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
          DEBUG: {debugInfo} | Total: {notifications.length} notifications
        </Text>
      </Box>

      {notifications.length === 0 ? (
        <Box p={8} textAlign="center" bg={bgColor}>
          <Text color={emptyTextColor}>No notifications yet</Text>
        </Box>
      ) : (
        notifications.map((notification) => {
          const userProfile = getUserProfileForNotification(notification);
          const avatarUrl = userProfile?.avatar_url;
          const displayName = userProfile ? 
            `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 
            notification.title;

          return (
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
                bg={bgColor}
                borderBottom="1px solid"
                borderColor={borderColor}
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
                    src={avatarUrl}
                    name={displayName}
                    mr={3}
                    flexShrink={0}
                  />

                  {/* Content */}
                  <Box flex="1" minW="0" mr={3}>
                    <Text
                      fontWeight={notification.is_read ? 'normal' : 'bold'}
                      fontSize="md"
                      color={notification.is_read ? readTextColor : unreadTextColor}
                      noOfLines={1}
                      mb={1}
                    >
                      {notification.title}
                    </Text>
                    <Text fontSize="sm" color={subtitleColor} noOfLines={1}>
                      {notification.message}
                    </Text>
                  </Box>

                  {/* Time/Date and Read indicator */}
                  <Box 
                    display="flex" 
                    flexDirection="column" 
                    alignItems="flex-end" 
                    flexShrink={0}
                    gap={1}
                  >
                    <Text 
                      fontSize="xs" 
                      color={subtitleColor}
                      textAlign="right"
                    >
                      {formatTimeAgo(notification.created_at)}
                    </Text>
                    
                    {/* Read indicator */}
                    {!notification.is_read && (
                      <Box
                        w="8px"
                        h="8px"
                        bg="blue.500"
                        borderRadius="full"
                      />
                    )}
                  </Box>
                </Flex>
              </Box>
            </Box>
          );
        })
      )}
    </Box>
  );
};

export default MobileNotifications;