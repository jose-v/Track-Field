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
  useToast
} from '@chakra-ui/react'
import { FaCloudSun, FaCloudRain, FaSnowflake, FaSun, FaCloudMeatball, FaBolt } from 'react-icons/fa'
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
}

// Cache for coordinates to avoid multiple geocoding requests
const cityCoordinatesCache: Record<string, {lat: number, lon: number}> = {};

export const WeatherCard: React.FC<WeatherCardProps> = ({ 
  city, 
  state, 
  weather: initialWeather, 
  isLoading: initialLoading 
}) => {
  const [weather, setWeather] = useState(initialWeather)
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [hasError, setHasError] = useState(false)
  const toast = useToast()

  // Helper function to get the appropriate weather icon based on condition code
  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase()
    
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return FaCloudRain
    } else if (conditionLower.includes('snow')) {
      return FaSnowflake
    } else if (conditionLower.includes('clear')) {
      return FaSun
    } else if (conditionLower.includes('cloud')) {
      return FaCloudSun
    } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
      return FaBolt
    } else {
      return FaCloudMeatball // Default for fog, mist, etc.
    }
  }

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
  
  return (
    <Card 
      borderRadius="lg" 
      overflow="hidden" 
      boxShadow="md"
      height="100%"
    >
      {/* Weather Card Header */}
      <Box 
        h="80px" 
        bg="linear-gradient(135deg, #DD6B20 0%, #F6AD55 100%)" 
        position="relative"
        display="flex"
        alignItems="center"
        px={6}
      >
        <Flex 
          bg="white" 
          borderRadius="full" 
          w="50px" 
          h="50px" 
          justifyContent="center" 
          alignItems="center"
          boxShadow="none"
          mr={4}
        >
          <Icon as={WeatherIcon} w={6} h={6} color="orange.500" />
        </Flex>
        <Tag
          size="lg"
          variant="subtle"
          bg="whiteAlpha.300"
          color="white"
          fontWeight="bold"
          px={4}
          py={2}
          borderRadius="md"
        >
          WEATHER
        </Tag>
      </Box>
      <CardBody>
        <Skeleton isLoaded={!isLoading} fadeDuration={1}>
          <VStack spacing={1}>
            <Text fontSize="lg">{city || 'Location not set'}{state ? `, ${state}` : ''}</Text>
            <Text fontSize="4xl" fontWeight="bold">{weather.temp}°F</Text>
            <Text color="gray.600">{weather.condition}</Text>
            <Text fontSize="sm" color="gray.500">
              {hasError ? 'Weather data unavailable' : weather.description}
            </Text>
          </VStack>
        </Skeleton>
      </CardBody>
    </Card>
  )
}

export default WeatherCard 