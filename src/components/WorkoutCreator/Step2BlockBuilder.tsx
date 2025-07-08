import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Button,
  IconButton,
  Select,
  Input,
  Badge,
  useColorModeValue,
  SimpleGrid,
  Icon,
  Flex,
  Divider,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
} from '@chakra-ui/react';
import { 
  Plus, 
  Settings, 
  Trash2, 
  Clock, 
  RotateCcw, 
  Target,
  ChevronDown,
  Timer,
  Zap,
  Users,
  Repeat,
  Edit3,
  GripVertical
} from 'lucide-react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WorkoutBlock {
  id: string;
  name: string;
  category: 'warmup' | 'main' | 'accessory' | 'conditioning' | 'cooldown' | 'custom';
  flow: 'sequential' | 'circuit' | 'superset' | 'emom' | 'amrap';
  exercises: any[];
  restBetweenExercises: number;
  rounds?: number;
  timeLimit?: number;
  description?: string;
}

interface Step2BlockBuilderProps {
  blocks: WorkoutBlock[];
  onUpdateBlocks: (blocks: WorkoutBlock[]) => void;
  templateType: 'single' | 'weekly' | 'monthly';
  currentDay?: string;
  selectedTemplate?: string;
}

const BLOCK_CATEGORIES = [
  { value: 'warmup', label: 'Warm-up', icon: RotateCcw, color: 'orange', defaultRest: 60 },
  { value: 'main', label: 'Main Set', icon: Target, color: 'blue', defaultRest: 90 },
  { value: 'accessory', label: 'Accessory', icon: Plus, color: 'green', defaultRest: 60 },
  { value: 'conditioning', label: 'Conditioning', icon: Zap, color: 'red', defaultRest: 75 },
  { value: 'cooldown', label: 'Cool-down', icon: Clock, color: 'purple', defaultRest: 30 },
  { value: 'custom', label: 'Custom', icon: Settings, color: 'gray', defaultRest: 60 },
];

const FLOW_TYPES = [
  { 
    value: 'sequential', 
    label: 'Sequential', 
    description: 'Complete all sets of one exercise before moving to the next',
    icon: Target,
    supportsRounds: false
  },
  { 
    value: 'circuit', 
    label: 'Circuit', 
    description: 'Cycle through exercises with minimal rest',
    icon: RotateCcw,
    supportsRounds: true
  },
  { 
    value: 'superset', 
    label: 'Superset', 
    description: 'Pair exercises back-to-back',
    icon: Users,
    supportsRounds: false
  },
  { 
    value: 'emom', 
    label: 'EMOM', 
    description: 'Every Minute on the Minute',
    icon: Timer,
    supportsRounds: true,
    requiresTime: true
  },
  { 
    value: 'amrap', 
    label: 'AMRAP', 
    description: 'As Many Rounds As Possible',
    icon: Repeat,
    supportsRounds: false,
    requiresTime: true
  },
];

const BLOCK_TEMPLATES = {
  warmup: {
    name: 'Dynamic Warm-up',
    exercises: ['Arm Circles', 'Leg Swings', 'High Knees', 'Butt Kicks'],
    flow: 'sequential',
    restBetweenExercises: 60,
    rounds: undefined
  },
  main: {
    name: 'Strength Training',
    exercises: ['Back Squat', 'Bench Press', 'Deadlift'],
    flow: 'sequential',
    restBetweenExercises: 90,
    rounds: undefined
  },
  conditioning: {
    name: 'Conditioning Circuit',
    exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats'],
    flow: 'circuit',
    restBetweenExercises: 75,
    rounds: 3
  },
  cooldown: {
    name: 'Recovery',
    exercises: ['Forward Fold', 'Pigeon Pose', 'Child\'s Pose'],
    flow: 'sequential',
    restBetweenExercises: 30,
    rounds: undefined
  }
};

