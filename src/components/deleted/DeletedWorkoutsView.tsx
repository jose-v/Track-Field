import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, Heading, Text, SimpleGrid, Spinner, Alert, AlertIcon,
  Badge, Button, useColorModeValue, useToast, Select, Flex, Icon
} from '@chakra-ui/react';
import { FaTrash, FaUndo, FaRedo, FaFilter, FaUser, FaUserTie } from 'react-icons/fa';
import { DeletedWorkoutCard } from './DeletedWorkoutCard';
import { api } from '../../services/api';
import type { Workout } from '../../services/api';

interface DeletedWorkoutsViewProps {
  userId: string;
  userRole: 'coach' | 'athlete';
  title?: string;
  subtitle?: string;
}

export function DeletedWorkoutsView({ 
  userId, 
  userRole, 
  title = 'Deleted Workouts',
  subtitle = 'Manage your deleted workouts'
}: DeletedWorkoutsViewProps) {
  const [deletedWorkouts, setDeletedWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Filtering states
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'weekly' | 'monthly'>('all');
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'mine' | 'coaches'>('all');
  
  const toast = useToast();
  
  // Theme colors
  const headerColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('red.500', 'red.300');

  // Load deleted workouts
  const loadDeletedWorkouts = async () => {
    try {
      setLoading(true);
      const data = await api.workouts.getDeleted(userId);
      console.log('🗑️ Loaded deleted workouts:', data);
      setDeletedWorkouts(data);
    } catch (error) {
      console.error('Error loading deleted workouts:', error);
      toast({
        title: 'Error loading deleted workouts',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDeletedWorkouts();
      toast({
        title: 'Refreshed',
        description: 'Deleted workouts have been refreshed.',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Restore workout
  const handleRestore = async (workoutId: string) => {
    try {
      setRestoring(workoutId);
      await api.workouts.restore(workoutId);
      
      // Remove from local state
      setDeletedWorkouts(prev => prev.filter(w => w.id !== workoutId));
      
      toast({
        title: 'Workout Restored',
        description: 'The workout has been successfully restored.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error restoring workout:', error);
      toast({
        title: 'Error restoring workout',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setRestoring(null);
    }
  };

  // Permanently delete workout
  const handlePermanentDelete = async (workoutId: string) => {
    try {
      setDeleting(workoutId);
      await api.workouts.permanentDelete(workoutId);
      
      // Remove from local state
      setDeletedWorkouts(prev => prev.filter(w => w.id !== workoutId));
      
      toast({
        title: 'Workout Permanently Deleted',
        description: 'The workout has been permanently removed.',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error permanently deleting workout:', error);
      toast({
        title: 'Error deleting workout',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setDeleting(null);
    }
  };

  // Filter workouts
  const filteredWorkouts = React.useMemo(() => {
    let filtered = deletedWorkouts;

    // Filter by type
    if (typeFilter !== 'all') {
      if (typeFilter === 'weekly') {
        filtered = filtered.filter(w => w.template_type === 'weekly');
      } else if (typeFilter === 'single') {
        filtered = filtered.filter(w => w.template_type === 'single' || !w.template_type);
      }
      // Note: Monthly plans are separate entities, not workouts with template_type
    }

    // Filter by creator (athlete-specific)
    if (userRole === 'athlete' && creatorFilter !== 'all') {
      if (creatorFilter === 'mine') {
        filtered = filtered.filter(w => w.user_id === userId);
      } else if (creatorFilter === 'coaches') {
        filtered = filtered.filter(w => w.user_id !== userId);
      }
    }

    return filtered;
  }, [deletedWorkouts, typeFilter, creatorFilter, userRole, userId]);

  // Get stats
  const stats = React.useMemo(() => {
    const myWorkouts = deletedWorkouts.filter(w => w.user_id === userId).length;
    const coachWorkouts = deletedWorkouts.filter(w => w.user_id !== userId).length;
    
    return {
      total: deletedWorkouts.length,
      mine: myWorkouts,
      coaches: coachWorkouts,
      single: deletedWorkouts.filter(w => w.template_type === 'single' || !w.template_type).length,
      weekly: deletedWorkouts.filter(w => w.template_type === 'weekly').length,
      monthly: 0 // Monthly plans are separate entities, not workouts
    };
  }, [deletedWorkouts, userId]);

  // Load data on mount
  useEffect(() => {
    if (userId) {
      loadDeletedWorkouts();
    }
  }, [userId]);

  if (loading) {
    return (
      <VStack spacing={6} align="stretch" w="100%">
        <VStack spacing={2} align="start">
          <HStack spacing={3}>
            <Icon as={FaTrash} boxSize={6} color={iconColor} />
            <Heading size="lg" color={headerColor}>
              {title}
            </Heading>
          </HStack>
          <Text color={subtitleColor}>
            {subtitle}
          </Text>
        </VStack>
        
        <Flex justify="center" py={20}>
          <Spinner size="xl" thickness="4px" speed="0.65s" color="red.500" />
        </Flex>
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {/* Header */}
      <VStack spacing={2} align="start">
        <HStack spacing={3} justify="space-between" w="100%">
          <HStack spacing={3}>
            <Icon as={FaTrash} boxSize={6} color={iconColor} />
            <Heading size="lg" color={headerColor}>
              {title}
            </Heading>
          </HStack>
          <Button
            leftIcon={<FaRedo />}
            variant="outline"
            colorScheme="red"
            onClick={handleRefresh}
            isLoading={refreshing}
            size="sm"
          >
            Refresh
          </Button>
        </HStack>
        
        <Text color={subtitleColor}>
          {subtitle} ({filteredWorkouts.length} workout{filteredWorkouts.length !== 1 ? 's' : ''})
        </Text>
      </VStack>

      {/* Stats */}
      <HStack spacing={4} wrap="wrap">
        <Badge colorScheme="red" fontSize="sm" px={3} py={1}>
          {stats.total} Total
        </Badge>
        {userRole === 'athlete' && (
          <>
            <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
              {stats.mine} My Workouts
            </Badge>
            <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
              {stats.coaches} Coach Workouts
            </Badge>
          </>
        )}
        {stats.single > 0 && (
          <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
            {stats.single} Single
          </Badge>
        )}
        {stats.weekly > 0 && (
          <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
            {stats.weekly} Weekly
          </Badge>
        )}
        {stats.monthly > 0 && (
          <Badge colorScheme="teal" fontSize="sm" px={3} py={1}>
            {stats.monthly} Monthly
          </Badge>
        )}
      </HStack>

      {/* Filters */}
      <HStack spacing={4} wrap="wrap">
        <HStack spacing={2}>
          <Icon as={FaFilter} boxSize={4} color={subtitleColor} />
          <Text fontSize="sm" color={subtitleColor} fontWeight="medium">
            Filters:
          </Text>
        </HStack>
        
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          size="sm"
          maxW="150px"
        >
          <option value="all">All Types</option>
          <option value="single">Single</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </Select>

        {userRole === 'athlete' && (
          <Select
            value={creatorFilter}
            onChange={(e) => setCreatorFilter(e.target.value as typeof creatorFilter)}
            size="sm"
            maxW="150px"
          >
            <option value="all">All Workouts</option>
            <option value="mine">My Workouts</option>
            <option value="coaches">Coach Workouts</option>
          </Select>
        )}
      </HStack>

      {/* Content */}
      {filteredWorkouts.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={0}>
            <Text fontWeight="medium">
              No Deleted Workouts Found
            </Text>
            <Text fontSize="sm">
              {typeFilter === 'all' && creatorFilter === 'all'
                ? 'You don\'t have any deleted workouts.'
                : 'No workouts match your current filters. Try adjusting the filters above.'
              }
            </Text>
          </VStack>
        </Alert>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredWorkouts.map((workout) => (
            <DeletedWorkoutCard
              key={workout.id}
              workout={workout}
              userRole={userRole}
              currentUserId={userId}
              creatorName={userRole === 'athlete' && workout.user_id !== userId ? 'Coach' : undefined}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              isRestoring={restoring === workout.id}
              isDeleting={deleting === workout.id}
            />
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
} 