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
  AlertIcon
} from '@chakra-ui/react';
import { FiUsers, FiUserPlus, FiSearch } from 'react-icons/fi';
import { JoinTeamModal } from '../components/JoinTeamModal';
import { useUserRole } from '../hooks/useUserRole';

export default function JoinTeam() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { userRole, loading } = useUserRole();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const iconBg = useColorModeValue('blue.50', 'blue.900');
  const iconColor = useColorModeValue('blue.500', 'blue.300');

  const handleRefresh = () => {
    // Placeholder for refreshing teams/invitations
    console.log('Refreshing teams...');
  };

  if (loading) {
    return (
      <Container maxW="4xl" py={8}>
        <VStack spacing={6}>
          <Text>Loading...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <>
      <Box minH="100vh" bg={bgColor}>
        <Container maxW="4xl" py={8}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Box textAlign="center">
              <Box
                w={16}
                h={16}
                mx="auto"
                mb={4}
                borderRadius="full"
                bg={iconBg}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FiUsers} boxSize={8} color={iconColor} />
              </Box>
              <Heading size="xl" color={headingColor} mb={2}>
                Join a Team
              </Heading>
              <Text fontSize="lg" color={textColor} maxW="2xl" mx="auto">
                Use a 6-character invite code to join a team as {userRole === 'team_manager' ? 'a team manager' : `an ${userRole}`}
              </Text>
            </Box>

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

            {/* Main action card */}
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
                        bg={useColorModeValue('green.50', 'green.900')}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiSearch} boxSize={6} color={useColorModeValue('green.500', 'green.300')} />
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
                        bg={useColorModeValue('blue.50', 'blue.900')}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiUserPlus} boxSize={6} color={useColorModeValue('blue.500', 'blue.300')} />
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
                        bg={useColorModeValue('purple.50', 'purple.900')}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FiUsers} boxSize={6} color={useColorModeValue('purple.500', 'purple.300')} />
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