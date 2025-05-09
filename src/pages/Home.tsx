import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  useColorModeValue,
  keyframes,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

const Home = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  
  // Animation keyframes
  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  `
  
  const fadeInAnimation = `${fadeIn} 1s ease-out forwards`

  return (
    <Box w="100%">
      {/* Hero Section */}
      <Box 
        bg={useColorModeValue('blue.50', 'blue.900')} 
        py={{ base: 24, md: 36 }}
        minHeight={{ base: "70vh", md: "80vh" }}
        w="100%"
        backgroundImage="url('/images/hero-image.jpg')"
        backgroundSize="cover"
        backgroundPosition="center"
        position="relative"
        display="flex"
        alignItems="center"
      >
        {/* Dark overlay for better text readability */}
        <Box 
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          bg="rgba(0, 0, 0, 0.5)"
        />
        <Container maxW="100%" px={8} position="relative" zIndex={1}>
          <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
            <Box flex={1} pr={{ base: 0, md: 8 }}>
              <Heading
                as="h1"
                size="2xl"
                mb={6}
                color="white"
                animation={fadeInAnimation}
              >
                Elevate Your Track & Field Journey
              </Heading>
              <Text 
                fontSize="xl" 
                mb={8} 
                color="gray.100"
                animation={`${fadeIn} 1s ease-out 0.3s forwards`}
                opacity="0"
              >
                Join the ultimate platform for track and field athletes. Track your progress, connect with coaches, and achieve your athletic goals.
              </Text>
              <Stack 
                direction={{ base: 'column', sm: 'row' }} 
                spacing={4}
                animation={`${fadeIn} 1s ease-out 0.6s forwards`}
                opacity="0"
              >
                <Button
                  as={RouterLink}
                  to="/register"
                  size="lg"
                  colorScheme="blue"
                  px={8}
                >
                  Get Started
                </Button>
                <Button
                  as={RouterLink}
                  to="/login"
                  size="lg"
                  variant="outline"
                  colorScheme="blue"
                  bg="rgba(255, 255, 255, 0.1)"
                  color="white"
                  _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
                  px={8}
                >
                  Log In
                </Button>
              </Stack>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20} w="100%">
        <Container maxW="100%" px={8}>
          <Heading textAlign="center" mb={12}>
            Why Choose Our Platform?
          </Heading>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={8}
            justify="space-between"
          >
            <Box flex={1} textAlign="center">
              <Box
                w={16}
                h={16}
                mx="auto"
                mb={4}
                bg="blue.100"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl">📊</Text>
              </Box>
              <Heading size="md" mb={4}>
                Advanced Analytics
              </Heading>
              <Text color={textColor}>
                Track your performance metrics, analyze your progress, and get insights to improve your training.
              </Text>
            </Box>
            <Box flex={1} textAlign="center">
              <Box
                w={16}
                h={16}
                mx="auto"
                mb={4}
                bg="blue.100"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl">👥</Text>
              </Box>
              <Heading size="md" mb={4}>
                Expert Coaching
              </Heading>
              <Text color={textColor}>
                Connect with professional coaches who can guide you through personalized training programs.
              </Text>
            </Box>
            <Box flex={1} textAlign="center">
              <Box
                w={16}
                h={16}
                mx="auto"
                mb={4}
                bg="blue.100"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl">🏆</Text>
              </Box>
              <Heading size="md" mb={4}>
                Competition Ready
              </Heading>
              <Text color={textColor}>
                Prepare for competitions with specialized training plans and performance tracking tools.
              </Text>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box py={20} bg={useColorModeValue('gray.50', 'gray.900')} w="100%">
        <Container maxW="100%" px={8}>
          {/* Testimonials content */}
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={20} w="100%">
        <Container maxW="100%" px={8}>
          <Stack spacing={8} textAlign="center" maxW="3xl" mx="auto">
            <Heading mb={6}>
              Ready to Transform Your Track & Field Journey?
            </Heading>
            <Text fontSize="xl" color={textColor}>
              Join thousands of athletes who are already achieving their goals with our platform.
            </Text>
            <Button
              as={RouterLink}
              to="/register"
              size="lg"
              colorScheme="blue"
              px={8}
            >
              Start Your Free Trial
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}

export default Home 