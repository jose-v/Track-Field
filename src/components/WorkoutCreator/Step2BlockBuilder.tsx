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
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseButton,
  useToast,
  Switch,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
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
  restBetweenExercises: number; // Rest time when moving to next exercise
  restBetweenSets?: number; // Rest time between sets of same exercise
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
  { value: 'warmup', label: 'Warm-up', icon: RotateCcw, color: 'orange', defaultRestBetweenSets: 45, defaultRestBetweenExercises: 60 },
  { value: 'main', label: 'Main Set', icon: Target, color: 'blue', defaultRestBetweenSets: 90, defaultRestBetweenExercises: 120 },
  { value: 'accessory', label: 'Accessory', icon: Plus, color: 'green', defaultRestBetweenSets: 60, defaultRestBetweenExercises: 90 },
  { value: 'conditioning', label: 'Conditioning', icon: Zap, color: 'red', defaultRestBetweenSets: 30, defaultRestBetweenExercises: 75 },
  { value: 'cooldown', label: 'Cool-down', icon: Clock, color: 'purple', defaultRestBetweenSets: 15, defaultRestBetweenExercises: 30 },
  { value: 'custom', label: 'Custom', icon: Settings, color: 'gray', defaultRestBetweenSets: 60, defaultRestBetweenExercises: 90 },
];

const FLOW_TYPES = [
  { 
    value: 'sequential', 
    label: 'Sequential', 
    description: 'Traditional training - full control over rest periods',
    icon: Target,
    supportsRounds: false,
    restPattern: 'flexible' // Full control over rest times
  },
  { 
    value: 'circuit', 
    label: 'Circuit', 
    description: 'Continuous movement with minimal to no rest',
    icon: RotateCcw,
    supportsRounds: true,
    restPattern: 'minimal' // Short rest between sets, no rest between exercises
  },
  { 
    value: 'superset', 
    label: 'Superset', 
    description: 'Paired exercises with rest between sets only',
    icon: Users,
    supportsRounds: false,
    restPattern: 'paired' // Rest between sets only, no rest between exercises
  },
  { 
    value: 'emom', 
    label: 'EMOM', 
    description: 'Timer-controlled intervals - no manual rest needed',
    icon: Timer,
    supportsRounds: true,
    requiresTime: true,
    restPattern: 'timer' // Timer-controlled, no manual rest
  },
  { 
    value: 'amrap', 
    label: 'AMRAP', 
    description: 'Maximum effort in time limit - no manual rest',
    icon: Repeat,
    supportsRounds: false,
    requiresTime: true,
    restPattern: 'timer' // Timer-controlled, no manual rest
  },
];

