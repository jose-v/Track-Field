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
import { Target, Calendar, FileText, Dumbbell, Zap, Heart, Clock, User, MapPin, BookOpen } from 'lucide-react';
import { DateTimePicker } from '../DateTimePicker';

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
  setIsTemplate
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
    <Box w="100%" minH="calc(100vh - 400px)" bg={bgColor}>
      <VStack spacing={6} align="stretch" w="100%">
        {/* Workout Name */}
        <Box>
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

        {/* Template Type, Focus, and Training Period - Responsive Layout */}
        <Box w="100%">
          {/* For screens 1920px+ (custom breakpoint), show all 3 cards in one row */}
          <Box display={{ base: "none", "2xl": "none" }} sx={{ "@media (min-width: 1920px)": { display: "block" } }}>
            <HStack spacing={4} align="start" w="100%">
              {/* Template Type Selection */}
              <Card flex="1" variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <VStack spacing={2} align="center">
                      <HStack>
                        <Calendar size={24} color="var(--chakra-colors-blue-500)" />
                        <Heading size="md" color={textColor}>
                          Choose Your Template Type
                        </Heading>
                      </HStack>
                      <Text fontSize="sm" color={subtitleColor} textAlign="center">
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
                          h="140px"
                          position="relative"
                        >
                          <CardBody p={6} display="flex" alignItems="center" h="100%">
                            <Flex justify="center" align="center" h="100%" w="100%">
                              <HStack spacing={4} w="100%">
                                <Box color={templateType === type.value ? "blue.500" : useColorModeValue("gray.500", "gray.400")}>
                                  {type.value === 'single' ? <FileText size={32} /> : <Calendar size={32} />}
                                </Box>
                                <VStack spacing={2} align="start" flex="1">
                                  <Heading size="sm" color={templateType === type.value ? "blue.700" : textColor}>
                                    {type.label}
                                  </Heading>
                                  <Text fontSize="xs" color={subtitleColor} lineHeight="short">
                                    {type.value === 'single' 
                                      ? 'Perfect for one-time workouts or specific training sessions'
                                      : 'Create weekly schedules and save as templates for monthly plans'
                                    }
                                  </Text>
                                </VStack>
                              </HStack>
                            </Flex>
                          </CardBody>
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
                        </Card>
                      ))}
                    
                      {/* Template Checkbox - Show only for Weekly Training Plan */}
                      {templateType === 'weekly' && setIsTemplate && (
                        <Card
                          variant="outline"
                          shadow="none"
                          cursor="pointer"
                          onClick={() => setIsTemplate(!isTemplate)}
                          bg={isTemplate ? templateSelectedBg : cardBg}
                          borderColor={isTemplate ? templateSelectedBorderColor : borderColor}
                          borderWidth="2px"
                          _hover={{ 
                            borderColor: isTemplate ? "blue.500" : "blue.300",
                            bg: isTemplate ? templateSelectedHoverBg : hoverBg
                          }}
                          transition="all 0.2s"
                          position="relative"
                          w="100%"
                          h="140px"
                        >
                          <CardBody p={6} display="flex" alignItems="center" h="100%">
                            <Flex justify="center" align="center" h="100%" w="100%">
                              <HStack spacing={4} w="100%">
                                <Box color={isTemplate ? "blue.500" : templateIconColor}>
                                  <BookOpen size={32} />
                                </Box>
                                <VStack spacing={2} align="start" flex="1">
                                  <Heading 
                                    size="sm" 
                                    color={isTemplate ? "blue.700" : textColor}
                                    lineHeight="tight"
                                  >
                                    Save as Template
                                  </Heading>
                                  <Text 
                                    fontSize="xs" 
                                    color={isTemplate ? templateTextColor : subtitleColor}
                                    lineHeight="short"
                                  >
                                    Use for monthly plans
                                  </Text>
                                </VStack>
                              </HStack>
                            </Flex>
                            {isTemplate && (
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

              {/* Workout Type Selection - 25% */}
              <Card flex="0.25" variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <VStack spacing={2} align="start">
                      <HStack>
                        <Target size={24} color="var(--chakra-colors-green-500)" />
                        <Heading size="md" color={textColor}>
                          Training Focus
                        </Heading>
                      </HStack>
                      <Text fontSize="sm" color={subtitleColor}>
                        Primary training type
                      </Text>
                    </VStack>
                    
                    <SimpleGrid columns={2} spacing={3} w="100%">
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
                          h="90px"
                          position="relative"
                        >
                          <CardBody p={3} display="flex" flexDirection="column" justifyContent="center" alignItems="center" h="100%">
                            <VStack spacing={2} textAlign="center" w="100%">
                              <Box color={workoutType === type ? "green.500" : useColorModeValue("gray.400", "gray.500")}>
                                {getTypeIcon(type, 20)}
                              </Box>
                              <VStack spacing={0} w="100%">
                                <Heading 
                                  size="xs" 
                                  color={workoutType === type ? "green.700" : textColor}
                                  fontWeight="bold"
                                  lineHeight="tight"
                                >
                                  {type}
                                </Heading>
                                <Text 
                                  fontSize="2xs" 
                                  color={workoutType === type ? "green.600" : subtitleColor} 
                                  lineHeight="short" 
                                  textAlign="center"
                                  noOfLines={2}
                                >
                                  {getTypeDescription(type).split(' ').slice(0, 3).join(' ')}
                                </Text>
                              </VStack>
                            </VStack>
                            {workoutType === type && (
                              <Box
                                position="absolute"
                                top={1}
                                right={1}
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

              {/* Training Period Selection - 50% */}
              <Card flex="0.5" variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <VStack spacing={2} align="start">
                      <HStack>
                        <Calendar size={24} color="var(--chakra-colors-purple-500)" />
                        <Heading size="md" color={textColor}>
                          Schedule
                        </Heading>
                      </HStack>
                      <Text fontSize="sm" color={subtitleColor}>
                        {isTemplate ? "Optional for templates" : "Date & time"}
                      </Text>
                    </VStack>

                    {/* Show date/time picker only if not creating a template */}
                    {!isTemplate && (
                      <>
                        {/* Date & Time Picker - Compact for wide layout */}
                        <Box w="100%">
                          <DateTimePicker
                            selectedDates={templateType === 'weekly' ? selectedDateRange : selectedDates}
                            selectedStartTime={startTime}
                            selectedEndTime={endTime}
                            isMultiSelect={templateType === 'weekly'}
                            onDateSelect={templateType === 'weekly' ? handleWeeklyDateSelect : handleSingleDateSelect}
                            onTimeSelect={handleTimeSelect}
                          />
                        </Box>

                        {/* Location Input - Compact */}
                        <VStack spacing={2} w="100%" align="start">
                          <HStack spacing={2} align="start">
                            <MapPin size={14} color="var(--chakra-colors-green-500)" />
                            <Text fontSize="xs" fontWeight="semibold" color={textColor}>
                              Location
                            </Text>
                          </HStack>
                          <FormControl>
                            <Input
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="Training location"
                              size="sm"
                              borderWidth="1px"
                              bg={inputBg}
                              borderColor={borderColor}
                              color={textColor}
                              _placeholder={{ color: placeholderColor }}
                              _focus={{ borderColor: "green.400" }}
                            />
                          </FormControl>
                        </VStack>
                      </>
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
            </HStack>
          </Box>

          {/* For screens smaller than 1920px, show original layout */}
          <Box display={{ base: "block" }} sx={{ "@media (min-width: 1920px)": { display: "none" } }}>
            {/* Template Type and Focus Side by Side */}
            <HStack spacing={4} align="start" w="100%" mb={6}>
              {/* Template Type Selection */}
              <Card flex="1" variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <VStack spacing={2} align="center">
                      <HStack>
                        <Calendar size={24} color="var(--chakra-colors-blue-500)" />
                        <Heading size="md" color={textColor}>
                          Choose Your Template Type
                        </Heading>
                      </HStack>
                      <Text fontSize="sm" color={subtitleColor} textAlign="center">
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
                          h="140px"
                          position="relative"
                        >
                          <CardBody p={6} display="flex" alignItems="center" h="100%">
                            <Flex justify="center" align="center" h="100%" w="100%">
                              <HStack spacing={4} w="100%">
                                <Box color={templateType === type.value ? "blue.500" : useColorModeValue("gray.500", "gray.400")}>
                                  {type.value === 'single' ? <FileText size={32} /> : <Calendar size={32} />}
                                </Box>
                                <VStack spacing={2} align="start" flex="1">
                                  <Heading size="sm" color={templateType === type.value ? "blue.700" : textColor}>
                                    {type.label}
                                  </Heading>
                                  <Text fontSize="xs" color={subtitleColor} lineHeight="short">
                                    {type.value === 'single' 
                                      ? 'Perfect for one-time workouts or specific training sessions'
                                      : 'Create weekly schedules and save as templates for monthly plans'
                                    }
                                  </Text>
                                </VStack>
                              </HStack>
                            </Flex>
                          </CardBody>
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
                        </Card>
                      ))}
                    
                      {/* Template Checkbox - Show only for Weekly Training Plan */}
                      {templateType === 'weekly' && setIsTemplate && (
                        <Card
                          variant="outline"
                          shadow="none"
                          cursor="pointer"
                          onClick={() => setIsTemplate(!isTemplate)}
                          bg={isTemplate ? templateSelectedBg : cardBg}
                          borderColor={isTemplate ? templateSelectedBorderColor : borderColor}
                          borderWidth="2px"
                          _hover={{ 
                            borderColor: isTemplate ? "blue.500" : "blue.300",
                            bg: isTemplate ? templateSelectedHoverBg : hoverBg
                          }}
                          transition="all 0.2s"
                          position="relative"
                          w="100%"
                          h="140px"
                        >
                          <CardBody p={6} display="flex" alignItems="center" h="100%">
                            <Flex justify="center" align="center" h="100%" w="100%">
                              <HStack spacing={4} w="100%">
                                <Box color={isTemplate ? "blue.500" : templateIconColor}>
                                  <BookOpen size={32} />
                                </Box>
                                <VStack spacing={2} align="start" flex="1">
                                  <Heading 
                                    size="sm" 
                                    color={isTemplate ? "blue.700" : textColor}
                                    lineHeight="tight"
                                  >
                                    Save as Template
                                  </Heading>
                                  <Text 
                                    fontSize="xs" 
                                    color={isTemplate ? templateTextColor : subtitleColor}
                                    lineHeight="short"
                                  >
                                    Use for monthly plans
                                  </Text>
                                </VStack>
                              </HStack>
                            </Flex>
                            {isTemplate && (
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

              {/* Workout Type Selection */}
              <Card flex="1" variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
                <CardBody p={6}>
                  <VStack spacing={4} align="stretch">
                    <VStack spacing={2} align="center">
                      <HStack>
                        <Target size={24} color="var(--chakra-colors-green-500)" />
                        <Heading size="md" color={textColor}>
                          What's the Focus?
                        </Heading>
                      </HStack>
                      <Text fontSize="sm" color={subtitleColor} textAlign="center">
                        Select the primary type of training for this workout
                      </Text>
                    </VStack>
                    
                    <SimpleGrid columns={2} spacing={4} w="100%">
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
                          h="140px"
                          position="relative"
                        >
                          <CardBody p={5} display="flex" flexDirection="column" justifyContent="center" alignItems="center" h="100%">
                            <VStack spacing={3} textAlign="center" w="100%">
                              <Box color={workoutType === type ? "green.500" : useColorModeValue("gray.400", "gray.500")}>
                                {getTypeIcon(type, 28)}
                              </Box>
                              <VStack spacing={1} w="100%">
                                <Heading 
                                  size="sm" 
                                  color={workoutType === type ? "green.700" : textColor}
                                  fontWeight="bold"
                                  lineHeight="tight"
                                >
                                  {type}
                                </Heading>
                                <Text 
                                  fontSize="xs" 
                                  color={workoutType === type ? "green.600" : subtitleColor} 
                                  lineHeight="short" 
                                  textAlign="center"
                                  px={1}
                                  noOfLines={2}
                                >
                                  {getTypeDescription(type)}
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
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            </HStack>

            {/* Date, Time & Location Selection - Full Width Card */}
            {!isTemplate && (
              <Card variant="outline" shadow="none" bg={cardBg} borderColor={borderColor} w="100%">
                <CardBody p={6}>
                  <VStack spacing={6} align="stretch" w="100%">
                    <VStack spacing={2} align="center">
                      <HStack>
                        <Calendar size={24} color="var(--chakra-colors-purple-500)" />
                        <Heading size="md" color={textColor}>
                          {templateType === 'single' ? 'Schedule Your Workout' : 'Set Training Period'}
                        </Heading>
                      </HStack>
                      <Text fontSize="sm" color={subtitleColor} textAlign="center">
                        {templateType === 'single' 
                          ? 'Choose the date and time for your workout session'
                          : 'Select the start and end dates for your weekly training plan'
                        }
                      </Text>
                    </VStack>

                    {/* Date & Time Picker - Centered */}
                    <Flex justify="center" w="100%">
                      <DateTimePicker
                        selectedDates={templateType === 'weekly' ? selectedDateRange : selectedDates}
                        selectedStartTime={startTime}
                        selectedEndTime={endTime}
                        isMultiSelect={templateType === 'weekly'}
                        onDateSelect={templateType === 'weekly' ? handleWeeklyDateSelect : handleSingleDateSelect}
                        onTimeSelect={handleTimeSelect}
                      />
                    </Flex>

                    {/* Location Input */}
                    <VStack spacing={2} w="100%" align="start">
                      <HStack spacing={2} align="start">
                        <MapPin size={16} color="var(--chakra-colors-green-500)" />
                        <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                          Location (Optional)
                        </Text>
                      </HStack>
                      <FormControl>
                        <Input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder={templateType === 'single' ? "Workout location (e.g., Main Gym, Track Field)" : "Training location (e.g., Athletic Center, School Gym)"}
                          size="md"
                          borderWidth="1px"
                          bg={inputBg}
                          borderColor={borderColor}
                          color={textColor}
                          _placeholder={{ color: placeholderColor }}
                          _focus={{ borderColor: "green.400" }}
                        />
                      </FormControl>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Show template message when creating template */}
            {isTemplate && (
              <Card variant="outline" shadow="none" bg={cardBg} borderColor={borderColor} w="100%">
                <CardBody p={6}>
                  <VStack spacing={6} align="center" py={8}>
                    <Box color="blue.500">
                      <BookOpen size={64} />
                    </Box>
                    <VStack spacing={2} align="center">
                      <Heading size="md" color="blue.700" textAlign="center">
                        Creating Template
                      </Heading>
                      <Text fontSize="sm" color={subtitleColor} textAlign="center">
                        Templates don't require specific dates or times. You can add exercises and save this as a reusable template for monthly plans.
                      </Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default Step1WorkoutDetails; 