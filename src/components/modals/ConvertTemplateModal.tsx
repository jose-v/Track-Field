import React, { useState } from 'react';
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
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
  useToast,
  Flex,
  Icon
} from '@chakra-ui/react';
import { FaLayerGroup, FaTasks } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { api } from '../../services/api';

interface ConvertTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: any;
  onSuccess?: () => void;
}

export function ConvertTemplateModal({ 
  isOpen, 
  onClose, 
  template,
  onSuccess 
}: ConvertTemplateModalProps) {
  const [workoutName, setWorkoutName] = useState(`${template.name} - ${new Date().toLocaleDateString()}`);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  
  const toast = useToast();
  
  const modalBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.700', 'gray.300');

  // Get exercise/block count
  const getExerciseCount = () => {
    if (template.is_block_based && template.blocks) {
      if (typeof template.blocks === 'object' && !Array.isArray(template.blocks)) {
        // Weekly block-based: sum exercises from all days
        return Object.values(template.blocks as Record<string, any[]>).reduce((total: number, dayBlocks: any) => {
          if (Array.isArray(dayBlocks)) {
            return total + dayBlocks.reduce((dayTotal: number, block: any) => {
              return dayTotal + (block.exercises?.length || 0);
            }, 0);
          }
          return total;
        }, 0);
      } else if (Array.isArray(template.blocks)) {
        // Single day block-based: sum exercises from all blocks
        return template.blocks.reduce((total: number, block: any) => {
          return total + (block.exercises?.length || 0);
        }, 0);
      }
    }
    return template.exercises?.length || 0;
  };

  const getBlockCount = () => {
    if (template.is_block_based && template.blocks) {
      if (typeof template.blocks === 'object' && !Array.isArray(template.blocks)) {
        // Weekly: count total blocks across all days
        return Object.values(template.blocks as Record<string, any[]>).reduce((total: number, dayBlocks: any) => {
          return total + (Array.isArray(dayBlocks) ? dayBlocks.length : 0);
        }, 0);
      } else if (Array.isArray(template.blocks)) {
        // Single day: count blocks
        return template.blocks.length;
      }
    }
    return 0;
  };

  const handleConvert = async () => {
    if (!workoutName.trim()) {
      toast({
        title: 'Workout name required',
        description: 'Please enter a name for the workout.',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsConverting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Debug logging for template conversion
      console.log('🔄 Template Conversion Debug:', {
        templateName: template.name,
        template_type: template.template_type,
        is_block_based: template.is_block_based,
        hasBlocks: !!template.blocks,
        blocksType: typeof template.blocks,
        blocksIsArray: Array.isArray(template.blocks),
        blocksKeys: template.blocks ? Object.keys(template.blocks) : null,
        hasExercises: !!template.exercises,
        exercisesLength: template.exercises?.length,
        exercisesType: typeof template.exercises
      });

      // Create workout data from template
      const workoutData = {
        name: workoutName.trim(),
        type: template.type,
        template_type: template.template_type,
        date: date || null,
        time: time || null,
        duration: template.duration,
        location: location || null,
        description: template.description,
        notes: template.notes,
        is_template: false,  // This is a regular workout, not a template
        is_block_based: template.is_block_based || false,
        blocks: template.blocks || (template.template_type === 'weekly' ? {} : []),
        exercises: template.exercises || [],
        block_version: template.block_version || 1,
        user_id: user.id
      };

      console.log('💾 Workout Data to Save:', {
        name: workoutData.name,
        is_block_based: workoutData.is_block_based,
        hasBlocks: !!workoutData.blocks,
        blocksType: typeof workoutData.blocks,
        blocksKeys: workoutData.blocks ? Object.keys(workoutData.blocks) : null
      });

      // Save the workout using the API
      const savedWorkout = await api.workouts.create(workoutData);

      toast({
        title: 'Template converted!',
        description: `"${workoutName}" has been created and added to your workouts.`,
        status: 'success',
        duration: 4000,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error converting template:', error);
      toast({
        title: 'Conversion failed',
        description: 'There was an error converting the template. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleClose = () => {
    setWorkoutName(`${template.name} - ${new Date().toLocaleDateString()}`);
    setDate('');
    setTime('');
    setLocation('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg={modalBg} borderColor={borderColor} borderWidth="1px">
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text>Convert Template to Workout</Text>
            <HStack spacing={3}>
              <Badge colorScheme="purple" size="sm">
                TEMPLATE
              </Badge>
              <Text fontSize="sm" color={labelColor}>
                {template.name}
              </Text>
            </HStack>
            <HStack spacing={4} fontSize="sm" color={labelColor}>
              {template.is_block_based ? (
                <Flex align="center">
                  <Icon as={FaLayerGroup} mr={1} />
                  <Text>{getBlockCount()} blocks</Text>
                </Flex>
              ) : (
                <Flex align="center">
                  <Icon as={FaTasks} mr={1} />
                  <Text>{getExerciseCount()} exercises</Text>
                </Flex>
              )}
              {template.template_type && (
                <Text>• {template.template_type === 'weekly' ? 'Weekly Plan' : 'Single Workout'}</Text>
              )}
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel color={labelColor}>Workout Name</FormLabel>
              <Input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="Enter workout name"
              />
            </FormControl>

            <FormControl>
              <FormLabel color={labelColor}>Date</FormLabel>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={labelColor}>Time</FormLabel>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={labelColor}>Location</FormLabel>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Gym, Track, etc. (optional)"
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleConvert}
              isLoading={isConverting}
              loadingText="Converting..."
            >
              Create Workout
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 