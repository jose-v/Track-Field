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
  InputGroup,
  InputRightElement,
  IconButton,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { updateUserPassword, getCurrentUser } from '../services/authService';

export function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  
  // Dark mode adaptive colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  
  // Check if user has valid session (from password reset link)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await getCurrentUser();
        setIsAuthorized(!!user);
      } catch (error) {
        setIsAuthorized(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Validation
  const passwordsMatch = password === confirmPassword;
  const isPasswordValid = password.length >= 6;
  const canSubmit = password && confirmPassword && passwordsMatch && isPasswordValid;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      toast({
        title: 'Invalid Input',
        description: 'Please check your password requirements.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await updateUserPassword(password);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully updated. You can now sign in.',
        status: 'success',
        duration: 7000,
        isClosable: true,
      });
      
      // Redirect to login page
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update password. Please try again.',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (checkingAuth) {
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
        >
          <Text>Verifying access...</Text>
        </Box>
      </Box>
    );
  }
  
  if (!isAuthorized) {
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
              <VStack spacing={6} align="stretch" textAlign="center">
                <VStack spacing={2}>
                  <Heading size="lg" color={headingColor}>
                    Invalid or Expired Link
                  </Heading>
                  <Text color={textColor}>
                    This password reset link is invalid or has expired.
                  </Text>
                </VStack>
                
                <VStack spacing={3}>
                  <Button
                    as={RouterLink}
                    to="/forgot-password"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                  >
                    Request New Reset Link
                  </Button>
                  
                  <Button
                    as={RouterLink}
                    to="/login"
                    variant="outline"
                    size="lg"
                    width="full"
                  >
                    Back to Login
                  </Button>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </Box>
      </Box>
    );
  }
  
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
              <VStack spacing={2} textAlign="center">
                <Heading size="lg" color={headingColor}>
                  Set New Password
                </Heading>
                <Text color={textColor}>
                  Enter your new password below.
                </Text>
              </VStack>
              
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired isInvalid={password && !isPasswordValid}>
                    <FormLabel>New Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        size="lg"
                        bg={useColorModeValue('white', 'gray.700')}
                      />
                      <InputRightElement height="48px">
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                          size="sm"
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>
                      Password must be at least 6 characters long.
                    </FormErrorMessage>
                  </FormControl>
                  
                  <FormControl isRequired isInvalid={confirmPassword && !passwordsMatch}>
                    <FormLabel>Confirm New Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        size="lg"
                        bg={useColorModeValue('white', 'gray.700')}
                      />
                      <InputRightElement height="48px">
                        <IconButton
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          variant="ghost"
                          size="sm"
                        />
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>
                      Passwords do not match.
                    </FormErrorMessage>
                  </FormControl>
                  
                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    isLoading={loading}
                    loadingText="Updating..."
                    isDisabled={!canSubmit}
                  >
                    Update Password
                  </Button>
                </VStack>
              </form>
              
              <Text fontSize="sm" color={textColor} textAlign="center">
                <Link as={RouterLink} to="/login" color="blue.500" fontWeight="medium">
                  Back to Login
                </Link>
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
} 