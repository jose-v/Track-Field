import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Card,
  Flex,
  Icon,
  useColorModeValue,
  SimpleGrid,
  Container,
  Divider,
  ButtonGroup,
  Button,
  Image,
  Tag,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FaCalendarAlt, FaMapMarkerAlt, FaRunning, FaTrophy, FaMedal, FaFlag, FaUniversity, FaUserGraduate } from 'react-icons/fa';
import { useState } from 'react';

// Data for upcoming track and field events
const upcomingEvents = [
  {
    id: 1,
    title: 'New Balance Nationals Indoor',
    date: '2025-03-13',
    endDate: '2025-03-16',
    location: 'The TRACK at New Balance, Boston, MA',
    description: 'Premier high school indoor national championship featuring the top athletes from across the country.',
    type: 'National',
    category: 'High School',
    image: 'https://images.pexels.com/photos/3764014/pexels-photo-3764014.jpeg',
    featured: true,
  },
  {
    id: 2,
    title: 'Penn Relays',
    date: '2025-04-24',
    endDate: '2025-04-26',
    location: 'Franklin Field, University of Pennsylvania, Philadelphia, PA',
    description: 'The oldest and largest track and field competition in the United States, showcasing high school, collegiate, and professional athletes.',
    type: 'Relays',
    category: 'Multi-Level',
    image: 'https://images.pexels.com/photos/3621187/pexels-photo-3621187.jpeg',
    featured: true,
  },
  {
    id: 3,
    title: 'Oregon Relays',
    date: '2025-04-04',
    endDate: '2025-04-05',
    location: 'Hayward Field, Eugene, OR',
    description: 'Historic relay meet at the renowned Hayward Field featuring elite collegiate competition.',
    type: 'Relays',
    category: 'Collegiate',
    image: 'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg',
    featured: false,
  },
  {
    id: 4,
    title: 'Oregon Open',
    date: '2025-04-18',
    endDate: '2025-04-19',
    location: 'Hayward Field, Eugene, OR',
    description: 'Open competition at the legendary Hayward Field, "The Carnegie Hall of Track and Field."',
    type: 'Open',
    category: 'Multi-Level',
    image: 'https://images.pexels.com/photos/3912954/pexels-photo-3912954.jpeg',
    featured: false,
  },
  {
    id: 5,
    title: 'USATF 25 km Championships',
    date: '2025-05-10',
    location: 'Grand Rapids, MI',
    description: 'National championship road race featuring elite American distance runners competing for the national title.',
    type: 'Championship',
    category: 'Professional',
    image: 'https://images.pexels.com/photos/2526878/pexels-photo-2526878.jpeg',
    featured: false,
  },
  {
    id: 6,
    title: 'USATF Throws Festival',
    date: '2025-05-24',
    location: 'Tucson, AZ',
    description: 'Premier event for American throwers featuring competitions in discus, javelin, hammer, and shot put.',
    type: 'Championship',
    category: 'Professional',
    image: 'https://images.pexels.com/photos/3766210/pexels-photo-3766210.jpeg',
    featured: false,
  },
  {
    id: 7,
    title: 'NCAA Division I Outdoor Track & Field Championships',
    date: '2025-06-11',
    endDate: '2025-06-14',
    location: 'Hayward Field, Eugene, OR',
    description: 'The pinnacle of collegiate track and field where the nation\'s best student-athletes compete for national titles.',
    type: 'Championship',
    category: 'Collegiate',
    image: 'https://images.pexels.com/photos/163444/sport-treadmill-tor-route-163444.jpeg',
    featured: true,
  },
  {
    id: 8,
    title: 'New Balance Nationals Outdoor',
    date: '2025-06-19',
    endDate: '2025-06-22',
    location: 'Franklin Field, Philadelphia, PA',
    description: 'The premier outdoor high school national championship that crowns All-Americans and national champions.',
    type: 'National',
    category: 'High School',
    image: 'https://images.pexels.com/photos/3764082/pexels-photo-3764082.jpeg',
    featured: false,
  },
  {
    id: 9,
    title: 'Prefontaine Classic',
    date: '2025-07-05',
    location: 'Hayward Field, Eugene, OR',
    description: 'America\'s premier invitational track meet, featuring Olympic and World Champions in a Diamond League stop.',
    type: 'Diamond League',
    category: 'Professional',
    image: 'https://images.pexels.com/photos/3621121/pexels-photo-3621121.jpeg',
    featured: true,
  },
  {
    id: 10,
    title: 'USA Outdoor Track & Field Championships',
    date: '2025-07-31',
    endDate: '2025-08-03',
    location: 'Hayward Field, Eugene, OR',
    description: 'The national championships for USA Track & Field, determining the best track and field athletes in the country.',
    type: 'Championship',
    category: 'Professional',
    image: 'https://images.pexels.com/photos/3764011/pexels-photo-3764011.jpeg',
    featured: true,
  },
];

