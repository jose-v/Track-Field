import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  Badge,
  Flex,
  Spinner,
  useToast,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { FaCheckCircle, FaTimesCircle, FaEye } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
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
}

const NotificationsTable: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

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
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
      
      // Update local state
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
      
      console.log('Processing athlete request from:', athleteId, 'to coach:', user.id);
      
      // Get athlete name for the notification message
      const { data: athleteData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', athleteId)
        .single();
      
      const athleteName = athleteData 
        ? `${athleteData.first_name || ''} ${athleteData.last_name || ''}`.trim()
        : 'Athlete';
      
      if (approved) {
        // Get coach's teams to add athlete to
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

        // For now, add to the first team (coaches can move athletes later)
        const firstTeam = coachTeams[0];
        
        // Add athlete to team using UPSERT to handle reactivating inactive members
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

        // Update notification with new status message
        const newTitle = 'Athlete Request Approved';
        const newMessage = `You approved ${athleteName}'s request and added them to your team`;
        await updateNotificationMessage(notificationId, newTitle, newMessage);
        
        toast({
          title: 'Request Approved',
          description: `${athleteName} has been added to your team`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Send notification to athlete
        await supabase
          .from('notifications')
          .insert({
            user_id: athleteId,
            type: 'team_invitation_accepted',
            title: 'Request Approved!',
            message: `Coach ${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''} approved your request and added you to their team`,
            metadata: {
              coach_id: user.id,
              team_id: firstTeam.team_id,
              team_name: (firstTeam as any).teams.name
            }
          });

      } else {
        // Decline the request
        const newTitle = 'Athlete Request Declined';
        const newMessage = `You declined ${athleteName}'s request to join your team`;
        await updateNotificationMessage(notificationId, newTitle, newMessage);
        
        toast({
          title: 'Request Declined',
          description: `You declined ${athleteName}'s request`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });

        // Send notification to athlete
        await supabase
          .from('notifications')
          .insert({
            user_id: athleteId,
            type: 'team_invitation_declined',
            title: 'Request Declined',
            message: `Coach ${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''} declined your request to join their team`,
            metadata: {
              coach_id: user.id
            }
          });
      }
      
      // Refresh notifications
      fetchNotifications();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['coach-teams', user.id] });
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
      
      console.log('Processing request from coach:', coachId, 'for athlete:', user.id);
      
      // Find the relationship record - don't filter by approval_status to allow retrying
      const { data: relationships, error: relationshipError } = await supabase
        .from('coach_athletes')
        .select('*')
        .eq('coach_id', coachId)
        .eq('athlete_id', user.id);
      
      if (relationshipError) {
        console.error('Relationship query error:', relationshipError);
        throw relationshipError;
      }
      
      console.log('Found relationships:', relationships);
      
      // Get coach name for the notification message
      const { data: coachData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', coachId)
        .single();
      
      const coachName = coachData 
        ? `Coach ${coachData.first_name || ''} ${coachData.last_name || ''}`.trim()
        : 'Coach';
      
      if (!relationships || relationships.length === 0) {
        // If no relationship exists, create one
        console.log('No existing relationship found, creating new one');
        const { data: newRelationship, error: insertError } = await supabase
          .from('coach_athletes')
          .insert({
            coach_id: coachId,
            athlete_id: user.id,
            approval_status: approved ? 'approved' : 'declined',
            requested_at: new Date().toISOString(),
            approved_at: approved ? new Date().toISOString() : null
          })
          .select('id')
          .single();
        
        if (insertError) {
          console.error('Failed to create relationship:', insertError);
          throw insertError;
        }
        
        console.log('Created new relationship:', newRelationship);
        
        // Update notification with new status message
        const newTitle = approved ? 'Coach Request Accepted' : 'Coach Request Declined';
        const newMessage = approved 
          ? `You accepted ${coachName}'s request to join their team` 
          : `You declined ${coachName}'s request to join their team`;
        
        await updateNotificationMessage(notificationId, newTitle, newMessage);
        
        toast({
          title: approved ? 'Request Approved' : 'Request Declined',
          description: approved 
            ? `You accepted ${coachName}'s request to join their team`
            : `You declined ${coachName}'s request to join their team`,
          status: approved ? 'success' : 'info',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh notifications
        fetchNotifications();
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['athlete-coaches', user.id] });
        return;
      }
      
      const relationshipId = relationships[0].id;
      console.log('Updating relationship ID:', relationshipId);
      
      if (approved) {
        // Approve the request
        const { error: updateError } = await supabase
          .from('coach_athletes')
          .update({ 
            approval_status: 'approved',
            approved_at: new Date().toISOString()
          })
          .eq('id', relationshipId);
        
        if (updateError) {
          console.error('Failed to approve relationship:', updateError);
          throw updateError;
        }
        
        // Update notification with new status message
        const newTitle = 'Coach Request Accepted';
        const newMessage = `You accepted ${coachName}'s request to join their team`;
        await updateNotificationMessage(notificationId, newTitle, newMessage);
        
        toast({
          title: 'Request Approved',
          description: `You accepted ${coachName}'s request to join their team`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Decline the request
        const { error: updateError } = await supabase
          .from('coach_athletes')
          .update({ approval_status: 'declined' })
          .eq('id', relationshipId);
        
        if (updateError) {
          console.error('Failed to decline relationship:', updateError);
          throw updateError;
        }
        
        // Update notification with new status message
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
      
      // No need to call markAsRead since updateNotificationMessage already marks it as read
      
      // Refresh notifications
      fetchNotifications();
      
      // Invalidate relevant queries
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

  if (isLoading) {
    return (
      <Flex justify="center" align="center" p={8}>
        <Spinner />
      </Flex>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Text>You have no notifications</Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Type</Th>
            <Th>Message</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {notifications.map(notification => (
            <Tr 
              key={notification.id}
              bg={notification.is_read ? 'transparent' : 'blue.50'}
            >
              <Td>
                <Badge 
                  colorScheme={
                    notification.type === 'coach_request' 
                      ? 'green' 
                      : notification.type === 'coach_invitation'
                        ? 'purple'
                        : notification.type === 'system' 
                          ? 'blue' 
                          : 'gray'
                  }
                >
                  {notification.type === 'coach_request' 
                    ? 'Athlete Request' 
                    : notification.type === 'coach_invitation'
                      ? 'Coach Request'
                      : notification.type === 'team_invitation_accepted'
                        ? 'Request Approved'
                        : notification.type === 'team_invitation_declined'
                          ? 'Request Declined'
                          : notification.type}
                </Badge>
              </Td>
              <Td>
                <Text fontWeight={notification.is_read ? 'normal' : 'bold'}>
                  {notification.title}
                </Text>
                <Text fontSize="sm" color="gray.600">{notification.message}</Text>
              </Td>
              <Td>
                {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
              </Td>
              <Td>
                <Badge colorScheme={notification.is_read ? 'gray' : 'blue'}>
                  {notification.is_read ? 'Read' : 'Unread'}
                </Badge>
              </Td>
              <Td>
                {notification.type === 'coach_request' && !notification.is_read && (
                  <Flex>
                    <Tooltip label="Approve">
                      <IconButton
                        aria-label="Approve request"
                        icon={<FaCheckCircle />}
                        variant="solid"
                        colorScheme="green"
                        size="sm"
                        mr={2}
                        isLoading={isProcessing}
                        onClick={() => handleAthleteRequest(
                          notification.id, 
                          notification.metadata.athlete_id, 
                          true
                        )}
                      />
                    </Tooltip>
                    <Tooltip label="Decline">
                      <IconButton
                        aria-label="Decline request"
                        icon={<FaTimesCircle />}
                        variant="solid"
                        colorScheme="red"
                        size="sm"
                        isLoading={isProcessing}
                        onClick={() => handleAthleteRequest(
                          notification.id, 
                          notification.metadata.athlete_id, 
                          false
                        )}
                      />
                    </Tooltip>
                  </Flex>
                )}
                {notification.type === 'coach_invitation' && !notification.is_read && (
                  <Flex>
                    <Tooltip label="Approve">
                      <IconButton
                        aria-label="Approve request"
                        icon={<FaCheckCircle />}
                        variant="solid"
                        colorScheme="green"
                        size="sm"
                        mr={2}
                        isLoading={isProcessing}
                        onClick={() => handleCoachRequest(
                          notification.id, 
                          notification.metadata.coach_id, 
                          true
                        )}
                      />
                    </Tooltip>
                    <Tooltip label="Decline">
                      <IconButton
                        aria-label="Decline request"
                        icon={<FaTimesCircle />}
                        variant="solid"
                        colorScheme="red"
                        size="sm"
                        isLoading={isProcessing}
                        onClick={() => handleCoachRequest(
                          notification.id, 
                          notification.metadata.coach_id, 
                          false
                        )}
                      />
                    </Tooltip>
                  </Flex>
                )}
                {(!notification.is_read && notification.type !== 'coach_request' && notification.type !== 'coach_invitation') && (
                  <Tooltip label="Mark as read">
                    <IconButton
                      aria-label="Mark as read"
                      icon={<FaEye />}
                      variant="ghost"
                      colorScheme="blue"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    />
                  </Tooltip>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default NotificationsTable; 