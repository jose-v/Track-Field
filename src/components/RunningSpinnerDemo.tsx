import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Heading, 
  Badge, 
  SimpleGrid,
  Card,
  CardBody,
  Flex,
  useColorModeValue 
} from '@chakra-ui/react'
import { 
  RunningPageSpinner, 
  RunningCardSpinner, 
  RunningInlineSpinner,
  LoadingSpinner 
} from './LoadingSpinner'
import { RunningSpinner } from './RunningSpinner'

export function RunningSpinnerDemo() {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="lg" mb={2}>🏃‍♂️ Running Man Spinner Demo</Heading>
          <Text color="gray.500">
            Track & Field themed loading spinners for your application
          </Text>
          <Badge colorScheme="blue" mt={2}>
            Add sprite images to see animations
          </Badge>
        </Box>

        {/* Size Variants */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>Size Variants</Heading>
            <SimpleGrid columns={5} spacing={6} alignItems="center">
              <VStack spacing={2}>
                <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="xs" />
                </Box>
                <Text fontSize="sm">XS (32px)</Text>
              </VStack>
              <VStack spacing={2}>
                <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="sm" />
                </Box>
                <Text fontSize="sm">SM (48px)</Text>
              </VStack>
              <VStack spacing={2}>
                <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="md" />
                </Box>
                <Text fontSize="sm">MD (64px)</Text>
              </VStack>
              <VStack spacing={2}>
                <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="lg" />
                </Box>
                <Text fontSize="sm">LG (96px)</Text>
              </VStack>
              <VStack spacing={2}>
                <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="xl" />
                </Box>
                <Text fontSize="sm">XL (128px)</Text>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Speed Variants */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>Speed Variants</Heading>
            <SimpleGrid columns={3} spacing={6} alignItems="center">
              <VStack spacing={2}>
                <Box bg="white" p={6} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="lg" speed="1.2s" />
                </Box>
                <Text fontSize="sm">Slow (1.2s)</Text>
              </VStack>
              <VStack spacing={2}>
                <Box bg="white" p={6} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="lg" speed="0.8s" />
                </Box>
                <Text fontSize="sm">Normal (0.8s)</Text>
              </VStack>
              <VStack spacing={2}>
                <Box bg="white" p={6} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="lg" speed="0.6s" />
                </Box>
                <Text fontSize="sm">Fast (0.6s)</Text>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Theme Variants */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>Theme Variants</Heading>
            <SimpleGrid columns={3} spacing={6} alignItems="center">
              <VStack spacing={2}>
                <Box bg="white" p={6} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="lg" color="dark" />
                </Box>
                <Text fontSize="sm">Dark (black silhouette)</Text>
              </VStack>
              <VStack spacing={2}>
                <Box bg="gray.800" p={6} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="lg" color="light" />
                </Box>
                <Text fontSize="sm">Light (for dark backgrounds)</Text>
              </VStack>
              <VStack spacing={2}>
                <Box bg="white" p={6} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <RunningSpinner size="lg" color="auto" />
                </Box>
                <Text fontSize="sm">Auto (theme-aware)</Text>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Convenience Components */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>Convenience Components</Heading>
            <VStack spacing={6} align="stretch">
              
              {/* Page Spinner Demo */}
              <Box>
                <Text fontWeight="bold" mb={2}>RunningPageSpinner</Text>
                <Box h="200px" bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" position="relative">
                  <RunningPageSpinner />
                </Box>
              </Box>

              {/* Card Spinner Demo */}
              <Box>
                <Text fontWeight="bold" mb={2}>RunningCardSpinner</Text>
                <Card borderColor={borderColor} bg="white">
                  <CardBody>
                    <RunningCardSpinner />
                  </CardBody>
                </Card>
              </Box>

              {/* Inline Spinner Demo */}
              <Box>
                <Text fontWeight="bold" mb={2}>RunningInlineSpinner</Text>
                <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <Text>
                    Loading athlete data <RunningInlineSpinner size="sm" /> please wait...
                  </Text>
                </Box>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Comparison with Circular Spinner */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>Comparison: Running vs Circular</Heading>
            <SimpleGrid columns={2} spacing={8}>
              <VStack spacing={4}>
                <Text fontWeight="bold">🏃‍♂️ Running Man (Track Theme)</Text>
                <Box bg="white" p={8} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <LoadingSpinner variant="minimal" type="running" fullHeight={false} />
                </Box>
              </VStack>
              <VStack spacing={4}>
                <Text fontWeight="bold">⭕ Circular (Default)</Text>
                <Box bg="white" p={8} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <LoadingSpinner variant="minimal" type="circle" fullHeight={false} />
                </Box>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Usage Examples */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>Usage Examples</Heading>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={2}>Button with Running Spinner:</Text>
                <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <HStack>
                    <Text>Processing</Text>
                    <RunningSpinner size="sm" />
                  </HStack>
                </Box>
              </Box>
              
              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={2}>Status with Running Spinner:</Text>
                <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                  <Flex align="center" gap={2}>
                    <Text>Athletes loading</Text>
                    <RunningSpinner size="xs" speed="0.6s" />
                  </Flex>
                </Box>
              </Box>

              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={2}>Card Content Loading:</Text>
                <Card borderColor={borderColor} maxW="300px" bg="white">
                  <CardBody py={8}>
                    <RunningCardSpinner size="md" />
                  </CardBody>
                </Card>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Setup Instructions */}
        <Card bg={cardBg} borderColor="orange.200" borderWidth="2px">
          <CardBody>
            <Heading size="md" mb={4} color="orange.500">⚠️ Setup Required</Heading>
            <VStack spacing={3} align="start">
              <Text>
                To see the animations, add your sprite image to:
              </Text>
              <Box bg="gray.100" p={3} borderRadius="md" fontFamily="mono" fontSize="sm">
                <Text>public/images/running-man-sprite.png</Text>
              </Box>
              <Text fontSize="sm" color="gray.600">
                See <code>RunningSpinner.setup.md</code> for detailed instructions.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
} 