import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Avatar,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Divider,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Icon,
  Flex,
  useDisclosure,
  useColorModeValue
} from '@chakra-ui/react';
import {
  FaBuilding,
  FaUsers,
  FaUserTie,
  FaRunning,
  FaEdit,
  FaUpload,
  FaExchangeAlt,
  FaGlobe,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendar,
  FaUser
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getInstitutionalProfile, getInstitutionStats } from '../../services/institutionService';
import { InstitutionalProfile } from '../../types/institution';
import { EditInstitutionModal } from '../../components/modals/EditInstitutionModal';
import { TransferManagerModal } from '../../components/modals/TransferManagerModal';
import { LogoUploadModal } from '../../components/modals/LogoUploadModal';
import { EditManagerProfileModal } from '../../components/modals/EditManagerProfileModal';

export function TeamManagerProfile() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<InstitutionalProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Modal controls
  const editModal = useDisclosure();
  const transferModal = useDisclosure();
  const logoModal = useDisclosure();
  const personalProfileModal = useDisclosure();

  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load profile and stats in parallel
      const [profileData, statsData] = await Promise.all([
        getInstitutionalProfile(user.id),
        getInstitutionStats(user.id)
      ]);

      setProfile(profileData);
      setStats(statsData);

      if (!profileData) {
        setError('No institutional profile found. Please create a team first.');
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Failed to load profile data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load institutional profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    loadProfileData();
    toast({
      title: 'Success',
      description: 'Institutional profile updated successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleLogoUpdate = (newLogoUrl: string) => {
    if (profile) {
      setProfile({ ...profile, logo_url: newLogoUrl });
    }
    toast({
      title: 'Success',
      description: 'Institution logo updated successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handlePersonalProfileUpdate = () => {
    // Personal profile updates don't affect institutional profile
    // Just show success message
    toast({
      title: 'Success',
      description: 'Personal profile updated successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Container maxW="6xl" py={8}>
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading institutional profile...</Text>
          </VStack>
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="6xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Profile Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxW="6xl" py={8}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>No Institution Profile</AlertTitle>
            <AlertDescription>
              Create your first team to set up your institutional profile.
            </AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header Section */}
        <Card bg={cardBg}>
          <CardBody>
            <HStack spacing={6} align="start">
              <Box position="relative">
                <Avatar
                  size="2xl"
                  src={profile.logo_url}
                  name={profile.institution_name}
                  bg="blue.500"
                  icon={<Icon as={FaBuilding} boxSize={8} />}
                />
                <Button
                  size="sm"
                  position="absolute"
                  bottom={0}
                  right={0}
                  borderRadius="full"
                  colorScheme="blue"
                  onClick={logoModal.onOpen}
                >
                  <Icon as={FaUpload} />
                </Button>
              </Box>

              <VStack align="start" flex={1} spacing={2}>
                <HStack>
                  <Heading size="lg">{profile.institution_name || 'Unnamed Institution'}</Heading>
                  <Badge colorScheme="blue" variant="subtle">
                    {profile.institution_type?.replace('_', ' ').toUpperCase() || 'INSTITUTION'}
                  </Badge>
                </HStack>

                <HStack spacing={4} color={textColor}>
                  <HStack>
                    <Icon as={FaUserTie} />
                    <Text>{profile.manager_first_name} {profile.manager_last_name}</Text>
                  </HStack>
                  <Text>•</Text>
                  <Text>{profile.manager_title || 'Team Manager'}</Text>
                </HStack>

                {profile.city && profile.state && (
                  <HStack color={textColor}>
                    <Icon as={FaMapMarkerAlt} />
                    <Text>{profile.city}, {profile.state}</Text>
                  </HStack>
                )}

                <HStack spacing={2} mt={4}>
                  <Button
                    leftIcon={<Icon as={FaEdit} />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={editModal.onOpen}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    leftIcon={<Icon as={FaExchangeAlt} />}
                    colorScheme="orange"
                    variant="outline"
                    onClick={transferModal.onOpen}
                  >
                    Transfer Management
                  </Button>
                </HStack>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Personal Profile Section */}
        <Card bg={cardBg}>
          <CardHeader>
            <HStack justify="space-between" align="center">
              <Heading size="md">Personal Profile</Heading>
              <Button
                leftIcon={<Icon as={FaEdit} />}
                colorScheme="green"
                variant="outline"
                size="sm"
                onClick={personalProfileModal.onOpen}
              >
                Edit Personal Profile
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <Text color={textColor} mb={4}>
              Manage your personal information, contact details, and social media links.
            </Text>
            <HStack spacing={4}>
              <Button
                leftIcon={<Icon as={FaUser} />}
                variant="ghost"
                size="sm"
                onClick={personalProfileModal.onOpen}
              >
                Update Personal Info
              </Button>
              <Button
                leftIcon={<Icon as={FaPhone} />}
                variant="ghost"
                size="sm"
                onClick={personalProfileModal.onOpen}
              >
                Contact Details
              </Button>
              <Button
                leftIcon={<Icon as={FaGlobe} />}
                variant="ghost"
                size="sm"
                onClick={personalProfileModal.onOpen}
              >
                Social Links
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Statistics Section */}
        {stats && (
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Institution Statistics</Heading>
            </CardHeader>
            <CardBody>
              <StatGroup>
                <Stat>
                  <StatLabel>Teams</StatLabel>
                  <StatNumber color="blue.500">{stats.teams || 0}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Athletes</StatLabel>
                  <StatNumber color="green.500">{stats.athletes || 0}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Coaches</StatLabel>
                  <StatNumber color="purple.500">{stats.coaches || 0}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Active Invites</StatLabel>
                  <StatNumber color="orange.500">{stats.activeInvites || 0}</StatNumber>
                </Stat>
              </StatGroup>
            </CardBody>
          </Card>
        )}

        {/* Institution Details */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* Contact Information */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Contact Information</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={4}>
                {profile.phone && (
                  <HStack>
                    <Icon as={FaPhone} color={mutedTextColor} />
                    <Text>{profile.phone}</Text>
                  </HStack>
                )}
                
                {profile.website && (
                  <HStack>
                    <Icon as={FaGlobe} color={mutedTextColor} />
                    <Text
                      as="a"
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="blue.500"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      {profile.website}
                    </Text>
                  </HStack>
                )}

                {profile.address && (
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Icon as={FaMapMarkerAlt} color={mutedTextColor} />
                      <Text fontWeight="medium">Address</Text>
                    </HStack>
                    <Text ml={6} color={textColor}>
                      {profile.address}
                      {profile.city && `, ${profile.city}`}
                      {profile.state && `, ${profile.state}`}
                      {profile.zip_code && ` ${profile.zip_code}`}
                    </Text>
                  </VStack>
                )}

                {!profile.phone && !profile.website && !profile.address && (
                  <Text color={mutedTextColor} fontStyle="italic">
                    No contact information provided
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Institution Details */}
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Institution Details</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={4}>
                {profile.established_year && (
                  <HStack>
                    <Icon as={FaCalendar} color={mutedTextColor} />
                    <Text>Established {profile.established_year}</Text>
                  </HStack>
                )}

                <HStack>
                  <Icon as={FaBuilding} color={mutedTextColor} />
                  <Text>
                    {profile.institution_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Institution'}
                  </Text>
                </HStack>

                <VStack align="start" spacing={1}>
                  <HStack>
                    <Icon as={FaUserTie} color={mutedTextColor} />
                    <Text fontWeight="medium">Manager</Text>
                  </HStack>
                  <Text ml={6} color={textColor}>
                    {profile.manager_first_name} {profile.manager_last_name}
                  </Text>
                  <Text ml={6} color={mutedTextColor} fontSize="sm">
                    {profile.manager_email}
                  </Text>
                </VStack>

                {!profile.established_year && (
                  <Text color={mutedTextColor} fontStyle="italic">
                    Additional details can be added by editing the profile
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Quick Actions */}
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Quick Actions</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
              <Button
                leftIcon={<Icon as={FaUsers} />}
                variant="outline"
                onClick={() => window.location.href = '/team-manager/teams'}
              >
                Manage Teams
              </Button>
              <Button
                leftIcon={<Icon as={FaRunning} />}
                variant="outline"
                onClick={() => window.location.href = '/team-manager/athletes'}
              >
                View Athletes
              </Button>
              <Button
                leftIcon={<Icon as={FaUserTie} />}
                variant="outline"
                onClick={() => window.location.href = '/team-manager/coaches'}
              >
                Manage Coaches
              </Button>
              <Button
                leftIcon={<Icon as={FaEdit} />}
                colorScheme="blue"
                onClick={editModal.onOpen}
              >
                Edit Profile
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>

      {/* Modals */}
      <EditInstitutionModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        profile={profile}
        onUpdate={handleProfileUpdate}
      />

      <TransferManagerModal
        isOpen={transferModal.isOpen}
        onClose={transferModal.onClose}
        currentManagerId={user?.id || ''}
        institutionName={profile.institution_name || ''}
      />

      <LogoUploadModal
        isOpen={logoModal.isOpen}
        onClose={logoModal.onClose}
        managerId={user?.id || ''}
        currentLogoUrl={profile.logo_url}
        onLogoUpdate={handleLogoUpdate}
      />

      <EditManagerProfileModal
        isOpen={personalProfileModal.isOpen}
        onClose={personalProfileModal.onClose}
        onUpdate={handlePersonalProfileUpdate}
      />
    </Container>
  );
} 