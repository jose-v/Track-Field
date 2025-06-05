import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useDisclosure,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  Divider,
  SimpleGrid,
  Icon,
  HStack,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { FaPlus, FaUsers, FaClock, FaCheckCircle, FaUserPlus } from 'react-icons/fa';
import { MobileHeader } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import AddAthleteModal from '../../components/AddAthleteModal';
import CoachRequestStatusTable from '../../components/CoachRequestStatusTable';
import { supabase } from '../../lib/supabase';

export function ManageAthletesPage() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { data: athletes = [], isLoading: athletesLoading } = useCoachAthletes();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  
  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  
  // Fetch pending requests count
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('coach_athletes')
          .select('id')
          .eq('coach_id', user.id)
          .eq('approval_status', 'pending');
        
        if (error) throw error;
        setPendingRequestsCount(data?.length || 0);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
        setPendingRequestsCount(0);
      }
    };
    
    fetchPendingRequests();
  }, [user?.id]);
  
  // Calculate stats
  const totalAthletes = athletes.length;
  const approvedRelationships = athletes.length; // All returned athletes are approved
  
  return (
    <Box 
      pt={0} 
      pb={10} 
      bg={bgColor} 
      minH="100vh"
      w="100%"
      maxW="100%"
      overflowX="hidden"
    >
      {/* Mobile Header */}
      <MobileHeader
        title="Manage Athletes"
        subtitle="Invite and manage your team"
        isLoading={profileLoading}
      />

      {/* Desktop Header */}
      <Box display={{ base: "none", lg: "block" }} px={{ base: 4, md: 6 }} pt={6}>
        <Heading size="lg" mb={2}>
          Manage Athletes
        </Heading>
        <Text color={textColor}>
          Invite athletes to your team and manage existing relationships
        </Text>
      </Box>

      <Container maxW="container.xl" px={{ base: 4, md: 6 }} mt={{ base: "20px", lg: 8 }}>
        <VStack spacing={6} align="stretch">
          
          {/* Quick Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Total Athletes</StatLabel>
                  <StatNumber color={accentColor}>{totalAthletes}</StatNumber>
                  <StatHelpText>Active team members</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Pending Requests</StatLabel>
                  <StatNumber color="orange.500">{pendingRequestsCount}</StatNumber>
                  <StatHelpText>Awaiting athlete approval</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel color={textColor}>Approved</StatLabel>
                  <StatNumber color="green.500">{approvedRelationships}</StatNumber>
                  <StatHelpText>Active relationships</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Main Action Card */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <Heading size="md">Invite Athletes</Heading>
                  <Text fontSize="sm" color={textColor}>
                    Add existing athletes or create new accounts to build your team
                  </Text>
                </VStack>
                <Button
                  leftIcon={<Icon as={FaUserPlus} />}
                  colorScheme="blue"
                  onClick={onOpen}
                  size="lg"
                >
                  Invite Athletes
                </Button>
              </HStack>
            </CardHeader>
            
            <CardBody pt={0}>
              <Divider mb={4} />
              <VStack align="start" spacing={3}>
                <HStack>
                  <Icon as={FaUsers} color="blue.500" />
                  <Text fontSize="sm" color={textColor}>
                    <strong>Browse & Invite:</strong> Search existing athlete accounts and send invitations
                  </Text>
                </HStack>
                <HStack>
                  <Icon as={FaPlus} color="green.500" />
                  <Text fontSize="sm" color={textColor}>
                    <strong>Create & Invite:</strong> Create new athlete accounts and automatically send invitations
                  </Text>
                </HStack>
                <HStack>
                  <Icon as={FaClock} color="orange.500" />
                  <Text fontSize="sm" color={textColor}>
                    <strong>Pending Approval:</strong> Athletes receive notifications and can approve/decline your requests
                  </Text>
                </HStack>
                <HStack>
                  <Icon as={FaCheckCircle} color="purple.500" />
                  <Text fontSize="sm" color={textColor}>
                    <strong>Automatic Linking:</strong> Once approved, athletes appear in your roster automatically
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Request Status Table */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md">Invitation Status</Heading>
              <Text fontSize="sm" color={textColor} mt={1}>
                Track your sent invitations and their current status
              </Text>
            </CardHeader>
            <CardBody>
              <CoachRequestStatusTable />
            </CardBody>
          </Card>

          {/* How It Works */}
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
            <CardHeader>
              <Heading size="md">How the Invitation System Works</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={4}>
                <Box>
                  <Badge colorScheme="blue" mb={2}>Step 1</Badge>
                  <Text fontSize="sm" color={textColor}>
                    <strong>Send Invitation:</strong> Click "Invite Athletes" to browse existing athletes or create new accounts. 
                    When you select athletes, the system automatically creates pending coach-athlete relationships.
                  </Text>
                </Box>
                
                <Box>
                  <Badge colorScheme="orange" mb={2}>Step 2</Badge>
                  <Text fontSize="sm" color={textColor}>
                    <strong>Athlete Notification:</strong> Athletes receive notifications about your invitation. 
                    They can view details about you and choose to approve or decline the request.
                  </Text>
                </Box>
                
                <Box>
                  <Badge colorScheme="green" mb={2}>Step 3</Badge>
                  <Text fontSize="sm" color={textColor}>
                    <strong>Automatic Integration:</strong> Once an athlete approves your request, they automatically 
                    appear in your Athletes page, workout assignment lists, and all coaching tools.
                  </Text>
                </Box>
                
                <Box>
                  <Badge colorScheme="purple" mb={2}>Monitoring</Badge>
                  <Text fontSize="sm" color={textColor}>
                    <strong>Track Progress:</strong> Use the "Invitation Status" table above to monitor all your sent 
                    requests. You can send reminders for pending requests or see which athletes have declined.
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
      
      {/* Add Athlete Modal */}
      <AddAthleteModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
} 