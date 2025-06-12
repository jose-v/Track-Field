import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  VStack,
  HStack,
  useToast,
  Avatar,
  Box,
  Text,
  IconButton,
  useColorModeValue,
  Divider,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCamera,
  FaLinkedin,
  FaTwitter,
  FaGlobe,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ManagerProfile {
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

interface EditManagerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditManagerProfileModal({ isOpen, onClose, onUpdate }: EditManagerProfileModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    linkedin_url: '',
    twitter_url: '',
    website_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Color mode values
  const modalBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    if (isOpen && user?.id) {
      loadProfile();
    }
  }, [isOpen, user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        linkedin_url: data.linkedin_url || '',
        twitter_url: data.twitter_url || '',
        website_url: data.website_url || '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    } else if (formData.first_name.length > 50) {
      newErrors.first_name = 'First name must be less than 50 characters';
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    } else if (formData.last_name.length > 50) {
      newErrors.last_name = 'Last name must be less than 50 characters';
    }

    // Phone validation (optional)
    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Bio validation (optional)
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    // URL validations (optional)
    const urlPattern = /^https?:\/\/.+/;
    if (formData.linkedin_url && !urlPattern.test(formData.linkedin_url)) {
      newErrors.linkedin_url = 'LinkedIn URL must start with http:// or https://';
    }
    if (formData.twitter_url && !urlPattern.test(formData.twitter_url)) {
      newErrors.twitter_url = 'Twitter URL must start with http:// or https://';
    }
    if (formData.website_url && !urlPattern.test(formData.website_url)) {
      newErrors.website_url = 'Website URL must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be smaller than 5MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload profile picture',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user?.id) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          phone: formData.phone.trim() || null,
          bio: formData.bio.trim() || null,
          linkedin_url: formData.linkedin_url.trim() || null,
          twitter_url: formData.twitter_url.trim() || null,
          website_url: formData.website_url.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={modalBg}>
        <ModalHeader>Edit Personal Profile</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6}>
            {/* Avatar Section */}
            <Box textAlign="center">
              <Box position="relative" display="inline-block">
                <Avatar
                  size="2xl"
                  src={profile?.avatar_url}
                  name={`${formData.first_name} ${formData.last_name}`}
                />
                <IconButton
                  aria-label="Upload photo"
                  icon={<FaCamera />}
                  size="sm"
                  colorScheme="blue"
                  borderRadius="full"
                  position="absolute"
                  bottom={0}
                  right={0}
                  isLoading={uploading}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                />
              </Box>
              <Text fontSize="sm" color={textColor} mt={2}>
                Click the camera icon to upload a new photo
              </Text>
            </Box>

            <Divider />

            {/* Basic Information */}
            <VStack spacing={4} w="full">
              <Text fontSize="lg" fontWeight="semibold" alignSelf="start">
                Basic Information
              </Text>

              <HStack spacing={4} w="full">
                <FormControl isRequired isInvalid={!!errors.first_name}>
                  <FormLabel>First Name</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FaUser} color={textColor} />
                    </InputLeftElement>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="First name"
                    />
                  </InputGroup>
                  <FormErrorMessage>{errors.first_name}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.last_name}>
                  <FormLabel>Last Name</FormLabel>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FaUser} color={textColor} />
                    </InputLeftElement>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Last name"
                    />
                  </InputGroup>
                  <FormErrorMessage>{errors.last_name}</FormErrorMessage>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaEnvelope} color={textColor} />
                  </InputLeftElement>
                  <Input
                    value={profile?.email || ''}
                    isReadOnly
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    placeholder="Email address"
                  />
                </InputGroup>
                <Text fontSize="xs" color={textColor} mt={1}>
                  Email cannot be changed here. Contact support if needed.
                </Text>
              </FormControl>

              <FormControl isInvalid={!!errors.phone}>
                <FormLabel>Phone Number</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaPhone} color={textColor} />
                  </InputLeftElement>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Phone number"
                  />
                </InputGroup>
                <FormErrorMessage>{errors.phone}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.bio}>
                <FormLabel>Bio</FormLabel>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  resize="vertical"
                />
                <HStack justify="space-between" mt={1}>
                  <FormErrorMessage>{errors.bio}</FormErrorMessage>
                  <Text fontSize="xs" color={textColor}>
                    {formData.bio.length}/500
                  </Text>
                </HStack>
              </FormControl>
            </VStack>

            <Divider />

            {/* Social Links */}
            <VStack spacing={4} w="full">
              <Text fontSize="lg" fontWeight="semibold" alignSelf="start">
                Social Links (Optional)
              </Text>

              <FormControl isInvalid={!!errors.linkedin_url}>
                <FormLabel>LinkedIn Profile</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaLinkedin} color={textColor} />
                  </InputLeftElement>
                  <Input
                    value={formData.linkedin_url}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </InputGroup>
                <FormErrorMessage>{errors.linkedin_url}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.twitter_url}>
                <FormLabel>Twitter Profile</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaTwitter} color={textColor} />
                  </InputLeftElement>
                  <Input
                    value={formData.twitter_url}
                    onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/yourusername"
                  />
                </InputGroup>
                <FormErrorMessage>{errors.twitter_url}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.website_url}>
                <FormLabel>Personal Website</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaGlobe} color={textColor} />
                  </InputLeftElement>
                  <Input
                    value={formData.website_url}
                    onChange={(e) => handleInputChange('website_url', e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </InputGroup>
                <FormErrorMessage>{errors.website_url}</FormErrorMessage>
              </FormControl>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
