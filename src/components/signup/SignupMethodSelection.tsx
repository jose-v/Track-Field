import { 
  Box, 
  Button, 
  Heading, 
  Text, 
  VStack,  
  useColorModeValue,
  Icon,
  Divider,
  HStack,
  useToast,
  Checkbox,
  Link
} from '@chakra-ui/react';
import { FaEnvelope, FaGoogle } from 'react-icons/fa';
import { useSignup } from '../../contexts/SignupContext';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export function SignupMethodSelection() {
  const { updateSignupData, setCurrentStep } = useSignup();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const toast = useToast();
  
  // Dark mode adaptive colors
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const descriptionColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const linkColor = useColorModeValue('blue.600', 'blue.400');
  
  const handleEmailSignup = () => {
    if (!agreedToTerms) {
      toast({
        title: 'Terms Required',
        description: 'Please agree to the Terms of Service and Privacy Policy to continue.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Set signup method, terms acceptance, and advance to next step
    updateSignupData({ 
      signupMethod: 'email',
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString()
    });
    setCurrentStep(2);
  };

  const handleGoogleSignup = async () => {
    if (!agreedToTerms) {
      toast({
        title: 'Terms Required',
        description: 'Please agree to the Terms of Service and Privacy Policy to continue.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    try {
      // Set signup method and terms acceptance first
      updateSignupData({ 
        signupMethod: 'google',
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString()
      });
      
      // Initiate Google OAuth flow
      await signInWithGoogle();
      // Note: The user will be redirected to Google's OAuth flow
      // and then back to the dashboard upon successful authentication
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign up with Google. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };
  
  return (
    <Box width="100%">
      <VStack spacing={6} align="center">
        <Box textAlign="center">
          <Heading size="md" mb={2} color={headingColor}>
            How would you like to sign up?
          </Heading>
          <Text color={descriptionColor} fontSize="sm">
            Choose your preferred signup method to get started
          </Text>
        </Box>
        
        <VStack spacing={4} width="100%" maxW="400px">
          {/* Google Signup Button */}
          <Button
            onClick={handleGoogleSignup}
            isLoading={loading}
            variant="outline"
            size="lg"
            width="full"
            leftIcon={<Icon as={FaGoogle} color="red.500" />}
            _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
            borderColor={borderColor}
            height="60px"
          >
            Continue with Google
          </Button>

          {/* Divider */}
          <HStack width="full">
            <Divider />
            <Text fontSize="sm" color={descriptionColor} whiteSpace="nowrap" px={3}>
              or
            </Text>
            <Divider />
          </HStack>

          {/* Email Signup Button */}
          <Button
            onClick={handleEmailSignup}
            variant="solid"
            colorScheme="blue"
            size="lg"
            width="full"
            leftIcon={<Icon as={FaEnvelope} />}
            height="60px"
          >
            Continue with Email
          </Button>
        </VStack>

        {/* Terms and Privacy Agreement */}
        <Box width="100%" maxW="400px">
          <Checkbox
            isChecked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            colorScheme="blue"
            size="sm"
          >
            <Text fontSize="xs" color={descriptionColor}>
              I agree to the{' '}
              <Link 
                href="/terms" 
                color={linkColor} 
                textDecoration="underline"
                isExternal
              >
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link 
                href="/privacy" 
                color={linkColor} 
                textDecoration="underline"
                isExternal
              >
                Privacy Policy
              </Link>
            </Text>
          </Checkbox>
        </Box>
      </VStack>
    </Box>
  );
} 