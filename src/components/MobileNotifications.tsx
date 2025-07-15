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
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

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

type FilterType = 'unread' | 'read' | 'archived';

interface GroupedNotifications {
  [key: string]: Notification[];
}

interface MobileNotificationsProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAsArchived: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  isProcessing: boolean;
  userProfiles: { [key: string]: any };
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  handleAthleteRequest?: (notificationId: string, athleteId: string, approved: boolean) => Promise<void>;
  handleCoachRequest?: (notificationId: string, coachId: string, accepted: boolean) => Promise<void>;
}

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
  const [swipedNotification, setSwipedNotification] = useState<string | null>(null);
  const [swipeAction, setSwipeAction] = useState<'read' | 'delete' | null>(null);
  const swipeRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const toast = useToast();
  const queryClient = useQueryClient();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const sectionHeaderColor = useColorModeValue('gray.500', 'gray.400');
  const sectionHeaderBg = useColorModeValue('gray.50', 'gray.750');
  const readActionBg = useColorModeValue('blue.50', 'blue.900');
  const deleteActionBg = useColorModeValue('red.50', 'red.900');

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'coach_request':
      case 'coach_invitation':
        return 'blue';
      case 'team_invitation_accepted':
        return 'green';
      case 'team_invitation_declined':
        return 'red';
      case 'achievement':
      case 'badge_earned':
        return 'yellow';
      case 'meet_reminder':
      case 'meet_assigned':
      case 'meet_updated':
      case 'meet_file_added':
        return 'purple';
      case 'workout_assigned':
      case 'workout_updated':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'coach_request':
      case 'coach_invitation':
        return FaUserPlus;
      case 'achievement':
      case 'badge_earned':
        return FaTrophy;
      case 'meet_reminder':
      case 'meet_assigned':
      case 'meet_updated':
      case 'meet_file_added':
        return FaCalendarAlt;
      default:
        return FaBell;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else if (isThisWeek(date)) {
        return format(date, 'EEE');
      } else {
        return format(date, 'MMM d');
      }
    } catch {
      return 'Recently';
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

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      switch (activeFilter) {
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
  };

  const groupNotificationsByDate = (notifications: Notification[]): GroupedNotifications => {
    const groups: GroupedNotifications = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      let groupKey = '';
      
      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else if (isThisWeek(date)) {
        groupKey = format(date, 'EEEE');
      } else {
        groupKey = format(date, 'MMM d');
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });
    
    return groups;
  };

  const getUnreadCount = (filter: FilterType) => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.is_read && !n.is_archived).length;
      case 'read':
        return notifications.filter(n => n.is_read && !n.is_archived).length;
      case 'archived':
        return notifications.filter(n => n.is_archived).length;
      default:
        return 0;
    }
  };

  const handleNotificationClick = useCallback((e: React.MouseEvent, notification: Notification) => {
    const element = swipeRefs.current[notification.id];
    const isSwiping = element?.dataset.isSwiping === 'true';
    
    if (isSwiping) {
      e.preventDefault();
      return;
    }
    
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  }, [onMarkAsRead]);

  const handleTouchStart = useCallback((e: React.TouchEvent, notificationId: string) => {
    const touch = e.touches[0];
    const element = swipeRefs.current[notificationId];
    if (element) {
      element.dataset.startX = touch.clientX.toString();
      element.dataset.startY = touch.clientY.toString();
      element.dataset.startTime = Date.now().toString();
      element.dataset.isSwiping = 'false';
      element.style.transform = 'translateX(0)';
      element.style.transition = '';
      element.style.willChange = 'transform, opacity';
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent, notificationId: string) => {
    requestAnimationFrame(() => {
      const touch = e.touches[0];
      const element = swipeRefs.current[notificationId];
      if (!element || !element.dataset.startX || !element.dataset.startY) return;

      const startX = parseInt(element.dataset.startX);
      const startY = parseInt(element.dataset.startY);
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const threshold = 30;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        e.preventDefault();
        element.dataset.isSwiping = 'true';
        if (element.dataset.transitionApplied !== 'true') {
          element.style.transition = 'transform 0.1s ease-out';
          element.dataset.transitionApplied = 'true';
        }

        if (deltaX > threshold) {
          setSwipedNotification(notificationId);
          setSwipeAction('read');
          element.style.transform = `translateX(${Math.min(deltaX, 120)}px)`;
          element.style.opacity = '0.9';
        } else if (deltaX < -threshold) {
          setSwipedNotification(notificationId);
          setSwipeAction('delete');
          element.style.transform = `translateX(${Math.max(deltaX, -120)}px)`;
          element.style.opacity = '0.9';
        } else {
          element.style.transform = `translateX(${deltaX}px)`;
          element.style.opacity = '1';
          setSwipedNotification(null);
          setSwipeAction(null);
        }
      } else {
        element.style.transform = 'translateX(0)';
        element.style.opacity = '1';
        element.dataset.transitionApplied = 'false';
        setSwipedNotification(null);
        setSwipeAction(null);
      }
    });
  }, []);

  const handleTouchEnd = useCallback(async (e: React.TouchEvent, notification: Notification) => {
    const element = swipeRefs.current[notification.id];
    if (!element) return;

    const isSwiping = element.dataset.isSwiping === 'true';
    const hasAction = swipedNotification === notification.id && swipeAction;

    if (isSwiping && hasAction) {
      e.stopPropagation();
      element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

      try {
        if (swipeAction === 'read' && !notification.is_read) {
          element.style.transform = 'translateX(100%)';
          element.style.opacity = '0.3';
          await onMarkAsRead(notification.id);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          toast({
            title: 'Marked as read',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        } else if (swipeAction === 'delete') {
          element.style.transform = 'translateX(-100%)';
          element.style.opacity = '0';
          const timeoutId = setTimeout(async () => {
            try {
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
              element.style.transform = 'translateX(0)';
              element.style.opacity = '1';
              toast({
                title: 'Action failed',
                description: 'Please try again',
                status: 'error',
                duration: 3000,
                isClosable: true,
              });
            }
          }, 300);
          return () => clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Swipe action error:', error);
        element.style.transform = 'translateX(0)';
        element.style.opacity = '1';
        toast({
          title: 'Action failed',
          description: 'Please try again',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } else {
      element.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
    }

    setSwipedNotification(null);
    setSwipeAction(null);
    element.dataset.isSwiping = 'false';
    element.dataset.transitionApplied = 'false';
    element.style.willChange = 'auto';

    setTimeout(() => {
      if (element) {
        element.style.transition = '';
      }
    }, 350);
  }, [onMarkAsRead, onDelete, queryClient, toast, swipeAction, swipedNotification]);

  const renderNotificationItem = (notification: Notification, index: number, groupNotifications: Notification[]) => {
    const userProfile = getUserProfileForNotification(notification);
    
    return (
      <Box key={notification.id} position="relative" w="100%">
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
            bg="blue.500"
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
            bg="red.500"
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
          ref={(el) => (swipeRefs.current[notification.id] = el)}
          onTouchStart={(e) => handleTouchStart(e, notification.id)}
          onTouchMove={(e) => handleTouchMove(e, notification.id)}
          onTouchEnd={(e) => handleTouchEnd(e, notification)}
          onClick={(e) => handleNotificationClick(e, notification)}
          cursor="pointer"
          position="relative"
          zIndex={1}
          bg={bgColor}
          transform="translateX(0)"
          willChange="transform, opacity"
          sx={{
            touchAction: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          <Flex
            align="center"
            px={4}
            py={3}
            minH="80px"
            borderBottom={index < groupNotifications.length - 1 ? "1px" : "none"}
            borderColor={borderColor}
          >
            {/* Avatar - Left Side */}
            <Box flexShrink={0} mr={3} position="relative">
              {userProfile ? (
                <Avatar
                  size="md"
                  name={`${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()}
                  src={userProfile.avatar_url}
                />
              ) : (
                <Box
                  p={2}
                  borderRadius="50%"
                  bg={`${getNotificationColor(notification.type)}.100`}
                  color={`${getNotificationColor(notification.type)}.600`}
                  w={12}
                  h={12}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon 
                    as={getNotificationIcon(notification.type)} 
                    boxSize={5}
                  />
                </Box>
              )}
              {!notification.is_read && !notification.is_archived && (
                <Box
                  position="absolute"
                  top="0"
                  right="0"
                  w={3}
                  h={3}
                  bg="blue.500"
                  borderRadius="full"
                  border="2px"
                  borderColor="transparent"
                />
              )}
            </Box>

            {/* Main Content - Center */}
            <Box flex={1} minW={0} mr={3}>
              <Text
                fontSize="md"
                fontWeight={notification.is_read ? 'normal' : 'bold'}
                color={notification.is_archived ? subtitleColor : textColor}
                noOfLines={1}
                mb={1}
              >
                {notification.title}
              </Text>
              <Text
                fontSize="sm"
                color={subtitleColor}
                noOfLines={2}
              >
                {notification.message}
              </Text>
              
              {/* Action Buttons for special notifications */}
              {((notification.type === 'coach_request' || notification.type === 'coach_invitation') && !notification.is_read) && (
                <HStack spacing={2} mt={2}>
                  {notification.type === 'coach_request' && (
                    <>
                      <Button
                        size="xs"
                        colorScheme="green"
                        variant="solid"
                        leftIcon={<FaCheckCircle />}
                        isLoading={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAthleteRequest?.(notification.id, notification.metadata.athlete_id, true);
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<FaTimesCircle />}
                        isLoading={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAthleteRequest?.(notification.id, notification.metadata.athlete_id, false);
                        }}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {notification.type === 'coach_invitation' && (
                    <>
                      <Button
                        size="xs"
                        colorScheme="green"
                        variant="solid"
                        leftIcon={<FaCheckCircle />}
                        isLoading={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCoachRequest?.(notification.id, notification.metadata.coach_id, true);
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<FaTimesCircle />}
                        isLoading={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCoachRequest?.(notification.id, notification.metadata.coach_id, false);
                        }}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                </HStack>
              )}
            </Box>

            {/* Date/Time - Right Side */}
            <Box flexShrink={0} textAlign="right">
              <Text fontSize="xs" color={subtitleColor}>
                {formatTimeAgo(notification.created_at)}
              </Text>
            </Box>
          </Flex>
        </Box>
      </Box>
    );
  };

  const filteredNotifications = getFilteredNotifications();
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  return (
    <Box w="100%" sx={{ touchAction: 'pan-y' }}>
      <Tabs 
        variant="line" 
        size="md" 
        colorScheme="blue" 
        onChange={(index) => {
          const filters: FilterType[] = ['unread', 'read', 'archived'];
          setActiveFilter(filters[index]);
        }}
      >
        <TabList 
          borderBottom="1px" 
          borderColor={borderColor} 
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Tab 
            fontSize="sm" 
            fontWeight="medium"
            color={subtitleColor}
            flex={1}
            justifyContent="center"
            _selected={{ 
              color: textColor,
              borderColor: "blue.500"
            }}
            _hover={{
              color: textColor
            }}
          >
            Unread
            {getUnreadCount('unread') > 0 && (
              <Badge ml={2} colorScheme="blue" variant="solid" fontSize="xs">
                {getUnreadCount('unread')}
              </Badge>
            )}
          </Tab>
          <Tab 
            fontSize="sm" 
            fontWeight="medium"
            color={subtitleColor}
            flex={1}
            justifyContent="center"
            _selected={{ 
              color: textColor,
              borderColor: "blue.500"
            }}
            _hover={{
              color: textColor
            }}
          >
            Read
          </Tab>
          <Tab 
            fontSize="sm" 
            fontWeight="medium"
            color={subtitleColor}
            flex={1}
            justifyContent="center"
            _selected={{ 
              color: textColor,
              borderColor: "blue.500"
            }}
            _hover={{
              color: textColor
            }}
          >
            Archived
          </Tab>
        </TabList>

        <TabPanels>
          {[0, 1, 2].map((tabIndex) => (
            <TabPanel key={tabIndex} px={0} py={0}>
              {filteredNotifications.length === 0 ? (
                <Box textAlign="center" py={12} px={4}>
                  <Icon as={FaBell} boxSize={16} color="gray.400" mb={4} />
                  <Text color={subtitleColor} fontSize="lg" mb={2}>
                    No {activeFilter} notifications
                  </Text>
                  <Text color={subtitleColor} fontSize="sm">
                    {activeFilter === 'unread' 
                      ? "We'll notify you when something important happens"
                      : `No ${activeFilter} notifications to show`
                    }
                  </Text>
                </Box>
              ) : (
                <VStack spacing={0} align="stretch">
                  {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
                    <Box key={dateGroup}>
                      <Flex 
                        justify="space-between" 
                        align="center" 
                        px={4} 
                        py={3} 
                        borderBottom="1px" 
                        borderColor={borderColor}
                        position="sticky"
                        top="49px"
                        zIndex={5}
                      >
                        <Text fontSize="sm" fontWeight="semibold" color={sectionHeaderColor}>
                          {dateGroup}
                          <Badge ml={2} variant="outline" colorScheme="gray" fontSize="xs">
                            {groupNotifications.length}
                          </Badge>
                        </Text>
                      </Flex>
                      
                      {groupNotifications.map((notification, index) => 
                        renderNotificationItem(notification, index, groupNotifications)
                      )}
                    </Box>
                  ))}
                </VStack>
              )}

              {filteredNotifications.length > 0 && activeFilter === 'unread' && (
                <Box px={4} py={4} borderTop="1px" borderColor={borderColor}>
                  <Button
                    variant="ghost"
                    size="sm"
                    width="full"
                    leftIcon={<Icon as={FaCheckCircle} />}
                    onClick={onMarkAllAsRead}
                    color={subtitleColor}
                    _hover={{ color: textColor }}
                  >
                    Mark all notifications as read
                  </Button>
                </Box>
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};