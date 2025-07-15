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
  useBreakpointValue,
} from '@chakra-ui/react';
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import NotificationsTable from '../components/NotificationsTable';
import CoachRequestStatusTable from '../components/CoachRequestStatusTable';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import PageHeader from '../components/PageHeader';
import { usePageHeader } from '../hooks/usePageHeader';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, isLoading } = useProfile();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Mobile/Desktop detection
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Use the page header hook
  usePageHeader({
    title: 'Notifications',
    subtitle: 'Stay updated',
    icon: FaBell
  });

  if (!user) {
    return (
      <Container maxW="container.lg" py={8}>
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
      bg={isMobile ? bgColor : useColorModeValue('gray.50', 'gray.900')} 
      minH="100vh"
      w="100%"
      maxW="100%"
      overflowX="hidden"
    >
      {/* Desktop Header - Hide on mobile */}
      {!isMobile && (
        <PageHeader
          title="Notifications"
          subtitle="Stay updated"
          icon={FaBell}
        />
      )}

      {isMobile ? (
        // Mobile: Full width, no container or card wrapper
        <Box w="100%" bg={bgColor}>
          <NotificationsTable />
          {/* Display coach request status table for coaches */}
          {isCoach && <CoachRequestStatusTable />}
        </Box>
      ) : (
        // Desktop: Keep existing container layout
        <Container maxW="container.md" px={{ base: 4, md: 6 }} mt={{ base: "20px", lg: 8 }}>
          <VStack spacing={4} align="stretch" mt={{ base: "20px", lg: 0 }}>
            <Box p={6} borderWidth="1px" borderRadius="lg" bg={bgColor} borderColor={borderColor}>
              <NotificationsTable />
              {/* Display coach request status table for coaches */}
              {isCoach && <CoachRequestStatusTable />}
            </Box>
          </VStack>
        </Container>
      )}
    </Box>
  );
};

export default NotificationsPage; 