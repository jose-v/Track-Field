import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Divider,
  useColorModeValue,
  Spinner,
  Center
} from '@chakra-ui/react';
import NotificationsTable from '../components/NotificationsTable';
import CoachRequestStatusTable from '../components/CoachRequestStatusTable';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, isLoading } = useProfile();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!user) {
    return (
      <Container maxW="container.lg" py={8}>
        {/* Mobile Header - Fixed positioned */}
        <Box
          display={{ base: "block", lg: "none" }}
          position="fixed"
          top="26px"
          right="16px"
          zIndex={1001}
          bg="transparent"
        >
          <Heading 
            size="md"
            color={useColorModeValue('gray.800', 'white')}
            textAlign="right"
            fontWeight="semibold"
          >
            Notifications
          </Heading>
        </Box>

        <VStack spacing={4} align="stretch" mt={{ base: "80px", lg: 0 }}>
          <Box p={6} borderWidth="1px" borderRadius="lg" bg={bgColor} borderColor={borderColor}>
            <Heading size="md" mb={4}>Notifications</Heading>
            <Text>Please log in to view your notifications.</Text>
          </Box>
        </VStack>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        {/* Mobile Header - Fixed positioned */}
        <Box
          display={{ base: "block", lg: "none" }}
          position="fixed"
          top="26px"
          right="16px"
          zIndex={1001}
          bg="transparent"
        >
          <Heading 
            size="md"
            color={useColorModeValue('gray.800', 'white')}
            textAlign="right"
            fontWeight="semibold"
          >
            Notifications
          </Heading>
        </Box>

        <Center mt={{ base: "80px", lg: 0 }}>
          <Spinner size="xl" />
        </Center>
      </Container>
    );
  }

  // Check if the user is a coach
  const isCoach = profile?.role === 'coach';

  return (
    <Container maxW="container.lg" py={8}>
      {/* Mobile Header - Fixed positioned */}
      <Box
        display={{ base: "block", lg: "none" }}
        position="fixed"
        top="26px"
        right="16px"
        zIndex={1001}
        bg="transparent"
      >
        <Heading 
          size="md"
          color={useColorModeValue('gray.800', 'white')}
          textAlign="right"
          fontWeight="semibold"
        >
          Notifications
        </Heading>
      </Box>

      <VStack spacing={4} align="stretch" mt={{ base: "80px", lg: 0 }}>
        {/* Desktop Header */}
        <Heading 
          size="lg" 
          mb={4}
          display={{ base: "none", lg: "block" }}
          color={useColorModeValue('gray.800', 'white')}
        >
          Notifications
        </Heading>

        <Box p={6} borderWidth="1px" borderRadius="lg" bg={bgColor} borderColor={borderColor}>
          <Heading size="md" mb={2} display={{ base: "block", lg: "none" }}>Your Notifications</Heading>
          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mb={4}>
            Review and manage your notifications, including coach requests.
          </Text>
          <Divider mb={4} />
          
          <NotificationsTable />
          
          {/* Display coach request status table for coaches */}
          {isCoach && <CoachRequestStatusTable />}
        </Box>
      </VStack>
    </Container>
  );
};

export default NotificationsPage; 