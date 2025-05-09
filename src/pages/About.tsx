import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'

const About = () => {
  const textColor = useColorModeValue('gray.600', 'gray.400')

  return (
    <Box w="100%">
      {/* Hero Section */}
      <Box bg={useColorModeValue('blue.50', 'blue.900')} py={20} w="100%">
        <Container maxW="100%" px={8}>
          <Stack spacing={8} align="center" textAlign="center">
            <Heading size="2xl">Our Mission</Heading>
            <Text fontSize="xl" maxW="3xl" color={textColor}>
              We're on a mission to revolutionize track & field training by providing athletes and coaches with the tools they need to achieve their full potential.
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* Story Section */}
      <Box py={20} w="100%">
        <Container maxW="100%" px={8}>
          <Stack spacing={12}>
            <Flex direction={{ base: 'column', md: 'row' }} gap={8} align="center">
              <Box flex={1}>
                <Heading size="lg" mb={6}>
                  Our Story
                </Heading>
                <Text color={textColor} mb={4}>
                  Founded by a team of former track & field athletes and coaches, we understand the challenges and opportunities in the sport. Our platform was born from a simple idea: make professional-grade training tools accessible to everyone.
                </Text>
                <Text color={textColor}>
                  Today, we're proud to serve thousands of athletes and coaches worldwide, helping them track progress, analyze performance, and achieve their goals.
                </Text>
              </Box>
              <Box flex={1}>
                <Image
                  src="/images/about-image.jpg"
                  alt="Track & Field Team"
                  borderRadius="lg"
                  shadow="xl"
                  fallbackSrc="/images/event-fallback.jpg"
                />
              </Box>
            </Flex>

            {/* Values Section */}
            <Box>
              <Heading size="lg" mb={8} textAlign="center">
                Our Values
              </Heading>
              <Stack
                direction={{ base: 'column', md: 'row' }}
                spacing={8}
                justify="center"
              >
                <Box
                  bg={useColorModeValue('white', 'gray.800')}
                  p={6}
                  rounded="lg"
                  shadow="md"
                  flex={1}
                >
                  <Heading size="md" mb={4}>
                    Excellence
                  </Heading>
                  <Text color={textColor}>
                    We strive for excellence in everything we do, from our platform features to our customer support.
                  </Text>
                </Box>
                <Box
                  bg={useColorModeValue('white', 'gray.800')}
                  p={6}
                  rounded="lg"
                  shadow="md"
                  flex={1}
                >
                  <Heading size="md" mb={4}>
                    Innovation
                  </Heading>
                  <Text color={textColor}>
                    We continuously innovate to provide the best tools and features for our users.
                  </Text>
                </Box>
                <Box
                  bg={useColorModeValue('white', 'gray.800')}
                  p={6}
                  rounded="lg"
                  shadow="md"
                  flex={1}
                >
                  <Heading size="md" mb={4}>
                    Community
                  </Heading>
                  <Text color={textColor}>
                    We believe in the power of community and support in achieving athletic goals.
                  </Text>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}

export { About } 