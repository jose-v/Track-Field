import React, { useState } from 'react';
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
  Textarea,
  Select,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  Box,
  Badge,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  createTeam, 
  createIndependentCoachTeam,
  type CreateTeamRequest,
  type CreateIndependentCoachTeamRequest,
  type TeamCreationResponse
} from '../services/teamService';

interface TeamSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

const TEAM_TYPES = [
  { value: 'school', label: 'School Team', description: 'High school or college team' },
  { value: 'club', label: 'Club Team', description: 'Local running club or track club' },
  { value: 'independent', label: 'Independent Coach', description: 'Private coaching business' },
  { value: 'other', label: 'Other', description: 'Other type of organization' }
];

export function TeamSetupModal({ isOpen, onClose, userRole }: TeamSetupModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    teamName: '',
    sport: 'track_and_field',
    division: 'varsity',
    season: 'spring',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [teamType, setTeamType] = useState<string>('school');
  const [createdTeam, setCreatedTeam] = useState<TeamCreationResponse | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

    setIsLoading(true);
    
    try {
      let response: TeamCreationResponse;

      if (userRole === 'coach' && teamType === 'independent') {
        // Create independent coach team
        const request: CreateIndependentCoachTeamRequest = {
          team_name: formData.teamName,
          team_description: formData.description || undefined
        };
        response = await createIndependentCoachTeam(request, user.id);
      } else {
        // Create regular team
        const request: CreateTeamRequest = {
          name: formData.teamName,
          description: formData.description || undefined,
          team_type: teamType as any
        };
        response = await createTeam(request, user.id);
      }

      setCreatedTeam(response);

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
        description: ''
      });
      onClose();
      
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error',
        description: 'Failed to create team. Please try again.',
        status: 'error',
        duration: 3000,
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
      description: ''
    });
    onClose();
  };

  const isIndependentCoach = userRole === 'coach' && teamType === 'independent';

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="lg">
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