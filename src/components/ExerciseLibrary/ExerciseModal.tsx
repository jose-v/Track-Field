import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Text,
  useColorModeValue,
  Box,
  Wrap,
  WrapItem,
  IconButton,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { Plus, X } from 'lucide-react';
import { Exercise } from './ExerciseLibrary';

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: Omit<Exercise, 'id'>) => Promise<void>;
  title: string;
  categories: string[];
  initialData?: Exercise;
}

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Biceps', 'Triceps', 'Forearms',
  'Core', 'Abs', 'Obliques', 'Lower Back', 'Legs', 'Quadriceps', 'Hamstrings',
  'Glutes', 'Calves', 'Hip Flexors', 'Adductors', 'Abductors', 'Full Body'
];

const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbell', 'Kettlebell', 'Resistance Bands', 'Pull-up Bar',
  'Bench', 'Squat Rack', 'Cable Machine', 'Smith Machine', 'Leg Press',
  'Treadmill', 'Rowing Machine', 'Bike', 'Medicine Ball', 'Foam Roller',
  'Suspension Trainer', 'Battle Ropes', 'Plyometric Box', 'Agility Ladder',
  'Cones', 'Hurdles', 'Track', 'Field', 'Pool', 'Bodyweight Only', 'None'
];

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  categories,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    muscle_groups: [] as string[],
    equipment: [] as string[],
  });
  
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customMuscleGroup, setCustomMuscleGroup] = useState('');
  const [customEquipment, setCustomEquipment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const labelColor = useColorModeValue('gray.600', 'gray.200');

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          category: initialData.category,
          description: initialData.description,
          difficulty: initialData.difficulty || 'Beginner',
          muscle_groups: initialData.muscle_groups || [],
          equipment: initialData.equipment || [],
        });
        setShowCustomCategory(!categories.includes(initialData.category));
        if (!categories.includes(initialData.category)) {
          setCustomCategory(initialData.category);
        }
      } else {
        setFormData({
          name: '',
          category: '',
          description: '',
          difficulty: 'Beginner',
          muscle_groups: [],
          equipment: [],
        });
        setShowCustomCategory(false);
        setCustomCategory('');
      }
      setCustomMuscleGroup('');
      setCustomEquipment('');
    }
  }, [isOpen, initialData, categories]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'Custom') {
      setShowCustomCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setShowCustomCategory(false);
      setCustomCategory('');
      setFormData(prev => ({ ...prev, category: value }));
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim()) {
      setFormData(prev => ({ ...prev, category: customCategory.trim() }));
      setShowCustomCategory(false);
      setCustomCategory('');
    }
  };

  const handleAddMuscleGroup = (muscleGroup: string) => {
    if (!formData.muscle_groups.includes(muscleGroup)) {
      setFormData(prev => ({
        ...prev,
        muscle_groups: [...prev.muscle_groups, muscleGroup]
      }));
    }
  };

  const handleAddCustomMuscleGroup = () => {
    if (customMuscleGroup.trim() && !formData.muscle_groups.includes(customMuscleGroup.trim())) {
      setFormData(prev => ({
        ...prev,
        muscle_groups: [...prev.muscle_groups, customMuscleGroup.trim()]
      }));
      setCustomMuscleGroup('');
    }
  };

  const handleRemoveMuscleGroup = (muscleGroup: string) => {
    setFormData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.filter(mg => mg !== muscleGroup)
    }));
  };

  const handleAddEquipment = (equipment: string) => {
    if (!formData.equipment.includes(equipment)) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, equipment]
      }));
    }
  };

  const handleAddCustomEquipment = () => {
    if (customEquipment.trim() && !formData.equipment.includes(customEquipment.trim())) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, customEquipment.trim()]
      }));
      setCustomEquipment('');
    }
  };

  const handleRemoveEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter(eq => eq !== equipment)
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter an exercise name.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.category.trim()) {
      toast({
        title: 'Category required',
        description: 'Please select or enter a category.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Description required',
        description: 'Please enter a description for the exercise.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const exerciseData: Omit<Exercise, 'id'> = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        muscle_groups: formData.muscle_groups,
        equipment: formData.equipment,
      };

      await onSave(exerciseData);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="90vh">
        <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
          {title}
        </ModalHeader>
        <ModalCloseButton isDisabled={isSubmitting} />
        
        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Exercise Name */}
            <FormControl isRequired>
              <FormLabel color={labelColor} fontWeight="semibold">Exercise Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Barbell Squats, Push-ups, 100m Sprint"
                size="lg"
                isDisabled={isSubmitting}
              />
            </FormControl>

            {/* Category */}
            <FormControl isRequired>
              <FormLabel color={labelColor} fontWeight="semibold">Category</FormLabel>
              {!showCustomCategory ? (
                <Select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  placeholder="Select a category"
                  size="lg"
                  isDisabled={isSubmitting}
                >
                  {categories.filter(cat => cat !== 'Custom').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  <option value="Custom">+ Add Custom Category</option>
                </Select>
              ) : (
                <HStack>
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category name"
                    size="lg"
                    isDisabled={isSubmitting}
                  />
                  <Button
                    onClick={handleAddCustomCategory}
                    colorScheme="blue"
                    size="lg"
                    isDisabled={!customCategory.trim() || isSubmitting}
                  >
                    Add
                  </Button>
                  <IconButton
                    icon={<X size={20} />}
                    onClick={() => {
                      setShowCustomCategory(false);
                      setCustomCategory('');
                      setFormData(prev => ({ ...prev, category: '' }));
                    }}
                    aria-label="Cancel custom category"
                    size="lg"
                    variant="ghost"
                    isDisabled={isSubmitting}
                  />
                </HStack>
              )}
              {formData.category && !showCustomCategory && (
                <Text fontSize="sm" color="green.500" mt={1}>
                  Selected: {formData.category}
                </Text>
              )}
            </FormControl>

            {/* Description */}
            <FormControl isRequired>
              <FormLabel color={labelColor} fontWeight="semibold">Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe how to perform this exercise, including form cues and technique tips..."
                rows={4}
                resize="vertical"
                isDisabled={isSubmitting}
              />
            </FormControl>

            {/* Difficulty */}
            <FormControl>
              <FormLabel color={labelColor} fontWeight="semibold">Difficulty Level</FormLabel>
              <Select
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                size="lg"
                isDisabled={isSubmitting}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </Select>
            </FormControl>

            <Divider />

            {/* Muscle Groups */}
            <FormControl>
              <FormLabel color={labelColor} fontWeight="semibold">Target Muscle Groups</FormLabel>
              
              {/* Selected Muscle Groups */}
              {formData.muscle_groups.length > 0 && (
                <Box mb={3}>
                  <Text fontSize="sm" color={labelColor} mb={2}>Selected:</Text>
                  <Wrap spacing={2}>
                    {formData.muscle_groups.map((muscle) => (
                      <WrapItem key={muscle}>
                        <Tag size="md" colorScheme="blue" variant="solid">
                          <TagLabel>{muscle}</TagLabel>
                          <TagCloseButton 
                            onClick={() => handleRemoveMuscleGroup(muscle)}
                            isDisabled={isSubmitting}
                          />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}

              {/* Predefined Muscle Groups */}
              <Box mb={3}>
                <Text fontSize="sm" color={labelColor} mb={2}>Quick Add:</Text>
                <Wrap spacing={2}>
                  {MUSCLE_GROUPS.filter(mg => !formData.muscle_groups.includes(mg)).map((muscle) => (
                    <WrapItem key={muscle}>
                      <Tag
                        size="md"
                        variant="outline"
                        cursor="pointer"
                        onClick={() => handleAddMuscleGroup(muscle)}
                        _hover={{ bg: 'blue.50' }}
                        isDisabled={isSubmitting}
                      >
                        <TagLabel>{muscle}</TagLabel>
                        <Plus size={12} style={{ marginLeft: '4px' }} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>

              {/* Custom Muscle Group */}
              <HStack>
                <Input
                  value={customMuscleGroup}
                  onChange={(e) => setCustomMuscleGroup(e.target.value)}
                  placeholder="Add custom muscle group"
                  size="sm"
                  isDisabled={isSubmitting}
                />
                <Button
                  onClick={handleAddCustomMuscleGroup}
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  isDisabled={!customMuscleGroup.trim() || isSubmitting}
                >
                  Add
                </Button>
              </HStack>
            </FormControl>

            {/* Equipment */}
            <FormControl>
              <FormLabel color={labelColor} fontWeight="semibold">Required Equipment</FormLabel>
              
              {/* Selected Equipment */}
              {formData.equipment.length > 0 && (
                <Box mb={3}>
                  <Text fontSize="sm" color={labelColor} mb={2}>Selected:</Text>
                  <Wrap spacing={2}>
                    {formData.equipment.map((equipment) => (
                      <WrapItem key={equipment}>
                        <Tag size="md" colorScheme="green" variant="solid">
                          <TagLabel>{equipment}</TagLabel>
                          <TagCloseButton 
                            onClick={() => handleRemoveEquipment(equipment)}
                            isDisabled={isSubmitting}
                          />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}

              {/* Predefined Equipment */}
              <Box mb={3}>
                <Text fontSize="sm" color={labelColor} mb={2}>Quick Add:</Text>
                <Wrap spacing={2}>
                  {EQUIPMENT_OPTIONS.filter(eq => !formData.equipment.includes(eq)).map((equipment) => (
                    <WrapItem key={equipment}>
                      <Tag
                        size="md"
                        variant="outline"
                        cursor="pointer"
                        onClick={() => handleAddEquipment(equipment)}
                        _hover={{ bg: 'green.50' }}
                        isDisabled={isSubmitting}
                      >
                        <TagLabel>{equipment}</TagLabel>
                        <Plus size={12} style={{ marginLeft: '4px' }} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>

              {/* Custom Equipment */}
              <HStack>
                <Input
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  placeholder="Add custom equipment"
                  size="sm"
                  isDisabled={isSubmitting}
                />
                <Button
                  onClick={handleAddCustomEquipment}
                  size="sm"
                  colorScheme="green"
                  variant="outline"
                  isDisabled={!customEquipment.trim() || isSubmitting}
                >
                  Add
                </Button>
              </HStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={handleClose}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Saving..."
          >
            {initialData ? 'Update Exercise' : 'Add Exercise'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 