import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import {
  Box,
  Text,
  Button,
  Input,
  Select,
  VStack,
  HStack,
  Badge,
  IconButton,
  useColorModeValue,
  Flex,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Center,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useToast,
  Heading,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tag,
  Tooltip,
  Image,
  Avatar,
  ButtonGroup,
} from '@chakra-ui/react';
import { 
  Search, 
  Plus, 
  X, 
  Activity, 
  Clock, 
  Target, 
  Dumbbell, 
  Heart,
  Edit3,
  Trash2,
  Filter,
  ChevronDown,
  BookOpen,
  Grid3X3,
  List,
  MoreVertical
} from 'lucide-react';
import { ExerciseModal } from './ExerciseModal';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
  video_url?: string;
  default_instructions?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  muscle_groups?: string[];
  equipment?: string[];
  user_id?: string;
  is_system_exercise?: boolean;
  is_public?: boolean;
  organization_id?: string;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string; // For attribution
  sharing_info?: string; // For filtering (Private, Team, Public, System)
}

interface ExerciseLibraryProps {
  exercises: Exercise[];
  onAddExercise: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  onUpdateExercise: (id: string, exercise: Omit<Exercise, 'id'>) => Promise<void>;
  onDeleteExercise: (id: string) => Promise<void>;
  isLoading?: boolean;
  showAddButton?: boolean;
  title?: string;
  subtitle?: string;
  onExerciseSelect?: (exercise: Exercise) => void;
  selectionMode?: boolean;
  selectedExercises?: string[];
  currentUserId?: string; // For filtering "mine" exercises
  userTeams?: Array<{ id: string; name: string }>; // For filtering team exercises
  onAddButtonClick?: (openModal: () => void) => void; // Expose the add button click function
  enableDrag?: boolean; // Controls whether exercises can be dragged
}

const PREDEFINED_CATEGORIES = [
  'strength',
  'running', 
  'plyometric',
  'flexibility',
  'warm_up',
  'cool_down',
  'drill',
  'recovery',
  'custom'
];

const EXERCISE_SOURCES = [
  'all',
  'system',
  'public',
  'mine',
  'team'
];

const SOURCE_LABELS = {
  'all': 'All Exercises',
  'system': 'System Exercises',
  'public': 'Public Community',
  'mine': 'My Exercises',
  'team': 'Team Exercises'
};

const SOURCE_COLORS = {
  'system': 'blue',
  'public': 'green', 
  'mine': 'purple',
  'team': 'orange'
};

const DIFFICULTY_COLORS = {
  'Beginner': 'green',
  'Intermediate': 'yellow',
  'Advanced': 'red'
};

export interface ExerciseLibraryRef {
  openAddModal: () => void;
}

// Custom Exercise Avatar Component with Fallback Support
interface ExerciseAvatarProps {
  exercise: Exercise;
  size: 'md' | 'lg';
  getExerciseImage: (exercise: Exercise) => string | null;
  [key: string]: any; // Allow other Avatar props
}

const ExerciseAvatar: React.FC<ExerciseAvatarProps> = ({ 
  exercise, 
  size, 
  getExerciseImage, 
  ...avatarProps 
}) => {
  const [imageSrc, setImageSrc] = React.useState<string | undefined>(undefined);
  const [hasError, setHasError] = React.useState(false);

  // Helper function to get fallback image paths
  const getImagePaths = React.useCallback((exercise: Exercise): string[] => {
    const sanitizedName = exercise.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const categoryMap: Record<string, string> = {
      'warm_up': 'warmup',
      'cool_down': 'cooldown',
      'plyometric': 'plyometric',
      'flexibility': 'flexibility',
      'strength': 'strength',
      'running': 'running',
      'drill': 'drill',
      'recovery': 'recovery',
      'custom': 'strength'
    };

    const directoryName = categoryMap[exercise.category] || exercise.category.toLowerCase();
    
    return [
      `/exercise-media/thumbnails/${directoryName}/${sanitizedName}.png`,
      `/exercise-media/images/${directoryName}/${sanitizedName}.png`
    ];
  }, []);

  // Try to load images with fallback
  React.useEffect(() => {
    if (exercise.video_url) {
      const youtubeMatch = exercise.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (youtubeMatch) {
        setImageSrc(`https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`);
        setHasError(false);
        return;
      }
    }

    const imagePaths = getImagePaths(exercise);
    let currentIndex = 0;

    const tryNextImage = () => {
      if (currentIndex >= imagePaths.length) {
        setImageSrc(undefined);
        setHasError(true);
        return;
      }

      const img = document.createElement('img');
      img.onload = () => {
        setImageSrc(imagePaths[currentIndex]);
        setHasError(false);
      };
      img.onerror = () => {
        currentIndex++;
        tryNextImage();
      };
      img.src = imagePaths[currentIndex];
    };

    tryNextImage();
  }, [exercise, getImagePaths]);

  return (
    <Avatar
      src={imageSrc}
      name={exercise.name}
      size={size}
      bg="gray.800"
      icon={<Dumbbell size={size === 'lg' ? 24 : 20} />}
      sx={{
        '& img': {
          imageRendering: 'auto',
          objectFit: 'cover',
          filter: 'none',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitFontSmoothing: 'antialiased'
        }
      }}
      {...avatarProps}
    />
  );
};

