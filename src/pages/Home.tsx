import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  Container,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

export function Home() {
  const navigate = useNavigate()

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bg="brand.500"
        color="white"
        py={20}
        px={4}
        textAlign="center"
      >
        <Container maxW="container.xl">
          <VStack spacing={6}>
            <Heading size="2xl">
              Track Your Progress, Achieve Your Goals
            </Heading>
            <Text fontSize="xl" maxW="2xl">
              A comprehensive platform for track & field athletes and coaches to
              log workouts, track progress, and collaborate with team members.
            </Text>
            <HStack spacing={4}>
              <Button
                size="lg"
                colorScheme="whiteAlpha"
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                colorScheme="whiteAlpha"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={20}>
        <VStack spacing={16}>
          <Heading textAlign="center">Key Features</Heading>

          <HStack spacing={8} align="start">
            <VStack flex={1} spacing={4} align="start">
              <Heading size="md">Workout Tracking</Heading>
              <Text>
                Log your workouts, track your progress, and get insights into your
                performance over time.
              </Text>
            </VStack>

            <VStack flex={1} spacing={4} align="start">
              <Heading size="md">Team Collaboration</Heading>
              <Text>
                Connect with your team, share updates, and stay motivated
                together.
              </Text>
            </VStack>

            <VStack flex={1} spacing={4} align="start">
              <Heading size="md">AI-Powered Insights</Heading>
              <Text>
                Get personalized recommendations and insights based on your
                training data.
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="gray.50" py={20}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading>Ready to Get Started?</Heading>
            <Text fontSize="xl" maxW="2xl">
              Join thousands of athletes and coaches who are already using our
              platform to achieve their goals.
            </Text>
            <Button
              size="lg"
              colorScheme="brand"
              onClick={() => navigate('/register')}
            >
              Create Your Account
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
} 