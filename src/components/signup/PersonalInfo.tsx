import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Avatar,
  IconButton,
  Center,
  Text,
  useColorModeValue,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { FaCamera, FaTrash } from 'react-icons/fa';
import { useSignup } from '../../contexts/SignupContext';
import { useAuth } from '../../contexts/AuthContext';
import { uploadAvatar } from '../../utils/avatarStorage';

export function PersonalInfo() {
  const { signupData, updateSignupData } = useSignup();
  const { user } = useAuth();
  const toast = useToast();
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dark mode adaptive colors
  const avatarBg = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  const instructionTextColor = useColorModeValue('gray.600', 'gray.300');
  
  // Pre-populate name fields for Google OAuth users
  useEffect(() => {
    if (signupData.signupMethod === 'google' && user && (!signupData.firstName || !signupData.lastName)) {
      let firstName = '';
      let lastName = '';
      
      // Try to get name from user metadata first
      if (user.user_metadata?.full_name) {
        const nameParts = user.user_metadata.full_name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      } else if (user.user_metadata?.name) {
        const nameParts = user.user_metadata.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      // If no name from metadata, try from identities (Google provider)
      if (!firstName && user.identities && user.identities.length > 0) {
        const googleIdentity = user.identities.find((identity: any) => identity.provider === 'google');
        if (googleIdentity?.identity_data) {
          firstName = googleIdentity.identity_data.given_name || '';
          lastName = googleIdentity.identity_data.family_name || '';
        }
      }
      
      // Update signup data with extracted names
      if (firstName || lastName) {
        updateSignupData({
          firstName: firstName || signupData.firstName,
          lastName: lastName || signupData.lastName,
        });
      }
    }
  }, [signupData.signupMethod, user, signupData.firstName, signupData.lastName, updateSignupData]);
  
  // Handle first name change
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const firstName = e.target.value;
    updateSignupData({ firstName });
    
    if (firstName && firstName.length < 2) {
      setErrors(prev => ({ ...prev, firstName: 'First name must be at least 2 characters' }));
    } else {
      setErrors(prev => ({ ...prev, firstName: '' }));
    }
  };
  
  // Handle last name change
  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lastName = e.target.value;
    updateSignupData({ lastName });
    
    if (lastName && lastName.length < 2) {
      setErrors(prev => ({ ...prev, lastName: 'Last name must be at least 2 characters' }));
    } else {
      setErrors(prev => ({ ...prev, lastName: '' }));
    }
  };
  
  // Handle phone change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    updateSignupData({ phone });
    
    // Basic phone number validation (numeric characters and some symbols)
    if (phone && !/^[0-9+\-() ]+$/.test(phone)) {
      setErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number' }));
    } else {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };
  
  // Handle profile image selection
  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file input change with proper storage upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);

    try {
      // Upload to storage and get URL
      const result = await uploadAvatar({ 
        userId: user.id, 
        file 
      });

      if (result.error) {
        toast({
          title: 'Upload Error',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Set the storage URL instead of base64
      setProfileImage(result.url);
      updateSignupData({ profileImage: result.url });

      toast({
        title: 'Success',
        description: 'Profile picture uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload profile picture',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Handle image removal
  const handleImageRemove = () => {
    setProfileImage(null);
    updateSignupData({ profileImage: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Box width="100%">
      <VStack spacing={6} align="stretch" width="100%">
        {/* Profile Image Section */}
        <FormControl>
          <FormLabel color={labelColor}>Profile Picture (Optional)</FormLabel>
          <Center>
            <Box position="relative">
              <Avatar
                size="xl"
                bg={avatarBg}
                src={profileImage || undefined}
                name={`${signupData.firstName} ${signupData.lastName}`}
              />
              
              {/* Camera icon button */}
              <IconButton
                aria-label="Upload photo"
                icon={uploading ? <Spinner size="xs" /> : <FaCamera />}
                size="sm"
                colorScheme="blue"
                borderRadius="full"
                position="absolute"
                bottom={0}
                right={0}
                onClick={handleImageSelect}
                isLoading={uploading}
                isDisabled={uploading}
              />
              
              {/* Remove image button */}
              {profileImage && (
                <IconButton
                  aria-label="Remove photo"
                  icon={<FaTrash />}
                  size="sm"
                  colorScheme="red"
                  borderRadius="full"
                  position="absolute"
                  top={0}
                  right={0}
                  onClick={handleImageRemove}
                />
              )}
            </Box>
          </Center>
          
          <Text fontSize="sm" textAlign="center" color={instructionTextColor} mt={2}>
            Click the camera icon to upload a profile picture
          </Text>
          
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </FormControl>
        
        {/* Name Fields */}
        <HStack spacing={4}>
          <FormControl isRequired isInvalid={!!errors.firstName}>
            <FormLabel color={labelColor}>First Name</FormLabel>
            <Input
              value={signupData.firstName}
              onChange={handleFirstNameChange}
              placeholder="Enter your first name"
              bg={inputBg}
              borderColor={inputBorderColor}
              color={textColor}
              _placeholder={{ color: placeholderColor }}
              _hover={{ borderColor: 'blue.300' }}
              _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
            />
            <FormErrorMessage>{errors.firstName}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.lastName}>
            <FormLabel color={labelColor}>Last Name</FormLabel>
            <Input
              value={signupData.lastName}
              onChange={handleLastNameChange}
              placeholder="Enter your last name"
              bg={inputBg}
              borderColor={inputBorderColor}
              color={textColor}
              _placeholder={{ color: placeholderColor }}
              _hover={{ borderColor: 'blue.300' }}
              _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
            />
            <FormErrorMessage>{errors.lastName}</FormErrorMessage>
          </FormControl>
        </HStack>
        
        {/* Phone Number */}
        <FormControl isInvalid={!!errors.phone}>
          <FormLabel color={labelColor}>Phone Number</FormLabel>
          <Input
            value={signupData.phone}
            onChange={handlePhoneChange}
            placeholder="Enter your phone number"
            bg={inputBg}
            borderColor={inputBorderColor}
            color={textColor}
            _placeholder={{ color: placeholderColor }}
            _hover={{ borderColor: 'blue.300' }}
            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
          />
          <FormErrorMessage>{errors.phone}</FormErrorMessage>
        </FormControl>
      </VStack>
    </Box>
  );
} 