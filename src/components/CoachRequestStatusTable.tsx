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
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Icon
} from '@chakra-ui/react';
import { FaTrash, FaComments, FaUsers, FaUserPlus } from 'react-icons/fa';
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

interface Team {
  id: string;
  name: string;
  team_type: string;
  athlete_count?: number;
}

interface AddAthleteToTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: { id: string; name: string } | null;
  onSuccess?: () => void;
}

const AddAthleteToTeamModal: React.FC<AddAthleteToTeamModalProps> = ({
  isOpen,
  onClose,
  athlete,
  onSuccess
}) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToTeam, setIsAddingToTeam] = useState(false);
  const toast = useToast();

  // Use static colors instead of useColorModeValue since we're forcing the same values
  const bgColor = 'gray.800';
  const borderColor = 'gray.600';
  const textColor = 'white';

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchCoachTeams();
    }
  }, [isOpen, user?.id]);

  const fetchCoachTeams = async () => {
    setIsLoading(true);
    try {
      // Get all active teams created by this coach (not just 'coach' type)
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('id, name, team_type, is_active')
        .eq('created_by', user?.id)
        .eq('is_active', true)  // Only get active (non-deleted) teams
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!teamsData || teamsData.length === 0) {
        setTeams([]);
        return;
      }

      // Get teams where the athlete is already a member
      const { data: existingMemberships, error: membershipError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', athlete?.id)
        .eq('status', 'active')
        .in('team_id', teamsData.map(t => t.id));

      if (membershipError) throw membershipError;

      const existingTeamIds = new Set(existingMemberships?.map(m => m.team_id) || []);

      // Filter out teams where athlete is already a member and get member counts
      const availableTeams = teamsData.filter(team => !existingTeamIds.has(team.id));
      
      const teamsWithCounts = await Promise.all(
        availableTeams.map(async (team) => {
          // Get athlete count only (not total members) to match dashboard display
          const { count: athleteCount } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)
            .eq('role', 'athlete')  // Only count athletes, not coaches
            .eq('status', 'active');

          return {
            ...team,
            athlete_count: athleteCount || 0
          };
        })
      );

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToTeam = async () => {
    if (!selectedTeamId || !athlete?.id) return;

    setIsAddingToTeam(true);
    try {
      // First check if athlete is already an ACTIVE member of this team
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('id, status')
        .eq('team_id', selectedTeamId)
        .eq('user_id', athlete.id)
        .eq('status', 'active')  // Only check for active members
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is what we want
        throw checkError;
      }

      if (existingMember) {
        // Athlete is already a member
        const selectedTeam = teams.find(t => t.id === selectedTeamId);
        toast({
          title: 'Already a Member',
          description: `${athlete.name} is already a member of ${selectedTeam?.name}`,
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      // Add athlete to team using UPSERT to handle both new additions and reactivating inactive members
      const { data: insertedData, error } = await supabase
        .from('team_members')
        .upsert({
          team_id: selectedTeamId,
          user_id: athlete.id,
          role: 'athlete',
          status: 'active',
          joined_at: new Date().toISOString()
        }, { 
          onConflict: 'team_id,user_id',
          ignoreDuplicates: false  // Changed to false so it updates inactive records
        })
        .select('id');

      if (error) throw error;

      // UPSERT with ignoreDuplicates: false will always return data when successful
      const selectedTeam = teams.find(t => t.id === selectedTeamId);
      toast({
        title: 'Athlete Added!',
        description: `${athlete.name} has been added to ${selectedTeam?.name}`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error adding athlete to team:', error);
      toast({
        title: 'Error',
        description: 'Failed to add athlete to team',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAddingToTeam(false);
    }
  };

  const handleClose = () => {
    setSelectedTeamId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent bg={bgColor} borderColor={borderColor} borderWidth="1px" color={textColor}>
        <ModalHeader>
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="lg"
              bg="green.900"
              color="green.300"
            >
              <Icon as={FaUserPlus} boxSize={5} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color={textColor}>Add {athlete?.name} to Team</Text>
              <Text fontSize="sm" color="gray.300">
                Select a team to add this athlete to
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={textColor} />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {isLoading ? (
              <Flex justify="center" p={4}>
                <Spinner color="blue.300" />
              </Flex>
            ) : teams.length === 0 ? (
              <Box textAlign="center" p={4}>
                <VStack spacing={3}>
                  <Text color={textColor} fontWeight="medium">
                    No Available Teams
                  </Text>
                  <Text color="gray.300" fontSize="sm">
                    {athlete?.name} is already a member of all your teams, or you don't have any teams yet.
                  </Text>
                  <Text color="gray.400" fontSize="xs">
                    Create a new team to add this athlete, or check if they're already assigned to your existing teams.
                  </Text>
                </VStack>
              </Box>
            ) : (
              <>
                <FormControl>
                  <FormLabel color={textColor}>Select Team</FormLabel>
                  <Select
                    placeholder="Choose a team..."
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    color={textColor}
                    bg="gray.700"
                    borderColor="gray.600"
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.id} style={{ backgroundColor: '#2D3748', color: 'white' }}>
                        {team.name} ({team.athlete_count} athletes)
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  colorScheme="green"
                  onClick={handleAddToTeam}
                  isLoading={isAddingToTeam}
                  loadingText="Adding..."
                  isDisabled={!selectedTeamId}
                  leftIcon={<FaUserPlus />}
                  size="lg"
                >
                  Add to Team
                </Button>
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose} color={textColor}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const CoachRequestStatusTable: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<RequestStatus | null>(null);
  const [selectedAthleteForTeam, setSelectedAthleteForTeam] = useState<{ id: string; name: string } | null>(null);
  const toast = useToast();

  // Modal controls
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isTeamModalOpen, onOpen: onTeamModalOpen, onClose: onTeamModalClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

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
    setSelectedAthleteForTeam({ 
      id: request.athlete_id, 
      name: request.athlete_name 
    });
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
      <AddAthleteToTeamModal
        isOpen={isTeamModalOpen}
        onClose={() => {
          onTeamModalClose();
          setSelectedAthleteForTeam(null);
        }}
        athlete={selectedAthleteForTeam}
        onSuccess={() => {
          onTeamModalClose();
          setSelectedAthleteForTeam(null);
        }}
      />
    </>
  );
};

export default CoachRequestStatusTable; 