// Exercise Card Components (moved outside main component to fix hooks order)
interface ExerciseCardProps {
  exercise: Exercise;
  onEditExercise: (exercise: Exercise) => void;
  onDeleteClick: (exercise: Exercise) => void;
  onExerciseClick: (exercise: Exercise) => void;
  isExerciseSelected: (exerciseId: string) => boolean;
  getExerciseImage: (exercise: Exercise) => string | null;
  selectionMode: boolean;
  currentUserId?: string;
  enableDrag: boolean;
}

const ExerciseGridCard: React.FC<ExerciseCardProps> = ({ 
  exercise,
  onEditExercise,
  onDeleteClick,
  onExerciseClick,
  isExerciseSelected,
  getExerciseImage,
  selectionMode,
  currentUserId,
  enableDrag
}) => {
  // Theme colors
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.700');
  const exerciseCardHoverBg = useColorModeValue('gray.100', 'gray.600');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  
  // Selection mode colors
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedHoverBg = useColorModeValue('blue.100', 'blue.800');
  const selectedBorderColor = useColorModeValue('blue.400', 'blue.300');
  const selectedTextColor = useColorModeValue('blue.800', 'blue.100');

  const isAlreadySelected = selectionMode && isExerciseSelected(exercise.id);
  
  return (
    <Card
      variant="outline"
      bg={isAlreadySelected ? selectedBg : exerciseCardBg}
      borderColor={isAlreadySelected ? selectedBorderColor : borderColor}
      borderWidth={isAlreadySelected ? '2px' : '1px'}
      _hover={{ 
        bg: isAlreadySelected ? selectedHoverBg : exerciseCardHoverBg, 
        borderColor: selectedBorderColor,
        cursor: enableDrag ? 'grab' : 'pointer'
      }}
      transition="all 0.2s"
      onClick={() => onExerciseClick(exercise)}
      position="relative"
      h="280px"
    >
      {/* Action Menu - Positioned at top-right */}
      {!exercise.is_system_exercise && exercise.user_id === currentUserId && !selectionMode && (
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<MoreVertical size={16} />}
            size="sm"
            variant="ghost"
            colorScheme="gray"
            position="absolute"
            top={2}
            right={2}
            zIndex={2}
            onClick={(e) => e.stopPropagation()}
            _hover={{ bg: 'blackAlpha.100' }}
          />
          <MenuList>
            <MenuItem
              icon={<Edit3 size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                onEditExercise(exercise);
              }}
            >
              Edit Exercise
            </MenuItem>
            <MenuItem
              icon={<Trash2 size={16} />}
              color="red.500"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(exercise);
              }}
            >
              Delete Exercise
            </MenuItem>
          </MenuList>
        </Menu>
      )}

      <CardBody p={4} display="flex" flexDirection="column" h="full">
        {/* Exercise Image */}
        <Box mb={3} display="flex" justifyContent="center">
          <ExerciseAvatar
            exercise={exercise}
            size="lg"
            getExerciseImage={getExerciseImage}
          />
        </Box>

        {/* Header */}
        <VStack spacing={2} align="stretch" flex="1">
          <Text fontWeight="bold" fontSize="md" color={isAlreadySelected ? selectedTextColor : textColor} noOfLines={2} textAlign="center">
            {exercise.name}
          </Text>
          
          <HStack spacing={1} justify="center" wrap="wrap">
            <Tag size="sm" colorScheme="blue" variant="subtle">
              {exercise.category}
            </Tag>
            {exercise.difficulty && (
              <Badge 
                size="sm" 
                colorScheme={DIFFICULTY_COLORS[exercise.difficulty]}
                variant="subtle"
              >
                {exercise.difficulty}
              </Badge>
            )}
          </HStack>

          {/* Source Badge */}
          <Center>
            {exercise.is_system_exercise ? (
              <Badge size="sm" colorScheme="blue" variant="solid">
                System
              </Badge>
            ) : exercise.is_public ? (
              <Badge size="sm" colorScheme="green" variant="solid">
                Public
              </Badge>
            ) : exercise.organization_id ? (
              <Badge size="sm" colorScheme="orange" variant="solid">
                Team
              </Badge>
            ) : (
              <Badge size="sm" colorScheme="purple" variant="solid">
                Mine
              </Badge>
            )}
            {isAlreadySelected && (
              <Badge size="sm" colorScheme="green" variant="solid" ml={1}>
                ✓ Added
              </Badge>
            )}
          </Center>

          {/* Description */}
          <Text fontSize="sm" color={isAlreadySelected ? selectedTextColor : subtitleColor} noOfLines={3} textAlign="center" flex="1">
            {exercise.description}
          </Text>
        </VStack>

        {/* Selection Mode Add Button */}
        {selectionMode && !isAlreadySelected && (
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onExerciseClick(exercise);
            }}
            leftIcon={<Plus size={14} />}
            mt={2}
          >
            Add
          </Button>
        )}
      </CardBody>
    </Card>
  );
};

