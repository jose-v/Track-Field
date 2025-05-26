import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Avatar,
  AvatarGroup,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
} from '@chakra-ui/react';
import { Eye, MapPin, Calendar } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface SelectedExercise extends Exercise {
  instanceId: string;
  sets?: string;
  reps?: string;
  notes?: string;
}

interface DayWorkout {
  day: string;
  exercises: SelectedExercise[];
  isRestDay: boolean;
}

interface Athlete {
  id: string;
  name: string;
  event: string;
  avatar: string;
}

interface Step4ReviewSaveProps {
  workoutName: string;
  workoutType: string;
  templateType: 'single' | 'weekly';
  selectedExercises?: SelectedExercise[];
  weeklyPlan?: DayWorkout[];
  selectedAthletes: Record<string, Athlete>;
  warnings: string[];
  onGoToStep: (step: number) => void;
  startDate?: string;
  endDate?: string;
  location?: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

const Step4ReviewSave: React.FC<Step4ReviewSaveProps> = ({
  workoutName,
  workoutType,
  templateType,
  selectedExercises = [],
  weeklyPlan = [],
  selectedAthletes,
  warnings,
  onGoToStep,
  startDate,
  endDate,
  location,
}) => {
  // Theme-aware colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('blue.100', 'blue.800');
  const statsBg = useColorModeValue('gray.50', 'gray.700');
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.600');
  const exerciseMoreBg = useColorModeValue('gray.100', 'gray.500');
  const dayCardBg = useColorModeValue('gray.50', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'gray.100');
  const noExercisesColor = useColorModeValue('gray.500', 'gray.300');
  const exerciseTextColor = useColorModeValue('gray.600', 'gray.200');
  const estimatedTimeSubtextColor = useColorModeValue('gray.500', 'gray.300');
  const athleteTextColor = useColorModeValue('gray.600', 'gray.200');
  const warningTitleColor = useColorModeValue('orange.800', 'orange.200');
  const warningTextColor = useColorModeValue('orange.700', 'orange.300');
  const warningBg = useColorModeValue('orange.50', 'orange.900');

  const getWorkoutStats = () => {
    if (templateType === 'single') {
      const totalExercises = selectedExercises.length;
      const estimatedTime = totalExercises * 3;
      const totalSets = selectedExercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0);
      return { totalExercises, estimatedTime, totalSets };
    } else {
      const trainingDays = weeklyPlan.filter(d => !d.isRestDay).length;
      const totalExercises = weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0);
      const estimatedTime = totalExercises * 3;
      return { trainingDays, totalExercises, estimatedTime };
    }
  };

  const stats = getWorkoutStats();

  return (
    <VStack spacing={8} align="stretch" w="100%" bg={cardBg} p={6} borderRadius="md">
      {/* Warnings Section */}
      {warnings.length > 0 && (
        <Alert status="warning" borderRadius="md" bg={warningBg}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="md" color={warningTitleColor}>⚠️ Items that need attention:</AlertTitle>
            <AlertDescription>
              <VStack align="start" spacing={1} mt={2}>
                {warnings.map((warning, index) => (
                  <Text key={index} fontSize="sm" color={warningTextColor}>• {warning}</Text>
                ))}
              </VStack>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Workout Summary with Inline Edit Links */}
      <Card variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
        <CardHeader pb={3}>
          <Heading size="lg" color={textColor}>Workout Summary</Heading>
        </CardHeader>
        <CardBody pt={0}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => onGoToStep(1)} _hover={{ bg: hoverBg }} p={2} borderRadius="md" transition="all 0.2s">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg" color={textColor}>Name:</Text>
                  <Text fontSize="lg" color={textColor}>{workoutName}</Text>
                  <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                </VStack>
              </HStack>
              <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => onGoToStep(1)} _hover={{ bg: hoverBg }} p={2} borderRadius="md" transition="all 0.2s">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg" color={textColor}>Type:</Text>
                  <Badge colorScheme="green" variant="subtle" fontSize="md" px={3} py={1}>{workoutType}</Badge>
                  <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                </VStack>
              </HStack>
            </VStack>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => onGoToStep(1)} _hover={{ bg: hoverBg }} p={2} borderRadius="md" transition="all 0.2s">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg" color={textColor}>Template:</Text>
                  <Badge colorScheme={templateType === 'single' ? 'blue' : 'purple'} variant="subtle" fontSize="md" px={3} py={1}>
                    {templateType === 'single' ? 'Single Day' : 'Weekly Plan'}
                  </Badge>
                  <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                </VStack>
              </HStack>
              <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => onGoToStep(2)} _hover={{ bg: hoverBg }} p={2} borderRadius="md" transition="all 0.2s">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg" color={textColor}>Exercises:</Text>
                  <Text fontSize="lg" color={textColor}>
                    {templateType === 'single' 
                      ? `${selectedExercises.length} exercises`
                      : `${weeklyPlan.filter(d => !d.isRestDay).length} training days`
                    }
                  </Text>
                  <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                </VStack>
              </HStack>
            </VStack>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => onGoToStep(3)} _hover={{ bg: hoverBg }} p={2} borderRadius="md" transition="all 0.2s">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg" color={textColor}>Athletes:</Text>
                  <Text fontSize="lg" color={textColor}>{Object.keys(selectedAthletes).length} assigned</Text>
                  <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                </VStack>
              </HStack>
              {/* Date and Location for Weekly Plans */}
              {templateType === 'weekly' && (startDate || endDate || location) && (
                <VStack align="start" spacing={3} w="100%">
                  {(startDate || endDate) && (
                    <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => onGoToStep(1)} _hover={{ bg: hoverBg }} p={2} borderRadius="md" transition="all 0.2s">
                      <VStack align="start" spacing={1}>
                        <HStack spacing={1}>
                          <Calendar size={16} color="var(--chakra-colors-blue-500)" />
                          <Text fontWeight="semibold" fontSize="lg" color={textColor}>Period:</Text>
                        </HStack>
                        <Text fontSize="sm" color={subtitleColor}>
                          {startDate && endDate 
                            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                            : startDate 
                              ? `From ${new Date(startDate).toLocaleDateString()}`
                              : endDate 
                                ? `Until ${new Date(endDate).toLocaleDateString()}`
                                : 'Not set'
                          }
                        </Text>
                        <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                      </VStack>
                    </HStack>
                  )}
                  {location && (
                    <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => onGoToStep(1)} _hover={{ bg: hoverBg }} p={2} borderRadius="md" transition="all 0.2s">
                      <VStack align="start" spacing={1}>
                        <HStack spacing={1}>
                          <MapPin size={16} color="var(--chakra-colors-green-500)" />
                          <Text fontWeight="semibold" fontSize="lg" color={textColor}>Location:</Text>
                        </HStack>
                        <Text fontSize="sm" color={subtitleColor}>{location}</Text>
                        <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                      </VStack>
                    </HStack>
                  )}
                </VStack>
              )}
              {/* Date and Location for Single Day Workouts */}
              {templateType === 'single' && (startDate || location) && (
                <VStack align="start" spacing={3} w="100%">
                  {startDate && (
                    <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => onGoToStep(1)} _hover={{ bg: hoverBg }} p={2} borderRadius="md" transition="all 0.2s">
                      <VStack align="start" spacing={1}>
                        <HStack spacing={1}>
                          <Calendar size={16} color="var(--chakra-colors-blue-500)" />
                          <Text fontWeight="semibold" fontSize="lg" color={textColor}>Date:</Text>
                        </HStack>
                        <Text fontSize="sm" color={subtitleColor}>
                          {new Date(startDate).toLocaleDateString()}
                        </Text>
                        <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                      </VStack>
                    </HStack>
                  )}
                  {location && (
                    <HStack justify="space-between" width="100%" cursor="pointer" onClick={() => onGoToStep(1)} _hover={{ bg: hoverBg }} p={2} borderRadius="md" transition="all 0.2s">
                      <VStack align="start" spacing={1}>
                        <HStack spacing={1}>
                          <MapPin size={16} color="var(--chakra-colors-green-500)" />
                          <Text fontWeight="semibold" fontSize="lg" color={textColor}>Location:</Text>
                        </HStack>
                        <Text fontSize="sm" color={subtitleColor}>{location}</Text>
                        <Text fontSize="xs" color="blue.500">Click to edit →</Text>
                      </VStack>
                    </HStack>
                  )}
                </VStack>
              )}
            </VStack>
            <VStack align="start" spacing={4}>
              <Box p={2} borderRadius="md">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg" color={textColor}>Estimated Time:</Text>
                  <Text fontSize="lg" color={textColor}>
                    {templateType === 'single' 
                      ? `~${stats.estimatedTime} minutes`
                      : `~${Math.round(stats.estimatedTime / 7)} min/day`
                    }
                  </Text>
                  <Text fontSize="xs" color={estimatedTimeSubtextColor}>Based on exercise count</Text>
                </VStack>
              </Box>
            </VStack>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Exercise Preview */}
      <Card variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
        <CardHeader pb={3}>
          <Heading size="lg" color={headingColor}>Exercise Preview</Heading>
        </CardHeader>
        <CardBody pt={0}>
          {templateType === 'single' ? (
            selectedExercises.length === 0 ? (
              <Text color={noExercisesColor} fontStyle="italic" fontSize="lg">No exercises added</Text>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {selectedExercises.slice(0, 12).map((exercise, index) => (
                  <Box key={exercise.instanceId} p={4} bg={exerciseCardBg} borderRadius="lg">
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="md" fontWeight="medium" color={textColor}>{index + 1}. {exercise.name}</Text>
                    </HStack>
                    <HStack spacing={4}>
                      {exercise.sets && <Text fontSize="sm" color={exerciseTextColor} fontWeight="medium">{exercise.sets} sets</Text>}
                      {exercise.reps && <Text fontSize="sm" color={exerciseTextColor} fontWeight="medium">{exercise.reps} reps</Text>}
                    </HStack>
                  </Box>
                ))}
                {selectedExercises.length > 12 && (
                  <Box p={4} bg={exerciseMoreBg} borderRadius="lg" textAlign="center">
                    <Text fontSize="md" color={noExercisesColor} fontStyle="italic">
                      +{selectedExercises.length - 12} more exercises
                    </Text>
                  </Box>
                )}
              </SimpleGrid>
            )
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              {DAYS_OF_WEEK.map((day) => {
                const dayWorkout = weeklyPlan.find(d => d.day === day.value);
                if (!dayWorkout) return null;
                
                return (
                  <HStack key={day.value} justify="space-between" p={4} bg={dayCardBg} borderRadius="lg">
                    <Text fontWeight="semibold" fontSize="md" color={textColor}>{day.label}</Text>
                    {dayWorkout.isRestDay ? (
                      <Badge colorScheme="gray" variant="solid" size="md">Rest Day</Badge>
                    ) : (
                      <Badge colorScheme="blue" variant="subtle" size="md">
                        {dayWorkout.exercises.length} exercises
                      </Badge>
                    )}
                  </HStack>
                );
              })}
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      {/* Athlete Assignment Preview */}
      {Object.keys(selectedAthletes).length > 0 && (
        <Card variant="outline" shadow="none" bg={cardBg} borderColor={borderColor}>
          <CardHeader pb={3}>
            <Heading size="lg" color={headingColor}>Assigned Athletes</Heading>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <AvatarGroup size="lg" max={20} spacing="-0.5rem">
                {Object.values(selectedAthletes).map((athlete) => (
                  <Avatar
                    key={athlete.id}
                    name={athlete.name}
                    src={athlete.avatar}
                    title={`${athlete.name} - ${athlete.event}`}
                    borderWidth="2px"
                    borderColor={useColorModeValue("white", "gray.800")}
                  />
                ))}
              </AvatarGroup>
              <Text fontSize="md" color={athleteTextColor} textAlign="center">
                This workout will be assigned to {Object.keys(selectedAthletes).length} athlete{Object.keys(selectedAthletes).length !== 1 ? 's' : ''}
              </Text>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default Step4ReviewSave; 