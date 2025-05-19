import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const handleSubmit = async (e) => {
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
    <Flex 
      direction="column" 
      align="center" 
      justify="center" 
      minHeight="80vh"
      marginTop="-80px"
      px={4}
    >
      <Card maxW="md" w="100%" borderRadius="lg" boxShadow="xl" overflow="hidden" p={0}>
        {/* Full-width Hero Header */}
        <Box 
          w="full"
          h="150px" 
          bg="linear-gradient(135deg, #4299E1 0%, #90CDF4 100%)" 
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={0}
          m={0}
        >
          <Flex 
            bg="white" 
            borderRadius="full" 
            w="70px" 
            h="70px" 
            justify="center" 
            align="center"
            boxShadow="md"
            mb={2}
          >
            <Icon as={FaUser} w={8} h={8} color="blue.500" />
          </Flex>
          <Heading size="md" color="white" fontWeight="bold" letterSpacing="wide" textAlign="center" mt={1} textTransform="uppercase">
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
                      autoComplete="current-password"
                      aria-label="Password"
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
