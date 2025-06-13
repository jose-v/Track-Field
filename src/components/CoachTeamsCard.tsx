import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Flex,
  IconButton,
  Tooltip,
  useColorModeValue,
  Skeleton,
  SkeletonText,
  Box,
  Button,
  useDisclosure,
  useToast,
  Avatar,
  AvatarGroup,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Collapse,
  useDisclosure as useCollapseDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react';
import { 
  FaUsers, 
  FaPlus, 
  FaChevronDown, 
  FaChevronUp, 
  FaCog, 
  FaUserPlus,
  FaEye,
  FaCode,
  FaTrash,
  FaSchool,
  FaRunning,
  FaUserTie,
  FaBullseye,
  FaUserMinus
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CreateTeamModal } from './CreateTeamModal';
import { SendTeamInviteModal } from './SendTeamInviteModal';
import { ensureCoachHasTeam } from '../services/autoCreateCoachTeam';

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: 'athlete' | 'coach' | 'team_manager';
  joined_at: string;
  email?: string;
}

interface CoachTeam {
  id: string;
  name: string;
  description?: string;
  team_type: 'school' | 'club' | 'coach' | 'independent';
  invite_code: string;
  created_at: string;
  members: TeamMember[];
  member_count: number;
  athlete_count: number;
  coach_count: number;
  logo_url?: string;
  institution_name?: string;
  institution_type?: string;
}

interface CoachTeamsCardProps {
  maxTeamsToShow?: number;
}

