import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  VStack, HStack, FormControl, FormLabel, Input, Textarea, Select, Button,
  Text, useToast, useColorModeValue, Divider, Box, Alert, AlertIcon,
  FormErrorMessage, Badge, Icon
} from '@chakra-ui/react';
import { FaCalendarAlt, FaSave, FaTimes } from 'react-icons/fa';
import { WeeklyWorkoutSelector } from './WeeklyWorkoutSelector';
import { api } from '../services/api';
import type { Workout } from '../services/api';

interface MonthlyPlanCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingPlan?: any; // For future editing functionality
}



export function MonthlyPlanCreator({
  isOpen,
  onClose,
  onSuccess,
  editingPlan
}: MonthlyPlanCreatorProps) {
  const toast = useToast();
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const infoColor = useColorModeValue('gray.600', 'gray.200');

  // Helper function to format date without timezone issues
  const formatLocalDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString();
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: (() => {
      // Default to today's date
      const today = new Date();
      return today.toISOString().split('T')[0]; // YYYY-MM-DD format
    })(),
    weeks: [
      { week_number: 1, workout_id: '', is_rest_week: false },
      { week_number: 2, workout_id: '', is_rest_week: false },
      { week_number: 3, workout_id: '', is_rest_week: false },
      { week_number: 4, workout_id: '', is_rest_week: false }
    ]
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [availableWorkouts, setAvailableWorkouts] = useState<Workout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load available weekly workout templates
  useEffect(() => {
    if (isOpen) {
      loadAvailableWorkouts();
      if (editingPlan) {
        loadEditingPlan();
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingPlan]);

  // Reset form completely when modal closes to ensure clean state
  useEffect(() => {
    if (!isOpen) {
      // Reset to fresh state when modal closes
      setFormData({
        name: '',
        description: '',
        startDate: (() => {
          const today = new Date();
          return today.toISOString().split('T')[0];
        })(),
        weeks: [
          { week_number: 1, workout_id: '', is_rest_week: false },
          { week_number: 2, workout_id: '', is_rest_week: false },
          { week_number: 3, workout_id: '', is_rest_week: false },
          { week_number: 4, workout_id: '', is_rest_week: false }
        ]
      });
      setErrors({});
    }
  }, [isOpen]);

  const loadAvailableWorkouts = async () => {
    try {
      setWorkoutsLoading(true);
      const profile = await api.profile.get();
      const workouts = await api.workouts.getTemplates(profile.id, 'weekly');
      setAvailableWorkouts(workouts);
    } catch (error) {
      console.error('Error loading workout templates:', error);
      toast({
        title: 'Error loading workout templates',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setWorkoutsLoading(false);
    }
  };

  const loadEditingPlan = () => {
    if (editingPlan) {
      // Use start_date from database directly
      let startDate;
      if (editingPlan.start_date) {
        startDate = editingPlan.start_date;
      } else if (editingPlan.startDate) {
        // Fallback for different naming
        startDate = editingPlan.startDate;
      } else {
        // Default to today
        const today = new Date();
        startDate = today.toISOString().split('T')[0];
      }

      setFormData({
        name: editingPlan.name || '',
        description: editingPlan.description || '',
        startDate: startDate,
        weeks: editingPlan.weeks || [
          { week_number: 1, workout_id: '', is_rest_week: false },
          { week_number: 2, workout_id: '', is_rest_week: false },
          { week_number: 3, workout_id: '', is_rest_week: false },
          { week_number: 4, workout_id: '', is_rest_week: false }
        ]
      });
    }
    setErrors({});
  };

  const resetForm = () => {
    if (!editingPlan) {
      setFormData({
        name: '',
        description: '',
        startDate: (() => {
          const today = new Date();
          return today.toISOString().split('T')[0];
        })(),
        weeks: [
          { week_number: 1, workout_id: '', is_rest_week: false },
          { week_number: 2, workout_id: '', is_rest_week: false },
          { week_number: 3, workout_id: '', is_rest_week: false },
          { week_number: 4, workout_id: '', is_rest_week: false }
        ]
      });
    }
    setErrors({});
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      // Get today's date in YYYY-MM-DD format (same format as input)
      const today = new Date();
      const todayString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      // Compare date strings directly to avoid timezone issues
      if (formData.startDate < todayString) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }

    // Check that non-rest weeks have workouts selected
    const trainingWeeks = formData.weeks.filter(w => !w.is_rest_week);
    const incompleteWeeks = trainingWeeks.filter(w => !w.workout_id);
    
    if (incompleteWeeks.length > 0) {
      newErrors.weeks = `Please select workouts for all training weeks (Week${incompleteWeeks.length > 1 ? 's' : ''} ${incompleteWeeks.map(w => w.week_number).join(', ')})`;
    }

    if (formData.weeks.length === 0) {
      newErrors.weeks = 'At least one week is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Calculate end_date based on start_date and number of weeks
      const [yearStr, monthStr, dayStr] = formData.startDate.split('-');
      const startYear = parseInt(yearStr, 10);
      const startMonth = parseInt(monthStr, 10) - 1; // Month is 0-indexed in Date constructor
      const startDay = parseInt(dayStr, 10);
      
      const startDate = new Date(startYear, startMonth, startDay);
      const numberOfWeeks = formData.weeks.length;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (numberOfWeeks * 7) - 1); // -1 to include the start day

      const planData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        start_date: formData.startDate,
        end_date: endDate.getFullYear() + '-' + 
          String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
          String(endDate.getDate()).padStart(2, '0'),
        weeks: formData.weeks.map(week => ({
          week_number: week.week_number,
          workout_id: week.is_rest_week ? '' : week.workout_id,
          is_rest_week: week.is_rest_week
        }))
      };

      let result;
      if (editingPlan) {
        // Update existing plan
        result = await api.monthlyPlans.update(editingPlan.id, planData);
        toast({
          title: 'Monthly plan updated successfully!',
          description: `"${planData.name}" has been updated starting ${formatLocalDate(formData.startDate)}`,
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      } else {
        // Create new plan
        result = await api.monthlyPlans.create(planData);
        toast({
          title: 'Monthly plan created successfully!',
          description: `"${planData.name}" has been created starting ${formatLocalDate(formData.startDate)}`,
          status: 'success',
          duration: 5000,
          isClosable: true
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(`Error ${editingPlan ? 'updating' : 'creating'} monthly plan:`, error);
      toast({
        title: `Error ${editingPlan ? 'updating' : 'creating'} monthly plan`,
        description: error instanceof Error ? error.message : 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={FaCalendarAlt} color="teal.500" boxSize={6} />
            <Text color={titleColor}>
              {editingPlan ? 'Edit Monthly Plan' : 'Create Monthly Plan'}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={loading} />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color={titleColor} mb={4}>
                Plan Details
              </Text>
              
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel>Plan Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., January Training Block"
                    disabled={loading}
                  />
                  <FormErrorMessage>{errors.name}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>Description (Optional)</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the goals and focus of this monthly plan..."
                    rows={3}
                    disabled={loading}
                  />
                </FormControl>

                <FormControl isInvalid={!!errors.startDate}>
                  <FormLabel>Training Start Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={loading}
                    min={new Date().toISOString().split('T')[0]} // Minimum today's date
                  />
                  <FormErrorMessage>{errors.startDate}</FormErrorMessage>
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* Weekly Schedule */}
            <Box>
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between" align="center">
                  <Text fontSize="lg" fontWeight="semibold" color={titleColor}>
                    Weekly Schedule
                  </Text>
                  <Badge colorScheme="teal" px={3} py={1} borderRadius="md">
                    Starting {formatLocalDate(formData.startDate)}
                  </Badge>
                </HStack>

                {errors.weeks && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {errors.weeks}
                  </Alert>
                )}

                <WeeklyWorkoutSelector
                  weeks={formData.weeks}
                  availableWorkouts={availableWorkouts}
                  loading={workoutsLoading}
                  onChange={(weeks) => setFormData({ ...formData, weeks })}
                  maxWeeks={6}
                />
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              <Icon as={FaTimes} mr={2} />
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText={editingPlan ? "Updating..." : "Creating..."}
              disabled={loading}
            >
              <Icon as={FaSave} mr={2} />
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 