// Function to format date strings
const formatDate = (dateString: string, endDateString?: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
  };
  
  const startDate = new Date(dateString).toLocaleDateString('en-US', options);
  
  if (endDateString) {
    const endDate = new Date(endDateString).toLocaleDateString('en-US', options);
    return `${startDate} – ${endDate}`;
  }
  
  return startDate;
};

// Get badge color based on event type
const getBadgeColor = (eventType: string) => {
  const colors: Record<string, string> = {
    'Championship': 'red',
    'Diamond League': 'purple',
    'National': 'blue',
    'Relays': 'green',
    'Open': 'orange',
  };
  return colors[eventType] || 'gray';
};

// Get icon based on event type
const getEventIcon = (eventType: string) => {
  const icons: Record<string, any> = {
    'Championship': FaMedal,
    'Diamond League': FaTrophy,
    'National': FaFlag,
    'Relays': FaRunning,
    'Open': FaRunning,
  };
  return icons[eventType] || FaCalendarAlt;
};

// Get category icon
const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    'Professional': FaRunning,
    'Collegiate': FaUniversity,
    'High School': FaUserGraduate,
    'Multi-Level': FaRunning,
  };
  return icons[category] || FaRunning;
};

export function Meets() {
  const [filter, setFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.800');
  const lightBg = useColorModeValue('gray.50', 'gray.800');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  
  // Hero image size based on screen size
  const heroHeight = useBreakpointValue({ base: '200px', md: '250px', lg: '280px' });
  const heroWidth = useBreakpointValue({ base: '100%', md: '45%' });
  const cardHeight = useBreakpointValue({ base: '180px', md: '200px' });
  
  // Filter events based on selected type and category
  const filteredEvents = upcomingEvents.filter(event => {
    if (filter && categoryFilter) {
      return event.type === filter && event.category === categoryFilter;
    } else if (filter) {
      return event.type === filter;
    } else if (categoryFilter) {
      return event.category === categoryFilter;
    }
    return true;
  });
  
  // Get unique event types and categories for filters
  const eventTypes = Array.from(new Set(upcomingEvents.map(event => event.type)));
  const eventCategories = Array.from(new Set(upcomingEvents.map(event => event.category)));

  // Featured events for hero section
  const featuredEvents = upcomingEvents.filter(event => event.featured);

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Hero Section */}
      <Box 
        py={{ base: 16, md: 24 }}
        bg={cardBg}
      >
        <Container maxW="container.lg" position="relative" zIndex={1}>
          <VStack spacing={6} align="center" textAlign="center">
            <Heading 
              as="h1"
              size="2xl" 
              color={headingColor}
              fontWeight="bold"
              lineHeight="1.2"
            >
              Track & Field Meets
            </Heading>
            <Text 
              fontSize="xl"
              color={subtitleColor} 
              maxW="2xl"
              lineHeight="1.6"
            >
              Discover upcoming track and field meets across the United States
            </Text>
          </VStack>
          
          {featuredEvents.length > 0 && (
            <Box mt={{ base: 12, md: 16 }}>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                {featuredEvents.slice(0, 2).map((event) => (
                  <Card 
                    key={event.id}
                    direction={{ base: 'column', md: 'row' }}
                    overflow='hidden'
                    borderRadius="xl"
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    h="100%"
                    transition="all 0.3s ease"
                    _hover={{
                      transform: 'translateY(-5px)'
                    }}
                  >
                    <Box w={{ base: '100%', md: heroWidth }} h={{ base: heroHeight, md: 'auto' }} position="relative">
                      <Image
                        objectFit='cover'
                        w="100%"
                        h="100%"
                        src={event.image}
                        alt={event.title}
                      />
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bg="linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%)"
                      />
                      <Badge 
                        position="absolute"
                        top={4}
                        left={4}
                        colorScheme={getBadgeColor(event.type)}
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        textTransform="uppercase"
                        fontWeight="bold"
                      >
                        {event.type}
                      </Badge>
                    </Box>
                    
                    <VStack flex='1' align="start" p={{ base: 5, md: 6 }} spacing={4}>
                      <Heading 
                        size="lg" 
                        color={headingColor}
                        lineHeight="1.2"
                      >
                        {event.title}
                      </Heading>
                      
                      <HStack spacing={4} wrap="wrap">
                        <HStack color={accentColor}>
                          <Icon as={FaCalendarAlt} boxSize={4} />
                          <Text fontWeight="medium">
                            {formatDate(event.date, event.endDate)}
                          </Text>
                        </HStack>
                      </HStack>
                      
                      <HStack wrap="wrap">
                        <Icon as={FaMapMarkerAlt} color="red.500" boxSize={4} />
                        <Text color={subtitleColor}>
                          {event.location}
                        </Text>
                      </HStack>
                      
                      <Text color={subtitleColor} fontSize="md" lineHeight="1.6">
                        {event.description}
                      </Text>
                      
                      <HStack pt={2}>
                        <Tag size="sm" colorScheme={getBadgeColor(event.type)} variant="subtle" borderRadius="full">
                          <Icon as={getEventIcon(event.type)} mr={1} />
                          {event.type}
                        </Tag>
                        <Tag size="sm" colorScheme="gray" variant="subtle" borderRadius="full">
                          <Icon as={getCategoryIcon(event.category)} mr={1} />
                          {event.category}
                        </Tag>
                      </HStack>
                    </VStack>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Container>
      </Box>
      
      {/* Main Events Section */}
      <Container maxW="container.xl" py={{ base: 8, md: 12 }}>
        <VStack spacing={{ base: 6, md: 8 }} align="stretch">
          {/* Filters */}
          <Box>
            <VStack spacing={4} align="start">
              <HStack 
                spacing={3} 
                flexWrap="wrap" 
                justify="center" 
                w="full"
                pt={2}
              >
                <Text fontWeight="medium" color={headingColor}>Event Type:</Text>
                <ButtonGroup size="sm" isAttached flexWrap="wrap">
                  <Button 
                    colorScheme={filter === null ? 'blue' : 'gray'}
                    onClick={() => setFilter(null)}
                    fontWeight={filter === null ? 'semibold' : 'medium'}
                    variant={filter === null ? 'solid' : 'outline'}
                    _focus={{ boxShadow: "none", outline: "none" }}
                    borderRadius="full"
                  >
                    All Types
                  </Button>
                  {eventTypes.map(type => (
                    <Button 
                      key={type} 
                      colorScheme={filter === type ? 'blue' : 'gray'}
                      onClick={() => setFilter(type)}
                      fontWeight={filter === type ? 'semibold' : 'medium'}
                      variant={filter === type ? 'solid' : 'outline'}
                      _focus={{ boxShadow: "none", outline: "none" }}
                      borderRadius="full"
                    >
                      {type}
                    </Button>
                  ))}
                </ButtonGroup>
              </HStack>
              
              <HStack 
                spacing={3} 
                flexWrap="wrap" 
                justify="center" 
                w="full"
              >
                <Text fontWeight="medium" color={headingColor}>Category:</Text>
                <ButtonGroup size="sm" isAttached flexWrap="wrap">
                  <Button 
                    colorScheme={categoryFilter === null ? 'teal' : 'gray'}
                    onClick={() => setCategoryFilter(null)}
                    fontWeight={categoryFilter === null ? 'semibold' : 'medium'}
                    variant={categoryFilter === null ? 'solid' : 'outline'}
                    _focus={{ boxShadow: "none", outline: "none" }}
                    borderRadius="full"
                  >
                    All Categories
                  </Button>
                  {eventCategories.map(category => (
                    <Button 
                      key={category} 
                      colorScheme={categoryFilter === category ? 'teal' : 'gray'}
                      onClick={() => setCategoryFilter(category)}
                      fontWeight={categoryFilter === category ? 'semibold' : 'medium'}
                      variant={categoryFilter === category ? 'solid' : 'outline'}
                      _focus={{ boxShadow: "none", outline: "none" }}
                      borderRadius="full"
                    >
                      {category}
                    </Button>
                  ))}
                </ButtonGroup>
              </HStack>
            </VStack>
          </Box>
          
          {/* Events grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredEvents.map(event => (
              <Card 
                key={event.id} 
                borderRadius="xl" 
                overflow="hidden" 
                border="1px solid"
                borderColor={borderColor}
                bg={cardBg}
                transition="all 0.2s ease"
                _hover={{ 
                  transform: 'translateY(-4px)'
                }}
                h="100%"
              >
                <Box position="relative">
                  <Image
                    src={event.image}
                    alt={event.title}
                    h={cardHeight}
                    w="100%"
                    objectFit="cover"
                  />
                  <Flex 
                    position="absolute" 
                    top={3} 
                    left={3} 
                    bg={`${getBadgeColor(event.type)}.500`}
                    color="white"
                    py={1}
                    px={3}
                    align="center"
                    borderRadius="full"
                  >
                    <Icon as={getEventIcon(event.type)} mr={1} boxSize={3.5} />
                    <Text fontSize="xs" fontWeight="bold">{event.type}</Text>
                  </Flex>
                </Box>
                
                <Box p={5}>
                  <Flex justify="space-between" align="start">
                    <Heading 
                      size="md" 
                      mb={3} 
                      lineHeight="1.3" 
                      color={headingColor} 
                      noOfLines={2}
                    >
                      {event.title}
                    </Heading>
                    <Tag size="sm" colorScheme="gray" variant="subtle" borderRadius="full" mt={1}>
                      {event.category}
                    </Tag>
                  </Flex>
                  
                  <VStack align="start" spacing={3} mb={4}>
                    <HStack spacing={2}>
                      <Icon as={FaCalendarAlt} color={accentColor} boxSize={4} />
                      <Text fontSize="sm" fontWeight="medium">
                        {formatDate(event.date, event.endDate)}
                      </Text>
                    </HStack>
                    
                    <HStack align="flex-start" spacing={2}>
                      <Icon as={FaMapMarkerAlt} color="red.500" boxSize={4} mt={0.5} />
                      <Text fontSize="sm" color={subtitleColor}>
                        {event.location}
                      </Text>
                    </HStack>
                  </VStack>
                  
                  <Divider mb={4} />
                  
                  <Text 
                    fontSize="sm" 
                    color={subtitleColor} 
                    lineHeight="1.6" 
                    noOfLines={3}
                  >
                    {event.description}
                  </Text>
                </Box>
              </Card>
            ))}
          </SimpleGrid>
          
          {filteredEvents.length === 0 && (
            <Box 
              textAlign="center" 
              py={10} 
              px={6} 
              borderRadius="lg" 
              bg={lightBg}
            >
              <Text fontSize="lg" color={subtitleColor}>
                No meets found matching your current filters.
              </Text>
              <Button 
                mt={4} 
                colorScheme="blue" 
                onClick={() => {
                  setFilter(null);
                  setCategoryFilter(null);
                }}
                size="md"
                borderRadius="full"
              >
                View All Meets
              </Button>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}

export default Meets; 