export const CoachTeamsCard: React.FC<CoachTeamsCardProps> = ({ maxTeamsToShow = 10 }) => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  // New state for additional functionality
  const { isOpen: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isRemoveAthleteOpen, onOpen: onRemoveAthleteOpen, onClose: onRemoveAthleteClose } = useDisclosure();
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<{ id: string; name: string } | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<CoachTeam | null>(null);
  const [athleteToRemove, setAthleteToRemove] = useState<{ id: string; name: string; teamId: string; teamName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingAthlete, setIsRemovingAthlete] = useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');
  const cardShadow = useColorModeValue('sm', 'md');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch coach's teams
  const { data: teams, isLoading, refetch } = useQuery<CoachTeam[]>({
    queryKey: ['coach-teams', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        // Auto-create team for new coaches (only if they have athletes but no teams)
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          const coachName = `${profile.first_name} ${profile.last_name}`;
          await ensureCoachHasTeam(user.id, coachName);
        }
        // Get teams where user is a coach
        const { data: coachMemberships, error: membershipsError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('role', 'coach')
          .eq('status', 'active');

        if (membershipsError) throw membershipsError;
        if (!coachMemberships || coachMemberships.length === 0) return [];

        const teamIds = coachMemberships.map(m => m.team_id);

        // Get team details with institutional info
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select(`
            id, 
            name, 
            description, 
            team_type, 
            invite_code, 
            created_at,
            logo_url,
            institution_name,
            institution_type
          `)
          .in('id', teamIds);

        if (teamsError) throw teamsError;

        // Get all team members for all teams in one query
        const { data: allTeamMembers, error: allMembersError } = await supabase
          .from('team_members')
          .select(`
            team_id,
            user_id,
            role,
            joined_at
          `)
          .in('team_id', teamIds)
          .eq('status', 'active');

        if (allMembersError) throw allMembersError;

        // Get all profile details for all members in one query
        const allMemberIds = [...new Set(allTeamMembers?.map(m => m.user_id) || [])];
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, email')
          .in('id', allMemberIds);

        if (allProfilesError) throw allProfilesError;

        // Build teams with their members
        const teams = teamsData?.map(teamData => {
          const teamMembers = allTeamMembers?.filter(m => m.team_id === teamData.id) || [];
          
          const members: TeamMember[] = teamMembers.map((member: any) => {
            const profile = allProfiles?.find(p => p.id === member.user_id);
            return {
              id: member.user_id,
              first_name: profile?.first_name || 'Unknown',
              last_name: profile?.last_name || 'User',
              avatar_url: profile?.avatar_url,
              email: profile?.email,
              role: member.role,
              joined_at: member.joined_at
            };
          });

          const athleteCount = members.filter(m => m.role === 'athlete').length;
          const coachCount = members.filter(m => m.role === 'coach').length;

          return {
            id: teamData.id,
            name: teamData.name,
            description: teamData.description,
            team_type: teamData.team_type,
            invite_code: teamData.invite_code,
            created_at: teamData.created_at,
            members,
            member_count: members.length,
            athlete_count: athleteCount,
            coach_count: coachCount,
            logo_url: teamData.logo_url,
            institution_name: teamData.institution_name,
            institution_type: teamData.institution_type
          } as CoachTeam;
        }) || [];

        return teams;
      } catch (error) {
        console.error('Error fetching coach teams:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  const toggleTeamExpansion = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  const copyInviteCode = (inviteCode: string, teamName: string) => {
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: 'Invite Code Copied!',
      description: `Invite code for ${teamName} copied to clipboard`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Handle opening invite modal for a specific team
  const handleInviteAthlete = (team: { id: string; name: string }) => {
    setSelectedTeamForInvite(team);
    onInviteOpen();
  };

  // Handle opening delete confirmation for a team
  const handleDeleteTeam = (team: CoachTeam) => {
    setTeamToDelete(team);
    onDeleteOpen();
  };

  // Handle confirming team deletion
  const confirmDeleteTeam = async () => {
    if (!teamToDelete || !user?.id) return;

    setIsDeleting(true);
    try {
      // First, remove all team members
      const { error: membersError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamToDelete.id);

      if (membersError) throw membersError;

      // Then delete the team
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamToDelete.id)
        .eq('created_by', user.id); // Ensure only creator can delete

      if (teamError) throw teamError;

      toast({
        title: 'Team Deleted',
        description: `${teamToDelete.name} has been deleted successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      refetch(); // Refresh teams list
      onDeleteClose();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: 'Error Deleting Team',
        description: 'Failed to delete the team. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setTeamToDelete(null);
    }
  };

  // Handle removing athlete from team
  const handleRemoveAthlete = async (athleteId: string, athleteName: string, teamId: string, teamName: string) => {
    try {
      setIsRemovingAthlete(true);
      
      // Remove from team_members
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'inactive' })
        .eq('team_id', teamId)
        .eq('user_id', athleteId)
        .eq('status', 'active');

      if (error) throw error;

      toast({
        title: 'Athlete Removed',
        description: `${athleteName} has been removed from ${teamName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      refetch(); // Refresh teams list
      setAthleteToRemove(null);
    } catch (error) {
      console.error('Error removing athlete:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove athlete from team',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRemovingAthlete(false);
    }
  };

  const getTeamTypeIcon = (teamType: string) => {
    switch (teamType) {
      case 'school': return FaSchool;
      case 'club': return FaRunning;
      case 'coach': return FaUserTie;
      default: return FaBullseye;
    }
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

  if (isLoading) {
    return (
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow={cardShadow}>
        <CardHeader pb={3}>
          <HStack spacing={3}>
            <Icon as={FaUsers} boxSize={5} color="blue.500" />
            <Skeleton height="24px" width="120px" />
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            {[1, 2].map((i) => (
              <Box key={i}>
                <Skeleton height="20px" width="80%" mb={2} />
                <SkeletonText mt="2" noOfLines={3} spacing="2" skeletonHeight="2" />
              </Box>
            ))}
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow={cardShadow}>
        <CardHeader pb={3}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Icon as={FaUsers} boxSize={5} color="blue.500" />
              <Heading size="md" color={headingColor}>My Teams</Heading>
            </HStack>
            <Tooltip label="Create a team" hasArrow>
              <IconButton
                aria-label="Create team"
                icon={<FaPlus />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={onCreateOpen}
              />
            </Tooltip>
          </Flex>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={4} align="center" py={6}>
            <Icon as={FaUsers} boxSize={12} color="gray.400" />
            <Text color={textColor} textAlign="center">
              You haven't created any teams yet
            </Text>
            <Text fontSize="sm" color={textColor} textAlign="center">
              Create your first team to start managing athletes
            </Text>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              variant="outline"
              size="sm"
              onClick={onCreateOpen}
            >
              Create Team
            </Button>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow={cardShadow}>
        <CardHeader pb={3}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Icon as={FaUsers} boxSize={5} color="blue.500" />
              <Heading size="md" color={headingColor}>My Teams</Heading>
              <Badge colorScheme="blue" variant="subtle">
                {teams.length}
              </Badge>
            </HStack>
            <Tooltip label="Create a team" hasArrow>
              <IconButton
                aria-label="Create team"
                icon={<FaPlus />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={onCreateOpen}
              />
            </Tooltip>
          </Flex>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            {teams.map((team) => {
              const isExpanded = expandedTeams.has(team.id);
              const athletes = team.members.filter(m => m.role === 'athlete');
              const coaches = team.members.filter(m => m.role === 'coach');

              return (
                <Box key={team.id} borderRadius="md" border="1px" borderColor={borderColor}>
                  {/* Team Header */}
                  <Box
                    p={4}
                    cursor="pointer"
                    _hover={{ bg: hoverBg }}
                    onClick={() => toggleTeamExpansion(team.id)}
                  >
                    <Flex justify="space-between" align="center">
                      <HStack spacing={3} flex="1">
                        {/* Team/Institution Avatar */}
                        <Avatar
                          size="md"
                          src={team.logo_url}
                          name={team.institution_name || team.name}
                          bg="blue.500"
                          icon={<Icon as={FaUsers} />}
                        />
                        <VStack spacing={2} align="start" flex="1">
                          <HStack spacing={3} flexWrap="wrap">
                            <HStack spacing={2}>
                              <Icon as={getTeamTypeIcon(team.team_type)} color="blue.500" />
                              <Text fontSize="lg" fontWeight="bold" color={headingColor}>
                                {team.name}
                              </Text>
                            </HStack>
                            <Badge colorScheme={getTeamTypeColor(team.team_type)} size="sm">
                              {getTeamTypeLabel(team.team_type)}
                            </Badge>
                          </HStack>
                          {team.institution_name && team.institution_name !== team.name && (
                            <Text fontSize="sm" color={textColor} fontWeight="medium">
                              {team.institution_name}
                            </Text>
                          )}
                          <HStack spacing={4} fontSize="sm" color={textColor}>
                            <Text>{team.athlete_count} athletes</Text>
                            <Text>{team.coach_count} coaches</Text>
                            <Text>Code: {team.invite_code}</Text>
                          </HStack>
                        </VStack>
                      </HStack>
                      <HStack spacing={2}>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FaCog />}
                            size="sm"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <MenuList>
                            <MenuItem 
                              icon={<FaCode />}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyInviteCode(team.invite_code, team.name);
                              }}
                            >
                              Copy Invite Code
                            </MenuItem>
                            <MenuItem 
                              icon={<FaUserPlus />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInviteAthlete({ id: team.id, name: team.name });
                              }}
                            >
                              Add Athlete
                            </MenuItem>
                            <MenuItem icon={<FaEye />}>
                              View Details
                            </MenuItem>
                            <MenuItem 
                              icon={<FaTrash />}
                              color="red.500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTeam(team);
                              }}
                            >
                              Delete Team
                            </MenuItem>
                          </MenuList>
                        </Menu>
                        <IconButton
                          icon={isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          size="sm"
                          variant="ghost"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        />
                      </HStack>
                    </Flex>
                  </Box>

                  {/* Team Members - Collapsible */}
                  <Collapse in={isExpanded}>
                    <Box px={4} pb={4}>
                      <Divider mb={4} />
                      
                      {/* Athletes Section */}
                      {athletes.length > 0 && (
                        <VStack spacing={3} align="stretch" mb={4}>
                          <HStack spacing={2}>
                            <Icon as={FaRunning} color="green.500" />
                            <Text fontSize="sm" fontWeight="bold" color={headingColor}>
                              Athletes ({athletes.length})
                            </Text>
                          </HStack>
                          <VStack spacing={2} align="stretch">
                            {athletes.map((athlete) => (
                              <Flex key={athlete.id} justify="space-between" align="center" p={2} borderRadius="md" bg={hoverBg}>
                                <HStack spacing={3}>
                                  <Avatar
                                    size="sm"
                                    name={`${athlete.first_name} ${athlete.last_name}`}
                                    src={athlete.avatar_url}
                                  />
                                  <VStack spacing={0} align="start">
                                    <Text fontSize="sm" fontWeight="medium">
                                      {athlete.first_name} {athlete.last_name}
                                    </Text>
                                    <Text fontSize="xs" color={textColor}>
                                      Joined {new Date(athlete.joined_at).toLocaleDateString()}
                                    </Text>
                                  </VStack>
                                </HStack>
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<FaCog />}
                                    size="xs"
                                    variant="ghost"
                                  />
                                  <MenuList>
                                    <MenuItem icon={<FaEye />}>View Profile</MenuItem>
                                    <MenuItem 
                                      icon={<FaUserMinus />} 
                                      color="red.500"
                                      onClick={() => {
                                        setAthleteToRemove({
                                          id: athlete.id,
                                          name: `${athlete.first_name} ${athlete.last_name}`,
                                          teamId: team.id,
                                          teamName: team.name
                                        });
                                        onRemoveAthleteOpen();
                                      }}
                                    >
                                      Remove from Team
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Flex>
                            ))}
                          </VStack>
                        </VStack>
                      )}

                      {/* Coaches Section */}
                      {coaches.length > 1 && (
                        <VStack spacing={3} align="stretch">
                          <HStack spacing={2}>
                            <Icon as={FaUserTie} color="purple.500" />
                            <Text fontSize="sm" fontWeight="bold" color={headingColor}>
                              Coaches ({coaches.length})
                            </Text>
                          </HStack>
                          <VStack spacing={2} align="stretch">
                            {coaches.map((coach) => (
                              <Flex key={coach.id} justify="space-between" align="center" p={2} borderRadius="md" bg={hoverBg}>
                                <HStack spacing={3}>
                                  <Avatar
                                    size="sm"
                                    name={`${coach.first_name} ${coach.last_name}`}
                                    src={coach.avatar_url}
                                  />
                                  <VStack spacing={0} align="start">
                                    <Text fontSize="sm" fontWeight="medium">
                                      {coach.first_name} {coach.last_name}
                                      {coach.id === user?.id && (
                                        <Badge ml={2} size="xs" colorScheme="blue">You</Badge>
                                      )}
                                    </Text>
                                    <Text fontSize="xs" color={textColor}>
                                      Joined {new Date(coach.joined_at).toLocaleDateString()}
                                    </Text>
                                  </VStack>
                                </HStack>
                              </Flex>
                            ))}
                          </VStack>
                        </VStack>
                      )}

                      {team.members.length === 0 && (
                        <Text fontSize="sm" color={textColor} textAlign="center" py={4}>
                          No members yet. Share the invite code to add athletes.
                        </Text>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
          </VStack>
        </CardBody>
      </Card>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onTeamCreated={() => {
          refetch();
          onCreateClose();
        }}
      />

      {/* Send Team Invite Modal */}
      {selectedTeamForInvite && (
        <SendTeamInviteModal
          isOpen={isInviteOpen}
          onClose={() => {
            onInviteClose();
            setSelectedTeamForInvite(null);
          }}
          teamId={selectedTeamForInvite.id}
          teamName={selectedTeamForInvite.name}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Delete Team Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Team
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  Are you sure you want to delete <strong>{teamToDelete?.name}</strong>? 
                  This will remove all team members and cannot be undone.
                </Text>
                
                {/* Buttons in content area instead of footer */}
                <HStack spacing={3} justify="flex-end" pt={4}>
                  <Button ref={cancelRef} onClick={onDeleteClose}>
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="red" 
                    onClick={confirmDeleteTeam}
                    isLoading={isDeleting}
                    loadingText="Deleting..."
                  >
                    Delete Team
                  </Button>
                </HStack>
              </VStack>
            </AlertDialogBody>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Remove Athlete Confirmation Dialog */}
      {athleteToRemove && (
        <AlertDialog
          isOpen={isRemoveAthleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onRemoveAthleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Remove Athlete
              </AlertDialogHeader>

              <AlertDialogBody>
                <VStack spacing={4} align="stretch">
                  <Text>
                    Are you sure you want to remove <strong>{athleteToRemove.name}</strong> from <strong>{athleteToRemove.teamName}</strong>? 
                    This will remove the athlete from the team and cannot be undone.
                  </Text>
                  
                  {/* Buttons in content area instead of footer */}
                  <HStack spacing={3} justify="flex-end" pt={4}>
                    <Button ref={cancelRef} onClick={onRemoveAthleteClose}>
                      Cancel
                    </Button>
                    <Button 
                      colorScheme="red" 
                      onClick={() => {
                        handleRemoveAthlete(
                          athleteToRemove.id,
                          athleteToRemove.name,
                          athleteToRemove.teamId,
                          athleteToRemove.teamName
                        );
                        onRemoveAthleteClose();
                      }}
                      isLoading={isRemovingAthlete}
                      loadingText="Removing..."
                    >
                      Remove Athlete
                    </Button>
                  </HStack>
                </VStack>
              </AlertDialogBody>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </>
  );
};

export default CoachTeamsCard; 