import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerBody,
  DrawerCloseButton,
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
  Box,
  useColorModeValue,
  useBreakpointValue
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
        console.log('🔍 Looking up invite code:', code.toUpperCase());
        
        // Look up team by invite code - include is_active filter and better error handling
        const { data: team, error } = await supabase
          .from('teams')
          .select('id, name, description, team_type, invite_code, is_active')
          .eq('invite_code', code.toUpperCase().trim())
          .eq('is_active', true)
          .single();

        console.log('🔍 Team lookup result:', { team, error });

        if (error) {
          console.error('❌ Database error:', error);
          if (error.code === 'PGRST116') {
            // No rows found
            toast({
              title: 'Invalid Invite Code',
              description: 'No team found with this invite code.',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
          } else {
            // Other database error
            toast({
              title: 'Database Error',
              description: 'Failed to look up team. Please try again.',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
          }
          return;
        }

        if (!team) {
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

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Determine if we should show mobile (drawer) or desktop (modal) version
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Shared content component
  const FormContent = () => (
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
  );

  // Shared footer buttons
  const FooterButtons = () => (
    <>
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
    </>
  );

  // Only render one component based on screen size
  if (isMobile) {
    return (
      <Drawer
        isOpen={isOpen}
        placement="bottom"
        onClose={handleClose}
        size="md"
      >
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent 
          bg={bgColor} 
          borderTopRadius="xl"
          borderTopWidth="2px"
          borderTopColor={borderColor}
          maxH="90vh"
        >
          <DrawerHeader 
            borderBottomWidth="1px"
            borderColor={borderColor}
            fontSize="lg"
            fontWeight="bold"
            textAlign="center"
          >
            Join a Team
          </DrawerHeader>
          <DrawerCloseButton size="lg" />
          
          <DrawerBody py={6}>
            <FormContent />
          </DrawerBody>
          
          <DrawerFooter 
            borderTopWidth="1px"
            borderColor={borderColor}
            justifyContent="center"
            gap={3}
          >
            <FooterButtons />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Join a Team</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormContent />
        </ModalBody>
        <ModalFooter>
          <FooterButtons />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 