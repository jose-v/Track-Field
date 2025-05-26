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
  Badge,
  Flex,
  Spinner,
  useToast,
  Button
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface RequestStatus {
  id: string;
  coach_id: string;
  athlete_id: string;
  athlete_name: string;
  athlete_email: string;
  status: string;
  requested_at: string;
  approved_at?: string;
}

const CoachRequestStatusTable: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchSentRequests();
    }
  }, [user]);

  const fetchSentRequests = async () => {
    try {
      setIsLoading(true);
      
      // Get all coach-athlete relationships where this coach is the sender
      const { data: relationships, error: relationshipsError } = await supabase
        .from('coach_athletes')
        .select('id, athlete_id, approval_status, requested_at, approved_at')
        .eq('coach_id', user.id)
        .order('requested_at', { ascending: false });
      
      if (relationshipsError) throw relationshipsError;
      
      if (!relationships || relationships.length === 0) {
        setRequests([]);
        return;
      }
      
      // Get athlete details for each relationship
      const athleteIds = relationships.map(rel => rel.athlete_id);
      const { data: athletes, error: athletesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', athleteIds);
      
      if (athletesError) throw athletesError;
      
      // Combine the data
      const requestsData = relationships.map(relationship => {
        const athlete = athletes?.find(a => a.id === relationship.athlete_id);
        return {
          id: relationship.id,
          coach_id: user.id,
          athlete_id: relationship.athlete_id,
          athlete_name: athlete ? `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() : 'Unknown Athlete',
          athlete_email: athlete?.email || '',
          status: relationship.approval_status,
          requested_at: relationship.requested_at,
          approved_at: relationship.approved_at
        };
      });
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sent requests',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendRequest = async (requestId: string) => {
    try {
      // Find the athlete details for this request
      const request = requests.find(r => r.id === requestId);
      if (!request) return;
      
      // Create a notification for the athlete
      await supabase
        .from('notifications')
        .insert({
          user_id: request.athlete_id,
          title: 'Coach Request Reminder',
          message: 'A coach would like to add you to their team. Please approve or decline this request.',
          type: 'coach_request',
          metadata: { coach_id: user.id },
          created_at: new Date().toISOString(),
          is_read: false
        });
      
      toast({
        title: 'Reminder Sent',
        description: `Reminder sent to ${request.athlete_name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error resending request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reminder',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" p={8}>
        <Spinner />
      </Flex>
    );
  }

  if (requests.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Text>You haven't sent any athlete requests yet</Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto" mt={4}>
      <Text fontWeight="bold" mb={4}>Athlete Request Status</Text>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Athlete</Th>
            <Th>Email</Th>
            <Th>Requested On</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {requests.map(request => (
            <Tr key={request.id}>
              <Td>{request.athlete_name}</Td>
              <Td>{request.athlete_email}</Td>
              <Td>{format(new Date(request.requested_at), 'MMM d, yyyy')}</Td>
              <Td>
                <Badge 
                  colorScheme={
                    request.status === 'pending' 
                      ? 'yellow' 
                      : request.status === 'approved' 
                        ? 'green' 
                        : 'red'
                  }
                >
                  {request.status === 'pending' 
                    ? 'Pending' 
                    : request.status === 'approved' 
                      ? 'Approved' 
                      : 'Declined'}
                </Badge>
              </Td>
              <Td>
                {request.status === 'pending' && (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => handleResendRequest(request.id)}
                  >
                    Send Reminder
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default CoachRequestStatusTable; 