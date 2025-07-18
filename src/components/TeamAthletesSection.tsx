import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  useToast,
  useColorModeValue,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Alert,
  AlertIcon,
  Icon,
  Skeleton,
  Flex
} from '@chakra-ui/react';
import { FiUsers, FiTrash2, FiUserMinus } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getTeamAthletes, removeAthleteFromTeam } from '../services/teamService';

interface Athlete {
  id: string;
  gender?: string;
  events?: string[];
  date_of_birth?: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface TeamAthletesSectionProps {
  teamId: string;
  teamName: string;
}

export const TeamAthletesSection: React.FC<TeamAthletesSectionProps> = ({
  teamId,
  teamName
}) => {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingAthleteId, setRemovingAthleteId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const toast = useToast();

  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');

  const fetchAthletes = async () => {
    try {
      setIsLoading(true);
      const teamAthletes = await getTeamAthletes(teamId);
      setAthletes(teamAthletes);
    } catch (error) {
      console.error('Error fetching team athletes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team athletes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, [teamId]);

  const handleRemoveAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    onOpen();
  };

  const confirmRemoveAthlete = async () => {
    if (!selectedAthlete || !user?.id) return;

    try {
      setRemovingAthleteId(selectedAthlete.id);
      const result = await removeAthleteFromTeam(selectedAthlete.id);

      if (result.success) {
        toast({
          title: 'Athlete Removed',
          description: `${selectedAthlete.profiles.first_name} ${selectedAthlete.profiles.last_name} has been removed from ${teamName}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchAthletes(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to remove athlete',
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
      setRemovingAthleteId(null);
      onClose();
      setSelectedAthlete(null);
    }
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <VStack spacing={3} align="stretch">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} height="80px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  if (athletes.length === 0) {
    return (
      <Box 
        textAlign="center" 
        py={6} 
        px={4}
        bg={useColorModeValue('green.50', 'green.900')}
        borderRadius="lg"
        border="2px dashed"
        borderColor={useColorModeValue('green.200', 'green.700')}
      >
        <VStack spacing={3}>
          <Box 
            color={useColorModeValue('green.400', 'green.300')} 
            p={3}
            borderRadius="full"
            bg={useColorModeValue('green.100', 'green.800')}
          >
            <Icon as={FiUsers} boxSize={6} />
          </Box>
          <VStack spacing={1}>
            <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('green.700', 'green.200')}>
              No athletes on this team yet
            </Text>
            <Text fontSize="xs" color={useColorModeValue('green.600', 'green.300')}>
              Send invitations to add athletes to this team
            </Text>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <>
      <VStack spacing={3} align="stretch">
        {athletes.map((athlete) => (
          <Box
            key={athlete.id}
            p={4}
            bg={cardBg}
            borderColor={cardBorder}
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="sm"
            _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
            transition="all 0.2s"
          >
            <Flex justify="space-between" align="start">
              <HStack spacing={3} flex={1}>
                <Avatar
                  size="md"
                  name={`${athlete.profiles.first_name} ${athlete.profiles.last_name}`}
                  src={athlete.profiles.avatar_url}
                />
                <VStack spacing={1} align="start" flex={1}>
                  <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.800', 'white')}>
                    {athlete.profiles.first_name} {athlete.profiles.last_name}
                  </Text>
                  <Text fontSize="xs" color={textColor} noOfLines={1}>
                    {athlete.profiles.email}
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {getAge(athlete.date_of_birth) && (
                      <Text fontSize="xs" color={textColor}>
                        Age {getAge(athlete.date_of_birth)}
                      </Text>
                    )}
                    <Text fontSize="xs" color={textColor}>
                      Joined {formatJoinDate(athlete.created_at)}
                    </Text>
                  </HStack>
                  {athlete.events && athlete.events.length > 0 && (
                    <HStack spacing={1} mt={1} flexWrap="wrap">
                      {athlete.events.slice(0, 3).map((event, index) => (
                        <Badge key={index} size="sm" colorScheme="green" variant="subtle" borderRadius="full">
                          {event}
                        </Badge>
                      ))}
                      {athlete.events.length > 3 && (
                        <Badge size="sm" variant="outline" borderRadius="full">
                          +{athlete.events.length - 3} more
                        </Badge>
                      )}
                    </HStack>
                  )}
                </VStack>
              </HStack>

              <Button
                size="sm"
                leftIcon={<FiUserMinus />}
                colorScheme="red"
                variant="outline"
                onClick={() => handleRemoveAthlete(athlete)}
                isLoading={removingAthleteId === athlete.id}
                loadingText="Removing"
                ml={3}
                flexShrink={0}
              >
                Remove
              </Button>
            </Flex>
          </Box>
        ))}
      </VStack>

      {/* Remove Athlete Confirmation Modal */}
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
                <Icon as={FiTrash2} boxSize={5} />
              </Box>
              <Text>Remove Athlete</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Are you sure you want to remove{' '}
                  <strong>
                    {selectedAthlete?.profiles.first_name} {selectedAthlete?.profiles.last_name}
                  </strong>{' '}
                  from "{teamName}"? They will no longer be part of this team.
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
                onClick={confirmRemoveAthlete}
                isLoading={!!removingAthleteId}
                loadingText="Removing..."
              >
                Remove Athlete
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}; 