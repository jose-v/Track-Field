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
  Button,
  IconButton,
  HStack,
  Tooltip,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  VStack
} from '@chakra-ui/react';
import { FaTrash, FaComments, FaUsers } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { SendTeamInviteModal } from './SendTeamInviteModal';

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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<RequestStatus | null>(null);
  const [selectedAthleteForTeam, setSelectedAthleteForTeam] = useState<{ id: string; name: string } | null>(null);
  const [coachTeams, setCoachTeams] = useState<Array<{ id: string; name: string }>>([]);
  const toast = useToast();

  // Modal controls
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isTeamModalOpen, onOpen: onTeamModalOpen, onClose: onTeamModalClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (user?.id) {
      fetchSentRequests();
      fetchCoachTeams();
    }
  }, [user]);

  const fetchCoachTeams = async () => {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('created_by', user?.id)
        .eq('team_type', 'coach');

      if (error) throw error;
      setCoachTeams(teams || []);
    } catch (error) {
      console.error('Error fetching coach teams:', error);
    }
  };

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

  const handleDeleteAthlete = (request: RequestStatus) => {
    setAthleteToDelete(request);
    onDeleteOpen();
  };

  const confirmDeleteAthlete = async () => {
    if (!athleteToDelete) return;

    setIsDeleting(athleteToDelete.id);
    try {
      // Delete the coach-athlete relationship
      const { error } = await supabase
        .from('coach_athletes')
        .delete()
        .eq('id', athleteToDelete.id);

      if (error) throw error;

      toast({
        title: 'Athlete Removed',
        description: `${athleteToDelete.athlete_name} has been removed from your roster`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh the requests list
      fetchSentRequests();
      onDeleteClose();
    } catch (error) {
      console.error('Error deleting athlete:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove athlete from roster',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(null);
      setAthleteToDelete(null);
    }
  };

  const handleSendMessage = async (request: RequestStatus) => {
    try {
      // Create a notification/message for the athlete
      await supabase
        .from('notifications')
        .insert({
          user_id: request.athlete_id,
          title: 'Message from Coach',
          message: 'Your coach has sent you a message. Please check your messages.',
          type: 'message',
          metadata: { coach_id: user.id, coach_name: user.email },
          created_at: new Date().toISOString(),
          is_read: false
        });

      toast({
        title: 'Message Sent',
        description: `Message sent to ${request.athlete_name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddToTeam = (request: RequestStatus) => {
    if (coachTeams.length === 0) {
      toast({
        title: 'No Teams Available',
        description: 'You need to create a team first before adding athletes',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // For now, we'll use the first team. In a full implementation, 
    // you might want to show a team selection modal
    const firstTeam = coachTeams[0];
    setSelectedAthleteForTeam({ id: firstTeam.id, name: firstTeam.name });
    onTeamModalOpen();
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
    <>
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
                  <HStack spacing={2}>
                    {/* Delete Athlete Button */}
                    <Tooltip label="Remove athlete from roster">
                      <IconButton
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        aria-label="Delete athlete"
                        onClick={() => handleDeleteAthlete(request)}
                        isLoading={isDeleting === request.id}
                      />
                    </Tooltip>

                    {/* Send Message Button */}
                    <Tooltip label="Send message to athlete">
                      <IconButton
                        icon={<FaComments />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        aria-label="Send message"
                        onClick={() => handleSendMessage(request)}
                      />
                    </Tooltip>

                    {/* Add to Team Button - only show for approved athletes */}
                    {request.status === 'approved' && (
                      <Tooltip label="Add to team">
                        <IconButton
                          icon={<FaUsers />}
                          size="sm"
                          colorScheme="green"
                          variant="ghost"
                          aria-label="Add to team"
                          onClick={() => handleAddToTeam(request)}
                        />
                      </Tooltip>
                    )}

                    {/* Send Reminder Button - only for pending requests */}
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => handleResendRequest(request.id)}
                      >
                        Send Reminder
                      </Button>
                    )}
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Athlete
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  Are you sure you want to remove <strong>{athleteToDelete?.athlete_name}</strong> from your roster? 
                  This will delete the coach-athlete relationship and cannot be undone.
                </Text>
                
                {/* Buttons in content area */}
                <HStack spacing={3} justify="flex-end" pt={4}>
                  <Button ref={cancelRef} onClick={onDeleteClose}>
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="red" 
                    onClick={confirmDeleteAthlete}
                    isLoading={!!isDeleting}
                    loadingText="Removing..."
                  >
                    Remove Athlete
                  </Button>
                </HStack>
              </VStack>
            </AlertDialogBody>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Add to Team Modal */}
      {selectedAthleteForTeam && (
        <SendTeamInviteModal
          isOpen={isTeamModalOpen}
          onClose={() => {
            onTeamModalClose();
            setSelectedAthleteForTeam(null);
          }}
          teamId={selectedAthleteForTeam.id}
          teamName={selectedAthleteForTeam.name}
          onSuccess={() => {
            onTeamModalClose();
            setSelectedAthleteForTeam(null);
            toast({
              title: 'Success',
              description: 'Athlete added to team successfully',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          }}
        />
      )}
    </>
  );
};

export default CoachRequestStatusTable; 