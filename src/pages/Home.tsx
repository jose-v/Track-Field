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
  SimpleGrid,
  Icon,
  VStack,
  HStack,
  Divider,
  Badge,
  chakra,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { Link as RouterLink } from 'react-router-dom'
import { FaChartLine, FaUsers, FaTrophy, FaRunning, FaClock, FaCalendarAlt, FaChevronRight } from 'react-icons/fa'

const Home = () => {
  const textColor = useColorModeValue('gray.800', 'white')
  const subtitleColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const accentColor = useColorModeValue('blue.500', 'blue.300')
  
  // Animation keyframes
  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  `
  
  const slideIn = keyframes`
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  `
  
  const fadeInAnimation = `${fadeIn} 1s ease-out forwards`
  const slideInAnimation = `${slideIn} 1s ease-out forwards`

  return (
    <Box w="100vw" maxW="100vw" overflowX="hidden" position="relative" left="50%" right="50%" mx="-50vw">
      {/* Hero Section - Full width with no top margin */}
      <Box 
        position="relative"
        minH="100vh"
        width="100vw"
        mt="-80px" // Negative margin to go behind navbar
        pt="80px"   // Padding to offset the negative margin
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
          zIndex={0}
          _after={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: 'blackAlpha.600',
            zIndex: 1
          }}
        />
        
        <Box position="relative" zIndex={2} py={{ base: 20, md: 32 }} width="100%">
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            align="center"
            justify="space-between"
            maxW={{ base: "95%", md: "90%" }}
            mx="auto"
            px={{ base: 4, md: 8 }}
          >
            <Stack 
              flex={1} 
              spacing={{ base: 6, md: 8 }}
              maxW={{ base: "100%", lg: "50%" }}
            >
              <Badge 
                colorScheme="blue" 
                alignSelf="flex-start" 
                fontSize="sm" 
                px={3} 
                py={1} 
                borderRadius="full"
                animation={`${fadeIn} 0.8s ease-out forwards`}
              >
                TRACK & FIELD EXCELLENCE
              </Badge>
              
              <Heading
                as="h1"
                fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                fontWeight="bold"
                lineHeight="1.1"
                color="white"
                animation={fadeInAnimation}
              >
                Elevate Your <chakra.span color={accentColor}>Athletic</chakra.span> Potential
              </Heading>
              
              <Text 
                fontSize={{ base: "lg", md: "xl" }} 
                color="gray.200"
                animation={`${fadeIn} 1s ease-out 0.3s forwards`}
                opacity="0"
                lineHeight="1.8"
              >
                Join the ultimate platform for track and field athletes. Track your progress, connect with coaches, and transform your training into championship performance.
              </Text>
              
              <Stack 
                direction={{ base: 'column', sm: 'row' }} 
                spacing={4}
                animation={`${fadeIn} 1s ease-out 0.6s forwards`}
                opacity="0"
                pt={4}
              >
                <Button
                  as={RouterLink}
                  to="/signup"
                  size="lg"
                  bg="blue.500"
                  color="white"
                  _hover={{ bg: 'blue.600', transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  px={8}
                  fontSize="md"
                  fontWeight="medium"
                  borderRadius="md"
                  rightIcon={<Icon as={FaChevronRight} />}
                  transition="all 0.3s"
                >
                  Get Started
                </Button>
                <Button
                  as={RouterLink}
                  to="/login"
                  size="lg"
                  variant="outline"
                  bg="transparent"
                  borderColor="white"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200', transform: 'translateY(-2px)' }}
                  px={8}
                  fontSize="md"
                  fontWeight="medium"
                  borderRadius="md"
                  transition="all 0.3s"
                >
                  Log In
                </Button>
              </Stack>
              
              <HStack spacing={4} pt={6} animation={`${fadeIn} 1s ease-out 0.9s forwards`} opacity="0">
                <Box bg="whiteAlpha.200" px={3} py={1} borderRadius="full">
                  <Text fontSize="sm" color="white">
                    <Icon as={FaRunning} mr={2} /> 5,000+ Athletes
                  </Text>
                </Box>
                <Box bg="whiteAlpha.200" px={3} py={1} borderRadius="full">
                  <Text fontSize="sm" color="white">
                    <Icon as={FaUsers} mr={2} /> 200+ Coaches
                  </Text>
                </Box>
              </HStack>
            </Stack>
            
            <Flex
              flex={1}
              justify="center"
              align="center"
              position="relative"
              w="full"
              maxW={{ base: "100%", lg: "50%" }}
              display={{ base: 'none', md: 'flex' }}
              animation={slideInAnimation}
              opacity="0"
            >
              <Box
                position="relative"
                height={{ base: "300px", md: "450px" }}
                width="full"
                overflow="hidden"
                borderRadius="2xl"
                boxShadow="2xl"
              >
                <Image
                  alt="Track & Field Athletes"
                  fit="cover"
                  align="center"
                  w="100%"
                  h="100%"
                  src="/images/hero-banner-2.jpg"
                  transform="scale(1.05)"
                  transition="transform 0.5s ease"
                  _hover={{ transform: "scale(1.1)" }}
                />
              </Box>
            </Flex>
          </Flex>
        </Box>
      </Box>

      {/* Features Section */}
      <Box py={{ base: 16, md: 24 }} bg={useColorModeValue('white', 'gray.900')} width="100vw">
        <Box maxW={{ base: "95%", md: "90%" }} mx="auto" px={{ base: 4, md: 8 }}>
          <VStack spacing={{ base: 12, md: 16 }}>
            <VStack spacing={4} textAlign="center" maxW="800px" mx="auto">
              <Heading
                fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
                fontWeight="bold"
                color={textColor}
                letterSpacing="tight"
              >
                Why Athletes Choose Our Platform
              </Heading>
              <Text fontSize={{ base: "md", md: "lg", lg: "xl" }} color={subtitleColor} maxW="3xl">
                Innovative tools designed to transform your training experience and elevate your performance
              </Text>
              <Divider maxW="100px" borderColor={accentColor} borderWidth={2} my={4} />
            </VStack>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 8, md: 12 }} w="full">
              <Feature
                icon={<Icon as={FaChartLine} w={10} h={10} color="blue.500" />}
                title="Advanced Analytics"
                text="Track your performance metrics with intuitive visualizations. Identify trends and opportunities for improvement in your training."
              />
              <Feature
                icon={<Icon as={FaUsers} w={10} h={10} color="blue.500" />}
                title="Expert Coaching"
                text="Connect directly with professional coaches who provide personalized feedback and customized training programs."
              />
              <Feature
                icon={<Icon as={FaTrophy} w={10} h={10} color="blue.500" />}
                title="Competition Ready"
                text="Prepare for competitions with specialized training plans and performance tracking tools designed for peak performance."
              />
            </SimpleGrid>
          </VStack>
        </Box>
      </Box>

      {/* Testimonials Section */}
      <Box py={{ base: 16, md: 24 }} bg={useColorModeValue('gray.50', 'gray.800')} width="100vw">
        <Box maxW={{ base: "95%", md: "90%" }} mx="auto" px={{ base: 4, md: 8 }}>
          <VStack spacing={10} textAlign="center">
            <Heading
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="bold"
              color={textColor}
            >
              Success Stories
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color={subtitleColor} maxW="2xl">
              Hear from athletes who have transformed their performance using our platform
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} w="full" pt={6}>
              <TestimonialCard 
                name="Michael Johnson"
                role="Sprinter"
                image="/images/testimonial1.jpg"
                content="The analytics helped me identify weaknesses in my sprint technique. After three months, I improved my 100m time by 0.5 seconds."
              />
              <TestimonialCard 
                name="Sarah Williams"
                role="High Jumper"
                image="/images/testimonial2.jpg"
                content="The connection with coaches has been invaluable. My technique has completely transformed thanks to the personalized feedback."
              />
              <TestimonialCard 
                name="David Rodriguez"
                role="Distance Runner"
                image="/images/testimonial3.jpg"
                content="The training plans are excellent. I've been able to train more efficiently and reduce my marathon time by 12 minutes."
              />
            </SimpleGrid>
          </VStack>
        </Box>
      </Box>

      {/* CTA Section */}
      <Box py={{ base: 16, md: 24 }} bg={useColorModeValue('blue.600', 'blue.700')} width="100vw">
        <Box maxW={{ base: "95%", md: "90%" }} mx="auto" px={{ base: 4, md: 8 }}>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={10} align="center" justify="space-between">
            <VStack spacing={4} align={{ base: 'center', md: 'start' }} maxW="600px">
              <Heading
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="bold"
                color="white"
              >
                Ready to Transform Your Athletic Performance?
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} color="whiteAlpha.900" maxW="2xl">
                Join thousands of athletes who are already breaking personal records with our platform.
              </Text>
            </VStack>
            <Button
              as={RouterLink}
              to="/signup"
              size="lg"
              bg="white"
              color="blue.600"
              _hover={{ bg: 'gray.100', transform: 'translateY(-2px)', boxShadow: 'lg' }}
              px={10}
              py={7}
              fontSize="md"
              fontWeight="bold"
              borderRadius="md"
              rightIcon={<Icon as={FaChevronRight} />}
              transition="all 0.3s"
            >
              Start Your Free Trial
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

// Feature component
const Feature = ({ title, text, icon }: { title: string; text: string; icon: React.ReactNode }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtitleColor = useColorModeValue('gray.600', 'gray.300')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  
  return (
    <VStack
      p={8}
      bg={cardBg}
      borderRadius="lg"
      boxShadow="md"
      align="flex-start"
      spacing={5}
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-5px)', 
        boxShadow: 'lg',
        bg: hoverBg,
      }}
      height="100%"
    >
      <Box 
        bg="blue.50" 
        p={3} 
        borderRadius="lg"
        color="blue.500"
      >
        {icon}
      </Box>
      <Heading size="md" color={textColor}>{title}</Heading>
      <Text color={subtitleColor}>{text}</Text>
    </VStack>
  )
}

// Testimonial Card component
const TestimonialCard = ({ 
  name, 
  role, 
  image, 
  content 
}: { 
  name: string; 
  role: string; 
  image: string; 
  content: string 
}) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.800', 'white')
  
  return (
    <VStack
      p={8}
      bg={cardBg}
      borderRadius="lg"
      boxShadow="md"
      align="center"
      spacing={5}
      position="relative"
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-5px)', 
        boxShadow: 'lg' 
      }}
    >
      <Text fontSize="lg" fontStyle="italic" textAlign="center" color={textColor}>
        "{content}"
      </Text>
      <Divider />
      <HStack spacing={4}>
        <Image
          src={image || "https://via.placeholder.com/50"}
          alt={name}
          borderRadius="full"
          boxSize="50px"
          objectFit="cover"
          fallbackSrc="https://via.placeholder.com/50"
        />
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" color={textColor}>{name}</Text>
          <Text fontSize="sm" color="gray.500">{role}</Text>
        </VStack>
      </HStack>
    </VStack>
  )
}

export default Home 