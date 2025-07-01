import React from 'react';
import {
  Box, Card, CardBody, Heading, Text, Icon, Flex, HStack, VStack, 
  Button, Badge, useColorModeValue, Tooltip, AlertDialog, AlertDialogOverlay,
  AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
  useDisclosure
} from '@chakra-ui/react';
import { FaRunning, FaDumbbell, FaLeaf, FaRedo, FaUndo, FaTrashAlt, FaUser, FaCalendarAlt, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import type { Workout } from '../../services/api';
import { dateUtils } from '../../utils/date';
import { format } from 'date-fns';
import { useRef } from 'react';

// Shared utility functions
function getTypeIcon(type: string | undefined) {
  switch (type) {
    case 'Strength': return <FaDumbbell />;
    case 'Running': return <FaRunning />;
    case 'Flexibility': return <FaLeaf />;
    case 'Recovery': return <FaRedo />;
    default: return <FaRunning />;
  }
}

function getTypeColor(type: string | undefined) {
  switch (type) {
    case 'Strength': return 'blue';
    case 'Running': return 'green';
    case 'Flexibility': return 'purple';
    case 'Recovery': return 'orange';
    default: return 'blue';
  }
}

interface DeletedWorkoutCardProps {
  workout: Workout;
  userRole: 'coach' | 'athlete';
  currentUserId: string;
  creatorName?: string;
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete: (id: string) => Promise<void>;
  isRestoring?: boolean;
  isDeleting?: boolean;
}

export function DeletedWorkoutCard({
  workout,
  userRole,
  currentUserId,
  creatorName,
  onRestore,
  onPermanentDelete,
  isRestoring = false,
  isDeleting = false
}: DeletedWorkoutCardProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Theme colors
  const borderColor = useColorModeValue('red.200', 'red.700');
  const cardBg = useColorModeValue('red.50', 'red.900');
  const headerBg = useColorModeValue('red.100', 'red.800');
  const titleColor = useColorModeValue('red.800', 'red.100');
  const textColor = useColorModeValue('red.600', 'red.200');
  const iconColor = useColorModeValue('red.500', 'red.300');

  // Determine if user can restore/delete this workout
  const canModify = userRole === 'coach' || workout.user_id === currentUserId;
  
  // Format dates
  const deletedDate = workout.deleted_at 
    ? format(new Date(workout.deleted_at), 'MMM d, yyyy')
    : 'Unknown';
  
  const createdDate = workout.created_at 
    ? format(new Date(workout.created_at), 'MMM d, yyyy')
    : 'Unknown';

  // Get exercises count
  const exerciseCount = Array.isArray(workout.exercises) ? workout.exercises.length : 0;

  const handlePermanentDelete = () => {
    onPermanentDelete(workout.id);
    onClose();
  };

  return (
    <>
      <Card 
        borderRadius="xl" 
        overflow="hidden" 
        borderWidth="2px" 
        borderColor={borderColor}
        bg={cardBg}
        opacity={0.8}
        transition="all 0.2s"
        _hover={{ opacity: 1, transform: 'translateY(-2px)' }}
        h="100%"
      >
        {/* Header */}
        <Box 
          bg={headerBg}
          px={4} 
          py={3} 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between"
        >
          <HStack spacing={3}>
            <Box 
              bg="rgba(255, 255, 255, 0.3)" 
              borderRadius="full" 
              p={2} 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
            >
              <Icon 
                as={getTypeIcon(workout.type).type} 
                color="white" 
                boxSize={5} 
              />
            </Box>
            <VStack align="start" spacing={0}>
              <Badge colorScheme={getTypeColor(workout.type)} variant="solid" fontSize="xs">
                {workout.type || 'Workout'}
              </Badge>
              {workout.template_type && (
                <Badge colorScheme="purple" variant="outline" fontSize="xs">
                  {workout.template_type.toUpperCase()}
                </Badge>
              )}
            </VStack>
          </HStack>
          
          <Icon as={FaTrashAlt} color={iconColor} />
        </Box>

        <CardBody p={4}>
          <VStack align="stretch" spacing={3}>
            {/* Title and Creator */}
            <VStack align="start" spacing={1}>
              <Heading size="md" color={titleColor} noOfLines={2}>
                {workout.name}
              </Heading>
              {creatorName && userRole === 'athlete' && (
                <HStack spacing={1}>
                  <Icon as={FaUser} boxSize={3} color={textColor} />
                  <Text fontSize="sm" color={textColor}>
                    Created by {creatorName}
                  </Text>
                </HStack>
              )}
            </VStack>

            {/* Workout Details */}
            <VStack align="start" spacing={2}>
              <HStack spacing={4}>
                <HStack spacing={1}>
                  <Icon as={FaDumbbell} boxSize={3} color={textColor} />
                  <Text fontSize="sm" color={textColor}>
                    {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                  </Text>
                </HStack>
                {workout.duration && (
                  <HStack spacing={1}>
                    <Icon as={FaClock} boxSize={3} color={textColor} />
                    <Text fontSize="sm" color={textColor}>
                      {workout.duration}
                    </Text>
                  </HStack>
                )}
              </HStack>

              <HStack spacing={4}>
                <HStack spacing={1}>
                  <Icon as={FaCalendarAlt} boxSize={3} color={textColor} />
                  <Text fontSize="sm" color={textColor}>
                    Created: {createdDate}
                  </Text>
                </HStack>
              </HStack>

              <HStack spacing={1}>
                <Icon as={FaTrashAlt} boxSize={3} color={textColor} />
                <Text fontSize="sm" color={textColor}>
                  Deleted: {deletedDate}
                </Text>
              </HStack>
            </VStack>

            {/* Notes */}
            {workout.notes && (
              <Box>
                <Text fontSize="sm" color={textColor} noOfLines={2}>
                  {workout.notes}
                </Text>
              </Box>
            )}

            {/* Action Buttons */}
            <HStack spacing={2} pt={2}>
              {canModify ? (
                <>
                  <Button
                    size="sm"
                    leftIcon={<FaUndo />}
                    colorScheme="green"
                    variant="solid"
                    onClick={() => onRestore(workout.id)}
                    isLoading={isRestoring}
                    loadingText="Restoring..."
                    flex={1}
                  >
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<FaTrashAlt />}
                    colorScheme="red"
                    variant="outline"
                    onClick={onOpen}
                    isLoading={isDeleting}
                    loadingText="Deleting..."
                    flex={1}
                  >
                    Delete Forever
                  </Button>
                </>
              ) : (
                <Tooltip label="You can only restore workouts you created">
                  <Box w="100%">
                    <Button
                      size="sm"
                      leftIcon={<FaExclamationTriangle />}
                      colorScheme="gray"
                      variant="outline"
                      isDisabled
                      w="100%"
                    >
                      No Permission
                    </Button>
                  </Box>
                </Tooltip>
              )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.500">
              Permanently Delete Workout
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack align="start" spacing={4}>
                <HStack spacing={2}>
                  <Icon as={FaExclamationTriangle} color="red.500" />
                  <Text fontWeight="bold">This action cannot be undone!</Text>
                </HStack>
                <Text>
                  Are you sure you want to permanently delete "{workout.name}"? 
                  This will remove it completely from the system.
                </Text>
                <Box bg="red.50" p={3} borderRadius="md" borderLeft="4px solid" borderColor="red.500">
                  <Text fontSize="sm" color="red.700">
                    ⚠️ This workout will be permanently removed and cannot be recovered.
                  </Text>
                </Box>
                
                {/* Confirmation Buttons */}
                <HStack spacing={3} width="100%" pt={2}>
                  <Button 
                    ref={cancelRef} 
                    onClick={onClose} 
                    flex={1}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="red" 
                    onClick={handlePermanentDelete}
                    isLoading={isDeleting}
                    loadingText="Deleting..."
                    flex={1}
                  >
                    Delete Forever
                  </Button>
                </HStack>
              </VStack>
            </AlertDialogBody>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
} 