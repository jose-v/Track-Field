import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Heading,
  Button,
  Badge,
  Icon,
  useColorModeValue,
  Container,
  SimpleGrid,
} from '@chakra-ui/react';
import { 
  Sparkles, 
  Settings, 
  ArrowRight,
  Zap,
  Calendar,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateWorkoutChoice: React.FC = () => {
  const navigate = useNavigate();
  
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');

  const creators = [
    {
      id: 'new',
      title: 'New Block-First Creator',
      description: 'Modern workflow with template selection and block-based building',
      features: [
        'Template selection with pre-built options',
        'Block-first design for mixed training styles',
        'Smart prompts and suggestions',
        'Better UX for complex workouts'
      ],
      badge: { text: 'New Experience', color: 'purple' },
      icon: Sparkles,
      color: 'purple',
      route: '/coach/workout-creator-new'
    },
    {
      id: 'legacy',
      title: 'Current Creator',
      description: 'Existing workout creator with exercise-first approach',
      features: [
        'Familiar interface',
        'Proven workflow',
        'All existing features',
        'Stable and tested'
      ],
      badge: { text: 'Current', color: 'blue' },
      icon: Settings,
      color: 'blue',
      route: '/coach/workout-creator'
    }
  ];

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Container maxW="6xl" py={12}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Heading size="2xl" color={textColor} mb={4}>
              Choose Your Creation Experience
            </Heading>
            <Text fontSize="xl" color={subtitleColor} maxW="2xl" mx="auto">
              Test the new block-first workout creator or continue with the current version
            </Text>
          </Box>

          {/* Creator Options */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
            {creators.map((creator) => (
              <Card
                key={creator.id}
                variant="outline"
                bg={cardBg}
                borderColor={borderColor}
                borderWidth="2px"
                _hover={{ 
                  borderColor: `${creator.color}.300`,
                  transform: 'translateY(-2px)',
                  shadow: 'lg'
                }}
                transition="all 0.2s"
                position="relative"
                minH="400px"
              >
                <Badge
                  position="absolute"
                  top={4}
                  right={4}
                  colorScheme={creator.badge.color}
                  variant="solid"
                  fontSize="sm"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {creator.id === 'new' && <Icon as={Sparkles} mr={1} boxSize={3} />}
                  {creator.badge.text}
                </Badge>
                
                <CardBody p={8}>
                  <VStack spacing={6} h="100%" justify="space-between">
                    <VStack spacing={4} align="center" textAlign="center">
                      <Icon 
                        as={creator.icon} 
                        boxSize={16} 
                        color={`${creator.color}.500`}
                      />
                      <VStack spacing={2}>
                        <Heading size="lg" color={textColor}>
                          {creator.title}
                        </Heading>
                        <Text fontSize="md" color={subtitleColor} textAlign="center">
                          {creator.description}
                        </Text>
                      </VStack>
                    </VStack>
                    
                    <VStack spacing={4} w="100%">
                      <VStack spacing={2} align="start" w="100%">
                        <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                          Key Features:
                        </Text>
                        {creator.features.map((feature, idx) => (
                          <HStack key={idx} spacing={2} align="start">
                            <Icon as={Zap} boxSize={3} color={`${creator.color}.500`} mt={0.5} />
                            <Text fontSize="sm" color={subtitleColor}>
                              {feature}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                      
                      <Button
                        colorScheme={creator.color}
                        size="lg"
                        w="100%"
                        rightIcon={<ArrowRight size={20} />}
                        onClick={() => navigate(creator.route)}
                      >
                        Use {creator.id === 'new' ? 'New' : 'Current'} Creator
                      </Button>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Quick Actions */}
          <Card variant="outline" bg={cardBg} borderColor={borderColor}>
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color={textColor} textAlign="center">
                  Quick Actions
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Button
                    leftIcon={<Calendar size={16} />}
                    variant="outline"
                    onClick={() => navigate('/coach/training-plans')}
                  >
                    Monthly Plans
                  </Button>
                  <Button
                    leftIcon={<Users size={16} />}
                    variant="outline"
                    onClick={() => navigate('/coach/athletes')}
                  >
                    Manage Athletes
                  </Button>
                  <Button
                    leftIcon={<Settings size={16} />}
                    variant="outline"
                    onClick={() => navigate('/coach/workouts')}
                  >
                    View All Workouts
                  </Button>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default CreateWorkoutChoice; 