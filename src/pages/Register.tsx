import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Select,
  useToast,
  Card,
  CardBody,
  Flex,
  Icon,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FaUserPlus, FaEnvelope, FaLock, FaUsersCog } from 'react-icons/fa'

export function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userType, setUserType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setIsLoading(false)
      return
    }

    try {
      await signUp(email, password)
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account before logging in.',
        status: 'success',
        duration: 7000,
        isClosable: true,
      })
      navigate('/login')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create account. Please try again.',
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
        bg="linear-gradient(135deg, #38A169 0%, #68D391 100%)" 
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
          <Icon as={FaUserPlus} w={8} h={8} color="green.500" />
        </Flex>
      </Box>
      
      <CardBody pt={12}>
        <VStack spacing={6} align="stretch">
          <VStack spacing={2}>
            <Heading textAlign="center" size="lg">Create Account</Heading>
            <Text textAlign="center" color="gray.600">
              Join our community of athletes and coaches
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
                    bg="green.50"
                    borderRadius="md"
                    mr={2}
                  >
                    <Icon as={FaEnvelope} color="green.500" />
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
                    bg="green.50"
                    borderRadius="md"
                    mr={2}
                  >
                    <Icon as={FaLock} color="green.500" />
                  </Flex>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    bg="gray.50"
                  />
                </Flex>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <Flex align="center">
                  <Flex
                    align="center"
                    justify="center"
                    h="40px"
                    w="40px"
                    bg="green.50"
                    borderRadius="md"
                    mr={2}
                  >
                    <Icon as={FaLock} color="green.500" />
                  </Flex>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    bg="gray.50"
                  />
                </Flex>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>I am a...</FormLabel>
                <Flex align="center">
                  <Flex
                    align="center"
                    justify="center"
                    h="40px"
                    w="40px"
                    bg="green.50"
                    borderRadius="md"
                    mr={2}
                  >
                    <Icon as={FaUsersCog} color="green.500" />
                  </Flex>
                  <Select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    placeholder="Select your role"
                    bg="gray.50"
                  >
                    <option value="athlete">Athlete</option>
                    <option value="coach">Coach</option>
                    <option value="team_manager">Team Manager</option>
                  </Select>
                </Flex>
              </FormControl>

              <Button
                type="submit"
                colorScheme="green"
                width="full"
                isLoading={isLoading}
                mt={2}
                size="lg"
              >
                Create Account
              </Button>
            </VStack>
          </form>

          <Text textAlign="center" mt={4}>
            Already have an account?{' '}
            <Button
              variant="link"
              colorScheme="green"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
} 