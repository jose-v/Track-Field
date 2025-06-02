import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Text, Button, Select, Switch, FormControl, FormLabel,
  Card, CardBody, Badge, Icon, useColorModeValue, Skeleton, SimpleGrid,
  Tooltip, Alert, AlertIcon
} from '@chakra-ui/react';
import { FaDumbbell, FaCalendarAlt, FaBed, FaPlus, FaTrash } from 'react-icons/fa';
import type { Workout } from '../services/api';

interface WeeklyWorkoutSelectorProps {
  weeks: {
    week_number: number;
    workout_id: string;
    is_rest_week: boolean;
  }[];
  availableWorkouts: Workout[];
  loading?: boolean;
  onChange: (weeks: {
    week_number: number;
    workout_id: string;
    is_rest_week: boolean;
  }[]) => void;
  maxWeeks?: number;
}

export function WeeklyWorkoutSelector({
  weeks,
  availableWorkouts,
  loading = false,
  onChange,
  maxWeeks = 6
}: WeeklyWorkoutSelectorProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const infoColor = useColorModeValue('gray.600', 'gray.200');
  const restBadgeBg = useColorModeValue('orange.100', 'orange.800');
  const restBadgeColor = useColorModeValue('orange.700', 'orange.200');
  const activeBadgeBg = useColorModeValue('blue.100', 'blue.800');
  const activeBadgeColor = useColorModeValue('blue.700', 'blue.200');

  // Update week configuration
  const updateWeek = (weekNumber: number, field: 'workout_id' | 'is_rest_week', value: string | boolean) => {
    const updatedWeeks = weeks.map(week => 
      week.week_number === weekNumber 
        ? { ...week, [field]: value }
        : week
    );
    onChange(updatedWeeks);
  };

  // Add new week
  const addWeek = () => {
    if (weeks.length < maxWeeks) {
      const newWeekNumber = Math.max(...weeks.map(w => w.week_number), 0) + 1;
      const newWeeks = [...weeks, {
        week_number: newWeekNumber,
        workout_id: '',
        is_rest_week: false
      }];
      onChange(newWeeks);
    }
  };

  // Remove week
  const removeWeek = (weekNumber: number) => {
    if (weeks.length > 1) {
      const updatedWeeks = weeks.filter(week => week.week_number !== weekNumber);
      onChange(updatedWeeks);
    }
  };

  // Get workout name by ID
  const getWorkoutName = (workoutId: string): string => {
    const workout = availableWorkouts.find(w => w.id === workoutId);
    return workout ? workout.name : 'Select workout...';
  };

  if (loading) {
    return (
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="semibold" color={titleColor}>
          Weekly Schedule
        </Text>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} height="80px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  if (!availableWorkouts.length) {
    return (
      <Box>
        <Text fontSize="lg" fontWeight="semibold" color={titleColor} mb={4}>
          Weekly Schedule
        </Text>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium">No weekly workout templates found</Text>
            <Text fontSize="sm">
              Create some weekly workout templates first to use in monthly plans.
            </Text>
          </VStack>
        </Alert>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between" align="center">
        <Text fontSize="lg" fontWeight="semibold" color={titleColor}>
          Weekly Schedule ({weeks.length} weeks)
        </Text>
        {weeks.length < maxWeeks && (
          <Button 
            size="sm" 
            colorScheme="teal" 
            leftIcon={<FaPlus />}
            onClick={addWeek}
          >
            Add Week
          </Button>
        )}
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {weeks
          .sort((a, b) => a.week_number - b.week_number)
          .map((week) => (
            <Card 
              key={week.week_number}
              borderRadius="lg" 
              borderWidth="1px" 
              borderColor={borderColor}
              bg={cardBg}
              p={0}
            >
              <CardBody p={4}>
                <VStack spacing={3} align="stretch">
                  {/* Week header */}
                  <HStack justify="space-between" align="center">
                    <HStack spacing={2}>
                      <Icon 
                        as={week.is_rest_week ? FaBed : FaDumbbell} 
                        color={week.is_rest_week ? restBadgeColor : activeBadgeColor}
                        boxSize={4}
                      />
                      <Text fontWeight="semibold" color={titleColor}>
                        Week {week.week_number}
                      </Text>
                      <Badge 
                        bg={week.is_rest_week ? restBadgeBg : activeBadgeBg}
                        color={week.is_rest_week ? restBadgeColor : activeBadgeColor}
                        px={2}
                        py={1}
                        borderRadius="md"
                        fontSize="xs"
                      >
                        {week.is_rest_week ? 'Rest Week' : 'Training Week'}
                      </Badge>
                    </HStack>
                    
                    {weeks.length > 1 && (
                      <Tooltip label="Remove week">
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeWeek(week.week_number)}
                        >
                          <FaTrash />
                        </Button>
                      </Tooltip>
                    )}
                  </HStack>

                  {/* Rest week toggle */}
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor={`rest-week-${week.week_number}`} mb="0" fontSize="sm">
                      Rest week
                    </FormLabel>
                    <Switch
                      id={`rest-week-${week.week_number}`}
                      isChecked={week.is_rest_week}
                      onChange={(e) => updateWeek(week.week_number, 'is_rest_week', e.target.checked)}
                      colorScheme="orange"
                      size="sm"
                    />
                  </FormControl>

                  {/* Workout selection (only if not rest week) */}
                  {!week.is_rest_week && (
                    <FormControl>
                      <FormLabel fontSize="sm" color={infoColor}>
                        Select workout template
                      </FormLabel>
                      <Select
                        value={week.workout_id}
                        onChange={(e) => updateWeek(week.week_number, 'workout_id', e.target.value)}
                        placeholder="Choose a weekly workout..."
                        size="sm"
                        bg={cardBg}
                      >
                        {availableWorkouts.map(workout => (
                          <option key={workout.id} value={workout.id}>
                            {workout.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Selected workout info */}
                  {!week.is_rest_week && week.workout_id && (
                    <Box>
                      <Text fontSize="xs" color={infoColor} mb={1}>
                        Selected template:
                      </Text>
                      <Text fontSize="sm" fontWeight="medium" color={titleColor}>
                        {getWorkoutName(week.workout_id)}
                      </Text>
                    </Box>
                  )}

                  {/* Rest week message */}
                  {week.is_rest_week && (
                    <Box>
                      <Text fontSize="sm" color={infoColor} fontStyle="italic">
                        This week is designated as a rest/recovery week.
                      </Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))
        }
      </SimpleGrid>

      {/* Summary */}
      <Box 
        p={4} 
        bg={useColorModeValue('gray.50', 'gray.700')} 
        borderRadius="md"
      >
        <HStack justify="space-between">
          <HStack spacing={4}>
            <HStack spacing={1}>
              <Icon as={FaDumbbell} color={activeBadgeColor} boxSize={4} />
              <Text fontSize="sm" color={titleColor} fontWeight="medium">
                {weeks.filter(w => !w.is_rest_week).length} Training weeks
              </Text>
            </HStack>
            <HStack spacing={1}>
              <Icon as={FaBed} color={restBadgeColor} boxSize={4} />
              <Text fontSize="sm" color={titleColor} fontWeight="medium">
                {weeks.filter(w => w.is_rest_week).length} Rest weeks
              </Text>
            </HStack>
          </HStack>
          <Text fontSize="sm" color={infoColor}>
            Total: {weeks.length} weeks
          </Text>
        </HStack>
      </Box>
    </VStack>
  );
} 