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
  SimpleGrid,
  Icon,
  VStack,
  HStack,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FaChartLine, FaUsers, FaTrophy } from 'react-icons/fa'

const Home = () => {
  const bgGradient = useColorModeValue(
    'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.9))',
    'linear-gradient(to bottom, rgba(26, 32, 44, 0.8), rgba(26, 32, 44, 0.9))'
  )
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')
  const cardBg = useColorModeValue('white', 'gray.800')
  
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
        bg={useColorModeValue('gray.50', 'gray.900')} 
        py={{ base: 24, md: 32 }}
        position="relative"
        overflow="hidden"
      >
        {/* Background Image with Overlay */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          backgroundImage="url('/images/hero-image.jpg')"
          backgroundSize="cover"
          backgroundPosition="center"
          filter="grayscale(40%)"
          opacity="0.2"
          zIndex={0}
        />
        
        <Container maxW="container.lg" position="relative" zIndex={1}>
          <Stack
            direction={{ base: 'column', lg: 'row' }}
            align="center"
            spacing={{ base: 8, md: 10 }}
            py={{ base: 8, md: 16 }}
          >
            <Stack flex={1} spacing={{ base: 5, md: 8 }}>
              <Heading
                as="h1"
                size="2xl"
                fontWeight="bold"
                lineHeight="1.2"
                letterSpacing="tight"
                animation={fadeInAnimation}
                color={textColor}
              >
                Elevate Your Track & Field Journey
              </Heading>
              <Text 
                fontSize="xl" 
                color={subtitleColor}
                animation={`${fadeIn} 1s ease-out 0.3s forwards`}
                opacity="0"
                lineHeight="1.6"
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
                  to="/signup"
                  size="lg"
                  bg="blue.500"
                  color="white"
                  _hover={{ bg: 'blue.600' }}
                  px={8}
                  fontSize="md"
                  fontWeight="medium"
                  borderRadius="md"
                >
                  Get Started
                </Button>
                <Button
                  as={RouterLink}
                  to="/login"
                  size="lg"
                  variant="outline"
                  bg="transparent"
                  borderColor="blue.500"
                  color="blue.500"
                  _hover={{ bg: 'blue.50' }}
                  px={8}
                  fontSize="md"
                  fontWeight="medium"
                  borderRadius="md"
                >
                  Log In
                </Button>
              </Stack>
            </Stack>
            <Flex
              flex={1}
              justify="center"
              align="center"
              position="relative"
              w="full"
              display={{ base: 'none', lg: 'flex' }}
            >
              <Box
                position="relative"
                height="400px"
                width="full"
                overflow="hidden"
                borderRadius="2xl"
                boxShadow="xl"
              >
                <Image
                  alt="Hero Image"
                  fit="cover"
                  align="center"
                  w="100%"
                  h="100%"
                  src="/images/hero-image.jpg"
                />
              </Box>
            </Flex>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20} bg={useColorModeValue('white', 'gray.900')}>
        <Container maxW="container.lg">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="bold"
                color={textColor}
              >
                Why Choose Our Platform?
              </Heading>
              <Text fontSize="lg" color={subtitleColor} maxW="3xl">
                Innovative tools designed to elevate your track and field experience
              </Text>
            </VStack>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} w="full">
              <Feature
                icon={<Icon as={FaChartLine} w={10} h={10} color="blue.500" />}
                title="Advanced Analytics"
                text="Track your performance metrics, analyze your progress, and get insights to improve your training."
              />
              <Feature
                icon={<Icon as={FaUsers} w={10} h={10} color="blue.500" />}
                title="Expert Coaching"
                text="Connect with professional coaches who can guide you through personalized training programs."
              />
              <Feature
                icon={<Icon as={FaTrophy} w={10} h={10} color="blue.500" />}
                title="Competition Ready"
                text="Prepare for competitions with specialized training plans and performance tracking tools."
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box py={20} bg={useColorModeValue('gray.50', 'gray.800')} w="100%">
        <Container maxW="container.lg">
          {/* Testimonials content */}
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={24} bg={useColorModeValue('white', 'gray.900')}>
        <Container maxW="container.md">
          <VStack spacing={8} textAlign="center">
            <Heading
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="bold"
              color={textColor}
            >
              Ready to Transform Your Track & Field Journey?
            </Heading>
            <Text fontSize="lg" color={subtitleColor} maxW="2xl">
              Join thousands of athletes who are already achieving their goals with our platform.
            </Text>
            <Button
              as={RouterLink}
              to="/signup"
              size="lg"
              bg="blue.500"
              color="white"
              _hover={{ bg: 'blue.600' }}
              px={10}
              py={7}
              fontSize="md"
              fontWeight="medium"
              borderRadius="md"
              mt={4}
            >
              Start Your Free Trial
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

// Feature component
const Feature = ({ title, text, icon }: { title: string; text: string; icon: React.ReactNode }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')
  
  return (
    <VStack
      p={8}
      bg={cardBg}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor={useColorModeValue('gray.100', 'gray.700')}
      align="start"
      spacing={5}
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-5px)',
        boxShadow: 'md',
      }}
    >
      <Box
        p={2}
        borderRadius="md"
        bg={useColorModeValue('blue.50', 'blue.900')}
      >
        {icon}
      </Box>
      <Heading size="md" fontWeight="semibold" color={textColor}>
        {title}
      </Heading>
      <Text color={subtitleColor}>
        {text}
      </Text>
    </VStack>
  )
}

export default Home 