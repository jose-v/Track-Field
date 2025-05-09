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
} from '@chakra-ui/react'
import { CheckIcon } from '@chakra-ui/icons'
import { useState } from 'react'

function Pricing() {
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const cardBg = useColorModeValue('white', 'gray.800')
  const blackCardBg = useColorModeValue('gray.900', 'gray.900')
  const blackCardColor = 'white'
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual')
  
  // Pricing details based on billing cycle
  const individualPlanPrice = billingCycle === 'annual' ? '$6.67' : '$11.99'
  const individualPlanBilling = billingCycle === 'annual' 
    ? 'Billed at $79.99/year + tax'
    : 'Billed monthly + tax'
  
  return (
    <Box w="100%">
      {/* Hero Section */}
      <Box bg={useColorModeValue('blue.50', 'blue.900')} py={20} w="100%">
        <Box w="100%" px={8}>
          <Stack spacing={8} align="center" textAlign="center">
            <Heading size="2xl">Pricing Plans</Heading>
            <Text fontSize="xl" maxW="3xl" color={textColor}>
              Choose a plan that fits your needs - whether you're an individual athlete or a coach managing a team.
            </Text>
          </Stack>
        </Box>
      </Box>

      {/* Pricing Plans Section */}
      <Box py={20} w="100%">
        <Box w="100%" px={8}>
          <Flex 
            direction={{ base: 'column', lg: 'row' }} 
            gap={6} 
            align="stretch"
            justify="center"
            maxW="1200px"
            mx="auto"
          >
            {/* Individual Plan */}
            <Box 
              flex={1} 
              bg={blackCardBg} 
              p={6} 
              rounded="md" 
              shadow="xl"
              color={blackCardColor}
              position="relative"
              maxW={{ base: "100%", lg: "33%" }}
              borderWidth="1px"
              borderColor="gray.700"
              transition="transform 0.2s"
              _hover={{ transform: "translateY(-5px)" }}
            >
              <Badge 
                colorScheme="blue" 
                position="absolute" 
                top={4} 
                left={4}
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
                fontWeight="bold"
              >
                Save 44%
              </Badge>
              
              <Heading size="md" mb={4} mt={4} textAlign="center">Individual Plan</Heading>
              
              <ButtonGroup 
                size="sm" 
                isAttached 
                variant="outline" 
                w="full" 
                borderRadius="full" 
                mb={4}
                bg="whiteAlpha.200"
                p={1}
              >
                <Button 
                  borderRadius="full" 
                  colorScheme={billingCycle === 'annual' ? 'blue' : undefined}
                  bg={billingCycle === 'annual' ? 'blue.500' : 'transparent'}
                  color={billingCycle === 'annual' ? 'white' : 'gray.200'}
                  borderWidth={0}
                  flex={1}
                  onClick={() => setBillingCycle('annual')}
                >
                  Annual
                </Button>
                <Button 
                  borderRadius="full" 
                  colorScheme={billingCycle === 'monthly' ? 'blue' : undefined}
                  bg={billingCycle === 'monthly' ? 'blue.500' : 'transparent'}
                  color={billingCycle === 'monthly' ? 'white' : 'gray.200'}
                  borderWidth={0}
                  flex={1}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </Button>
              </ButtonGroup>
              
              <Box textAlign="center" mb={6}>
                <HStack justify="center" spacing={1}>
                  <Text fontSize="3xl" fontWeight="bold">{individualPlanPrice}</Text>
                  <Text fontSize="md" color="gray.300">/month</Text>
                </HStack>
              </Box>
              
              <Divider borderColor="whiteAlpha.300" mb={6} />
              
              <Stack spacing={2} mb={6}>
                <Text fontSize="sm" textAlign="center">30-day trial for $0</Text>
                <Text fontSize="sm" textAlign="center">{individualPlanBilling}</Text>
              </Stack>
              
              <Button colorScheme="blue" size="lg" width="full" borderRadius="md">
                Try it free
              </Button>
            </Box>

            {/* Student Plan */}
            <Box 
              flex={1} 
              bg={cardBg} 
              p={6} 
              rounded="md" 
              shadow="md"
              borderWidth="1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              position="relative"
              maxW={{ base: "100%", lg: "33%" }}
              transition="transform 0.2s"
              _hover={{ transform: "translateY(-5px)" }}
            >
              <Badge 
                colorScheme="blue" 
                position="absolute" 
                top={4} 
                left={4}
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
                fontWeight="bold"
                color="gray.800"
              >
                50% Off (Verified Students)
              </Badge>
              
              <Heading size="md" mb={4} mt={4} textAlign="center">Student Plan</Heading>
              
              <Box h="42px" mb={4} /> {/* Spacer for where toggle would be */}
              
              <Box textAlign="center" mb={6}>
                <HStack justify="center" spacing={1}>
                  <Text fontSize="3xl" fontWeight="bold">$3.33</Text>
                  <Text fontSize="md" color={textColor}>/month</Text>
                </HStack>
              </Box>
              
              <Divider borderColor={useColorModeValue('gray.200', 'gray.700')} mb={6} />
              
              <Stack spacing={2} mb={6}>
                <Text fontSize="sm" textAlign="center">30-day trial for $0</Text>
                <Text fontSize="sm" textAlign="center">Billed at $39.99/year + tax</Text>
              </Stack>
              
              <Button colorScheme="blue" size="lg" width="full" borderRadius="md">
                Try it free
              </Button>
            </Box>

            {/* Family Plan */}
            <Box 
              flex={1} 
              bg={cardBg} 
              p={6} 
              rounded="md" 
              shadow="md"
              borderWidth="1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              position="relative"
              maxW={{ base: "100%", lg: "33%" }}
              transition="transform 0.2s"
              _hover={{ transform: "translateY(-5px)" }}
            >
              <Badge 
                colorScheme="blue" 
                position="absolute" 
                top={4} 
                left={4}
                borderRadius="full"
                px={2}
                py={1}
                fontSize="xs"
                fontWeight="bold"
                color="gray.800"
              >
                4 Accounts
              </Badge>
              
              <Heading size="md" mb={4} mt={4} textAlign="center">Family Plan</Heading>
              
              <Box h="42px" mb={4} /> {/* Spacer for where toggle would be */}
              
              <Box textAlign="center" mb={6}>
                <HStack justify="center" alignItems="baseline" spacing={1}>
                  <Text fontSize="3xl" fontWeight="bold">$2.92</Text>
                  <Stack spacing={0} alignItems="start">
                    <Text fontSize="sm" color={textColor}>/mo.</Text>
                    <Text fontSize="xs" color={textColor}>per person*</Text>
                  </Stack>
                </HStack>
              </Box>
              
              <Divider borderColor={useColorModeValue('gray.200', 'gray.700')} mb={6} />
              
              <Stack spacing={2} mb={6}>
                <Text fontSize="sm" textAlign="center">*Price reflects plans with 4 members</Text>
                <Text fontSize="sm" textAlign="center">Billed at $139.99/year + tax</Text>
              </Stack>
              
              <Button colorScheme="blue" size="lg" width="full" borderRadius="md">
                Choose plan
              </Button>
            </Box>
          </Flex>

          {/* Features Section */}
          <Box mt={20}>
            <Heading size="lg" mb={8} textAlign="center">
              All Plans Include
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
                borderWidth="1px"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
              >
                <Heading size="md" mb={4}>
                  Mobile Access
                </Heading>
                <Text color={textColor}>
                  Track your workouts and progress from your smartphone, tablet, or computer.
                </Text>
              </Box>
              <Box
                bg={useColorModeValue('white', 'gray.800')}
                p={6}
                rounded="lg"
                shadow="md"
                flex={1}
                borderWidth="1px"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
              >
                <Heading size="md" mb={4}>
                  Data Security
                </Heading>
                <Text color={textColor}>
                  Your information is always encrypted and secure with our state-of-the-art protection.
                </Text>
              </Box>
              <Box
                bg={useColorModeValue('white', 'gray.800')}
                p={6}
                rounded="lg"
                shadow="md"
                flex={1}
                borderWidth="1px"
                borderColor={useColorModeValue('gray.200', 'gray.700')}
              >
                <Heading size="md" mb={4}>
                  Regular Updates
                </Heading>
                <Text color={textColor}>
                  We constantly improve our platform with new features based on user feedback.
                </Text>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export { Pricing } 