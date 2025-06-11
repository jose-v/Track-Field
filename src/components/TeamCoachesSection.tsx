import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  SimpleGrid,
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
import { getTeamCoaches, removeCoachFromTeam } from '../services/teamService';

interface Coach {
  id: string;
  coach_id: string;
  role: string;
  created_at: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface TeamCoachesSectionProps {
  teamId: string;
  teamName: string;
}

export const TeamCoachesSection: React.FC<TeamCoachesSectionProps> = ({
  teamId,
  teamName
}) => {
  const { user } = useAuth();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingCoachId, setRemovingCoachId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const toast = useToast();

  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');

  const fetchCoaches = async () => {
    try {
      setIsLoading(true);
      const teamCoaches = await getTeamCoaches(teamId);
      setCoaches(teamCoaches);
    } catch (error) {
      console.error('Error fetching team coaches:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team coaches',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, [teamId]);

  const handleRemoveCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    onOpen();
  };

  const confirmRemoveCoach = async () => {
    if (!selectedCoach || !user?.id) return;

    try {
      setRemovingCoachId(selectedCoach.coach_id);
      const result = await removeCoachFromTeam(teamId, selectedCoach.coach_id, user.id);

      if (result.success) {
        toast({
          title: 'Coach Removed',
          description: `${selectedCoach.profiles.first_name} ${selectedCoach.profiles.last_name} has been removed from ${teamName}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchCoaches(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to remove coach',
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
      setRemovingCoachId(null);
      onClose();
      setSelectedCoach(null);
    }
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  if (coaches.length === 0) {
    return (
      <Box 
        textAlign="center" 
        py={6} 
        px={4}
        bg={useColorModeValue('blue.50', 'blue.900')}
        borderRadius="lg"
        border="2px dashed"
        borderColor={useColorModeValue('blue.200', 'blue.700')}
      >
        <VStack spacing={3}>
          <Box 
            color={useColorModeValue('blue.400', 'blue.300')} 
            p={3}
            borderRadius="full"
            bg={useColorModeValue('blue.100', 'blue.800')}
          >
            <Icon as={FiUsers} boxSize={6} />
          </Box>
          <VStack spacing={1}>
            <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('blue.700', 'blue.200')}>
              No coaches assigned yet
            </Text>
            <Text fontSize="xs" color={useColorModeValue('blue.600', 'blue.300')}>
              Send invitations to add coaches to this team
            </Text>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <>
      <VStack spacing={3} align="stretch">
        {coaches.map((coach) => (
          <Box
            key={coach.id}
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
                  name={`${coach.profiles.first_name} ${coach.profiles.last_name}`}
                  src={coach.profiles.avatar_url}
                />
                <VStack spacing={1} align="start" flex={1}>
                  <HStack spacing={2} align="center" wrap="wrap">
                    <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.800', 'white')}>
                      {coach.profiles.first_name} {coach.profiles.last_name}
                    </Text>
                    {coach.role && coach.role !== 'coach' && (
                      <Badge 
                        colorScheme="blue" 
                        variant="subtle" 
                        size="sm"
                        borderRadius="full"
                        px={2}
                        py={1}
                        textTransform="capitalize"
                      >
                        {coach.role.replace('_', ' ')}
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color={textColor} noOfLines={1}>
                    {coach.profiles.email}
                  </Text>
                  <Text fontSize="xs" color={textColor}>
                    Joined {formatJoinDate(coach.created_at)}
                  </Text>
                </VStack>
              </HStack>

              <Button
                size="sm"
                leftIcon={<FiUserMinus />}
                colorScheme="red"
                variant="outline"
                onClick={() => handleRemoveCoach(coach)}
                isLoading={removingCoachId === coach.coach_id}
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

      {/* Remove Coach Confirmation Modal */}
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
              <Text>Remove Coach</Text>
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
                    {selectedCoach?.profiles.first_name} {selectedCoach?.profiles.last_name}
                  </strong>{' '}
                  from "{teamName}"? They will lose access to the team and all associated data.
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
                onClick={confirmRemoveCoach}
                isLoading={!!removingCoachId}
                loadingText="Removing..."
              >
                Remove Coach
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}; 