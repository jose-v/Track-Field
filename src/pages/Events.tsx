import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Flex,
  Avatar,
  Icon,
  Divider,
  useColorModeValue,
  SimpleGrid,
  Image,
} from '@chakra-ui/react';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock } from 'react-icons/fa';
import { useState } from 'react';

// Mock data for upcoming events
const upcomingEvents = [
  {
    id: 1,
    title: 'Annual Track & Field Championship',
    date: '2023-12-10T09:00:00',
    location: 'Central Stadium, New York',
    description: 'Join us for the annual championship event featuring athletes from across the country.',
    type: 'Competition',
    participants: 120,
    image: '/images/championship-event.jpg',
  },
  {
    id: 2,
    title: 'Sprint Technique Workshop',
    date: '2023-11-18T10:00:00',
    location: 'Training Center, Boston',
    description: 'Learn advanced sprint techniques from professional coaches and athletes.',
    type: 'Workshop',
    participants: 35,
    image: '/images/workshop-event.jpg',
  },
  {
    id: 3,
    title: 'Team Building Retreat',
    date: '2023-11-25T08:30:00',
    location: 'Mountain View Resort, Colorado',
    description: 'A weekend retreat focused on team building activities and preparation for the upcoming season.',
    type: 'Retreat',
    participants: 45,
    image: '/images/retreat-event.jpg',
  },
  {
    id: 4,
    title: 'Junior Athletes Competition',
    date: '2023-12-05T13:00:00',
    location: 'University Stadium, Chicago',
    description: 'A competition specifically designed for junior athletes to showcase their talents.',
    type: 'Competition',
    participants: 80,
    image: '/images/junior-competition.jpg',
  },
  {
    id: 5,
    title: 'Coaching Certification Program',
    date: '2023-12-15T09:00:00',
    location: 'Sports Academy, Los Angeles',
    description: 'Get certified as a track and field coach with our comprehensive certification program.',
    type: 'Training',
    participants: 25,
    image: '/images/certification.jpg',
  },
];

// Function to format date strings
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Event type badge color mapping
const getBadgeColor = (eventType: string) => {
  const typeColors: Record<string, string> = {
    'Competition': 'red',
    'Workshop': 'green',
    'Retreat': 'purple',
    'Training': 'blue',
    'Meeting': 'orange',
  };
  return typeColors[eventType] || 'gray';
};

export function Events() {
  const [filter, setFilter] = useState<string | null>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Filter events based on selected type
  const filteredEvents = filter
    ? upcomingEvents.filter(event => event.type === filter)
    : upcomingEvents;
  
  // Get unique event types for filters
  const eventTypes = Array.from(new Set(upcomingEvents.map(event => event.type)));

  return (
    <Box w="100%" py={8}>
      <Heading size="xl" mb={8}>Upcoming Events</Heading>
      
      {/* Filter buttons */}
      <HStack spacing={4} mb={8} overflowX="auto" pb={2}>
        <Button 
          size="sm" 
          colorScheme={filter === null ? 'blue' : 'gray'} 
          onClick={() => setFilter(null)}
        >
          All
        </Button>
        {eventTypes.map(type => (
          <Button 
            key={type} 
            size="sm" 
            colorScheme={filter === type ? 'blue' : 'gray'} 
            onClick={() => setFilter(type)}
          >
            {type}
          </Button>
        ))}
      </HStack>
      
      {/* Events grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {filteredEvents.map(event => (
          <Card key={event.id} bg={bgColor} boxShadow="md" borderWidth="1px" borderColor={borderColor}>
            <Image
              src={event.image}
              alt={event.title}
              borderTopRadius="lg"
              objectFit="cover"
              height="180px"
              width="100%"
              fallbackSrc="/images/event-fallback.jpg"
            />
            <CardHeader pb={0}>
              <Flex justify="space-between" align="center">
                <Badge colorScheme={getBadgeColor(event.type)} px={2} py={1} borderRadius="md">
                  {event.type}
                </Badge>
                <HStack>
                  <Icon as={FaUsers} color="gray.500" />
                  <Text fontSize="sm" color="gray.500">{event.participants} attendees</Text>
                </HStack>
              </Flex>
              <Heading size="md" mt={2}>{event.title}</Heading>
            </CardHeader>
            
            <CardBody>
              <VStack align="start" spacing={2}>
                <HStack>
                  <Icon as={FaCalendarAlt} color="blue.500" />
                  <Text>{formatDate(event.date)}</Text>
                </HStack>
                <HStack>
                  <Icon as={FaMapMarkerAlt} color="red.500" />
                  <Text>{event.location}</Text>
                </HStack>
                <Text mt={2} color="gray.600">{event.description}</Text>
              </VStack>
            </CardBody>
            
            <Divider borderColor={borderColor} />
            
            <CardFooter pt={2}>
              <Button w="full" colorScheme="blue">Register</Button>
            </CardFooter>
          </Card>
        ))}
      </SimpleGrid>
      
      {filteredEvents.length === 0 && (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg">No events found for the selected filter.</Text>
          <Button mt={4} colorScheme="blue" onClick={() => setFilter(null)}>View All Events</Button>
        </Box>
      )}
    </Box>
  );
} 