import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Avatar,
  Divider,
  Badge,
  Icon,
  IconButton,
  Button,
  Flex,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaTimes, FaPhone, FaEnvelope, FaUsers } from 'react-icons/fa';

interface MobileAthleteDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: any;
  athleteTeams: any[];
  isLoadingTeams: boolean;
  onTeamManagement: () => void;
}

export const MobileAthleteDetailsDrawer: React.FC<MobileAthleteDetailsDrawerProps> = ({
  isOpen,
  onClose,
  athlete,
  athleteTeams,
  isLoadingTeams,
  onTeamManagement
}) => {
  // Theme colors following the app's bottom drawer pattern
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');
  const drawerText = useColorModeValue('gray.700', 'gray.200');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');

  // Helper function to get Badge color based on completion rate
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'green';
    if (rate >= 60) return 'yellow';
    return 'red';
  };

  if (!athlete) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      motionPreset="slideInBottom"
      closeOnOverlayClick={true}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        position="fixed"
        bottom="-12px"
        left="0"
        right="0"
        top="auto"
        height="auto"
        maxHeight="85vh"
        minHeight="400px"
        borderRadius="16px 16px 0 0"
        bg={drawerBg}
        border={`1px solid ${drawerBorder}`}
        boxShadow="2xl"
        margin="0"
        maxWidth="100vw"
        width="100vw"
        display="flex"
        flexDirection="column"
        paddingBottom="5px"
      >
        <ModalBody p={0} display="flex" flexDirection="column" overflowY="auto">
          {/* Header with Close Button */}
          <Flex 
            justify="space-between" 
            align="center" 
            p={6} 
            borderBottom={`1px solid ${drawerBorder}`}
            flexShrink={0}
          >
            <Text fontSize="xl" fontWeight="bold" color={drawerText}>
              Athlete Details
            </Text>
            
            <IconButton
              aria-label="Close athlete details"
              icon={<FaTimes />}
              size="lg"
              variant="ghost"
              borderRadius="full"
              onClick={onClose}
              color={drawerText}
              _hover={{ bg: buttonHoverBg }}
              fontSize="18px"
            />
          </Flex>

          {/* Content */}
          <VStack spacing={6} p={6} align="stretch">
            {/* Athlete Header */}
            <HStack spacing={4}>
              <Avatar 
                size="xl" 
                name={`${athlete.first_name} ${athlete.last_name}`} 
                src={athlete.avatar_url}
              />
              <Box flex="1">
                <Heading size="lg" color={drawerText}>
                  {`${athlete.first_name} ${athlete.last_name}`}
                </Heading>
                <Text color={subTextColor} fontSize="md">
                  Age: {athlete.age}
                </Text>
              </Box>
            </HStack>
            
            <Divider />
            
            {/* Contact Information */}
            <Box>
              <Heading size="sm" mb={4} color={drawerText}>
                Contact Information
              </Heading>
              <VStack align="start" spacing={3} p={4} bg={sectionBg} borderRadius="lg">
                <HStack spacing={3} w="100%">
                  <Icon as={FaPhone} color="green.500" boxSize={5} />
                  <Text color={drawerText} flex="1">
                    {athlete.phone || 'No phone number'}
                  </Text>
                </HStack>
                <HStack spacing={3} w="100%">
                  <Icon as={FaEnvelope} color="blue.500" boxSize={5} />
                  <Text color={drawerText} flex="1">
                    {athlete.email || 'No email'}
                  </Text>
                </HStack>
              </VStack>
            </Box>
            
            {/* Events */}
            <Box>
              <Heading size="sm" mb={4} color={drawerText}>
                Events
              </Heading>
              <Box p={4} bg={sectionBg} borderRadius="lg">
                {(athlete.events || []).length > 0 ? (
                  <Flex gap={2} flexWrap="wrap">
                    {athlete.events.map((event: string, index: number) => (
                      <Badge key={index} colorScheme="purple" py={1} px={3} borderRadius="full">
                        {event}
                      </Badge>
                    ))}
                  </Flex>
                ) : (
                  <Text color={subTextColor}>No events assigned</Text>
                )}
              </Box>
            </Box>
            
            {/* Team Information */}
            <Box>
              <Heading size="sm" mb={4} color={drawerText}>
                Team Information
              </Heading>
              <Box p={4} bg={sectionBg} borderRadius="lg">
                {isLoadingTeams ? (
                  <Flex align="center" gap={2}>
                    <Spinner size="sm" />
                    <Text fontSize="sm" color={drawerText}>Loading teams...</Text>
                  </Flex>
                ) : athleteTeams.length === 0 ? (
                  <Text color={subTextColor}>No teams assigned</Text>
                ) : (
                  <VStack align="start" spacing={2}>
                    {athleteTeams.map((team: any) => (
                      <HStack key={team.id} justify="space-between" w="100%">
                        <Text fontWeight="medium" color={drawerText}>{team.name}</Text>
                        <Badge colorScheme="blue" size="sm">
                          {team.team_type}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </Box>
            </Box>
            
            {/* Performance */}
            <Box>
              <Heading size="sm" mb={4} color={drawerText}>
                Performance
              </Heading>
              <Box p={4} bg={sectionBg} borderRadius="lg">
                <HStack justify="space-between">
                  <Text color={drawerText}>Workout Completion Rate:</Text>
                  <Badge colorScheme={getCompletionColor(athlete.completion_rate || 0)} size="lg">
                    {athlete.completion_rate || 0}%
                  </Badge>
                </HStack>
              </Box>
            </Box>

            {/* Action Buttons */}
            <VStack spacing={3} pt={4}>
              <Button
                colorScheme="purple"
                size="lg"
                width="100%"
                leftIcon={<Icon as={FaUsers} />}
                onClick={() => {
                  onClose();
                  onTeamManagement();
                }}
              >
                Team Assignment
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 