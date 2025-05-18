import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
  Badge,
  chakra,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaChevronRight } from 'react-icons/fa';

const HeroSection = () => {
  // Use theme accent color
  const accentColor = 'var(--accent)';
  // List of words for the rotating animation
  const rotatingWords = [
    "Athletic",
    "Running", 
    "Sprinting", 
    "Racing",
    "Winning",
    "Elite"
  ];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prevIndex) => (prevIndex + 1) % rotatingWords.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Animation keyframes
  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  `;
  const wordChange = keyframes`
    0% { opacity: 0; transform: translateY(10px); }
    20% { opacity: 1; transform: translateY(0); }
    80% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  `;
  const fadeInAnimation = `${fadeIn} 1s ease-out forwards`;
  const wordChangeAnimation = `${wordChange} 2s infinite`;

  return (
    <Box w="100vw" maxW="100vw" overflowX="hidden" position="relative">
      {/* Hero Section - Full viewport, no margin or padding, behind navbar */}
      <Box 
        position="relative"
        minH="100vh"
        width="100vw"
      >
        {/* Background Image with Overlay */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          backgroundImage="url('/images/hero-image.jpg')"
          backgroundSize="cover"
          backgroundPosition="center"
          zIndex={0}
          _after={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: 'blackAlpha.600',
            zIndex: 1
          }}
        />
        <Flex
          position="relative"
          zIndex={2}
          minH="100vh"
          direction="column"
          align="center"
          justify="center"
          maxW={{ base: "95%", md: "90%" }}
          mx="auto"
          textAlign="center"
          width="100%"
          pb="65px"
        >
          <Stack 
            spacing={{ base: 6, md: 8 }}
            maxW={{ base: "100%", md: "80%" }}
            align="center"
          >
            <Badge 
              colorScheme="blue" 
              fontSize="sm" 
              px={3} 
              py={1} 
              borderRadius="full"
              animation={fadeInAnimation}
            >
              TRACK & FIELD EXCELLENCE
            </Badge>
            <Heading
              as="h1"
              fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
              fontWeight="bold"
              lineHeight="1.1"
              color="white"
              animation={fadeInAnimation}
              display="flex"
              flexWrap="wrap"
              justifyContent="center"
              textAlign="center"
              alignItems="center"
            >
              <Box as="span" whiteSpace="nowrap" mr={2}>Elevate Your</Box>
              <Box
                position="relative" 
                height={{ base: "70px", md: "90px", lg: "110px" }}
                width={{ base: "200px", md: "240px" }}
                mx={2}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
              >
                {rotatingWords.map((word, index) => (
                  <chakra.span
                    key={index}
                    position="absolute"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    width="100%"
                    height="100%"
                    color={accentColor}
                    fontWeight="bold"
                    opacity={wordIndex === index ? 1 : 0}
                    animation={wordIndex === index ? wordChangeAnimation : undefined}
                    transition="opacity 0.5s ease"
                    fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
                  >
                    {word}
                  </chakra.span>
                ))}
              </Box>
              <Box as="span" whiteSpace="nowrap" ml={2}>Potential</Box>
            </Heading>
            <Text 
              fontSize={{ base: "lg", md: "xl" }} 
              color="gray.200"
              animation={`${fadeIn} 1s ease-out 0.3s forwards`}
              opacity="0"
              lineHeight="1.8"
            >
              Join the ultimate platform for track and field athletes. Track your progress, connect with coaches, and transform your training into championship performance.
            </Text>
            <Stack 
              direction={{ base: 'column', sm: 'row' }} 
              spacing={4}
              animation={`${fadeIn} 1s ease-out 0.6s forwards`}
              opacity="0"
              pt={4}
            >
              <Button
                className="btn-primary"
                as={RouterLink}
                to="/signup"
                size="lg"
                variant="solid"
                colorScheme="primary"
                px={8}
                fontSize="md"
                fontWeight="medium"
                borderRadius="md"
                rightIcon={<FaChevronRight />}
                transition="all 0.3s"
              >
                Get Started
              </Button>
              <Button
                className="btn-accent"
                as={RouterLink}
                to="/login"
                size="lg"
                variant="accent"
                px={8}
                fontSize="md"
                fontWeight="medium"
                borderRadius="md"
                transition="all 0.3s"
              >
                Log In
              </Button>
            </Stack>
            <Stack 
              spacing={8} 
              direction={{ base: 'column', md: 'row' }} 
              pt={8} 
              animation={`${fadeIn} 1s ease-out 0.9s forwards`} 
              opacity="0"
              justify="center"
              width="100%"
            >
              <Box bg="whiteAlpha.200" px={6} py={3} borderRadius="lg" minW="180px">
                <Text fontSize="xl" fontWeight="bold" color="white">
                  5,000+ Athletes
                </Text>
              </Box>
              <Box bg="whiteAlpha.200" px={6} py={3} borderRadius="lg" minW="180px">
                <Text fontSize="xl" fontWeight="bold" color="white">
                  200+ Coaches
                </Text>
              </Box>
            </Stack>
          </Stack>
        </Flex>
      </Box>
    </Box>
  );
};

export default HeroSection;
