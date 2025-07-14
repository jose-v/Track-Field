import React from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Circle,
  useColorModeValue,
  Card,
  CardBody,
  Flex,
} from '@chakra-ui/react';
import { FaPlay, FaRunning, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { WeatherCard } from './WeatherCard';
import { MobileSleepCard } from './MobileSleepCard';
import { WellnessQuickLogCard } from './WellnessQuickLogCard';

interface MobileAthleteDashboardProps {
  onStartWorkout?: () => void;
  onDataUpdate?: () => void;
}

export const MobileAthleteDashboard: React.FC<MobileAthleteDashboardProps> = ({
  onStartWorkout,
  onDataUpdate
}) => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.800', 'gray.100');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');

  const getStateAbbr = (state: string): string => {
    const stateMap: { [key: string]: string } = {
      'North Carolina': 'NC',
      'South Carolina': 'SC',
      'Virginia': 'VA',
      'Georgia': 'GA',
      'Florida': 'FL',
      'Tennessee': 'TN',
      'Alabama': 'AL',
      'Mississippi': 'MS',
      'Louisiana': 'LA',
      'Texas': 'TX',
      'Arkansas': 'AR',
      'Oklahoma': 'OK',
      'Kansas': 'KS',
      'Missouri': 'MO',
      'Iowa': 'IA',
      'Nebraska': 'NE',
      'South Dakota': 'SD',
      'North Dakota': 'ND',
      'Minnesota': 'MN',
      'Wisconsin': 'WI',
      'Illinois': 'IL',
      'Indiana': 'IN',
      'Ohio': 'OH',
      'Michigan': 'MI',
      'Kentucky': 'KY',
      'West Virginia': 'WV',
      'Maryland': 'MD',
      'Delaware': 'DE',
      'Pennsylvania': 'PA',
      'New Jersey': 'NJ',
      'New York': 'NY',
      'Connecticut': 'CT',
      'Rhode Island': 'RI',
      'Massachusetts': 'MA',
      'Vermont': 'VT',
      'New Hampshire': 'NH',
      'Maine': 'ME',
      'Washington': 'WA',
      'Oregon': 'OR',
      'California': 'CA',
      'Nevada': 'NV',
      'Idaho': 'ID',
      'Montana': 'MT',
      'Wyoming': 'WY',
      'Utah': 'UT',
      'Colorado': 'CO',
      'Arizona': 'AZ',
      'New Mexico': 'NM',
      'Alaska': 'AK',
      'Hawaii': 'HI'
    };
    return stateMap[state] || state;
  };

  // Mock upcoming event data - in production this would come from your API
  const upcomingEvent = {
    date: 'Jul, 28 2025',
    title: '2025 AAU Junior Olympics'
  };

  return (
    <Box
      bg={bgColor}
      minH="100vh"
      px={4}
      py={6}
      w="100%"
      maxW="100%"
      overflowX="hidden"
    >
      <VStack spacing={6} align="stretch">
        {/* Row 1: Start Button and Weather */}
        <SimpleGrid columns={2} spacing={4}>
          {/* Start Button Card */}
          <Card
            bg={cardBg}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="lg"
            cursor="pointer"
            onClick={onStartWorkout}
            _hover={{ transform: 'translateY(-2px)' }}
            transition="all 0.2s"
            aspectRatio="1"
          >
            <CardBody
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              position="relative"
            >
              <Icon as={FaRunning} boxSize={8} color="gray.400" position="absolute" top={4} left={4} />
              <Circle
                size="80px"
                bg="green.500"
                color="white"
                _hover={{ bg: 'green.600' }}
                transition="all 0.2s"
              >
                <Text fontSize="xl" fontWeight="bold">
                  Start
                </Text>
              </Circle>
              <Box position="absolute" bottom={4} right={4}>
                <Icon as={FaPlay} boxSize={3} color="gray.400" />
              </Box>
            </CardBody>
          </Card>

          {/* Weather Card */}
          <Box>
            <WeatherCard 
              city={profile?.city || "Greensboro"}
              state={profile?.state ? getStateAbbr(profile.state) : "NC"}
              weather={{
                temp: "71", 
                condition: "Clouds",
                description: "scattered clouds"
              }}
              isLoading={profileLoading}
            />
          </Box>
        </SimpleGrid>

        {/* Row 2: Sleep and Event Cards */}
        <SimpleGrid columns={2} spacing={4}>
          {/* Sleep Card */}
          <Box>
            <MobileSleepCard onLogComplete={onDataUpdate} />
          </Box>

          {/* Event Card */}
          <Card
            bg={cardBg}
            borderRadius="xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="lg"
            aspectRatio="1"
          >
            <CardBody
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              position="relative"
            >
              <Icon as={FaCalendarAlt} boxSize={8} color="gray.400" position="absolute" top={4} left={4} />
              
              <VStack spacing={2} align="center">
                <Text fontSize="lg" fontWeight="bold" color={textPrimary}>
                  {upcomingEvent.date}
                </Text>
                <Text fontSize="sm" color={textSecondary} textAlign="center" px={2}>
                  {upcomingEvent.title}
                </Text>
              </VStack>
              
              <Box position="absolute" bottom={4} right={4}>
                <Icon as={FaMapMarkerAlt} boxSize={3} color="gray.400" />
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Row 3: Full-width Wellness Card */}
        <Box>
          <WellnessQuickLogCard onLogComplete={onDataUpdate} />
        </Box>
      </VStack>
    </Box>
  );
}; 