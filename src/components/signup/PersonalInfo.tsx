import {
  Box,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  FormErrorMessage,
  Avatar,
  Button,
  IconButton,
  Center,
  useColorModeValue,
  Text,
} from '@chakra-ui/react';
import { useState, useRef } from 'react';
import { FaCamera, FaTrash } from 'react-icons/fa';
import { useSignup } from '../../contexts/SignupContext';

export function PersonalInfo() {
  const { signupData, updateSignupData } = useSignup();
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const avatarBg = useColorModeValue('gray.200', 'gray.700');
  
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
  
  // Trigger file input click
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle profile image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Remove profile image
  const handleRemoveImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Box width="100%">
      <VStack spacing={6} align="stretch" width="100%">
        {/* Profile Image */}
        <FormControl>
          <FormLabel textAlign="center">Profile Picture</FormLabel>
          <Center mb={4}>
            <Box position="relative">
              <Avatar 
                size="xl" 
                src={profileImage || undefined} 
                name={signupData.firstName && signupData.lastName 
                  ? `${signupData.firstName} ${signupData.lastName}` 
                  : undefined} 
                bg={avatarBg}
                cursor="pointer"
                onClick={handleAvatarClick}
              />
              
              <IconButton
                aria-label="Upload photo"
                icon={<FaCamera />}
                size="sm"
                colorScheme="blue"
                rounded="full"
                position="absolute"
                bottom="0"
                right="0"
                onClick={handleAvatarClick}
              />
              
              {profileImage && (
                <IconButton
                  aria-label="Remove photo"
                  icon={<FaTrash />}
                  size="xs"
                  colorScheme="red"
                  rounded="full"
                  position="absolute"
                  top="0"
                  right="0"
                  onClick={handleRemoveImage}
                />
              )}
              
              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
              />
            </Box>
          </Center>
          <Text fontSize="sm" textAlign="center" color="gray.500">
            Click to upload a profile picture
          </Text>
        </FormControl>
        
        {/* Name Fields */}
        <HStack spacing={4}>
          <FormControl isRequired isInvalid={!!errors.firstName}>
            <FormLabel>First Name</FormLabel>
            <Input
              value={signupData.firstName}
              onChange={handleFirstNameChange}
              placeholder="Enter your first name"
            />
            <FormErrorMessage>{errors.firstName}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.lastName}>
            <FormLabel>Last Name</FormLabel>
            <Input
              value={signupData.lastName}
              onChange={handleLastNameChange}
              placeholder="Enter your last name"
            />
            <FormErrorMessage>{errors.lastName}</FormErrorMessage>
          </FormControl>
        </HStack>
        
        {/* Phone Number */}
        <FormControl isInvalid={!!errors.phone}>
          <FormLabel>Phone Number</FormLabel>
          <Input
            value={signupData.phone}
            onChange={handlePhoneChange}
            placeholder="Enter your phone number"
          />
          <FormErrorMessage>{errors.phone}</FormErrorMessage>
        </FormControl>
      </VStack>
    </Box>
  );
} 