// Sortable Block Component
interface SortableBlockProps {
  block: WorkoutBlock;
  onUpdateBlock: (block: WorkoutBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onEditBlock: (block: WorkoutBlock) => void;
}

const SortableBlock: React.FC<SortableBlockProps> = ({ 
  block, 
  onUpdateBlock, 
  onDeleteBlock,
  onEditBlock 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');

  const categoryConfig = BLOCK_CATEGORIES.find(c => c.value === block.category);
  const flowConfig = FLOW_TYPES.find(f => f.value === block.flow);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="outline"
      bg="transparent"
      borderColor={isDragging ? "blue.400" : borderColor}
      borderWidth="2px"
      _hover={{ borderColor: "blue.300" }}
      transition="all 0.2s"
      h="100px"
    >
      <CardBody p={0}>
        <HStack justify="space-between" align="center" h="100%" spacing={4}>
          {/* Left side - Drag handle only */}
          <Box
            {...attributes}
            {...listeners}
            cursor="grab"
            p={1}
            borderRadius="md"
            _hover={{ bg: "gray.100" }}
            _active={{ cursor: 'grabbing' }}
          >
            <Icon as={GripVertical} boxSize={4} color="gray.500" />
          </Box>

          {/* Center - Block information */}
          <Box flex={1} display="flex" alignItems="center">
            <VStack spacing={1} align="start" w="100%">
              <Heading size="md" color={textColor}>
                {block.name}
              </Heading>
              <HStack spacing={4} fontSize="sm" color={subtitleColor}>
                <Badge colorScheme={categoryConfig?.color} size="sm">
                  {categoryConfig?.label}
                </Badge>
                <Badge colorScheme="blue" variant="outline" size="sm">
                  {flowConfig?.label}
                </Badge>
                <Text>{block.restBetweenExercises}s rest</Text>
                {block.rounds && (
                  <Text>{block.rounds} rounds</Text>
                )}
                {block.timeLimit && (
                  <Text>{block.timeLimit}min</Text>
                )}
              </HStack>
            </VStack>
          </Box>

          {/* Right side - Action buttons */}
          <HStack spacing={1}>
            <IconButton
              icon={<Edit3 size={16} color="white" />}
              size="sm"
              variant="ghost"
              aria-label="Edit block"
              onClick={() => onEditBlock(block)}
            />
            <IconButton
              icon={<Trash2 size={16} color="white" />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              aria-label="Delete block"
              onClick={() => onDeleteBlock(block.id)}
            />
          </HStack>
        </HStack>
      </CardBody>
    </Card>
  );
};

// Block Configuration Modal
interface BlockConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: WorkoutBlock | null;
  onSave: (block: WorkoutBlock) => void;
}

const BlockConfigModal: React.FC<BlockConfigModalProps> = ({
  isOpen,
  onClose,
  block,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<WorkoutBlock>>({});
  
  React.useEffect(() => {
    if (block) {
      setFormData(block);
    }
  }, [block]);

  const handleSave = () => {
    if (formData.name && formData.category && formData.flow) {
      onSave(formData as WorkoutBlock);
      onClose();
    }
  };

  const selectedFlow = FLOW_TYPES.find(f => f.value === formData.flow);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {block ? 'Edit Block' : 'Create New Block'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Block Name</FormLabel>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Warm-up, Main Set, Finisher"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                value={formData.category || ''}
                onChange={(e) => {
                  const category = e.target.value as WorkoutBlock['category'];
                  const categoryConfig = BLOCK_CATEGORIES.find(c => c.value === category);
                  setFormData(prev => ({ 
                    ...prev, 
                    category,
                    restBetweenExercises: categoryConfig?.defaultRest || 60
                  }));
                }}
                placeholder="Select category"
              >
                {BLOCK_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Flow Type</FormLabel>
              <Select
                value={formData.flow || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, flow: e.target.value as WorkoutBlock['flow'] }))}
                placeholder="Select flow type"
              >
                {FLOW_TYPES.map(flow => (
                  <option key={flow.value} value={flow.value}>
                    {flow.label} - {flow.description}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel>Rest Between Exercises (seconds)</FormLabel>
                <NumberInput
                  value={formData.restBetweenExercises || 60}
                  onChange={(_, num) => setFormData(prev => ({ ...prev, restBetweenExercises: num }))}
                  min={0}
                  max={300}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              {selectedFlow?.supportsRounds && (
                <FormControl>
                  <FormLabel>Rounds</FormLabel>
                  <NumberInput
                    value={formData.rounds || 1}
                    onChange={(_, num) => setFormData(prev => ({ ...prev, rounds: num }))}
                    min={1}
                    max={20}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              )}
              
              {selectedFlow?.requiresTime && (
                <FormControl>
                  <FormLabel>Time Limit (minutes)</FormLabel>
                  <NumberInput
                    value={formData.timeLimit || 10}
                    onChange={(_, num) => setFormData(prev => ({ ...prev, timeLimit: num }))}
                    min={1}
                    max={60}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              )}
            </SimpleGrid>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save Block
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Step2BlockBuilder: React.FC<Step2BlockBuilderProps> = ({
  blocks,
  onUpdateBlocks,
  templateType,
  currentDay,
  selectedTemplate
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingBlock, setEditingBlock] = useState<WorkoutBlock | null>(null);
  const toast = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex(block => block.id === active.id);
      const newIndex = blocks.findIndex(block => block.id === over.id);
      
      onUpdateBlocks(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const handleAddBlock = (category: string) => {
    const categoryConfig = BLOCK_CATEGORIES.find(c => c.value === category);
    const template = BLOCK_TEMPLATES[category as keyof typeof BLOCK_TEMPLATES];
    
    const newBlock: WorkoutBlock = {
      id: `${category}-block-${Date.now()}`,
      name: template?.name || `${categoryConfig?.label} Block`,
      category: category as WorkoutBlock['category'],
      flow: template?.flow as WorkoutBlock['flow'] || 'sequential',
      exercises: [],
      restBetweenExercises: template?.restBetweenExercises || categoryConfig?.defaultRest || 60,
      rounds: template?.rounds,
    };

    onUpdateBlocks([...blocks, newBlock]);
    
    toast({
      title: 'Block added',
      description: `${newBlock.name} has been added to your workout`,
      status: 'success',
      duration: 2000,
    });
  };

  const handleEditBlock = (block: WorkoutBlock) => {
    setEditingBlock(block);
    onOpen();
  };

  const handleSaveBlock = (updatedBlock: WorkoutBlock) => {
    const updatedBlocks = blocks.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    );
    onUpdateBlocks(updatedBlocks);
  };

  const handleDeleteBlock = (blockId: string) => {
    onUpdateBlocks(blocks.filter(block => block.id !== blockId));
    toast({
      title: 'Block deleted',
      status: 'info',
      duration: 2000,
    });
  };

  const handleCreateCustomBlock = () => {
    setEditingBlock({
      id: `custom-block-${Date.now()}`,
      name: '',
      category: 'custom',
      flow: 'sequential',
      exercises: [],
      restBetweenExercises: 60,
    });
    onOpen();
  };

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {/* Quick Add Blocks */}
      <Card variant="outline" bg="transparent" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md" color={textColor}>Quick Add Blocks</Heading>
            <SimpleGrid columns={6} spacing={3} w="100%">
              {BLOCK_CATEGORIES.map((category) => (
                <Button
                  key={category.value}
                  onClick={() => category.value === 'custom' ? handleCreateCustomBlock() : handleAddBlock(category.value)}
                  leftIcon={<Icon as={category.icon} boxSize={5} />}
                  bg="white"
                  color="gray.700"
                  border="1px solid"
                  borderColor="gray.200"
                  variant="solid"
                  size="sm"
                  h={12}
                  flexDir="column"
                  fontSize="xs"
                  _hover={{
                    bg: "gray.50",
                    borderColor: "gray.300"
                  }}
                >
                  {category.label}
                </Button>
              ))}
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Blocks List */}
      <Box>
        <Heading size="md" color={textColor} mb={4}>
          Workout Blocks ({blocks.length})
        </Heading>
        
        {blocks.length === 0 ? (
          <Card variant="outline" bg="transparent" borderColor={borderColor}>
            <CardBody py={12} textAlign="center">
              <VStack spacing={4}>
                <Icon as={Target} boxSize={12} color="gray.400" />
                <VStack spacing={2}>
                  <Text fontSize="lg" color={textColor}>No blocks added yet</Text>
                  <Text fontSize="sm" color={subtitleColor}>
                    Start by adding blocks using the buttons above
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map(block => block.id)}
              strategy={verticalListSortingStrategy}
            >
              <VStack spacing={4} align="stretch">
                {blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    onUpdateBlock={handleSaveBlock}
                    onDeleteBlock={handleDeleteBlock}
                    onEditBlock={handleEditBlock}
                  />
                ))}
              </VStack>
            </SortableContext>
          </DndContext>
        )}
      </Box>

      {/* Block Configuration Modal */}
      <BlockConfigModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setEditingBlock(null);
        }}
        block={editingBlock}
        onSave={handleSaveBlock}
      />
    </VStack>
  );
};

export default Step2BlockBuilder; 