const ExerciseListCard: React.FC<ExerciseCardProps> = ({ 
  exercise,
  onEditExercise,
  onDeleteClick,
  onExerciseClick,
  isExerciseSelected,
  getExerciseImage,
  selectionMode,
  currentUserId,
  enableDrag
}) => {
  // Theme colors
  const exerciseCardBg = useColorModeValue('gray.50', 'gray.600');
  const exerciseCardHoverBg = useColorModeValue('gray.100', 'gray.500');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  
  // Selection mode colors
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const selectedHoverBg = useColorModeValue('blue.100', 'blue.800');
  const selectedBorderColor = useColorModeValue('blue.400', 'blue.300');
  const selectedTextColor = useColorModeValue('blue.800', 'blue.100');

  const isAlreadySelected = selectionMode && isExerciseSelected(exercise.id);
  
  return (
    <Card
      variant="outline"
      bg={isAlreadySelected ? selectedBg : exerciseCardBg}
      borderColor={isAlreadySelected ? selectedBorderColor : borderColor}
      borderWidth={isAlreadySelected ? '2px' : '1px'}
      _hover={{ 
        bg: isAlreadySelected ? selectedHoverBg : exerciseCardHoverBg, 
        borderColor: selectedBorderColor,
        cursor: enableDrag ? 'grab' : 'pointer'
      }}
      transition="all 0.2s"
      onClick={() => onExerciseClick(exercise)}
    >
      <CardBody p={3}>
        <HStack spacing={3} align="center">
          {/* Exercise Image */}
          <ExerciseAvatar
            exercise={exercise}
            size="md"
            getExerciseImage={getExerciseImage}
            flexShrink={0}
          />

          {/* Content */}
          <VStack align="start" spacing={1} flex="1" minW={0}>
            <HStack spacing={2} align="center" w="full">
              <Text fontWeight="bold" fontSize="md" color={isAlreadySelected ? selectedTextColor : textColor} noOfLines={1} flex="1">
                {exercise.name}
              </Text>
              
              {/* Tags */}
              <HStack spacing={1}>
                <Tag size="sm" colorScheme="blue" variant="subtle">
                  {exercise.category}
                </Tag>
                {exercise.difficulty && (
                  <Badge 
                    size="sm" 
                    colorScheme={DIFFICULTY_COLORS[exercise.difficulty]}
                    variant="subtle"
                  >
                    {exercise.difficulty}
                  </Badge>
                )}
              </HStack>
            </HStack>
            
            <Text fontSize="sm" color={isAlreadySelected ? selectedTextColor : subtitleColor} noOfLines={2} w="full">
              {exercise.description}
            </Text>

            {/* Source and Selection Info */}
            <HStack spacing={2} w="full">
              {exercise.is_system_exercise ? (
                <Badge size="sm" colorScheme="blue" variant="solid">
                  System
                </Badge>
              ) : exercise.is_public ? (
                <Badge size="sm" colorScheme="green" variant="solid">
                  Public
                </Badge>
              ) : exercise.organization_id ? (
                <Badge size="sm" colorScheme="orange" variant="solid">
                  Team
                </Badge>
              ) : (
                <Badge size="sm" colorScheme="purple" variant="solid">
                  Mine
                </Badge>
              )}
              {isAlreadySelected && (
                <Badge size="sm" colorScheme="green" variant="solid">
                  ✓ Added
                </Badge>
              )}
            </HStack>
          </VStack>

          {/* Action Buttons */}
          <VStack spacing={2}>
            {/* Selection Mode Add Button */}
            {selectionMode && !isAlreadySelected && (
              <IconButton
                size="sm"
                colorScheme="blue"
                variant="outline"
                icon={<Plus size={14} />}
                aria-label="Add exercise"
                onClick={(e) => {
                  e.stopPropagation();
                  onExerciseClick(exercise);
                }}
              />
            )}

            {/* Action Menu - Positioned at right side */}
            {!exercise.is_system_exercise && exercise.user_id === currentUserId && !selectionMode && (
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<MoreVertical size={16} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={(e) => e.stopPropagation()}
                  _hover={{ bg: 'blackAlpha.100' }}
                />
                <MenuList>
                  <MenuItem
                    icon={<Edit3 size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditExercise(exercise);
                    }}
                  >
                    Edit Exercise
                  </MenuItem>
                  <MenuItem
                    icon={<Trash2 size={16} />}
                    color="red.500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(exercise);
                    }}
                  >
                    Delete Exercise
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </VStack>
        </HStack>
      </CardBody>
    </Card>
  );
};

