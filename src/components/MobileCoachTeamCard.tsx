import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
  Flex,
  IconButton,
  useColorModeValue,
  useToast,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Divider,
  Button,
  Icon,
  useBreakpointValue,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { 
  FaUsers, 
  FaPlus, 
  FaEllipsisH,
  FaCopy,
  FaEdit,
  FaUserPlus,
  FaTrash,
  FaSchool,
  FaRunning,
  FaUserTie,
  FaBullseye,
  FaChevronRight
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

interface MobileCoachTeamCardProps {
  maxTeamsToShow?: number;
}

export const MobileCoachTeamCard: React.FC<MobileCoachTeamCardProps> = ({ maxTeamsToShow = 10 }) => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTeam, setSelectedTeam] = useState<CoachTeam | null>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');
  const cardShadow = useColorModeValue('sm', 'md');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerText = useColorModeValue('gray.800', 'white');

  // Fetch coach's teams
  const { data: teams, isLoading, refetch } = useQuery<CoachTeam[]>({
    queryKey: ['coach-teams-mobile', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
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
        console.error('Error fetching teams:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

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
      case 'school': return 'School';
      case 'club': return 'Club';
      case 'coach': return 'Coach';
      default: return 'Team';
    }
  };

  const handleTeamClick = (team: CoachTeam) => {
    setSelectedTeam(team);
    onOpen();
  };

  const handleCopyCode = (inviteCode: string, teamName: string) => {
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: 'Code Copied',
      description: `Invite code for ${teamName} copied to clipboard`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleEditTeam = (team: CoachTeam) => {
    // TODO: Implement edit team functionality
    toast({
      title: 'Coming Soon',
      description: 'Edit team functionality will be implemented soon',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleAddAthlete = (team: CoachTeam) => {
    // TODO: Implement add athlete functionality
    toast({
      title: 'Coming Soon',
      description: 'Add athlete functionality will be implemented soon',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleDeleteTeam = (team: CoachTeam) => {
    // TODO: Implement delete team functionality
    toast({
      title: 'Coming Soon',
      description: 'Delete team functionality will be implemented soon',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  if (isLoading) {
    return (
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow={cardShadow}>
        <CardBody>
          <VStack spacing={4}>
            <Skeleton height="20px" width="150px" />
            <VStack spacing={3} width="100%">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height="60px" width="100%" />
              ))}
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow={cardShadow}>
        <CardBody>
          <VStack spacing={4} align="center" py={6}>
            <Icon as={FaUsers} boxSize={12} color="gray.400" />
            <Text color={textColor} textAlign="center">
              You haven't created any teams yet
            </Text>
            <Text fontSize="sm" color={textColor} textAlign="center">
              Create your first team to start managing athletes
            </Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow={cardShadow}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Heading size="md" color={headingColor}>My Teams</Heading>
              <IconButton
                aria-label="Create team"
                icon={<FaPlus />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
              />
            </HStack>
            
            <VStack spacing={3} align="stretch">
              {teams.map((team) => (
                <Box
                  key={team.id}
                  p={3}
                  borderRadius="md"
                  border="1px"
                  borderColor={borderColor}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleTeamClick(team)}
                >
                  <Flex justify="space-between" align="center">
                    {/* Column 1: Avatar */}
                    <Avatar
                      size="md"
                      src={team.logo_url}
                      name={team.institution_name || team.name}
                      bg="blue.500"
                      icon={<Icon as={FaUsers} />}
                    />
                    
                    {/* Column 2: Team Info */}
                    <VStack spacing={1} align="start" flex="1" ml={3}>
                      <Text fontSize="md" fontWeight="bold" color={headingColor}>
                        {team.name}
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                        {team.invite_code} • {getTeamTypeLabel(team.team_type)}
                      </Text>
                    </VStack>
                    
                    {/* Column 3: Menu Button */}
                    <IconButton
                      aria-label="Team options"
                      icon={<FaEllipsisH />}
                      size="sm"
                      variant="ghost"
                      color="white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTeamClick(team);
                      }}
                    />
                  </Flex>
                </Box>
              ))}
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Bottom Drawer */}
      <Drawer isOpen={isOpen} placement="bottom" onClose={onClose} size="full">
        <DrawerOverlay />
        <DrawerContent bg={drawerBg} maxH="75vh" borderTopRadius="xl">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color={drawerText}>
                {selectedTeam?.name}
              </Text>
              <Text fontSize="sm" color={textColor}>
                {selectedTeam?.institution_name} • {getTeamTypeLabel(selectedTeam?.team_type || '')}
              </Text>
            </VStack>
          </DrawerHeader>
          
          <DrawerBody overflowY="auto">
            <VStack spacing={0} align="stretch">
              {/* Copy Code */}
              <Flex
                justify="space-between"
                align="center"
                p={4}
                cursor="pointer"
                _hover={{ bg: hoverBg }}
                onClick={() => {
                  if (selectedTeam) {
                    handleCopyCode(selectedTeam.invite_code, selectedTeam.name);
                  }
                }}
              >
                <Text color={drawerText}>Copy code</Text>
                <Icon as={FaCopy} color={textColor} />
              </Flex>
              
              <Divider />
              
              {/* Edit Team */}
              <Flex
                justify="space-between"
                align="center"
                p={4}
                cursor="pointer"
                _hover={{ bg: hoverBg }}
                onClick={() => {
                  if (selectedTeam) {
                    handleEditTeam(selectedTeam);
                    onClose();
                  }
                }}
              >
                <Text color={drawerText}>Edit Team</Text>
                <Icon as={FaEdit} color={textColor} />
              </Flex>
              
              <Divider />
              
              {/* Add Athlete */}
              <Flex
                justify="space-between"
                align="center"
                p={4}
                cursor="pointer"
                _hover={{ bg: hoverBg }}
                onClick={() => {
                  if (selectedTeam) {
                    handleAddAthlete(selectedTeam);
                    onClose();
                  }
                }}
              >
                <Text color={drawerText}>Add Athlete</Text>
                <Icon as={FaUserPlus} color={textColor} />
              </Flex>
              
              <Divider />
              
              {/* Coach Count */}
              <Flex justify="space-between" align="center" p={4}>
                <Text color={drawerText}>Coach Count</Text>
                <Text color={textColor} fontWeight="bold">
                  {selectedTeam?.coach_count || 0}
                </Text>
              </Flex>
              
              <Divider />
              
              {/* Athlete Count */}
              <Flex justify="space-between" align="center" p={4}>
                <Text color={drawerText}>Athlete Count</Text>
                <Text color={textColor} fontWeight="bold">
                  {selectedTeam?.athlete_count || 0}
                </Text>
              </Flex>
              
              <Divider />
              
              {/* Delete Team */}
              <Flex
                justify="space-between"
                align="center"
                p={4}
                cursor="pointer"
                _hover={{ bg: 'red.50' }}
                onClick={() => {
                  if (selectedTeam) {
                    handleDeleteTeam(selectedTeam);
                    onClose();
                  }
                }}
              >
                <Text color="red.500">Delete Team</Text>
                <Icon as={FaTrash} color="red.500" />
              </Flex>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}; 