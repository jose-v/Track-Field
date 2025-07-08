import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  Badge,
  useColorModeValue,
  Button,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { 
  Calendar, 
  FileText, 
  CalendarDays,
  Dumbbell,
  Zap,
  Clock,
  Users,
  Target,
  BookOpen,
  Sparkles
} from 'lucide-react';

interface Step1TemplateSelectionProps {
  selectedTemplateType: 'single' | 'weekly' | 'monthly';
  onTemplateTypeSelect: (type: 'single' | 'weekly' | 'monthly') => void;
  selectedTemplate?: string;
  onTemplateSelect: (template: string) => void;
  workoutName: string;
  onWorkoutNameChange: (name: string) => void;
}

const TEMPLATE_TYPES = [
  {
    value: 'single' as const,
    label: 'Single Day Workout',
    description: 'Build a single workout session',
    icon: FileText,
    color: 'blue',
    features: ['Quick setup', 'Perfect for specific training', 'Immediate assignment']
  },
  {
    value: 'weekly' as const,
    label: 'Weekly Training Plan',
    description: 'Schedule workouts for the week',
    icon: Calendar,
    color: 'green',
    features: ['7-day planning', 'Rest day management', 'Progressive structure']
  },
  {
    value: 'monthly' as const,
    label: 'Monthly Plan',
    description: 'Schedule workouts for the month',
    icon: CalendarDays,
    color: 'purple',
    features: ['Long-term planning', 'Periodization', 'Multiple phases'],
    advanced: true
  }
];

const WORKOUT_TEMPLATES = {
  single: [
    {
      id: 'strength',
      name: 'Classic Strength',
      description: 'Traditional strength training with warm-up, main sets, and cool-down',
      icon: Dumbbell,
      blocks: ['Warm-up', 'Main Strength', 'Cool-down']
    },
    {
      id: 'circuit',
      name: 'Speed Circuit',
      description: 'High-intensity circuit training for conditioning',
      icon: Zap,
      blocks: ['Dynamic Warm-up', 'Circuit Training', 'Recovery']
    },
    {
      id: 'emom',
      name: 'Daily EMOM',
      description: 'Every Minute on the Minute training protocol',
      icon: Clock,
      blocks: ['Activation', 'EMOM Block', 'Cool-down']
    }
  ],
  weekly: [
    {
      id: 'full-week',
      name: 'Full Week Plan',
      description: 'Complete 7-day training schedule',
      icon: Calendar,
      structure: '5 training days + 2 rest days'
    },
    {
      id: 'strength-week',
      name: 'Strength Focus Week',
      description: 'Weekly plan focused on strength development',
      icon: Target,
      structure: '4 strength days + 3 recovery/conditioning'
    }
  ],
  monthly: [
    {
      id: 'periodized',
      name: 'Periodized Plan',
      description: 'Progressive monthly training plan',
      icon: Users,
      structure: '4 weeks with progression'
    }
  ]
};

