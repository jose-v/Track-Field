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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({});
  const [debugInfo, setDebugInfo] = useState<string>('Ready to swipe');
  const [swipeStates, setSwipeStates] = useState<{[key: string]: { 
    isDragging: boolean; 
    startX: number; 
    startY: number;
    currentX: number; 
    direction: 'left' | 'right' | null 
  }}>({});
  const swipeRefs = useRef<{[key: string]: {
    element: HTMLElement | null;
    deleteBackground: HTMLElement | null;
    readBackground: HTMLElement | null;
  }}>({});
  const toast = useToast();
  const ITEMS_PER_PAGE = 20;

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

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 // Load more when 1000px from bottom
      ) {
        loadMoreNotifications();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, page]);

  // Clean up refs when notifications change
  useEffect(() => {
    const currentNotificationIds = new Set(notifications.map(n => n.id));
    const refKeys = Object.keys(swipeRefs.current);
    
    refKeys.forEach(refId => {
      if (!currentNotificationIds.has(refId)) {
        delete swipeRefs.current[refId];
      }
    });
  }, [notifications]);

  const fetchNotifications = async (pageNum = 0, append = false) => {
    try {
      if (!append) setIsLoading(true);
      else setLoadingMore(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      
      const newNotifications = data || [];
      
      if (append) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }

      // Check if we have more data
      setHasMore(newNotifications.length === ITEMS_PER_PAGE);
      
      // Extract user IDs from notification metadata to fetch avatars
      if (newNotifications.length > 0) {
        const userIds = new Set<string>();
        
        newNotifications.forEach(notification => {
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
            
            setUserProfiles(prev => ({ ...prev, ...profilesMap }));
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
      setLoadingMore(false);
    }
  };

  const loadMoreNotifications = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, true);
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

      // Clean up refs for deleted notification
      delete swipeRefs.current[notificationId];

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
        isDragging: false, // Start as false, only enable after we detect horizontal intent
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        direction: null
      }
    }));
    setDebugInfo(`Touch started on ${notificationId}`);
  };

  const updateSwipeVisuals = (notificationId: string, deltaX: number) => {
    const refs = swipeRefs.current[notificationId];
    if (!refs) return;

    requestAnimationFrame(() => {
      // Update main element transform
      if (refs.element) {
        const maxSwipe = 400;
        const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
        refs.element.style.transform = `translateX(${clampedDelta}px)`;
        refs.element.style.transition = 'none';
      }

      // Update background opacities and widths
      const distance = Math.abs(deltaX);
      const opacity = Math.min(distance / 80, 1);
      const width = Math.max(120, distance + 50);

      if (deltaX < 0 && refs.deleteBackground) {
        // Swiping left - show delete background
        refs.deleteBackground.style.opacity = opacity.toString();
        refs.deleteBackground.style.width = `${width}px`;
        if (refs.readBackground) {
          refs.readBackground.style.opacity = '0';
        }
      } else if (deltaX > 0 && refs.readBackground) {
        // Swiping right - show read background
        refs.readBackground.style.opacity = opacity.toString();
        refs.readBackground.style.width = `${width}px`;
        if (refs.deleteBackground) {
          refs.deleteBackground.style.opacity = '0';
        }
      }
    });
  };

  const handleTouchMove = (e: React.TouchEvent, notificationId: string) => {
    const state = swipeStates[notificationId];
    if (!state) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;
    
    // Only start horizontal swiping if the gesture is more horizontal than vertical
    const isHorizontalGesture = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10;
    
    if (isHorizontalGesture && !state.isDragging) {
      // Start horizontal swiping mode
      setSwipeStates(prev => ({
        ...prev,
        [notificationId]: {
          ...state,
          isDragging: true,
          currentX: touch.clientX,
          direction: deltaX > 0 ? 'right' : 'left'
        }
      }));
      // Prevent all scrolling when we're in horizontal swipe mode
      e.preventDefault();
      e.stopPropagation();
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else if (state.isDragging) {
      // Continue horizontal swiping - update visuals directly without React re-render
      updateSwipeVisuals(notificationId, deltaX);
      
      // Update current position for end calculation
      setSwipeStates(prev => ({
        ...prev,
        [notificationId]: {
          ...prev[notificationId],
          currentX: touch.clientX,
          direction: deltaX > 0 ? 'right' : 'left'
        }
      }));
      
      e.preventDefault();
      e.stopPropagation();
    }
    // If not horizontal gesture and not already dragging, allow normal vertical scrolling
  };

  const resetSwipeVisuals = (notificationId: string) => {
    const refs = swipeRefs.current[notificationId];
    if (!refs) return;

    requestAnimationFrame(() => {
      if (refs.element) {
        refs.element.style.transform = 'translateX(0px)';
        refs.element.style.transition = 'transform 0.3s ease-out';
      }
      if (refs.deleteBackground) {
        refs.deleteBackground.style.opacity = '0';
        refs.deleteBackground.style.width = '120px';
      }
      if (refs.readBackground) {
        refs.readBackground.style.opacity = '0';
        refs.readBackground.style.width = '120px';
      }
    });
  };

  const handleTouchEnd = (e: React.TouchEvent, notificationId: string, notification: Notification) => {
    const state = swipeStates[notificationId];
    if (!state) return;

    // Always restore scrolling first
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    // Only process swipe actions if we were actually in dragging mode
    if (state.isDragging) {
      const deltaX = state.currentX - state.startX;
      const distance = Math.abs(deltaX);

      setDebugInfo(`Swipe ended: ${Math.round(distance)}px (need 120px)`);

      // Trigger actions if swipe was far enough
      if (distance > 120) {
        if (deltaX < 0) {
          // Swiped left - delete
          deleteNotification(notificationId);
        } else if (deltaX > 0 && !notification.is_read) {
          // Swiped right - mark as read (only if unread)
          markAsRead(notificationId);
        } else {
          setDebugInfo(`Swipe right ignored - already read`);
          resetSwipeVisuals(notificationId);
        }
      } else {
        setDebugInfo(`Swipe canceled - not far enough (${Math.round(distance)}px, need 120px)`);
        resetSwipeVisuals(notificationId);
      }
    }

    // Reset drag state
    setSwipeStates(prev => {
      const newStates = { ...prev };
      delete newStates[notificationId];
      return newStates;
    });
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
      {/* Temporary Debug Overlay */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bg="yellow.100"
        p={2}
        borderBottom="2px solid"
        borderColor="yellow.300"
        zIndex={1000}
      >
        <Text fontSize="xs" fontWeight="bold" color="black">
          DEBUG: {debugInfo}
        </Text>
      </Box>
      
      <Box pt="50px">
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
            <Box 
              key={notification.id} 
              position="relative" 
              w="100%" 
              overflow="hidden" 
              px={2} 
              py={1}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                const state = swipeStates[notification.id];
                if (state?.isDragging) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              {/* Delete Background (Left) */}
              <Box
                ref={(el) => {
                  if (!swipeRefs.current[notification.id]) {
                    swipeRefs.current[notification.id] = { element: null, deleteBackground: null, readBackground: null };
                  }
                  swipeRefs.current[notification.id].deleteBackground = el;
                }}
                position="absolute"
                top="3px"
                right="8px"
                h="calc(100% - 6px)"
                w="120px"
                bg="red.500"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                opacity={0}
                transition="opacity 0.1s ease-out"
                zIndex={1}
                borderRadius="lg"
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
                ref={(el) => {
                  if (!swipeRefs.current[notification.id]) {
                    swipeRefs.current[notification.id] = { element: null, deleteBackground: null, readBackground: null };
                  }
                  swipeRefs.current[notification.id].readBackground = el;
                }}
                position="absolute"
                top="3px"
                left="8px"
                h="calc(100% - 6px)"
                w="120px"
                bg="blue.400"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                opacity={0}
                transition="opacity 0.1s ease-out"
                zIndex={1}
                borderRadius="lg"
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
                ref={(el) => {
                  if (!swipeRefs.current[notification.id]) {
                    swipeRefs.current[notification.id] = { element: null, deleteBackground: null, readBackground: null };
                  }
                  swipeRefs.current[notification.id].element = el;
                }}
                bg={bgColor}
                mt="2px"
                mb="2px"
                mx={2}
                borderRadius="lg"
                position="relative"
                zIndex={2}
                transform="translateX(0px)"
                transition="transform 0.3s ease-out"
                onTouchStart={(e) => handleTouchStart(e, notification.id)}
                onTouchMove={(e) => handleTouchMove(e, notification.id)}
                onTouchEnd={(e) => handleTouchEnd(e, notification.id, notification)}
                onClick={() => setDebugInfo(`Clicked notification ${notification.id}`)}
                sx={{
                  touchAction: 'manipulation',
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
      
      {/* Loading More Indicator */}
      {loadingMore && (
        <Box p={4} textAlign="center" bg={bgColor}>
          <Text color={textColor}>Loading more notifications...</Text>
        </Box>
      )}
      
             {/* End of List */}
       {!hasMore && notifications.length > 0 && (
         <Box p={4} textAlign="center" bg={bgColor}>
           <Text color={emptyTextColor} fontSize="sm">No more notifications</Text>
         </Box>
       )}
       </Box>
    </Box>
  );
};

export default MobileNotifications;