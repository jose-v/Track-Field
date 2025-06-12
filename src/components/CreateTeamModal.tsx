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
  Input,
  Textarea,
  VStack,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Text,
  HStack,
  Badge,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated?: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onTeamCreated
}) => {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [teamType, setTeamType] = useState<'club' | 'coach'>('coach');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !user?.id) return;

    setIsCreating(true);
    try {
      const inviteCode = generateInviteCode();

      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName.trim(),
          description: description.trim() || null,
          team_type: teamType,
          invite_code: inviteCode,
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as team manager/coach
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'coach',
          status: 'active',
          joined_at: new Date().toISOString()
        });

      if (memberError) throw memberError;

      toast({
        title: 'Team Created Successfully!',
        description: `${teamName} has been created with invite code: ${inviteCode}`,
        status: 'success',
        duration: 8000,
        isClosable: true,
      });

      onTeamCreated?.();
      handleClose();

    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error Creating Team',
        description: 'Failed to create the team. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setTeamName('');
    setDescription('');
    setTeamType('coach');
    onClose();
  };

  const getTeamTypeDescription = (type: string) => {
    switch (type) {
      case 'coach':
        return 'A team you manage as a coach. You can add athletes and manage workouts.';
      case 'club':
        return 'An open club team that athletes can join using the invite code.';
      default:
        return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Team</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Team Name</FormLabel>
              <Input
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={50}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="Optional team description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Team Type</FormLabel>
              <Select
                value={teamType}
                onChange={(e) => setTeamType(e.target.value as 'club' | 'coach')}
              >
                <option value="coach">Coach Team</option>
                <option value="club">Club Team</option>
              </Select>
              <Text fontSize="sm" color="gray.500" mt={2}>
                {getTeamTypeDescription(teamType)}
              </Text>
            </FormControl>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1} flex="1">
                <Text fontSize="sm" fontWeight="bold">
                  What happens next:
                </Text>
                <Text fontSize="sm">
                  • A unique 6-character invite code will be generated
                  • You'll be added as the team coach automatically
                  • Share the invite code with athletes to join your team
                </Text>
              </VStack>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleCreateTeam}
            isLoading={isCreating}
            isDisabled={!teamName.trim()}
          >
            Create Team
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 