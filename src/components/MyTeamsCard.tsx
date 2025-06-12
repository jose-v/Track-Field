import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  AvatarGroup,
  Button,
  Badge,
  Icon,
  Divider,
  useColorModeValue,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
  Skeleton,
  SkeletonText,
  Flex,
  Tooltip,
  IconButton
} from '@chakra-ui/react';
import { FaUsers, FaSignOutAlt, FaUserFriends, FaCrown, FaPlus } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { JoinTeamModal } from './JoinTeamModal';

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: 'athlete' | 'coach' | 'team_manager';
}

interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: 'school' | 'club' | 'coach' | 'independent' | 'other';
  member_count: number;
  members: TeamMember[];
  created_at: string;
  user_role: 'athlete' | 'coach' | 'manager';
  joined_at: string;
  can_leave: boolean;
  logo_url?: string;
  institution_name?: string;
  institution_type?: string;
}

interface MyTeamsCardProps {
  maxTeamsToShow?: number;
}

export const MyTeamsCard: React.FC<MyTeamsCardProps> = ({ maxTeamsToShow = 3 }) => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isJoinOpen, onOpen: onJoinOpen, onClose: onJoinClose } = useDisclosure();
  const [teamToLeave, setTeamToLeave] = useState<Team | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');
  const cardShadow = useColorModeValue('sm', 'md');

  // Fetch user's teams using new team_members table
  const { data: teams, isLoading, refetch } = useQuery<Team[]>({
    queryKey: ['athlete-teams-v2', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
                // Get user's team memberships from team_members table
        const { data: memberships, error: membershipsError } = await supabase
          .from('team_members')
          .select(`
            team_id,
            role,
            joined_at
          `)
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (membershipsError) throw membershipsError;
        if (!memberships || memberships.length === 0) return [];

        // Get detailed team information with all members for each team
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select(`
            id, 
            name, 
            description, 
            team_type, 
            created_at,
            logo_url,
            institution_name,
            institution_type
          `)
          .in('id', memberships.map(m => m.team_id));

        if (teamsError) throw teamsError;

        // Get all team members for all teams in one query
        const { data: allTeamMembers, error: allMembersError } = await supabase
          .from('team_members')
          .select(`
            team_id,
            user_id,
            role
          `)
          .in('team_id', memberships.map(m => m.team_id))
          .eq('status', 'active');

        if (allMembersError) throw allMembersError;

        // Get all profile details for all members in one query
        const allMemberIds = [...new Set(allTeamMembers?.map(m => m.user_id) || [])];
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', allMemberIds);

        if (allProfilesError) throw allProfilesError;

        // Build teams with their members
        const teams = teamsData?.map(teamData => {
          const membership = memberships.find(m => m.team_id === teamData.id);
          const teamMembers = allTeamMembers?.filter(m => m.team_id === teamData.id) || [];
          
          const members: TeamMember[] = teamMembers.map((member: any) => {
            const profile = allProfiles?.find(p => p.id === member.user_id);
            return {
              id: member.user_id,
              first_name: profile?.first_name || 'Unknown',
              last_name: profile?.last_name || 'User',
              avatar_url: profile?.avatar_url,
              role: member.role as 'athlete' | 'coach' | 'team_manager'
            };
          });

          // Determine if user can leave this team based on team type
          const canLeave = teamData.team_type !== 'school';

          return {
            id: teamData.id,
            name: teamData.name,
            description: teamData.description,
            team_type: teamData.team_type,
            member_count: members.length,
            members,
            created_at: teamData.created_at,
            user_role: membership?.role,
            joined_at: membership?.joined_at,
            can_leave: canLeave,
            logo_url: teamData.logo_url,
            institution_name: teamData.institution_name,
            institution_type: teamData.institution_type
          } as Team;
        }) || [];

        return teams;
      } catch (error) {
        console.error('Error fetching teams:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  const handleLeaveTeam = async () => {
    if (!teamToLeave || !user?.id) return;

    setIsLeaving(true);
    try {
      // Update team_members status to inactive (soft delete)
      const { error: teamMembersError } = await supabase
        .from('team_members')
        .update({ status: 'inactive' })
        .eq('team_id', teamToLeave.id)
        .eq('user_id', user.id);

      if (teamMembersError) throw teamMembersError;

      // Legacy support: also clear athletes.team_id if this was their primary team
      const { error: athletesError } = await supabase
        .from('athletes')
        .update({ team_id: null })
        .eq('id', user.id)
        .eq('team_id', teamToLeave.id);

      // Don't throw on athletes error since it's legacy support
      if (athletesError) {
        console.warn('Could not update legacy athletes.team_id:', athletesError);
      }

      toast({
        title: 'Left Team Successfully',
        description: `You have left "${teamToLeave.name}"`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      refetch();
      onClose();
    } catch (error) {
      console.error('Error leaving team:', error);
      toast({
        title: 'Error Leaving Team',
        description: 'Failed to leave the team. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLeaving(false);
      setTeamToLeave(null);
    }
  };

  const openLeaveDialog = (team: Team) => {
    setTeamToLeave(team);
    onOpen();
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
                <SkeletonText mt="2" noOfLines={2} spacing="2" skeletonHeight="2" />
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
            <Tooltip label="Join a team" hasArrow>
              <IconButton
                aria-label="Join team"
                icon={<FaPlus />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={onJoinOpen}
              />
            </Tooltip>
          </Flex>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={4} align="center" py={6}>
            <Icon as={FaUserFriends} boxSize={12} color="gray.400" />
            <Text color={textColor} textAlign="center">
              You're not part of any teams yet
            </Text>
            <Text fontSize="sm" color={textColor} textAlign="center">
              Ask your coach or team manager for an invite code to join a team
            </Text>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              variant="outline"
              size="sm"
              onClick={onJoinOpen}
            >
              Join a Team
            </Button>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  // Group teams by type for display
  const institutionalTeams = teams?.filter(team => 
    team.team_type === 'school' || team.team_type === 'club'
  ) || [];
  
  const coachTeams = teams?.filter(team => 
    team.team_type === 'coach'
  ) || [];
  
  const otherTeams = teams?.filter(team => 
    team.team_type === 'independent' || team.team_type === 'other'
  ) || [];

  const getTeamTypeIcon = (teamType: string) => {
    switch (teamType) {
      case 'school': return '🏫';
      case 'club': return '🏃‍♀️';
      case 'coach': return '👨‍🏫';
      default: return '🎯';
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

  const renderTeamSection = (sectionTeams: Team[], title: string, icon: string) => {
    if (sectionTeams.length === 0) return null;

    return (
      <VStack spacing={3} align="stretch">
        <HStack spacing={2}>
          <Text fontSize="sm" fontWeight="bold" color={headingColor}>
            {icon} {title} ({sectionTeams.length})
          </Text>
        </HStack>
        {sectionTeams.map((team, index) => (
          <Box key={team.id}>
            <VStack spacing={3} align="stretch">
              <Flex justify="space-between" align="start">
                <HStack spacing={3} flex="1">
                  {/* Team/Institution Avatar */}
                  <Avatar
                    size="md"
                    src={team.logo_url}
                    name={team.institution_name || team.name}
                    bg="blue.500"
                    icon={<Icon as={FaUsers} />}
                  />
                  <VStack spacing={1} align="start" flex="1">
                    <HStack spacing={2} flexWrap="wrap">
                      <Heading size="sm" color={headingColor}>
                        {team.name}
                      </Heading>
                      <Badge 
                        colorScheme={team.team_type === 'school' ? 'blue' : team.team_type === 'coach' ? 'purple' : 'green'} 
                        size="sm"
                      >
                        {getTeamTypeLabel(team.team_type)}
                      </Badge>
                    </HStack>
                    {team.institution_name && team.institution_name !== team.name && (
                      <Text fontSize="sm" color={textColor} fontWeight="medium">
                        {team.institution_name}
                      </Text>
                    )}
                    {team.description && (
                      <Text fontSize="sm" color={textColor} noOfLines={2}>
                        {team.description}
                      </Text>
                    )}
                    <Text fontSize="xs" color={textColor}>
                      Joined as {team.user_role} • {new Date(team.joined_at).toLocaleDateString()}
                    </Text>
                  </VStack>
                </HStack>
                {team.can_leave ? (
                  <Tooltip label="Leave Team" hasArrow>
                    <IconButton
                      aria-label="Leave team"
                      icon={<FaSignOutAlt />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => openLeaveDialog(team)}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip label="Cannot leave school teams" hasArrow>
                    <IconButton
                      aria-label="Cannot leave team"
                      icon={<FaSignOutAlt />}
                      size="sm"
                      variant="ghost"
                      colorScheme="gray"
                      isDisabled
                    />
                  </Tooltip>
                )}
              </Flex>

              <HStack spacing={3} justify="space-between">
                <HStack spacing={2}>
                  <AvatarGroup size="sm" max={4}>
                    {team.members.map((member) => (
                      <Tooltip
                        key={member.id}
                        label={`${member.first_name} ${member.last_name} (${member.role})`}
                        hasArrow
                      >
                        <Avatar
                          name={`${member.first_name} ${member.last_name}`}
                          src={member.avatar_url}
                          size="sm"
                        />
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                  <Text fontSize="sm" color={textColor}>
                    {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                  </Text>
                </HStack>
              </HStack>
            </VStack>
            {index < sectionTeams.length - 1 && <Divider mt={3} />}
          </Box>
        ))}
      </VStack>
    );
  };

  return (
    <>
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow={cardShadow}>
        <CardHeader pb={3}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Icon as={FaUsers} boxSize={5} color="blue.500" />
              <Heading size="md" color={headingColor}>My Teams</Heading>
              <Badge colorScheme="blue" variant="subtle">
                {teams?.length || 0}
              </Badge>
            </HStack>
            <Tooltip label="Join a team" hasArrow>
              <IconButton
                aria-label="Join team"
                icon={<FaPlus />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={onJoinOpen}
              />
            </Tooltip>
          </Flex>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={6} align="stretch">
            {renderTeamSection(institutionalTeams, "Institutional Teams", "🏫")}
            {renderTeamSection(coachTeams, "Coach Teams", "👨‍🏫")}
            {renderTeamSection(otherTeams, "Other Teams", "🎯")}
          </VStack>
        </CardBody>
      </Card>

      {/* Join Team Modal */}
      <JoinTeamModal
        isOpen={isJoinOpen}
        onClose={onJoinClose}
        onTeamJoined={() => {
          refetch(); // Refresh teams list
          onJoinClose();
        }}
      />

      {/* Leave Team Confirmation Dialog */}
      <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={undefined}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Leave Team
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to leave <strong>{teamToLeave?.name}</strong>? 
              You can rejoin later using the team's invite code.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onClose} mr={3}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleLeaveTeam}
                isLoading={isLeaving}
                loadingText="Leaving..."
              >
                Leave Team
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default MyTeamsCard; 