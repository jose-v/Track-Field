import {
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  FormErrorMessage,
  VStack,
  Text,
  Progress,
  HStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useSignup } from '../../contexts/SignupContext';

export function AccountInfo() {
  const { signupData, updateSignupData } = useSignup();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password strength states
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthColor, setStrengthColor] = useState('red.500');
  const [strengthLabel, setStrengthLabel] = useState('Weak');
  
  // Toggle password visibility
  const handleTogglePassword = () => setShowPassword(!showPassword);
  
  // Update email in context
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    updateSignupData({ email });
    
    // Simple email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
  };
  
  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length === 0) {
      setPasswordStrength(0);
      setStrengthColor('red.500');
      setStrengthLabel('Weak');
      return;
    }
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Contains lowercase letter
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase letter
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains number
    if (/[0-9]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength * 20);
    
    // Set color and label based on strength
    if (strength <= 2) {
      setStrengthColor('red.500');
      setStrengthLabel('Weak');
    } else if (strength <= 3) {
      setStrengthColor('yellow.500');
      setStrengthLabel('Moderate');
    } else if (strength <= 4) {
      setStrengthColor('blue.500');
      setStrengthLabel('Good');
    } else {
      setStrengthColor('green.500');
      setStrengthLabel('Strong');
    }
  };
  
  // Update password in context
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    updateSignupData({ password });
    calculatePasswordStrength(password);
    
    // Simple password validation
    if (password && password.length < 8) {
      setErrors((prev) => ({ ...prev, password: 'Password must be at least 8 characters' }));
    } else {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
    
    // Check if confirm password matches
    if (confirmPassword && password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };
  
  // Handle confirm password change
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Check if passwords match
    if (value !== signupData.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };
  
  return (
    <Box width="100%">
      <VStack spacing={6} align="stretch" width="100%">
        <FormControl isRequired isInvalid={!!errors.email}>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={signupData.email}
            onChange={handleEmailChange}
            placeholder="Enter your email address"
          />
          <FormErrorMessage>{errors.email}</FormErrorMessage>
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.password}>
          <FormLabel>Password</FormLabel>
          <InputGroup>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={signupData.password}
              onChange={handlePasswordChange}
              placeholder="Create a password"
            />
            <InputRightElement width="4.5rem">
              <Button h="1.75rem" size="sm" onClick={handleTogglePassword}>
                {showPassword ? 'Hide' : 'Show'}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.password}</FormErrorMessage>
          
          {signupData.password && (
            <Box mt={2}>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm">Password Strength:</Text>
                <Text fontSize="sm" color={strengthColor} fontWeight="medium">
                  {strengthLabel}
                </Text>
              </HStack>
              <Progress
                value={passwordStrength}
                size="sm"
                colorScheme={
                  passwordStrength <= 40
                    ? 'red'
                    : passwordStrength <= 60
                    ? 'yellow'
                    : passwordStrength <= 80
                    ? 'blue'
                    : 'green'
                }
                borderRadius="full"
              />
            </Box>
          )}
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.confirmPassword}>
          <FormLabel>Confirm Password</FormLabel>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Confirm your password"
          />
          <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
        </FormControl>
      </VStack>
    </Box>
  );
} 