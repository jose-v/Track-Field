import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  SimpleGrid,
  useToast,
  useColorModeValue,
  Icon,
  Skeleton,
  Alert,
  AlertIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
} from '@chakra-ui/react';
import { FiUsers, FiLogOut, FiPlus } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getCoachTeams, leaveTeam, Team } from '../services/teamService';

export const CoachTeamsSection: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const iconBg = useColorModeValue('blue.50', 'blue.900');
  const iconColor = useColorModeValue('blue.500', 'blue.300');

  const fetchTeams = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const coachTeams = await getCoachTeams(user.id);
      setTeams(coachTeams);
    } catch (error) {
      console.error('Error fetching coach teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your teams',
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

  const handleLeaveTeam = (team: Team) => {
    setSelectedTeam(team);
    onOpen();
  };

  const confirmLeaveTeam = async () => {
    if (!selectedTeam || !user?.id) return;

    try {
      setLeavingTeamId(selectedTeam.id);
      const result = await leaveTeam(selectedTeam.id, user.id);

      if (result.success) {
        toast({
          title: 'Left Team',
          description: `You have left ${selectedTeam.name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchTeams(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to leave team',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLeavingTeamId(null);
      onClose();
      setSelectedTeam(null);
    }
  };

  const getTeamTypeColor = (type: string) => {
    switch (type) {
      case 'school': return 'blue';
      case 'club': return 'green';
      case 'independent': return 'orange';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        <Skeleton height="60px" borderRadius="md" />
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} height="120px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      </VStack>
    );
  }

  return (
    <>
      <Box>
        <HStack spacing={3} mb={6}>
          <Box
            p={2}
            borderRadius="lg"
            bg={iconBg}
            color={iconColor}
          >
            <Icon as={FiUsers} boxSize={5} />
          </Box>
          <VStack align="start" spacing={0}>
            <Heading size="md" color={headingColor}>
              My Teams
            </Heading>
            <Text fontSize="sm" color={textColor}>
              Teams you're coaching
            </Text>
          </VStack>
        </HStack>

        {teams.length === 0 ? (
          <Card bg={cardBg} borderColor={cardBorder}>
            <CardBody textAlign="center" py={8}>
              <Box color={textColor} mb={4}>
                <FiUsers size="32" />
              </Box>
              <Heading size="sm" color={headingColor} mb={2}>
                No Teams Yet
              </Heading>
              <Text color={textColor} mb={4} fontSize="sm">
                You haven't joined any teams as a coach yet
              </Text>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                size="sm"
                onClick={() => window.location.href = '/join-team'}
              >
                Join a Team
              </Button>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {teams.map((team) => (
              <Card key={team.id} bg={cardBg} borderColor={cardBorder} borderWidth="1px">
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <Heading size="sm" color={headingColor} noOfLines={1}>
                          {team.name}
                        </Heading>
                        <Badge
                          colorScheme={getTeamTypeColor(team.team_type)}
                          size="sm"
                        >
                          {team.team_type.charAt(0).toUpperCase() + team.team_type.slice(1)}
                        </Badge>
                      </VStack>
                    </HStack>

                    {team.description && (
                      <Text fontSize="sm" color={textColor} noOfLines={2}>
                        {team.description}
                      </Text>
                    )}

                    <Button
                      leftIcon={<FiLogOut />}
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeaveTeam(team)}
                      isLoading={leavingTeamId === team.id}
                      loadingText="Leaving..."
                    >
                      Leave Team
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Leave Team Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={cardBg} borderColor={cardBorder} borderWidth="1px">
          <ModalHeader>
            <HStack spacing={3}>
              <Box
                p={2}
                borderRadius="lg"
                bg={useColorModeValue('red.50', 'red.900')}
                color={useColorModeValue('red.500', 'red.300')}
              >
                <Icon as={FiLogOut} boxSize={5} />
              </Box>
              <Text>Leave Team</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Are you sure you want to leave "{selectedTeam?.name}"? You'll need an invite code to rejoin.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmLeaveTeam}
                isLoading={!!leavingTeamId}
                loadingText="Leaving..."
              >
                Leave Team
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}; 