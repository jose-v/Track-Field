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
import { supabase } from '../lib/supabase';

interface TeamSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

// Define types locally to avoid import issues
interface CreateTeamRequest {
  name: string;
  description?: string;
  team_type: 'school' | 'club' | 'independent' | 'other';
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

  // Team managers now use unified system - no separate profile needed
  const ensureTeamManagerProfile = async (userId: string) => {
    // Team managers are handled through the unified teams + team_members system
    // They get added to team_members when they create or join teams
    // No separate team_managers table needed
    console.log('Team manager using unified system for user:', userId);
  };

  // Create team function
  const createTeam = async (request: CreateTeamRequest, created_by: string) => {
    try {
      // Generate a 6-digit invite code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let inviteCode = '';
      for (let i = 0; i < 6; i++) {
        inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Create the team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: request.name,
          description: request.description,
          created_by: created_by,
          team_type: request.team_type,
          invite_code: inviteCode
        })
        .select()
        .single();

      if (teamError) {
        throw new Error(`Failed to create team: ${teamError.message}`);
      }

      return teamData;
    } catch (error) {
      console.error('Error creating team:', error);
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

      // Create the team
      const request: CreateTeamRequest = {
        name: formData.teamName,
        description: formData.description || undefined,
        team_type: formData.teamType as 'school' | 'club' | 'independent' | 'other'
      };

      const teamData = await createTeam(request, user.id);
      
      toast({
        title: 'Success',
        description: `Team "${formData.teamName}" created successfully! Invite code: ${teamData.invite_code}`,
        status: 'success',
        duration: 5000,
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