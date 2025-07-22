import React, { useState } from 'react';
import {
  Container,
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  Icon,
  useDisclosure,
  useColorModeValue,
  SimpleGrid,
  Divider,
  Badge,
  Alert,
  AlertIcon,
  Avatar,
  Flex,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { FiUsers, FiUserPlus, FiSearch, FiSend } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { JoinTeamModal } from '../components/JoinTeamModal';
import { useProfile } from '../hooks/useProfile';
import PageHeader from '../components/PageHeader';
import { usePageHeader } from '../hooks/usePageHeader';
import { HiUserGroup } from 'react-icons/hi';

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  email?: string;
  team_count: number;
  athlete_count: number;
  is_member: boolean;
  member_team_name?: string;
}

export default function JoinTeam() {
  // Color mode values must be called first to maintain hooks order
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const iconBg = useColorModeValue('blue.50', 'blue.900');
  const iconColor = useColorModeValue('blue.500', 'blue.300');
  
  // Additional color values used in JSX
  const greenBg = useColorModeValue('green.50', 'green.900');
  const greenIcon = useColorModeValue('green.500', 'green.300');
  const greenText = useColorModeValue('green.600', 'green.300');
  const grayBg = useColorModeValue('gray.50', 'gray.700');
  const blueBg = useColorModeValue('blue.50', 'blue.900');
  const blueIcon = useColorModeValue('blue.500', 'blue.300');
  const purpleBg = useColorModeValue('purple.50', 'purple.900');
  const purpleIcon = useColorModeValue('purple.500', 'purple.300');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { profile, isLoading } = useProfile();
  const userRole = profile?.role;
  const { user } = useAuth();
  const toast = useToast();
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  // Use the page header hook
  usePageHeader({
    title: 'Join Team',
    subtitle: 'Join a team as an athlete',
    icon: HiUserGroup
  });

  // Fetch available coaches
  const { data: coaches, isLoading: coachesLoading, refetch: refetchCoaches } = useQuery<Coach[]>({
    queryKey: ['available-coaches', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id || userRole !== 'athlete') return [];

      try {
        // Get all coaches with their team and athlete counts
        const { data: coachProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, email')
          .eq('role', 'coach');

        if (profilesError) throw profilesError;

        // Get team counts for each coach
        const coachIds = coachProfiles?.map(c => c.id) || [];
        const { data: teamCounts, error: teamCountsError } = await supabase
          .from('team_members')
          .select('user_id, team_id')
          .in('user_id', coachIds)
          .eq('role', 'coach')
          .eq('status', 'active');

        if (teamCountsError) throw teamCountsError;

        // Get athlete counts for each coach's teams
        const teamIds = [...new Set(teamCounts?.map(tc => tc.team_id) || [])];
        const { data: athleteCounts, error: athleteCountsError } = await supabase
          .from('team_members')
          .select('team_id, user_id')
          .in('team_id', teamIds)
          .eq('role', 'athlete')
          .eq('status', 'active');

        if (athleteCountsError) throw athleteCountsError;

        // Build coach data with counts
        const coaches: Coach[] = coachProfiles?.map(coach => {
          const coachTeams = teamCounts?.filter(tc => tc.user_id === coach.id) || [];
          const coachTeamIds = coachTeams.map(ct => ct.team_id);
          const coachAthletes = athleteCounts?.filter(ac => coachTeamIds.includes(ac.team_id)) || [];
          
          // Count UNIQUE athletes, not total rows (an athlete in multiple teams should only count once)
          const uniqueAthleteIds = new Set(coachAthletes.map(ac => ac.user_id));
          const uniqueAthleteCount = uniqueAthleteIds.size;

          return {
            id: coach.id,
            first_name: coach.first_name,
            last_name: coach.last_name,
            avatar_url: coach.avatar_url,
            email: coach.email,
            team_count: coachTeams.length,
            athlete_count: uniqueAthleteCount, // Use unique count instead of length
            is_member: false,
            member_team_name: undefined
          };
        }) || [];

        // Check if current athlete is already a member of any coach's teams
        if (coaches.length > 0) {
          const allCoachTeamIds = [...new Set(coaches.flatMap(c => {
            const coachTeams = teamCounts?.filter(tc => tc.user_id === c.id) || [];
            return coachTeams.map(ct => ct.team_id);
          }))];

          if (allCoachTeamIds.length > 0) {
            // Check athlete's memberships in all coach teams
            const { data: athleteMemberships, error: membershipError } = await supabase
              .from('team_members')
              .select('team_id, teams!inner(id, name, created_by)')
              .eq('user_id', user.id)
              .eq('status', 'active')
              .eq('teams.is_active', true)
              .in('team_id', allCoachTeamIds);

            if (membershipError) throw membershipError;

            // Update coaches with membership info
            if (athleteMemberships && athleteMemberships.length > 0) {
              coaches.forEach(coach => {
                const coachTeams = teamCounts?.filter(tc => tc.user_id === coach.id) || [];
                const coachTeamIds = coachTeams.map(ct => ct.team_id);
                
                const membershipInCoachTeam = athleteMemberships.find(membership => 
                  coachTeamIds.includes(membership.team_id)
                );

                if (membershipInCoachTeam) {
                  coach.is_member = true;
                  coach.member_team_name = (membershipInCoachTeam as any).teams.name;
                }
              });
            }
          }
        }

        return coaches;
      } catch (error) {
        console.error('Error fetching coaches:', error);
        throw error;
      }
    },
    enabled: !!user?.id && !!userRole && userRole === 'athlete',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSendCoachRequest = async (coach: Coach) => {
    if (!user?.id) return;

    setSendingRequest(coach.id);
    try {
      // Create a coach request notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: coach.id, // Send to coach
          type: 'coach_request',
          title: 'New Athlete Request',
          message: `${user.user_metadata?.first_name || 'An athlete'} ${user.user_metadata?.last_name || ''} wants to join your team`,
          metadata: {
            athlete_id: user.id,
            athlete_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
            athlete_email: user.email
          },
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Request Sent!',
        description: `Your request has been sent to ${coach.first_name} ${coach.last_name}. They will be notified and can approve your request.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error sending coach request:', error);
      toast({
        title: 'Error Sending Request',
        description: 'Failed to send your request. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSendingRequest(null);
    }
  };

  const handleRefresh = () => {
    refetchCoaches();
  };

      if (isLoading) {
    return (
      <Container maxW="4xl" px={0}>
        <VStack spacing={6}>
          <Text>Loading...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <>
      <Box minH="100vh" bg={bgColor}>
        {/* Desktop Header */}
        <PageHeader
          title="Join Team"
          subtitle="Join a team as an athlete"
          icon={HiUserGroup}
        />
        
        <Container maxW="4xl" px={0}>
          <VStack spacing={8} align="stretch">

            {/* Role-specific information */}
            {userRole === 'team_manager' && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Team managers typically create and manage their own teams rather than joining existing ones. 
                  If you need to join a team as a manager, contact the team administrator directly.
                </Text>
              </Alert>
            )}

            {/* Two-column layout for athletes */}
            {userRole === 'athlete' ? (
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {/* Join with Code Card */}
                <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
                  <CardBody py={8} textAlign="center">
                    <VStack spacing={4}>
                      <Box
                        w={16}
                        h={16}
                        borderRadius="full"
                        bg={iconBg}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiUserPlus} boxSize={8} color={iconColor} />
                      </Box>
                      
                      <VStack spacing={2}>
                        <Heading size="md" color={headingColor}>
                          Enter Invite Code
                        </Heading>
                        <Text color={textColor} fontSize="sm">
                          Have an invite code? Join instantly.
                        </Text>
                      </VStack>

                      <Button
                        colorScheme="blue"
                        leftIcon={<FiUserPlus />}
                        onClick={onOpen}
                        size="md"
                      >
                        Join with Code
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Find Coaches Card */}
                <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
                  <CardBody py={8} textAlign="center">
                    <VStack spacing={4}>
                      <Box
                        w={16}
                        h={16}
                        borderRadius="full"
                        bg={greenBg}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiSearch} boxSize={8} color={greenIcon} />
                      </Box>
                      
                      <VStack spacing={2}>
                        <Heading size="md" color={headingColor}>
                          Find Coaches
                        </Heading>
                        <Text color={textColor} fontSize="sm">
                          Browse available coaches and send requests.
                        </Text>
                      </VStack>

                      <Text fontSize="sm" color={greenText} fontWeight="medium">
                        {coaches?.length || 0} coaches available
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            ) : (
              /* Single card for non-athletes */
              <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
                <CardBody py={12} textAlign="center">
                  <VStack spacing={6}>
                    <Box
                      w={20}
                      h={20}
                      borderRadius="full"
                      bg={iconBg}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={FiUserPlus} boxSize={10} color={iconColor} />
                    </Box>
                    
                    <VStack spacing={2}>
                      <Heading size="lg" color={headingColor}>
                        Enter Invite Code
                      </Heading>
                      <Text color={textColor} maxW="md">
                        Have an invite code? Click below to enter it and join your team instantly.
                      </Text>
                    </VStack>

                    <Button
                      colorScheme="blue"
                      size="lg"
                      leftIcon={<FiUserPlus />}
                      onClick={onOpen}
                      isDisabled={userRole === 'team_manager'}
                      px={8}
                    >
                      Join Team with Code
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Available Coaches Section - Only for athletes */}
            {userRole === 'athlete' && (
              <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
                <CardBody>
                  <VStack spacing={6} align="stretch">
                    <Flex justify="space-between" align="center">
                      <Heading size="md" color={headingColor}>
                        Available Coaches
                      </Heading>
                      <Button size="sm" variant="outline" onClick={() => refetchCoaches()} isLoading={coachesLoading}>
                        Refresh
                      </Button>
                    </Flex>
                    
                    {coachesLoading ? (
                      <VStack spacing={4}>
                        <Spinner />
                        <Text color={textColor}>Loading coaches...</Text>
                      </VStack>
                    ) : coaches && coaches.length > 0 ? (
                      <VStack spacing={4} align="stretch">
                        {coaches.map((coach) => (
                          <Box
                            key={coach.id}
                            p={4}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={cardBorder}
                            bg={grayBg}
                          >
                            <Flex
                              direction={{ base: 'column', md: 'row' }}
                              justify={{ base: 'flex-start', md: 'space-between' }}
                              align={{ base: 'stretch', md: 'center' }}
                              gap={4}
                            >
                              <HStack spacing={4} flex="1" minW="0">
                                <Avatar
                                  size={{ base: 'sm', md: 'md' }}
                                  name={`${coach.first_name} ${coach.last_name}`}
                                  src={coach.avatar_url}
                                />
                                <VStack spacing={1} align="start" flex="1" minW="0">
                                  <Text 
                                    fontWeight="bold" 
                                    color={headingColor}
                                    fontSize={{ base: 'sm', md: 'md' }}
                                    noOfLines={1}
                                  >
                                    {coach.first_name} {coach.last_name}
                                  </Text>
                                  <Flex
                                    direction={{ base: 'column', sm: 'row' }}
                                    gap={{ base: 1, sm: 4 }}
                                    fontSize="sm"
                                    color={textColor}
                                  >
                                    <Text>{coach.team_count} team{coach.team_count !== 1 ? 's' : ''}</Text>
                                    <Text>{coach.athlete_count} athlete{coach.athlete_count !== 1 ? 's' : ''}</Text>
                                  </Flex>
                                </VStack>
                              </HStack>
                              {coach.is_member ? (
                                <VStack 
                                  spacing={1} 
                                  align={{ base: 'start', md: 'end' }}
                                  flexShrink={0}
                                >
                                  <Badge colorScheme="blue" fontSize="xs">
                                    Already Member
                                  </Badge>
                                  <Text 
                                    fontSize="xs" 
                                    color={textColor} 
                                    textAlign={{ base: 'left', md: 'right' }}
                                    noOfLines={1}
                                  >
                                    {coach.member_team_name}
                                  </Text>
                                </VStack>
                              ) : (
                                <Button
                                  size={{ base: 'sm', md: 'sm' }}
                                  colorScheme="green"
                                  leftIcon={<FiSend />}
                                  onClick={() => handleSendCoachRequest(coach)}
                                  isLoading={sendingRequest === coach.id}
                                  loadingText="Sending..."
                                  width={{ base: 'full', md: 'auto' }}
                                  flexShrink={0}
                                >
                                  Send Request
                                </Button>
                              )}
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <VStack spacing={4} py={8}>
                        <Icon as={FiSearch} boxSize={12} color="gray.400" />
                        <Text color={textColor} textAlign="center">
                          No coaches available at the moment
                        </Text>
                        <Text fontSize="sm" color={textColor} textAlign="center">
                          Try refreshing or check back later
                        </Text>
                      </VStack>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* How it works */}
            <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Heading size="md" color={headingColor} textAlign="center">
                    How Team Invitations Work
                  </Heading>
                  
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <VStack spacing={3} textAlign="center">
                      <Box
                        w={12}
                        h={12}
                        borderRadius="full"
                        bg={greenBg}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiSearch} boxSize={6} color={greenIcon} />
                      </Box>
                      <Badge colorScheme="green" fontSize="xs">Step 1</Badge>
                      <Text fontWeight="semibold" color={headingColor}>Get Invite Code</Text>
                      <Text fontSize="sm" color={textColor}>
                        Receive a 6-character invite code from your team manager or coach
                      </Text>
                    </VStack>

                    <VStack spacing={3} textAlign="center">
                      <Box
                        w={12}
                        h={12}
                        borderRadius="full"
                        bg={blueBg}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiUserPlus} boxSize={6} color={blueIcon} />
                      </Box>
                      <Badge colorScheme="blue" fontSize="xs">Step 2</Badge>
                      <Text fontWeight="semibold" color={headingColor}>Enter Code</Text>
                      <Text fontSize="sm" color={textColor}>
                        Click "Join Team with Code" and enter your invite code
                      </Text>
                    </VStack>

                    <VStack spacing={3} textAlign="center">
                      <Box
                        w={12}
                        h={12}
                        borderRadius="full"
                        bg={purpleBg}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiUsers} boxSize={6} color={purpleIcon} />
                      </Box>
                      <Badge colorScheme="purple" fontSize="xs">Step 3</Badge>
                      <Text fontWeight="semibold" color={headingColor}>Join Team</Text>
                      <Text fontSize="sm" color={textColor}>
                        You'll be instantly added to the team and can start training
                      </Text>
                    </VStack>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>

            {/* Role-specific benefits */}
            <Card bg={cardBg} borderColor={cardBorder} borderWidth="1px">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color={headingColor} textAlign="center">
                    {userRole === 'athlete' ? 'Athlete Benefits' : 'Coach Benefits'}
                  </Heading>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {userRole === 'athlete' ? (
                      <>
                        <HStack spacing={3}>
                          <Box w={2} h={2} borderRadius="full" bg="blue.500" />
                          <Text fontSize="sm" color={textColor}>Access to team workouts and training plans</Text>
                        </HStack>
                        <HStack spacing={3}>
                          <Box w={2} h={2} borderRadius="full" bg="blue.500" />
                          <Text fontSize="sm" color={textColor}>Connect with your coaches</Text>
                        </HStack>
                        <HStack spacing={3}>
                          <Box w={2} h={2} borderRadius="full" bg="blue.500" />
                          <Text fontSize="sm" color={textColor}>Participate in team events and meets</Text>
                        </HStack>
                        <HStack spacing={3}>
                          <Box w={2} h={2} borderRadius="full" bg="blue.500" />
                          <Text fontSize="sm" color={textColor}>Track your progress with the team</Text>
                        </HStack>
                      </>
                    ) : userRole === 'coach' ? (
                      <>
                        <HStack spacing={3}>
                          <Box w={2} h={2} borderRadius="full" bg="orange.500" />
                          <Text fontSize="sm" color={textColor}>Collaborate with other coaches</Text>
                        </HStack>
                        <HStack spacing={3}>
                          <Box w={2} h={2} borderRadius="full" bg="orange.500" />
                          <Text fontSize="sm" color={textColor}>Access team athlete roster</Text>
                        </HStack>
                        <HStack spacing={3}>
                          <Box w={2} h={2} borderRadius="full" bg="orange.500" />
                          <Text fontSize="sm" color={textColor}>Assign workouts to team athletes</Text>
                        </HStack>
                        <HStack spacing={3}>
                          <Box w={2} h={2} borderRadius="full" bg="orange.500" />
                          <Text fontSize="sm" color={textColor}>Monitor team performance</Text>
                        </HStack>
                      </>
                    ) : (
                      <Text fontSize="sm" color={textColor} textAlign="center">
                        Contact your team administrator for more information about joining teams.
                      </Text>
                    )}
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>

      {/* Join Team Modal */}
      <JoinTeamModal
        isOpen={isOpen}
        onClose={onClose}
        onTeamJoined={handleRefresh}
      />
    </>
  );
} 