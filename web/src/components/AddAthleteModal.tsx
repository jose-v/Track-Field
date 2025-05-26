import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  InputGroup,
  InputLeftElement,
  Icon,
  Checkbox,
  HStack,
  Avatar,
  Text,
  Spinner,
  useToast,
  Box,
  Heading,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaUserPlus } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface Athlete {
  id: string;
  name: string;
  avatar_url?: string;
}

interface AddAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddAthleteModal = ({ isOpen, onClose }: AddAthleteModalProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // New athlete form fields
  const [newAthleteFirstName, setNewAthleteFirstName] = useState('');
  const [newAthleteLastName, setNewAthleteLastName] = useState('');
  const [newAthleteEmail, setNewAthleteEmail] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isCreatingAthlete, setIsCreatingAthlete] = useState(false);

  // Fetch available athletes
  useEffect(() => {
    if (isOpen) {
      fetchAvailableAthletes();
    }
  }, [isOpen]);

  // Handle search filtering
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAthletes(athletes);
    } else {
      const filtered = athletes.filter(athlete => 
        athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAthletes(filtered);
    }
  }, [searchTerm, athletes]);

  const fetchAvailableAthletes = async () => {
    if (!user?.id) {
      setErrorMessage('User not authenticated');
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      console.log('Fetching athletes for coach ID:', user.id);
      
      // Get the IDs of athletes already coached by this coach
      const { data: existingRelations, error: relationError } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', user.id);
      
      if (relationError) {
        console.error('Error fetching coach-athlete relationships:', relationError);
        setErrorMessage('Failed to fetch coach-athlete relationships');
        throw relationError;
      }
      
      console.log('Existing coach-athlete relationships:', existingRelations);
      const existingAthleteIds = existingRelations?.map(rel => rel.athlete_id) || [];
      console.log('Existing athlete IDs:', existingAthleteIds);
      
      // Get all athletes
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role');
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setErrorMessage('Failed to fetch athlete profiles');
        throw profilesError;
      }
      
      console.log('All profiles fetched:', profilesData);
      
      // Find all athletes (even if role is not explicitly set to 'athlete')
      const athleteProfiles = profilesData.filter(profile => profile.role === 'athlete' || !profile.role);
      console.log('Filtered athlete profiles:', athleteProfiles);
      
      // Filter out athletes already coached by this coach
      const availableAthletes = athleteProfiles
        .filter(profile => !existingAthleteIds.includes(profile.id))
        .map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed Athlete',
          avatar_url: profile.avatar_url
        }));
      
      console.log('Available athletes to add:', availableAthletes);
      
      setAthletes(availableAthletes);
      setFilteredAthletes(availableAthletes);
      
      // If no athletes are available, set an informative message
      if (availableAthletes.length === 0) {
        setErrorMessage('No new athletes available to add - you may have already added all athletes');
      }
    } catch (error) {
      console.error('Error fetching available athletes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available athletes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAthlete = (athleteId: string) => {
    setSelectedAthletes(prev => {
      if (prev.includes(athleteId)) {
        return prev.filter(id => id !== athleteId);
      } else {
        return [...prev, athleteId];
      }
    });
  };

  const handleAddAthletes = async () => {
    if (!user?.id || selectedAthletes.length === 0) return;
    
    try {
      setIsSaving(true);
      
      // Get coach info for notification
      const { data: coachData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      const coachName = coachData 
        ? `${coachData.first_name || ''} ${coachData.last_name || ''}`.trim() 
        : 'Your coach';
      
      // Create coach-athlete relationship requests with pending status
      const relationships = selectedAthletes.map(athleteId => ({
        coach_id: user.id,
        athlete_id: athleteId,
        created_at: new Date().toISOString(),
        requested_at: new Date().toISOString(),
        approval_status: 'pending'
      }));
      
      const { error } = await supabase
        .from('coach_athletes')
        .insert(relationships);
      
      if (error) throw error;
      
      // Send notifications to athletes about the request
      for (const athleteId of selectedAthletes) {
        try {
          // Get athlete's email or other contact info if needed
          const { data: athleteData } = await supabase
            .from('profiles')
            .select('email, first_name, last_name')
            .eq('id', athleteId)
            .single();
            
          if (athleteData?.email) {
            // Insert notification for the athlete
            await supabase
              .from('notifications')
              .insert({
                user_id: athleteId,
                title: 'New Coach Request',
                message: `Coach ${coachName} wants to add you to their team.`,
                type: 'coach_request',
                metadata: { coach_id: user.id },
                created_at: new Date().toISOString(),
                is_read: false
              });
              
            // In a real app, you would send an email here if needed
            console.log(`Notification sent to ${athleteData.email}`);
          }
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
          // Continue with other athletes even if one notification fails
        }
      }
      
      // Invalidate the coach athletes query to refresh data
      queryClient.invalidateQueries({ queryKey: ['coach-athletes', user.id] });
      
      toast({
        title: 'Request Sent',
        description: `Friend request sent to ${selectedAthletes.length} athlete(s). They will need to approve your request.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Close the modal and reset state
      onClose();
      setSelectedAthletes([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error sending athlete requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to send athlete requests',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Validate new athlete form
  const validateNewAthleteForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newAthleteFirstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!newAthleteLastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Create a new athlete
  const handleCreateAthlete = async () => {
    if (!validateNewAthleteForm()) return;
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be signed in to create an athlete',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsCreatingAthlete(true);
      
      // Create a UUID for the athlete
      const athleteId = crypto.randomUUID();
      
      // First create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: athleteId,
          first_name: newAthleteFirstName,
          last_name: newAthleteLastName,
          email: newAthleteEmail || null,
          role: 'athlete',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) throw profileError;
      
      // Create the athlete record
      const { error: athleteError } = await supabase
        .from('athletes')
        .insert({
          id: athleteId,
          events: []
        });
      
      if (athleteError) throw athleteError;
      
      // Get coach info for the relationship
      const { data: coachData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      const coachName = coachData 
        ? `${coachData.first_name || ''} ${coachData.last_name || ''}`.trim() 
        : 'Your coach';
      
      // If email is provided, we'll send a request for approval
      if (newAthleteEmail) {
        // Create coach-athlete relationship with pending status
        const { error: relationshipError } = await supabase
          .from('coach_athletes')
          .insert({
            coach_id: user.id,
            athlete_id: athleteId,
            created_at: new Date().toISOString(),
            requested_at: new Date().toISOString(),
            approval_status: 'pending'
          });
        
        if (relationshipError) throw relationshipError;
        
        // Create notification for the athlete
        await supabase
          .from('notifications')
          .insert({
            user_id: athleteId,
            title: 'New Coach Request',
            message: `Coach ${coachName} wants to add you to their team.`,
            type: 'coach_request',
            metadata: { coach_id: user.id },
            created_at: new Date().toISOString(),
            is_read: false
          });
          
        // Show success message with pending notice
        toast({
          title: 'Athlete Created',
          description: `${newAthleteFirstName} ${newAthleteLastName} has been created and a request has been sent for them to approve you as their coach.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // If no email, we'll auto-approve the relationship since this is likely a placeholder account
        const { error: relationshipError } = await supabase
          .from('coach_athletes')
          .insert({
            coach_id: user.id,
            athlete_id: athleteId,
            created_at: new Date().toISOString(),
            requested_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
            approval_status: 'approved'
          });
        
        if (relationshipError) throw relationshipError;
        
        // Show success message
        toast({
          title: 'Athlete Created',
          description: `${newAthleteFirstName} ${newAthleteLastName} has been added to your team.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Reset form and refetch
      setNewAthleteFirstName('');
      setNewAthleteLastName('');
      setNewAthleteEmail('');
      
      // Invalidate the coach athletes query to refresh data
      queryClient.invalidateQueries({ queryKey: ['coach-athletes', user.id] });
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error creating athlete:', error);
      toast({
        title: 'Error',
        description: 'Failed to create athlete',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreatingAthlete(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Athlete to Your Team</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs isFitted variant="enclosed">
            <TabList mb="1em">
              <Tab>Existing Athletes</Tab>
              <Tab>Create New Athlete</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Search Athletes</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaSearch} color="gray.400" />
                      </InputLeftElement>
                      <Input 
                        placeholder="Search by name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </FormControl>
                  
                  {isLoading ? (
                    <Box textAlign="center" py={4}>
                      <Spinner size="md" />
                      <Text mt={2}>Loading athletes...</Text>
                    </Box>
                  ) : filteredAthletes.length === 0 ? (
                    <Box py={4} textAlign="center">
                      <Text mb={4}>{errorMessage || 'No athletes available or matching your search'}</Text>
                      <Text fontSize="sm" color="gray.500">Try creating a new athlete instead.</Text>
                    </Box>
                  ) : (
                    <VStack align="stretch" maxH="300px" overflowY="auto" spacing={2} w="100%">
                      {filteredAthletes.map(athlete => (
                        <HStack 
                          key={athlete.id} 
                          p={2} 
                          borderWidth="1px" 
                          borderRadius="md"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Checkbox
                            isChecked={selectedAthletes.includes(athlete.id)}
                            onChange={() => handleToggleAthlete(athlete.id)}
                          />
                          <Avatar size="sm" name={athlete.name} src={athlete.avatar_url} />
                          <Text>{athlete.name}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  )}
                  
                  <Button 
                    colorScheme="brand" 
                    isLoading={isSaving}
                    isDisabled={selectedAthletes.length === 0 || isLoading}
                    onClick={handleAddAthletes}
                    leftIcon={<Icon as={FaUserPlus} />}
                    w="full"
                  >
                    Add Selected Athletes
                  </Button>
                </VStack>
              </TabPanel>
              
              <TabPanel px={0}>
                <VStack spacing={4}>
                  <FormControl isRequired isInvalid={!!formErrors.firstName}>
                    <FormLabel>First Name</FormLabel>
                    <Input 
                      value={newAthleteFirstName}
                      onChange={(e) => setNewAthleteFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                    {formErrors.firstName && <FormErrorMessage>{formErrors.firstName}</FormErrorMessage>}
                  </FormControl>
                  
                  <FormControl isRequired isInvalid={!!formErrors.lastName}>
                    <FormLabel>Last Name</FormLabel>
                    <Input 
                      value={newAthleteLastName}
                      onChange={(e) => setNewAthleteLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                    {formErrors.lastName && <FormErrorMessage>{formErrors.lastName}</FormErrorMessage>}
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Email (Optional)</FormLabel>
                    <Input 
                      value={newAthleteEmail}
                      onChange={(e) => setNewAthleteEmail(e.target.value)}
                      placeholder="Enter email address"
                      type="email"
                    />
                  </FormControl>
                  
                  <Button 
                    colorScheme="brand" 
                    leftIcon={<Icon as={FaPlus} />}
                    isLoading={isCreatingAthlete}
                    onClick={handleCreateAthlete}
                    w="full"
                  >
                    Create & Add Athlete
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddAthleteModal; 