const BLOCK_TEMPLATES = {
  warmup: {
    name: 'Dynamic Warm-up',
    exercises: ['Arm Circles', 'Leg Swings', 'High Knees', 'Butt Kicks'],
    flow: 'sequential',
    restBetweenExercises: 60,
    restBetweenSets: 45,
    rounds: undefined
  },
  main: {
    name: 'Strength Training',
    exercises: ['Back Squat', 'Bench Press', 'Deadlift'],
    flow: 'sequential',
    restBetweenExercises: 120,
    restBetweenSets: 90,
    rounds: undefined
  },
  conditioning: {
    name: 'Conditioning Circuit',
    exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats'],
    flow: 'circuit',
    restBetweenExercises: 75,
    restBetweenSets: 30,
    rounds: 3
  },
  cooldown: {
    name: 'Recovery',
    exercises: ['Forward Fold', 'Pigeon Pose', 'Child\'s Pose'],
    flow: 'sequential',
    restBetweenExercises: 30,
    restBetweenSets: 15,
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
                <HStack spacing={2} divider={<Text color="gray.400">|</Text>}>
                  <Text>
                    Sets: {block.restBetweenSets || 0}s
                  </Text>
                  <Text>
                    Ex: {block.restBetweenExercises}s
                  </Text>
                </HStack>
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
  const [noRestBetweenSets, setNoRestBetweenSets] = useState(false);
  const [noRestBetweenExercises, setNoRestBetweenExercises] = useState(false);
  
  React.useEffect(() => {
    if (block) {
      setFormData(block);
      // Set toggles based on whether rest times are 0
      setNoRestBetweenSets((block.restBetweenSets || 0) === 0);
      setNoRestBetweenExercises(block.restBetweenExercises === 0);
    }
  }, [block]);

  const handleSave = () => {
    if (formData.name && formData.category && formData.flow) {
      const finalFormData = {
        ...formData,
        restBetweenSets: noRestBetweenSets ? 0 : (formData.restBetweenSets || 60),
        restBetweenExercises: noRestBetweenExercises ? 0 : (formData.restBetweenExercises || 90)
      };
      onSave(finalFormData as WorkoutBlock);
      onClose();
    }
  };

  const handleNoRestBetweenSetsChange = (checked: boolean) => {
    setNoRestBetweenSets(checked);
    if (checked) {
      // When enabling "no rest", set rest time to 0
      setFormData(prev => ({ ...prev, restBetweenSets: 0 }));
    } else {
      // When disabling "no rest", restore to original block rest time or category default
      if ((formData.restBetweenSets || 0) === 0) {
        // Try to get the original block's rest time first
        const originalRestTime = block?.restBetweenSets;
        if (originalRestTime && originalRestTime > 0) {
          setFormData(prev => ({ ...prev, restBetweenSets: originalRestTime }));
        } else {
          // Fall back to category default
          const categoryConfig = BLOCK_CATEGORIES.find(c => c.value === formData.category);
          setFormData(prev => ({ ...prev, restBetweenSets: categoryConfig?.defaultRestBetweenSets || 60 }));
        }
      }
    }
  };

  const handleNoRestBetweenExercisesChange = (checked: boolean) => {
    setNoRestBetweenExercises(checked);
    if (checked) {
      // When enabling "no rest", set rest time to 0
      setFormData(prev => ({ ...prev, restBetweenExercises: 0 }));
    } else {
      // When disabling "no rest", restore to original block rest time or category default
      if (formData.restBetweenExercises === 0) {
        // Try to get the original block's rest time first
        const originalRestTime = block?.restBetweenExercises;
        if (originalRestTime && originalRestTime > 0) {
          setFormData(prev => ({ ...prev, restBetweenExercises: originalRestTime }));
        } else {
          // Fall back to category default
          const categoryConfig = BLOCK_CATEGORIES.find(c => c.value === formData.category);
          setFormData(prev => ({ ...prev, restBetweenExercises: categoryConfig?.defaultRestBetweenExercises || 90 }));
        }
      }
    }
  };

  // Flow-specific rest time presets
  const applyFlowPresets = (flow: string) => {
    const presets = {
      sequential: { restBetweenSets: 60, restBetweenExercises: 90 },
      circuit: { restBetweenSets: 0, restBetweenExercises: 0 },
      superset: { restBetweenSets: 30, restBetweenExercises: 0 },
      emom: { restBetweenSets: 0, restBetweenExercises: 0 },
      amrap: { restBetweenSets: 0, restBetweenExercises: 0 }
    };

    const preset = presets[flow as keyof typeof presets];
    if (preset) {
      setFormData(prev => ({ 
        ...prev, 
        flow: flow as WorkoutBlock['flow'],
        restBetweenSets: preset.restBetweenSets,
        restBetweenExercises: preset.restBetweenExercises
      }));
      setNoRestBetweenSets(preset.restBetweenSets === 0);
      setNoRestBetweenExercises(preset.restBetweenExercises === 0);
    } else {
      setFormData(prev => ({ ...prev, flow: flow as WorkoutBlock['flow'] }));
    }
  };

  const selectedFlow = FLOW_TYPES.find(f => f.value === formData.flow);

  // Determine which rest controls should be available based on flow type
  const getRestControlsConfig = () => {
    const pattern = selectedFlow?.restPattern || 'flexible';
    
    switch (pattern) {
      case 'flexible': // Sequential - full control
        return {
          showRestBetweenSets: true,
          enableRestBetweenSets: true,
          showRestBetweenExercises: true,
          enableRestBetweenExercises: true,
          showPresets: true,
          explanation: null
        };
      
      case 'minimal': // Circuit - minimal rest encouraged
        return {
          showRestBetweenSets: true,
          enableRestBetweenSets: true,
          showRestBetweenExercises: true,
          enableRestBetweenExercises: true,
          showPresets: true,
          explanation: "Circuit training works best with minimal rest for continuous movement"
        };
      
      case 'paired': // Superset - no rest between exercises
        return {
          showRestBetweenSets: true,
          enableRestBetweenSets: true,
          showRestBetweenExercises: true,
          enableRestBetweenExercises: false,
          showPresets: false,
          explanation: "Superset exercises are performed back-to-back with no rest between them"
        };
      
      case 'timer': // EMOM/AMRAP - timer controlled
        return {
          showRestBetweenSets: false,
          enableRestBetweenSets: false,
          showRestBetweenExercises: false,
          enableRestBetweenExercises: false,
          showPresets: false,
          explanation: "Rest periods are controlled by the timer - no manual rest needed"
        };
      
      default:
        return {
          showRestBetweenSets: true,
          enableRestBetweenSets: true,
          showRestBetweenExercises: true,
          enableRestBetweenExercises: true,
          showPresets: false, // Conservative default
          explanation: null
        };
    }
  };

  const restConfig = getRestControlsConfig();

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="lg">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottom="1px solid" borderColor="gray.200" pb={4}>
          <HStack w="full" position="relative">
            <IconButton
              aria-label="Back"
              icon={<ChevronLeftIcon />}
              variant="ghost"
              onClick={onClose}
              position="absolute"
              left={0}
              zIndex={2}
            />
            
            <VStack spacing={0} textAlign="center" w="full" align="center">
              <Text fontSize="lg" fontWeight="semibold">
                Configure Block - {formData.name || 'New Block'}
              </Text>
            </VStack>
          </HStack>
        </DrawerHeader>
        
        <DrawerBody py={6} overflowY="auto">
          <VStack spacing={6} align="stretch">
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
                    restBetweenExercises: categoryConfig?.defaultRestBetweenExercises || 90,
                    restBetweenSets: categoryConfig?.defaultRestBetweenSets || 60
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
              <VStack align="stretch" spacing={3}>
              <Select
                value={formData.flow || ''}
                  onChange={(e) => applyFlowPresets(e.target.value)}
                placeholder="Select flow type"
              >
                {FLOW_TYPES.map(flow => (
                  <option key={flow.value} value={flow.value}>
                    {flow.label} - {flow.description}
                  </option>
                ))}
              </Select>
                
                {/* Flow-specific rest time info */}
                {selectedFlow && (
                  <Box p={3} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="blue.400">
                    <Text fontSize="sm" fontWeight="medium" color="blue.700" mb={1}>
                      {selectedFlow.label} Rest Pattern:
                    </Text>
                    <Text fontSize="xs" color="blue.600">
                      {selectedFlow.value === 'sequential' && "Full manual control - set any rest times for your training goals"}
                      {selectedFlow.value === 'circuit' && "Encourages continuous movement - can override if needed for safety"}
                      {selectedFlow.value === 'superset' && "Exercises must be back-to-back - only rest between sets allowed"}
                      {selectedFlow.value === 'emom' && "Work/rest controlled by timer - manual rest times not applicable"}
                      {selectedFlow.value === 'amrap' && "Continuous maximum effort - manual rest times not applicable"}
                    </Text>
                  </Box>
                )}
              </VStack>
            </FormControl>
            
            {/* Rest Time Configuration */}
              <FormControl>
              <FormLabel>Rest Time Settings</FormLabel>
              <VStack align="stretch" spacing={4}>
                
                {/* Flow-specific explanation */}
                {restConfig.explanation && (
                  <Box p={3} bg="blue.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="blue.400">
                    <Text fontSize="sm" color="blue.700">
                      <strong>{selectedFlow?.label}:</strong> {restConfig.explanation}
                    </Text>
                  </Box>
                )}

                {/* Timer-controlled flow message */}
                {selectedFlow?.restPattern === 'timer' && (
                  <Box p={4} bg="purple.50" borderRadius="md" borderLeft="4px solid" borderLeftColor="purple.400" textAlign="center">
                    <Text fontSize="md" fontWeight="medium" color="purple.700" mb={1}>
                      ⏱️ Timer-Controlled Workout
                    </Text>
                    <Text fontSize="sm" color="purple.600">
                      Rest periods are managed by the {selectedFlow.label.toLowerCase()} timer. 
                      Set your time limit above and let the clock control the pace!
                    </Text>
                  </Box>
                )}
                
                {/* Quick Presets - only show for flexible flows */}
                {restConfig.showPresets && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.700">
                      {selectedFlow?.value === 'sequential' ? 'Training Style Presets:' : 
                       selectedFlow?.value === 'circuit' ? 'Circuit Presets:' : 
                       'Quick Presets:'}
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {/* Sequential: Show all options for maximum flexibility */}
                      {selectedFlow?.value === 'sequential' && (
                        <>
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, restBetweenSets: 90, restBetweenExercises: 120 }));
                              setNoRestBetweenSets(false);
                              setNoRestBetweenExercises(false);
                            }}
                          >
                            Strength (90s/2min)
                          </Button>
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, restBetweenSets: 60, restBetweenExercises: 90 }));
                              setNoRestBetweenSets(false);
                              setNoRestBetweenExercises(false);
                            }}
                          >
                            Endurance (60s/90s)
                          </Button>
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, restBetweenSets: 45, restBetweenExercises: 75 }));
                              setNoRestBetweenSets(false);
                              setNoRestBetweenExercises(false);
                            }}
                          >
                            HIIT (45s/75s)
                          </Button>
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, restBetweenSets: 0, restBetweenExercises: 0 }));
                              setNoRestBetweenSets(true);
                              setNoRestBetweenExercises(true);
                            }}
                          >
                            No Rest
                          </Button>
                        </>
                      )}
                      
                      {/* Circuit: Show minimal rest options */}
                      {selectedFlow?.value === 'circuit' && (
                        <>
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, restBetweenSets: 0, restBetweenExercises: 0 }));
                              setNoRestBetweenSets(true);
                              setNoRestBetweenExercises(true);
                            }}
                          >
                            Continuous (No rest)
                          </Button>
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, restBetweenSets: 15, restBetweenExercises: 30 }));
                              setNoRestBetweenSets(false);
                              setNoRestBetweenExercises(false);
                            }}
                          >
                            Minimal (15s/30s)
                          </Button>
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, restBetweenSets: 30, restBetweenExercises: 45 }));
                              setNoRestBetweenSets(false);
                              setNoRestBetweenExercises(false);
                            }}
                          >
                            Moderate (30s/45s)
                          </Button>
                        </>
                      )}
                    </HStack>
                  </Box>
                )}

            <SimpleGrid columns={restConfig.showRestBetweenSets && restConfig.showRestBetweenExercises ? 2 : 1} spacing={4}>
              {restConfig.showRestBetweenSets && (
                <FormControl opacity={restConfig.enableRestBetweenSets ? 1 : 0.6}>
                  <FormLabel>Rest Between Sets</FormLabel>
                  <VStack align="stretch" spacing={3}>
                    <HStack>
                      <Switch
                        id="no-rest-between-sets"
                        isChecked={noRestBetweenSets}
                        onChange={(e) => restConfig.enableRestBetweenSets ? handleNoRestBetweenSetsChange(e.target.checked) : null}
                        colorScheme="red"
                        isDisabled={!restConfig.enableRestBetweenSets}
                      />
                      <FormLabel htmlFor="no-rest-between-sets" mb="0" fontSize="sm" color="gray.600">
                        No rest between sets
                      </FormLabel>
                    </HStack>
                    {!noRestBetweenSets && (
                      <NumberInput
                        value={formData.restBetweenSets || 60}
                        onChange={(_, num) => restConfig.enableRestBetweenSets ? setFormData(prev => ({ ...prev, restBetweenSets: num })) : null}
                        min={1}
                        max={300}
                        isDisabled={!restConfig.enableRestBetweenSets}
                      >
                        <NumberInputField placeholder="Seconds" />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    )}
                    {noRestBetweenSets && (
                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                        Sets will transition immediately with no rest
                      </Text>
                    )}
                    {!noRestBetweenSets && restConfig.enableRestBetweenSets && (
                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                        Rest time after completing all reps in a set
                      </Text>
                    )}
                  </VStack>
                </FormControl>
              )}
              
              {restConfig.showRestBetweenExercises && (
                <FormControl opacity={restConfig.enableRestBetweenExercises ? 1 : 0.6}>
                  <FormLabel>Rest Between Exercises</FormLabel>
                  <VStack align="stretch" spacing={3}>
                    <HStack>
                      <Switch
                        id="no-rest-between-exercises"
                        isChecked={noRestBetweenExercises}
                        onChange={(e) => restConfig.enableRestBetweenExercises ? handleNoRestBetweenExercisesChange(e.target.checked) : null}
                        colorScheme="red"
                        isDisabled={!restConfig.enableRestBetweenExercises}
                      />
                      <FormLabel htmlFor="no-rest-between-exercises" mb="0" fontSize="sm" color="gray.600">
                        No rest between exercises
                      </FormLabel>
                    </HStack>
                    {!noRestBetweenExercises && (
                <NumberInput
                        value={formData.restBetweenExercises || 90}
                        onChange={(_, num) => restConfig.enableRestBetweenExercises ? setFormData(prev => ({ ...prev, restBetweenExercises: num })) : null}
                  min={0}
                  max={300}
                        isDisabled={!restConfig.enableRestBetweenExercises}
                >
                        <NumberInputField placeholder="Seconds" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                    )}
                    {noRestBetweenExercises && (
                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                        Exercises will transition immediately with no rest
                      </Text>
                    )}
                    {!noRestBetweenExercises && restConfig.enableRestBetweenExercises && (
                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                        Rest time when moving to the next exercise
                      </Text>
                    )}
                  </VStack>
                </FormControl>
              )}
            </SimpleGrid>
            
            </VStack>
              </FormControl>
              
            <SimpleGrid columns={2} spacing={4}>
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
        </DrawerBody>
        
        <DrawerFooter borderTop="1px solid" borderColor="gray.200">
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSave}>
            Save Block
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
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
    const template = BLOCK_TEMPLATES[category];
    const categoryConfig = BLOCK_CATEGORIES.find(c => c.value === category);
    
    const newBlock: WorkoutBlock = {
      id: `${category}-${Date.now()}`,
      name: template?.name || categoryConfig?.label || 'New Block',
      category: category as WorkoutBlock['category'],
      flow: template?.flow as WorkoutBlock['flow'] || 'sequential',
      exercises: [],
      restBetweenExercises: template?.restBetweenExercises || categoryConfig?.defaultRestBetweenExercises || 90,
      restBetweenSets: template?.restBetweenSets || categoryConfig?.defaultRestBetweenSets || 60,
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
      restBetweenExercises: 90,
      restBetweenSets: 60,
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