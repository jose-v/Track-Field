import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Divider,
  Button,
  useColorModeValue,
  Icon,
  Flex,
  Spinner,
  IconButton,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { FaBell, FaCheckCircle, FaUserPlus, FaTrophy, FaCalendarAlt, FaEllipsisV } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';

interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  metadata: any;
  created_at: string;
  is_read: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationsPath: string;
  children: React.ReactElement; // The trigger element (bell icon)
  onNotificationRead?: () => void; // Callback when notifications are marked as read
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notificationsPath,
  children,
  onNotificationRead
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({});
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const unreadBg = useColorModeValue('blue.50', 'blue.900');

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchRecentNotifications();
    }
  }, [isOpen, user?.id]);

  const fetchRecentNotifications = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10); // Get the 10 most recent notifications
      
      if (error) throw error;
      
      setNotifications(data || []);

      // Extract user IDs from notification metadata to fetch avatars
      if (data && data.length > 0) {
        const userIds = new Set<string>();
        
        data.forEach(notification => {
          if (notification.metadata) {
            // Extract various user IDs from different notification types
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

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      // Notify parent component that notification was read
      onNotificationRead?.();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'coach_request':
      case 'coach_invitation':
        return FaUserPlus;
      case 'team_invitation_accepted':
      case 'team_invitation_declined':
        return FaCheckCircle;
      case 'achievement':
      case 'badge_earned':
        return FaTrophy;
      case 'meet_reminder':
      case 'meet_assigned':
      case 'meet_updated':
      case 'workout_assigned':
      case 'workout_updated':
        return FaCalendarAlt;
      default:
        return FaBell;
    }
  };

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
        return 'purple';
      case 'workout_assigned':
      case 'workout_updated':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notification => !notification.is_read)
        .map(notification => notification.id);
      
      if (unreadIds.length === 0) {
        toast({
          title: 'No unread notifications',
          description: 'All notifications are already marked as read',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      toast({
        title: 'Success',
        description: `Marked ${unreadIds.length} notification${unreadIds.length > 1 ? 's' : ''} as read`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Notify parent component that notifications were read
      onNotificationRead?.();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleNotificationSettings = () => {
    // You can implement this to open notification settings
    // For now, it could redirect to a settings page or open a modal
    toast({
      title: 'Notification Settings',
      description: 'Notification settings feature coming soon',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const getUserProfileForNotification = (notification: NotificationData) => {
    if (!notification.metadata) return null;
    
    // Get the sender's user ID based on notification type
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

  return (
    <Popover 
      isOpen={isOpen} 
      onClose={onClose} 
      placement="bottom-end"
      closeOnBlur={true}
      closeOnEsc={true}
    >
      <PopoverTrigger>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        bg={bgColor} 
        border="1px"
        borderColor={borderColor}
        w="400px"
        maxH="500px"
        boxShadow="0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        _focus={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      >
        <PopoverHeader border="none">
          <Flex justify="space-between" align="center" py={2}>
            <Text fontSize="lg" fontWeight="semibold" color={textColor}>
              Notifications
            </Text>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="More options"
                icon={<FaEllipsisV />}
                variant="ghost"
                size="sm"
                color={subtitleColor}
              />
                             <MenuList>
                 <MenuItem onClick={markAllAsRead}>Mark All as Read</MenuItem>
                 <MenuItem onClick={handleNotificationSettings}>Set In-app Notifications</MenuItem>
               </MenuList>
            </Menu>
          </Flex>
        </PopoverHeader>
        
        <PopoverBody px={0} pb={4} overflowY="auto" maxH="400px">
          {isLoading ? (
            <Flex justify="center" py={8}>
              <Spinner size="lg" color="blue.500" />
            </Flex>
          ) : notifications.length === 0 ? (
            <Box textAlign="center" py={8} px={6}>
              <Icon as={FaBell} boxSize={12} color="gray.400" mb={4} />
              <Text color={subtitleColor} fontSize="md">
                No notifications yet
              </Text>
              <Text color={subtitleColor} fontSize="sm" mt={2}>
                We'll notify you when something important happens
              </Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch">
              {notifications.map((notification, index) => {
                const userProfile = getUserProfileForNotification(notification);
                
                return (
                  <Box key={notification.id}>
                    <Box
                      px={6}
                      py={4}
                      _hover={{ bg: hoverBg }}
                      cursor="pointer"
                      onClick={() => handleNotificationClick(notification)}
                      transition="background-color 0.2s"
                    >
                      <HStack spacing={3} align="start">
                        {/* User Avatar */}
                        <Box position="relative">
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
                              w={10}
                              h={10}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Icon 
                                as={getNotificationIcon(notification.type)} 
                                boxSize={4}
                              />
                            </Box>
                          )}
                          {!notification.is_read && (
                            <Box
                              position="absolute"
                              top="0"
                              right="0"
                              w={3}
                              h={3}
                              bg="red.500"
                              borderRadius="full"
                              border="2px"
                              borderColor={bgColor}
                            />
                          )}
                        </Box>

                        {/* Notification Content */}
                        <Box flex={1} minW={0}>
                          <Text
                            fontSize="sm"
                            fontWeight={notification.is_read ? 'normal' : 'bold'}
                            color={textColor}
                            noOfLines={2}
                            mb={1}
                          >
                            {notification.title}
                          </Text>
                          <Text
                            fontSize="xs"
                            color={subtitleColor}
                            noOfLines={2}
                            mb={2}
                          >
                            {notification.message}
                          </Text>
                          <Text fontSize="xs" color={subtitleColor}>
                            {formatTimeAgo(notification.created_at)}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                    {index < notifications.length - 1 && (
                      <Divider borderColor={borderColor} />
                    )}
                  </Box>
                );
              })}
            </VStack>
          )}

          {/* View All Button */}
          {notifications.length > 0 && (
            <Box px={6} pt={4}>
              <Button
                as={RouterLink}
                to={notificationsPath}
                variant="ghost"
                colorScheme="blue"
                size="sm"
                width="full"
                onClick={onClose}
              >
                View All Notifications
              </Button>
            </Box>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsModal; 