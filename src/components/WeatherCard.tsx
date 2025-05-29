import {
  Box,
  Card,
  CardBody,
  Flex,
  Icon,
  Tag,
  Text,
  VStack,
  Skeleton,
  useToast,
  useColorModeValue
} from '@chakra-ui/react'
import { FaCloudSun, FaCloudRain, FaSnowflake, FaSun, FaCloudMeatball, FaBolt, FaMapMarkerAlt } from 'react-icons/fa'
import React, { useState, useEffect } from 'react'

// OpenWeather API configuration
const OPENWEATHER_API_KEY = 'd52188171339c7c268d503e4e1122c12'
// Using the One Call API 3.0 endpoint format
const OPENWEATHER_API_ONECALL = 'https://api.openweathermap.org/data/3.0/onecall'

interface WeatherCardProps {
  city?: string;
  state?: string;
  weather: {
    temp: string;
    condition: string;
    description: string;
  };
  isLoading: boolean;
  fixedDate?: string; // For testing or demos
}

// Cache for coordinates to avoid multiple geocoding requests
const cityCoordinatesCache: Record<string, {lat: number, lon: number}> = {};

export const WeatherCard: React.FC<WeatherCardProps> = ({ 
  city, 
  state, 
  weather: initialWeather, 
  isLoading: initialLoading,
  fixedDate
}) => {
  const [weather, setWeather] = useState(initialWeather)
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [hasError, setHasError] = useState(false)
  const toast = useToast()

  const headerGradient = useColorModeValue(
    'linear-gradient(135deg, #F6AD55 0%, #FBD38D 100%)',
    'linear-gradient(135deg, #7B341E 0%, #DD6B20 100%)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const cardShadow = useColorModeValue('none', 'md');

  // Helper function to get the appropriate weather icon based on condition code
  const getWeatherIcon = (condition: string) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle')) return FaCloudRain;
    if (c.includes('snow')) return FaSnowflake;
    if (c.includes('clear')) return FaSun;
    if (c.includes('cloud')) return FaCloudSun;
    if (c.includes('thunder') || c.includes('storm')) return FaBolt;
    return FaCloudMeatball;
  };

  // Helper function to get coordinates for a city
  const getCoordinates = async (city: string, state?: string) => {
    const locationKey = `${city},${state || ''}`;
    
    // Return cached coordinates if available
    if (cityCoordinatesCache[locationKey]) {
      return cityCoordinatesCache[locationKey];
    }
    
    // For Greensboro, North Carolina - hardcoded coordinates
    if (city.toLowerCase() === 'greensboro' && state?.toLowerCase() === 'north carolina') {
      const coords = { lat: 36.0726, lon: -79.7920 };
      cityCoordinatesCache[locationKey] = coords;
      return coords;
    }
    
    // For geocoding other cities, we would need to make a call to the geocoding API
    // This is a simplified version - in production you might want to use the OpenWeatherMap Geocoding API
    try {
      const geocodingUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}${state ? `,${state}` : ''},us&limit=1&appid=${OPENWEATHER_API_KEY}`;
      const response = await fetch(geocodingUrl);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error(`No coordinates found for ${city}, ${state || ''}`);
      }
      
      const coords = { lat: data[0].lat, lon: data[0].lon };
      cityCoordinatesCache[locationKey] = coords;
      return coords;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      throw error;
    }
  };

  // Fetch real weather data when city or state changes
  useEffect(() => {
    if (!city) return;
    
    const fetchRealWeather = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        // Check if API key is available
        if (!OPENWEATHER_API_KEY) {
          console.warn('OpenWeather API key is missing. Weather data will not be fetched.');
          setHasError(true);
          return;
        }
        
        // Get coordinates for the city
        const { lat, lon } = await getCoordinates(city, state);
        
        // Format the One Call API 3.0 URL as shown in the documentation
        const url = `${OPENWEATHER_API_ONECALL}?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`;
        
        console.log(`Fetching weather for ${city}, ${state || ''} at coordinates lat=${lat}, lon=${lon}...`);
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Weather API error (${response.status}):`, errorData);
          
          if (response.status === 401) {
            throw new Error(`Invalid API key. Please check your One Call API 3.0 subscription.`);
          } else {
            throw new Error(`Weather API error: ${response.status}`);
          }
        }
        
        const data = await response.json();
        
        // One Call API 3.0 returns data in a different format
        setWeather({
          temp: Math.round(data.current.temp).toString(),
          condition: data.current.weather[0].main,
          description: data.current.weather[0].description
        });
        
        console.log('Weather fetched successfully for', city);
      } catch (error) {
        console.error('Error fetching weather:', error);
        setHasError(true);
        
        // Show toast only in development environment
        if (process.env.NODE_ENV === 'development') {
          toast({
            title: 'Weather data unavailable',
            description: error instanceof Error ? error.message : 'Unknown error',
            status: 'warning',
            duration: 5000,
            isClosable: true
          });
        }
        // Keep using the passed weather data if API fails
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have a city
    if (city) {
      fetchRealWeather();
    }
  }, [city, state, toast])

  const WeatherIcon = getWeatherIcon(weather.condition)
  
  // Format the date - use fixedDate if provided (for testing), otherwise use today's date
  const today = new Date();
  const dateStr = fixedDate || today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const location = state ? `${city}, ${state}` : city;

  return (
    <Skeleton isLoaded={!isLoading}>
      <Card 
        borderRadius="lg" 
        overflow="hidden" 
        boxShadow={cardShadow}
        bg={cardBg}
        borderColor={borderColor}
        m={0}
        p={0}
      >
        <Box
          h="120px" 
          bg={headerGradient}
          position="relative"
          overflow="hidden"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Flex width="100%" justifyContent="center" alignItems="center" p={0}>
          <Box display="flex" alignItems="center" justifyContent="center" mr={8}>
            <Icon as={WeatherIcon} color="white" boxSize={90} />
          </Box>
            <Box p={0} m={0}>
            <Text fontSize="xl" fontWeight="medium" textAlign="center" mb={-1}>{weather.condition}</Text>
            <Text fontSize="4xl" fontWeight="bold" textAlign="center" lineHeight="1">{weather.temp}°</Text>
            <Flex direction="column" mt={1} alignItems="center">
              <Flex alignItems="center" justifyContent="center">
                <Icon as={FaMapMarkerAlt} color="blackAlpha.800" mr={1} />
                <Text fontWeight="medium" fontSize="sm">{location}</Text>
              </Flex>
              <Text mt={1} color="blackAlpha.800" fontSize="sm" textAlign="center">
                {dateStr}
              </Text>
            </Flex>
          </Box>
        </Flex>
      </Box>
      </Card>
    </Skeleton>
  )
}

export default WeatherCard 