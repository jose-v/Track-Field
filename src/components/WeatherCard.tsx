import {
  Box,
  Card,
  CardBody,
  Flex,
  Icon,
  Tag,
  Text,
  VStack,
  HStack,
  Skeleton,
  useToast,
  useColorModeValue,
  Button,
  Divider,
  SimpleGrid,
  IconButton,
  Tooltip
} from '@chakra-ui/react'
import { FaCloudSun, FaCloudRain, FaSnowflake, FaSun, FaCloudMeatball, FaBolt, FaMapMarkerAlt, FaCalendarDay, FaChevronRight, FaThermometerHalf } from 'react-icons/fa'
import React, { useState, useEffect } from 'react'

// OpenWeather API configuration
const OPENWEATHER_API_KEY = 'd52188171339c7c268d503e4e1122c12'
// Using the One Call API 3.0 endpoint format
const OPENWEATHER_API_ONECALL = 'https://api.openweathermap.org/data/3.0/onecall'

interface ForecastDay {
  date: string;
  dayName: string;
  high: number;
  low: number;
  condition: string;
  description: string;
  icon: string;
  rainProbability: number; // Rain probability as percentage
}

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
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [hasError, setHasError] = useState(false)
  const [showForecast, setShowForecast] = useState(false)
  const [isCelsius, setIsCelsius] = useState(false) // Temperature unit toggle
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

  // Helper function to convert Fahrenheit to Celsius
  const convertTemp = (tempF: number): number => {
    return isCelsius ? Math.round((tempF - 32) * 5/9) : Math.round(tempF);
  };

  // Helper function to get temperature display
  const getTempDisplay = (temp: string | number): string => {
    const tempNum = typeof temp === 'string' ? parseFloat(temp) : temp;
    return `${convertTemp(tempNum)}°${isCelsius ? 'C' : 'F'}`;
  };

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

  // Helper function to get rain probability color
  const getRainColor = (probability: number) => {
    if (probability >= 70) return 'blue.600';
    if (probability >= 40) return 'blue.500';
    if (probability >= 20) return 'blue.400';
    return 'gray.400';
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
        
        // Set current weather
        setWeather({
          temp: Math.round(data.current.temp).toString(),
          condition: data.current.weather[0].main,
          description: data.current.weather[0].description
        });
        
        // Process forecast data (next 5 days)
        if (data.daily && data.daily.length > 0) {
          const forecastData = data.daily.slice(0, 5).map((day: any, index: number) => {
            const date = new Date(day.dt * 1000);
            return {
              date: date.toISOString().split('T')[0],
              dayName: index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
              high: Math.round(day.temp.max),
              low: Math.round(day.temp.min),
              condition: day.weather[0].main,
              description: day.weather[0].description,
              icon: day.weather[0].icon,
              rainProbability: Math.round((day.pop || 0) * 100) // Convert to percentage
            };
          });
          setForecast(forecastData);
        }
        
        console.log('Weather and forecast fetched successfully for', city);
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
      <Box position="relative">
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
            h={{ base: "100px", md: "120px" }} 
            bg={headerGradient}
            position="relative"
            overflow="hidden"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            px={6}
          >
            {/* Weather Icon - Left aligned */}
            <Box display="flex" alignItems="center" justifyContent="flex-start">
              <Icon 
                as={WeatherIcon} 
                color="white" 
                boxSize={{ base: 14, md: 20 }}
              />
            </Box>
            
            {/* Weather Text Content - Right aligned */}
            <Box textAlign="right">
              <Text 
                fontSize={{ base: "md", md: "xl" }} 
                fontWeight="medium" 
                textAlign="right" 
                mb={-1}
              >
                {weather.condition}
              </Text>
              <Text 
                fontSize={{ base: "2xl", md: "4xl" }} 
                fontWeight="bold" 
                textAlign="right" 
                lineHeight="1"
              >
                {getTempDisplay(weather.temp)}
              </Text>
              <Flex direction="column" mt={1} alignItems="flex-end">
                <Text 
                  fontWeight="medium" 
                  fontSize={{ base: "xs", md: "sm" }}
                  textAlign="right"
                >
                  {location}
                </Text>
                <Text 
                  mt={1} 
                  color="blackAlpha.800" 
                  fontSize={{ base: "xs", md: "sm" }} 
                  textAlign="right"
                >
                  {dateStr}
                </Text>
              </Flex>
            </Box>
          </Box>

          {/* Forecast Toggle Button */}
          {forecast.length > 0 && (
            <CardBody pt={4} pb={4}>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={
                  <Tooltip label={`Switch to ${isCelsius ? 'Fahrenheit' : 'Celsius'}`}>
                    <Box
                      as="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCelsius(!isCelsius);
                      }}
                      p={1}
                      borderRadius="md"
                      _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                      transition="background 0.2s"
                    >
                      <Icon as={FaThermometerHalf} />
                    </Box>
                  </Tooltip>
                }
                rightIcon={<Icon as={FaChevronRight} transform={showForecast ? 'rotate(90deg)' : 'rotate(0deg)'} transition="transform 0.2s" />}
                onClick={() => setShowForecast(!showForecast)}
                width="full"
                justifyContent="space-between"
                fontWeight="medium"
                color={textColor}
                _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
              >
                {showForecast ? 'Hide Forecast' : '5-Day Forecast'}
              </Button>
            </CardBody>
          )}
        </Card>

        {/* Floating Forecast Overlay */}
        {forecast.length > 0 && showForecast && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            zIndex={1000}
            mt={2}
          >
            <Card
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="1px"
              borderRadius="lg"
              boxShadow={useColorModeValue('lg', 'dark-lg')}
              overflow="hidden"
            >
              <CardBody p={4}>
                {/* Forecast Header */}
                <HStack justify="space-between" mb={3} fontSize="xs" fontWeight="bold" color={subtitleColor} textTransform="uppercase">
                  <Text flex={1}>Day</Text>
                  <Text textAlign="center" minW="60px">Rain</Text>
                  <VStack spacing={0} minW="80px">
                    <HStack spacing={4}>
                      <Text fontSize="xs">Max</Text>
                      <Text fontSize="xs">Min</Text>
                    </HStack>
                  </VStack>
                </HStack>
                <Divider mb={3} />
                
                <VStack spacing={3} align="stretch">
                  {forecast.map((day, index) => (
                    <HStack key={day.date} justify="space-between" py={2}>
                      {/* Day and Weather Info */}
                      <HStack spacing={3} flex={1}>
                        <Icon 
                          as={getWeatherIcon(day.condition)} 
                          boxSize={5} 
                          color={useColorModeValue('gray.600', 'gray.400')}
                        />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium" color={textColor}>
                            {day.dayName}
                          </Text>
                          <Text fontSize="xs" color={subtitleColor} textTransform="capitalize">
                            {day.description}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      {/* Rain Probability */}
                      <Box textAlign="center" minW="60px">
                        <Text 
                          fontSize="sm" 
                          fontWeight="medium" 
                          color={getRainColor(day.rainProbability)}
                        >
                          {day.rainProbability}%
                        </Text>
                      </Box>
                      
                      {/* Temperature Range */}
                      <HStack spacing={4} justify="flex-end" minW="80px">
                        <Text fontSize="sm" fontWeight="bold" color={textColor}>
                          {getTempDisplay(day.high)}
                        </Text>
                        <Text fontSize="sm" color={subtitleColor}>
                          {getTempDisplay(day.low)}
                        </Text>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </Box>
        )}

        {/* Backdrop overlay to close forecast when clicking outside */}
        {showForecast && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={999}
            onClick={() => setShowForecast(false)}
          />
        )}
      </Box>
    </Skeleton>
  )
}

export default WeatherCard 