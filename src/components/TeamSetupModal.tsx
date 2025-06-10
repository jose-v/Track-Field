import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  useToast,
  HStack
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createTeam, createIndependentCoachTeam, type CreateTeamRequest, type CreateIndependentCoachTeamRequest } from '../services/teamService';
import { supabase } from '../lib/supabase';

interface TeamSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

export function TeamSetupModal({ isOpen, onClose, userRole }: TeamSetupModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    teamName: '',
    sport: 'track_and_field',
    division: 'varsity',
    season: 'spring',
    description: '',
    teamType: 'school'
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Ensure user has team manager profile
  const ensureTeamManagerProfile = async (userId: string) => {
    try {
      // Check if team manager profile exists
      const { data: existingManager, error: checkError } = await supabase
        .from('team_managers')
        .select('id')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }

      // If no team manager profile exists, create one
      if (!existingManager) {
        const { error: createError } = await supabase
          .from('team_managers')
          .insert([{ id: userId }]);

        if (createError) {
          throw createError;
        }
        console.log('Team manager profile created for user:', userId);
      }
    } catch (error) {
      console.error('Error ensuring team manager profile:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.teamName.trim()) {
      toast({
        title: 'Error',
        description: 'Team name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a team',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Ensure user has team manager profile first
      if (userRole === 'team_manager') {
        await ensureTeamManagerProfile(user.id);
      }

      // Check if this is an independent coach setup
      const isIndependentCoach = userRole === 'coach' && formData.teamType === 'independent';
      
      if (isIndependentCoach) {
        // Create independent coach team
        const request: CreateIndependentCoachTeamRequest = {
          team_name: formData.teamName,
          team_description: formData.description || undefined
        };
        await createIndependentCoachTeam(request, user.id);
      } else {
        // Create regular team
        const request: CreateTeamRequest = {
          name: formData.teamName,
          description: formData.description || undefined,
          team_type: formData.teamType as 'school' | 'club' | 'independent' | 'other'
        };
        await createTeam(request, user.id);
      }
      
      toast({
        title: 'Success',
        description: `Team "${formData.teamName}" created successfully!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form and close modal
      setFormData({
        teamName: '',
        sport: 'track_and_field',
        division: 'varsity',
        season: 'spring',
        description: '',
        teamType: 'school'
      });
      onClose();
      
      // Refresh the page to show the new team
      window.location.reload();
      
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: `Failed to create team: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form and close modal
    setFormData({
      teamName: '',
      sport: 'track_and_field',
      division: 'varsity',
      season: 'spring',
      description: '',
      teamType: 'school'
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Team</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Team Name</FormLabel>
                <Input
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  placeholder="e.g., Varsity Track & Field"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Team Type</FormLabel>
                <Select
                  name="teamType"
                  value={formData.teamType}
                  onChange={handleInputChange}
                >
                  <option value="school">School Team</option>
                  <option value="club">Club Team</option>
                  <option value="independent">Independent Coach</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Sport</FormLabel>
                <Select
                  name="sport"
                  value={formData.sport}
                  onChange={handleInputChange}
                >
                  <option value="track_and_field">Track & Field</option>
                  <option value="cross_country">Cross Country</option>
                  <option value="distance_running">Distance Running</option>
                  <option value="sprints">Sprints</option>
                  <option value="field_events">Field Events</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Division</FormLabel>
                <Select
                  name="division"
                  value={formData.division}
                  onChange={handleInputChange}
                >
                  <option value="varsity">Varsity</option>
                  <option value="jv">Junior Varsity</option>
                  <option value="freshman">Freshman</option>
                  <option value="middle_school">Middle School</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Season</FormLabel>
                <Select
                  name="season"
                  value={formData.season}
                  onChange={handleInputChange}
                >
                  <option value="spring">Spring</option>
                  <option value="fall">Fall</option>
                  <option value="winter">Winter</option>
                  <option value="summer">Summer</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description of the team..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="orange"
                isLoading={isLoading}
                loadingText="Creating..."
              >
                Create Team
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
} 