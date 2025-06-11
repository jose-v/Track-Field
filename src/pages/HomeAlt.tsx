import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Flex,
  Icon,
  Image,
  useColorModeValue,
  Stack,
  Avatar,
  Tag,
} from '@chakra-ui/react';
import { 
  FaArrowRight,
  FaQuoteLeft,
  FaChartLine,
  FaUsers,
  FaTrophy,
  FaLeaf
} from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

export default function HomeAlt() {
  /* Brand palette */
  const yellow = '#FFD204';
  const darkGreen = '#014B1F';
  const brightGreen = '#22B14C';
  const peach = '#FFF5EB';

  const cardBg = useColorModeValue('white', 'gray.700');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box>
      {/* ===== HERO ===== */}
      <Box bg={yellow} py={{ base: 24, md: 32 }}>
        <Container maxW="container.lg">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
            {/* Illustration */}
            <Image
              src="/images/hero-illustration.png"
              alt="Illustration"
              maxH="260px"
              objectFit="contain"
              fallbackSrc="https://via.placeholder.com/300x260"
            />
            {/* Text */}
            <VStack spacing={6} align="start">
              <Heading size="2xl" lineHeight="1.1">
                Elevate Your Athletic Potential
              </Heading>
              <Text fontSize="lg">
                Join the ultimate platform for track and field athletes. Track your progress, connect with coaches, and transform your training into championship performance.
              </Text>
              <Button
                as={RouterLink}
                to="/signup"
                size="lg"
                variant="solid"
                colorScheme="primary"
                rightIcon={<FaArrowRight />}
              >
                Get Started
              </Button>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* ===== MESSAGE STRIP ===== */}
      <Box py={{ base: 12, md: 20 }} bg={cardBg}>
        <Container maxW="container.lg">
          <Heading size="lg" textAlign="center">
            Your whole company must work together to find and implement the best solutions.
          </Heading>
        </Container>
      </Box>

      {/* ===== FEATURES ===== */}
      <Box py={{ base: 16, md: 24 }} bg={peach}>
        <Container maxW="container.lg">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            {[
              { icon: FaChartLine, title: 'Advanced Analytics', text: 'Track your performance metrics with intuitive visualizations. Identify trends and opportunities for improvement in your training.' },
              { icon: FaUsers, title: 'Expert Coaching', text: 'Connect directly with professional coaches who provide personalized feedback and customized training programs.' },
              { icon: FaTrophy, title: 'Competition Ready', text: 'Prepare for competitions with specialized training plans and performance tracking tools designed for peak performance.' },
            ].map((f) => (
              <VStack key={f.title} p={8} bg={cardBg} borderRadius="lg" spacing={4} align="start">
                <Flex w={12} h={12} align="center" justify="center" bg="accent.50" color="primary.500" rounded="md">
                  <Icon as={f.icon} boxSize={6} />
                </Flex>
                <Heading size="md">{f.title}</Heading>
                <Text color={textSecondary}>{f.text}</Text>
              </VStack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ===== TESTIMONIALS ===== */}
      <Box py={{ base: 20 }} bg={darkGreen} color="white">
        <Container maxW="container.lg">
          <VStack spacing={12}>
            <Heading textAlign="center" size="xl">
              Customer Testimonials
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
              {[{
                name: 'Michael Johnson',
                role: 'Sprinter',
                image: '/images/testimonial1.jpg',
                quote: 'The analytics helped me identify weaknesses in my sprint technique. After three months, I improved my 100m time by 0.5 seconds.'
              }, {
                name: 'Sarah Williams',
                role: 'High Jumper',
                image: '/images/testimonial2.jpg',
                quote: 'The connection with coaches has been invaluable. My technique has completely transformed thanks to the personalized feedback.'
              }, {
                name: 'David Rodriguez',
                role: 'Distance Runner',
                image: '/images/testimonial3.jpg',
                quote: 'The training plans are excellent. I\'ve been able to train more efficiently and reduce my marathon time by 12 minutes.'
              }].map((t) => (
                <VStack key={t.name} p={8} bg={cardBg} borderRadius="lg" spacing={6} align="start">
                  <Icon as={FaQuoteLeft} boxSize={6} color={yellow} />
                  <Text fontSize="lg" lineHeight="1.7">
                    "{t.quote}"
                  </Text>
                  <HStack spacing={4} pt={4}>
                    <Avatar src={t.image} name={t.name} />
                    <VStack spacing={0} align="start">
                      <Text fontWeight="bold">{t.name}</Text>
                      <Text fontSize="sm" color="whiteAlpha.700">{t.role}</Text>
                    </VStack>
                  </HStack>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* ===== CUSTOMERS LOGOS ===== */}
      <Box py={{ base: 16 }} bg={cardBg}>
        <Container maxW="container.lg">
          <VStack spacing={6}>
            <Heading size="lg">Rewrite Customers</Heading>
            <SimpleGrid columns={3} spacing={8} opacity={0.7}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Image key={i} src="/images/placeholder-logo.png" alt="Logo" fallbackSrc="https://via.placeholder.com/120x60" />
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* ===== PRICING ===== */}
      <Box py={{ base: 20 }} bg={brightGreen}>
        <Container maxW="container.lg">
          <VStack spacing={12}>
            <Heading size="xl" textAlign="center">
              Pricing
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
              {[
                { tier: 'Standard', price: '€30pp', features: ['Sustainability 101', 'Sustainability Plus'], cta: 'Buy Now' },
                { tier: 'Enterprise', price: 'Volume Pricing', features: ['Discounts 50+ users'], cta: 'Contact Us' },
                { tier: 'Bespoke', price: 'Custom', features: ['Tailored training', 'Align with strategy'], cta: 'Contact Us' },
              ].map((plan) => (
                <VStack key={plan.tier} p={8} bg={cardBg} borderRadius="lg" spacing={6} align="stretch">
                  <Heading size="md" textAlign="center">
                    {plan.tier}
                  </Heading>
                  <Text fontSize="3xl" fontWeight="bold" textAlign="center">
                    {plan.price}
                  </Text>
                  <VStack spacing={2} align="start">
                    {plan.features.map((feat) => (
                      <HStack key={feat} spacing={2}>
                        <Tag size="sm" colorScheme="whiteAlpha" bg="whiteAlpha.300" color="white">
                          ✓
                        </Tag>
                        <Text color="white">{feat}</Text>
                      </HStack>
                    ))}
                  </VStack>
                  <Button mt={2} as={RouterLink} to="#" colorScheme="whiteAlpha" variant="outline" _hover={{ bg: 'whiteAlpha.200' }}>
                    {plan.cta}
                  </Button>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* ===== INVESTIGATE SECTION ===== */}
      <Box py={{ base: 20 }} bg={yellow}>
        <Container maxW="container.lg">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
            <VStack align="start" spacing={4}>
              <Icon as={FaLeaf} boxSize={10} />
              <Heading size="lg">What does carbon have to do with climate change?</Heading>
            </VStack>
            <Image src="/images/placeholder-learn.png" alt="Investigate" fallbackSrc="https://via.placeholder.com/300x200" />
          </SimpleGrid>
        </Container>
      </Box>

      {/* ===== FOOTER CTA ===== */}
      <Box bg={yellow} py={{ base: 16, md: 20 }} textAlign="center">
        <Container maxW="container.md">
          <Heading size="xl">Ready to Transform Your Athletic Performance?</Heading>
          <Text fontSize="lg" mt={2}>
            Join thousands of athletes who are already breaking personal records with our platform.
          </Text>
          <Button as={RouterLink} to="/signup" size="lg" mt={6} variant="solid" colorScheme="primary">
            Start Your Free Trial
          </Button>
        </Container>
      </Box>
    </Box>
  );
} 