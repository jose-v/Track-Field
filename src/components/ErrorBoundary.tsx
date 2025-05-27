import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Container,
} from '@chakra-ui/react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Container maxW="container.md" py={20}>
          <VStack spacing={6} align="center">
            <Heading>Something went wrong</Heading>
            <Text>
              We apologize for the inconvenience. Please try refreshing the page.
            </Text>
            <Box>
              <Button
                colorScheme="brand"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </Box>
            {process.env.NODE_ENV === 'development' && (
              <Box
                mt={4}
                p={4}
                bg="gray.100"
                borderRadius="md"
                whiteSpace="pre-wrap"
              >
                <Text fontFamily="monospace" fontSize="sm">
                  {this.state.error?.toString()}
                </Text>
              </Box>
            )}
          </VStack>
        </Container>
      )
    }

    return this.props.children
  }
} 