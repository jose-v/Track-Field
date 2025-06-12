import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Avatar,
  Badge,
  Button,
  Input,
  Select,
  SimpleGrid,
  Flex,
  Spacer,
  Icon,
  IconButton,
  useColorModeValue,
  useToast,
  Skeleton,
  SkeletonText,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
  useDisclosure,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { 
  FaUserTie, 
  FaSearch, 
  FaUserPlus, 
  FaEye, 
  FaEnvelope, 
  FaPhone,
  FaCalendarAlt,
  FaChartLine,
  FaDownload,
  FaCog,
  FaUsers,
  FaAward,
  FaRunning
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SendTeamInviteModal } from '../../components/SendTeamInviteModal';

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  team_id: string;
  team_name: string;
  team_type: string;
  joined_at: string;
  athlete_count?: number;
}

interface TeamSummary {
  team_id: string;
  team_name: string;
  team_type: string;
  coach_count: number;
}

export function TeamManagerCoaches() {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<{ id: string; name: string } | null>(null);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  // Fetch coaches from all teams managed by this team manager
  const { data: coaches, isLoading, refetch } = useQuery<Coach[]>({
    queryKey: ['team-manager-coaches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        // Get all teams where this team manager has authority:
        // 1. Teams created by this team manager (institution teams)
        // 2. Teams where coaches belong to the institution (coach teams with institutional coaches)
        
        // First, get teams directly created by this team manager
        const { data: institutionTeams, error: institutionTeamsError } = await supabase
          .from('teams')
          .select('id, name, team_type')
          .eq('created_by', user.id)
          .eq('is_active', true);

        if (institutionTeamsError) throw institutionTeamsError;

        // Second, get coach teams where the coach belongs to this institution
        // This means coaches who are also members of teams created by this team manager
        const { data: institutionCoaches, error: coachesError } = await supabase
          .from('team_members')
          .select(`
            user_id,
            teams!inner(created_by)
          `)
          .eq('role', 'coach')
          .eq('status', 'active')
          .eq('teams.created_by', user.id);

        if (coachesError) throw coachesError;

        // Get coach teams created by these institutional coaches
        const institutionCoachIds = institutionCoaches?.map(ic => ic.user_id) || [];
        let coachTeams: any[] = [];
        
        if (institutionCoachIds.length > 0) {
          const { data: coachTeamsData, error: coachTeamsError } = await supabase
            .from('teams')
            .select('id, name, team_type')
            .in('created_by', institutionCoachIds)
            .eq('team_type', 'coach')
            .eq('is_active', true);

          if (coachTeamsError) throw coachTeamsError;
          coachTeams = coachTeamsData || [];
        }

        // Combine all team IDs
        const allTeams = [...(institutionTeams || []), ...coachTeams];
        if (allTeams.length === 0) return [];

        const teamIds = allTeams.map(t => t.id);

        // Get all coaches from these teams using team_members
        const { data: teamMembers, error: membersError } = await supabase
          .from('team_members')
          .select(`
            user_id,
            team_id,
            joined_at,
            teams!inner(id, name, team_type)
          `)
          .in('team_id', teamIds)
          .eq('role', 'coach')
          .eq('status', 'active');

        if (membersError) throw membersError;
        if (!teamMembers || teamMembers.length === 0) return [];

        // Get coach profile details
        const coachIds = teamMembers.map(m => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url, phone, bio')
          .in('id', coachIds);

        if (profilesError) throw profilesError;

        // Get coach-specific data
        const { data: coachData, error: coachError } = await supabase
          .from('coaches')
          .select('id, specialties, certifications')
          .in('id', coachIds);

        if (coachError) throw coachError;

        // Get athlete counts for each coach (across all their teams)
        const { data: athleteCounts, error: athleteCountError } = await supabase
          .from('team_members')
          .select('team_id')
          .in('team_id', teamIds)
          .eq('role', 'athlete')
          .eq('status', 'active');

        if (athleteCountError) throw athleteCountError;

        // Combine all data
        const coaches: Coach[] = teamMembers.map((member: any) => {
          const profile = profiles?.find(p => p.id === member.user_id);
          const coachInfo = coachData?.find(c => c.id === member.user_id);
          
          // Count athletes in this specific team
          const athleteCount = athleteCounts?.filter(ac => ac.team_id === member.team_id).length || 0;

          return {
            id: member.user_id,
            first_name: profile?.first_name || 'Unknown',
            last_name: profile?.last_name || 'Coach',
            email: profile?.email || '',
            avatar_url: profile?.avatar_url,
            phone: profile?.phone,
            bio: profile?.bio,
            specialties: coachInfo?.specialties || [],
            certifications: coachInfo?.certifications || [],
            team_id: member.team_id,
            team_name: member.teams.name,
            team_type: member.teams.team_type,
            joined_at: member.joined_at,
            athlete_count: athleteCount
          };
        });

        return coaches;
      } catch (error) {
        console.error('Error fetching coaches:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  // Calculate summary statistics
  const teamSummaries: TeamSummary[] = React.useMemo(() => {
    if (!coaches) return [];
    
    const teamMap = new Map<string, TeamSummary>();
    
    coaches.forEach(coach => {
      const existing = teamMap.get(coach.team_id);
      if (existing) {
        existing.coach_count++;
      } else {
        teamMap.set(coach.team_id, {
          team_id: coach.team_id,
          team_name: coach.team_name,
          team_type: coach.team_type,
          coach_count: 1
        });
      }
    });
    
    return Array.from(teamMap.values());
  }, [coaches]);

  // Get unique values for filters
  const uniqueTeams = teamSummaries;
  const uniqueSpecialties = React.useMemo(() => {
    if (!coaches) return [];
    const specialties = new Set<string>();
    coaches.forEach(coach => {
      coach.specialties?.forEach(specialty => specialties.add(specialty));
    });
    return Array.from(specialties).sort();
  }, [coaches]);

  // Filter coaches based on search and filters
  const filteredCoaches = React.useMemo(() => {
    if (!coaches) return [];
    
    return coaches.filter(coach => {
      const matchesSearch = searchTerm === '' || 
        `${coach.first_name} ${coach.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coach.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTeam = selectedTeam === 'all' || coach.team_id === selectedTeam;
      const matchesSpecialty = selectedSpecialty === 'all' || coach.specialties?.includes(selectedSpecialty);
      
      return matchesSearch && matchesTeam && matchesSpecialty;
    });
  }, [coaches, searchTerm, selectedTeam, selectedSpecialty]);

  const handleInviteCoach = (team: { id: string; name: string }) => {
    setSelectedTeamForInvite(team);
    onInviteOpen();
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
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="60px" borderRadius="md" />
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height="120px" borderRadius="lg" />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }

  return (
    <>
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex align="center">
            <Box>
              <Heading size="lg" color={headingColor}>Coaches</Heading>
              <Text color={textColor} mt={1}>
                Manage coaches across all your teams
              </Text>
            </Box>
            <Spacer />
            <HStack spacing={3}>
              <Button
                leftIcon={<FaDownload />}
                variant="outline"
                size="sm"
              >
                Export
              </Button>
              <Menu>
                <MenuButton as={Button} leftIcon={<FaUserPlus />} colorScheme="blue">
                  Add Coach
                </MenuButton>
                <MenuList>
                  {uniqueTeams.map(team => (
                    <MenuItem 
                      key={team.team_id}
                      onClick={() => handleInviteCoach({ id: team.team_id, name: team.team_name })}
                    >
                      Add to {team.team_name}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </HStack>
          </Flex>

          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Coaches</StatLabel>
                  <StatNumber color="purple.500">{coaches?.length || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Active Teams</StatLabel>
                  <StatNumber color="green.500">{teamSummaries.length}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Athletes Coached</StatLabel>
                  <StatNumber color="blue.500">
                    {coaches?.reduce((sum, coach) => sum + (coach.athlete_count || 0), 0) || 0}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Specialties</StatLabel>
                  <StatNumber color="orange.500">{uniqueSpecialties.length}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filters */}
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4}>
                <HStack spacing={4} w="full" flexWrap="wrap">
                  <Box flex="1" minW="200px">
                    <Input
                      placeholder="Search coaches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Box>
                  <Select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    w="200px"
                  >
                    <option value="all">All Teams</option>
                    {uniqueTeams.map(team => (
                      <option key={team.team_id} value={team.team_id}>
                        {team.team_name} ({team.coach_count})
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    w="200px"
                  >
                    <option value="all">All Specialties</option>
                    {uniqueSpecialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </Select>
                </HStack>
                <Text fontSize="sm" color={textColor}>
                  Showing {filteredCoaches.length} of {coaches?.length || 0} coaches
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Coaches Grid */}
          {filteredCoaches.length === 0 ? (
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <VStack spacing={4} py={8}>
                  <Icon as={FaUserTie} boxSize={12} color={textColor} />
                  <Text fontSize="lg" fontWeight="medium" color={headingColor}>
                    No coaches found
                  </Text>
                  <Text color={textColor} textAlign="center">
                    {coaches?.length === 0 
                      ? "You don't have any coaches yet. Start by inviting coaches to your teams."
                      : "Try adjusting your search criteria or filters."
                    }
                  </Text>
                  {coaches?.length === 0 && uniqueTeams.length > 0 && (
                    <Button
                      leftIcon={<FaUserPlus />}
                      colorScheme="blue"
                      onClick={() => handleInviteCoach({ 
                        id: uniqueTeams[0].team_id, 
                        name: uniqueTeams[0].team_name 
                      })}
                    >
                      Invite First Coach
                    </Button>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredCoaches.map((coach) => (
                <Card key={coach.id} bg={cardBg} borderColor={borderColor} _hover={{ shadow: 'lg' }} transition="all 0.2s">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {/* Coach Header */}
                      <HStack spacing={3}>
                        <Avatar
                          size="lg"
                          name={`${coach.first_name} ${coach.last_name}`}
                          src={coach.avatar_url}
                        />
                        <VStack spacing={1} align="start" flex="1">
                          <Heading size="sm" color={headingColor}>
                            {coach.first_name} {coach.last_name}
                          </Heading>
                          <Badge colorScheme={getTeamTypeColor(coach.team_type)} size="sm">
                            {coach.team_name}
                          </Badge>
                          {coach.athlete_count !== undefined && (
                            <HStack spacing={1}>
                              <Icon as={FaUsers} color={textColor} boxSize={3} />
                              <Text fontSize="xs" color={textColor}>
                                {coach.athlete_count} athlete{coach.athlete_count !== 1 ? 's' : ''}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FaCog />}
                            size="sm"
                            variant="ghost"
                          />
                          <MenuList>
                            <MenuItem icon={<FaEye />}>View Profile</MenuItem>
                            <MenuItem icon={<FaEnvelope />}>Send Message</MenuItem>
                            <MenuItem icon={<FaChartLine />}>View Performance</MenuItem>
                          </MenuList>
                        </Menu>
                      </HStack>

                      <Divider />

                      {/* Coach Details */}
                      <VStack spacing={2} align="stretch">
                        <HStack>
                          <Icon as={FaCalendarAlt} color={textColor} />
                          <Text fontSize="sm" color={textColor}>
                            Joined {new Date(coach.joined_at).toLocaleDateString()}
                          </Text>
                        </HStack>

                        {coach.email && (
                          <HStack>
                            <Icon as={FaEnvelope} color={textColor} />
                            <Text fontSize="sm" color={textColor} noOfLines={1}>
                              {coach.email}
                            </Text>
                          </HStack>
                        )}

                        {coach.phone && (
                          <HStack>
                            <Icon as={FaPhone} color={textColor} />
                            <Text fontSize="sm" color={textColor}>
                              {coach.phone}
                            </Text>
                          </HStack>
                        )}
                      </VStack>

                      {/* Specialties */}
                      {coach.specialties && coach.specialties.length > 0 && (
                        <>
                          <Divider />
                          <VStack spacing={2} align="stretch">
                            <HStack>
                              <Icon as={FaRunning} color={textColor} />
                              <Text fontSize="sm" fontWeight="medium" color={headingColor}>
                                Specialties
                              </Text>
                            </HStack>
                            <Wrap spacing={1}>
                              {coach.specialties.slice(0, 3).map((specialty, index) => (
                                <WrapItem key={index}>
                                  <Badge variant="outline" size="sm" colorScheme="blue">
                                    {specialty}
                                  </Badge>
                                </WrapItem>
                              ))}
                              {coach.specialties.length > 3 && (
                                <WrapItem>
                                  <Badge variant="outline" size="sm" colorScheme="gray">
                                    +{coach.specialties.length - 3} more
                                  </Badge>
                                </WrapItem>
                              )}
                            </Wrap>
                          </VStack>
                        </>
                      )}

                      {/* Certifications */}
                      {coach.certifications && coach.certifications.length > 0 && (
                        <>
                          <Divider />
                          <VStack spacing={2} align="stretch">
                            <HStack>
                              <Icon as={FaAward} color={textColor} />
                              <Text fontSize="sm" fontWeight="medium" color={headingColor}>
                                Certifications
                              </Text>
                            </HStack>
                            <Wrap spacing={1}>
                              {coach.certifications.slice(0, 2).map((cert, index) => (
                                <WrapItem key={index}>
                                  <Badge variant="outline" size="sm" colorScheme="green">
                                    {cert}
                                  </Badge>
                                </WrapItem>
                              ))}
                              {coach.certifications.length > 2 && (
                                <WrapItem>
                                  <Badge variant="outline" size="sm" colorScheme="gray">
                                    +{coach.certifications.length - 2} more
                                  </Badge>
                                </WrapItem>
                              )}
                            </Wrap>
                          </VStack>
                        </>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>

      {/* Send Invitation Modal */}
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
            onInviteClose();
            setSelectedTeamForInvite(null);
          }}
        />
      )}
    </>
  );
}
