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
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtitleColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box bg={bgColor}>
      {/* Hero Section */}
      <Box py={{ base:100, md: 24 }} bg={cardBg}>
        <Container maxW="container.lg">
          <VStack spacing={6} align="center" textAlign="center">
            <Heading
              as="h1"
              size="2xl"
              fontWeight="bold"
              color={textColor}
              lineHeight="1.2"
            >
              Contact Us
            </Heading>
            <Text 
              color={subtitleColor}
              fontSize="xl"
              maxW="2xl"
              lineHeight="1.6"
            >
              Have a question or want to get in touch? We'd love to hear from you.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Form and Info Section */}
      <Box py={16} bg={bgColor}>
        <Container maxW="container.lg">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={12} alignItems="start">
            {/* Contact Form */}
            <Box>
              <VStack spacing={6} align="stretch">
                <Heading size="lg" color={textColor}>
                  Send us a message
                </Heading>
                
                <VStack as="form" spacing={4} align="stretch">
                  <FormControl isRequired>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaUser} color="gray.400" />
                      </InputLeftElement>
                      <Input 
                        placeholder="Name" 
                        borderColor={borderColor}
                        _focus={{ borderColor: "blue.500" }}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaEnvelope} color="gray.400" />
                      </InputLeftElement>
                      <Input 
                        type="email" 
                        placeholder="Email" 
                        borderColor={borderColor}
                        _focus={{ borderColor: "blue.500" }}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaPhone} color="gray.400" />
                      </InputLeftElement>
                      <Input 
                        type="tel" 
                        placeholder="Phone" 
                        borderColor={borderColor}
                        _focus={{ borderColor: "blue.500" }}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <Textarea 
                      rows={6} 
                      placeholder="Message" 
                      borderColor={borderColor}
                      _focus={{ borderColor: "blue.500" }}
                    />
                  </FormControl>

                  <Button colorScheme="blue" size="lg" type="submit">
                    Send Message
                  </Button>
                </VStack>
              </VStack>
            </Box>

            {/* Contact Information */}
            <Box>
              <VStack spacing={6} align="stretch">
                <Heading size="lg" color="#ecc94b">
                  Get in touch
                </Heading>
                
                <Text color={subtitleColor}>
                  Thank you for your interest in our platform. Fill out the form and we'll get back to you promptly regarding your request.
                </Text>

                <VStack spacing={4} align="start">
                  <HStack spacing={3}>
                    <Icon as={FaPhone} color="blue.500" />
                    <Text color={textColor}>+1 (555) 123-4567</Text>
                  </HStack>
                  
                  <HStack spacing={3}>
                    <Icon as={FaEnvelope} color="blue.500" />
                    <Text color={textColor}>support@trackfieldapp.com</Text>
                  </HStack>
                </VStack>

                <Box pt={4}>
                  <Text fontWeight="medium" color={textColor} mb={3}>
                    Follow us on social media:
                  </Text>
                  <HStack spacing={4}>
                    <Icon as={FaFacebook} boxSize={6} color="gray.500" cursor="pointer" _hover={{ color: "blue.500" }} />
                    <Icon as={FaTwitter} boxSize={6} color="gray.500" cursor="pointer" _hover={{ color: "blue.400" }} />
                    <Icon as={FaInstagram} boxSize={6} color="gray.500" cursor="pointer" _hover={{ color: "pink.500" }} />
                    <Icon as={FaYoutube} boxSize={6} color="gray.500" cursor="pointer" _hover={{ color: "red.500" }} />
                  </HStack>
                </Box>
              </VStack>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  )
}

export { Contact } 