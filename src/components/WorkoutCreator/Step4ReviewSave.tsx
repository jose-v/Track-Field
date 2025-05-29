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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  weight?: string;
  distance?: string;
  rest?: string;
  rpe?: string;
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
    <VStack spacing={6} align="stretch" w="100%" bg={cardBg} p={6} borderRadius="md" maxH="calc(100vh - 200px)" overflowY="auto">
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

      {/* Workout Summary - Analytics Card Style */}
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
      >
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Workout Summary
              </Text>
              <Text fontSize="sm" color={subtitleColor}>
                Review and finalize workout details
              </Text>
            </VStack>
            <VStack align="end" spacing={1}>
              <Badge 
                colorScheme={templateType === 'single' ? 'blue' : 'purple'} 
                variant="solid" 
                fontSize="sm"
                px={3}
                py={1}
              >
                {templateType === 'single' ? 'SINGLE DAY' : 'WEEKLY PLAN'}
              </Badge>
              <Text fontSize="xs" color={subtitleColor}>
                Ready to assign
              </Text>
            </VStack>
          </HStack>

          {/* Key Metrics Grid */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
            <Stat textAlign="center">
              <StatLabel fontSize="sm" color={subtitleColor}>
                Workout Name
              </StatLabel>
              <StatNumber fontSize="lg" color={textColor} noOfLines={1}>
                {workoutName}
              </StatNumber>
              <StatHelpText fontSize="xs">
                <Badge colorScheme="gray" variant="subtle" size="sm">
                  {workoutType}
                </Badge>
              </StatHelpText>
            </Stat>

            <Stat textAlign="center">
              <StatLabel fontSize="sm" color={subtitleColor}>
                Exercises
              </StatLabel>
              <StatNumber fontSize="2xl" color={textColor}>
                {templateType === 'single' 
                  ? selectedExercises.length
                  : weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0)
                }
              </StatNumber>
              <StatHelpText fontSize="xs">
                <Badge colorScheme="blue" variant="subtle" size="sm">
                  {templateType === 'single' 
                    ? 'Total'
                    : `${weeklyPlan.filter(d => !d.isRestDay && d.exercises.length > 0).length} days`
                  }
                </Badge>
              </StatHelpText>
            </Stat>

            <Stat textAlign="center">
              <StatLabel fontSize="sm" color={subtitleColor}>
                Total Sets
              </StatLabel>
              <StatNumber fontSize="2xl" color={textColor}>
                {templateType === 'single'
                  ? selectedExercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0)
                  : weeklyPlan.reduce((sum, day) => sum + day.exercises.reduce((daySum, ex) => daySum + (parseInt(ex.sets || '0') || 0), 0), 0)
                }
              </StatNumber>
              <StatHelpText fontSize="xs">
                <Badge colorScheme="green" variant="subtle" size="sm">
                  Planned
                </Badge>
              </StatHelpText>
            </Stat>

            <Stat textAlign="center">
              <StatLabel fontSize="sm" color={subtitleColor}>
                Athletes
              </StatLabel>
              <StatNumber fontSize="2xl" color={textColor}>
                {Object.keys(selectedAthletes).length}
              </StatNumber>
              <StatHelpText fontSize="xs">
                <Badge colorScheme="orange" variant="subtle" size="sm">
                  Assigned
                </Badge>
              </StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* Additional Info */}
          <HStack spacing={4} flexWrap="wrap" justify="center">
            <Badge colorScheme="blue" variant="outline" fontSize="xs">
              Est. {stats.estimatedTime} min {templateType === 'weekly' ? 'total' : ''}
            </Badge>
            {templateType === 'weekly' && (
              <Badge colorScheme="purple" variant="outline" fontSize="xs">
                {weeklyPlan.filter(d => !d.isRestDay).length} training days
              </Badge>
            )}
            {Object.keys(selectedAthletes).length > 0 && (
              <Badge colorScheme="green" variant="outline" fontSize="xs">
                Ready to assign
              </Badge>
            )}
          </HStack>
        </VStack>
      </Box>

      {/* Exercise Preview - No Inner Frame */}
      <VStack spacing={4} align="stretch">
        <HStack spacing={2} mb={2}>
          <Box w={3} h={3} bg="blue.500" borderRadius="full" />
          <Heading size="lg" color={headingColor}>Exercise Preview</Heading>
        </HStack>
        
          {templateType === 'single' ? (
            selectedExercises.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color={noExercisesColor} fontStyle="italic" fontSize="lg">No exercises added</Text>
                  </Box>
          ) : (
            <VStack spacing={6} align="stretch">
              {selectedExercises.map((exercise, index) => {
                const sets = parseInt(exercise.sets || '0') || 0;
                const reps = parseInt(exercise.reps || '0') || 0;
                const weight = parseFloat(exercise.weight || '0') || 0;
                const distance = parseFloat(exercise.distance || '0') || 0;
                const rest = parseInt(exercise.rest || '0') || 0;
                const rpe = parseInt(exercise.rpe || '0') || 0;
                
                const volume = sets * reps;
                const totalLoad = weight > 0 ? volume * weight : 0;
                const restMinutes = Math.floor(rest / 60);
                const restSeconds = rest % 60;
                const restFormatted = rest > 0 ? (restMinutes > 0 ? `${restMinutes}:${restSeconds.toString().padStart(2, '0')}` : `${rest}s`) : '';
                
                const completedFields = [
                  exercise.sets,
                  exercise.reps,
                  exercise.weight,
                  exercise.distance,
                  exercise.rest,
                  exercise.rpe
                ].filter(field => field && field.trim() !== '').length;
                
                return (
                  <Card key={exercise.instanceId} variant="outline" bg={exerciseCardBg} borderColor={borderColor}>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {/* Exercise Header */}
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack spacing={3}>
                              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                                {index + 1}. {exercise.name}
                              </Text>
                              <Badge colorScheme="blue" variant="subtle">{exercise.category}</Badge>
                            </HStack>
                            <Text fontSize="sm" color={subtitleColor} noOfLines={2}>
                              {exercise.description}
                            </Text>
                          </VStack>
                          <VStack align="end" spacing={1}>
                            <HStack spacing={1}>
                              {[1,2,3,4,5,6].map(i => (
                                <Box
                                  key={i}
                                  w={2}
                                  h={2}
                                  borderRadius="full"
                                  bg={i <= completedFields ? "green.400" : "gray.300"}
                                />
                              ))}
                            </HStack>
                            <Text fontSize="xs" color={subtitleColor}>
                              {completedFields}/6 fields
                            </Text>
                          </VStack>
                        </HStack>
                        
                        {/* Exercise Parameters */}
                        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Sets</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.sets ? textColor : noExercisesColor}>
                              {exercise.sets || '-'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Reps</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.reps ? textColor : noExercisesColor}>
                              {exercise.reps || '-'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Weight (kg)</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.weight ? textColor : noExercisesColor}>
                              {exercise.weight ? `${exercise.weight} kg` : '-'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Distance (m)</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.distance ? textColor : noExercisesColor}>
                              {exercise.distance ? `${exercise.distance} m` : '-'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Rest</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.rest ? textColor : noExercisesColor}>
                              {restFormatted || '-'}
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">RPE (1-10)</Text>
                            <Text fontSize="md" fontWeight="medium" color={exercise.rpe ? textColor : noExercisesColor}>
                              {exercise.rpe || '-'}
                            </Text>
                          </VStack>
                        </SimpleGrid>
                        
                        {/* Calculated Metrics */}
                        <HStack spacing={6} pt={2} borderTop="1px solid" borderColor={borderColor}>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Est. Volume</Text>
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>
                              {volume > 0 ? `${volume} reps` : '-'}
                            </Text>
                          </VStack>
                          {totalLoad > 0 && (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Total Load</Text>
                              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                                {totalLoad.toLocaleString()} kg
                              </Text>
                            </VStack>
                          )}
                          {rest > 0 && (
                            <VStack align="start" spacing={1}>
                              <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase">Rest Time</Text>
                              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                                {restFormatted}
                              </Text>
                            </VStack>
                    )}
                  </HStack>
                        
                        {/* Coach Notes */}
                        {exercise.notes && (
                          <Box pt={2} borderTop="1px solid" borderColor={borderColor}>
                            <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} textTransform="uppercase" mb={1}>Coach Notes</Text>
                            <Text fontSize="sm" color={textColor} fontStyle="italic">
                              "{exercise.notes}"
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
              
              {/* Workout Summary Footer */}
              <Card variant="outline" bg={statsBg} borderColor={borderColor}>
                <CardBody>
                  <HStack justify="space-around" spacing={8}>
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>{selectedExercises.length}</Text>
                      <Text fontSize="sm" color={subtitleColor}>Total Exercises</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        {selectedExercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0)}
                      </Text>
                      <Text fontSize="sm" color={subtitleColor}>Total Sets</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>~{stats.estimatedTime} min</Text>
                      <Text fontSize="sm" color={subtitleColor}>Est. Duration</Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            </VStack>
          )
        ) : (
          <VStack spacing={6} align="stretch">
            {weeklyPlan.map((dayWorkout) => {
              const dayLabel = DAYS_OF_WEEK.find(d => d.value === dayWorkout.day)?.label || dayWorkout.day;
              
              if (dayWorkout.isRestDay) {
                return (
                  <Card key={dayWorkout.day} variant="outline" bg={dayCardBg} borderColor={borderColor}>
                    <CardBody>
                      <HStack justify="space-between" align="center">
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>{dayLabel}</Text>
                        <Badge colorScheme="gray" variant="solid" size="lg">Rest Day</Badge>
                      </HStack>
                    </CardBody>
                  </Card>
                );
              }
              
              if (dayWorkout.exercises.length === 0) {
                return (
                  <Card key={dayWorkout.day} variant="outline" bg={dayCardBg} borderColor={borderColor}>
                    <CardBody>
                      <HStack justify="space-between" align="center">
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>{dayLabel}</Text>
                        <Text color={noExercisesColor} fontStyle="italic">No exercises planned</Text>
                      </HStack>
                    </CardBody>
                  </Card>
                );
              }
              
              const dayStats = {
                totalSets: dayWorkout.exercises.reduce((sum, ex) => sum + (parseInt(ex.sets || '0') || 0), 0),
                estimatedTime: dayWorkout.exercises.length * 3
              };
              
              return (
                <Card key={dayWorkout.day} variant="outline" bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {/* Day Header */}
                      <HStack justify="space-between" align="center" pb={2} borderBottom="1px solid" borderColor={borderColor}>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="lg" fontWeight="bold" color={textColor}>{dayLabel}</Text>
                          <Text fontSize="sm" color={subtitleColor}>
                            {dayWorkout.exercises.length} exercise{dayWorkout.exercises.length !== 1 ? 's' : ''} • ~{dayStats.estimatedTime} min
                          </Text>
                        </VStack>
                        <Badge colorScheme="blue" variant="subtle" size="lg">
                          {dayStats.totalSets} sets
                        </Badge>
                      </HStack>
                      
                      {/* Day Exercises */}
                      <VStack spacing={4} align="stretch">
                        {dayWorkout.exercises.map((exercise, index) => {
                          const sets = parseInt(exercise.sets || '0') || 0;
                          const reps = parseInt(exercise.reps || '0') || 0;
                          const weight = parseFloat(exercise.weight || '0') || 0;
                          const distance = parseFloat(exercise.distance || '0') || 0;
                          const rest = parseInt(exercise.rest || '0') || 0;
                          const rpe = parseInt(exercise.rpe || '0') || 0;
                          
                          const volume = sets * reps;
                          const totalLoad = weight > 0 ? volume * weight : 0;
                          const restMinutes = Math.floor(rest / 60);
                          const restSeconds = rest % 60;
                          const restFormatted = rest > 0 ? (restMinutes > 0 ? `${restMinutes}:${restSeconds.toString().padStart(2, '0')}` : `${rest}s`) : '';
                          
                          const completedFields = [
                            exercise.sets,
                            exercise.reps,
                            exercise.weight,
                            exercise.distance,
                            exercise.rest,
                            exercise.rpe
                          ].filter(field => field && field.trim() !== '').length;
                          
                          return (
                            <Box key={exercise.instanceId} p={4} bg={exerciseCardBg} borderRadius="md" borderLeft="4px solid" borderLeftColor="blue.400">
                              <VStack spacing={3} align="stretch">
                                {/* Exercise Header */}
                                <HStack justify="space-between" align="start">
                                  <VStack align="start" spacing={1} flex={1}>
                                    <HStack spacing={3}>
                                      <Text fontSize="md" fontWeight="bold" color={textColor}>
                                        {index + 1}. {exercise.name}
                                      </Text>
                                      <Badge colorScheme="blue" variant="subtle" size="sm">{exercise.category}</Badge>
                                    </HStack>
                                    <Text fontSize="xs" color={subtitleColor} noOfLines={1}>
                                      {exercise.description}
                                    </Text>
                                  </VStack>
                                  <VStack align="end" spacing={1}>
                                    <HStack spacing={1}>
                                      {[1,2,3,4,5,6].map(i => (
                                        <Box
                                          key={i}
                                          w={1.5}
                                          h={1.5}
                                          borderRadius="full"
                                          bg={i <= completedFields ? "green.400" : "gray.300"}
                                        />
                                      ))}
                                    </HStack>
                                    <Text fontSize="xs" color={subtitleColor}>
                                      {completedFields}/6
                                    </Text>
                                  </VStack>
                                </HStack>
                                
                                {/* Exercise Parameters */}
                                <SimpleGrid columns={{ base: 3, md: 6 }} spacing={3}>
                                  <VStack align="start" spacing={0.5}>
                                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Sets</Text>
                                    <Text fontSize="sm" fontWeight="medium" color={exercise.sets ? textColor : noExercisesColor}>
                                      {exercise.sets || '-'}
                                    </Text>
                                  </VStack>
                                  <VStack align="start" spacing={0.5}>
                                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Reps</Text>
                                    <Text fontSize="sm" fontWeight="medium" color={exercise.reps ? textColor : noExercisesColor}>
                                      {exercise.reps || '-'}
                                    </Text>
                                  </VStack>
                                  <VStack align="start" spacing={0.5}>
                                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Weight</Text>
                                    <Text fontSize="sm" fontWeight="medium" color={exercise.weight ? textColor : noExercisesColor}>
                                      {exercise.weight ? `${exercise.weight}kg` : '-'}
                                    </Text>
                                  </VStack>
                                  <VStack align="start" spacing={0.5}>
                                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Distance</Text>
                                    <Text fontSize="sm" fontWeight="medium" color={exercise.distance ? textColor : noExercisesColor}>
                                      {exercise.distance ? `${exercise.distance}m` : '-'}
                                    </Text>
                                  </VStack>
                                  <VStack align="start" spacing={0.5}>
                                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>Rest</Text>
                                    <Text fontSize="sm" fontWeight="medium" color={exercise.rest ? textColor : noExercisesColor}>
                                      {restFormatted || '-'}
                                    </Text>
                                  </VStack>
                                  <VStack align="start" spacing={0.5}>
                                    <Text fontSize="xs" fontWeight="semibold" color={subtitleColor}>RPE</Text>
                                    <Text fontSize="sm" fontWeight="medium" color={exercise.rpe ? textColor : noExercisesColor}>
                                      {exercise.rpe || '-'}
                                    </Text>
                                  </VStack>
            </SimpleGrid>
                                
                                {/* Calculated Metrics */}
                                {(volume > 0 || totalLoad > 0) && (
                                  <HStack spacing={4} pt={1} fontSize="xs" color={subtitleColor}>
                                    {volume > 0 && <Text>Volume: {volume} reps</Text>}
                                    {totalLoad > 0 && <Text>Load: {totalLoad.toLocaleString()} kg</Text>}
                                  </HStack>
                                )}
                                
                                {/* Coach Notes */}
                                {exercise.notes && (
                                  <Box pt={1}>
                                    <Text fontSize="xs" color={textColor} fontStyle="italic">
                                      "{exercise.notes}"
                                    </Text>
                                  </Box>
                                )}
                              </VStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    </VStack>
        </CardBody>
      </Card>
              );
            })}
            
            {/* Weekly Summary Footer */}
            <Card variant="outline" bg={statsBg} borderColor={borderColor}>
              <CardBody>
                <VStack spacing={3}>
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>Weekly Training Summary</Text>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} w="100%">
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        {weeklyPlan.filter(d => !d.isRestDay && d.exercises.length > 0).length}
                      </Text>
                      <Text fontSize="sm" color={subtitleColor}>Training Days</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        {weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0)}
                      </Text>
                      <Text fontSize="sm" color={subtitleColor}>Total Exercises</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>
                        {weeklyPlan.reduce((sum, day) => sum + day.exercises.reduce((daySum, ex) => daySum + (parseInt(ex.sets || '0') || 0), 0), 0)}
                      </Text>
                      <Text fontSize="sm" color={subtitleColor}>Total Sets</Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color={textColor}>~{stats.estimatedTime} min</Text>
                      <Text fontSize="sm" color={subtitleColor}>Est. Total Time</Text>
                    </VStack>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        )}
      </VStack>

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