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
  VStack,
  Text,
  useToast,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  HStack,
  Badge,
  Box
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamJoined?: () => void;
}

interface TeamPreview {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  member_count: number;
}

export const JoinTeamModal: React.FC<JoinTeamModalProps> = ({
  isOpen,
  onClose,
  onTeamJoined
}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teamPreview, setTeamPreview] = useState<TeamPreview | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const handleCodeChange = async (code: string) => {
    setInviteCode(code);
    setTeamPreview(null);

    if (code.length >= 6) {
      setIsLoading(true);
      try {
        // Look up team by invite code
        const { data: team, error } = await supabase
          .from('teams')
          .select('id, name, description, team_type, invite_code')
          .eq('invite_code', code.toUpperCase())
          .single();

        if (error || !team) {
          toast({
            title: 'Invalid Invite Code',
            description: 'No team found with this invite code.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // Get member count
        const { count: memberCount } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)
          .eq('status', 'active');

        // Check if user is already a member
        const { data: existingMembership } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', team.id)
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .single();

        if (existingMembership) {
          toast({
            title: 'Already a Member',
            description: `You're already a member of ${team.name}.`,
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        setTeamPreview({
          id: team.id,
          name: team.name,
          description: team.description,
          team_type: team.team_type,
          member_count: memberCount || 0
        });

      } catch (error) {
        console.error('Error looking up team:', error);
        toast({
          title: 'Error',
          description: 'Failed to look up team. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleJoinTeam = async () => {
    if (!teamPreview || !user?.id) return;

    setIsJoining(true);
    try {
      // Add user to team_members using UPSERT to handle reactivating inactive members
      const { error: memberError } = await supabase
        .from('team_members')
        .upsert({
          team_id: teamPreview.id,
          user_id: user.id,
          role: 'athlete', // Default role for invite code joins
          status: 'active',
          joined_at: new Date().toISOString()
        }, {
          onConflict: 'team_id,user_id',
          ignoreDuplicates: false  // Allow updating inactive records to active
        });

      if (memberError) throw memberError;

      // For club teams, also update legacy athletes.team_id if user doesn't have one
      if (teamPreview.team_type === 'club') {
        const { data: athlete } = await supabase
          .from('athletes')
          .select('team_id')
          .eq('id', user.id)
          .single();

        if (athlete && !athlete.team_id) {
          await supabase
            .from('athletes')
            .update({ team_id: teamPreview.id })
            .eq('id', user.id);
        }
      }

      toast({
        title: 'Joined Team Successfully!',
        description: `Welcome to ${teamPreview.name}!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onTeamJoined?.();
      onClose();
      setInviteCode('');
      setTeamPreview(null);

    } catch (error) {
      console.error('Error joining team:', error);
      toast({
        title: 'Error Joining Team',
        description: 'Failed to join the team. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setTeamPreview(null);
    onClose();
  };

  const getTeamTypeLabel = (teamType: string) => {
    switch (teamType) {
      case 'school': return 'School Team';
      case 'club': return 'Club Team';
      case 'coach': return 'Coach Team';
      default: return 'Team';
    }
  };

  const getTeamTypeColor = (teamType: string) => {
    switch (teamType) {
      case 'school': return 'blue';
      case 'club': return 'green';
      case 'coach': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Join a Team</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Invite Code</FormLabel>
              <Input
                placeholder="Enter 6-character invite code"
                value={inviteCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                textTransform="uppercase"
                maxLength={6}
                isDisabled={isLoading || isJoining}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Ask your coach or team manager for the invite code
              </Text>
            </FormControl>

            {teamPreview && (
              <Box>
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <VStack align="start" spacing={2} flex="1">
                    <HStack spacing={2}>
                      <Text fontWeight="bold">{teamPreview.name}</Text>
                      <Badge colorScheme={getTeamTypeColor(teamPreview.team_type)}>
                        {getTeamTypeLabel(teamPreview.team_type)}
                      </Badge>
                    </HStack>
                    {teamPreview.description && (
                      <Text fontSize="sm">{teamPreview.description}</Text>
                    )}
                    <Text fontSize="sm" color="gray.600">
                      {teamPreview.member_count} member{teamPreview.member_count !== 1 ? 's' : ''}
                    </Text>
                  </VStack>
                </Alert>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleJoinTeam}
            isLoading={isJoining}
            isDisabled={!teamPreview || isLoading}
          >
            Join Team
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 