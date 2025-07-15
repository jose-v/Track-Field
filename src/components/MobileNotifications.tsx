import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Flex,
  Spinner,
  useToast,
  useColorModeValue,
  Avatar,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
} from '@chakra-ui/react';
import { FaCheckCircle, FaTimesCircle, FaBell, FaUserPlus, FaTrophy, FaCalendarAlt, FaEnvelopeOpen, FaTrash } from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useQueryClient, QueryClient } from '@tanstack/react-query';

// ... (keep all your existing interfaces and type definitions)

export const MobileNotifications: React.FC<MobileNotificationsProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAsArchived,
  onDelete,
  onMarkAllAsRead,
  isProcessing,
  userProfiles,
  activeFilter,
  setActiveFilter,
  handleAthleteRequest,
  handleCoachRequest,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const swipeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [swipeOffsets, setSwipeOffsets] = useState<{ [key: string]: number }>({});
  const [isSwiping, setIsSwiping] = useState(false);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const sectionHeaderColor = useColorModeValue('gray.500', 'gray.400');
  const sectionHeaderBg = useColorModeValue('gray.50', 'gray.750');

  // ... (keep all your existing helper functions)

  const handleNotificationClick = useCallback((e: React.MouseEvent, notification: Notification) => {
    // Don't trigger click if we're swiping
    if (isSwiping) {
      setIsSwiping(false);
      return;
    }
    
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  }, [onMarkAsRead, isSwiping]);

  const handleSwipeStart = () => {
    setIsSwiping(true);
  };

  const handleSwipeEnd = () => {
    setIsSwiping(false);
  };

  const getSwipeHandlers = (notification: Notification) => {
    return useSwipeable({
      onSwiping: ({ deltaX }) => {
        const element = swipeRefs.current[notification.id];
        if (element) {
          setSwipeOffsets(prev => ({
            ...prev,
            [notification.id]: Math.max(Math.min(deltaX, 120), -120),
          }));
        }
      },
      onSwipedLeft: async ({ absX }) => {
        if (absX > 80) {
          try {
            const element = swipeRefs.current[notification.id];
            if (element) {
              element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
              element.style.transform = 'translateX(-120px)';
              element.style.opacity = '0';
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            await onDelete(notification.id);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast({
              title: 'Deleted',
              status: 'success',
              duration: 2000,
              isClosable: true,
            });
          } catch (error) {
            console.error('Delete error:', error);
            toast({
              title: 'Action failed',
              description: 'Please try again',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            // Reset position if error occurs
            const element = swipeRefs.current[notification.id];
            if (element) {
              element.style.transform = 'translateX(0)';
              element.style.opacity = '1';
            }
          } finally {
            setSwipeOffsets(prev => {
              const newOffsets = { ...prev };
              delete newOffsets[notification.id];
              return newOffsets;
            });
          }
        } else {
          // Reset position if swipe wasn't far enough
          const element = swipeRefs.current[notification.id];
          if (element) {
            element.style.transition = 'transform 0.3s ease';
            element.style.transform = 'translateX(0)';
          }
          setSwipeOffsets(prev => {
            const newOffsets = { ...prev };
            delete newOffsets[notification.id];
            return newOffsets;
          });
        }
      },
      onSwipedRight: async ({ absX }) => {
        if (absX > 80 && !notification.is_read) {
          try {
            const element = swipeRefs.current[notification.id];
            if (element) {
              element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
              element.style.transform = 'translateX(120px)';
              element.style.opacity = '0.5';
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            await onMarkAsRead(notification.id);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast({
              title: 'Marked as read',
              status: 'success',
              duration: 2000,
              isClosable: true,
            });
          } catch (error) {
            console.error('Mark as read error:', error);
            toast({
              title: 'Action failed',
              description: 'Please try again',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            // Reset position if error occurs
            const element = swipeRefs.current[notification.id];
            if (element) {
              element.style.transform = 'translateX(0)';
              element.style.opacity = '1';
            }
          } finally {
            setSwipeOffsets(prev => {
              const newOffsets = { ...prev };
              delete newOffsets[notification.id];
              return newOffsets;
            });
          }
        } else {
          // Reset position if swipe wasn't far enough
          const element = swipeRefs.current[notification.id];
          if (element) {
            element.style.transition = 'transform 0.3s ease';
            element.style.transform = 'translateX(0)';
          }
          setSwipeOffsets(prev => {
            const newOffsets = { ...prev };
            delete newOffsets[notification.id];
            return newOffsets;
          });
        }
      },
      onSwipeStart: handleSwipeStart,
      onSwiped: handleSwipeEnd,
      delta: 10,
      preventScrollOnSwipe: true,
      trackTouch: true,
      trackMouse: false,
    });
  };

  const renderNotificationItem = (notification: Notification, index: number, groupNotifications: Notification[]) => {
    const userProfile = getUserProfileForNotification(notification);
    const swipeOffset = swipeOffsets[notification.id] || 0;
    const swipeHandlers = getSwipeHandlers(notification);

    return (
      <Box key={notification.id} position="relative" w="100%" overflow="hidden">
        {/* Background Action Layers */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={0}
          display="flex"
          justifyContent="space-between"
        >
          {/* Read Action Background - Left Side */}
          <Box
            w="50%"
            bg="blue.600"
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            pl={4}
          >
            <Icon as={FaEnvelopeOpen} boxSize={6} color="white" />
            <Text color="white" ml={2} fontSize="sm" fontWeight="medium">
              Mark as Read
            </Text>
          </Box>

          {/* Delete Action Background - Right Side */}
          <Box
            w="50%"
            bg="red.600"
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            pr={4}
          >
            <Text color="white" mr={2} fontSize="sm" fontWeight="medium">
              Delete
            </Text>
            <Icon as={FaTrash} boxSize={6} color="white" />
          </Box>
        </Box>

        {/* Main Notification Card */}
        <Box
          {...swipeHandlers}
          ref={(el) => (swipeRefs.current[notification.id] = el)}
          data-notification-id={notification.id}
          onClick={(e) => handleNotificationClick(e, notification)}
          cursor="pointer"
          position="relative"
          zIndex={1}
          bg={bgColor}
          transform={`translateX(${swipeOffset}px)`}
          transition={isSwiping ? 'none' : 'transform 0.2s ease-out'}
          sx={{
            userSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {/* ... (rest of your notification item JSX remains the same) */}
        </Box>
      </Box>
    );
  };

  // ... (rest of your component remains the same)
};