const Step1TemplateSelection: React.FC<Step1TemplateSelectionProps> = ({
  selectedTemplateType,
  onTemplateTypeSelect,
  selectedTemplate,
  onTemplateSelect,
  workoutName,
  onWorkoutNameChange
}) => {
  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedBorderColor = useColorModeValue('blue.400', 'blue.500');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <VStack spacing={8} align="stretch" w="100%">
      {/* Header */}
      <Box>
        <Heading size="xl" color={textColor} mb={2}>
          Choose Your Template Type
        </Heading>
        <Text fontSize="lg" color={subtitleColor}>
          Start by selecting what you want to create
        </Text>
      </Box>

      {/* Template Type Selection */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {TEMPLATE_TYPES.map((type) => (
          <Card
            key={type.value}
            variant="outline"
            cursor="pointer"
            onClick={() => onTemplateTypeSelect(type.value)}
            bg={selectedTemplateType === type.value ? selectedBg : cardBg}
            borderColor={selectedTemplateType === type.value ? selectedBorderColor : borderColor}
            borderWidth="2px"
            _hover={{ 
              borderColor: selectedTemplateType === type.value ? `${type.color}.500` : `${type.color}.300`,
              bg: selectedTemplateType === type.value ? selectedBg : hoverBg
            }}
            transition="all 0.2s"
            position="relative"
            minH="200px"
          >
            {type.advanced && (
              <Badge
                position="absolute"
                top={2}
                right={2}
                colorScheme="purple"
                variant="solid"
                fontSize="xs"
                borderRadius="full"
                px={2}
              >
                <HStack spacing={1}>
                  <Icon as={Sparkles} boxSize={3} />
                  <Text>Advanced</Text>
                </HStack>
              </Badge>
            )}
            
            <CardBody p={6}>
              <VStack spacing={4} h="100%" justify="space-between">
                <VStack spacing={3} align="center" textAlign="center">
                  <Icon 
                    as={type.icon} 
                    boxSize={12} 
                    color={selectedTemplateType === type.value ? `${type.color}.500` : `${type.color}.400`}
                  />
                  <VStack spacing={1}>
                    <Heading size="md" color={textColor}>
                      {type.label}
                    </Heading>
                    <Text fontSize="sm" color={subtitleColor} textAlign="center">
                      {type.description}
                    </Text>
                  </VStack>
                </VStack>
                
                <VStack spacing={1} align="start" w="100%">
                  {type.features.map((feature, idx) => (
                    <Text key={idx} fontSize="xs" color={subtitleColor}>
                      • {feature}
                    </Text>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* Template Selection */}
      {selectedTemplateType && (
        <Box>
          <VStack spacing={4} align="stretch">
            <Flex align="center" justify="space-between">
              <VStack spacing={1} align="start">
                <Heading size="lg" color={textColor}>
                  Choose a Starting Template
                </Heading>
                <Text fontSize="md" color={subtitleColor}>
                  Pick a template to get started quickly, or start from scratch
                </Text>
              </VStack>
              
              <Button
                variant={selectedTemplate === 'scratch' ? "solid" : "outline"}
                colorScheme={selectedTemplate === 'scratch' ? "blue" : "gray"}
                onClick={() => onTemplateSelect('scratch')}
                leftIcon={<Icon as={BookOpen} />}
                bg={selectedTemplate === 'scratch' ? selectedBg : undefined}
                borderColor={selectedTemplate === 'scratch' ? selectedBorderColor : undefined}
                borderWidth="2px"
              >
                Start from Scratch
              </Button>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {WORKOUT_TEMPLATES[selectedTemplateType]?.map((template) => (
                <Card
                  key={template.id}
                  variant="outline"
                  cursor="pointer"
                  onClick={() => onTemplateSelect(template.id)}
                  bg={selectedTemplate === template.id ? selectedBg : cardBg}
                  borderColor={selectedTemplate === template.id ? selectedBorderColor : borderColor}
                  borderWidth="2px"
                  _hover={{ 
                    borderColor: selectedTemplate === template.id ? "blue.500" : "blue.300",
                    bg: selectedTemplate === template.id ? selectedBg : hoverBg
                  }}
                  transition="all 0.2s"
                  size="sm"
                >
                  <CardBody p={4}>
                    <VStack spacing={3} align="start">
                      <HStack spacing={3}>
                        <Icon as={template.icon} boxSize={6} color="blue.500" />
                        <VStack spacing={0} align="start" flex={1}>
                          <Text fontWeight="bold" fontSize="md" color={textColor}>
                            {template.name}
                          </Text>
                          <Text fontSize="sm" color={subtitleColor} noOfLines={2}>
                            {template.description}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      {('blocks' in template) && (
                        <HStack spacing={1} flexWrap="wrap">
                          {template.blocks.map((block, idx) => (
                            <Badge key={idx} size="sm" colorScheme="blue" variant="subtle">
                              {block}
                            </Badge>
                          ))}
                        </HStack>
                      )}
                      
                      {('structure' in template) && (
                        <Badge size="sm" colorScheme="green" variant="subtle">
                          {template.structure}
                        </Badge>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default Step1TemplateSelection; 