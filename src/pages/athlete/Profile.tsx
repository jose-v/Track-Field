import React, { useRef, useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, Avatar, Heading, HStack, Select, Spinner, useToast, Text, useColorModeValue
} from '@chakra-ui/react';
import { FaUserAlt } from 'react-icons/fa';
import { useProfile } from '../../hooks/useProfile';
import { useAvatar } from '../../hooks/useAvatar';
import { useAvatarLoader } from '../../hooks/useAvatarLoader';
import ProfileCard from '../../components/ProfileCard';
import PageHeader from '../../components/PageHeader';
import { usePageHeader } from '../../hooks/usePageHeader';

const genderOptions = ['male', 'female', 'other'];

const AthleteProfile = () => {
  const { profile, isLoading, isError, error, updateProfile, isUpdatingProfile } = useProfile();
  const { uploading, uploadAvatar } = useAvatar();
  const { avatarUrl, loading: avatarLoading, refresh: refreshAvatar } = useAvatarLoader(profile?.id);
  const [form, setForm] = useState<any>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Add color mode aware styles - MOVED TO TOP to fix hooks order
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');
  const errorText = useColorModeValue('red.500', 'red.300');
  const headerTextColor = useColorModeValue('gray.800', 'white');
  const pageBackgroundColor = useColorModeValue('gray.50', 'gray.900');
  const headerSubtextColor = useColorModeValue('gray.600', 'gray.300');

  // Use the page header hook
  usePageHeader({
    title: 'My Profile',
    subtitle: 'Personal Information',
    icon: FaUserAlt
  });

  React.useEffect(() => {
    if (profile) {
      // Format date properly for HTML date input (YYYY-MM-DD)
      let formattedDate = '';
      if (profile.roleData?.date_of_birth) {
        const date = new Date(profile.roleData.date_of_birth);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split('T')[0];
        }
      }

      const formData = {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        gender: profile.roleData?.gender || '',
        date_of_birth: formattedDate,
        events: profile.roleData?.events?.join(', ') || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        bio: profile.bio || '',
      };
      
      setForm(formData);
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview immediately for better UX
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setAvatarPreview(event.target.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      const avatarUrl = await uploadAvatar(file);
      if (avatarUrl) {
        // Update the preview to the actual uploaded URL
        setAvatarPreview(avatarUrl);
        // Refresh the profile to load the new avatar
        refreshAvatar();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
          updateProfile({
        profile: {
          id: profile.id,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          avatar_url: avatarUrl || profile.avatar_url, // Use current avatar URL
          role: 'athlete',
          address: form.address,
          city: form.city,
          state: form.state,
          zip_code: form.zip_code,
          bio: form.bio,
        },
        roleData: {
          gender: form.gender || null, // Convert empty string to null
          date_of_birth: form.date_of_birth || null, // Convert empty string to null
          events: form.events.split(',').map((e: string) => e.trim()).filter(Boolean),
        },
      });
    setEditMode(false);
  };

  if (isLoading) return <Spinner size="xl" mt={10} color="blue.500" />;
  if (isError) return <Text color={errorText}>{error?.message || 'Failed to load profile.'}</Text>;
  if (!profile) return <Text>No profile found.</Text>;

  // Example stats (replace with real data as needed)
  const stats = [
    { label: 'Workouts', value: profile.stats?.workouts ?? 0 },
    { label: 'PRs', value: profile.stats?.prs ?? 0 },
    { label: 'Followers', value: profile.stats?.followers ?? 0 },
  ];

  const infoList = [
    { label: 'Email', value: profile.email },
    { label: 'Phone', value: profile.phone },
    { label: 'Gender', value: profile.roleData?.gender },
    { label: 'Date of Birth', value: profile.roleData?.date_of_birth },
    { label: 'Events', value: profile.roleData?.events?.join(', ') },
    { label: 'Address', value: profile.address },
    { label: 'City', value: profile.city },
    { label: 'State', value: profile.state },
    { label: 'Zip Code', value: profile.zip_code },
  ];

  return (
    <Box 
      pt={0} 
      pb={10} 
      bg={pageBackgroundColor} 
      minH="100vh"
      w="100%"
      maxW="100%"
      overflowX="hidden"
    >
      {/* Desktop Header */}
      <PageHeader
        title="My Profile"
        subtitle="Personal Information"
        icon={FaUserAlt}
      />

      <Box maxW="lg" mx="auto" mt={{ base: "20px", lg: 8 }}>
        {!editMode ? (
                  <ProfileCard
          avatarUrl={avatarUrl || undefined}
          bannerColor="#1976d2"
          name={`${profile.first_name} ${profile.last_name}`}
          role="Athlete"
          stats={stats}
          bio={profile.bio}
          infoList={infoList}
          onEdit={() => setEditMode(true)}
          onAvatarEdit={handleAvatarClick}
          onAction={() => {}}
          editLabel="Edit Profile"
          actionLabel="View Stats"
        />
        ) : (
          <Box p={6} borderWidth={1} borderRadius="lg" boxShadow="md" bg={cardBg} borderColor={borderColor}>
            <Heading size="lg" mb={6}>Edit Athlete Profile</Heading>
            <form onSubmit={handleSubmit}>
              <VStack spacing={5} align="stretch">
                <FormControl>
                  <FormLabel>Avatar</FormLabel>
                  <HStack>
                    <Avatar 
                      size="xl" 
                      src={avatarPreview || avatarUrl || undefined} 
                      name={`${form.first_name} ${form.last_name}`} 
                      onClick={handleAvatarClick} 
                      cursor="pointer" 
                    />
                    <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} />
                    <Button 
                      onClick={handleAvatarClick} 
                      variant="outline"
                      isLoading={uploading}
                      loadingText="Uploading..."
                    >
                      Change
                    </Button>
                  </HStack>
                </FormControl>
                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input name="first_name" value={form.first_name} onChange={handleChange} bg={inputBg} />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input name="last_name" value={form.last_name} onChange={handleChange} bg={inputBg} />
                  </FormControl>
                </HStack>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input name="email" type="email" value={form.email} onChange={handleChange} bg={inputBg} />
                </FormControl>
                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input name="phone" value={form.phone} onChange={handleChange} bg={inputBg} />
                </FormControl>
                <FormControl>
                  <FormLabel>Gender</FormLabel>
                  <Select name="gender" value={form.gender} onChange={handleChange} placeholder="Select gender" bg={inputBg}>
                    {genderOptions.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Date of Birth</FormLabel>
                  <Input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} bg={inputBg} />
                </FormControl>
                <FormControl>
                  <FormLabel>Events (comma separated)</FormLabel>
                  <Input name="events" value={form.events} onChange={handleChange} placeholder="e.g. 100m, 200m, Long Jump" bg={inputBg} />
                </FormControl>
                <FormControl>
                  <FormLabel>Address</FormLabel>
                  <Input name="address" value={form.address} onChange={handleChange} bg={inputBg} />
                </FormControl>
                <HStack spacing={4}>
                  <FormControl>
                    <FormLabel>City</FormLabel>
                    <Input name="city" value={form.city} onChange={handleChange} bg={inputBg} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>State</FormLabel>
                    <Input name="state" value={form.state} onChange={handleChange} bg={inputBg} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Zip Code</FormLabel>
                    <Input name="zip_code" value={form.zip_code} onChange={handleChange} bg={inputBg} />
                  </FormControl>
                </HStack>
                <FormControl>
                  <FormLabel>Bio</FormLabel>
                  <Input name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about yourself..." bg={inputBg} />
                </FormControl>
                <HStack justify="flex-end">
                  <Button variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
                  <Button colorScheme="blue" type="submit" isLoading={isUpdatingProfile}>Save Changes</Button>
                </HStack>
              </VStack>
            </form>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AthleteProfile; 