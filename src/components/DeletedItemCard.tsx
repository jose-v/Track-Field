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
} from '@chakra-ui/react';
import { FaUndo, FaTrashAlt, FaCalendarAlt, FaDumbbell, FaClock, FaUser } from 'react-icons/fa';
import type { Workout } from '../services/api';
import type { TrainingPlan } from '../services/dbSchema';

interface DeletedItemCardProps {
  item: Workout | TrainingPlan;
  type: 'workout' | 'monthlyPlan';
  onRestore: (id: string) => Promise<void>;
  onPermanentDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
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

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('red.200', 'red.700');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const headerBg = useColorModeValue('red.50', 'red.900');
  const iconColor = useColorModeValue('red.500', 'red.400');

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

  const getDeletedDate = () => {
    const deletedAt = (item as any).deleted_at;
    if (!deletedAt) return 'Unknown';
    
    const date = new Date(deletedAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemInfo = () => {
    if (type === 'workout') {
      const workout = item as Workout;
      return {
        icon: <FaDumbbell size={20} />,
        title: workout.name,
        subtitle: `${workout.type} workout`,
        details: [
          workout.date && `Date: ${new Date(workout.date).toLocaleDateString()}`,
          workout.duration && `Duration: ${workout.duration}`,
          workout.location && `Location: ${workout.location}`,
        ].filter(Boolean)
      };
    } else {
      const plan = item as TrainingPlan;
      return {
        icon: <FaCalendarAlt size={20} />,
        title: plan.name,
        subtitle: `${new Date(0, plan.month - 1).toLocaleDateString('en-US', { month: 'long' })} ${plan.year} plan`,
        details: [
          plan.description && `Description: ${plan.description}`,
          `${plan.weeks?.length || 0} weeks planned`,
        ].filter(Boolean)
      };
    }
  };

  const itemInfo = getItemInfo();

  return (
    <>
      <Card 
        variant="outline" 
        borderColor={borderColor}
        borderWidth="2px"
        bg={cardBg}
        opacity={isLoading ? 0.6 : 1}
        position="relative"
        _hover={{
          transform: isLoading ? 'none' : 'translateY(-2px)',
          boxShadow: 'lg'
        }}
        transition="all 0.2s"
      >
        {/* Deleted status header */}
        <Box bg={headerBg} px={4} py={2} borderTopRadius="md">
          <HStack justify="space-between" align="center">
            <HStack spacing={2}>
              <Box color={iconColor}>
                <FaTrashAlt size={14} />
              </Box>
              <Text fontSize="sm" fontWeight="semibold" color={iconColor}>
                Deleted
              </Text>
            </HStack>
            <Text fontSize="xs" color={subtitleColor}>
              {getDeletedDate()}
            </Text>
          </HStack>
        </Box>

        <CardBody p={6}>
          <VStack spacing={4} align="stretch">
            {/* Item info */}
            <HStack spacing={3}>
              <Box color={iconColor}>
                {itemInfo.icon}
              </Box>
              <VStack align="start" spacing={1} flex="1">
                <Heading size="md" color={textColor} noOfLines={1}>
                  {itemInfo.title}
                </Heading>
                <Text fontSize="sm" color={subtitleColor}>
                  {itemInfo.subtitle}
                </Text>
              </VStack>
            </HStack>

            {/* Details */}
            {itemInfo.details.length > 0 && (
              <VStack align="start" spacing={1}>
                {itemInfo.details.map((detail, index) => (
                  <Text key={index} fontSize="sm" color={subtitleColor}>
                    {detail}
                  </Text>
                ))}
              </VStack>
            )}

            {/* Warning */}
            <Alert status="warning" borderRadius="md" size="sm">
              <AlertIcon />
              <Text fontSize="sm">
                This item is in the recycle bin. You can restore it or delete it permanently.
              </Text>
            </Alert>

            {/* Actions */}
            <HStack spacing={3} pt={2}>
              <Tooltip label="Restore this item" placement="top">
                <Button
                  leftIcon={<FaUndo />}
                  colorScheme="green"
                  variant="outline"
                  size="sm"
                  onClick={handleRestore}
                  isLoading={isRestoring}
                  loadingText="Restoring..."
                  flex="1"
                >
                  Restore
                </Button>
              </Tooltip>
              
              <Tooltip label="Delete permanently (cannot be undone)" placement="top">
                <Button
                  leftIcon={<FaTrashAlt />}
                  colorScheme="red"
                  variant="solid"
                  size="sm"
                  onClick={onOpen}
                  isLoading={isDeleting}
                  flex="1"
                >
                  Delete Forever
                </Button>
              </Tooltip>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Permanent delete confirmation modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <Box color="red.500">
                <FaTrashAlt />
              </Box>
              <Text>Confirm Permanent Deletion</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="start">
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  This action cannot be undone. The {type === 'workout' ? 'workout' : 'training plan'} will be permanently deleted from the system.
                </Text>
              </Alert>
              
              <Text>
                Are you sure you want to permanently delete <strong>"{itemInfo.title}"</strong>?
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handlePermanentDelete}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete Forever
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}; 