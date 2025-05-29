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

  const cardBg = useColorModeValue('white', 'gray.800')
  const iconBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.700', 'gray.100')

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
    <Flex 
      direction="column" 
      align="center" 
      justify="center" 
      minHeight="80vh"
      marginTop="-80px"
      px={4}
    >
      <Card maxW="md" w="100%" borderRadius="lg" overflow="hidden" p={0}>
        {/* Full-width Hero Header */}
        <Box 
          w="full"
          h="150px" 
          bg="#ecc94b" 
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={0}
          m={0}
        >
          <Heading size="md" color="gray.800" fontWeight="bold" letterSpacing="wide" textAlign="center" textTransform="uppercase">
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
                    >
                      <Icon as={FaEnvelope} color="blue.500" />
                    </Flex>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      bg={cardBg}
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
                    >
                      <Icon as={FaLock} color="blue.500" />
                    </Flex>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        bg={cardBg}
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

            <Text textAlign="center" mt={4}>
              Don't have an account?{' '}
              <Button
                variant="link"
                colorScheme="blue"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </Button>
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Flex>
  )
}
