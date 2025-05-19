import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Avatar,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  Checkbox,
  CheckboxGroup,
  Stack,
  IconButton,
  Spinner,
  Grid,
  GridItem,
  SimpleGrid,
  Icon,
  Divider,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { api } from '../services/api'
import { FaCamera } from 'react-icons/fa'
import { FiUser } from 'react-icons/fi'
import { GamificationSummary } from '../features/gamification/GamificationSummary'

// Add event list for selection
const EVENT_OPTIONS = [
  // Sprints
  '100 meters', '200 meters', '400 meters',
  // Middle-Distance
  '800 meters', '1500 meters', 'Mile Run (1609 meters)',
  // Long-Distance
  '3000 meters', '5000 meters', '10,000 meters',
  'Marathon (42.195 km)',
  // Hurdles
  '100m hurdles (women)', '110m hurdles (men)', '400m hurdles',
  // Relays
  '4x100m relay', '4x400m relay', '4x800m relay', 'Sprint Medley Relay',
  // Steeplechase
  '3000m steeplechase',
]

// Country and state data
const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'France',
  'Germany',
  'Japan',
  'China',
  'Brazil',
  'Mexico',
  'Spain',
  'Italy',
  'South Africa',
  'Kenya',
  'Jamaica',
];

// States by country
const STATES_BY_COUNTRY: Record<string, string[]> = {
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
    'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee',
    'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ],
  'Canada': [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon'
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland'
  ],
  'Australia': [
    'Australian Capital Territory', 'New South Wales', 'Northern Territory', 
    'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
  ],
  // Add more countries and their states/provinces as needed
};

// Add the following type to match the database schema
type UserRole = 'athlete' | 'coach' | 'team_manager';

