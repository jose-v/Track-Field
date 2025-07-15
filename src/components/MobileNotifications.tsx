import React, { useState, useEffect, useRef } from 'react';
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

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent, notificationId: string) => {
    const touch = e.touches[0];
    const element = swipeRefs.current[notificationId];
    if (element) {
      element.dataset.startX = touch.clientX.toString();
      element.dataset.startTime = Date.now().toString();
    }
  };

  const handleTouchMove = (e: React.TouchEvent, notificationId: string) => {
    const touch = e.touches[0];
    const element = swipeRefs.current[notificationId];
    if (element && element.dataset.startX) {
      const deltaX = touch.clientX - parseInt(element.dataset.startX);
      const threshold = 80;
      
      if (Math.abs(deltaX) > 10) {
        e.preventDefault(); // Prevent scrolling when swiping horizontally
        
        if (deltaX > threshold) {
          // Swipe right - mark as read
          setSwipedNotification(notificationId);
          setSwipeAction('read');
          element.style.transform = `translateX(${Math.min(deltaX, 150)}px)`;
        } else if (deltaX < -threshold) {
          // Swipe left - delete
          setSwipedNotification(notificationId);
          setSwipeAction('delete');
          element.style.transform = `translateX(${Math.max(deltaX, -150)}px)`;
        } else {
          // Reset
          setSwipedNotification(null);
          setSwipeAction(null);
          element.style.transform = 'translateX(0)';
        }
      }
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent, notification: Notification) => {
    const element = swipeRefs.current[notification.id];
    if (element && element.dataset.startX && element.dataset.startTime) {
      const deltaTime = Date.now() - parseInt(element.dataset.startTime);
      
      if (swipedNotification === notification.id && deltaTime > 100) {
        // Execute swipe action
        if (swipeAction === 'read' && !notification.is_read) {
          await onMarkAsRead(notification.id);
          toast({
            title: 'Marked as read',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        } else if (swipeAction === 'delete') {
          await onDelete(notification.id);
          toast({
            title: 'Deleted',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        }
      }
      
      // Reset
      setSwipedNotification(null);
      setSwipeAction(null);
      element.style.transform = 'translateX(0)';
      element.style.transition = 'transform 0.2s ease';
      
      setTimeout(() => {
        element.style.transition = '';
      }, 200);
    }
  };

  const renderNotificationItem = (notification: Notification, index: number, groupNotifications: Notification[]) => {
    const userProfile = getUserProfileForNotification(notification);
    
    return (
      <Box key={notification.id} position="relative" overflow="hidden">
        {/* Background Action Layers */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={8}
          zIndex={0}
        >
          {/* Read Action (Left Side) */}
          <Flex
            align="center"
            justify="center"
            bg="blue.500"
            color="white"
            w="80px"
            h="100%"
            borderRadius="md"
          >
            <Icon as={FaEnvelopeOpen} boxSize={6} />
          </Flex>

          {/* Delete Action (Right Side) */}
          <Flex
            align="center"
            justify="center"
            bg="red.500"
            color="white"
            w="80px"
            h="100%"
            borderRadius="md"
          >
            <Icon as={FaTrash} boxSize={6} />
          </Flex>
        </Box>

        {/* Main Notification Card */}
        <Box
          ref={(el) => (swipeRefs.current[notification.id] = el)}
          onTouchStart={(e) => handleTouchStart(e, notification.id)}
          onTouchMove={(e) => handleTouchMove(e, notification.id)}
          onTouchEnd={(e) => handleTouchEnd(e, notification)}
          onClick={() => handleNotificationClick(notification)}
          cursor="pointer"
          position="relative"
          zIndex={1}
          bg={bgColor}
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
    <Box w="100%">
      {/* Tabs - Full Width */}
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
                      {/* Date Section Header */}
                      <Flex 
                        justify="space-between" 
                        align="center" 
                        px={4} 
                        py={3} 
                        borderBottom="1px" 
                        borderColor={borderColor}
                        position="sticky"
                        top="49px" // Below the tabs
                        zIndex={5}
                      >
                        <Text fontSize="sm" fontWeight="semibold" color={sectionHeaderColor}>
                          {dateGroup}
                          <Badge ml={2} variant="outline" colorScheme="gray" fontSize="xs">
                            {groupNotifications.length}
                          </Badge>
                        </Text>
                      </Flex>
                      
                      {/* Notifications in this date group */}
                      {groupNotifications.map((notification, index) => 
                        renderNotificationItem(notification, index, groupNotifications)
                      )}
                    </Box>
                  ))}
                </VStack>
              )}

              {/* Mark All as Read Button */}
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