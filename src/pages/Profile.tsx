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
  Code,
  IconButton,
  Spinner,
  Grid,
  GridItem,
  SimpleGrid,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { api } from '../services/api'
import { FaCamera } from 'react-icons/fa'

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
  const [debugInfo, setDebugInfo] = useState<any>(null)
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
        console.log('Setting avatar URL from profile:', remoteProfile.avatar_url);
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
        console.log('Fetched coaches:', coachesData)
        setCoaches(coachesData)
      } catch (error) {
        console.error('Error fetching coaches:', error)
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
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with profile:', profile);
    
    if (!profile.events || profile.events.length === 0) {
      toast({
        title: 'Please select at least one event',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    // Transform UI profile to database format
    const dbProfile = {
      // Map from name to first_name/last_name
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio,
      role: profile.role, // this is already in DB format
      team: profile.team,
      school: profile.school || '',
      city: profile.city || '',
      coach: profile.coach || '',
      state: profile.state || '',
      address: profile.address || '',
      country: profile.country || '',
    }
    
    // Get athlete-specific data
    const athleteData = {
      birth_date: profile.dob,
      gender: profile.gender,
      events: profile.events,
      // We'd need team_id instead of team name, but for now let's skip it
    }
    
    console.log('Saving profile:', dbProfile);
    console.log('Athlete data:', athleteData);
    
    // Let's try a more direct approach
    try {
      // Get the current user
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) {
          console.error('No user found');
          return;
        }
        
        console.log('Current user:', user.id);
        
        // Update the profile record
        supabase
          .from('profiles')
          .update({
            first_name: dbProfile.first_name,
            last_name: dbProfile.last_name,
            email: dbProfile.email,
            phone: dbProfile.phone,
            bio: dbProfile.bio,
            role: profile.role,
            team: dbProfile.team,
            coach: dbProfile.coach,
            school: dbProfile.school,
            city: dbProfile.city,
            state: dbProfile.state,
            address: dbProfile.address,
            country: dbProfile.country,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .then(({ data, error }) => {
            if (error) {
              console.error('Error updating profile:', error);
              toast({
                title: 'Error updating profile',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
              return;
            }
            
            console.log('Profile updated:', data);
            
            // Update the athlete record
            supabase
              .from('athletes')
              .update({
                birth_date: athleteData.birth_date,
                gender: athleteData.gender,
                events: athleteData.events
              })
              .eq('id', user.id)
              .then(({ data: athleteData, error: athleteError }) => {
                if (athleteError) {
                  console.error('Error updating athlete:', athleteError);
                  toast({
                    title: 'Error updating athlete data',
                    description: athleteError.message,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                  });
                  return;
                }
                
                console.log('Athlete updated:', athleteData);
                
                // Success!
                setIsEditing(false);
                toast({
                  title: 'Profile updated',
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                });
                
                // Refresh the page after 1 second
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              });
          });
      });
    } catch (err) {
      console.error('Error in profile update:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  const showDebugInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // First check if there are multiple profile records
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
    
    // Then check if there are multiple athlete records
    const { data: allAthletes, error: athletesError } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', user?.id)

    // Try to get a single profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single()
    
    // Try to get a single athlete record
    const { data: athleteData, error: athleteError } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', user?.id)
      .single()
    
    setDebugInfo({
      userId: user?.id,
      email: user?.email,
      profileCount: allProfiles?.length || 0,
      allProfiles: allProfiles,
      profilesError: profilesError?.message,
      profileExists: !!profileData,
      profileError: profileError?.message,
      athleteCount: allAthletes?.length || 0,
      allAthletes: allAthletes,
      athletesError: athletesError?.message,
      athleteExists: !!athleteData,
      athleteError: athleteError?.message
    })

    // Add a fix button that will show only after checking
    setShowFixButton(true);
  }

  const [showFixButton, setShowFixButton] = useState(false);
  
  const fixProfileIssue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found');

      // 1. First, check if there's already a profile with this email
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        
      // If profile with this email exists but with different ID, we need a different approach
      if (existingProfiles && existingProfiles.length > 0) {
        // Delete existing profile by email
        await supabase
          .from('profiles')
          .delete()
          .eq('email', user.email);
      }

      // 2. Delete any existing profiles for this user ID
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      // 3. Delete any existing athlete records for this user
      await supabase
        .from('athletes')
        .delete()
        .eq('id', user.id);
        
      // 4. Create a new profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          email: user.email,
          first_name: 'Your',
          last_name: 'Name',
          role: 'athlete' as UserRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (profileError) throw profileError;
      
      // 5. Create a new athlete record
      const { error: athleteError } = await supabase
        .from('athletes')
        .insert([{
          id: user.id,
          birth_date: '2000-01-01',
          gender: 'male',
          events: ['100m Sprint', '200m Sprint']
        }]);
        
      if (athleteError) throw athleteError;
      
      // 6. Show success message
      toast({
        title: 'Profile fixed',
        description: 'Your profile has been repaired. Please refresh the page.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh the debug info
      await showDebugInfo();
      
    } catch (error: any) {
      toast({
        title: 'Error fixing profile',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error("Profile fix error:", error);
    }
  }

  // Add a function to directly fix with SQL - updated to match actual DB schema
  const directSqlFix = async () => {
    try {
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

      // Get profile values from the form
      const firstName = profile.first_name;
      const lastName = profile.last_name;
      const email = profile.email;
      const phone = profile.phone;
      const bio = profile.bio;
      
      // Athlete-specific data
      const gender = profile.gender;
      const dob = profile.dob;
      const events = profile.events;

      // Create SQL command
      const sql = `
-- Update profile (name, contact info, bio)
UPDATE public.profiles 
SET 
  first_name = '${firstName}',
  last_name = '${lastName}',
  phone = '${phone || ''}',
  bio = '${bio || ''}',
  updated_at = NOW()
WHERE id = '${user.id}';

-- Update athlete data (birth date, gender, events)
UPDATE public.athletes
SET
  birth_date = ${dob ? `'${dob}'` : 'NULL'},
  gender = '${gender}',
  events = ARRAY[${events.map(e => `'${e}'`).join(', ')}]
WHERE id = '${user.id}';
      `;

      console.log('Running SQL:', sql);

      // Show SQL for copying
      toast({
        title: 'SQL Command',
        description: 'Copy this SQL and run it in Supabase SQL Editor:',
        status: 'info',
        duration: 10000,
        isClosable: true,
      });

      // Copy to clipboard
      navigator.clipboard.writeText(sql)
        .then(() => {
          console.log('SQL copied to clipboard');
          toast({
            title: 'SQL Copied',
            description: 'The SQL command has been copied to your clipboard. Paste it in the Supabase SQL Editor.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });

    } catch (err) {
      console.error('Error generating SQL:', err);
      toast({
        title: 'Error',
        description: 'Could not generate SQL',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Function to handle avatar click - modified to be independent from isEditing
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Function to handle file selection - modified to work independent of profile editing state
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    await uploadAvatar(file);
  };
  
  // Dedicated function for avatar upload
  const uploadAvatar = async (file: File) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // First create a local preview immediately (this works without Supabase)
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        // Update local preview immediately
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    
    console.log('Starting avatar upload process', { userId: user.id, fileName });
    
    try {
      setIsUploadingAvatar(true);
      
      // Upload the file to Supabase Storage
      let uploadResult;
      try {
        uploadResult = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            upsert: true, // Replace if exists
            cacheControl: '3600',
            contentType: file.type,
          });
      } catch (uploadError) {
        console.error('Exception during upload:', uploadError);
        uploadResult = { data: null, error: uploadError };
      }
      
      const { data, error } = uploadResult;
      
      if (error) {
        console.error('Error uploading to storage:', error);
        // Don't throw - we'll still use the client-side preview
        // and try to update the profile with the data URL
        
        // Extract preview data URL
        const clientSideUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        // Update profile with data URL as fallback
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: clientSideUrl })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('Error updating profile with client-side avatar:', updateError);
          } else {
            // Try to refresh profile
            if (updateProfile) {
              try {
                await updateProfile({ profile: { avatar_url: clientSideUrl } });
              } catch (e) {
                console.error('Error refreshing profile after client-side avatar update', e);
              }
            }
            
            toast({
              title: 'Avatar Updated (Client-Side Only)',
              description: 'Storage upload failed, but avatar was saved to your profile.',
              status: 'info',
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (updateException) {
          console.error('Exception during profile update with client-side URL:', updateException);
          toast({
            title: 'Error',
            description: 'Failed to update avatar',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        
        setIsUploadingAvatar(false);
        return; // Exit early with client-side solution
      }
      
      console.log('File uploaded successfully:', data);
      
      // Get public URL
      let publicUrl = '';
      try {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;
      } catch (urlError) {
        console.error('Error getting public URL:', urlError);
        setIsUploadingAvatar(false);
        return;
      }
      
      console.log('Generated public URL:', publicUrl);
      
      // Add cache-busting query parameter to prevent browser caching
      const cacheBustedUrl = `${publicUrl}?t=${new Date().getTime()}`;
      
      // Update the avatar URL state immediately for UI feedback
      setAvatarUrl(cacheBustedUrl);
      
      // Update profile in database - using await to properly handle promise
      console.log('Updating profile with new avatar URL');
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: cacheBustedUrl })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('Error updating profile with avatar URL:', updateError);
          setIsUploadingAvatar(false);
          toast({
            title: 'Error',
            description: 'Failed to update profile with avatar URL',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        
        console.log('Profile updated successfully with new avatar URL');
        
        // Force reload image to ensure it's updated
        const img = new Image();
        img.src = cacheBustedUrl;
        
        // Refresh the profile data if needed
        if (updateProfile) {
          try {
            // This is a controlled update that we'll try but not wait for
            updateProfile({ profile: { avatar_url: cacheBustedUrl } });
            console.log('Profile refresh initiated after avatar update');
          } catch (refreshError) {
            console.warn('Could not refresh profile after avatar update:', refreshError);
          }
        }
        
        toast({
          title: 'Success',
          description: 'Avatar updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Optional: Force a page reload after timeout to refresh all components
        // This is in a timeout to ensure all UI updates happen before reload
        setTimeout(() => {
          try {
            window.location.reload();
          } catch (reloadError) {
            console.warn('Error during page reload:', reloadError);
          }
        }, 2000);
      } catch (profileUpdateException) {
        console.error('Exception during profile update:', profileUpdateException);
        toast({
          title: 'Error',
          description: 'Unexpected error while updating avatar',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      toast({
        title: 'Error',
        description: 'Failed to upload avatar. Make sure you have proper storage permissions.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) return <Text>Loading profile...</Text>
  if (isError) return (
    <Box py={8}>
      <VStack spacing={4} align="stretch">
        <Text>Error loading profile.</Text>
        <HStack spacing={4}>
          <Button colorScheme="blue" onClick={showDebugInfo}>Debug Profile</Button>
          {showFixButton && (
            <Button colorScheme="green" onClick={fixProfileIssue}>Fix Profile</Button>
          )}
          <Button colorScheme="purple" onClick={directSqlFix}>Generate SQL Fix</Button>
        </HStack>
        {debugInfo && (
          <Box bg="gray.100" p={4} borderRadius="md">
            <VStack align="start">
              <Text fontWeight="bold">Debug Info:</Text>
              <Code>{JSON.stringify(debugInfo, null, 2)}</Code>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  )

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
                      <Text>{profile.dob ? new Date(profile.dob).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Not set'}</Text>
                    </HStack>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">Events:</Text>
                      <Text pl={2}>{profile.events && profile.events.length > 0 
                        ? profile.events.join(', ') 
                        : 'No events selected'}</Text>
                    </VStack>
                  </VStack>
                </Box>
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
            <VStack spacing={6} align="stretch">
              <HStack spacing={6}>
                  {/* Avatar with upload capability - independent from profile editing */}
                  <Box position="relative">
                    <Avatar 
                      size="xl" 
                      name={`${profile.first_name} ${profile.last_name}`} 
                      src={avatarUrl || undefined}
                      cursor="pointer"
                      onClick={handleAvatarClick}
                      opacity={isUploadingAvatar ? 0.7 : 1}
                    />
                    <IconButton
                      aria-label="Upload photo"
                      icon={<FaCamera />}
                      size="sm"
                      colorScheme="brand"
                      rounded="full"
                      position="absolute"
                      bottom="0"
                      right="0"
                      onClick={handleAvatarClick}
                      isLoading={isUploadingAvatar}
                    />
                  </Box>
                <VStack align="start" spacing={1}>
                    <Heading size="md">{`${profile.first_name} ${profile.last_name}`}</Heading>
                    <Text color="gray.600">{dbRolesToUiRoles[profile.role]}</Text>
                  <Text fontSize="sm">{profile.team}</Text>
                </VStack>
              </HStack>

                {/* First Name */}
              <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                <Input
                    value={profile.first_name}
                  onChange={(e) =>
                      setProfile({ ...profile, first_name: e.target.value })
                  }
                />
              </FormControl>

                {/* Last Name */}
              <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    value={profile.last_name}
                  onChange={(e) =>
                      setProfile({ ...profile, last_name: e.target.value })
                    }
                  />
                </FormControl>

                {/* Role - Read Only */}
                <FormControl>
                  <FormLabel>Role</FormLabel>
                  <Input
                    value={dbRolesToUiRoles[profile.role]}
                    isReadOnly
                    isDisabled
                  />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Team</FormLabel>
                <Input
                  value={profile.team}
                  onChange={(e) =>
                    setProfile({ ...profile, team: e.target.value })
                  }
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
                  placeholder="Enter your school name"
                />
              </FormControl>

                {/* Email - Read Only */}
                <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={profile.email}
                    isReadOnly
                    isDisabled
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>Email cannot be changed as it's used for login</Text>
              </FormControl>

              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  type="tel"
                  value={profile.phone}
                    onChange={handlePhoneChange}
                    placeholder="(123) 456-7890"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Input
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  />
                </FormControl>

                {/* Address Section - Reordered */}
                <Heading size="sm" mt={2} mb={2}>Address Information</Heading>
                
                {/* Address */}
                <FormControl>
                  <FormLabel>Street Address</FormLabel>
                  <Input
                    value={profile.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Enter your street address"
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

              {/* Events - Updated to 3 columns */}
              <FormControl>
                <FormLabel>Events</FormLabel>
                <CheckboxGroup
                  colorScheme="blue"
                  defaultValue={profile.events}
                  onChange={(vals) => {
                    console.log('Selected events:', vals);
                    setProfile({ ...profile, events: vals as string[] });
                  }}
                >
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2}>
                    {EVENT_OPTIONS.map((ev) => (
                      <Checkbox key={ev} value={ev} isChecked={profile.events?.includes(ev)}>
                        {ev}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
              </FormControl>

              {/* Coach Selection */}
              <FormControl>
                <FormLabel>Coach</FormLabel>
                {isLoadingCoaches ? (
                  <HStack spacing={2} py={2}>
                    <Spinner size="sm" />
                    <Text>Loading coaches...</Text>
                  </HStack>
                ) : (
                  <Select
                    value={profile.coach || ''}
                    onChange={e => setProfile({ ...profile, coach: e.target.value })}
                    placeholder="Select coach"
                  >
                    {coaches.length > 0 ? (
                      coaches.map(coach => (
                        <option key={coach.id} value={coach.full_name}>{coach.full_name}</option>
                      ))
                    ) : (
                      <option value="" disabled>No coaches available</option>
                    )}
                  </Select>
                )}
              </FormControl>

                <Button type="submit" colorScheme="blue" size="lg" mt={4}>
                  Save Changes
                </Button>
            </VStack>
          </form>
        </Box>
        )}

        {/* Debug Buttons - hidden in production */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <HStack spacing={4}>
              <Button colorScheme="blue" onClick={showDebugInfo}>Debug Profile</Button>
              {showFixButton && (
                <Button colorScheme="green" onClick={fixProfileIssue}>Fix Profile</Button>
              )}
              <Button colorScheme="purple" onClick={directSqlFix}>Generate SQL Fix</Button>
            </HStack>
            {debugInfo && (
              <Box bg="gray.100" p={4} borderRadius="md">
                <VStack align="start">
                  <Text fontWeight="bold">Debug Info:</Text>
                  <Code>{JSON.stringify(debugInfo, null, 2)}</Code>
                </VStack>
              </Box>
            )}
          </>
        )}
      </VStack>
    </Box>
  )
} 