import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  SimpleGrid,
  HStack,
  Icon,
  Avatar,
  GridItem,
  Grid,
} from '@chakra-ui/react'
import { FaMedal, FaRegLightbulb, FaUsers } from 'react-icons/fa'

const About = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.100', 'gray.700')

  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Co-Founder',
      image: '/images/team/sarah.jpg',
      bio: 'Former Olympic sprinter with 15+ years of coaching experience.',
    },
    {
      name: 'David Chen',
      role: 'CTO & Co-Founder',
      image: '/images/team/david.jpg',
      bio: 'Software engineer and collegiate track athlete who specializes in sports analytics.',
    },
    {
      name: 'Maria Rodriguez',
      role: 'Head of Coaching',
      image: '/images/team/maria.jpg',
      bio: 'National champion and certified coach with expertise in training methodology.',
    },
  ]

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Hero Section */}
      <Box py={{ base: 16, md: 24 }} bg="white">
        <Container maxW="container.lg">
          <VStack spacing={6} align="center" textAlign="center">
            <Heading
              as="h1"
              size="2xl"
              fontWeight="bold"
              color={textColor}
              lineHeight="1.2"
            >
              Our Mission
            </Heading>
            <Text 
              color={subtitleColor}
              fontSize="xl"
              maxW="2xl"
              lineHeight="1.6"
            >
              We're on a mission to revolutionize track & field training by providing athletes and coaches with the tools they need to achieve their full potential.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Story Section */}
      <Box py={20} bg={bgColor}>
        <Container maxW="container.lg">
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={12} alignItems="center">
            <GridItem>
              <VStack align="flex-start" spacing={6}>
                <Heading size="xl" color={textColor} lineHeight="1.2">
                  Our Story
                </Heading>
                <Text color={subtitleColor} fontSize="lg" lineHeight="1.7">
                  Founded by a team of former track & field athletes and coaches, we understand the challenges and opportunities in the sport. Our platform was born from a simple idea: make professional-grade training tools accessible to everyone.
                </Text>
                <Text color={subtitleColor} fontSize="lg" lineHeight="1.7">
                  Today, we're proud to serve thousands of athletes and coaches worldwide, helping them track progress, analyze performance, and achieve their goals.
                </Text>
              </VStack>
            </GridItem>
            <GridItem>
              <Box
                borderRadius="xl"
                overflow="hidden"
                boxShadow="xl"
                height={{ base: '300px', md: '400px' }}
              >
                <Image
                  src="/images/about-image.jpg"
                  alt="Track & Field Team"
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  fallbackSrc="https://via.placeholder.com/800x600?text=Our+Team"
                />
              </Box>
            </GridItem>
          </Grid>
        </Container>
      </Box>

      {/* Values Section */}
      <Box py={20} bg="white">
        <Container maxW="container.lg">
          <VStack spacing={12}>
            <Heading 
              textAlign="center" 
              size="xl" 
              color={textColor} 
              fontWeight="bold"
            >
              Our Values
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <VStack 
                p={8} 
                spacing={5} 
                align="start" 
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                bg={cardBg}
                transition="all 0.3s"
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
              >
                <Flex
                  w={12}
                  h={12}
                  align="center"
                  justify="center"
                  rounded="md"
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  color="blue.500"
                >
                  <Icon as={FaMedal} w={6} h={6} />
                </Flex>
                <Heading size="md" color={textColor}>Excellence</Heading>
                <Text color={subtitleColor} fontSize="md">
                  We strive for excellence in everything we do, from our platform features to our customer support.
                </Text>
              </VStack>
              
              <VStack 
                p={8} 
                spacing={5} 
                align="start" 
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                bg={cardBg}
                transition="all 0.3s"
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
              >
                <Flex
                  w={12}
                  h={12}
                  align="center"
                  justify="center"
                  rounded="md"
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  color="blue.500"
                >
                  <Icon as={FaRegLightbulb} w={6} h={6} />
                </Flex>
                <Heading size="md" color={textColor}>Innovation</Heading>
                <Text color={subtitleColor} fontSize="md">
                  We continuously innovate to provide the best tools and features for our users, pushing the boundaries of sports technology.
                </Text>
              </VStack>
              
              <VStack 
                p={8} 
                spacing={5} 
                align="start" 
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                bg={cardBg}
                transition="all 0.3s"
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
              >
                <Flex
                  w={12}
                  h={12}
                  align="center"
                  justify="center"
                  rounded="md"
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  color="blue.500"
                >
                  <Icon as={FaUsers} w={6} h={6} />
                </Flex>
                <Heading size="md" color={textColor}>Community</Heading>
                <Text color={subtitleColor} fontSize="md">
                  We believe in the power of community and support in achieving athletic goals, fostering connections between athletes worldwide.
                </Text>
              </VStack>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
      
      {/* Team Section */}
      <Box py={20} bg={bgColor}>
        <Container maxW="container.lg">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl" color={textColor} fontWeight="bold">
                Meet Our Team
              </Heading>
              <Text color={subtitleColor} fontSize="lg" maxW="2xl">
                Our dedicated team of athletes, coaches, and technology experts
              </Text>
            </VStack>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              {teamMembers.map((member, index) => (
                <VStack 
                  key={index}
                  p={6} 
                  spacing={4} 
                  align="center" 
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  bg={cardBg}
                >
                  <Avatar 
                    size="xl" 
                    name={member.name} 
                    src={member.image} 
                    mb={2}
                    borderWidth="4px"
                    borderColor="white"
                    boxShadow="lg"
                  />
                  <VStack spacing={1}>
                    <Heading size="md" color={textColor}>
                      {member.name}
                    </Heading>
                    <Text fontWeight="medium" color="blue.500" fontSize="sm">
                      {member.role}
                    </Text>
                  </VStack>
                  <Text color={subtitleColor} fontSize="sm" textAlign="center">
                    {member.bio}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

export { About } 