import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  Flex,
  Icon,
  Text,
  VStack,
  HStack,
  Skeleton,
  Button,
  Divider,
  useColorModeValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  IconButton,
} from '@chakra-ui/react';
import { FaCloudSun, FaCloudRain, FaSnowflake, FaSun, FaCloudMeatball, FaBolt, FaThermometerHalf } from 'react-icons/fa';
import { BsThreeDots } from 'react-icons/bs';

interface ForecastDay {
  date: string;
  dayName: string;
  high: number;
  low: number;
  condition: string;
  description: string;
  icon: string;
  rainProbability: number;
}

interface MobileWeatherCardProps {
  city?: string;
  state?: string;
  weather: {
    temp: string;
    condition: string;
    description: string;
  };
  forecast?: ForecastDay[];
  isLoading: boolean;
  fixedDate?: string;
  onMenuClick?: () => void;
}

export const MobileWeatherCard: React.FC<MobileWeatherCardProps> = ({ 
  city, 
  state, 
  weather, 
  forecast = [],
  isLoading,
  fixedDate,
  onMenuClick
}) => {
  const [isForecastOpen, setIsForecastOpen] = useState(false);
  const [isCelsius, setIsCelsius] = useState(false);

  // Dark theme colors to match other mobile cards
  const cardBg = 'gray.800';
  const textColor = 'white';
  const subtitleColor = 'gray.300';
  const badgeBg = 'gray.600';
  const iconColor = 'white';
  
  // Drawer colors
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');
  const drawerText = useColorModeValue('gray.700', 'gray.200');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');

  // Helper function to convert Fahrenheit to Celsius
  const convertTemp = (tempF: number): number => {
    return isCelsius ? Math.round((tempF - 32) * 5/9) : Math.round(tempF);
  };

  // Helper function to get temperature display
  const getTempDisplay = (temp: string | number): string => {
    const tempNum = typeof temp === 'string' ? parseFloat(temp) : temp;
    return `${convertTemp(tempNum)}°${isCelsius ? 'C' : 'F'}`;
  };

  // Helper function to get the appropriate weather icon
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
    if (probability >= 70) return 'blue.400';
    if (probability >= 40) return 'blue.300';
    if (probability >= 20) return 'blue.200';
    return 'gray.400';
  };

  const WeatherIcon = getWeatherIcon(weather.condition);
  
  // Format the date
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
          bg={cardBg}
          borderRadius="xl"
          overflow="hidden"
          boxShadow="lg"
          p={0}
          m={0}
        >
          {/* Weather Header */}
          <Box
            h="120px"
            bg="linear-gradient(135deg, #7B341E 0%, #DD6B20 100%)"
            position="relative"
            overflow="hidden"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            px={6}
          >
            {/* Weather Icon - Left */}
            <Box display="flex" alignItems="center" justifyContent="flex-start">
              <Icon 
                as={WeatherIcon} 
                color="white" 
                boxSize={16}
              />
            </Box>
            
            {/* Weather Info - Right */}
            <Box textAlign="right">
              <Text 
                fontSize="lg" 
                fontWeight="medium" 
                textAlign="right" 
                mb={-1}
                color="white"
              >
                {weather.condition}
              </Text>
              <Text 
                fontSize="3xl" 
                fontWeight="bold" 
                textAlign="right" 
                lineHeight="1"
                color="white"
              >
                {getTempDisplay(weather.temp)}
              </Text>
              <Flex direction="column" mt={1} alignItems="flex-end">
                <Text 
                  fontWeight="medium" 
                  fontSize="sm"
                  textAlign="right"
                  color="white"
                >
                  {location}
                </Text>
                <Text 
                  mt={1} 
                  color="blackAlpha.800" 
                  fontSize="sm" 
                  textAlign="right"
                >
                  {dateStr}
                </Text>
              </Flex>
            </Box>
          </Box>

          {/* Forecast Button */}
          {forecast.length > 0 && (
            <CardBody pt={4} pb={4}>
              <Button
                size="md"
                variant="ghost"
                leftIcon={<Icon as={FaThermometerHalf} onClick={(e) => {
                  e.stopPropagation();
                  setIsCelsius(!isCelsius);
                }} />}
                width="full"
                justifyContent="flex-start"
                fontWeight="medium"
                color={textColor}
                cursor="default"
                _hover={{}}
                _active={{}}
              >
                5-Day Forecast
              </Button>
            </CardBody>
          )}
        </Card>

        {/* Three dots menu - opens forecast drawer */}
        <IconButton
          icon={<BsThreeDots />}
          size="sm"
          variant="ghost"
          color={textColor}
          position="absolute"
          bottom={4}
          right={4}
          onClick={() => setIsForecastOpen(true)}
          _hover={{ bg: 'gray.700' }}
          aria-label="Open forecast"
        />

        {/* Forecast Drawer */}
        <Drawer
          isOpen={isForecastOpen}
          onClose={() => setIsForecastOpen(false)}
          placement="bottom"
          size="sm"
        >
          <DrawerOverlay />
          <DrawerContent
            bg={drawerBg}
            borderTopRadius="xl"
            borderBottomRadius="none"
            maxH="50vh"
            borderTop="1px solid"
            borderColor={drawerBorder}
          >
            <DrawerHeader>
              <Text fontSize="lg" fontWeight="semibold" color={drawerText}>
                5-Day Forecast
              </Text>
              <DrawerCloseButton />
            </DrawerHeader>
            
            <DrawerBody pb={6}>
              {/* Forecast Header */}
              <HStack justify="space-between" mb={3} fontSize="xs" fontWeight="bold" color={drawerText} textTransform="uppercase">
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
                        color={drawerText}
                      />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium" color={drawerText}>
                          {day.dayName}
                        </Text>
                        <Text fontSize="xs" color={drawerText} opacity={0.7} textTransform="capitalize">
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
                      <Text fontSize="sm" fontWeight="bold" color={drawerText}>
                        {getTempDisplay(day.high)}
                      </Text>
                      <Text fontSize="sm" color={drawerText} opacity={0.7}>
                        {getTempDisplay(day.low)}
                      </Text>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
    </Skeleton>
  );
}; 