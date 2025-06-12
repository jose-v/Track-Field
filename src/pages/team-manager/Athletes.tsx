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
  CardHeader,
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
  Tooltip,
  useColorModeValue,
  useToast,
  Skeleton,
  SkeletonText,
  Alert,
  AlertIcon,
  AlertDescription,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Divider,
  useDisclosure,
} from '@chakra-ui/react';
import { 
  FaRunning, 
  FaSearch, 
  FaFilter, 
  FaUserPlus, 
  FaEye, 
  FaEnvelope, 
  FaPhone,
  FaCalendarAlt,
  FaBirthdayCake,
  FaUsers,
  FaTrophy,
  FaChartLine,
  FaDownload,
  FaCog
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SendTeamInviteModal } from '../../components/SendTeamInviteModal';

interface Athlete {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  events?: string[];
  team_id: string;
  team_name: string;
  team_type: string;
  joined_at: string;
  age?: number;
}

interface TeamSummary {
  team_id: string;
  team_name: string;
  team_type: string;
  athlete_count: number;
}

export function TeamManagerAthletes() {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<{ id: string; name: string } | null>(null);

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');
  const statBg = useColorModeValue('gray.50', 'gray.700');

  // Fetch athletes from all teams managed by this team manager
  const { data: athletes, isLoading, refetch } = useQuery<Athlete[]>({
    queryKey: ['team-manager-athletes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        // Get all teams created by this team manager
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, team_type')
          .eq('created_by', user.id)
          .eq('is_active', true);

        if (teamsError) throw teamsError;
        if (!teams || teams.length === 0) return [];

        const teamIds = teams.map(t => t.id);

        // Get all athletes from these teams
        const { data: teamMembers, error: membersError } = await supabase
          .from('team_members')
          .select(`
            user_id,
            team_id,
            joined_at,
            teams!inner(id, name, team_type)
          `)
          .in('team_id', teamIds)
          .eq('role', 'athlete')
          .eq('status', 'active');

        if (membersError) throw membersError;
        if (!teamMembers || teamMembers.length === 0) return [];

        // Get athlete profile details
        const athleteIds = teamMembers.map(m => m.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url, phone, bio')
          .in('id', athleteIds);

        if (profilesError) throw profilesError;

        // Get athlete-specific data
        const { data: athleteData, error: athleteError } = await supabase
          .from('athletes')
          .select('id, birth_date, gender, events')
          .in('id', athleteIds);

        if (athleteError) throw athleteError;

        // Combine all data
        const athletes: Athlete[] = teamMembers.map((member: any) => {
          const profile = profiles?.find(p => p.id === member.user_id);
          const athleteInfo = athleteData?.find(a => a.id === member.user_id);
          
          const age = athleteInfo?.birth_date 
            ? new Date().getFullYear() - new Date(athleteInfo.birth_date).getFullYear()
            : undefined;

          return {
            id: member.user_id,
            first_name: profile?.first_name || 'Unknown',
            last_name: profile?.last_name || 'Athlete',
            email: profile?.email || '',
            avatar_url: profile?.avatar_url,
            phone: profile?.phone,
            bio: profile?.bio,
            date_of_birth: athleteInfo?.birth_date,
            gender: athleteInfo?.gender,
            events: athleteInfo?.events || [],
            team_id: member.team_id,
            team_name: member.teams.name,
            team_type: member.teams.team_type,
            joined_at: member.joined_at,
            age
          };
        });

        return athletes;
      } catch (error) {
        console.error('Error fetching athletes:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  // Calculate summary statistics
  const teamSummaries: TeamSummary[] = React.useMemo(() => {
    if (!athletes) return [];
    
    const teamMap = new Map<string, TeamSummary>();
    
    athletes.forEach(athlete => {
      const existing = teamMap.get(athlete.team_id);
      if (existing) {
        existing.athlete_count++;
      } else {
        teamMap.set(athlete.team_id, {
          team_id: athlete.team_id,
          team_name: athlete.team_name,
          team_type: athlete.team_type,
          athlete_count: 1
        });
      }
    });
    
    return Array.from(teamMap.values());
  }, [athletes]);

  // Get unique values for filters
  const uniqueTeams = teamSummaries;
  const uniqueEvents = React.useMemo(() => {
    if (!athletes) return [];
    const events = new Set<string>();
    athletes.forEach(athlete => {
      athlete.events?.forEach(event => events.add(event));
    });
    return Array.from(events).sort();
  }, [athletes]);

  // Filter athletes based on search and filters
  const filteredAthletes = React.useMemo(() => {
    if (!athletes) return [];
    
    return athletes.filter(athlete => {
      const matchesSearch = searchTerm === '' || 
        `${athlete.first_name} ${athlete.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTeam = selectedTeam === 'all' || athlete.team_id === selectedTeam;
      const matchesGender = selectedGender === 'all' || athlete.gender === selectedGender;
      const matchesEvent = selectedEvent === 'all' || athlete.events?.includes(selectedEvent);
      
      return matchesSearch && matchesTeam && matchesGender && matchesEvent;
    });
  }, [athletes, searchTerm, selectedTeam, selectedGender, selectedEvent]);

  const handleInviteAthlete = (team: { id: string; name: string }) => {
    setSelectedTeamForInvite(team);
    onInviteOpen();
  };

  const getGenderColor = (gender?: string) => {
    switch (gender) {
      case 'male': return 'blue';
      case 'female': return 'pink';
      default: return 'gray';
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
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="60px" borderRadius="md" />
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height="120px" borderRadius="lg" />
            ))}
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {[...Array(6)].map((_, i) => (
              <Card key={i} bg={cardBg}>
                <CardBody>
                  <VStack spacing={3}>
                    <Skeleton height="60px" width="60px" borderRadius="full" />
                    <SkeletonText noOfLines={3} spacing="2" />
                  </VStack>
                </CardBody>
              </Card>
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
              <Heading size="lg" color={headingColor}>Athletes</Heading>
              <Text color={textColor} mt={1}>
                Manage athletes across all your teams
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
                  Add Athlete
                </MenuButton>
                <MenuList>
                  {uniqueTeams.map(team => (
                    <MenuItem 
                      key={team.team_id}
                      onClick={() => handleInviteAthlete({ id: team.team_id, name: team.team_name })}
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
                  <StatLabel>Total Athletes</StatLabel>
                  <StatNumber color="blue.500">{athletes?.length || 0}</StatNumber>
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
                  <StatLabel>Male Athletes</StatLabel>
                  <StatNumber color="blue.500">
                    {athletes?.filter(a => a.gender === 'male').length || 0}
                  </StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Female Athletes</StatLabel>
                  <StatNumber color="pink.500">
                    {athletes?.filter(a => a.gender === 'female').length || 0}
                  </StatNumber>
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
                      placeholder="Search athletes..."
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
                        {team.team_name} ({team.athlete_count})
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    w="150px"
                  >
                    <option value="all">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                  <Select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    w="200px"
                  >
                    <option value="all">All Events</option>
                    {uniqueEvents.map(event => (
                      <option key={event} value={event}>{event}</option>
                    ))}
                  </Select>
                </HStack>
                <Text fontSize="sm" color={textColor}>
                  Showing {filteredAthletes.length} of {athletes?.length || 0} athletes
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Athletes Grid */}
          {filteredAthletes.length === 0 ? (
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <VStack spacing={4} py={8}>
                  <Icon as={FaRunning} boxSize={12} color={textColor} />
                  <Text fontSize="lg" fontWeight="medium" color={headingColor}>
                    No athletes found
                  </Text>
                  <Text color={textColor} textAlign="center">
                    {athletes?.length === 0 
                      ? "You don't have any athletes yet. Start by inviting athletes to your teams."
                      : "Try adjusting your search criteria or filters."
                    }
                  </Text>
                  {athletes?.length === 0 && (
                    <Button
                      leftIcon={<FaUserPlus />}
                      colorScheme="blue"
                      onClick={() => uniqueTeams.length > 0 && handleInviteAthlete({ 
                        id: uniqueTeams[0].team_id, 
                        name: uniqueTeams[0].team_name 
                      })}
                    >
                      Invite First Athlete
                    </Button>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredAthletes.map((athlete) => (
                <Card key={athlete.id} bg={cardBg} borderColor={borderColor} _hover={{ shadow: 'lg' }} transition="all 0.2s">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {/* Athlete Header */}
                      <HStack spacing={3}>
                        <Avatar
                          size="lg"
                          name={`${athlete.first_name} ${athlete.last_name}`}
                          src={athlete.avatar_url}
                        />
                        <VStack spacing={1} align="start" flex="1">
                          <Heading size="sm" color={headingColor}>
                            {athlete.first_name} {athlete.last_name}
                          </Heading>
                          <HStack spacing={2}>
                            <Badge colorScheme={getTeamTypeColor(athlete.team_type)} size="sm">
                              {athlete.team_name}
                            </Badge>
                            {athlete.gender && (
                              <Badge colorScheme={getGenderColor(athlete.gender)} size="sm">
                                {athlete.gender.charAt(0).toUpperCase() + athlete.gender.slice(1)}
                              </Badge>
                            )}
                          </HStack>
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

                      {/* Athlete Details */}
                      <VStack spacing={2} align="stretch">
                        {athlete.age && (
                          <HStack>
                            <Icon as={FaBirthdayCake} color={textColor} />
                            <Text fontSize="sm" color={textColor}>
                              {athlete.age} years old
                            </Text>
                          </HStack>
                        )}
                        
                        <HStack>
                          <Icon as={FaCalendarAlt} color={textColor} />
                          <Text fontSize="sm" color={textColor}>
                            Joined {new Date(athlete.joined_at).toLocaleDateString()}
                          </Text>
                        </HStack>

                        {athlete.email && (
                          <HStack>
                            <Icon as={FaEnvelope} color={textColor} />
                            <Text fontSize="sm" color={textColor} noOfLines={1}>
                              {athlete.email}
                            </Text>
                          </HStack>
                        )}

                        {athlete.phone && (
                          <HStack>
                            <Icon as={FaPhone} color={textColor} />
                            <Text fontSize="sm" color={textColor}>
                              {athlete.phone}
                            </Text>
                          </HStack>
                        )}
                      </VStack>

                      {/* Events */}
                      {athlete.events && athlete.events.length > 0 && (
                        <>
                          <Divider />
                          <VStack spacing={2} align="stretch">
                            <Text fontSize="sm" fontWeight="medium" color={headingColor}>
                              Events
                            </Text>
                            <HStack spacing={1} flexWrap="wrap">
                              {athlete.events.slice(0, 3).map((event, index) => (
                                <Badge key={index} variant="outline" size="sm">
                                  {event}
                                </Badge>
                              ))}
                              {athlete.events.length > 3 && (
                                <Badge variant="outline" size="sm" colorScheme="gray">
                                  +{athlete.events.length - 3} more
                                </Badge>
                              )}
                            </HStack>
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