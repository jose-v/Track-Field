import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  FormControl,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Card,
  CardBody,
  Flex,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertDescription,
  InputGroup,
  InputRightElement,
  IconButton,
  Divider,
  HStack
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaMagic } from 'react-icons/fa'
import { signInWithMagicLink } from '../services/authService'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailVerificationNeeded, setEmailVerificationNeeded] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  // Dark mode adaptive colors
  const cardBg = useColorModeValue('white', 'gray.800')
  const iconBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.700', 'gray.100')
  const placeholderColor = useColorModeValue('gray.500', 'gray.400')
  const inputBg = useColorModeValue('white', 'gray.700')
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600')
  const headerBg = useColorModeValue('#ecc94b', 'blue.600')
  const headerTextColor = useColorModeValue('gray.800', 'white')
  const linkTextColor = useColorModeValue('gray.600', 'gray.300')
  const pageBg = useColorModeValue('gray.50', 'gray.900')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setEmailVerificationNeeded(false) // Clear any previous verification messages

    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (error) {

      
      // Check if this is an email not confirmed error
      if (error.code === 'email_not_confirmed') {
        setEmailVerificationNeeded(true)
        
        // Store email in localStorage for verification page
        localStorage.setItem('verification-needed-email', email)
        
        toast({
          title: 'Email Verification Required',
          description: `We found your account, but you need to verify your email address first. Please check your email (${email}) for a verification link. We'll redirect you to the verification page shortly.`,
          status: 'warning',
          duration: 15000,
          isClosable: true,
        })
        
        // Navigate to verification page after allowing user to read the message
        setTimeout(() => {
          navigate('/verify-email?from=signin')
        }, 5000)
      } else if (error.message && error.message.toLowerCase().includes('email not confirmed')) {
        // Fallback check for different error message formats
        setEmailVerificationNeeded(true)
        
        // Store email in localStorage for verification page
        localStorage.setItem('verification-needed-email', email)
        
        toast({
          title: 'Email Verification Required',
          description: `Please verify your email address before signing in. Check your email (${email}) for a verification link.`,
          status: 'warning',
          duration: 12000,
          isClosable: true,
        })
        
        setTimeout(() => {
          navigate('/verify-email?from=signin')
        }, 5000)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to sign in. Please check your credentials.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      // Note: The user will be redirected to Google's OAuth flow
      // and then back to the dashboard upon successful authentication
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setLoading(false)
    }
  }

  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault()
    if (!magicLinkEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setMagicLinkLoading(true)
    try {
      const { error } = await signInWithMagicLink(magicLinkEmail)
      
      if (error) {
        throw error
      }
      
      setMagicLinkSent(true)
      toast({
        title: 'Magic Link Sent!',
        description: `Check your email (${magicLinkEmail}) for a sign-in link.`,
        status: 'success',
        duration: 8000,
        isClosable: true,
      })
    } catch (error) {
      // Check if this is the email validation error
      if (error.message && error.message.includes('If an account with this email exists')) {
        toast({
          title: 'Email Check',
          description: error.message + ' If you don\'t have an account, please sign up first.',
          status: 'info',
          duration: 10000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send magic link. Please try again.',
          status: 'error',
          duration: 7000,
          isClosable: true,
        })
      }
    } finally {
      setMagicLinkLoading(false)
    }
  }

  return (
    <Box
      bg={pageBg}
    >
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
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
          w="100%" 
          borderRadius="lg" 
          overflow="hidden" 
          p={0}
          bg={cardBg}
          borderColor={borderColor}
          borderWidth={1}
          mt={{ base: 20, md: 6, lg: 8 }}
        >
          {/* Full-width Hero Header */}
          <Box 
            w="full"
            h="60px" 
            bg={headerBg}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            p={0}
            m={0}
          >
            <Heading 
              size="md" 
              color={headerTextColor} 
              fontWeight="bold" 
              letterSpacing="wide" 
              textAlign="center" 
              textTransform="uppercase"
            >
              Sign In
            </Heading>
          </Box>
          <CardBody pt={8} px={8}>
            <VStack spacing={6} align="stretch">
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl>
                    <Flex align="center">
                      <Flex
                        align="center"
                        justify="center"
                        h="40px"
                        w="40px"
                        bg={iconBg}
                        borderRadius="md"
                        mr={2}
                        borderWidth={1}
                        borderColor={borderColor}
                      >
                        <Icon as={FaEnvelope} color="blue.500" />
                      </Flex>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setEmailVerificationNeeded(false) // Clear verification alert when email changes
                        }}
                        placeholder="Enter your email"
                        bg={inputBg}
                        borderColor={inputBorderColor}
                        color={textColor}
                        _placeholder={{ color: placeholderColor }}
                        _hover={{ borderColor: 'blue.300' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                        autoComplete="email"
                        aria-label="Email"
                      />
                    </Flex>
                  </FormControl>

                  <FormControl>
                    <Flex align="center">
                      <Flex
                        align="center"
                        justify="center"
                        h="40px"
                        w="40px"
                        bg={iconBg}
                        borderRadius="md"
                        mr={2}
                        borderWidth={1}
                        borderColor={borderColor}
                      >
                        <Icon as={FaLock} color="blue.500" />
                      </Flex>
                      <InputGroup>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          bg={inputBg}
                          borderColor={inputBorderColor}
                          color={textColor}
                          _placeholder={{ color: placeholderColor }}
                          _hover={{ borderColor: 'blue.300' }}
                          _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                          autoComplete="current-password"
                          aria-label="Password"
                        />
                        <InputRightElement width="4.5rem">
                          <IconButton
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            icon={<Icon as={showPassword ? FaEyeSlash : FaEye} />}
                            variant="ghost"
                            color={textColor}
                            _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </Flex>
                  </FormControl>

                  {/* Forgot Password Link */}
                  <Box textAlign="right" width="full">
                    <Button
                      variant="link"
                      size="sm"
                      colorScheme="blue"
                      onClick={() => navigate('/forgot-password')}
                      fontSize="sm"
                    >
                      Forgot Password?
                    </Button>
                  </Box>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    isLoading={loading}
                    mt={2}
                    size="lg"
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>

              {/* Email Verification Alert */}
              {emailVerificationNeeded && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">
                        Account found but email needs verification
                      </Text>
                      <Text>
                        Check your email ({email}) for a verification link, or{' '}
                                                 <Button
                           variant="link"
                           size="sm"
                           colorScheme="orange"
                           onClick={() => {
                             localStorage.setItem('verification-needed-email', email)
                             navigate('/verify-email?from=signin')
                           }}
                           p={0}
                           h="auto"
                           fontWeight="medium"
                         >
                           go to verification page
                         </Button>
                      </Text>
                    </VStack>
                  </AlertDescription>
                </Alert>
              )}

              {/* Magic Link Section */}
              <Box px={4}>
                <HStack>
                  <Divider />
                  <Text fontSize="sm" color={placeholderColor} whiteSpace="nowrap">
                    or sign in with magic link
                  </Text>
                  <Divider />
                </HStack>
              </Box>

              {magicLinkSent ? (
                <Box p={4} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md" borderWidth="1px" borderColor={useColorModeValue('green.200', 'green.700')}>
                  <VStack spacing={2}>
                    <Icon as={FaMagic} color="green.500" boxSize={5} />
                    <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('green.800', 'green.200')}>
                      Magic link sent!
                    </Text>
                    <Text fontSize="xs" color={useColorModeValue('green.700', 'green.300')} textAlign="center">
                      Check your email ({magicLinkEmail}) and click the link to sign in
                    </Text>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMagicLinkSent(false)}
                      color={useColorModeValue('green.700', 'green.300')}
                    >
                      Send another link
                    </Button>
                  </VStack>
                </Box>
              ) : (
                <form onSubmit={handleMagicLinkSubmit}>
                  <VStack spacing={3}>
                    <FormControl>
                      <Flex align="center">
                        <Flex
                          align="center"
                          justify="center"
                          h="40px"
                          w="40px"
                          bg={iconBg}
                          borderRadius="md"
                          mr={2}
                          borderWidth={1}
                          borderColor={borderColor}
                        >
                          <Icon as={FaMagic} color="purple.500" />
                        </Flex>
                        <Input
                          type="email"
                          value={magicLinkEmail}
                          onChange={(e) => setMagicLinkEmail(e.target.value)}
                          placeholder="Enter your email for magic link"
                          bg={inputBg}
                          borderColor={inputBorderColor}
                          color={textColor}
                          _placeholder={{ color: placeholderColor }}
                          _hover={{ borderColor: 'purple.300' }}
                          _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple.500' }}
                          autoComplete="email"
                          aria-label="Email for magic link"
                        />
                      </Flex>
                    </FormControl>
                    <Button
                      type="submit"
                      colorScheme="purple"
                      width="full"
                      isLoading={magicLinkLoading}
                      loadingText="Sending..."
                      leftIcon={<Icon as={FaMagic} />}
                      size="lg"
                    >
                      Send Magic Link
                    </Button>
                  </VStack>
                </form>
              )}

              {/* Google Sign In Button */}
              <Button
                onClick={handleGoogleSignIn}
                isLoading={loading}
                variant="outline"
                size="lg"
                width="full"
                leftIcon={<Icon as={FaGoogle} color="red.500" />}
                _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                borderColor={borderColor}
              >
                Sign in with Google
              </Button>

              <Text textAlign="center" mt={4} color={linkTextColor}>
                Don't have an account?{' '}
                <Button
                  variant="link"
                  colorScheme="blue"
                  onClick={() => navigate('/signup')}
                  fontSize="md"
                >
                  Sign Up
                </Button>
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </Flex>
    </Box>
  )
}
