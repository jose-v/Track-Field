import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  FormControl,
  FormLabel,
  FormErrorMessage,
  HStack,
  Icon,
  Box,
  Select,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Divider,
  useToast
} from '@chakra-ui/react';
import { FiMail, FiCheck, FiUsers, FiUserPlus } from 'react-icons/fi';
import { sendTeamInvitation } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  events?: string[];
}

interface SendTeamInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onSuccess?: () => void;
}

export const SendTeamInviteModal: React.FC<SendTeamInviteModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  onSuccess
}) => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Email invitation state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'athlete' | 'coach'>('athlete');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Athlete selection state
  const [coachAthletes, setCoachAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(false);
  const [isAddingAthlete, setIsAddingAthlete] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fetch coach's athletes when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchCoachAthletes();
    }
  }, [isOpen, user?.id]);

  const fetchCoachAthletes = async () => {
    if (!user?.id) return;

    setIsLoadingAthletes(true);
    try {
      // Get approved athletes for this coach
      const { data: coachAthleteRelations, error: relationError } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', user.id)
        .eq('approval_status', 'approved');

      if (relationError) throw relationError;

      if (!coachAthleteRelations || coachAthleteRelations.length === 0) {
        setCoachAthletes([]);
        return;
      }

      const athleteIds = coachAthleteRelations.map(rel => rel.athlete_id);

      // Get athlete details
      const { data: athletesData, error: athletesError } = await supabase
        .from('athletes')
        .select(`
          id,
          events,
          profiles!inner (
            first_name,
            last_name,
            email
          )
        `)
        .in('id', athleteIds);

      if (athletesError) throw athletesError;

      // Check which athletes are already in this team
      const { data: teamMembers, error: teamMembersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (teamMembersError) throw teamMembersError;

      const teamMemberIds = new Set(teamMembers?.map(member => member.user_id) || []);

      // Filter out athletes already in the team
      const availableAthletes = athletesData
        ?.filter(athlete => !teamMemberIds.has(athlete.id))
        .map(athlete => ({
          id: athlete.id,
          first_name: athlete.profiles.first_name,
          last_name: athlete.profiles.last_name,
          email: athlete.profiles.email,
          events: athlete.events
        })) || [];

      setCoachAthletes(availableAthletes);
    } catch (err) {
      console.error('Error fetching coach athletes:', err);
      toast({
        title: 'Error',
        description: 'Failed to load your athletes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingAthletes(false);
    }
  };

  const handleAddExistingAthlete = async () => {
    if (!selectedAthleteId || !user?.id) return;

    setIsAddingAthlete(true);
    try {
      // Add athlete to team
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: selectedAthleteId,
          role: 'athlete',
          status: 'active',
          joined_at: new Date().toISOString()
        });

      if (error) throw error;

      const selectedAthlete = coachAthletes.find(a => a.id === selectedAthleteId);
      toast({
        title: 'Athlete Added!',
        description: `${selectedAthlete?.first_name} ${selectedAthlete?.last_name} has been added to ${teamName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Remove athlete from available list
      setCoachAthletes(prev => prev.filter(a => a.id !== selectedAthleteId));
      setSelectedAthleteId('');
      
      onSuccess?.();
    } catch (err) {
      console.error('Error adding athlete to team:', err);
      toast({
        title: 'Error',
        description: 'Failed to add athlete to team',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAddingAthlete(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendTeamInvitation(
        teamId,
        email.trim(),
        role,
        user.id
      );

      if (result.success) {
        setSuccess(`Invitation sent to ${email}!`);
        setEmail('');
        setMessage('');
        
        // Wait a moment to show success message
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.error || 'Failed to send invitation');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Send invitation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('athlete');
    setMessage('');
    setError(null);
    setSuccess(null);
    setSelectedAthleteId('');
    onClose();
  };

  const isValidEmail = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor} borderColor={borderColor} borderWidth="1px">
        <ModalHeader>
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="lg"
              bg={useColorModeValue('blue.50', 'blue.900')}
              color={useColorModeValue('blue.500', 'blue.300')}
            >
              <Icon as={FiUserPlus} boxSize={5} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text>Add Athletes to Team</Text>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                {teamName}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FiUsers} />
                  <Text>Your Athletes</Text>
                  {coachAthletes.length > 0 && (
                    <Badge colorScheme="blue" borderRadius="full">
                      {coachAthletes.length}
                    </Badge>
                  )}
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <Icon as={FiMail} />
                  <Text>Invite by Email</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Existing Athletes Tab */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <Text color={useColorModeValue('gray.600', 'gray.400')}>
                    Add athletes from your current roster to this team.
                  </Text>

                  {isLoadingAthletes ? (
                    <Text>Loading your athletes...</Text>
                  ) : coachAthletes.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <VStack align="start" spacing={1} flex="1">
                        <Text fontSize="sm" fontWeight="bold">
                          No Available Athletes
                        </Text>
                        <Text fontSize="sm">
                          All your athletes are already in this team, or you don't have any athletes yet.
                        </Text>
                      </VStack>
                    </Alert>
                  ) : (
                    <>
                      <FormControl>
                        <FormLabel>Select Athlete</FormLabel>
                        <Select
                          placeholder="Choose an athlete to add..."
                          value={selectedAthleteId}
                          onChange={(e) => setSelectedAthleteId(e.target.value)}
                          isDisabled={isAddingAthlete}
                        >
                          {coachAthletes.map((athlete) => (
                            <option key={athlete.id} value={athlete.id}>
                              {athlete.first_name} {athlete.last_name}
                              {athlete.events && athlete.events.length > 0 && 
                                ` - ${athlete.events.slice(0, 2).join(', ')}${athlete.events.length > 2 ? '...' : ''}`
                              }
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <Button
                        colorScheme="blue"
                        onClick={handleAddExistingAthlete}
                        isLoading={isAddingAthlete}
                        loadingText="Adding..."
                        isDisabled={!selectedAthleteId}
                        leftIcon={<FiUserPlus />}
                        size="lg"
                      >
                        Add to Team
                      </Button>
                    </>
                  )}
                </VStack>
              </TabPanel>

              {/* Email Invitation Tab */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <Text color={useColorModeValue('gray.600', 'gray.400')}>
                    Send an email invitation to join your team. They'll receive the team's invite code and can join immediately.
                  </Text>

                  {error && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">{error}</Text>
                    </Alert>
                  )}

                  {success && (
                    <Alert status="success" borderRadius="md">
                      <AlertIcon />
                      <HStack>
                        <Icon as={FiCheck} />
                        <Text fontSize="sm">{success}</Text>
                      </HStack>
                    </Alert>
                  )}

                  <FormControl isInvalid={!!error && !success} isRequired>
                    <FormLabel>Email Address</FormLabel>
                    <Input
                      type="email"
                      placeholder="athlete@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      isDisabled={isLoading || !!success}
                    />
                    {error && (
                      <FormErrorMessage>{error}</FormErrorMessage>
                    )}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Role</FormLabel>
                    <Select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'athlete' | 'coach')}
                      isDisabled={isLoading || !!success}
                    >
                      <option value="athlete">Athlete</option>
                      <option value="coach">Coach</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Personal Message (Optional)</FormLabel>
                    <Textarea
                      placeholder="Hi! I'd like to invite you to join our team..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      isDisabled={isLoading || !!success}
                      rows={3}
                    />
                  </FormControl>

                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      The invitation will include your team's invite code so they can join immediately.
                    </Text>
                  </Alert>

                  <Button
                    colorScheme="blue"
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    loadingText="Sending..."
                    isDisabled={!isValidEmail || !!success}
                    leftIcon={<FiMail />}
                    size="lg"
                  >
                    Send Invitation
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={handleClose} isDisabled={isLoading || isAddingAthlete}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 