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
  useColorModeValue,
  Heading,
  Icon,
  Spinner,
  FormHelperText,
  Link,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useSignup } from '../../contexts/SignupContext';
import { checkEmailExists } from '../../services/authService';

export function AccountInfo() {
  const { signupData, updateSignupData } = useSignup();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Email checking states
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailCheckCompleted, setEmailCheckCompleted] = useState(false);
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Password strength states
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthColor, setStrengthColor] = useState('red.500');
  const [strengthLabel, setStrengthLabel] = useState('Weak');
  
  // Dark mode adaptive colors
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const descriptionColor = useColorModeValue('gray.600', 'gray.300');

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
    };
  }, [emailCheckTimeout]);

  // Debounced email existence check
  const checkEmailExistence = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }
    
    setCheckingEmail(true);
    
    try {
      const { emailExists: exists, error } = await checkEmailExists(email);
      
      if (error) {
        console.error('Email check error:', error);
        return;
      }
      
      setEmailExists(exists);
      
      if (exists) {
        setErrors((prev) => ({ 
          ...prev, 
          email: 'This email is already registered.' 
        }));
        updateSignupData({ emailValid: false });
      } else {
        setErrors((prev) => ({ ...prev, email: '' }));
        updateSignupData({ emailValid: true });
      }
      
      setEmailCheckCompleted(true);
    } catch (error) {
      console.error('Email existence check failed:', error);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  // If user chose Google OAuth, show confirmation instead of form
  if (signupData.signupMethod === 'google') {
    return (
      <Box width="100%">
        <VStack spacing={6} align="center" textAlign="center">
          <Icon as={FaCheckCircle} color="green.500" boxSize={12} />
          <Box>
            <Heading size="md" mb={2} color={headingColor}>
              Authentication Method Set
            </Heading>
            <Text color={descriptionColor} fontSize="sm">
              You'll sign in using your Google account. No additional account setup needed.
            </Text>
          </Box>
          <Text fontSize="xs" color={descriptionColor} maxW="400px">
            After completing your profile, you'll be able to sign in with your Google account.
          </Text>
        </VStack>
      </Box>
    );
  }
  
  // Toggle password visibility
  const handleTogglePassword = () => setShowPassword(!showPassword);
  
  // Update email in context with debounced checking
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    updateSignupData({ email });
    
    // Clear previous timeout
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }
    
    // Reset states
    setEmailExists(false);
    setCheckingEmail(false);
    setEmailCheckCompleted(false);
    
    // Simple email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      updateSignupData({ emailValid: false });
      return;
    } else {
      setErrors((prev) => ({ ...prev, email: '' }));
      // Don't set emailValid to true here - wait for existence check
      if (!email) {
        updateSignupData({ emailValid: false });
      }
    }
    
    // Debounce email existence check (wait 800ms after user stops typing)
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const timeout = setTimeout(() => {
        checkEmailExistence(email);
      }, 800);
      setEmailCheckTimeout(timeout);
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
      <VStack spacing={6} align="center" textAlign="center" mb={6}>
        <Box>
          <Heading size="md" mb={2} color={headingColor}>
            Create Your Account
          </Heading>
          <Text color={descriptionColor} fontSize="sm">
            Set up your email and password to secure your account
          </Text>
        </Box>
      </VStack>
      
      <VStack spacing={6} align="stretch" width="100%">
        <FormControl isRequired isInvalid={!!errors.email || emailExists}>
          <FormLabel color={labelColor}>Email</FormLabel>
          <InputGroup>
            <Input
              type="email"
              value={signupData.email}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              bg={inputBg}
              borderColor={inputBorderColor}
              color={textColor}
              _placeholder={{ color: placeholderColor }}
              _hover={{ borderColor: 'blue.300' }}
              _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
            />
            <InputRightElement>
              {checkingEmail ? (
                <Spinner size="sm" color="blue.500" />
              ) : signupData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email) && !errors.email ? (
                emailExists ? (
                  <Icon as={FaTimesCircle} color="red.500" />
                ) : (
                  <Icon as={FaCheckCircle} color="green.500" />
                )
              ) : null}
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.email}</FormErrorMessage>
          {signupData.email && 
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email) && 
           !errors.email && 
           !emailExists && 
           !checkingEmail && 
           emailCheckCompleted && (
            <FormHelperText color="green.500">
              <Icon as={FaCheckCircle} mr={1} />
              Email is available
            </FormHelperText>
          )}
          {emailExists && !checkingEmail && (
            <Box mt={2} p={3} bg={useColorModeValue('gray.300', 'gray.600')} borderRadius="md" borderWidth="1px" borderColor={useColorModeValue('gray.400', 'gray.500')}>
              <Text fontSize="sm" color={useColorModeValue('white', 'white')} mb={2}>
                Already have an account? Choose an option below:
              </Text>
              <HStack spacing={4}>
                <Link as={RouterLink} to="/login" color={useColorModeValue('black', 'black')} fontWeight="medium" fontSize="sm">
                  Sign In
                </Link>
                <Link as={RouterLink} to="/forgot-password" color={useColorModeValue('black', 'black')} fontWeight="medium" fontSize="sm">
                  Reset Password
                </Link>
              </HStack>
            </Box>
          )}
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.password}>
          <FormLabel color={labelColor}>Password</FormLabel>
          <InputGroup>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={signupData.password}
              onChange={handlePasswordChange}
              placeholder="Create a password"
              bg={inputBg}
              borderColor={inputBorderColor}
              color={textColor}
              _placeholder={{ color: placeholderColor }}
              _hover={{ borderColor: 'blue.300' }}
              _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
            />
            <InputRightElement width="4.5rem">
              <Button 
                h="1.75rem" 
                size="sm" 
                onClick={handleTogglePassword}
                variant="ghost"
                color={textColor}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </Button>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors.password}</FormErrorMessage>
          
          {signupData.password && (
            <Box mt={2}>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm" color={textColor}>Password Strength:</Text>
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
          <FormLabel color={labelColor}>Confirm Password</FormLabel>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Confirm your password"
            bg={inputBg}
            borderColor={inputBorderColor}
            color={textColor}
            _placeholder={{ color: placeholderColor }}
            _hover={{ borderColor: 'blue.300' }}
            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
          />
          <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
        </FormControl>
      </VStack>
    </Box>
  );
} 