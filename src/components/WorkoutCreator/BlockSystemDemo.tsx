import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Alert,
  AlertIcon,
  useColorModeValue,
  Heading,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import { Layers, Play, Grid } from 'lucide-react';

// Import our new components
import { BlockModeToggle } from './BlockModeToggle';
import { WorkoutMigration, getTotalExercisesFromBlocks } from '../../utils/workout-migration';
import { BLOCK_TEMPLATES } from '../../utils/block-templates';

export const BlockSystemDemo: React.FC = () => {
  const [isBlockMode, setIsBlockMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [demoWorkout, setDemoWorkout] = useState<any>(null);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Sample exercises for demo
  const sampleExercises = [
    { name: 'Dynamic Warm-up', sets: 1, reps: 10, notes: 'Prepare your body' },
    { name: 'Sprint Intervals', sets: 6, reps: 1, distance: 200, notes: '90% effort' },
    { name: 'Strength Circuit', sets: 3, reps: 12, notes: 'Focus on form' },
    { name: 'Cool-down Stretch', sets: 1, reps: 5, rest: 30, notes: 'Hold each stretch' },
  ];

  const handleBlockModeToggle = (newMode: boolean) => {
    setIsBlockMode(newMode);
    
    if (newMode) {
      // Convert sample exercises to blocks
      const blocks = WorkoutMigration.autoCreateBlocks(sampleExercises);
      setDemoWorkout({ blocks, is_block_based: true });
    } else {
      // Convert back to regular exercises
      setDemoWorkout({ exercises: sampleExercises, is_block_based: false });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = BLOCK_TEMPLATES[templateId];
    if (template) {
      setDemoWorkout({
        blocks: [{ ...template, id: `demo-${Date.now()}` }],
        is_block_based: true
      });
      setIsBlockMode(true);
    }
  };

  const exerciseCount = isBlockMode 
    ? (demoWorkout?.blocks ? getTotalExercisesFromBlocks(demoWorkout.blocks) : 0)
    : sampleExercises.length;

  const blockCount = demoWorkout?.blocks?.length || 0;

  return (
    <Box p={6} bg={bg} borderRadius="lg" border="1px" borderColor={borderColor}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <VStack spacing={2} align="center">
          <HStack spacing={2}>
            <Layers size={24} color="#3182CE" />
            <Heading size="md" color="blue.500">
              Workout Blocks System Demo
            </Heading>
          </HStack>
          <Text textAlign="center" color="gray.600" fontSize="sm">
            Experience the new block-based workout creation system
          </Text>
        </VStack>

        <Divider />

        {/* Block Mode Toggle */}
        <BlockModeToggle
          isBlockMode={isBlockMode}
          onToggle={handleBlockModeToggle}
          exerciseCount={exerciseCount}
          blockCount={blockCount}
        />

        {/* Template Showcase */}
        <Box>
          <Text fontWeight="bold" mb={3}>
            🚀 Try Pre-built Templates:
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Grid size={16} />}
              onClick={() => handleTemplateSelect('dynamicWarmup')}
              isActive={selectedTemplate === 'dynamicWarmup'}
            >
              Dynamic Warm-up
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Grid size={16} />}
              onClick={() => handleTemplateSelect('sprintIntervals')}
              isActive={selectedTemplate === 'sprintIntervals'}
            >
              Sprint Intervals
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Grid size={16} />}
              onClick={() => handleTemplateSelect('strengthCircuit')}
              isActive={selectedTemplate === 'strengthCircuit'}
            >
              Strength Circuit
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Grid size={16} />}
              onClick={() => handleTemplateSelect('staticCooldown')}
              isActive={selectedTemplate === 'staticCooldown'}
            >
              Static Cool-down
            </Button>
          </SimpleGrid>
        </Box>

        {/* Demo Results */}
        {demoWorkout && (
          <Box bg="gray.50" p={4} borderRadius="md">
            <Text fontWeight="bold" mb={2}>
              📊 Demo Results:
            </Text>
            
            {isBlockMode ? (
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm">Mode:</Text>
                  <Badge colorScheme="green">Block Mode</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Blocks:</Text>
                  <Text fontSize="sm" fontWeight="bold">{blockCount}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Total Exercises:</Text>
                  <Text fontSize="sm" fontWeight="bold">{exerciseCount}</Text>
                </HStack>
                {demoWorkout.blocks?.map((block: any, index: number) => (
                  <Box key={block.id} pl={4} borderLeft="2px" borderColor="blue.200">
                    <Text fontSize="xs" color="blue.600" fontWeight="bold">
                      Block {index + 1}: {block.name}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {block.exercises.length} exercises • {block.flow} flow • {block.category}
                    </Text>
                  </Box>
                ))}
              </VStack>
            ) : (
              <VStack spacing={2} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm">Mode:</Text>
                  <Badge colorScheme="blue">Exercise Mode</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Exercises:</Text>
                  <Text fontSize="sm" fontWeight="bold">{exerciseCount}</Text>
                </HStack>
              </VStack>
            )}
          </Box>
        )}

        {/* Features Summary */}
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" fontWeight="medium">
              ✅ Week 1 Implementation Complete:
            </Text>
            <Text fontSize="xs">
              • Database migration ready • API supports blocks • Exercise Execution Modal is block-aware • Auto-migration utilities • Pre-built templates
            </Text>
          </VStack>
        </Alert>

        {/* Next Steps */}
        <Box bg="blue.50" p={4} borderRadius="md" border="1px" borderColor="blue.200">
          <Text fontSize="sm" fontWeight="bold" color="blue.700" mb={1}>
            🔮 Coming in Week 2:
          </Text>
          <Text fontSize="xs" color="blue.600">
            • Full drag & drop interface • Advanced flow types (EMOM, AMRAP) • Template marketplace • Enhanced execution modal • Block analytics
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}; 