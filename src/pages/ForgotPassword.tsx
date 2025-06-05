import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  useToast,
  useColorModeValue,
  Link,
  Heading,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { sendPasswordResetEmail } from '../services/authService';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const toast = useToast();
  
  // Dark mode adaptive colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await sendPasswordResetEmail(email);
      
      if (error) {
        throw error;
      }
      
      setEmailSent(true);
      toast({
        title: 'Reset Email Sent',
        description: 'Check your email for password reset instructions.',
        status: 'success',
        duration: 10000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email. Please try again.',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (emailSent) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={useColorModeValue('gray.50', 'gray.900')}
        p={4}
      >
        <Card
          maxW="md"
          w="full"
          bg={cardBg}
          borderColor={borderColor}
          borderWidth={1}
        >
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              <VStack spacing={2} textAlign="center">
                <Heading size="lg" color={headingColor}>
                  Check Your Email
                </Heading>
                <Text color={textColor}>
                  We've sent password reset instructions to:
                </Text>
                <Text fontWeight="semibold" color={headingColor}>
                  {email}
                </Text>
              </VStack>
              
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  If you don't see the email in a few minutes, check your spam folder.
                </Text>
              </Alert>
              
              <VStack spacing={3}>
                <Button
                  as={RouterLink}
                  to="/login"
                  variant="outline"
                  width="full"
                  size="lg"
                >
                  Back to Login
                </Button>
                
                <Button
                  onClick={() => setEmailSent(false)}
                  variant="ghost"
                  size="sm"
                  color={textColor}
                >
                  Use different email
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    );
  }
  
  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={useColorModeValue('gray.50', 'gray.900')}
      p={4}
    >
      <Card
        maxW="md"
        w="full"
        bg={cardBg}
        borderColor={borderColor}
        borderWidth={1}
      >
        <CardBody p={8}>
          <VStack spacing={6} align="stretch">
            <VStack spacing={2} textAlign="center">
              <Heading size="lg" color={headingColor}>
                Reset Your Password
              </Heading>
              <Text color={textColor}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>
            </VStack>
            
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    size="lg"
                    bg={useColorModeValue('white', 'gray.700')}
                  />
                </FormControl>
                
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={loading}
                  loadingText="Sending..."
                >
                  Send Reset Link
                </Button>
              </VStack>
            </form>
            
            <VStack spacing={3} pt={4}>
              <Text fontSize="sm" color={textColor}>
                Remember your password?{' '}
                <Link as={RouterLink} to="/login" color="blue.500" fontWeight="medium">
                  Sign in
                </Link>
              </Text>
              
              <Text fontSize="sm" color={textColor}>
                Don't have an account?{' '}
                <Link as={RouterLink} to="/signup" color="blue.500" fontWeight="medium">
                  Sign up
                </Link>
              </Text>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
} 