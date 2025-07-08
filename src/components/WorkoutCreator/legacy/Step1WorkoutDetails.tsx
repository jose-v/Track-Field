import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Heading,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Badge,
  Flex,
  useColorModeValue,
  Checkbox,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Target, Calendar, FileText, Dumbbell, Zap, Heart, Clock, User, MapPin, BookOpen, ArrowDown, RotateCcw } from 'lucide-react';
import { DateTimePicker } from '../../';

interface Step1WorkoutDetailsProps {
  workoutName: string;
  setWorkoutName: (name: string) => void;
  templateType: 'single' | 'weekly';
  setTemplateType: (type: 'single' | 'weekly') => void;
  workoutType: string;
  setWorkoutType: (type: string) => void;
  date: string;
  setDate: (date: string) => void;
  time: string;
  setTime: (time: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  location: string;
  setLocation: (location: string) => void;
  isTemplate?: boolean;
  setIsTemplate?: (isTemplate: boolean) => void;
  flowType?: 'sequential' | 'circuit';
  setFlowType?: (type: 'sequential' | 'circuit') => void;
  circuitRounds?: number;
  setCircuitRounds?: (rounds: number) => void;
}

const TEMPLATE_TYPES = [
  { value: 'single', label: 'Single Day Workout' },
  { value: 'weekly', label: 'Weekly Training Plan' }
];

const WORKOUT_TYPES = [
  'Strength',
  'Running', 
  'Flexibility',
  'Recovery',
  'Custom'
];

const Step1WorkoutDetails: React.FC<Step1WorkoutDetailsProps> = ({
  workoutName,
  setWorkoutName,
  templateType,
  setTemplateType,
  workoutType,
  setWorkoutType,
  date,
  setDate,
  time,
  setTime,
  duration,
  setDuration,
  location,
  setLocation,
  isTemplate,
  setIsTemplate,
  flowType = 'sequential',
  setFlowType,
  circuitRounds = 3,
  setCircuitRounds
}) => {
  // Add state for time selection
  const [startTime, setStartTime] = React.useState<string>('');
  const [endTime, setEndTime] = React.useState<string>('');
  
  // Track if we're in the initial loading phase to prevent unwanted resets
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  
  // Add state to track if field has been focused
  const [hasBeenFocused, setHasBeenFocused] = React.useState(false);
  
  // Monitor changes to detect when initial data loading is complete
  React.useEffect(() => {
    // Use isTemplate prop changes to detect when loading is complete
    // If isTemplate is defined (true or false), we're likely done with initial loading
    if (isTemplate !== undefined) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 200); // Small delay to ensure all state updates are complete
      
      return () => clearTimeout(timer);
    }
  }, [isTemplate]);

  // Also check for workout name for additional safety
  React.useEffect(() => {
    if (workoutName.trim() && workoutName.toLowerCase() !== 'my new workout') {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [workoutName]);

  // Convert single date to array for DateTimePicker
  const selectedDates = date ? [date] : [];
  
  // Convert date range to array for weekly workouts
  const selectedDateRange = templateType === 'weekly' && date && duration 
    ? [date, duration] 
    : date ? [date] : [];

  const handleSingleDateSelect = (dates: string[]) => {
    if (dates.length > 0) {
      setDate(dates[0]);
    } else {
      setDate('');
    }
  };

  const handleWeeklyDateSelect = (dates: string[]) => {
    if (dates.length >= 2) {
      const sortedDates = dates.sort();
      setDate(sortedDates[0]);
      setDuration(sortedDates[sortedDates.length - 1]);
    } else if (dates.length === 1) {
      setDate(dates[0]);
      setDuration('');
    } else {
      setDate('');
      setDuration('');
    }
  };

  const handleTimeSelect = (start: string, end?: string) => {
    setStartTime(start);
    setEndTime(end || '');
  };

  // Handle template type change and reset template selection if switching to single
  const handleTemplateTypeChange = (newType: 'single' | 'weekly') => {
    setTemplateType(newType);
    
    // Only reset template selection if we're not in initial load phase and switching to single
    if (!isInitialLoad && newType === 'single' && setIsTemplate) {
      setIsTemplate(false);
    }
  };

  // Theme-aware colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedBorderColor = useColorModeValue('blue.400', 'blue.500');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const selectedHoverBg = useColorModeValue('blue.100', 'blue.800');
  const greenSelectedBg = useColorModeValue('green.50', 'green.900');
  const greenSelectedBorderColor = useColorModeValue('green.400', 'green.500');
  const greenHoverBg = useColorModeValue('green.100', 'green.800');
  const inputBg = useColorModeValue('white', 'gray.700');
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const placeholderColor = useColorModeValue('gray.500', 'gray.300');
  const inputHoverBorderColor = useColorModeValue('gray.400', 'gray.500');
  
  // Template colors (moved from conditional rendering)
  const templateSelectedBg = useColorModeValue('blue.50', 'blue.900');
  const templateSelectedBorderColor = useColorModeValue('blue.500', 'blue.400');
  const templateSelectedHoverBg = useColorModeValue('blue.100', 'blue.800');
  const templateIconColor = useColorModeValue('gray.400', 'gray.500');
  const templateTextColor = useColorModeValue('blue.600', 'blue.200');

  const getTypeIcon = (type: string, size: number = 20) => {
    switch (type) {
      case 'Strength': return <Dumbbell size={size} />;
      case 'Running': return <Zap size={size} />;
      case 'Flexibility': return <Heart size={size} />;
      case 'Recovery': return <Clock size={size} />;
      case 'Custom': return <User size={size} />;
      default: return <Dumbbell size={size} />;
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'Strength': return 'Weight training & resistance exercises';
      case 'Running': return 'Sprints, distance runs & cardio';
      case 'Flexibility': return 'Stretching, yoga & mobility work';
      case 'Recovery': return 'Light movement & regeneration';
      case 'Custom': return 'Mix of different training types';
      default: return 'General fitness training';
    }
  };

  return (
    <Box w="100%" minH="calc(100vh - 400px)">
      <VStack spacing={6} align="stretch" w="100%" px={{ base: 4, lg: 6, xl: 8, "2xl": 12 }}>
        {/* Workout Name and Location */}
        <HStack spacing={4} align="start" w="100%">
          {/* Workout Name - Left Side */}
          <Box flex="2">
            <FormControl isRequired>
              <FormLabel fontSize="lg" fontWeight="semibold" color={labelColor}>
                Workout Name
              </FormLabel>
              <Input 
                value={workoutName} 
                onChange={(e) => setWorkoutName(e.target.value)}
                onFocus={(e) => {
                  setHasBeenFocused(true);
                  
                  // Clear the field if it's empty, contains placeholder text, or hasn't been properly set
                  if (!workoutName || 
                      workoutName.trim() === '' || 
                      workoutName.toLowerCase().trim() === 'my new workout' ||
                      workoutName === 'My New Workout') {
                    setWorkoutName('');
                    // Force the input to clear immediately
                    e.target.value = '';
                  }
                  
                  // Select all text after a brief delay to ensure state updates
                  setTimeout(() => {
                    if (e.target && workoutName && workoutName.trim() !== '') {
                      e.target.select();
                    }
                  }, 10);
                }}
                onClick={(e) => {
                  // Handle click to clear placeholder-like text
                  if (!workoutName || 
                      workoutName.trim() === '' || 
                      workoutName.toLowerCase().trim() === 'my new workout' ||
                      workoutName === 'My New Workout') {
                    setWorkoutName('');
                    // Force the input to clear immediately
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                placeholder={hasBeenFocused ? "Enter workout name..." : "My New Workout"}
                size="lg"
                fontSize="lg"
                py={6}
                borderWidth="2px"
                bg={inputBg}
                borderColor={borderColor}
                color={textColor}
                _placeholder={{ color: placeholderColor }}
                _focus={{ borderColor: "blue.400" }}
                _hover={{ borderColor: inputHoverBorderColor }}
              />
            </FormControl>
          </Box>

          {/* Location - Right Side */}
          <Box flex="1">
            <FormControl>
              <FormLabel fontSize="lg" fontWeight="semibold" color={labelColor}>
                Location
              </FormLabel>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Training location"
                size="lg"
                fontSize="lg"
                py={6}
                borderWidth="2px"
                bg={inputBg}
                borderColor={borderColor}
                color={textColor}
                _placeholder={{ color: placeholderColor }}
                _focus={{ borderColor: "green.400" }}
                _hover={{ borderColor: inputHoverBorderColor }}
              />
            </FormControl>
          </Box>
        </HStack>

        {/* Template Type, Focus, and Training Period - Responsive Layout */}
        <Box w="100%">
          {/* Responsive Layout */}
          <Box w="100%">
            {/* Ultra-wide screens (2xl+): All 3 cards side by side with proper proportions */}
            <VStack spacing={{ base: 4, lg: 6 }} w="100%">
              {/* Template Type and Training Focus - Side by Side */}
            <SimpleGrid 
              columns={{ base: 1, lg: 2 }} 
                spacing={{ base: 4, lg: 6 }} 
              w="100%"
            >
            {/* Template Type Selection */}
            <Card 
              variant="outline" 
              shadow="none" 
              bg={cardBg} 
              borderColor={borderColor}
                  h={{ base: "fit-content", lg: "550px" }}
            >
              <CardBody p={{ base: 4, lg: 5 }} h="100%">
                <VStack spacing={{ base: 4, lg: 4 }} align="stretch" h="100%" justify="space-between">
                  <VStack spacing={2} align="start">
                    <HStack>
                      <Calendar size={24} color="var(--chakra-colors-blue-500)" />
                      <Heading size="md" color={textColor}>
                        Choose Your Template Type
                      </Heading>
                    </HStack>
                    <Text fontSize="sm" color={subtitleColor}>
                      Will this be a single workout or a weekly training plan?
                    </Text>
                  </VStack>
                  
                  <VStack spacing={4}>
                    {TEMPLATE_TYPES.map((type) => (
                      <Card
                        key={type.value}
                        variant="outline"
                        shadow="none"
                        cursor="pointer"
                        onClick={() => handleTemplateTypeChange(type.value as 'single' | 'weekly')}
                        bg={templateType === type.value ? selectedBg : cardBg}
                        borderColor={templateType === type.value ? selectedBorderColor : borderColor}
                        borderWidth="2px"
                        _hover={{ 
                          borderColor: templateType === type.value ? "blue.500" : "blue.300",
                          bg: templateType === type.value ? selectedHoverBg : hoverBg
                        }}
                        transition="all 0.2s"
                        w="100%"
                        minH="100px"
                        position="relative"
                      >
                        <CardBody p={3} display="flex" alignItems="center" h="100%">
                          <HStack spacing={3} w="100%" align="start">
                            <Box 
                              color={templateType === type.value ? "blue.500" : useColorModeValue("gray.500", "gray.400")}
                              flexShrink={0}
                            >
                              {type.value === 'single' ? <FileText size={28} /> : <Calendar size={28} />}
                            </Box>
                            <VStack spacing={2} align="start" flex="1">
                              <Heading size="sm" color={templateType === type.value ? "blue.700" : textColor}>
                                {type.label}
                              </Heading>
                              <Text fontSize="xs" color={subtitleColor} lineHeight="1.4">
                                {type.value === 'single' 
                                  ? 'Perfect for one-time workouts or specific training sessions'
                                  : 'Create weekly schedules and save as templates for monthly plans'
                                }
                              </Text>
                            </VStack>
                          </HStack>
                          {templateType === type.value && (
                            <Box
                              position="absolute"
                              top={2}
                              right={2}
                              bg="blue.500"
                              color="white"
                              borderRadius="full"
                              w={5}
                              h={5}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="xs" fontWeight="bold">✓</Text>
                            </Box>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  
                    {/* Template Checkbox - Always show but disable for Single Day */}
                    {setIsTemplate && (
                      <Card
                        variant="outline"
                        shadow="none"
                        cursor={templateType === 'weekly' ? "pointer" : "not-allowed"}
                        onClick={() => {
                          if (templateType === 'weekly') {
                            setIsTemplate(!isTemplate);
                          }
                        }}
                        bg={isTemplate && templateType === 'weekly' ? templateSelectedBg : cardBg}
                        borderColor={isTemplate && templateType === 'weekly' ? templateSelectedBorderColor : borderColor}
                        borderWidth="2px"
                        opacity={templateType === 'single' ? 0.6 : 1}
                        _hover={templateType === 'weekly' ? { 
                          borderColor: isTemplate ? "blue.500" : "blue.300",
                          bg: isTemplate ? templateSelectedHoverBg : hoverBg
                        } : {}}
                        transition="all 0.2s"
                        position="relative"
                        w="100%"
                        minH="100px"
                      >
                        <CardBody p={3} display="flex" alignItems="center" h="100%">
                          <HStack spacing={3} w="100%" align="start">
                            <Box 
                              color={isTemplate && templateType === 'weekly' ? "blue.500" : templateIconColor}
                              flexShrink={0}
                            >
                              <BookOpen size={28} />
                            </Box>
                            <VStack spacing={2} align="start" flex="1">
                              <Heading 
                                size="sm" 
                                color={isTemplate && templateType === 'weekly' ? "blue.700" : textColor}
                                lineHeight="tight"
                              >
                                Save as Template
                              </Heading>
                              <Text 
                                fontSize="xs" 
                                color={isTemplate && templateType === 'weekly' ? templateTextColor : subtitleColor}
                                lineHeight="1.4"
                              >
                                {templateType === 'single' 
                                  ? "Not available for single day workouts" 
                                  : "Use for monthly plans and reusable workouts"
                                }
                              </Text>
                            </VStack>
                          </HStack>
                          {isTemplate && templateType === 'weekly' && (
                            <Box
                              position="absolute"
                              top={2}
                              right={2}
                              bg="blue.500"
                              color="white"
                              borderRadius="full"
                              w={5}
                              h={5}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="xs" fontWeight="bold">✓</Text>
                            </Box>
                          )}
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Training Focus Selection */}
            <Card 
              variant="outline" 
              shadow="none" 
              bg={cardBg} 
              borderColor={borderColor}
                  h={{ base: "fit-content", lg: "550px" }}
            >
              <CardBody p={{ base: 4, lg: 5 }} h="100%">
                <VStack spacing={{ base: 4, lg: 4 }} align="stretch" h="100%" justify="space-between">
                  <VStack spacing={2} align="start">
                    <HStack>
                      <Target size={24} color="var(--chakra-colors-green-500)" />
                      <Heading size="md" color={textColor}>
                        Training Focus
                      </Heading>
                    </HStack>
                    <Text fontSize="sm" color={subtitleColor}>
                      Select the primary type of training
                    </Text>
                  </VStack>
                  
                  <SimpleGrid 
                    columns={{ base: 2, sm: 3, lg: 2, xl: 2 }} 
                    spacing={{ base: 3, lg: 4 }} 
                    w="100%"
                  >
                    {WORKOUT_TYPES.map((type) => (
                      <Card
                        key={type}
                        variant="outline"
                        shadow="none"
                        cursor="pointer"
                        onClick={() => setWorkoutType(type)}
                        bg={workoutType === type ? greenSelectedBg : cardBg}
                        borderColor={workoutType === type ? greenSelectedBorderColor : borderColor}
                        borderWidth="2px"
                        _hover={{ 
                          borderColor: workoutType === type ? "green.500" : "green.300",
                          bg: workoutType === type ? greenHoverBg : hoverBg
                        }}
                        transition="all 0.2s"
                        h={{ base: "90px", lg: "100px" }}
                        position="relative"
                      >
                        <CardBody 
                          p={{ base: 3, lg: 4 }} 
                          display="flex" 
                          flexDirection="column" 
                          justifyContent="center" 
                          alignItems="center" 
                          h="100%"
                        >
                          <VStack spacing={2} textAlign="center" w="100%">
                            <Box color={workoutType === type ? "green.500" : useColorModeValue("gray.400", "gray.500")}>
                              {getTypeIcon(type, 24)}
                            </Box>
                            <VStack spacing={1} w="100%">
                              <Heading 
                                size="xs" 
                                color={workoutType === type ? "green.700" : textColor}
                                fontWeight="bold"
                                lineHeight="tight"
                                fontSize={{ base: "xs", lg: "sm" }}
                              >
                                {type}
                              </Heading>
                              <Text 
                                fontSize="2xs" 
                                color={workoutType === type ? "green.600" : subtitleColor} 
                                lineHeight="1.3" 
                                textAlign="center"
                                noOfLines={2}
                                display={{ base: "none", lg: "block" }}
                              >
                                {getTypeDescription(type).split(' ').slice(0, 3).join(' ')}
                              </Text>
                            </VStack>
                          </VStack>
                          {workoutType === type && (
                            <Box
                              position="absolute"
                              top={2}
                              right={2}
                              bg="green.500"
                              color="white"
                              borderRadius="full"
                              w={4}
                              h={4}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="xs" fontWeight="bold">✓</Text>
                            </Box>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
              </SimpleGrid>

              {/* Workout Flow Type Selection - Full Width */}
            <Card 
              variant="outline" 
              shadow="none" 
              bg={cardBg} 
              borderColor={borderColor}
                w="100%"
              >
              <CardBody p={{ base: 4, lg: 6 }}>
                <VStack spacing={{ base: 4, lg: 6 }} align="stretch">
                  <VStack spacing={2} align="start">
                    <HStack>
                      <ArrowDown size={24} color="var(--chakra-colors-purple-500)" />
                      <Heading size="md" color={textColor}>
                        Workout Flow
                      </Heading>
                    </HStack>
                    <Text fontSize="sm" color={subtitleColor}>
                      How should exercises be performed?
                    </Text>
                  </VStack>
                  
                  <VStack spacing={4}>
                    {/* Flow Options - Full Width Layout */}
                    <SimpleGrid 
                      columns={{ base: 1, lg: 2 }} 
                      spacing={{ base: 4, lg: 6 }} 
                      w="100%"
                    >
                      {/* Sequential Flow Option */}
                      <Card
                        variant="outline"
                        shadow="none"
                        cursor="pointer"
                        onClick={() => setFlowType?.('sequential')}
                        bg={flowType === 'sequential' ? selectedBg : cardBg}
                        borderColor={flowType === 'sequential' ? selectedBorderColor : borderColor}
                        borderWidth="2px"
                        _hover={{ 
                          borderColor: flowType === 'sequential' ? "blue.500" : "blue.300",
                          bg: flowType === 'sequential' ? selectedHoverBg : hoverBg
                        }}
                        transition="all 0.2s"
                        w="100%"
                        minH="120px"
                        position="relative"
                      >
                        <CardBody p={4} display="flex" alignItems="center" h="100%">
                          <VStack spacing={3} w="100%" align="center" textAlign="center">
                            <Box 
                              color={flowType === 'sequential' ? "blue.500" : useColorModeValue("gray.500", "gray.400")}
                              flexShrink={0}
                            >
                              <ArrowDown size={32} />
                            </Box>
                            <VStack spacing={2} align="center">
                              <HStack justify="center">
                                <Heading size="sm" color={flowType === 'sequential' ? "blue.700" : textColor}>
                                  Sequential
                                </Heading>
                                <Badge colorScheme="green" size="sm">Default</Badge>
                              </HStack>
                              <Text fontSize="xs" color={subtitleColor} lineHeight="1.4" textAlign="center">
                                Complete all sets of one exercise before moving to the next
                              </Text>
                            </VStack>
                          </VStack>
                          {flowType === 'sequential' && (
                            <Box
                              position="absolute"
                              top={2}
                              right={2}
                              bg="blue.500"
                              color="white"
                              borderRadius="full"
                              w={5}
                              h={5}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="xs" fontWeight="bold">✓</Text>
                            </Box>
                          )}
                        </CardBody>
                      </Card>

                      {/* Circuit Flow Option */}
                      <Card
                        variant="outline"
                        shadow="none"
                        cursor="pointer"
                        onClick={() => setFlowType?.('circuit')}
                        bg={flowType === 'circuit' ? selectedBg : cardBg}
                        borderColor={flowType === 'circuit' ? selectedBorderColor : borderColor}
                        borderWidth="2px"
                        _hover={{ 
                          borderColor: flowType === 'circuit' ? "blue.500" : "blue.300",
                          bg: flowType === 'circuit' ? selectedHoverBg : hoverBg
                        }}
                        transition="all 0.2s"
                        w="100%"
                        minH="120px"
                        position="relative"
                      >
                        <CardBody p={4} display="flex" alignItems="center" h="100%">
                          <VStack spacing={3} w="100%" align="center" textAlign="center">
                            <Box 
                              color={flowType === 'circuit' ? "blue.500" : useColorModeValue("gray.500", "gray.400")}
                              flexShrink={0}
                            >
                              <RotateCcw size={32} />
                            </Box>
                            <VStack spacing={2} align="center">
                              <Heading size="sm" color={flowType === 'circuit' ? "blue.700" : textColor}>
                                Circuit
                              </Heading>
                              <Text fontSize="xs" color={subtitleColor} lineHeight="1.4" textAlign="center">
                                Repeat selected exercises in sequence for multiple rounds
                              </Text>
                            </VStack>
                          </VStack>
                          {flowType === 'circuit' && (
                            <Box
                              position="absolute"
                              top={2}
                              right={2}
                              bg="blue.500"
                              color="white"
                              borderRadius="full"
                              w={5}
                              h={5}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <Text fontSize="xs" fontWeight="bold">✓</Text>
                            </Box>
                          )}
                        </CardBody>
                      </Card>
                    </SimpleGrid>

                    {/* Circuit Rounds Input - Show only when Circuit is selected */}
                    {flowType === 'circuit' && setCircuitRounds && (
                      <Card
                        variant="outline"
                        shadow="none"
                        bg={cardBg}
                        borderColor={borderColor}
                        borderWidth="2px"
                        w="100%"
                      >
                        <CardBody p={4}>
                          <VStack spacing={3} align="start">
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              Number of Rounds
                            </Text>
                            <HStack spacing={3} w="100%">
                              <Input
                                type="number"
                                value={circuitRounds}
                                onChange={(e) => setCircuitRounds(Math.max(1, parseInt(e.target.value) || 1))}
                                min={1}
                                max={20}
                                size="sm"
                                w="80px"
                                bg={inputBg}
                                borderColor={borderColor}
                                _focus={{ borderColor: "blue.400" }}
                              />
                              <Text fontSize="sm" color={subtitleColor}>
                                rounds (1-20)
                              </Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    )}
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

              {/* Schedule Selection - Full Width */}
              <Card 
                variant="outline" 
                shadow="none" 
                bg={cardBg} 
                borderColor={borderColor}
                w="100%"
            >
              <CardBody p={{ base: 4, lg: 6 }}>
                <VStack spacing={{ base: 4, lg: 6 }} align="stretch">
                  <VStack spacing={2} align="start">
                    <HStack>
                      <Calendar size={24} color="var(--chakra-colors-purple-500)" />
                      <Heading size="md" color={textColor}>
                        Schedule
                      </Heading>
                    </HStack>
                    <Text fontSize="sm" color={subtitleColor}>
                      {isTemplate ? "Optional for templates" : 
                       templateType === 'single' ? "Date & time for workout" : "Training period dates"}
                    </Text>
                  </VStack>

                  {/* Show date/time picker only if not creating a template */}
                  {!isTemplate && (
                    <Box w="100%" overflow="hidden">
                      <DateTimePicker
                        selectedDates={templateType === 'weekly' ? selectedDateRange : selectedDates}
                        selectedStartTime={startTime}
                        selectedEndTime={endTime}
                        isMultiSelect={templateType === 'weekly'}
                        onDateSelect={templateType === 'weekly' ? handleWeeklyDateSelect : handleSingleDateSelect}
                        onTimeSelect={handleTimeSelect}
                      />
                    </Box>
                  )}

                  {/* Show message when creating template */}
                  {isTemplate && (
                    <VStack spacing={4} align="center" py={8}>
                      <Box color="blue.500">
                        <BookOpen size={48} />
                      </Box>
                      <VStack spacing={2} align="center">
                        <Heading size="sm" color="blue.700" textAlign="center">
                          Creating Template
                        </Heading>
                        <Text fontSize="sm" color={subtitleColor} textAlign="center">
                          Templates don't require specific dates or times
                        </Text>
                      </VStack>
                    </VStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
            </VStack>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default Step1WorkoutDetails; 