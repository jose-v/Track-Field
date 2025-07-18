import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Avatar,
  Box,
  Divider,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Icon,
  IconButton,
  Tooltip,
  Card,
  CardBody,
  Flex,
  useColorModeValue,
  Heading,
  Select,
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { FaUsers, FaPlus, FaTrash, FaUserMinus, FaArrowRight } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Team {
  id: string;
  name: string;
  team_type: string;
  athlete_count?: number;
  is_member?: boolean;
}

interface AthleteTeamManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    avatar_url?: string;
  } | null;
  onTeamChange?: () => void;
}

const AthleteTeamManagementDrawer: React.FC<AthleteTeamManagementDrawerProps> = ({
  isOpen,
  onClose,
  athlete,
  onTeamChange
}) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeams, setCurrentTeams] = useState<Team[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToTeam, setIsAddingToTeam] = useState(false);
  const [teamToRemove, setTeamToRemove] = useState<Team | null>(null);
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const cardBg = useColorModeValue('gray.50', 'gray.700');

  // Modal controls for confirmation
  const { isOpen: isRemoveOpen, onOpen: onRemoveOpen, onClose: onRemoveClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && athlete?.id && user?.id) {
      fetchTeamData();
    }
  }, [isOpen, athlete?.id, user?.id]);

  const fetchTeamData = async () => {
    setIsLoading(true);
    try {
      // Get all teams where this coach has management permissions
      const { data: coachTeams, error: coachTeamsError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner(id, name, team_type, is_active)
        `)
        .eq('user_id', user?.id)
        .in('role', ['coach', 'manager'])
        .eq('status', 'active')
        .eq('teams.is_active', true);

      if (coachTeamsError) throw coachTeamsError;

      const managedTeams = coachTeams?.map(ct => ct.teams).filter(Boolean) || [];

      // Get current team memberships for the athlete
      const { data: athleteTeams, error: athleteTeamsError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner(id, name, team_type)
        `)
        .eq('user_id', athlete?.id)
        .eq('role', 'athlete')
        .eq('status', 'active')
        .in('team_id', managedTeams.map(t => t.id));

      if (athleteTeamsError) throw athleteTeamsError;

      const currentTeamIds = new Set(athleteTeams?.map(at => at.team_id) || []);
      const currentTeamData = athleteTeams?.map(at => at.teams).filter(Boolean) || [];
      
      // Filter available teams (teams the coach manages but athlete isn't in)
      const availableTeamData = managedTeams.filter(team => !currentTeamIds.has(team.id));

      // Get athlete counts for all teams
      const allTeamIds = managedTeams.map(t => t.id);
      const teamCounts = await Promise.all(
        allTeamIds.map(async (teamId) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId)
            .eq('role', 'athlete')
            .eq('status', 'active');
          return { teamId, count: count || 0 };
        })
      );

      const countsMap = new Map(teamCounts.map(tc => [tc.teamId, tc.count]));

      // Add counts to team data
      const enrichedCurrentTeams = currentTeamData.map(team => ({
        ...team,
        athlete_count: countsMap.get(team.id) || 0,
        is_member: true
      }));

      const enrichedAvailableTeams = availableTeamData.map(team => ({
        ...team,
        athlete_count: countsMap.get(team.id) || 0,
        is_member: false
      }));

      setCurrentTeams(enrichedCurrentTeams);
      setAvailableTeams(enrichedAvailableTeams);
      setTeams([...enrichedCurrentTeams, ...enrichedAvailableTeams]);

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team information',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToTeam = async () => {
    if (!selectedTeamToAdd || !athlete?.id) return;

    setIsAddingToTeam(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .upsert({
          team_id: selectedTeamToAdd,
          user_id: athlete.id,
          role: 'athlete',
          status: 'active',
          joined_at: new Date().toISOString()
        }, { 
          onConflict: 'team_id,user_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      const selectedTeam = availableTeams.find(t => t.id === selectedTeamToAdd);
      toast({
        title: 'Athlete Added!',
        description: `${athlete.first_name} ${athlete.last_name} has been added to ${selectedTeam?.name}`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      setSelectedTeamToAdd('');
      await fetchTeamData(); // Refresh data
      onTeamChange?.(); // Notify parent of changes

    } catch (error) {
      console.error('Error adding athlete to team:', error);
      toast({
        title: 'Error',
        description: 'Failed to add athlete to team',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAddingToTeam(false);
    }
  };

  const handleRemoveFromTeam = (team: Team) => {
    setTeamToRemove(team);
    onRemoveOpen();
  };

  const confirmRemoveFromTeam = async () => {
    if (!teamToRemove || !athlete?.id) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'inactive' })
        .eq('team_id', teamToRemove.id)
        .eq('user_id', athlete.id)
        .eq('role', 'athlete');

      if (error) throw error;

      toast({
        title: 'Athlete Removed',
        description: `${athlete.first_name} ${athlete.last_name} has been removed from ${teamToRemove.name}`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      await fetchTeamData(); // Refresh data
      onTeamChange?.(); // Notify parent of changes
      onRemoveClose();

    } catch (error) {
      console.error('Error removing athlete from team:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove athlete from team',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTeamToRemove(null);
    }
  };

  const handleClose = () => {
    setSelectedTeamToAdd('');
    setTeamToRemove(null);
    onClose();
  };

  if (!athlete) return null;

  return (
    <>
      <Drawer isOpen={isOpen} placement="right" onClose={handleClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg={bgColor} color={textColor}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
            <VStack align="start" spacing={2}>
              <HStack spacing={3}>
                <Avatar 
                  size="md" 
                  name={`${athlete.first_name} ${athlete.last_name}`} 
                  src={athlete.avatar_url}
                />
                <Box>
                  <Heading size="md">{`${athlete.first_name} ${athlete.last_name}`}</Heading>
                  <Text fontSize="sm" color="gray.500">{athlete.email}</Text>
                </Box>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Manage team memberships for this athlete
              </Text>
            </VStack>
          </DrawerHeader>

          <DrawerBody>
            {isLoading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="lg" color="blue.500" />
              </Flex>
            ) : (
              <VStack spacing={6} align="stretch">
                
                {/* Current Teams Section */}
                <Box>
                  <HStack mb={4}>
                    <Icon as={FaUsers} color="green.500" />
                    <Heading size="sm">Current Teams ({currentTeams.length})</Heading>
                  </HStack>
                  
                  {currentTeams.length === 0 ? (
                    <Card bg={cardBg}>
                      <CardBody>
                        <Text color="gray.500" textAlign="center">
                          Not a member of any teams yet
                        </Text>
                      </CardBody>
                    </Card>
                  ) : (
                    <VStack spacing={3}>
                      {currentTeams.map(team => (
                        <Card key={team.id} bg={cardBg} w="100%">
                          <CardBody>
                            <Flex justify="space-between" align="center">
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <Text fontWeight="medium">{team.name}</Text>
                                  <Badge colorScheme="green" size="sm">Member</Badge>
                                </HStack>
                                <Text fontSize="xs" color="gray.500">
                                  {team.athlete_count} athletes • {team.team_type}
                                </Text>
                              </VStack>
                              <Tooltip label="Remove from team">
                                <IconButton
                                  icon={<FaUserMinus />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  aria-label="Remove from team"
                                  onClick={() => handleRemoveFromTeam(team)}
                                />
                              </Tooltip>
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </Box>

                <Divider />

                {/* Add to Team Section */}
                <Box>
                  <HStack mb={4}>
                    <Icon as={FaPlus} color="blue.500" />
                    <Heading size="sm">Add to Team</Heading>
                  </HStack>
                  
                  {availableTeams.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Text fontSize="sm">
                        This athlete is already a member of all your teams, or you don't manage any other teams.
                      </Text>
                    </Alert>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel fontSize="sm">Select Team</FormLabel>
                        <Select
                          placeholder="Choose a team to add athlete to..."
                          value={selectedTeamToAdd}
                          onChange={(e) => setSelectedTeamToAdd(e.target.value)}
                        >
                          {availableTeams.map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name} ({team.athlete_count} athletes)
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <Button
                        leftIcon={<FaPlus />}
                        colorScheme="blue"
                        onClick={handleAddToTeam}
                        isLoading={isAddingToTeam}
                        loadingText="Adding..."
                        isDisabled={!selectedTeamToAdd}
                        size="sm"
                      >
                        Add to Selected Team
                      </Button>
                    </VStack>
                  )}
                </Box>

                {/* Available Teams Preview */}
                {availableTeams.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={3} color="gray.600">Available Teams</Heading>
                    <VStack spacing={2}>
                      {availableTeams.map(team => (
                        <Card key={team.id} bg={cardBg} w="100%" variant="outline">
                          <CardBody py={3}>
                            <Flex justify="space-between" align="center">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium" fontSize="sm">{team.name}</Text>
                                <Text fontSize="xs" color="gray.500">
                                  {team.athlete_count} athletes • {team.team_type}
                                </Text>
                              </VStack>
                              <Icon as={FaArrowRight} color="gray.400" />
                            </Flex>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" borderColor={borderColor}>
            <Button variant="outline" mr={3} onClick={handleClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        isOpen={isRemoveOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRemoveClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove from Team
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove{' '}
              <strong>{athlete.first_name} {athlete.last_name}</strong> from{' '}
              <strong>{teamToRemove?.name}</strong>?
              <br /><br />
              <Text fontSize="sm" color="gray.600">
                This will deactivate their membership but won't delete any historical data.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onRemoveClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmRemoveFromTeam} ml={3}>
                Remove from Team
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default AthleteTeamManagementDrawer; 