// Draggable Exercise Card Component
interface DraggableExerciseCardProps {
  exercise: Exercise;
  children: React.ReactNode;
  isSelectionMode?: boolean;
}

const DraggableExerciseCard: React.FC<DraggableExerciseCardProps> = ({ 
  exercise, 
  children, 
  isSelectionMode = false 
}) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `library-${exercise.id}`,
    data: {
      type: 'library-exercise',
      exercise,
    },
    disabled: isSelectionMode, // Disable drag in selection mode to allow click selection
  });

  // For portal rendering, we need to track the original element position
  const [originalRect, setOriginalRect] = React.useState<DOMRect | null>(null);

  // Combine refs
  const combineRefs = React.useCallback((node: HTMLDivElement | null) => {
    elementRef.current = node;
    setNodeRef(node);
  }, [setNodeRef]);

  // Update the original rect when dragging starts
  React.useEffect(() => {
    if (isDragging && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      setOriginalRect(rect);
    }
  }, [isDragging]);

  // If dragging and we have the original position, render in portal
  if (isDragging && originalRect && transform && typeof document !== 'undefined') {
    const x = originalRect.left + transform.x;
    const y = originalRect.top + transform.y;

    return (
      <>
        {/* Original placeholder with reduced opacity */}
        <div ref={combineRefs} style={{ opacity: 0.3 }}>
          {children}
        </div>
        
        {/* Dragged element in portal with correct absolute positioning */}
        {createPortal(
          <div 
            style={{
              position: 'fixed',
              left: x,
              top: y,
              zIndex: 999999,
              pointerEvents: 'none',
              opacity: 0.8,
              width: originalRect.width,
              height: originalRect.height,
            }}
          >
            {children}
          </div>,
          document.body
        )}
      </>
    );
  }

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.3 : 1,
  } : {};

  return (
    <div 
      ref={combineRefs} 
      style={style} 
      {...listeners} 
      {...attributes}
    >
      {children}
    </div>
  );
};

