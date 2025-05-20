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
        
        // Mark notification as read
        await markAsRead(notificationId);
        
        toast({
          title: approved ? 'Request Approved' : 'Request Declined',
          description: approved ? 'You have approved the coach request' : 'You have declined the coach request',
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
        
        toast({
          title: 'Request Approved',
          description: 'You have approved the coach request',
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
        
        toast({
          title: 'Request Declined',
          description: 'You have declined the coach request',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Mark notification as read
      await markAsRead(notificationId);
      
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
                      : notification.type === 'system' 
                        ? 'blue' 
                        : 'purple'
                  }
                >
                  {notification.type === 'coach_request' 
                    ? 'Coach Request' 
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
                {(!notification.is_read && notification.type !== 'coach_request') && (
                  <Tooltip label="Mark as read">
                    <IconButton
                      aria-label="Mark as read"
                      icon={<FaEye />}
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