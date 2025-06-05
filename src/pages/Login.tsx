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
  IconButton
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn } = useAuth()
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

    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in. Please check your credentials.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
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
        >
          {/* Full-width Hero Header */}
          <Box 
            w="full"
            h="150px" 
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
                        onChange={(e) => setEmail(e.target.value)}
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
