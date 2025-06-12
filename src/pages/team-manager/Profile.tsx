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
  FaUser,
  FaLinkedin,
  FaTwitter
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getInstitutionalProfile, getInstitutionStats } from '../../services/institutionService';
import { supabase } from '../../lib/supabase';
import { InstitutionalProfile } from '../../types/institution';
import { EditInstitutionModal } from '../../components/modals/EditInstitutionModal';
import { TransferManagerModal } from '../../components/modals/TransferManagerModal';
import { LogoUploadModal } from '../../components/modals/LogoUploadModal';
import { EditManagerProfileModal } from '../../components/modals/EditManagerProfileModal';

interface PersonalProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
}

export function TeamManagerProfile() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<InstitutionalProfile | null>(null);
  const [personalProfile, setPersonalProfile] = useState<PersonalProfile | null>(null);
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

      // Load profile, stats, and personal profile in parallel
      const [profileData, statsData, personalProfileData] = await Promise.all([
        getInstitutionalProfile(user.id),
        getInstitutionStats(user.id),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
      ]);

      setProfile(profileData);
      setStats(statsData);
      
      if (personalProfileData.data) {
        setPersonalProfile(personalProfileData.data);
      }

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

  const handlePersonalProfileUpdate = async () => {
    // Reload personal profile data after update
    if (user?.id) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setPersonalProfile(data);
        }
      } catch (error) {
        console.error('Error reloading personal profile:', error);
      }
    }
    
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
            {personalProfile ? (
              <HStack spacing={6} align="start">
                {/* Avatar Section */}
                <Box position="relative">
                  <Avatar
                    size="xl"
                    src={personalProfile.avatar_url}
                    name={`${personalProfile.first_name} ${personalProfile.last_name}`}
                    bg="green.500"
                  />
                </Box>

                {/* Personal Information */}
                <VStack align="start" flex={1} spacing={4}>
                  <VStack align="start" spacing={2}>
                    <Heading size="md">
                      {personalProfile.first_name} {personalProfile.last_name}
                    </Heading>
                    <Text color={textColor} fontSize="sm">
                      {personalProfile.email}
                    </Text>
                  </VStack>

                  {/* Contact & Bio */}
                  <VStack align="start" spacing={3} w="full">
                    {personalProfile.phone && (
                      <HStack>
                        <Icon as={FaPhone} color={mutedTextColor} />
                        <Text fontSize="sm">{personalProfile.phone}</Text>
                      </HStack>
                    )}

                    {personalProfile.bio && (
                      <VStack align="start" spacing={1} w="full">
                        <Text fontSize="sm" fontWeight="medium" color={textColor}>
                          Bio
                        </Text>
                        <Text fontSize="sm" color={textColor} lineHeight="1.5">
                          {personalProfile.bio}
                        </Text>
                      </VStack>
                    )}

                    {/* Social Links */}
                    {(personalProfile.linkedin_url || personalProfile.twitter_url || personalProfile.website_url) && (
                      <VStack align="start" spacing={2} w="full">
                        <Text fontSize="sm" fontWeight="medium" color={textColor}>
                          Social Links
                        </Text>
                        <HStack spacing={4} flexWrap="wrap">
                          {personalProfile.linkedin_url && (
                            <HStack
                              as="a"
                              href={personalProfile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="blue.500"
                              _hover={{ color: "blue.600", textDecoration: "underline" }}
                              fontSize="sm"
                            >
                              <Icon as={FaLinkedin} />
                              <Text>LinkedIn</Text>
                            </HStack>
                          )}
                          {personalProfile.twitter_url && (
                            <HStack
                              as="a"
                              href={personalProfile.twitter_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="blue.400"
                              _hover={{ color: "blue.500", textDecoration: "underline" }}
                              fontSize="sm"
                            >
                              <Icon as={FaTwitter} />
                              <Text>Twitter</Text>
                            </HStack>
                          )}
                          {personalProfile.website_url && (
                            <HStack
                              as="a"
                              href={personalProfile.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="green.500"
                              _hover={{ color: "green.600", textDecoration: "underline" }}
                              fontSize="sm"
                            >
                              <Icon as={FaGlobe} />
                              <Text>Website</Text>
                            </HStack>
                          )}
                        </HStack>
                      </VStack>
                    )}
                  </VStack>
                </VStack>
              </HStack>
            ) : (
              <VStack spacing={4} align="center" py={8}>
                <Text color={mutedTextColor} textAlign="center">
                  No personal profile information available
                </Text>
                <Button
                  leftIcon={<Icon as={FaUser} />}
                  colorScheme="green"
                  variant="outline"
                  onClick={personalProfileModal.onOpen}
                >
                  Set Up Personal Profile
                </Button>
              </VStack>
            )}
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