import {
  Box,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  Button,
  Icon,
  HStack,
  Badge,
  ButtonGroup,
  Divider,
  VStack,
  SimpleGrid,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react'
import { CheckIcon } from '@chakra-ui/icons'
import { useState } from 'react'
import { FaCheckCircle } from 'react-icons/fa'

function Pricing() {
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const textColor = useColorModeValue('gray.800', 'white')
  const subtitleColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const accentCardBorder = useColorModeValue('blue.200', 'blue.500')
  
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual')
  
  // Pricing details based on billing cycle
  const individualPlanPrice = billingCycle === 'annual' ? '$6.67' : '$11.99'
  const individualPlanBilling = billingCycle === 'annual' 
    ? 'Billed at $79.99/year + tax'
    : 'Billed monthly + tax'
  
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
            >
              Choose Your Plan
            </Heading>
            <Text 
              color={subtitleColor}
              fontSize="xl"
              maxW="2xl"
              lineHeight="1.6"
            >
              Select the perfect plan for your track & field journey, whether you're an individual athlete or part of a team.
            </Text>
            
            {/* Billing Toggle */}
            <Box mt={8}>
              <ButtonGroup 
                size="md" 
                isAttached 
                variant="outline" 
                borderRadius="full" 
                overflow="hidden"
              >
                <Button 
                  borderRadius="full" 
                  colorScheme={billingCycle === 'annual' ? 'blue' : 'gray'}
                  bg={billingCycle === 'annual' ? 'blue.500' : undefined}
                  color={billingCycle === 'annual' ? 'white' : undefined}
                  fontWeight="medium"
                  px={8}
                  onClick={() => setBillingCycle('annual')}
                >
                  Annual
                </Button>
                <Button 
                  borderRadius="full" 
                  colorScheme={billingCycle === 'monthly' ? 'blue' : 'gray'}
                  bg={billingCycle === 'monthly' ? 'blue.500' : undefined}
                  color={billingCycle === 'monthly' ? 'white' : undefined}
                  fontWeight="medium"
                  px={8}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </Button>
              </ButtonGroup>
              {billingCycle === 'annual' && (
                <Text fontSize="sm" color="green.500" fontWeight="medium" mt={2}>
                  Save up to 44% with annual billing
                </Text>
              )}
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Pricing Plans Section */}
      <Box py={{ base: 12, md: 20 }} bg="#ecc94b">
        <Container maxW="container.lg">
          <SimpleGrid 
            columns={{ base: 1, lg: 3 }} 
            spacing={8}
            alignItems="stretch"
          >
            {/* Individual Plan */}
            <Box>
              <Box 
                bg={cardBg} 
                p={8} 
                rounded="xl" 
                borderWidth="1px"
                borderColor={borderColor}
                position="relative"
                transition="all 0.2s"
                height="full"
                display="flex"
                flexDirection="column"
                _hover={{ 
                  transform: "translateY(-5px)"
                }}
              >
                <VStack align="start" spacing={6} flex="1">
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color={subtitleColor} mb={1}>
                      INDIVIDUAL
                    </Text>
                    <Heading size="lg" color={textColor}>
                      Personal Plan
                    </Heading>
                  </Box>
                  
                  <Flex align="baseline">
                    <Heading size="3xl" fontWeight="bold">
                      {individualPlanPrice}
                    </Heading>
                    <Text fontSize="lg" fontWeight="medium" color={subtitleColor} ml={2}>
                      /mo
                    </Text>
                  </Flex>
                  
                  <Text fontSize="sm" color={subtitleColor}>
                    {individualPlanBilling}
                  </Text>
                  
                  <Divider borderColor={borderColor} />
                  
                  <List spacing={3} flex="1" alignSelf="stretch">
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      Performance analytics
                    </ListItem>
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      Personalized training plans
                    </ListItem>
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      Video analysis tools
                    </ListItem>
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      Competition tracking
                    </ListItem>
                  </List>
                </VStack>
                
                <Button
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  mt={8}
                  fontWeight="medium"
                  borderRadius="md"
                >
                  Start Free Trial
                </Button>
                <Text fontSize="xs" mt={2} textAlign="center" color={subtitleColor}>
                  30-day trial, no credit card required
                </Text>
              </Box>
            </Box>
            
            {/* Student Plan */}
            <Box>
              <Box 
                bg={cardBg} 
                p={8} 
                rounded="xl" 
                borderWidth="1px"
                borderColor={accentCardBorder}
                position="relative"
                transition="all 0.2s"
                height="full"
                display="flex"
                flexDirection="column"
                _hover={{ 
                  transform: "translateY(-5px)"
                }}
              >
                <Badge
                  position="absolute"
                  top="-12px"
                  left="50%"
                  transform="translateX(-50%)"
                  colorScheme="blue"
                  rounded="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                >
                  Most Popular
                </Badge>
                
                <VStack align="start" spacing={6} flex="1">
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color={subtitleColor} mb={1}>
                      STUDENT
                    </Text>
                    <Heading size="lg" color={textColor}>
                      Student Plan
                    </Heading>
                  </Box>
                  
                  <Flex align="baseline">
                    <Heading size="3xl" fontWeight="bold">
                      $3.33
                    </Heading>
                    <Text fontSize="lg" fontWeight="medium" color={subtitleColor} ml={2}>
                      /mo
                    </Text>
                  </Flex>
                  
                  <Text fontSize="sm" color={subtitleColor}>
                    Billed at $39.99/year + tax
                  </Text>
                  
                  <Divider borderColor={borderColor} />
                  
                  <List spacing={3} flex="1" alignSelf="stretch">
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      All features in Personal Plan
                    </ListItem>
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      50% discount with valid student ID
                    </ListItem>
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      Team collaboration tools
                    </ListItem>
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      Priority customer support
                    </ListItem>
                  </List>
                </VStack>
                
                <Button
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  mt={8}
                  fontWeight="medium"
                  borderRadius="md"
                >
                  Verify Student Status
                </Button>
                <Text fontSize="xs" mt={2} textAlign="center" color={subtitleColor}>
                  Requires verification with school email
                </Text>
              </Box>
            </Box>
            
            {/* Family Plan */}
            <Box>
              <Box 
                bg={cardBg} 
                p={8} 
                rounded="xl" 
                borderWidth="1px"
                borderColor={borderColor}
                position="relative"
                transition="all 0.2s"
                height="full"
                display="flex"
                flexDirection="column"
                _hover={{ 
                  transform: "translateY(-5px)"
                }}
              >
                <VStack align="start" spacing={6} flex="1">
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color={subtitleColor} mb={1}>
                      FAMILY
                    </Text>
                    <Heading size="lg" color={textColor}>
                      Family Plan
                    </Heading>
                  </Box>
                  
                  <Flex align="baseline">
                    <Heading size="3xl" fontWeight="bold">
                      $2.92
                    </Heading>
                    <Box ml={2}>
                      <Text fontSize="lg" fontWeight="medium" color={subtitleColor}>
                        /mo
                      </Text>
                      <Text fontSize="xs" color={subtitleColor} lineHeight="1">
                        per person
                      </Text>
                    </Box>
                  </Flex>
                  
                  <Text fontSize="sm" color={subtitleColor}>
                    Billed at $139.99/year for 4 members
                  </Text>
                  
                  <Divider borderColor={borderColor} />
                  
                  <List spacing={3} flex="1" alignSelf="stretch">
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      All features in Personal Plan
                    </ListItem>
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      Up to 4 family members
                    </ListItem>
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      Family activity dashboard
                    </ListItem>
                    <ListItem fontSize="sm" color={textColor}>
                      <ListIcon as={FaCheckCircle} color="green.500" />
                      Shared calendar & events
                    </ListItem>
                  </List>
                </VStack>
                
                <Button
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  mt={8}
                  fontWeight="medium"
                  borderRadius="md"
                >
                  Choose Family Plan
                </Button>
                <Text fontSize="xs" mt={2} textAlign="center" color={subtitleColor}>
                  30-day trial, invite family members anytime
                </Text>
              </Box>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={20} bg={cardBg}>
        <Container maxW="container.lg">
          <VStack spacing={12}>
            <Heading 
              textAlign="center" 
              size="xl" 
              color={textColor} 
              fontWeight="bold"
            >
              All Plans Include
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
              <VStack 
                p={6} 
                spacing={4} 
                align="start" 
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                bg={cardBg}
              >
                <Heading size="md" color={textColor}>
                  Mobile Access
                </Heading>
                <Text color={subtitleColor} fontSize="sm">
                  Track your workouts and progress from your smartphone, tablet, or computer.
                </Text>
              </VStack>
              
              <VStack 
                p={6} 
                spacing={4} 
                align="start" 
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                bg={cardBg}
              >
                <Heading size="md" color={textColor}>
                  Data Security
                </Heading>
                <Text color={subtitleColor} fontSize="sm">
                  Your information is always encrypted and secure with our state-of-the-art protection.
                </Text>
              </VStack>
              
              <VStack 
                p={6} 
                spacing={4} 
                align="start" 
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                bg={cardBg}
              >
                <Heading size="md" color={textColor}>
                  Cloud Storage
                </Heading>
                <Text color={subtitleColor} fontSize="sm">
                  All your training data, videos, and records are securely stored in the cloud.
                </Text>
              </VStack>
              
              <VStack 
                p={6} 
                spacing={4} 
                align="start" 
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                bg={cardBg}
              >
                <Heading size="md" color={textColor}>
                  24/7 Support
                </Heading>
                <Text color={subtitleColor} fontSize="sm">
                  Get assistance whenever you need it from our dedicated support team.
                </Text>
              </VStack>
            </SimpleGrid>
            
            <Box textAlign="center" mt={8}>
              <Text fontSize="sm" color={subtitleColor}>
                Need a custom solution for your team or organization?
              </Text>
              <Button 
                variant="link" 
                colorScheme="blue" 
                mt={2}
                fontWeight="medium"
              >
                Contact us for team pricing
              </Button>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

export { Pricing } 