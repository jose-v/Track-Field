import {
  Box,
  Button,
  Card,
  CardBody,
  Text,
  VStack,
  useToast,
  useColorModeValue,
  Link,
  Heading,
  Alert,
  AlertIcon,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaCheck } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function VerifyEmail() {
  const [loading, setLoading] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  // Dark mode adaptive colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const iconBg = useColorModeValue('blue.50', 'blue.900');

  // Access control - redirect users who shouldn't be here
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    if (!user) {
      // Check if we came from a sign-in attempt (URL parameter or localStorage)
      const urlParams = new URLSearchParams(window.location.search);
      const fromSignIn = urlParams.get('from') === 'signin' || localStorage.getItem('verification-needed-email');
      
      if (!fromSignIn) {
        // No user signed in and didn't come from sign-in attempt - redirect to login
        console.log('No user found and not from sign-in, redirecting to login');
        navigate('/login');
        return;
      }
      
      // If we came from sign-in attempt, we'll show the verification page anyway
      console.log('User not signed in but came from sign-in attempt - showing verification guidance');
      return;
    }

    if (user.email_confirmed_at) {
      // User is already verified - clean up and redirect to dashboard
      localStorage.removeItem('verification-needed-email');
      console.log('User already verified, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    // User is signed in but not verified - this is the correct state for this page
    console.log('User signed in but not verified - showing verification page');
  }, [user, authLoading, navigate]);
  
  const handleResendVerification = async () => {
    // Get email from user or localStorage
    const email = user?.email || localStorage.getItem('verification-needed-email');
    
    if (!email) {
      toast({
        title: 'Error',
        description: 'No email address found. Please try signing up again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Verification Email Sent',
        description: `A new verification email has been sent to ${email}`,
        status: 'success',
        duration: 8000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast({
        title: 'Failed to Resend',
        description: error.message || 'Failed to resend verification email. Please try again.',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
  };

  // Show loading while checking authentication state
  if (authLoading) {
    return (
      <Box
        bg={useColorModeValue('gray.50', 'gray.900')}
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Text>Loading...</Text>
      </Box>
    );
  }
  
  // If user is verified, they shouldn't be here
  if (user && user.email_confirmed_at) {
    return (
      <Box
        bg={useColorModeValue('gray.50', 'gray.900')}
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Text>Redirecting...</Text>
      </Box>
    );
  }
  
  // Get email to display (from user or localStorage)
  const displayEmail = user?.email || localStorage.getItem('verification-needed-email');
  
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight={{ 
          base: "calc(100vh - 140px)", // Mobile: smaller header/footer
          md: "calc(100vh - 160px)",   // Tablet: medium spacing
          lg: "calc(100vh - 356px)"    // Desktop: larger footer space
        }}
        py={{ base: 4, md: 6, lg: 8 }}
        px={4}
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
              {/* Header with Icon */}
              <VStack spacing={4} textAlign="center">
                <Box
                  p={4}
                  borderRadius="full"
                  bg={iconBg}
                >
                  <Icon as={FaEnvelope} color="blue.500" boxSize={8} />
                </Box>
                
                <VStack spacing={2}>
                  <Heading size="lg" color={headingColor}>
                    Verify Your Email
                  </Heading>
                  <Text color={textColor}>
                    {displayEmail ? 'We\'ve sent a verification link to:' : 'Please verify your email address'}
                  </Text>
                  {displayEmail && (
                    <Text fontWeight="semibold" color={headingColor}>
                      {displayEmail}
                    </Text>
                  )}
                </VStack>
              </VStack>
              
              {/* Instructions */}
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={2} fontSize="sm">
                  <Text>
                    Click the verification link in your email to activate your account.
                  </Text>
                  <Text>
                    If you don't see the email, check your spam folder.
                  </Text>
                </VStack>
              </Alert>
              
              {/* What to do after verification */}
              <Box p={4} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md">
                <HStack spacing={3}>
                  <Icon as={FaCheck} color="green.500" />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('green.800', 'green.200')}>
                      After verification:
                    </Text>
                    <Text fontSize="sm" color={useColorModeValue('green.700', 'green.300')}>
                      Return to this page or sign in again to access your account.
                    </Text>
                  </VStack>
                </HStack>
              </Box>
              
              {/* Action Buttons */}
              <VStack spacing={3}>
                <Button
                  onClick={handleResendVerification}
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={loading}
                  loadingText="Sending..."
                >
                  Resend Verification Email
                </Button>
                
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="lg"
                  width="full"
                >
                  Sign Out & Use Different Email
                </Button>
              </VStack>
              
              {/* Support Link */}
              <Text fontSize="sm" color={textColor} textAlign="center">
                Need help?{' '}
                <Link as={RouterLink} to="/contact" color="blue.500" fontWeight="medium">
                  Contact Support
                </Link>
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
} 