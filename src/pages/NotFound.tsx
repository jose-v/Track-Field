import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={6} align="center">
        <Heading size="2xl">404</Heading>
        <Heading size="lg">Page Not Found</Heading>
        <Text textAlign="center">
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Box>
          <Button colorScheme="brand" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </Box>
      </VStack>
    </Container>
  )
} 