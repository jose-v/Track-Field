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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
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

interface HourlyForecast {
  time: string;
  hour: string;
  temp: number;
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
  hourlyForecast?: HourlyForecast[];
  isLoading: boolean;
  fixedDate?: string;
  onMenuClick?: () => void;
}

export const MobileWeatherCard: React.FC<MobileWeatherCardProps> = ({ 
  city, 
  state, 
  weather, 
  forecast = [],
  hourlyForecast = [],
  isLoading,
  fixedDate,
  onMenuClick
}) => {
  const [isForecastOpen, setIsForecastOpen] = useState(false);
  const [isCelsius, setIsCelsius] = useState(false);
  const [tabIndex, setTabIndex] = useState(0); // <-- Add tab index state at top level
  // Move all useColorModeValue calls to the top level
  const tabBarBg = useColorModeValue('gray.100', 'gray.700');
  const tabActiveBg = useColorModeValue('blue.500', 'blue.600');
  const tabInactiveBg = 'transparent';
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
                Weather Forecast
              </Button>
            </CardBody>
          )}
        </Card>

        {/* Three dots menu - opens forecast drawer */}
        <IconButton
          icon={<BsThreeDots />}
          w="38px"
          h="38px"
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
            maxH="75vh"
            minH="440px" // Match 5-day panel height to prevent layout shift
            borderTop="1px solid"
            borderColor={drawerBorder}
          >
            <DrawerHeader>
              <Text fontSize="lg" fontWeight="semibold" color={drawerText}>
                5-Day Forecast
              </Text>
              <DrawerCloseButton />
            </DrawerHeader>
            
            <DrawerBody pb={8} overflowY="auto">
              {/* Custom tab bar matching SleepAnalysisDrawer */}
              {(hourlyForecast.length > 0 || forecast.length > 0) && (
                <Box mb={4}>
                  <HStack spacing={0} bg={tabBarBg} borderRadius="lg" p={1} h="44px" minH="44px" maxH="44px">
                    <Button
                      size="sm"
                      variant={tabIndex === 0 ? 'solid' : 'ghost'}
                      bg={tabIndex === 0 ? tabActiveBg : tabInactiveBg}
                      color={tabIndex === 0 ? 'white' : drawerText}
                      borderRadius="md"
                      flex={1}
                      h="44px"
                      minH="44px"
                      maxH="44px"
                      fontWeight="bold"
                      fontSize="md"
                      onClick={() => setTabIndex(0)}
                      _hover={{ bg: tabIndex === 0 ? tabActiveBg : tabInactiveBg }}
                    >
                      24-hr
                    </Button>
                    <Button
                      size="sm"
                      variant={tabIndex === 1 ? 'solid' : 'ghost'}
                      bg={tabIndex === 1 ? tabActiveBg : tabInactiveBg}
                      color={tabIndex === 1 ? 'white' : drawerText}
                      borderRadius="md"
                      flex={1}
                      h="44px"
                      minH="44px"
                      maxH="44px"
                      fontWeight="bold"
                      fontSize="md"
                      onClick={() => setTabIndex(1)}
                      _hover={{ bg: tabIndex === 1 ? tabActiveBg : tabInactiveBg }}
                    >
                      5-day
                    </Button>
                  </HStack>
                </Box>
              )}
              {/* Tab Panels */}
              {tabIndex === 0 ? (
                <Box minH="360px" maxH="360px" pt={2} display="flex" flexDirection="column">
                  {hourlyForecast.length > 0 ? (
                    <VStack spacing={2} align="stretch" flex="1" overflowY="auto">
                      <HStack justify="space-between" mb={3} fontSize="xs" fontWeight="bold" color={drawerText} textTransform="uppercase">
                        <Text flex={1}>Time</Text>
                        <Text textAlign="center" minW="60px">Rain</Text>
                        <Text textAlign="center" minW="60px">Temp</Text>
                      </HStack>
                      <Divider mb={3} />
                      {hourlyForecast.slice(0, 24).map((hour, index) => (
                        <HStack key={hour.time} justify="space-between" py={2}>
                          {/* Time and Weather Info */}
                          <HStack spacing={3} flex={1}>
                            <Icon 
                              as={getWeatherIcon(hour.condition)} 
                              boxSize={4} 
                              color={drawerText}
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium" color={drawerText}>
                                {hour.hour}
                              </Text>
                              <Text fontSize="xs" color={drawerText} opacity={0.7} textTransform="capitalize">
                                {hour.description}
                              </Text>
                            </VStack>
                          </HStack>
                          {/* Rain Probability */}
                          <Box textAlign="center" minW="60px">
                            <Text 
                              fontSize="sm" 
                              fontWeight="medium" 
                              color={getRainColor(hour.rainProbability)}
                            >
                              {hour.rainProbability}%
                            </Text>
                          </Box>
                          {/* Temperature */}
                          <Box textAlign="center" minW="60px">
                            <Text fontSize="sm" fontWeight="bold" color={drawerText}>
                              {getTempDisplay(hour.temp)}
                            </Text>
                          </Box>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text color={drawerText} textAlign="center" mt={8}>No data</Text>
                  )}
                </Box>
              ) : (
                <Box minH="360px" maxH="360px" pt={2}>
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
                </Box>
              )}
              {/* End custom tab panels */}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
    </Skeleton>
  );
}; 