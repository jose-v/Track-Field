import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Text,
  Badge,
  SimpleGrid,
  Skeleton,
  useToast,
  IconButton,
  Tooltip,
  Flex,
  Spacer,
  useDisclosure,
  useColorModeValue
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiPlus, FiUsers, FiCalendar, FiCopy, FiSettings, FiEye, FiMail, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { getTeamsByManager, Team, getTeamMemberCount } from '../../services/teamService';
import { TeamSetupModal } from '../../components/TeamSetupModal';
import { SendTeamInviteModal } from '../../components/SendTeamInviteModal';
import { TeamCoachesSection } from '../../components/TeamCoachesSection';
import { TeamAthletesSection } from '../../components/TeamAthletesSection';

export function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberCounts, setMemberCounts] = useState<{ [teamId: string]: number }>({});
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isInviteOpen, 
    onOpen: onInviteOpen, 
    onClose: onInviteClose 
  } = useDisclosure();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [expandedSection, setExpandedSection] = useState<{ [teamId: string]: 'coaches' | 'athletes' | null }>({});

  // Dark mode color values
  const headingColor = useColorModeValue('orange.600', 'orange.300');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const teamNameColor = useColorModeValue('gray.800', 'white');
  const descriptionColor = useColorModeValue('gray.600', 'gray.300');
  const labelColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'white');
  const inviteCodeBg = useColorModeValue('orange.50', 'orange.900');
  const inviteCodeBorder = useColorModeValue('orange.200', 'orange.700');
  const inviteCodeLabelColor = useColorModeValue('orange.600', 'orange.300');
  const inviteCodeValueColor = useColorModeValue('orange.700', 'orange.200');
  const emptyStateIconColor = useColorModeValue('gray.400', 'gray.500');
  const emptyStateHeadingColor = useColorModeValue('gray.500', 'gray.400');
  const emptyStateTextColor = useColorModeValue('gray.500', 'gray.400');

  const fetchTeams = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const teamsData = await getTeamsByManager(user.id);
      setTeams(teamsData);

      // Fetch member counts for each team
      const counts: { [teamId: string]: number } = {};
      for (const team of teamsData) {
        const memberCount = await getTeamMemberCount(team.id);
        counts[team.id] = memberCount;
      }
      setMemberCounts(counts);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user?.id]);

  const handleCopyInviteCode = (inviteCode: string, teamName: string) => {
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: 'Invite Code Copied',
      description: `Invite code for ${teamName} copied to clipboard`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTeamTypeColor = (type: string) => {
    switch (type) {
      case 'school': return 'blue';
      case 'club': return 'green';
      case 'independent': return 'orange';
      default: return 'gray';
    }
  };

  const handleTeamCreated = () => {
    onClose();
    fetchTeams(); // Refresh the teams list and member counts
  };

  const handleInviteClick = (team: Team) => {
    setSelectedTeam(team);
    onInviteOpen();
  };

  const handleInviteSuccess = () => {
    onInviteClose();
    setSelectedTeam(null);
    // Refresh teams to update member counts when new members join
    fetchTeams();
  };

  const toggleTeamSection = (teamId: string, section: 'coaches' | 'athletes') => {
    setExpandedSection(prev => ({
      ...prev,
      [teamId]: prev[teamId] === section ? null : section
    }));
  };

  if (isLoading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="60px" borderRadius="md" />
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} height="200px" borderRadius="lg" />
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
              <Heading size="lg" color={headingColor}>My Teams</Heading>
              <Text color={subtitleColor} mt={1}>
                Manage and oversee your teams
              </Text>
            </Box>
            <Spacer />
            <Button
              leftIcon={<FiPlus />}
              colorScheme="orange"
              onClick={onOpen}
              size="lg"
            >
              Create Team
            </Button>
          </Flex>

          {/* Teams Grid */}
          {teams.length === 0 ? (
            <Card bg={cardBg} borderColor={cardBorder}>
              <CardBody textAlign="center" py={12}>
                <Box color={emptyStateIconColor}>
                  <FiUsers size="48" />
                </Box>
                <Heading size="md" color={emptyStateHeadingColor} mt={4} mb={2}>
                  No Teams Yet
                </Heading>
                <Text color={emptyStateTextColor} mb={6}>
                  Create your first team to start managing athletes and coaches
                </Text>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="orange"
                  onClick={onOpen}
                >
                  Create Your First Team
                </Button>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {teams.map((team) => (
                <Card key={team.id} bg={cardBg} borderColor={cardBorder} _hover={{ shadow: 'lg' }} transition="all 0.2s">
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      {/* Team Header */}
                      <HStack justify="space-between" align="start">
                        <Box flex={1}>
                          <Heading size="md" color={teamNameColor} noOfLines={1}>
                            {team.name}
                          </Heading>
                          <Badge
                            colorScheme={getTeamTypeColor(team.team_type)}
                            size="sm"
                            mt={1}
                          >
                            {team.team_type.charAt(0).toUpperCase() + team.team_type.slice(1)}
                          </Badge>
                        </Box>
                        <HStack spacing={1}>
                          <Tooltip label="View Details">
                            <IconButton
                              aria-label="View team details"
                              icon={<FiEye />}
                              size="sm"
                              variant="ghost"
                              colorScheme="orange"
                            />
                          </Tooltip>
                          <Tooltip label="Team Settings">
                            <IconButton
                              aria-label="Team settings"
                              icon={<FiSettings />}
                              size="sm"
                              variant="ghost"
                              colorScheme="orange"
                            />
                          </Tooltip>
                        </HStack>
                      </HStack>

                      {/* Description */}
                      {team.description && (
                        <Text fontSize="sm" color={descriptionColor} noOfLines={2}>
                          {team.description}
                        </Text>
                      )}

                      {/* Stats */}
                      <HStack spacing={4}>
                        <VStack spacing={0} align="start">
                          <Text fontSize="xs" color={labelColor}>Created</Text>
                          <Text fontSize="sm" fontWeight="medium" color={valueColor}>
                            {formatDate(team.created_at)}
                          </Text>
                        </VStack>
                        <VStack spacing={0} align="start">
                          <Text fontSize="xs" color={labelColor}>Members</Text>
                          <Text fontSize="sm" fontWeight="medium" color={valueColor}>
                            {memberCounts[team.id] || 0}
                          </Text>
                        </VStack>
                      </HStack>

                      {/* Invite Code */}
                      <Box
                        bg={inviteCodeBg}
                        border="1px"
                        borderColor={inviteCodeBorder}
                        borderRadius="md"
                        p={3}
                      >
                        <HStack justify="space-between">
                          <Box>
                            <Text fontSize="xs" color={inviteCodeLabelColor} fontWeight="medium">
                              Invite Code
                            </Text>
                            <Text fontSize="lg" fontWeight="bold" color={inviteCodeValueColor} fontFamily="mono">
                              {team.invite_code}
                            </Text>
                          </Box>
                          <Tooltip label="Copy invite code">
                            <IconButton
                              aria-label="Copy invite code"
                              icon={<FiCopy />}
                              size="sm"
                              colorScheme="orange"
                              variant="ghost"
                              onClick={() => handleCopyInviteCode(team.invite_code, team.name)}
                            />
                          </Tooltip>
                        </HStack>
                      </Box>

                      {/* Team Management Sections */}
                      <VStack spacing={2}>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="blue"
                            rightIcon={expandedSection[team.id] === 'coaches' ? <FiChevronUp /> : <FiChevronDown />}
                            onClick={() => toggleTeamSection(team.id, 'coaches')}
                            flex={1}
                          >
                            Coaches
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="green"
                            rightIcon={expandedSection[team.id] === 'athletes' ? <FiChevronUp /> : <FiChevronDown />}
                            onClick={() => toggleTeamSection(team.id, 'athletes')}
                            flex={1}
                          >
                            Athletes
                          </Button>
                        </HStack>

                        {/* Expanded Sections */}
                        {expandedSection[team.id] === 'coaches' && (
                          <Box
                            p={3}
                            bg={useColorModeValue('blue.50', 'blue.900')}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={useColorModeValue('blue.200', 'blue.700')}
                            w="full"
                          >
                            <Text fontSize="sm" fontWeight="medium" mb={3}>
                              Team Coaches
                            </Text>
                            <TeamCoachesSection teamId={team.id} teamName={team.name} />
                          </Box>
                        )}

                        {expandedSection[team.id] === 'athletes' && (
                          <Box
                            p={3}
                            bg={useColorModeValue('green.50', 'green.900')}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={useColorModeValue('green.200', 'green.700')}
                            w="full"
                          >
                            <Text fontSize="sm" fontWeight="medium" mb={3}>
                              Team Athletes
                            </Text>
                            <TeamAthletesSection teamId={team.id} teamName={team.name} />
                          </Box>
                        )}

                        <Button
                          size="sm"
                          leftIcon={<FiMail />}
                          colorScheme="blue"
                          onClick={() => handleInviteClick(team)}
                          w="full"
                        >
                          Send Invitation
                        </Button>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>

      {/* Team Creation Modal */}
      <TeamSetupModal
        isOpen={isOpen}
        onClose={handleTeamCreated}
        userRole="team_manager"
      />

      {/* Send Invitation Modal */}
      {selectedTeam && (
        <SendTeamInviteModal
          isOpen={isInviteOpen}
          onClose={onInviteClose}
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          onSuccess={handleInviteSuccess}
        />
      )}
    </>
  );
} 