import React, { useState } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
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
  AlertIcon,
  useColorModeValue,
  Icon,
  Box,
  Heading,
  Divider
} from '@chakra-ui/react';
import { FaUserFriends, FaKey, FaUsers } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreateTeamDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated?: () => void;
}

export const CreateTeamDrawer: React.FC<CreateTeamDrawerProps> = ({
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

  // Color mode values for better readability
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const drawerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

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

  const getTeamTypeIcon = (type: string) => {
    switch (type) {
      case 'coach':
        return FaUsers;
      case 'club':
        return FaUserFriends;
      default:
        return FaUsers;
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={handleClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg={drawerBg} borderColor={borderColor}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
          <VStack align="start" spacing={2}>
            <HStack spacing={3}>
              <Box
                p={2}
                borderRadius="lg"
                bg="blue.900"
                color="blue.300"
              >
                <Icon as={FaUserFriends} boxSize={5} />
              </Box>
              <VStack align="start" spacing={0}>
                <Heading size="md">Create New Team</Heading>
                <Text fontSize="sm" color={textColor}>
                  Build your coaching team and invite athletes
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={6} align="stretch">
            
            {/* Team Details Section */}
            <Box>
              <Heading size="sm" mb={4} color={textColor}>Team Details</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Team Name</FormLabel>
                  <Input
                    placeholder="Enter team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    maxLength={50}
                    size="md"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Textarea
                    placeholder="Optional team description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                    rows={3}
                    size="sm"
                  />
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* Team Type Section */}
            <Box>
              <Heading size="sm" mb={4} color={textColor}>Team Type</Heading>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <Select
                    value={teamType}
                    onChange={(e) => setTeamType(e.target.value as 'club' | 'coach')}
                    icon={<Icon as={getTeamTypeIcon(teamType)} />}
                  >
                    <option value="coach">Coach Team</option>
                    <option value="club">Club Team</option>
                  </Select>
                </FormControl>

                <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                  <HStack spacing={3} mb={2}>
                    <Icon as={getTeamTypeIcon(teamType)} color="blue.500" />
                    <Text fontSize="sm" fontWeight="medium">
                      {teamType === 'coach' ? 'Coach Team' : 'Club Team'}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color={textColor}>
                    {getTeamTypeDescription(teamType)}
                  </Text>
                </Box>
              </VStack>
            </Box>

            <Divider />

            {/* What Happens Next Section */}
            <Box>
              <Heading size="sm" mb={4} color={textColor}>What Happens Next</Heading>
              <Alert status="info" borderRadius="md" bg={cardBg}>
                <AlertIcon />
                <VStack align="start" spacing={2} flex="1">
                  <Text fontSize="sm" fontWeight="medium">
                    After creating your team:
                  </Text>
                  <VStack align="start" spacing={1} pl={2}>
                    <HStack spacing={2}>
                      <Icon as={FaKey} color="blue.500" size="sm" />
                      <Text fontSize="sm" color={textColor}>
                        A unique 6-character invite code will be generated
                      </Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Icon as={FaUsers} color="green.500" size="sm" />
                      <Text fontSize="sm" color={textColor}>
                        You'll be added as the team coach automatically
                      </Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Icon as={FaUserFriends} color="purple.500" size="sm" />
                      <Text fontSize="sm" color={textColor}>
                        Share the invite code with athletes to join your team
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Alert>
            </Box>

          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" borderColor={borderColor}>
          <HStack spacing={3} w="100%" justify="flex-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateTeam}
              isLoading={isCreating}
              isDisabled={!teamName.trim()}
              loadingText="Creating..."
              leftIcon={<Icon as={FaUserFriends} />}
            >
              Create Team
            </Button>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}; 