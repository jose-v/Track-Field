import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Flex,
  Spinner,
  useToast,
  useColorModeValue,
  Avatar,
  Icon,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Container,
  Heading,
  useBreakpointValue
} from '@chakra-ui/react';
import { FaCheckCircle, FaTimesCircle, FaEye, FaBell, FaUserPlus, FaTrophy, FaCalendarAlt } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import MobileNotifications from './MobileNotifications';

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

const NotificationsTable: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('unread');
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({});
  const toast = useToast();
  const queryClient = useQueryClient();

  // Mobile/Desktop detection
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const sectionHeaderColor = useColorModeValue('gray.500', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.750');
  const sectionHeaderBg = useColorModeValue('gray.50', 'gray.750');

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
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsArchived = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_archived: true, is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_archived: true, is_read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error archiving notification:', error);
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
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const updateNotificationMessage = async (
    notificationId: string, 
    newTitle: string, 
    newMessage: string
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          title: newTitle,
          message: newMessage,
          is_read: true 
        })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { 
                ...notification, 
                title: newTitle,
                message: newMessage,
                is_read: true 
              } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error updating notification message:', error);
    }
  };

  const handleAthleteRequest = async (notificationId: string, athleteId: string, approved: boolean) => {
    if (!user?.id) return;
    
    try {
      setIsProcessing(true);
      
      const { data: athleteData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', athleteId)
        .single();
      
      const athleteName = athleteData 
        ? `${athleteData.first_name || ''} ${athleteData.last_name || ''}`.trim()
        : 'Athlete';
      
      if (approved) {
        const { data: coachTeams, error: teamsError } = await supabase
          .from('team_members')
          .select('team_id, teams!inner(id, name, team_type)')
          .eq('user_id', user.id)
          .eq('role', 'coach')
          .eq('status', 'active')
          .eq('teams.is_active', true);

        if (teamsError) throw teamsError;

        if (!coachTeams || coachTeams.length === 0) {
          toast({
            title: 'No Teams Available',
            description: 'You need to create a team first before adding athletes.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        const firstTeam = coachTeams[0];
        
        const { error: memberError } = await supabase
          .from('team_members')
          .upsert({
            team_id: firstTeam.team_id,
            user_id: athleteId,
            role: 'athlete',
            status: 'active',
            joined_at: new Date().toISOString()
          }, {
            onConflict: 'team_id,user_id',
            ignoreDuplicates: false
          });

        if (memberError) throw memberError;

        await supabase
          .from('notifications')
          .insert({
            user_id: athleteId,
            title: 'Request Approved!',
            message: `Your request to join the team has been approved. Welcome!`,
            type: 'team_invitation_accepted',
            metadata: { coach_id: user.id, team_id: firstTeam.team_id }
          });

        const newTitle = 'Athlete Request Approved';
        const newMessage = `You approved ${athleteName}'s request to join your team`;
        await updateNotificationMessage(notificationId, newTitle, newMessage);
        
        toast({
          title: 'Request Approved',
          description: `${athleteName} has been added to your team`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await supabase
          .from('notifications')
          .insert({
            user_id: athleteId,
            title: 'Request Declined',
            message: 'Your request to join the team has been declined.',
            type: 'team_invitation_declined',
            metadata: { coach_id: user.id }
          });

        const newTitle = 'Athlete Request Declined';
        const newMessage = `You declined ${athleteName}'s request to join your team`;
        await updateNotificationMessage(notificationId, newTitle, newMessage);
        
        toast({
          title: 'Request Declined',
          description: `You declined ${athleteName}'s request to join your team`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
      
      fetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['coach-athletes', user.id] });
    } catch (error) {
      console.error('Error handling athlete request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process the athlete request',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCoachRequest = async (notificationId: string, coachId: string, approved: boolean) => {
    if (!user?.id) return;
    
    try {
      setIsProcessing(true);
      
      const { data: coachData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', coachId)
        .single();
      
      const coachName = coachData 
        ? `${coachData.first_name || ''} ${coachData.last_name || ''}`.trim()
        : 'Coach';
      
      if (approved) {
        const { data: coachTeams, error: teamsError } = await supabase
          .from('team_members')
          .select('team_id, teams!inner(id, name, team_type)')
          .eq('user_id', coachId)
          .eq('role', 'coach')
          .eq('status', 'active')
          .eq('teams.is_active', true);

        if (teamsError) throw teamsError;

        if (!coachTeams || coachTeams.length === 0) {
        toast({
            title: 'No Teams Available',
            description: 'The coach has no available teams.',
            status: 'warning',
            duration: 5000,
          isClosable: true,
        });
        return;
      }
      
        const firstTeam = coachTeams[0];
        
        const { error: memberError } = await supabase
          .from('team_members')
          .upsert({
            team_id: firstTeam.team_id,
            user_id: user.id,
            role: 'athlete',
            status: 'active',
            joined_at: new Date().toISOString()
          }, {
            onConflict: 'team_id,user_id',
            ignoreDuplicates: false
          });

        if (memberError) throw memberError;

        await supabase
          .from('notifications')
          .insert({
            user_id: coachId,
            title: 'Request Approved!',
            message: `Your request has been approved. New athlete joined your team!`,
            type: 'team_invitation_accepted',
            metadata: { athlete_id: user.id, team_id: firstTeam.team_id }
          });

        const newTitle = 'Coach Request Approved';
        const newMessage = `You approved ${coachName}'s request to join their team`;
        await updateNotificationMessage(notificationId, newTitle, newMessage);
        
        toast({
          title: 'Request Approved',
          description: `You have joined ${coachName}'s team`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await supabase
          .from('notifications')
          .insert({
            user_id: coachId,
            title: 'Request Declined',
            message: 'Your request has been declined.',
            type: 'team_invitation_declined',
            metadata: { athlete_id: user.id }
          });

        const newTitle = 'Coach Request Declined';
        const newMessage = `You declined ${coachName}'s request to join their team`;
        await updateNotificationMessage(notificationId, newTitle, newMessage);
        
        toast({
          title: 'Request Declined',
          description: `You declined ${coachName}'s request to join their team`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
      
      fetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['athlete-coaches', user.id] });
    } catch (error) {
      console.error('Error handling coach request:', error);
      toast({
        title: 'Error',
        description: 'Failed to process the coach request',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
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
      case 'meet_file_added':
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
      case 'meet_file_added':
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
      markAsRead(notification.id);
    }
  };

  const markAllAsRead = async () => {
    try {
      const filteredNotifications = getFilteredNotifications();
      const unreadIds = filteredNotifications
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
      
      setNotifications(prev => 
        prev.map(notification => 
          unreadIds.includes(notification.id)
            ? { ...notification, is_read: true }
            : notification
        )
      );

      toast({
        title: 'Success',
        description: `Marked ${unreadIds.length} notification${unreadIds.length > 1 ? 's' : ''} as read`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
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

  const renderNotificationItem = (notification: Notification, index: number, groupNotifications: Notification[]) => {
    const userProfile = getUserProfileForNotification(notification);
    
    return (
      <Box key={notification.id}>
        <Box
          px="15px"
          py={5}
          _hover={{ bg: hoverBg }}
          cursor="pointer"
          onClick={() => handleNotificationClick(notification)}
          transition="background-color 0.2s"
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            align={{ base: 'stretch', md: 'start' }}
          >
            {/* User Avatar */}
            <Flex
              direction={{ base: 'row', md: 'column' }}
              align="center"
              gap={3}
              mb={{ base: 2, md: 0 }}
            >
              <Box position="relative" flexShrink={0}>
                {userProfile ? (
                  <Avatar
                    size={{ base: 'sm', md: 'md' }}
                    name={`${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()}
                    src={userProfile.avatar_url}
                  />
                ) : (
                  <Box
                    p={2}
                    borderRadius="50%"
                    bg={`${getNotificationColor(notification.type)}.100`}
                    color={`${getNotificationColor(notification.type)}.600`}
                    w={{ base: 10, md: 12 }}
                    h={{ base: 10, md: 12 }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon 
                      as={getNotificationIcon(notification.type)} 
                      boxSize={{ base: 4, md: 5 }}
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
                    borderColor={cardBg}
                  />
                )}
              </Box>

              {/* Status Badge - Show on mobile next to avatar */}
              <Badge 
                display={{ base: 'block', md: 'none' }}
                colorScheme={notification.is_archived ? 'gray' : getNotificationColor(notification.type)} 
                variant="subtle"
                fontSize="xs"
                flexShrink={0}
              >
                {notification.is_archived ? 'ARCHIVED' : 
                 notification.is_read ? 'READ' :
                 notification.type === 'coach_request' ? 'ATHLETE REQUEST' : 
                 notification.type === 'coach_invitation' ? 'COACH REQUEST' :
                 notification.type === 'workout_assigned' ? 'WORKOUT ASSIGNED' :
                 notification.type === 'meet_assigned' ? 'MEET ASSIGNED' :
                 notification.type.toUpperCase().replace('_', ' ')}
              </Badge>
            </Flex>

            {/* Notification Content */}
            <Box flex={1} minW={0}>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                justify={{ base: 'flex-start', md: 'space-between' }}
                align={{ base: 'stretch', md: 'start' }}
                gap={{ base: 2, md: 0 }}
                mb={3}
              >
                <VStack align="start" spacing={1} flex={1} minW={0}>
                  <Text
                    fontSize={{ base: 'sm', md: 'md' }}
                    fontWeight={notification.is_read ? 'normal' : 'bold'}
                    color={notification.is_archived ? subtitleColor : textColor}
                    noOfLines={2}
                  >
                    {notification.title}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={subtitleColor}
                    noOfLines={{ base: 3, md: 2 }}
                  >
                    {notification.message}
                  </Text>
                </VStack>
                
                {/* Status Badge - Show on desktop */}
                <Badge 
                  display={{ base: 'none', md: 'block' }}
                  colorScheme={notification.is_archived ? 'gray' : getNotificationColor(notification.type)} 
                  variant="subtle"
                  fontSize="xs"
                  flexShrink={0}
                  ml={2}
                >
                  {notification.is_archived ? 'ARCHIVED' : 
                   notification.is_read ? 'READ' :
                   notification.type === 'coach_request' ? 'ATHLETE REQUEST' : 
                   notification.type === 'coach_invitation' ? 'COACH REQUEST' :
                   notification.type === 'workout_assigned' ? 'WORKOUT ASSIGNED' :
                   notification.type === 'meet_assigned' ? 'MEET ASSIGNED' :
                   notification.type.toUpperCase().replace('_', ' ')}
                </Badge>
              </Flex>
              
              <Flex
                direction={{ base: 'column', md: 'row' }}
                justify={{ base: 'flex-start', md: 'space-between' }}
                align={{ base: 'stretch', md: 'center' }}
                gap={{ base: 3, md: 0 }}
              >
                <Text fontSize="xs" color={subtitleColor}>
                  {formatTimeAgo(notification.created_at)}
                </Text>
                
                {/* Action Buttons */}
                {!notification.is_archived && (
                  <Flex
                    direction={{ base: 'column', sm: 'row' }}
                    gap={2}
                    width={{ base: 'full', md: 'auto' }}
                  >
                    {notification.type === 'coach_request' && !notification.is_read && (
                      <>
                        <Button
                          size={{ base: 'sm', md: 'xs' }}
                          colorScheme="green"
                          variant="solid"
                          leftIcon={<FaCheckCircle />}
                          isLoading={isProcessing}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAthleteRequest(notification.id, notification.metadata.athlete_id, true);
                          }}
                          width={{ base: 'full', md: 'auto' }}
                        >
                          Approve
                        </Button>
                        <Button
                          size={{ base: 'sm', md: 'xs' }}
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<FaTimesCircle />}
                          isLoading={isProcessing}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAthleteRequest(notification.id, notification.metadata.athlete_id, false);
                          }}
                          width={{ base: 'full', md: 'auto' }}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {notification.type === 'coach_invitation' && !notification.is_read && (
                      <>
                        <Button
                          size={{ base: 'sm', md: 'xs' }}
                          colorScheme="green"
                          variant="solid"
                          leftIcon={<FaCheckCircle />}
                          isLoading={isProcessing}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCoachRequest(notification.id, notification.metadata.coach_id, true);
                          }}
                          width={{ base: 'full', md: 'auto' }}
                        >
                          Accept
                        </Button>
                        <Button
                          size={{ base: 'sm', md: 'xs' }}
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<FaTimesCircle />}
                          isLoading={isProcessing}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCoachRequest(notification.id, notification.metadata.coach_id, false);
                          }}
                          width={{ base: 'full', md: 'auto' }}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {/* Mark Read and Archive buttons - always on same line */}
                    <Flex direction="row" gap={2} width={{ base: 'full', md: 'auto' }}>
                      {(!notification.is_read && notification.type !== 'coach_request' && notification.type !== 'coach_invitation') && (
                        <Button
                          size={{ base: 'sm', md: 'xs' }}
                          variant="ghost"
                          colorScheme="blue"
                          leftIcon={<FaEye />}
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          flex={1}
                        >
                          Mark Read
                        </Button>
                      )}
                      {activeFilter !== 'archived' && (
                        <Button
                          size={{ base: 'sm', md: 'xs' }}
                          variant="ghost"
                          colorScheme="gray"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsArchived(notification.id);
                          }}
                          flex={1}
                        >
                          Archive
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                )}
              </Flex>
            </Box>
          </Flex>
        </Box>
        {index < groupNotifications.length - 1 && (
          <Box px="15px">
            <Divider borderColor={borderColor} />
          </Box>
        )}
      </Box>
    );
  };

  const filteredNotifications = getFilteredNotifications();
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      </Container>
    );
  }

  // Render mobile notifications on mobile devices
  if (isMobile) {
    return (
      <MobileNotifications
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAsArchived={markAsArchived}
        onDelete={deleteNotification}
        onMarkAllAsRead={markAllAsRead}
        isProcessing={isProcessing}
        userProfiles={userProfiles}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        handleAthleteRequest={handleAthleteRequest}
        handleCoachRequest={handleCoachRequest}
      />
    );
  }

  // Desktop version (unchanged)
  return (
    <Container maxW="container.lg" py={0}>
      <VStack spacing={0} align="stretch">
        <Box bg={cardBg} borderRadius="lg" overflow="hidden">
          <Tabs variant="line" size="md" colorScheme="blue" onChange={(index) => {
            const filters: FilterType[] = ['unread', 'read', 'archived'];
            setActiveFilter(filters[index]);
          }}>
            <TabList 
              borderBottom="1px" 
              borderColor={borderColor} 
              px="15px" 
              pt={2}
              width="100%"
              justifyContent="center"
            >
              <Tab 
                fontSize="sm" 
                fontWeight="medium"
                color={subtitleColor}
                flex={1}
                justifyContent="center"
                _selected={{ 
                  color: textColor,
                  borderColor: "blue.500",
                  borderLeft: "0"
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
                  borderColor: "blue.500",
                  borderLeft: "0"
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
                  borderColor: "blue.500",
                  borderLeft: "0"
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
                    <Box textAlign="center" py={12} px="15px">
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
                          <Flex justify="space-between" align="center" px="15px" py={4} bg={sectionHeaderBg} borderBottom="1px" borderColor={borderColor}>
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
                    <Box px="15px" py={4} borderTop="1px" borderColor={borderColor}>
                      <Button
                        variant="ghost"
                        size="sm"
                        width="full"
                        leftIcon={<Icon as={FaCheckCircle} />}
                        onClick={markAllAsRead}
                        color={subtitleColor}
                        _hover={{ color: textColor, bg: hoverBg }}
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
      </VStack>
    </Container>
  );
};

export default NotificationsTable; 