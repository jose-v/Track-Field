import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Card,
  CardBody,
  Flex,
  Icon,
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

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
      setIsLoading(false)
    }
  }

  return (
    <Card 
      maxW="md" 
      mx="auto" 
      mt={8} 
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="md"
    >
      {/* Hero Background */}
      <Box 
        h="120px" 
        bg="linear-gradient(135deg, #4299E1 0%, #90CDF4 100%)" 
        position="relative"
      >
        <Flex 
          position="absolute" 
          top="50%" 
          left="50%" 
          transform="translate(-50%, -50%)"
          bg="white" 
          borderRadius="full" 
          w="70px" 
          h="70px" 
          justifyContent="center" 
          alignItems="center"
          boxShadow="md"
        >
          <Icon as={FaUser} w={8} h={8} color="blue.500" />
        </Flex>
      </Box>
      
      <CardBody pt={12}>
        <VStack spacing={6} align="stretch">
          <VStack spacing={2}>
            <Heading textAlign="center" size="lg">Welcome Back</Heading>
            <Text textAlign="center" color="gray.600">
              Sign in to your account
            </Text>
          </VStack>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Flex align="center">
                  <Flex
                    align="center"
                    justify="center"
                    h="40px"
                    w="40px"
                    bg="blue.50"
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
                    bg="gray.50"
                  />
                </Flex>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Flex align="center">
                  <Flex
                    align="center"
                    justify="center"
                    h="40px"
                    w="40px"
                    bg="blue.50"
                    borderRadius="md"
                    mr={2}
                  >
                    <Icon as={FaLock} color="blue.500" />
                  </Flex>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    bg="gray.50"
                  />
                </Flex>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                isLoading={isLoading}
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
              onClick={() => navigate('/register')}
            >
              Sign Up
            </Button>
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
} 