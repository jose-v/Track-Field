import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
  Badge,
  chakra,
  Spinner,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { Link as RouterLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaChevronRight, FaRunning, FaUsers, FaClipboardList, FaCalendarAlt, FaTrophy } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

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
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  
  // State for contextual statistics
  const [upcomingMeets, setUpcomingMeets] = useState<any[]>([]);
  const [athleteCount, setAthleteCount] = useState<number | null>(null);
  const [coachCount, setCoachCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prevIndex) => (prevIndex + 1) % rotatingWords.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Fetch contextual statistics based on user role
  useEffect(() => {
    if (!user) {
      // For logged-out users, fetch global statistics
      fetchGlobalStats();
    } else if (profile?.role === 'coach') {
      // For coaches, fetch their athletes and upcoming meets
      fetchCoachStats();
    } else if (profile?.role === 'athlete') {
      // For athletes, fetch their upcoming meets and personal stats
      fetchAthleteStats();
    }
  }, [user, profile]);

  // Fetch global user statistics for logged-out users
  const fetchGlobalStats = async () => {
    try {
      setStatsLoading(true);
      
      // Count athletes
      const { count: athleteCount, error: athleteError } = await supabase
        .from('athletes')
        .select('*', { count: 'exact', head: true });
        
      if (athleteError) throw athleteError;
      
      // Count coaches
      const { count: coachCount, error: coachError } = await supabase
        .from('coaches')
        .select('*', { count: 'exact', head: true });
        
      if (coachError) throw coachError;
      
      setAthleteCount(athleteCount);
      setCoachCount(coachCount);
    } catch (error) {
      console.error('Error fetching global stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch coach-specific statistics
  const fetchCoachStats = async () => {
    try {
      setStatsLoading(true);
      
      // Count athletes coached by this coach
      const { count: athleteCount, error: athleteError } = await supabase
        .from('coach_athletes')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', user?.id);
        
      if (athleteError) throw athleteError;
      
      // Fetch upcoming meets for this coach
      const today = new Date().toISOString().split('T')[0];
      const { data: meets, error: meetsError } = await supabase
        .from('track_meets')
        .select('*')
        .eq('coach_id', user?.id)
        .gte('meet_date', today)
        .order('meet_date', { ascending: true })
        .limit(3);
        
      if (meetsError) throw meetsError;
      
      setAthleteCount(athleteCount);
      setUpcomingMeets(meets || []);
    } catch (error) {
      console.error('Error fetching coach stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch athlete-specific statistics
  const fetchAthleteStats = async () => {
    try {
      setStatsLoading(true);
      
      // Get the coaches for this athlete
      const { count: coachCount, error: coachError } = await supabase
        .from('coach_athletes')
        .select('*', { count: 'exact', head: true })
        .eq('athlete_id', user?.id);
        
      if (coachError) throw coachError;
      
      // Find upcoming meets for this athlete through their coaches
      const today = new Date().toISOString().split('T')[0];
      
      // First get the athlete's coaches
      const { data: coachData, error: coachDataError } = await supabase
        .from('coach_athletes')
        .select('coach_id')
        .eq('athlete_id', user?.id);
      
      if (coachDataError) throw coachDataError;
      
      if (coachData && coachData.length > 0) {
        // Then get meets created by those coaches
        const coachIds = coachData.map((c: any) => c.coach_id);
        
        const { data: meets, error: meetsError } = await supabase
          .from('track_meets')
          .select('*')
          .in('coach_id', coachIds)
          .gte('meet_date', today)
          .order('meet_date', { ascending: true })
          .limit(3);
        
        if (meetsError) throw meetsError;
        
        setUpcomingMeets(meets || []);
      }
      
      setCoachCount(coachCount);
    } catch (error) {
      console.error('Error fetching athlete stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

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

  // Define contextual action buttons based on user role
  const getActionButtons = () => {
    // For logged out users, show standard signup/login
    if (!user) {
      return (
        <>
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
        </>
      );
    }

    // For athletes, show workout and stats focused actions
    if (profile?.role === 'athlete') {
      return (
        <>
          <Button
            className="btn-primary"
            as={RouterLink}
            to="/athlete/dashboard"
            size="lg"
            variant="solid"
            colorScheme="primary"
            px={8}
            fontSize="md"
            fontWeight="medium"
            borderRadius="md"
            rightIcon={<FaRunning />}
            transition="all 0.3s"
          >
            Continue Training
          </Button>
          <Button
            className="btn-accent"
            as={RouterLink}
            to="/athlete/workouts"
            size="lg"
            variant="accent"
            px={8}
            fontSize="md"
            fontWeight="medium"
            borderRadius="md"
            rightIcon={<FaClipboardList />}
            transition="all 0.3s"
          >
            View Workouts
          </Button>
        </>
      );
    }

    // For coaches, show athlete and team management actions
    if (profile?.role === 'coach') {
      return (
        <>
          <Button
            className="btn-primary"
            as={RouterLink}
            to="/coach/dashboard"
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
            Coach Dashboard
          </Button>
          <Button
            className="btn-accent"
            as={RouterLink}
            to="/coach/athletes"
            size="lg"
            variant="accent"
            px={8}
            fontSize="md"
            fontWeight="medium"
            borderRadius="md"
            rightIcon={<FaUsers />}
            transition="all 0.3s"
          >
            Manage Athletes
          </Button>
        </>
      );
    }

    // Default buttons for any other role or if role is loading
    return (
      <>
        <Button
          className="btn-primary"
          as={RouterLink}
          to="/dashboard"
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
          Go to Dashboard
        </Button>
      </>
    );
  };

  // Render contextual statistics based on user role
  const renderContextualStats = () => {
    if (statsLoading) {
      return (
        <Flex justify="center" align="center" p={4}>
          <Spinner color="white" size="lg" />
        </Flex>
      );
    }

    // For logged-out users, show global stats
    if (!user) {
      return (
        <>
          <Box bg="whiteAlpha.200" px={6} py={3} borderRadius="lg" minW="180px">
            <Text fontSize="xl" fontWeight="bold" color="white">
              {athleteCount ? `${athleteCount.toLocaleString()}+ Athletes` : '5,000+ Athletes'}
            </Text>
          </Box>
          <Box bg="whiteAlpha.200" px={6} py={3} borderRadius="lg" minW="180px">
            <Text fontSize="xl" fontWeight="bold" color="white">
              {coachCount ? `${coachCount.toLocaleString()}+ Coaches` : '200+ Coaches'}
            </Text>
          </Box>
        </>
      );
    }

    // For coaches, show athlete count and upcoming meets
    if (profile?.role === 'coach') {
      return (
        <>
          <Box bg="whiteAlpha.200" px={6} py={3} borderRadius="lg" minW="180px">
            <Flex align="center" justify="center" mb={1}>
              <FaUsers color="white" style={{ marginRight: '8px' }} />
              <Text fontSize="lg" fontWeight="bold" color="white">
                {athleteCount !== null ? `${athleteCount} Athletes` : 'No Athletes Yet'}
              </Text>
            </Flex>
            <Text fontSize="xs" color="gray.300">
              {athleteCount === 0 ? 'Add athletes to your team' : 'On your team'}
            </Text>
          </Box>
          <Box bg="whiteAlpha.200" px={6} py={3} borderRadius="lg" minW="220px">
            <Flex align="center" justify="center" mb={1}>
              <FaCalendarAlt color="white" style={{ marginRight: '8px' }} />
              <Text fontSize="lg" fontWeight="bold" color="white">
                {upcomingMeets.length > 0 
                  ? `${upcomingMeets.length} Upcoming ${upcomingMeets.length === 1 ? 'Meet' : 'Meets'}` 
                  : 'No Upcoming Meets'}
              </Text>
            </Flex>
            {upcomingMeets.length > 0 && (
              <Text fontSize="xs" color="gray.300">
                Next: {format(new Date(upcomingMeets[0].meet_date), 'MMM d, yyyy')}
              </Text>
            )}
          </Box>
        </>
      );
    }

    // For athletes, show coach count and upcoming meets
    if (profile?.role === 'athlete') {
      return (
        <>
          <Box bg="whiteAlpha.200" px={6} py={3} borderRadius="lg" minW="180px">
            <Flex align="center" justify="center" mb={1}>
              <FaUsers color="white" style={{ marginRight: '8px' }} />
              <Text fontSize="lg" fontWeight="bold" color="white">
                {coachCount !== null ? `${coachCount} ${coachCount === 1 ? 'Coach' : 'Coaches'}` : 'No Coach Yet'}
              </Text>
            </Flex>
            <Text fontSize="xs" color="gray.300">
              {coachCount === 0 ? 'Find coaches to join' : 'Working with you'}
            </Text>
          </Box>
          <Box bg="whiteAlpha.200" px={6} py={3} borderRadius="lg" minW="220px">
            <Flex align="center" justify="center" mb={1}>
              <FaTrophy color="white" style={{ marginRight: '8px' }} />
              <Text fontSize="lg" fontWeight="bold" color="white">
                {upcomingMeets.length > 0 
                  ? `${upcomingMeets.length} Upcoming ${upcomingMeets.length === 1 ? 'Meet' : 'Meets'}` 
                  : 'No Upcoming Meets'}
              </Text>
            </Flex>
            {upcomingMeets.length > 0 && (
              <Text fontSize="xs" color="gray.300">
                Next: {format(new Date(upcomingMeets[0].meet_date), 'MMM d, yyyy')}
              </Text>
            )}
          </Box>
        </>
      );
    }

    // Default fallback
    return (
      <>
        <Box bg="whiteAlpha.200" px={6} py={3} borderRadius="lg" minW="180px">
          <Text fontSize="xl" fontWeight="bold" color="white">
            Track & Field
          </Text>
        </Box>
        <Box bg="whiteAlpha.200" px={6} py={3} borderRadius="lg" minW="180px">
          <Text fontSize="xl" fontWeight="bold" color="white">
            Platform
          </Text>
        </Box>
      </>
    );
  };

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
              {user 
                ? `Welcome back${profile?.first_name ? `, ${profile.first_name}` : ''}! Continue your journey to athletic excellence.`
                : 'Join the ultimate platform for track and field athletes. Track your progress, connect with coaches, and transform your training into championship performance.'}
            </Text>
            <Stack 
              direction={{ base: 'column', sm: 'row' }} 
              spacing={4}
              animation={`${fadeIn} 1s ease-out 0.6s forwards`}
              opacity="0"
              pt={4}
            >
              {getActionButtons()}
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
              {renderContextualStats()}
            </Stack>
          </Stack>
        </Flex>
      </Box>
    </Box>
  );
};

export default HeroSection;
