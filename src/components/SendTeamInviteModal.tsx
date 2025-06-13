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
  useToast,
  Checkbox,
  CheckboxGroup,
  Stack
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
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(false);
  const [isAddingAthletes, setIsAddingAthletes] = useState(false);

  // Force white text colors
  const textColor = 'white';
  const bgColor = useColorModeValue('gray.800', 'gray.800');
  const borderColor = useColorModeValue('gray.600', 'gray.600');

  // Fetch coach's athletes when modal opens and refresh when it becomes visible
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchCoachAthletes();
    }
  }, [isOpen, user?.id, teamId]);

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

      // Check which athletes are already ACTIVE athlete members of this team
      const { data: activeTeamMembers, error: teamMembersError } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('status', 'active')
        .eq('role', 'athlete'); // Only get athletes, not coaches

      if (teamMembersError) throw teamMembersError;

      const teamMemberIds = new Set(activeTeamMembers?.map(member => member.user_id) || []);

      // Filter out athletes already in the team and map to proper structure
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

  // Add a function to check membership in real-time before adding
  const checkCurrentMembership = async (athleteIds: string[]) => {
    const { data: currentMembers, error } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .in('user_id', athleteIds);

    if (error) throw error;
    return new Set(currentMembers?.map(m => m.user_id) || []);
  };

  const handleAddExistingAthletes = async () => {
    if (selectedAthleteIds.length === 0 || !user?.id) return;

    setIsAddingAthletes(true);
    try {
      // Real-time membership check right before adding
      const currentMemberIds = await checkCurrentMembership(selectedAthleteIds);
      
      // Filter out athletes who are already members
      const athletesToAdd = selectedAthleteIds.filter(id => !currentMemberIds.has(id));
      const alreadyMembers = selectedAthleteIds.filter(id => currentMemberIds.has(id));
      
      if (athletesToAdd.length === 0) {
        // All selected athletes are already members
        const alreadyMemberNames = coachAthletes
          .filter(a => alreadyMembers.includes(a.id))
          .map(a => `${a.first_name} ${a.last_name}`)
          .join(', ');
          
        toast({
          title: 'Already Members',
          description: `${alreadyMemberNames} ${alreadyMembers.length === 1 ? 'is' : 'are'} already ${alreadyMembers.length === 1 ? 'a member' : 'members'} of this team`,
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
        
        // Refresh the athlete list and clear selections
        setSelectedAthleteIds([]);
        await fetchCoachAthletes();
        return;
      }
      
      // Prepare insert data only for athletes who are not already members
      const insertData = athletesToAdd.map(athleteId => ({
        team_id: teamId,
        user_id: athleteId,
        role: 'athlete',
        status: 'active',
        joined_at: new Date().toISOString()
      }));

      // Use upsert to handle both new additions and reactivating inactive members
      const { data: insertedData, error } = await supabase
        .from('team_members')
        .upsert(insertData, { 
          onConflict: 'team_id,user_id',
          ignoreDuplicates: false  // Changed to false so it updates inactive records
        })
        .select('user_id');

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }

      // Get the actual inserted records
      const insertedUserIds = new Set(insertedData?.map(record => record.user_id) || []);
      const addedAthletes = coachAthletes.filter(a => insertedUserIds.has(a.id));

      // Show appropriate message based on what actually happened
      if (addedAthletes.length > 0) {
        // Some athletes were successfully added
        const athleteNames = addedAthletes.map(a => `${a.first_name} ${a.last_name}`).join(', ');
        
        if (alreadyMembers.length > 0) {
          // Some added, some were already members
          const alreadyMemberNames = coachAthletes
            .filter(a => alreadyMembers.includes(a.id))
            .map(a => `${a.first_name} ${a.last_name}`)
            .join(', ');
            
          toast({
            title: 'Athletes Added!',
            description: `${athleteNames} ${addedAthletes.length === 1 ? 'has' : 'have'} been added to ${teamName}. ${alreadyMemberNames} ${alreadyMembers.length === 1 ? 'was' : 'were'} already ${alreadyMembers.length === 1 ? 'a member' : 'members'}.`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          // All were successfully added
          toast({
            title: 'Athletes Added!',
            description: `${athleteNames} ${addedAthletes.length === 1 ? 'has' : 'have'} been added to ${teamName}`,
            status: 'success',
            duration: 4000,
            isClosable: true,
          });
        }
      } else if (alreadyMembers.length > 0) {
        // No athletes were added because they were all already members
        // This case should have been handled earlier, but just in case
        const alreadyMemberNames = coachAthletes
          .filter(a => alreadyMembers.includes(a.id))
          .map(a => `${a.first_name} ${a.last_name}`)
          .join(', ');
          
        toast({
          title: 'Already Members',
          description: `${alreadyMemberNames} ${alreadyMembers.length === 1 ? 'is' : 'are'} already ${alreadyMembers.length === 1 ? 'a member' : 'members'} of this team`,
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
      }

      // Clear selections and refresh the athlete list
      setSelectedAthleteIds([]);
      await fetchCoachAthletes(); // Refresh to remove added athletes from the list
      
      onSuccess?.();
    } catch (err) {
      console.error('Error adding athletes to team:', err);
      toast({
        title: 'Error',
        description: 'Failed to add athletes to team',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAddingAthletes(false);
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
    setSelectedAthleteIds([]);
    onClose();
  };

  const isValidEmail = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor} borderColor={borderColor} borderWidth="1px" color={textColor}>
        <ModalHeader>
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="lg"
              bg="blue.900"
              color="blue.300"
            >
              <Icon as={FiUserPlus} boxSize={5} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text color={textColor}>Add Athletes to Team</Text>
              <Text fontSize="sm" color="gray.300">
                {teamName}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color={textColor} />
        
        <ModalBody>
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab color={textColor} _selected={{ color: 'blue.300', bg: 'blue.900' }}>
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
              <Tab color={textColor} _selected={{ color: 'blue.300', bg: 'blue.900' }}>
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
                  <Text color={textColor}>
                    Select athletes from your current roster to add to this team.
                  </Text>

                  {isLoadingAthletes ? (
                    <Text color={textColor}>Loading your athletes...</Text>
                  ) : coachAthletes.length === 0 ? (
                    <Alert status="info" borderRadius="md" bg="blue.900" borderColor="blue.600">
                      <AlertIcon color="blue.300" />
                      <VStack align="start" spacing={1} flex="1">
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>
                          No Available Athletes
                        </Text>
                        <Text fontSize="sm" color={textColor}>
                          All your athletes are already in this team, or you don't have any athletes yet.
                        </Text>
                      </VStack>
                    </Alert>
                  ) : (
                    <>
                      <FormControl>
                        <FormLabel color={textColor}>Select Athletes</FormLabel>
                        <CheckboxGroup 
                          value={selectedAthleteIds} 
                          onChange={(values) => setSelectedAthleteIds(values as string[])}
                        >
                          <Stack spacing={3} maxH="300px" overflowY="auto" pr={2}>
                            {coachAthletes.map((athlete) => (
                              <Checkbox 
                                key={athlete.id} 
                                value={athlete.id}
                                colorScheme="blue"
                                isDisabled={isAddingAthletes}
                              >
                                <VStack align="start" spacing={0} ml={2}>
                                  <Text color={textColor} fontWeight="medium">
                                    {athlete.first_name} {athlete.last_name}
                                  </Text>
                                  {athlete.events && athlete.events.length > 0 && (
                                    <Text fontSize="sm" color="gray.300">
                                      {athlete.events.slice(0, 3).join(', ')}
                                      {athlete.events.length > 3 ? '...' : ''}
                                    </Text>
                                  )}
                                </VStack>
                              </Checkbox>
                            ))}
                          </Stack>
                        </CheckboxGroup>
                      </FormControl>

                      <HStack spacing={2}>
                        <Text fontSize="sm" color="gray.300">
                          {selectedAthleteIds.length} athlete{selectedAthleteIds.length !== 1 ? 's' : ''} selected
                        </Text>
                      </HStack>

                      <Button
                        colorScheme="blue"
                        onClick={handleAddExistingAthletes}
                        isLoading={isAddingAthletes}
                        loadingText="Adding..."
                        isDisabled={selectedAthleteIds.length === 0}
                        leftIcon={<FiUserPlus />}
                        size="lg"
                      >
                        Add {selectedAthleteIds.length} Athlete{selectedAthleteIds.length !== 1 ? 's' : ''} to Team
                      </Button>
                    </>
                  )}
                </VStack>
              </TabPanel>

              {/* Email Invitation Tab */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <Text color={textColor}>
                    Send an email invitation to join your team. They'll receive the team's invite code and can join immediately.
                  </Text>

                  {error && (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm" color={textColor}>{error}</Text>
                    </Alert>
                  )}

                  {success && (
                    <Alert status="success" borderRadius="md">
                      <AlertIcon />
                      <HStack>
                        <Icon as={FiCheck} />
                        <Text fontSize="sm" color={textColor}>{success}</Text>
                      </HStack>
                    </Alert>
                  )}

                  <FormControl isInvalid={!!error && !success} isRequired>
                    <FormLabel color={textColor}>Email Address</FormLabel>
                    <Input
                      type="email"
                      placeholder="athlete@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      isDisabled={isLoading || !!success}
                      color={textColor}
                      _placeholder={{ color: 'gray.400' }}
                    />
                    {error && (
                      <FormErrorMessage color="red.300">{error}</FormErrorMessage>
                    )}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={textColor}>Role</FormLabel>
                    <Select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'athlete' | 'coach')}
                      isDisabled={isLoading || !!success}
                      color={textColor}
                      bg="gray.700"
                    >
                      <option value="athlete">Athlete</option>
                      <option value="coach">Coach</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel color={textColor}>Personal Message (Optional)</FormLabel>
                    <Textarea
                      placeholder="Hi! I'd like to invite you to join our team..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      isDisabled={isLoading || !!success}
                      rows={3}
                      color={textColor}
                      _placeholder={{ color: 'gray.400' }}
                    />
                  </FormControl>

                  <Alert status="info" borderRadius="md" bg="blue.900" borderColor="blue.600">
                    <AlertIcon color="blue.300" />
                    <Text fontSize="sm" color={textColor}>
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
          <Button variant="ghost" onClick={handleClose} isDisabled={isLoading || isAddingAthletes} color={textColor}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 