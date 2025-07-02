import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  Select,
  Collapse,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  AddIcon,
  SettingsIcon,
  DragHandleIcon,
  DeleteIcon,
  CopyIcon,
} from '@chakra-ui/icons';
import { MoreVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseBlock as ExerciseBlockType } from '../../types/workout-blocks';

interface ExerciseBlockProps {
  block: ExerciseBlockType;
  onUpdateBlock: (updatedBlock: ExerciseBlockType) => void;
  onDeleteBlock: () => void;
  onDuplicateBlock: () => void;
  onAddExercise?: () => void; // Made optional - using drag and drop only
  children?: React.ReactNode; // For draggable exercises
  isCollapsed?: boolean;
  showSettings?: boolean;
}

export const ExerciseBlock: React.FC<ExerciseBlockProps> = ({
  block,
  onUpdateBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onAddExercise,
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(block.name || '');
  const [showSettings, setShowSettings] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      type: 'block',
      blockId: block.id,
    },
  });

  // Make block droppable for library exercises
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${block.id}`,
    data: {
      type: 'block',
      blockId: block.id,
    },
  });

  // Combine both refs
  const setRefs = (element: HTMLElement | null) => {
    setNodeRef(element);
    setDropRef(element);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.8 : 1,
    willChange: isDragging ? 'transform' : 'auto',
    transformOrigin: 'top left',
    zIndex: isDragging ? 1000 : 'auto',
  };

  // Theme colors
  const blockBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('white', 'gray.800');
  const settingsBg = useColorModeValue('gray.100', 'gray.600');

  // Get block category colors
  const getCategoryColor = (category: string) => {
    const colors = {
      warmup: 'orange',
      main: 'blue',
      accessory: 'green',
      cooldown: 'purple',
      conditioning: 'red',
    };
    return colors[category] || 'gray';
  };

  const handleNameSave = () => {
    onUpdateBlock({ ...block, name: tempName });
    setIsEditing(false);
  };

  const handleSettingChange = (key: keyof ExerciseBlockType, value: any) => {
    onUpdateBlock({ ...block, [key]: value });
  };

  const flowOptions = [
    { value: 'sequential', label: 'Sequential', desc: 'One exercise at a time' },
    { value: 'circuit', label: 'Circuit', desc: 'Repeat all exercises for rounds' },
    { value: 'superset', label: 'Superset', desc: 'Back-to-back exercises' },
    { value: 'emom', label: 'EMOM', desc: 'Every minute on the minute' },
    { value: 'amrap', label: 'AMRAP', desc: 'As many rounds as possible' },
  ];

  return (
    <Box
      ref={setRefs}
      style={style}
      bg={blockBg}
      border="2px"
      borderColor={isOver ? 'blue.300' : borderColor}
      borderRadius="lg"
      overflow="hidden"
      mb={4}
      shadow={isOver ? 'lg' : 'sm'}
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
    >
      {/* Block Header */}
      <HStack
        bg={headerBg}
        p={3}
        justify="space-between"
        borderBottom="1px"
        borderColor={borderColor}
      >
        <HStack spacing={3}>
          {/* Drag Handle */}
          <IconButton
            {...attributes}
            {...listeners}
            icon={<DragHandleIcon />}
            size="sm"
            variant="ghost"
            cursor="grab"
            _active={{ cursor: 'grabbing' }}
            aria-label="Drag block"
          />

          {/* Block Name/Title */}
          {isEditing ? (
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSave}
              onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
              size="sm"
              width="200px"
              autoFocus
            />
          ) : (
            <Text
              fontWeight="bold"
              fontSize="lg"
              cursor="pointer"
              onClick={() => {
                setTempName(block.name || '');
                setIsEditing(true);
              }}
            >
              {block.name || 'Untitled Block'}
            </Text>
          )}

          {/* Category Badge */}
          <Badge
            colorScheme={getCategoryColor(block.category)}
            size="sm"
          >
            {block.category}
          </Badge>

          {/* Flow Type Badge */}
          <Badge variant="outline" size="sm">
            {block.flow}
            {block.rounds && block.rounds > 1 && ` (${block.rounds}x)`}
          </Badge>

          {/* Exercise Count */}
          <Text fontSize="sm" color="gray.500">
            {block.exercises.length} exercises
          </Text>
        </HStack>

        <HStack>
          {/* Settings Toggle */}
          <Tooltip label="Block Settings">
            <IconButton
              icon={<SettingsIcon />}
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Block settings"
            />
          </Tooltip>

          {/* Block Menu */}
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<MoreVertical size={16} />}
              size="sm"
              variant="ghost"
              aria-label="Block options"
            />
            <MenuList>
              <MenuItem icon={<CopyIcon />} onClick={onDuplicateBlock}>
                Duplicate Block
              </MenuItem>
              <MenuItem icon={<DeleteIcon />} onClick={onDeleteBlock} color="red.500">
                Delete Block
              </MenuItem>
            </MenuList>
          </Menu>

          {/* Collapse Toggle */}
          <IconButton
            icon={block.isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
            size="sm"
            variant="ghost"
            onClick={() => handleSettingChange('isCollapsed', !block.isCollapsed)}
            aria-label={block.isCollapsed ? 'Expand block' : 'Collapse block'}
          />
        </HStack>
      </HStack>

      {/* Block Settings Panel */}
      <Collapse in={showSettings}>
        <Box bg={settingsBg} p={4} borderBottom="1px" borderColor={borderColor}>
          <VStack spacing={3} align="stretch">
            <HStack>
              {/* Flow Type */}
              <Box flex={1}>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Flow Type
                </Text>
                <Select
                  size="sm"
                  value={block.flow}
                  onChange={(e) => handleSettingChange('flow', e.target.value)}
                >
                  {flowOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Box>

              {/* Rounds (for circuit/superset) */}
              {(block.flow === 'circuit' || block.flow === 'superset') && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Rounds
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    width="80px"
                    value={block.rounds || 1}
                    onChange={(e) => handleSettingChange('rounds', parseInt(e.target.value))}
                    min={1}
                  />
                </Box>
              )}

              {/* Rest Between Exercises */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  Rest (sec)
                </Text>
                <Input
                  size="sm"
                  type="number"
                  width="80px"
                  value={block.restBetweenExercises || 60}
                  onChange={(e) => handleSettingChange('restBetweenExercises', parseInt(e.target.value))}
                  min={0}
                />
              </Box>
            </HStack>

            {/* Time Cap (for EMOM/AMRAP) */}
            {(block.flow === 'emom' || block.flow === 'amrap') && (
              <HStack>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    Time Cap (minutes)
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    width="120px"
                    value={block.timeCapMinutes || 10}
                    onChange={(e) => handleSettingChange('timeCapMinutes', parseInt(e.target.value))}
                    min={1}
                  />
                </Box>
              </HStack>
            )}

            {/* Block Notes */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Notes
              </Text>
              <Input
                size="sm"
                placeholder="Block instructions or notes..."
                value={block.notes || ''}
                onChange={(e) => handleSettingChange('notes', e.target.value)}
              />
            </Box>
          </VStack>
        </Box>
      </Collapse>

      {/* Exercises Area */}
      <Collapse in={!block.isCollapsed}>
        <Box p={4}>
          <VStack spacing={2} align="stretch">
            {/* Exercise Drop Zone */}
            {children}
            
            {/* Drag Exercise Area */}
            <Button
              leftIcon={<AddIcon />}
              size="sm"
              variant="dashed"
              colorScheme="blue"
              h={12}
              disabled
              _hover={{}}
              cursor="default"
            >
              Drag Exercise Here
            </Button>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
}; 