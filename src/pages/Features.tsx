import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  Grid,
  GridItem,
  Image,
  Button,
  Divider,
} from '@chakra-ui/react'
import { FaChartLine, FaUsers, FaCalendarAlt, FaVideo, FaTrophy, FaBell, FaChevronRight } from 'react-icons/fa'
import { Link as RouterLink } from 'react-router-dom'

const Feature = ({ title, text, icon }: { title: string; text: string; icon: any }) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const iconBg = useColorModeValue('blue.50', 'blue.900')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')
  
  return (
    <VStack 
      bg={cardBg} 
      p={8} 
      borderRadius="xl" 
      spacing={6} 
      borderWidth="1px"
      borderColor={borderColor}
      _hover={{ transform: 'translateY(-5px)' }}
      transition="all 0.2s"
    >
      <Flex
        w={12}
        h={12}
        align="center"
        justify="center"
        rounded="md"
        bg={iconBg}
        color="blue.500"
      >
        <Icon as={icon} w={6} h={6} />
      </Flex>
      <Heading size="md" fontWeight="semibold" color={textColor}>
        {title}
      </Heading>
      <Text color={subtitleColor} fontSize="sm">
        {text}
      </Text>
    </VStack>
  )
}

const DetailFeature = ({ title, text, image, reverse = false }: { title: string; text: string; image: string; reverse?: boolean }) => {
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')
  
  return (
    <Grid 
      templateColumns={{ base: '1fr', lg: '1fr 1fr' }} 
      gap={12}
      alignItems="center"
    >
      <GridItem order={{ base: 1, lg: reverse ? 2 : 1 }}>
        <VStack align="start" spacing={5}>
          <Heading size="lg" color={textColor} lineHeight="1.2">
            {title}
          </Heading>
          <Text color={subtitleColor} fontSize="md" lineHeight="1.7">
            {text}
          </Text>
        </VStack>
      </GridItem>
      <GridItem order={{ base: 2, lg: reverse ? 1 : 2 }}>
        <Box
          borderRadius="lg"
          overflow="hidden"
        >
          <Image
            src={image}
            alt={title}
            w="full"
            h="auto"
            fallbackSrc="https://via.placeholder.com/600x400?text=Feature+Image"
          />
        </Box>
      </GridItem>
    </Grid>
  )
}

const Features = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.700', 'gray.300')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const cardBg = useColorModeValue('white', 'gray.800')
  
  const features = [
    {
      title: 'Advanced Analytics',
      text: 'Track your performance metrics, analyze your progress, and get insights to improve your training.',
      icon: FaChartLine,
    },
    {
      title: 'Team Collaboration',
      text: 'Connect with your team, share updates, and stay motivated together.',
      icon: FaUsers,
    },
    {
      title: 'Training Plans',
      text: 'Access personalized training plans designed by professional coaches.',
      icon: FaCalendarAlt,
    },
    {
      title: 'Video Analysis',
      text: 'Record and analyze your technique with our video analysis tools.',
      icon: FaVideo,
    },
    {
      title: 'Competition Tracking',
      text: 'Keep track of your competitions, results, and achievements.',
      icon: FaTrophy,
    },
    {
      title: 'Smart Notifications',
      text: 'Get timely reminders for workouts, competitions, and team events.',
      icon: FaBell,
    },
  ]

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Hero Section */}
      <Box py={{ base: 100, md: 24 }} bg={cardBg}>
        <Container maxW="container.lg">
          <VStack spacing={6} align="center" textAlign="center">
            <Heading
              as="h1"
              size="2xl"
              fontWeight="bold"
              color={textColor}
              lineHeight="1.2"
              maxW="3xl"
            >
              Everything You Need to Excel in Track & Field
            </Heading>
            <Text 
              color={subtitleColor}
              fontSize="xl"
              maxW="2xl"
              lineHeight="1.6"
            >
              Our platform provides all the tools and features you need to take your track & field performance to the next level.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Features Grid Section */}
      <Box py={20} bg="#ecc94b">
        <Container maxW="container.lg">
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {features.map((feature, index) => (
              <Feature
                key={index}
                title={feature.title}
                text={feature.text}
                icon={feature.icon}
              />
            ))}
          </SimpleGrid>
        </Container>
      </Box>
      
      {/* Detailed Features Section */}
      <Box py={20} bg={cardBg}>
        <Container maxW="container.lg">
          <VStack spacing={24}>
            <DetailFeature
              title="Track Your Progress with Advanced Analytics"
              text="Our analytics dashboard provides real-time insights into your performance. Track your personal records, analyze training patterns, and identify areas for improvement. With customizable metrics and visual reports, you can make data-driven decisions to enhance your training and competition strategies."
              image="https://images.unsplash.com/photo-1581093588401-230afc81d2d8?auto=format&fit=crop&w=800&q=80"
            />
            
            <Divider borderColor={borderColor} />
            
            <DetailFeature
              title="Collaborate with Your Team Seamlessly"
              text="Connect with coaches and teammates in one centralized platform. Share training plans, receive feedback on performances, and communicate effectively. Our team collaboration features ensure everyone stays aligned with goals and training objectives, fostering a supportive community environment."
              image="https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=800&q=80"
              reverse={true}
            />
            
            <Divider borderColor={borderColor} />
            
            <DetailFeature
              title="Analyze Your Technique with Video Tools"
              text="Upload training videos and receive detailed technique analysis. Our frame-by-frame review tools allow coaches to provide precise feedback on form and execution. Compare your technique to professional athletes or track improvements over time with side-by-side video comparison."
              image="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80"
            />
          </VStack>
        </Container>
      </Box>
      
      {/* CTA Section */}
      <Box py={20} bg="#ecc94b">
        <Container maxW="container.md">
          <VStack spacing={8} textAlign="center">
            <Heading size="xl" color="gray.800">
              Ready to Transform Your Training?
            </Heading>
            <Text fontSize="lg" color="gray.700" maxW="2xl">
              Join thousands of athletes who are already achieving their goals with our platform.
            </Text>
            <Button
              as={RouterLink}
              to="/signup"
              colorScheme="blue"
              size="lg"
              borderRadius="md"
              px={8}
              fontWeight="medium"
            >
              Get Started
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

export { Features } 