import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex, Avatar, Text, useToast, useColorModeValue, Button } from '@chakra-ui/react';
import { FaTrash, FaEnvelopeOpen, FaArchive } from 'react-icons/fa';
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
  const [debugInfo, setDebugInfo] = useState<string>('Mobile notifications loaded');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [activeTab, setActiveTab] = useState<'unread' | 'read' | 'archived'>('unread');
  const [isBouncing, setIsBouncing] = useState(false);
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

  // Prevent browser pull-to-refresh globally while this component is mounted
  useEffect(() => {
    // Set document styles to prevent native pull-to-refresh
    const originalOverscrollBehavior = document.documentElement.style.overscrollBehavior;
    const originalTouchAction = document.body.style.touchAction;
    
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.touchAction = 'pan-x pan-y';
    
    // Add passive: false event listener to body for better control
    const preventPullToRefresh = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.touches.length === 1) {
        // Only block downward pull at top, on unread tab, and not during horizontal swipe
        const touch = e.touches[0];
        // Use a data attribute to track if a horizontal swipe is active
        if (document.body.getAttribute('data-swipe-active') !== 'true') {
          if (typeof startY === 'number' && startY > 0 && touch.clientY - startY > 0 && activeTab === 'unread') {
            e.preventDefault();
          }
        }
      }
    };
    
    document.body.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    
    // Failsafe: always restore scroll styles
    const resetScrollStyles = () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
    document.addEventListener('touchend', resetScrollStyles, { passive: true });
    return () => {
      document.documentElement.style.overscrollBehavior = originalOverscrollBehavior;
      document.body.style.touchAction = originalTouchAction;
      document.body.removeEventListener('touchmove', preventPullToRefresh);
      document.removeEventListener('touchend', resetScrollStyles);
      // Failsafe: always restore scroll styles
      resetScrollStyles();
    };
  }, []);



  // Real-time notifications subscription (temporarily disabled for testing)
  // useEffect(() => {
  //   if (!user?.id) return;

  //   setDebugInfo('Setting up real-time subscription...');
    
  //   const channel = supabase
  //     .channel('notifications-channel')
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: 'INSERT',
  //         schema: 'public',
  //         table: 'notifications',
  //         filter: `user_id=eq.${user.id}`,
  //       },
  //       (payload) => {
  //         setDebugInfo(`New notification received: ${payload.new.title}`);
          
  //         // Add the new notification to the top of the list
  //         setNotifications(prev => [payload.new as Notification, ...prev]);
          
  //         // Fetch user profile for the new notification if needed
  //         const newNotification = payload.new as Notification;
  //         if (newNotification.metadata) {
  //           const userIds = new Set<string>();
            
  //           if (newNotification.metadata.coach_id) {
  //             userIds.add(newNotification.metadata.coach_id);
  //           }
  //           if (newNotification.metadata.athlete_id) {
  //             userIds.add(newNotification.metadata.athlete_id);
  //           }
  //           if (newNotification.metadata.sender_id) {
  //             userIds.add(newNotification.metadata.sender_id);
  //           }

  //           // Fetch missing user profiles
  //           if (userIds.size > 0) {
  //             const missingUserIds = Array.from(userIds).filter(
  //               id => !userProfiles[id]
  //             );
              
  //             if (missingUserIds.length > 0) {
  //               supabase
  //                 .from('profiles')
  //                 .select('id, first_name, last_name, avatar_url')
  //                 .in('id', missingUserIds)
  //                 .then(({ data: profiles }) => {
  //                   if (profiles) {
  //                     const newProfilesMap = profiles.reduce((acc, profile) => {
  //                       acc[profile.id] = profile;
  //                       return acc;
  //                     }, {} as { [key: string]: any });
                      
  //                     setUserProfiles(prev => ({ ...prev, ...newProfilesMap }));
  //                   }
  //                 });
  //             }
  //           }
  //         }
  //       }
  //     )
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: 'UPDATE',
  //         schema: 'public',
  //         table: 'notifications',
  //         filter: `user_id=eq.${user.id}`,
  //       },
  //       (payload) => {
  //         setDebugInfo(`Notification updated: ${payload.new.id}`);
          
  //         // Update the notification in the list
  //         setNotifications(prev =>
  //           prev.map(notification =>
  //             notification.id === payload.new.id
  //               ? { ...notification, ...payload.new }
  //               : notification
  //           )
  //         );
  //       }
  //     )
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: 'DELETE',
  //         schema: 'public',
  //         table: 'notifications',
  //         filter: `user_id=eq.${user.id}`,
  //       },
  //       (payload) => {
  //         setDebugInfo(`Notification deleted: ${payload.old.id}`);
          
  //         // Remove the notification from the list
  //         setNotifications(prev =>
  //           prev.filter(notification => notification.id !== payload.old.id)
  //         );
  //       }
  //     )
  //     .subscribe((status) => {
  //       setDebugInfo(`Subscription status: ${status}`);
  //     });

  //   return () => {
  //     setDebugInfo('Cleaning up subscription...');
  //     supabase.removeChannel(channel);
  //   };
  // }, [user?.id, userProfiles]);

  // Disabled lazy loading for now - we fetch all notifications at once
  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (
  //       window.innerHeight + document.documentElement.scrollTop
  //       >= document.documentElement.offsetHeight - 1000 // Load more when 1000px from bottom
  //     ) {
  //       loadMoreNotifications();
  //     }
  //   };

  //   window.addEventListener('scroll', handleScroll);
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, [loadingMore, hasMore, page]);

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

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.is_read && !notification.is_archived;
      case 'read':
        return notification.is_read && !notification.is_archived;
      case 'archived':
        return notification.is_archived;
      default:
        return true;
    }
  });

  // Get counts for each tab
  const unreadCount = notifications.filter(n => !n.is_read && !n.is_archived).length;
  const readCount = notifications.filter(n => n.is_read && !n.is_archived).length;
  const archivedCount = notifications.filter(n => n.is_archived).length;

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      // CRITICAL FIX: Refresh authentication before queries
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        return;
      }
      
      // Fetch ALL notifications like desktop to ensure we get everything
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const newNotifications = data || [];
      setNotifications(newNotifications);
      
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
    }
  };

  const refreshNotifications = async () => {
    try {
      setIsRefreshing(true);
      setIsBouncing(true);
      
      // Fetch all fresh data
      await fetchNotifications();
      
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      
      // Trigger bounce animation
      setTimeout(() => {
        setIsBouncing(false);
      }, 300);
    }
  };

  const handlePullStart = (e: React.TouchEvent) => {
    try {
      // Only allow pull-to-refresh when at the very top AND on the unread tab
      let scrollY = 0;
      try {
        scrollY = window.scrollY || 0;
      } catch (error) {
        console.warn('Error accessing scrollY:', error);
        return;
      }
      
      if (scrollY === 0 && activeTab === 'unread') {
        setStartY(e.touches[0].clientY);
      }
    } catch (error) {
      console.warn('Error in handlePullStart:', error);
    }
  };

  const handlePullMove = (e: React.TouchEvent) => {
    try {
      // Always prevent default behavior when at top to stop browser pull-to-refresh
      let scrollY = 0;
      try {
        scrollY = window.scrollY || 0;
      } catch (error) {
        console.warn('Error accessing scrollY:', error);
        return;
      }
      
      if (scrollY === 0) {
        const currentY = e.touches[0].clientY;
        const distance = startY > 0 ? currentY - startY : 0;
        
        // Prevent browser pull-to-refresh for any downward movement at top
        if (distance > 0) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        // Only show our custom pull-to-refresh on unread tab
        if (startY > 0 && activeTab === 'unread') {
          // Only trigger if it's a significant, deliberate downward pull
          if (distance > 20) { // Minimum 20px before any visual feedback
            setPullDistance(Math.min(distance, 300)); // Increased max pull distance
          }
        }
      }
    } catch (error) {
      console.warn('Error in handlePullMove:', error);
    }
  };

  const handlePullEnd = () => {
    // Require much more deliberate pull (100px instead of 50px) and not refreshing
    if (pullDistance > 100 && !isRefreshing && activeTab === 'unread') {
      refreshNotifications();
    } else {
      setPullDistance(0);
      // Small bounce back even when not refreshing
      if (pullDistance > 20) {
        setIsBouncing(true);
        setTimeout(() => {
          setIsBouncing(false);
        }, 200);
      }
    }
    setStartY(0);
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

      toast({
        title: 'Notification deleted',
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

      toast({
        title: 'Marked as read',
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

  const archiveNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_archived: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_archived: true } 
            : notification
        )
      );

      toast({
        title: 'Archived',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error archiving notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive notification',
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
        // Use relative format for consistency: "8 days ago", "2 weeks ago"
        return formatDistanceToNow(date, { addSuffix: true });
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
    try {
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
      }
      if (state.isDragging || (isHorizontalGesture && !state.isDragging)) {
        // Block scroll only during active swipe
        try {
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
          document.body.setAttribute('data-swipe-active', 'true');
        } catch (error) {
          console.warn('Error setting overflow styles:', error);
        }
        // Continue horizontal swiping - update visuals directly without React re-render
        updateSwipeVisuals(notificationId, deltaX);
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
      } else {
        // Not horizontal, allow normal scroll, remove swipe-active
        try {
          document.body.removeAttribute('data-swipe-active');
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        } catch (error) {
          console.warn('Error resetting overflow styles:', error);
        }
      }
    } catch (error) {
      console.warn('Error in handleTouchMove:', error);
    }
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
    // Always restore scrolling immediately after touch ends (now handled globally)
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.removeAttribute('data-swipe-active');
    if (!state) return;

    // Only process swipe actions if we were actually in dragging mode
    if (state.isDragging) {
      const deltaX = state.currentX - state.startX;
      const distance = Math.abs(deltaX);

      // Trigger actions if swipe was far enough
      if (distance > 120) {
        if (deltaX < 0) {
          // Swiped left - delete
          deleteNotification(notificationId);
        } else if (deltaX > 0) {
          // Swiped right - mark as read OR archive
          if (!notification.is_read) {
            markAsRead(notificationId);
            setTimeout(() => resetSwipeVisuals(notificationId), 100);
          } else if (!notification.is_archived) {
            archiveNotification(notificationId);
            setTimeout(() => resetSwipeVisuals(notificationId), 100);
          } else {
            resetSwipeVisuals(notificationId);
          }
        } else {
          resetSwipeVisuals(notificationId);
        }
      } else {
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
    <Box 
      w="100%" 
      minH="100vh"
      onTouchStart={handlePullStart}
      onTouchMove={handlePullMove}
      onTouchEnd={handlePullEnd}
      sx={{
        // Prevent native browser pull-to-refresh only for Y, allow scroll chaining
        overscrollBehaviorY: 'contain',
        touchAction: 'pan-y pinch-zoom',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Pull to Refresh Indicator - Only on Unread tab */}
      {pullDistance > 20 && activeTab === 'unread' && (
        <Box
          position="fixed"
          top={`${Math.max(90, pullDistance - 50)}px`}
          left="50%"
          transform="translateX(-50%)"
          zIndex={999}
          bg="gray.700"
          borderRadius="full"
          px={6}
          py={3}
          boxShadow="lg"
          transition="top 0.1s ease-out"
          width="75%"
          maxWidth="300px"
        >
          <Flex align="center" justify="center" gap={3}>
            <Box
              w="20px"
              h="20px"
              borderRadius="full"
              border="2px solid"
              borderColor={pullDistance > 100 ? "blue.400" : "gray.400"}
              borderTopColor="transparent"
              animation={isRefreshing ? "spin 1s linear infinite" : "none"}
              sx={{
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" }
                }
              }}
            />
            <Text fontSize="sm" color="white" fontWeight="medium">
              {pullDistance > 100 ? "Release to refresh" : "Pull down"}
            </Text>
          </Flex>
        </Box>
      )}

      <Box
        transform={
          pullDistance > 20 
            ? `translateY(${Math.min(pullDistance * 0.8, 200)}px)` 
            : isBouncing 
              ? 'translateY(-10px)' 
              : 'translateY(0px)'
        }
        transition={
          pullDistance > 20 
            ? 'transform 0.1s ease-out' 
            : isBouncing 
              ? 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)' 
              : 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }
      >
        
        {/* Notification Tabs */}
        <Box borderBottom="1px solid" borderColor={borderColor} position="sticky" top="0" zIndex={100}>
          <Flex>
            {/* Unread Tab */}
            <Box
              flex="1"
              py={3}
              px={4}
              textAlign="center"
              borderBottom="3px solid"
              borderColor={activeTab === 'unread' ? 'blue.500' : 'transparent'}
              bg="transparent"
              cursor="pointer"
              onClick={() => setActiveTab('unread')}
            >
              <Text
                fontWeight={activeTab === 'unread' ? 'bold' : 'normal'}
                color={activeTab === 'unread' ? 'blue.500' : textColor}
                fontSize="sm"
              >
                Unread {unreadCount > 0 && (
                  <Box as="span" ml={1} px={2} py={0.5} bg="blue.500" color="white" borderRadius="full" fontSize="xs">
                    {unreadCount}
                  </Box>
                )}
              </Text>
            </Box>

            {/* Read Tab */}
            <Box
              flex="1"
              py={3}
              px={4}
              textAlign="center"
              borderBottom="3px solid"
              borderColor={activeTab === 'read' ? 'blue.500' : 'transparent'}
              bg="transparent"
              cursor="pointer"
              onClick={() => setActiveTab('read')}
            >
              <Text
                fontWeight={activeTab === 'read' ? 'bold' : 'normal'}
                color={activeTab === 'read' ? 'blue.500' : textColor}
                fontSize="sm"
              >
                Read
              </Text>
            </Box>

            {/* Archived Tab */}
            <Box
              flex="1"
              py={3}
              px={4}
              textAlign="center"
              borderBottom="3px solid"
              borderColor={activeTab === 'archived' ? 'blue.500' : 'transparent'}
              bg="transparent"
              cursor="pointer"
              onClick={() => setActiveTab('archived')}
            >
              <Text
                fontWeight={activeTab === 'archived' ? 'bold' : 'normal'}
                color={activeTab === 'archived' ? 'blue.500' : textColor}
                fontSize="sm"
              >
                Archived
              </Text>
            </Box>
          </Flex>
        </Box>
      

      
      {filteredNotifications.length === 0 ? (
        <Box p={8} textAlign="center">
          <Text color={emptyTextColor}>
            {activeTab === 'unread' ? 'No unread notifications' : 
             activeTab === 'read' ? 'No read notifications' : 
             'No archived notifications'}
          </Text>
        </Box>
      ) : (
        filteredNotifications.map((notification, index) => {
          try {
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
                top="6px"
                right="16px"
                bottom="6px"
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

              {/* Mark as Read/Archive Background (Right) */}
              <Box
                ref={(el) => {
                  if (!swipeRefs.current[notification.id]) {
                    swipeRefs.current[notification.id] = { element: null, deleteBackground: null, readBackground: null };
                  }
                  swipeRefs.current[notification.id].readBackground = el;
                }}
                position="absolute"
                top="6px"
                left="16px"
                bottom="6px"
                w="120px"
                bg={notification.is_read ? "purple.400" : "blue.400"}
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
                  {notification.is_read ? <FaArchive /> : <FaEnvelopeOpen />}
                </Box>
                <Text color="white" fontWeight="bold" fontSize="sm">
                  {notification.is_read ? "Archive" : "Read"}
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
                mt="2px"
                mb="2px"
                mx={2}
                borderRadius="lg"
                position="relative"
                zIndex={2}
                transform="translateX(0px)"
                transition="transform 0.3s ease-out"
                onTouchStart={!notification.is_archived ? (e) => handleTouchStart(e, notification.id) : undefined}
                onTouchMove={!notification.is_archived ? (e) => handleTouchMove(e, notification.id) : undefined}
                onTouchEnd={!notification.is_archived ? (e) => handleTouchEnd(e, notification.id, notification) : undefined}
                sx={{
                  touchAction: swipeStates[notification.id]?.isDragging ? 'none' : 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  opacity: notification.is_archived ? 0.7 : 1,
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
          } catch (error) {
            console.error(`❌ Error rendering notification ${index}:`, error);
            return (
              <Box key={notification.id} p={4} bg="red.100" color="red.800">
                <Text>Error rendering notification: {notification.title}</Text>
              </Box>
            );
          }
        })
      )}
      
      {/* Tab-specific footer */}
      {filteredNotifications.length > 0 && (
        <Box p={4} textAlign="center">
          <Text color={emptyTextColor} fontSize="sm">
            {filteredNotifications.length} {activeTab} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </Text>
        </Box>
      )}
       </Box>
    </Box>
  );
};

export default MobileNotifications;