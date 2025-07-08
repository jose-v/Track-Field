import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Button,
  Box,
  useColorModeValue,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Icon,
  Flex
} from '@chakra-ui/react';
import { FaUndo, FaTrashAlt, FaCalendarAlt, FaDumbbell, FaClock, FaUser, FaLayerGroup, FaExclamationTriangle } from 'react-icons/fa';
import type { Workout } from '../services/api';
import type { TrainingPlan } from '../services/dbSchema';
import { format } from 'date-fns';

interface DeletedItemCardProps {
  item: Workout | TrainingPlan;
  type: 'workout' | 'monthlyPlan';
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

// Shared utility functions (matching DeletedWorkoutCard)
function getTypeIcon(type: string | undefined) {
  switch (type) {
    case 'Strength': return <FaDumbbell />;
    case 'Running': return <FaDumbbell />;
    case 'Flexibility': return <FaDumbbell />;
    case 'Recovery': return <FaDumbbell />;
    default: return <FaDumbbell />;
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

export const DeletedItemCard: React.FC<DeletedItemCardProps> = ({
  item,
  type,
  onRestore,
  onPermanentDelete,
  isLoading = false
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Theme colors - matching athlete DeletedWorkoutCard exactly
  const borderColor = useColorModeValue('red.200', 'red.700');
  const cardBg = useColorModeValue('red.50', 'red.900');
  const headerBg = useColorModeValue('red.100', 'red.800');
  const titleColor = useColorModeValue('red.800', 'red.100');
  const textColor = useColorModeValue('red.600', 'red.200');
  const iconColor = useColorModeValue('red.500', 'red.300');

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await onRestore(item.id);
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    setIsDeleting(true);
    try {
      await onPermanentDelete(item.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  // Format dates to match DeletedWorkoutCard
  const deletedDate = (item as any).deleted_at 
    ? format(new Date((item as any).deleted_at), 'MMM d, yyyy')
    : 'Unknown';
  
  const createdDate = item.created_at 
    ? format(new Date(item.created_at), 'MMM d, yyyy')
    : 'Unknown';

  // Get item-specific info
  const getItemInfo = () => {
    if (type === 'workout') {
      const workout = item as Workout;
      return {
        icon: getTypeIcon(workout.type),
        title: workout.name,
        subtitle: workout.type || 'Workout',
        exerciseCount: Array.isArray(workout.exercises) ? workout.exercises.length : 0,
        duration: workout.duration,
        templateType: (workout as any).template_type,
        isBlockBased: (workout as any).is_block_based
      };
          } else {
        const plan = item as TrainingPlan;
        return {
          icon: <FaCalendarAlt />,
          title: plan.name,
          subtitle: 'Monthly Plan',
          exerciseCount: 0, // Plans don't have direct exercises
          duration: `${(plan as any).weeks?.length || 0} weeks`,
          templateType: 'monthly',
          isBlockBased: false
        };
      }
  };

  const itemInfo = getItemInfo();

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
        {/* Header - matching athlete style exactly */}
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
                as={itemInfo.icon.type} 
                color="white" 
                boxSize={5} 
              />
            </Box>
            <VStack align="start" spacing={0}>
              <Badge colorScheme={getTypeColor(itemInfo.subtitle)} variant="solid" fontSize="xs">
                {itemInfo.subtitle}
              </Badge>
              {itemInfo.templateType && (
                <Badge colorScheme="purple" variant="outline" fontSize="xs">
                  {itemInfo.templateType.toUpperCase()}
                </Badge>
              )}
              {itemInfo.isBlockBased && (
                <Badge colorScheme="green" variant="outline" fontSize="xs">
                  <HStack spacing={1}>
                    <Icon as={FaLayerGroup} boxSize={2} color="green.500" />
                    <Text>BLOCKS</Text>
                  </HStack>
                </Badge>
              )}
            </VStack>
          </HStack>
          
          <Icon as={FaTrashAlt} color={iconColor} />
        </Box>

        <CardBody p={4}>
          <VStack align="stretch" spacing={3}>
            {/* Title */}
            <VStack align="start" spacing={1}>
              <Heading size="md" color={titleColor} noOfLines={2}>
                {itemInfo.title}
              </Heading>
            </VStack>

            {/* Workout Details - matching athlete style */}
            <VStack align="start" spacing={2}>
              <HStack spacing={4}>
                <HStack spacing={1}>
                  <Icon as={FaDumbbell} boxSize={3} color={textColor} />
                  <Text fontSize="sm" color={textColor}>
                    {type === 'workout' ? 
                      `${itemInfo.exerciseCount} exercise${itemInfo.exerciseCount !== 1 ? 's' : ''}` :
                      `${itemInfo.duration}`
                    }
                  </Text>
                </HStack>
                {itemInfo.duration && type === 'workout' && (
                  <HStack spacing={1}>
                    <Icon as={FaClock} boxSize={3} color={textColor} />
                    <Text fontSize="sm" color={textColor}>
                      {itemInfo.duration}
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

            {/* Action Buttons - matching athlete style exactly */}
            <HStack spacing={2} pt={2}>
              <Button
                size="sm"
                leftIcon={<FaUndo />}
                colorScheme="green"
                variant="solid"
                onClick={handleRestore}
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
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Permanent Delete Confirmation Dialog - matching athlete style */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="lg" fontWeight="bold" color="red.500">
            Permanently Delete {type === 'workout' ? 'Workout' : 'Training Plan'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={4}>
              <HStack spacing={2}>
                <Icon as={FaExclamationTriangle} color="red.500" />
                <Text fontWeight="bold">This action cannot be undone!</Text>
              </HStack>
              <Text>
                Are you sure you want to permanently delete "{itemInfo.title}"? 
                This will remove it completely from the system.
              </Text>
              <Box bg="red.50" p={3} borderRadius="md" borderLeft="4px solid" borderColor="red.500">
                <Text fontSize="sm" color="red.700">
                  ⚠️ This {type === 'workout' ? 'workout' : 'training plan'} will be permanently removed and cannot be recovered.
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
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}; 