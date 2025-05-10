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
} from '@chakra-ui/react'
import { FaEnvelope, FaUser } from 'react-icons/fa'

function Contact() {
  const bgColor = useColorModeValue('white', 'gray.900')
  const heroBgColor = useColorModeValue('gray.50', 'gray.800')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const inputBg = useColorModeValue('white', 'gray.700')

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Hero Section */}
      <Box 
        py={{ base: 16, md: 24 }} 
        bg={heroBgColor}
        position="relative"
        overflow="hidden"
      >
        {/* Background with subtle pattern */}
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
          opacity="0.1"
          zIndex={0}
        />
        
        <Container maxW="container.lg" position="relative" zIndex={1}>
          <VStack spacing={6} align="center" textAlign="center">
            <Heading
              as="h1"
              size="2xl"
              fontWeight="bold"
              color={textColor}
              lineHeight="1.2"
              letterSpacing="tight"
            >
              Get in Touch
            </Heading>
            <Text 
              color={subtitleColor}
              fontSize="xl"
              maxW="2xl"
              lineHeight="1.6"
            >
              Have questions about our platform? We're here to help you reach your Track & Field goals.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Contact Form Section */}
      <Box py={16} bg={bgColor}>
        <Container maxW="container.md">
          <VStack 
            as="form" 
            spacing={8} 
            p={{ base: 6, md: 10 }}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            bg={cardBg}
            shadow="sm"
            maxW="700px"
            mx="auto"
          >
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Name</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaUser} color="gray.400" />
                </InputLeftElement>
                <Input 
                  type="text" 
                  placeholder="Your name" 
                  bg={inputBg}
                  borderColor={borderColor}
                  fontSize="sm"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)'
                  }}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Email</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaEnvelope} color="gray.400" />
                </InputLeftElement>
                <Input 
                  type="email" 
                  placeholder="Your email" 
                  bg={inputBg}
                  borderColor={borderColor}
                  fontSize="sm"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)'
                  }}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>Message</FormLabel>
              <Textarea 
                placeholder="Your message" 
                rows={7}
                bg={inputBg}
                borderColor={borderColor}
                fontSize="sm"
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)'
                }}
              />
            </FormControl>
            
            <Button 
              colorScheme="blue" 
              type="submit" 
              size="lg"
              fontSize="sm"
              fontWeight="medium"
              w="full"
              mt={4}
              borderRadius="md"
              borderWidth="0px"
              _hover={{ bg: 'blue.600' }}
            >
              Send Message
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

export { Contact } 