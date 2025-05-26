import {
  Box,
  Container,
  Heading,
  Text,
  useColorModeValue,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Icon,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  HStack,
} from '@chakra-ui/react'
import { 
  FaEnvelope, 
  FaUser, 
  FaPhone, 
  FaFacebook,
  FaTwitter, 
  FaInstagram,
  FaYoutube,
} from 'react-icons/fa'

function Contact() {
  const bgColor = useColorModeValue('white', 'gray.900')
  const heroGradient = 'linear(to-r, #FF6C8C, #FFA94D)'
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const inputBg = useColorModeValue('white', 'gray.700')
  const accentColor = '#FFD204'
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700')
  const iconBg = useColorModeValue('accent.50', 'accent.900')

  return (
    <Box bg={bgColor} minH="100vh" w="100vw" maxW="100vw" overflowX="hidden" position="relative" left="50%" right="50%" mx="-50vw">
      {/* Gradient Hero Section with form & text */}
      <Box
        pt={{ base: 28, md: 32 }}
        pb={{ base: 16, md: 24 }}
        bgGradient={heroGradient}
        clipPath={{ base: 'none', md: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)' }}
      >
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="flex-start">
            {/* Form Card */}
            <Box bg={cardBg} p={{ base: 6, md: 8 }} borderRadius="lg" shadow="lg" maxW="380px" w="full" mx="auto">
              <VStack as="form" spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium">Name</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaUser} color="gray.400" />
                    </InputLeftElement>
                    <Input placeholder="Your name" bg={inputBg} />
                  </InputGroup>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium">Email</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaEnvelope} color="gray.400" />
                    </InputLeftElement>
                    <Input type="email" placeholder="Your email" bg={inputBg}  />
                  </InputGroup>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">Phone</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaPhone} color="gray.400" />
                    </InputLeftElement>
                    <Input type="tel" placeholder="Your phone" bg={inputBg}  />
                  </InputGroup>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium">Message</FormLabel>
                  <Textarea rows={4} placeholder="Your message" bg={inputBg} />
                </FormControl>
                <Button variant="solid" colorScheme="primary" size="lg" w="full">Submit</Button>
              </VStack>
            </Box>

            {/* Right Text & Contact Info */}
            <VStack spacing={6} align="start" color="white" maxW="480px" mx="auto">
              <Heading size="2xl" lineHeight="1.2">Don't be a stranger<br/>just say <Box as="span" color={accentColor}>hello!</Box></Heading>
              <Text fontSize="lg">
                Thank you for your interest in our platform. Fill out the form and we'll get back to you promptly regarding your request.
              </Text>
              <Box bgGradient="linear(to-r, primary.500, primary.600)" p={6} borderRadius="lg" shadow="md" w="full">
                <VStack align="start" spacing={4} color="white">
                  <HStack spacing={3}>
                    <Icon as={FaPhone} />
                    <Text>+1 (555) 123-4567</Text>
                  </HStack>
                  <HStack spacing={3}>
                    <Icon as={FaEnvelope} />
                    <Text>support@trackfieldapp.com</Text>
                  </HStack>
                </VStack>
              </Box>
              <HStack spacing={3} pt={2}>
                <Text fontWeight="medium">Find us on:</Text>
                <Icon as={FaFacebook} boxSize={5} />
                <Icon as={FaTwitter} boxSize={5} />
                <Icon as={FaInstagram} boxSize={5} />
                <Icon as={FaYoutube} boxSize={5} />
              </HStack>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Spacer bottom */}
      <Box h={6} />
    </Box>
  )
}

// Contact Info Card Component
const ContactInfoCard = ({ 
  icon, 
  title, 
  content, 
  subtext,
  iconBg,
  cardBg,
  textColor,
  subtitleColor,
  hoverBg
}: { 
  icon: React.ElementType;
  title: string;
  content: string;
  subtext: string;
  iconBg: string;
  cardBg: string;
  textColor: string;
  subtitleColor: string;
  hoverBg: string;
}) => {
  return (
    <VStack 
      p={6} 
      bg={cardBg} 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor="gray.100" 
      shadow="sm"
      _hover={{ 
        transform: 'translateY(-5px)', 
        shadow: 'md',
        bg: hoverBg,
        borderColor: 'primary.100'
      }}
      transition="all 0.3s"
      align="center"
      spacing={4}
    >
      <Box bg={iconBg} p={3} borderRadius="full">
        <Icon as={icon} boxSize={6} color="primary.500" />
      </Box>
      <VStack spacing={2} textAlign="center">
        <Text fontWeight="bold" fontSize="lg" color={textColor}>{title}</Text>
        <Text fontSize="md" color={textColor}>{content}</Text>
        <Text fontSize="sm" color={subtitleColor}>{subtext}</Text>
      </VStack>
    </VStack>
  )
}

// Social Media Button Component
const SocialButton = ({ icon, label }: { icon: React.ElementType; label: string }) => {
  return (
    <Button
      leftIcon={<Icon as={icon} />}
      colorScheme="primary"
      variant="ghost"
      size="md"
      borderRadius="md"
      _hover={{ bg: 'primary.50' }}
    >
      {label}
    </Button>
  )
}

export { Contact } 