export function calculateAge(dob: string) {
  if (!dob) return ''
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Update the interface to match the database schema
interface ProfileData {
  first_name: string;
  last_name: string;
  role: UserRole;
  team: string;
  email: string;
  phone: string;
  bio: string;
  gender: string;
  dob: string;
  events: string[];
  coach?: string;
  avatar_url?: string;
  city?: string;
  school?: string;
  state?: string;
  address?: string;
  country?: string;
}

// Map UI role labels to DB roles
const uiRolesToDbRoles: Record<string, UserRole> = {
  'Athlete': 'athlete',
  'Coach': 'coach',
  'Team Manager': 'team_manager'
};

// Map DB roles to UI role labels
const dbRolesToUiRoles: Record<UserRole, string> = {
  'athlete': 'Athlete',
  'coach': 'Coach',
  'team_manager': 'Team Manager'
};

// Fallback coach options in case API call fails
const FALLBACK_COACHES = [
  { id: '1', full_name: 'Coach Carter' },
  { id: '2', full_name: 'Coach Smith' },
  { id: '3', full_name: 'Coach Lee' },
  { id: '4', full_name: 'Coach Johnson' },
];

export function Profile() {
  const { user } = useAuth()
  const toast = useToast()
  const { profile: remoteProfile, isLoading, isError, updateProfile } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    role: 'athlete',
    team: 'Track Stars',
    email: user?.email || '',
    phone: '',
    bio: 'Track & Field athlete specializing in sprint events.',
    gender: '',
    dob: '',
    events: [],
    coach: '',
    school: '',
    state: '',
    address: '',
    country: 'United States',
  })
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<Array<{id: string, full_name: string}>>([])
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(false)
  const [availableStates, setAvailableStates] = useState<string[]>([])
  const [needsReload, setNeedsReload] = useState(false);

  // Update available states when country changes
  useEffect(() => {
    if (profile.country && STATES_BY_COUNTRY[profile.country]) {
      setAvailableStates(STATES_BY_COUNTRY[profile.country]);
    } else {
      setAvailableStates([]);
    }
  }, [profile.country]);

  // Format phone number to (xxx) xxx-xxxx
  const formatPhone = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Check if we have enough digits to format
    if (digits.length < 10) return digits;
    
    // Format as (xxx) xxx-xxxx
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`;
  }

  // Handle phone input change with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Store raw input
    const input = e.target.value;
    
    // Format and update
    setProfile({ ...profile, phone: formatPhone(input) });
  }

  // Load profile from Supabase on mount or when remoteProfile changes
  useEffect(() => {
    if (remoteProfile) {
      // Map remote data to our format
      setProfile({
        first_name: remoteProfile.first_name || '',
        last_name: remoteProfile.last_name || '',
        role: remoteProfile.role as UserRole || 'athlete',
        team: remoteProfile.team || 'Track Stars',
        email: remoteProfile.email || user?.email || '',
        phone: formatPhone(remoteProfile.phone || ''),
        bio: remoteProfile.bio || '',
        gender: remoteProfile.roleData?.gender || '',
        dob: remoteProfile.roleData?.birth_date || '',
        events: remoteProfile.roleData?.events || [],
        coach: remoteProfile.coach || '',
        city: remoteProfile.city || '',
        school: remoteProfile.school || '',
        state: remoteProfile.state || '',
        address: remoteProfile.address || '',
        country: remoteProfile.country || 'United States',
      })
      
      // Load avatar URL if it exists
      if (remoteProfile.avatar_url) {
        setAvatarUrl(remoteProfile.avatar_url);
      }
    }
    // eslint-disable-next-line
  }, [remoteProfile])

  // Fetch coaches from the database
  useEffect(() => {
    const fetchCoaches = async () => {
      setIsLoadingCoaches(true)
      try {
        const coachesData = await api.coaches.getAll()
        setCoaches(coachesData)
      } catch (error) {
        setCoaches(FALLBACK_COACHES)
        toast({
          title: 'Error fetching coaches',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } finally {
        setIsLoadingCoaches(false)
      }
    }
    
    fetchCoaches()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Route to the appropriate handler based on role
    if (profile.role === 'coach' as UserRole) {
      return handleCoachSubmit(e);
    } else if (profile.role === 'athlete' as UserRole) {
      return handleAthleteSubmit(e);
    }
    
    if (!profile.events || profile.events.length === 0) {
      toast({
        title: 'Please select at least one event',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Transform UI profile to database format
    const dbProfile = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio,
      role: profile.role,
      team: profile.team,
      school: profile.school || '',
      city: profile.city || '',
      coach: profile.coach || '',
      state: profile.state || '',
      address: profile.address || '',
      country: profile.country || '',
      avatar_url: avatarUrl || remoteProfile?.avatar_url || '',
    };
    
    // Create role-specific data based on profile.role
    let roleData: any = {};
    
    if (profile.role === 'athlete') {
      roleData = {
        birth_date: profile.dob,
        gender: profile.gender,
        events: profile.events,
      };
    } else if (profile.role === 'team_manager') {
      roleData = {
        organization: remoteProfile?.roleData?.organization || ''
      };
    }
    
    // Use the updateProfile function from the useProfile hook
    try {
      if (updateProfile) {
        updateProfile({
          profile: dbProfile,
          roleData: roleData,
        });
        
        setIsEditing(false);
        showSuccessToast();
        
        // Add a state to track if data has been saved and needs reloading
        setNeedsReload(true);
      } else {
        throw new Error('Update profile function not available');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while saving your profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Special handler just for coach profiles
  const handleCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get the user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'User not found',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // First update the basic profile
      const basicProfile = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
        role: 'coach',
        team: profile.team,
        school: profile.school || '',
        city: profile.city || '',
        state: profile.state || '',
        address: profile.address || '',
        country: profile.country || '',
        avatar_url: avatarUrl || remoteProfile?.avatar_url || '',
      };
      
      // Update basic profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(basicProfile)
        .eq('id', user.id);
        
      if (profileError) {
        throw profileError;
      }
      
      // Get the coach-specific data
      const gender = profile.gender || 'male';
      const dob = profile.dob || '2000-01-01';
      const events = Array.isArray(profile.events) ? profile.events : [];
      
      // Update coach data directly
      await api.profile.updateCoachDirectly(user.id, {
        gender: gender,
        birth_date: dob,
        events: events,
        specialties: remoteProfile?.roleData?.specialties || [],
        certifications: remoteProfile?.roleData?.certifications || []
      });
      
      // Show success message
      setIsEditing(false);
      showSuccessToast();
      
      // Add a state to track if data has been saved and needs reloading
      setNeedsReload(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update coach profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Modified handleAthleteSubmit with better logging
  const handleAthleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get the user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'User not found',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Validate required fields
      if (!profile.events || profile.events.length === 0) {
        toast({
          title: 'Please select at least one event',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Get the athlete-specific data
      const gender = profile.gender || 'male';
      const birth_date = profile.dob || '2000-01-01';
      const events = Array.isArray(profile.events) ? profile.events : [];
      const first_name = profile.first_name;
      const last_name = profile.last_name;
      
      // Log the payload and field types for debugging
      console.log('=== ATHLETE PATCH PAYLOAD ===', { gender, birth_date, events, first_name, last_name });
      Object.entries({ gender, birth_date, events, first_name, last_name }).forEach(([key, value]) => {
        console.log(`Field: ${key}, Value:`, value, ', Type:', Array.isArray(value) ? 'array' : typeof value);
      });
      
      // First check if athlete record exists
      const { data: existingAthlete, error: checkError } = await supabase
        .from('athletes')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (checkError) {
        // Create athlete record if it doesn't exist
        const { error: createError } = await supabase
          .from('athletes')
          .insert({
            id: user.id,
            gender: gender,
            birth_date: birth_date,
            events: events,
            first_name: first_name,
            last_name: last_name
          });
          
        if (createError) {
          throw createError;
        }
      } else {
        // Update athlete data directly
        const { error: athleteError } = await supabase
          .from('athletes')
          .update({
            gender,
            birth_date,
            events,
            first_name,
            last_name
          })
          .eq('id', user.id);
        
        if (athleteError) {
          throw athleteError;
        }
      }
      
      // Show success message
      setIsEditing(false);
      showSuccessToast();
      
      // Add a state to track if data has been saved and needs reloading
      setNeedsReload(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update athlete profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadAvatar(file);
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploadingAvatar(true);
      
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      // Generate a unique file name to prevent overwriting existing files
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      const avatarUrl = urlData.publicUrl;
      
      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setAvatarUrl(avatarUrl);
      
      toast({
        title: 'Success',
        description: 'Avatar uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const showSuccessToast = () => {
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully updated.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  if (isLoading) return <Text>Loading profile...</Text>
  if (isError) return <Text>Error loading profile.</Text>

  return (
    <Box py={8} maxW="800px" mx="auto">
      <VStack spacing={8} align="stretch">
        {/* Header with buttons */}
        <HStack justify="space-between">
          <Heading>Profile</Heading>
          <HStack spacing={4}>
            <Button
              colorScheme="brand"
              variant="outline"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              leftIcon={<FaCamera />}
              isLoading={isUploadingAvatar}
            >
              Update Photo
            </Button>
          <Button
            colorScheme="brand"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </HStack>
        </HStack>

        {/* Profile Card - Redesigned */}
        {!isEditing ? (
          <Box 
            borderRadius="lg" 
            overflow="hidden" 
            boxShadow="md"
            bg="white"
          >
            {/* Hero Image Background */}
            <Box 
              h="180px" 
              bg="linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)" 
              position="relative"
            >
              {/* Overlay for better text contrast if needed */}
              <Box 
                position="absolute" 
                bottom={0} 
                left={0} 
                right={0}
                height="50%" 
                bgGradient="linear(to-t, rgba(0,0,0,0.3), transparent)"
              />
            </Box>
            
            {/* Profile Content */}
            <Box px={6} pt={16} pb={6} mt="-80px" position="relative">
              {/* Avatar */}
              <Box 
                position="relative" 
                mb={4}
                width="fit-content"
                mx="auto"
              >
                <Avatar 
                  size="2xl" 
                  name={`${profile.first_name} ${profile.last_name}`} 
                  src={avatarUrl || undefined}
                  cursor="pointer"
                  onClick={handleAvatarClick}
                  border="4px solid white"
                  boxShadow="sm"
                />
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  display="none"
                />
              </Box>
              
              {/* Name and Basic Info - Centered */}
              <VStack spacing={1} mb={6} textAlign="center">
                <Heading size="lg">{`${profile.first_name} ${profile.last_name}`}</Heading>
                <Text color="gray.600">{dbRolesToUiRoles[profile.role]} at {profile.team}</Text>
                <Text mt={1} color="gray.500" fontSize="sm">{profile.city || 'Location not set'}</Text>
                
                {/* Stats */}
                <HStack spacing={8} justify="center" mt={4}>
                  <VStack spacing={0}>
                    <Text fontWeight="bold" fontSize="xl">{profile.events?.length || 0}</Text>
                    <Text color="gray.500" fontSize="sm">Events</Text>
                  </VStack>
                  <VStack spacing={0}>
                    <Text fontWeight="bold" fontSize="xl">{calculateAge(profile.dob)}</Text>
                    <Text color="gray.500" fontSize="sm">Age</Text>
                  </VStack>
                </HStack>
              </VStack>
              
              {/* Contact and Bio Section */}
              <VStack align="stretch" spacing={4} mt={6}>
                <Box p={4} bg="gray.50" borderRadius="md">
                  <VStack align="start" spacing={3}>
                    <Heading size="sm" mb={2}>Contact Information</Heading>
                    <HStack>
                      <Text fontWeight="medium" minW="80px">Email:</Text>
                      <Text>{profile.email}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="medium" minW="80px">Phone:</Text>
                      <Text>{profile.phone || 'Not set'}</Text>
                    </HStack>
                    {profile.coach && (
                      <HStack>
                        <Text fontWeight="medium" minW="80px">Coach:</Text>
                        <Text>{profile.coach}</Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
                
                {/* Bio Section */}
                {profile.bio && (
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Heading size="sm" mb={2}>About</Heading>
                    <Text>{profile.bio}</Text>
                  </Box>
                )}
                
                {/* Athletic Details */}
                <Box p={4} bg="gray.50" borderRadius="md">
                  <VStack align="start" spacing={3}>
                    <Heading size="sm" mb={2}>Athletic Details</Heading>
                    <HStack>
                      <Text fontWeight="medium" minW="80px">Gender:</Text>
                      <Text>{profile.gender ? (profile.gender === 'male' ? 'Male' : 'Female') : 'Not set'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="medium" minW="80px">DOB:</Text>
                      <Text>{profile.dob ? (() => {
                        // Fix timezone issue by parsing the date parts directly
                        const [year, month, day] = profile.dob.split('-').map(num => parseInt(num, 10));
                        const date = new Date(year, month - 1, day);
                        return date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      })() : 'Not set'}</Text>
                    </HStack>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">Events:</Text>
                      <Text pl={2}>{profile.events && profile.events.length > 0 
                        ? profile.events.join(', ') 
                        : 'No events selected'}</Text>
                    </VStack>
                  </VStack>
                </Box>
                
                {/* Gamification Section - Only show for athletes */}
                {profile.role === 'athlete' && user && (
                  <GamificationSummary athleteId={user.id} />
                )}
              </VStack>
              
              {/* Edit Button at Bottom */}
              <Button
                colorScheme="brand"
                variant="outline"
                size="md"
                onClick={() => setIsEditing(true)}
                mt={6}
                width="100%"
              >
                Edit Profile
              </Button>
            </Box>
          </Box>
        ) : (
          // Edit Form - with our updates
        <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
          <form onSubmit={handleSubmit}>
            <VStack spacing={5} align="stretch">
              {/* Basic Information */}
              <FormControl isRequired>
                <FormLabel>First Name</FormLabel>
                <Input
                  value={profile.first_name}
                  onChange={(e) =>
                    setProfile({ ...profile, first_name: e.target.value })
                  }
                  placeholder="Enter your first name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Last Name</FormLabel>
                <Input
                  value={profile.last_name}
                  onChange={(e) =>
                    setProfile({ ...profile, last_name: e.target.value })
                  }
                  placeholder="Enter your last name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  placeholder="Enter your email"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  value={profile.phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter your phone number"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Input
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  placeholder="Enter your bio"
                />
              </FormControl>

              {/* Role Selection */}
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={profile.role}
                  onChange={(e) =>
                    setProfile({ ...profile, role: e.target.value as UserRole })
                  }
                >
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach</option>
                  <option value="team_manager">Team Manager</option>
                </Select>
              </FormControl>

              {/* Team Name */}
              <FormControl>
                <FormLabel>Team</FormLabel>
                <Input
                  value={profile.team}
                  onChange={(e) =>
                    setProfile({ ...profile, team: e.target.value })
                  }
                  placeholder="Enter your team"
                />
              </FormControl>

              {/* School */}
              <FormControl>
                <FormLabel>School</FormLabel>
                <Input
                  value={profile.school || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, school: e.target.value })
                  }
                  placeholder="Enter your school"
                />
              </FormControl>

              {/* Coach Selection - Only show for athletes */}
              {profile.role === 'athlete' && (
                <FormControl>
                  <FormLabel>Coach</FormLabel>
                  <Select
                    value={profile.coach || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, coach: e.target.value })
                    }
                    placeholder={isLoadingCoaches ? "Loading coaches..." : "Select a coach"}
                    isDisabled={isLoadingCoaches}
                  >
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.full_name}>
                        {coach.full_name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Address */}
              <FormControl>
                <FormLabel>Address</FormLabel>
                <Input
                  value={profile.address || ''}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                  placeholder="Enter your address"
                />
              </FormControl>

              {/* City */}
              <FormControl>
                <FormLabel>City</FormLabel>
                <Input
                    value={profile.city || ''}
                    onChange={(e) =>
                      setProfile({ ...profile, city: e.target.value })
                    }
                    placeholder="Enter your city"
                />
              </FormControl>

              {/* Country dropdown */}
              <FormControl>
                <FormLabel>Country</FormLabel>
                <Select
                  value={profile.country || ''}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value, state: '' })}
                  placeholder="Select country"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </Select>
              </FormControl>

              {/* State dropdown - dynamic based on selected country */}
              <FormControl>
                <FormLabel>State/Province</FormLabel>
                {availableStates.length > 0 ? (
                  <Select
                    value={profile.state || ''}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    placeholder="Select state/province"
                  >
                    {availableStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    value={profile.state || ''}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    placeholder="Enter your state/province"
                  />
                )}
              </FormControl>

              {/* Gender */}
              <FormControl isRequired>
                <FormLabel>Gender</FormLabel>
                <Select
                  value={profile.gender}
                  onChange={e => setProfile({ ...profile, gender: e.target.value })}
                  placeholder="Select gender"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </Select>
              </FormControl>

              {/* Date of Birth */}
              <FormControl isRequired>
                <FormLabel>Date of Birth</FormLabel>
                <Input
                  type="date"
                  value={profile.dob}
                  onChange={e => setProfile({ ...profile, dob: e.target.value })}
                />
                {profile.dob && (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Age: {calculateAge(profile.dob)}
                  </Text>
                )}
              </FormControl>

              {/* Events - Updated to 3 columns with unique ids */}
              <FormControl>
                <FormLabel>Events</FormLabel>
                <CheckboxGroup
                  colorScheme="blue"
                  defaultValue={profile.events}
                  onChange={(vals) => {
                    setProfile({ ...profile, events: vals as string[] });
                  }}
                >
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2}>
                    {EVENT_OPTIONS.map((ev, idx) => (
                      <Checkbox
                        key={ev}
                        value={ev}
                        isChecked={profile.events?.includes(ev)}
                        id={`event-checkbox-${idx}`}
                      >
                        {ev}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
              </FormControl>

                <Button type="submit" colorScheme="blue" size="lg" mt={4}>
                  Save Changes
                </Button>
            </VStack>
          </form>
        </Box>
        )}
      </VStack>
    </Box>
  )
} 