export const ExerciseLibrary = forwardRef<ExerciseLibraryRef, ExerciseLibraryProps>(({
  exercises,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  isLoading = false,
  showAddButton = true,
  title = "Exercise Library",
  subtitle = "Manage your custom exercises",
  onExerciseSelect,
  selectionMode = false,
  selectedExercises = [],
  currentUserId,
  userTeams,
  onAddButtonClick,
  enableDrag = false,
}, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedSource, setSelectedSource] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal states
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  const toast = useToast();

  // Theme colors (only for main layout, card colors are now in individual components)
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const searchIconColor = useColorModeValue('gray.400', 'gray.500');
  const emptyStateColor = useColorModeValue('gray.500', 'gray.400');

  // Get unique categories from exercises
  const availableCategories = ['All', ...Array.from(new Set(exercises.map(ex => ex.category)))];

  // Filter and sort exercises
  const filteredExercises = exercises
    .filter(exercise => {
              // Exercise filtering logic
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exercise.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (exercise.muscle_groups?.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || exercise.difficulty === selectedDifficulty;
      
      // Source filtering
      let matchesSource = true;
      if (selectedSource === 'system') {
        matchesSource = exercise.is_system_exercise === true;
      } else if (selectedSource === 'public') {
        matchesSource = exercise.is_system_exercise === false && exercise.is_public === true;
      } else if (selectedSource === 'mine') {
        matchesSource = exercise.is_system_exercise === false && exercise.user_id === currentUserId;
      } else if (selectedSource === 'team') {
        // Team exercises: exercises shared with user's teams (including ones created by the user)
        const userTeamIds = userTeams?.map(team => team.id) || [];
        matchesSource = exercise.is_system_exercise === false && 
                       exercise.is_public === false && 
                       exercise.organization_id && 
                       userTeamIds.includes(exercise.organization_id);
      }
      
      return matchesSearch && matchesCategory && matchesDifficulty && matchesSource;
    })
    .sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at || '').getTime();
          bValue = new Date(b.created_at || '').getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleAddExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    try {
      await onAddExercise(exerciseData);
      onAddClose();
      toast({
        title: 'Exercise added',
        description: `${exerciseData.name} has been added to your library.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error adding exercise',
        description: 'There was an error adding the exercise. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    onEditOpen();
  };

  const handleUpdateExercise = async (exerciseData: Omit<Exercise, 'id'>) => {
    if (!editingExercise) return;
    
    try {
      await onUpdateExercise(editingExercise.id, exerciseData);
      onEditClose();
      setEditingExercise(null);
      toast({
        title: 'Exercise updated',
        description: `${exerciseData.name} has been updated.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating exercise',
        description: 'There was an error updating the exercise. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteClick = (exercise: Exercise) => {
    setDeletingExercise(exercise);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!deletingExercise) return;
    
    try {
      await onDeleteExercise(deletingExercise.id);
      onDeleteClose();
      setDeletingExercise(null);
      toast({
        title: 'Exercise deleted',
        description: `${deletingExercise.name} has been removed from your library.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting exercise',
        description: 'There was an error deleting the exercise. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExerciseClick = (exercise: Exercise) => {
    // Always call onExerciseSelect if provided, regardless of mode
    if (onExerciseSelect) {
      onExerciseSelect(exercise);
    }
  };

  const isExerciseSelected = (exerciseId: string) => {
    return selectedExercises.includes(exerciseId);
  };

  // Helper function to sanitize exercise names for file paths (same as exerciseMediaService)
  const sanitizeExerciseName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Helper function to check if a file exists (simple approach for images)
  const checkFileExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Helper function to get exercise image (following execution modal convention)
  const getExerciseImage = (exercise: Exercise): string | null => {
    // Check for video thumbnail first, then fall back to local images
    if (exercise.video_url) {
      // Extract thumbnail from video URL if it's a YouTube video
      const youtubeMatch = exercise.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (youtubeMatch) {
        return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
      }
    }
    
    // Map exercise categories to actual directory names
    const categoryDirectoryMap: Record<string, string> = {
      'warm_up': 'warmup',
      'cool_down': 'cooldown',
      'plyometric': 'plyometric',
      'flexibility': 'flexibility',
      'strength': 'strength',
      'running': 'running',
      'drill': 'drill',
      'recovery': 'recovery',
      'custom': 'strength' // fallback to strength directory for custom exercises
    };
    
    // Generate local file path using the same convention as exerciseMediaService
    const sanitizedName = sanitizeExerciseName(exercise.name);
    const directoryName = categoryDirectoryMap[exercise.category] || exercise.category.toLowerCase();
    
    // Try thumbnails first for better performance and quality at small sizes
    const thumbnailPath = `/exercise-media/thumbnails/${directoryName}/${sanitizedName}.png`;
    const imagePath = `/exercise-media/images/${directoryName}/${sanitizedName}.png`;
    
    // For avatars, prefer thumbnails if available, otherwise use full images
    // We'll return thumbnail path first and let the browser handle fallback
    return thumbnailPath;
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color={textColor}>Loading exercises...</Text>
        </VStack>
      </Center>
    );
  }

  useImperativeHandle(ref, () => ({
    openAddModal: onAddOpen,
  }));

  return (
    <Box w="100%" h="100%" display="flex" flexDirection="column" minH="0">
      {/* Fixed Header */}
      <Box p={6} pb={4} flexShrink={0}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={1}>
              <Heading size="lg" color={textColor}>{title}</Heading>
              <Text color={subtitleColor} fontSize="md">{subtitle}</Text>
            </VStack>
            
            <HStack spacing={2}>
              {showAddButton && (
                <Button
                  leftIcon={<Plus size={20} />}
                  colorScheme="blue"
                  onClick={onAddOpen}
                  size="lg"
                >
                  Add Exercise
                </Button>
              )}
            </HStack>
          </HStack>

          {/* Search and Filters */}
          <VStack spacing={4} align="stretch">
            {/* Search Bar */}
            <HStack spacing={2}>
              <InputGroup size="lg" flex="1">
                <InputLeftElement pointerEvents="none">
                  <Search size={20} color={searchIconColor} />
                </InputLeftElement>
                <Input
                  placeholder="Search exercises by name, description, or muscle group..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg={cardBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                />
                {searchTerm && (
                  <InputRightElement>
                    <IconButton
                      aria-label="Clear search"
                      icon={<X size={16} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setSearchTerm('')}
                      color={searchIconColor}
                      _hover={{ color: textColor }}
                    />
                  </InputRightElement>
                )}
              </InputGroup>
              
              {/* Unified Control Bar: Grid, List, and Sort */}
              <ButtonGroup size="lg" isAttached variant="outline" spacing={0}>
                {!selectionMode && (
                  <>
                    <IconButton
                      aria-label="Grid view"
                      icon={<Grid3X3 size={18} />}
                      isActive={viewMode === 'grid'}
                      onClick={() => setViewMode('grid')}
                      colorScheme={viewMode === 'grid' ? 'blue' : 'gray'}
                      minW="48px"
                      w="48px"
                    />
                    <IconButton
                      aria-label="List view"
                      icon={<List size={18} />}
                      isActive={viewMode === 'list'}
                      onClick={() => setViewMode('list')}
                      colorScheme={viewMode === 'list' ? 'blue' : 'gray'}
                      minW="48px"
                      w="48px"
                    />
                  </>
                )}
                <IconButton
                  aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  minW="48px"
                  w="48px"
                  icon={
                    <Text fontSize="lg" fontWeight="bold">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Text>
                  }
                />
              </ButtonGroup>
            </HStack>

            {/* Filters */}
            <HStack spacing={2} wrap="nowrap" w="555px">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="sm"
                w="137px"
                bg={cardBg}
                borderColor={borderColor}
              >
                <option value="All">All Categories</option>
                {availableCategories.filter(cat => cat !== 'All').map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>

              <Select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                size="sm"
                w="126px"
                bg={cardBg}
                borderColor={borderColor}
              >
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </Select>

              <Select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                size="sm"
                w="126px"
                bg={cardBg}
                borderColor={borderColor}
              >
                <option value="all">All Sources</option>
                <option value="system">System</option>
                <option value="public">Public</option>
                {userTeams && userTeams.length > 0 && (
                  <option value="team">Team</option>
                )}
                <option value="mine">Mine</option>
              </Select>

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'category' | 'created_at')}
                size="sm"
                w="122px"
                bg={cardBg}
                borderColor={borderColor}
              >
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="created_at">Date Added</option>
              </Select>
            </HStack>
          </VStack>

          {/* Results Count */}
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" color={subtitleColor}>
              {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* Scrollable Content Area */}
      <Box flex="1" overflow="auto" px={6} pb={6} minH="0">
        {filteredExercises.length === 0 ? (
          <Center py={16}>
            <VStack spacing={4}>
              <BookOpen size={64} color={emptyStateColor} />
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold" color={emptyStateColor}>
                  {searchTerm || selectedCategory !== 'All' || selectedDifficulty !== 'All' 
                    ? 'No exercises match your filters' 
                    : 'No exercises in your library yet'
                  }
                </Text>
                <Text fontSize="md" color={emptyStateColor} textAlign="center" maxW="400px">
                  {searchTerm || selectedCategory !== 'All' || selectedDifficulty !== 'All'
                    ? 'Try adjusting your search terms or filters to find exercises.'
                    : 'Start building your exercise library by adding your first custom exercise.'
                  }
                </Text>
              </VStack>
              {showAddButton && !searchTerm && selectedCategory === 'All' && selectedDifficulty === 'All' && (
                <Button
                  leftIcon={<Plus size={20} />}
                  colorScheme="blue"
                  onClick={onAddOpen}
                  mt={4}
                >
                  Add Your First Exercise
                </Button>
              )}
            </VStack>
          </Center>
        ) : selectionMode ? (
          // Selection mode: Always use list layout for workout creator
          <VStack spacing={2} align="stretch">
            {filteredExercises.map((exercise) => (
              <DraggableExerciseCard 
                key={exercise.id} 
                exercise={exercise} 
                isSelectionMode={!enableDrag}
              >
                <ExerciseListCard 
                  exercise={exercise}
                  onEditExercise={handleEditExercise}
                  onDeleteClick={handleDeleteClick}
                  onExerciseClick={handleExerciseClick}
                  isExerciseSelected={isExerciseSelected}
                  getExerciseImage={getExerciseImage}
                  selectionMode={selectionMode}
                  currentUserId={currentUserId}
                  enableDrag={enableDrag}
                />
              </DraggableExerciseCard>
            ))}
          </VStack>
        ) : viewMode === 'list' ? (
          // List view mode
          <VStack spacing={2} align="stretch">
            {filteredExercises.map((exercise) => (
              <DraggableExerciseCard key={exercise.id} exercise={exercise} isSelectionMode={!enableDrag}>
                <ExerciseListCard 
                  exercise={exercise}
                  onEditExercise={handleEditExercise}
                  onDeleteClick={handleDeleteClick}
                  onExerciseClick={handleExerciseClick}
                  isExerciseSelected={isExerciseSelected}
                  getExerciseImage={getExerciseImage}
                  selectionMode={selectionMode}
                  currentUserId={currentUserId}
                  enableDrag={enableDrag}
                />
              </DraggableExerciseCard>
            ))}
          </VStack>
        ) : (
          // Grid view mode (default)
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {filteredExercises.map((exercise) => (
              <DraggableExerciseCard key={exercise.id} exercise={exercise} isSelectionMode={!enableDrag}>
                <ExerciseGridCard 
                  exercise={exercise}
                  onEditExercise={handleEditExercise}
                  onDeleteClick={handleDeleteClick}
                  onExerciseClick={handleExerciseClick}
                  isExerciseSelected={isExerciseSelected}
                  getExerciseImage={getExerciseImage}
                  selectionMode={selectionMode}
                  currentUserId={currentUserId}
                  enableDrag={enableDrag}
                />
              </DraggableExerciseCard>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Add Exercise Modal */}
      <ExerciseModal
        isOpen={isAddOpen}
        onClose={onAddClose}
        onSave={handleAddExercise}
        title="Add New Exercise"
        categories={PREDEFINED_CATEGORIES}
      />

      {/* Edit Exercise Modal */}
      <ExerciseModal
        isOpen={isEditOpen}
        onClose={() => {
          onEditClose();
          setEditingExercise(null);
        }}
        onSave={handleUpdateExercise}
        title="Edit Exercise"
        categories={PREDEFINED_CATEGORIES}
        initialData={editingExercise || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Exercise
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{deletingExercise?.name}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}); 