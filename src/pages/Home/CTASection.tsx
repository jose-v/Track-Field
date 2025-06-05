import {
  Box,
  Stack,
  VStack,
  Heading,
  Text,
  Button,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaChevronRight, FaTrophy, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useProfileDisplay } from '../../hooks/useProfileDisplay';

const CTASection = () => {
  const { user } = useAuth();
  const { profile: displayProfile } = useProfileDisplay();

  // Get contextual heading and buttons based on user role
  const getContent = () => {
    // Default content for logged out users
    if (!user) {
      return {
        heading: "Ready to Transform Your Athletic Performance?",
        text: "Join thousands of athletes who are already breaking personal records with our platform.",
        button: (
          <Button
            as={RouterLink}
            to="/signup"
            size="lg"
            variant="solid"
            colorScheme="primary"
            px={10}
            py={7}
            fontSize="md"
            fontWeight="bold"
            borderRadius="md"
            rightIcon={<FaChevronRight />}
            transition="all 0.3s"
            className="btn-primary"
          >
            Start Your Free Trial
          </Button>
        )
      };
    }

    // For athletes
    if (displayProfile?.role === 'athlete') {
      return {
        heading: "Ready to Push Your Limits Today?",
        text: "Continue your training journey and set new personal records.",
        button: (
          <Button
            as={RouterLink}
            to="/athlete/calendar"
            size="lg"
            variant="solid"
            colorScheme="primary"
            px={10}
            py={7}
            fontSize="md"
            fontWeight="bold"
            borderRadius="md"
            rightIcon={<FaChartLine />}
            transition="all 0.3s"
            className="btn-primary"
          >
            View Training Schedule
          </Button>
        )
      };
    }

    // For coaches
    if (displayProfile?.role === 'coach') {
      return {
        heading: "Ready to Take Your Team to the Next Level?",
        text: "Access advanced coaching tools and track your athletes' progress.",
        button: (
          <Button
            as={RouterLink}
            to="/coach/stats"
            size="lg"
            variant="solid"
            colorScheme="primary"
            px={10}
            py={7}
            fontSize="md"
            fontWeight="bold"
            borderRadius="md"
            rightIcon={<FaTrophy />}
            transition="all 0.3s"
            className="btn-primary"
          >
            Track Team Progress
          </Button>
        )
      };
    }

    // Default fallback for other roles
    return {
      heading: "Continue Your Athletic Journey",
      text: "Return to your dashboard and keep making progress.",
      button: (
        <Button
          as={RouterLink}
          to="/dashboard"
          size="lg"
          variant="solid"
          colorScheme="primary"
          px={10}
          py={7}
          fontSize="md"
          fontWeight="bold"
          borderRadius="md"
          rightIcon={<FaChevronRight />}
          transition="all 0.3s"
          className="btn-primary"
        >
          Return to Dashboard
        </Button>
      )
    };
  };

  const content = getContent();

  return (
    <Box py={{ base: 16, md: 24 }} bg="accent.400" width="100vw">
      <Box maxW={{ base: "95%", md: "90%" }} mx="auto" px={{ base: 4, md: 8 }}>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={10} align="center" justify="space-between">
          <VStack spacing={4} align={{ base: 'center', md: 'start' }} maxW="600px">
            <Heading
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="bold"
              color="primary.500"
            >
              {content.heading}
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} color="whiteAlpha.900" maxW="2xl">
              {content.text}
            </Text>
          </VStack>
          {content.button}
        </Stack>
      </Box>
    </Box>
  );
};

export default CTASection;
