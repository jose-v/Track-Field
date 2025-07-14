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
import { FaPlay, FaRunning } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { useWeatherData } from '../hooks/useWeatherData';
import { MobileWeatherCard } from './MobileWeatherCard';
import { MobileSleepCard } from './MobileSleepCard';
import { MobileWellnessCard } from './MobileWellnessCard';
import { MobileEventCard } from './MobileEventCard';
import { MobileTodayCard } from './MobileTodayCard';

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
  
  // Weather data hook
  const { weather, forecast, isLoading: weatherLoading } = useWeatherData(
    profile?.city || "Greensboro",
    profile?.state || "North Carolina",
    {
      temp: "71", 
      condition: "Clouds",
      description: "scattered clouds"
    }
  );
  
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
      <VStack spacing={4} align="stretch">
        {/* Today Card - Full Width */}
        <Box>
          <MobileTodayCard 
            onStartWorkout={onStartWorkout}
            onMenuClick={() => console.log('Today menu clicked')}
          />
        </Box>

        {/* Weather Card - Full Width */}
        <Box>
          <MobileWeatherCard 
            city={profile?.city || "Greensboro"}
            state={profile?.state ? getStateAbbr(profile.state) : "NC"}
            weather={weather}
            forecast={forecast}
            isLoading={weatherLoading || profileLoading}
            onMenuClick={() => console.log('Weather menu clicked')}
          />
        </Box>

        {/* Sleep Card - Full Width */}
        <Box>
          <MobileSleepCard onLogComplete={onDataUpdate} />
        </Box>

        {/* Event Card - Full Width */}
        <Box>
          <MobileEventCard onEventClick={() => console.log('Event clicked')} />
        </Box>

        {/* Row 3: Full-width Wellness Card */}
        <Box>
          <MobileWellnessCard onLogComplete={onDataUpdate} />
        </Box>
      </VStack>
    </Box>
  );
}; 