import React from 'react';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  Flex,
  IconButton,
  useColorModeValue,
  useBreakpointValue,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { FaRunning, FaDumbbell, FaLeaf, FaRedo, FaClock, FaMapMarkerAlt, FaCalendarAlt, FaSignOutAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import type { Workout } from '../services/api';
import { getExercisesFromWorkout, getBlocksFromWorkout } from '../utils/workoutUtils';

interface WorkoutDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workout: Workout | null;
}

// Helper function to get workout type icon
function getTypeIcon(type: string | undefined) {
  switch (type) {
    case 'Strength': return <FaDumbbell />;
    case 'Running': return <FaRunning />;
    case 'Flexibility': return <FaLeaf />;
    case 'Recovery': return <FaRedo />;
    default: return <FaRunning />;
  }
}

export const WorkoutDetailsDrawer: React.FC<WorkoutDetailsDrawerProps> = ({
  isOpen,
  onClose,
  workout
}) => {
  // Responsive: bottom drawer on mobile, right drawer on desktop
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Theme colors
  const drawerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const drawerText = useColorModeValue('gray.700', 'gray.200');
  const sectionTitleColor = useColorModeValue('gray.500', 'gray.400');
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.700');

  if (!workout) return null;

  // Get workout data
  const allExercises = getExercisesFromWorkout(workout);
  const workoutBlocks = getBlocksFromWorkout(workout);
  const isBlockBased = (workout as any).is_block_based;

  // Format date
  const formattedDate = workout.date 
    ? format(new Date(workout.date), 'MMM d, yyyy')
    : 'No date set';

  const WorkoutContent = () => (
    <VStack spacing={6} align="stretch" p={6}>
      {/* Workout Header */}
      <VStack spacing={4} align="stretch">
        <HStack spacing={3} align="center">
          <Box 
            bg="blue.500" 
            borderRadius="full" 
            p={3} 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
          >
            <Icon 
              as={workout.type ? getTypeIcon(workout.type).type : FaRunning} 
              color="white" 
              boxSize={6} 
            />
          </Box>
          <VStack align="start" spacing={1} flex="1">
            <Text fontSize="xl" fontWeight="bold" color={drawerText}>
              {workout.name}
            </Text>
            <HStack spacing={2}>
              <Badge colorScheme="blue" fontSize="sm">
                {workout.type || 'Running'}
              </Badge>
              {isBlockBased && (
                <Badge colorScheme="green" fontSize="sm">
                  Block Mode
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>

        {/* Workout Details */}
        <VStack spacing={3} align="stretch">
          {workout.description && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color={sectionTitleColor} mb={2}>
                Description
              </Text>
              <Text fontSize="sm" color={drawerText}>
                {workout.description}
              </Text>
            </Box>
          )}

          <HStack spacing={6}>
            {workout.date && (
              <HStack spacing={2}>
                <Icon as={FaCalendarAlt} color={sectionTitleColor} />
                <Text fontSize="sm" color={drawerText}>{formattedDate}</Text>
              </HStack>
            )}
            {(workout as any).estimated_duration && (
              <HStack spacing={2}>
                <Icon as={FaClock} color={sectionTitleColor} />
                <Text fontSize="sm" color={drawerText}>{(workout as any).estimated_duration}</Text>
              </HStack>
            )}
            {(workout as any).location && (
              <HStack spacing={2}>
                <Icon as={FaMapMarkerAlt} color={sectionTitleColor} />
                <Text fontSize="sm" color={drawerText}>{(workout as any).location}</Text>
              </HStack>
            )}
          </HStack>
        </VStack>
      </VStack>

      <Divider />

      {/* Exercises/Blocks Content */}
      {workoutBlocks.length > 0 ? (
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color={drawerText}>
            Workout Blocks ({workoutBlocks.length})
          </Text>
          <Accordion allowMultiple>
            {workoutBlocks.map((block, blockIndex) => (
              <AccordionItem key={blockIndex} border="1px" borderColor={borderColor} borderRadius="md" mb={2}>
                <AccordionButton bg={exerciseCardBg} borderRadius="md">
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="medium" color={drawerText}>
                      Block {blockIndex + 1}: {block.name || `Block ${blockIndex + 1}`}
                    </Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={3} align="stretch">
                    {block.exercises?.map((exercise, exerciseIndex) => (
                      <Box key={exerciseIndex} p={3} bg={exerciseCardBg} borderRadius="md">
                        <VStack spacing={2} align="stretch">
                          <HStack align="center" spacing={3}>
                            <Text fontWeight="medium" color={drawerText}>
                              {exercise.name}
                            </Text>
                            {exercise.sets && exercise.reps && (
                              <Text fontSize="sm" color={sectionTitleColor}>
                                {exercise.sets} sets × {exercise.reps} reps
                              </Text>
                            )}
                          </HStack>
                          {exercise.rest && (
                            <Text fontSize="sm" color={sectionTitleColor}>
                              Rest: {exercise.rest}
                            </Text>
                          )}
                          {exercise.distance && (
                            <Text fontSize="sm" color={sectionTitleColor}>
                              Distance: {exercise.distance}
                            </Text>
                          )}
                          {exercise.notes && (
                            <Text fontSize="sm" color={drawerText}>
                              {exercise.notes}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </VStack>
      ) : (
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="bold" color={drawerText}>
            Exercises ({allExercises.length})
          </Text>
          <VStack spacing={3} align="stretch">
            {allExercises.map((exercise, index) => (
              <Box key={index} p={4} bg={exerciseCardBg} borderRadius="md">
                <VStack spacing={2} align="stretch">
                  <HStack align="center" spacing={3}>
                    <Text fontWeight="medium" color={drawerText}>
                      {exercise.name}
                    </Text>
                    {exercise.sets && exercise.reps && (
                      <Text fontSize="sm" color={sectionTitleColor}>
                        {exercise.sets} sets × {exercise.reps} reps
                      </Text>
                    )}
                  </HStack>
                  {exercise.rest && (
                    <Text fontSize="sm" color={sectionTitleColor}>
                      Rest: {exercise.rest}
                    </Text>
                  )}
                  {exercise.distance && (
                    <Text fontSize="sm" color={sectionTitleColor}>
                      Distance: {exercise.distance}
                    </Text>
                  )}
                  {exercise.notes && (
                    <Text fontSize="sm" color={drawerText}>
                      {exercise.notes}
                    </Text>
                  )}
                </VStack>
              </Box>
            ))}
          </VStack>
        </VStack>
      )}

      {/* Additional Notes */}
      {workout.notes && (
        <>
          <Divider />
          <VStack spacing={2} align="stretch">
            <Text fontSize="lg" fontWeight="bold" color={drawerText}>
              Notes
            </Text>
            <Text fontSize="sm" color={drawerText}>
              {workout.notes}
            </Text>
          </VStack>
        </>
      )}
    </VStack>
  );

  // Mobile: Bottom drawer using Modal
  if (isMobile) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        motionPreset="slideInBottom"
        closeOnOverlayClick={true}
      >
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent 
          position="fixed"
          bottom="0"
          left="0"
          right="0"
          top="auto"
          height="auto"
          maxHeight="90vh"
          minHeight="300px"
          borderRadius="16px 16px 0 0"
          bg={drawerBg}
          border={`1px solid ${borderColor}`}
          boxShadow="2xl"
          margin="0"
          maxWidth="100vw"
          width="100vw"
          display="flex"
          flexDirection="column"
        >
          <ModalBody p={0} h="100%" display="flex" flexDirection="column" overflowY="auto">
            {/* Header */}
            <Flex 
              justify="space-between" 
              align="center" 
              p={6} 
              borderBottom={`1px solid ${borderColor}`}
              flexShrink={0}
              bg={drawerBg}
              position="sticky"
              top={0}
              zIndex={1}
            >
              <Text fontSize="xl" fontWeight="bold" color={drawerText}>
                Workout Details
              </Text>
              <IconButton
                aria-label="Close workout details"
                icon={<Icon as={FaSignOutAlt} transform="rotate(180deg)" />}
                size="lg"
                variant="ghost"
                borderRadius="full"
                onClick={onClose}
                color={drawerText}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                fontSize="18px"
              />
            </Flex>
            
            {/* Content */}
            <Box flex="1" overflowY="auto">
              <WorkoutContent />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  // Desktop: Right-side drawer
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay bg="blackAlpha.600" />
      <DrawerContent bg={drawerBg} maxW="600px">
        <DrawerCloseButton 
          size="lg" 
          color={drawerText}
          _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
        />
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
          <Text fontSize="xl" fontWeight="bold" color={drawerText}>
            Workout Details
          </Text>
        </DrawerHeader>
        <DrawerBody p={0} overflowY="auto">
          <WorkoutContent />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}; 