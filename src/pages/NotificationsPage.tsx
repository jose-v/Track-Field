import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Divider,
  useColorModeValue,
  Spinner,
  Center,
  HStack,
  Icon,
  Badge,
  Button,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import NotificationsTable from '../components/NotificationsTable';
import CoachRequestStatusTable from '../components/CoachRequestStatusTable';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { MobileHeader } from '../components';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, isLoading } = useProfile();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  if (!user) {
    return (
      <Container maxW="container.lg" py={8}>
        {/* Mobile Header - Now using reusable component */}
        <MobileHeader
          title="Notifications"
          subtitle="Stay updated"
          isLoading={isLoading}
        />

        <VStack spacing={4} align="stretch" mt={{ base: "20px", lg: 0 }}>
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
        {/* Mobile Header - Now using reusable component */}
        <MobileHeader
          title="Notifications"
          subtitle="Stay updated"
          isLoading={isLoading}
        />

        <Center mt={{ base: "20px", lg: 0 }}>
          <Spinner size="xl" />
        </Center>
      </Container>
    );
  }

  // Check if the user is a coach
  const isCoach = profile?.role === 'coach';

  return (
    <Box 
      pt={0} 
      pb={10} 
      bg={useColorModeValue('gray.50', 'gray.900')} 
      minH="100vh"
      w="100%"
      maxW="100%"
      overflowX="hidden"
    >
      {/* Mobile Header - Now using reusable component */}
      <MobileHeader
        title="Notifications"
        subtitle="Stay updated"
        isLoading={isLoading}
      />

      {/* Desktop Header */}
      <Box display={{ base: "none", lg: "block" }} px={{ base: 4, md: 6 }} pt={6}>
        <Heading size="lg" mb={2}>
          Notifications
        </Heading>
        <Text color={useColorModeValue('gray.600', 'gray.300')}>
          Stay updated
        </Text>
      </Box>

      <Container maxW="container.md" px={{ base: 4, md: 6 }} mt={{ base: "20px", lg: 8 }}>
        <VStack spacing={4} align="stretch" mt={{ base: "20px", lg: 0 }}>
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
    </Box>
  );
};

export default NotificationsPage; 