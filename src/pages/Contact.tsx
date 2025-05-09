import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  useColorModeValue,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react'

function Contact() {
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const cardBg = useColorModeValue('white', 'gray.800')

  return (
    <Box w="100%">
      {/* Hero Section */}
      <Box bg={useColorModeValue('blue.50', 'blue.900')} py={20} w="100%">
        <Box w="100%" px={8}>
          <Stack spacing={8} align="center" textAlign="center" w="100%">
            <Heading size="2xl">Get in Touch</Heading>
            <Text fontSize="xl" color={textColor}>
              Have questions about our platform? We're here to help you reach your Track & Field goals. Send us a message and we'll respond as soon as possible.
            </Text>
          </Stack>
        </Box>
      </Box>

      {/* Contact Form Section */}
      <Box py={20} w="100%">
        <Box w="100%" px={8}>
          <Stack spacing={12} w="100%">
            <Flex direction={{ base: 'column', md: 'row' }} gap={8} align="start" w="100%">
              <Box flex={1} w={{ base: "100%", md: "50%" }}>
                <Heading size="lg" mb={6}>
                  Send Us a Message
                </Heading>
                <Stack as="form" spacing={4} w="100%">
                  <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input type="text" placeholder="Your name" />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input type="email" placeholder="Your email" />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Message</FormLabel>
                    <Textarea placeholder="Your message" rows={5} />
                  </FormControl>
                  <Button colorScheme="blue" type="submit">
                    Send Message
                  </Button>
                </Stack>
              </Box>
              <Box flex={1} w={{ base: "100%", md: "50%" }}>
                <Image
                  src="/images/contact-image-2.jpg"
                  alt="Customer Support"
                  borderRadius="lg"
                  shadow="xl"
                  fallbackSrc="/images/contact-image-2.jpg"
                  w="100%"
                />
              </Box>
            </Flex>

            {/* Contact Information Section */}
            <Box w="100%">
              <Heading size="lg" mb={8} textAlign="center">
                Ways to Connect
              </Heading>
              <Stack
                direction={{ base: 'column', md: 'row' }}
                spacing={8}
                justify="center"
                w="100%"
              >
                <Box
                  bg={cardBg}
                  p={6}
                  rounded="lg"
                  shadow="md"
                  flex={1}
                  w={{ base: "100%", md: "33.333%" }}
                >
                  <Heading size="md" mb={4}>
                    Email
                  </Heading>
                  <Text color={textColor}>
                    support@trackandfield.com
                  </Text>
                </Box>
                <Box
                  bg={cardBg}
                  p={6}
                  rounded="lg"
                  shadow="md"
                  flex={1}
                  w={{ base: "100%", md: "33.333%" }}
                >
                  <Heading size="md" mb={4}>
                    Phone
                  </Heading>
                  <Text color={textColor}>
                    +1 (555) 123-4567
                  </Text>
                </Box>
                <Box
                  bg={cardBg}
                  p={6}
                  rounded="lg"
                  shadow="md"
                  flex={1}
                  w={{ base: "100%", md: "33.333%" }}
                >
                  <Heading size="md" mb={4}>
                    Hours
                  </Heading>
                  <Text color={textColor}>
                    Monday - Friday, 9:00 AM - 5:00 PM EST
                  </Text>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}

export { Contact } 