import {
  Box, Heading, Text, SimpleGrid, Spinner, useDisclosure, Button, HStack
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useWorkouts } from '../../hooks/useWorkouts'; 
import type { Workout as ApiWorkout } from '../../services/api'; // Import shared types
import { useCoachAthletes } from '../../hooks/useCoachAthletes';
import { WorkoutModal } from '../../components/WorkoutModal'; // Import component
import type { WorkoutFormData } from '../../components/WorkoutModal'; // Import type properly
import { useWorkoutCompletionStats } from '../../hooks/useWorkoutCompletionStats'; // Import our new hook
import { api } from '../../services/api'; // Import the API instance
import { WorkoutCard } from '../../components/WorkoutCard'; // Import our shared card component
import { supabase } from '../../lib/supabase'; // Import supabase client

// Athlete assignment type
interface AthleteAssignment {
  id: string;
  athlete_id: string;
  workout_id: string; 
  status: string;
}

export function CoachWorkouts() {
  // useWorkouts returns Workout[] (imported type from api.ts via useWorkouts.ts)
  const { workouts, isLoading, deleteWorkout, createWorkout, updateWorkout, refetch } = useWorkouts(); 
  const { athletes: coachAthletes, isLoading: athletesLoading } = useCoachAthletes();
  const [editingWorkout, setEditingWorkout] = useState<ApiWorkout | null>(null); // Use imported ApiWorkout
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSaving, setIsSaving] = useState(false);
  
  // State to track assignments
  const [assignments, setAssignments] = useState<AthleteAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  
  // Get all workout IDs for fetching stats
  const workoutIds = workouts?.map(workout => workout.id) || [];
  const { completionStats, isLoading: statsLoading, refetch: refetchStats } = useWorkoutCompletionStats(workoutIds);

  // Fetch assignments when workouts change
  useEffect(() => {
    if (!workoutIds.length) return;

    const fetchAssignments = async () => {
      setAssignmentsLoading(true);
      try {
        // Get all athlete-workout assignments for these workout IDs
        const { data, error } = await supabase
          .from('athlete_workouts')
          .select('*')
          .in('workout_id', workoutIds);

        if (error) {
          throw error;
        }

        setAssignments(data || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
  }, [JSON.stringify(workoutIds)]); // Use JSON.stringify to stabilize the dependency

  const getWorkoutProgress = (workout: ApiWorkout) => {
    // Get real completion stats from our hook instead of random data
    const stats = completionStats.find(stat => stat.workoutId === workout.id);
    
    if (stats) {
      return {
        completed: stats.completedCount,
        total: stats.totalAssigned,
        percentage: stats.percentage
      };
    }
    
    // Fallback to zeros if stats not available yet
    return { 
      completed: 0, 
      total: 0, 
      percentage: 0 
    };
  };

  const getAthleteNames = (workout: ApiWorkout) => {
    if (!workout.id || !coachAthletes || coachAthletes.length === 0) return 'Unassigned';
    
    // Get assignments for this workout
    const workoutAssignments = assignments.filter(a => a.workout_id === workout.id);
    
    if (!workoutAssignments.length) return 'Unassigned';
    
    // Map athlete IDs to names
    const names = workoutAssignments
      .map(assignment => {
        const athlete = coachAthletes.find(a => a.id === assignment.athlete_id);
        return athlete ? (athlete.full_name || athlete.name) : null;
      })
      .filter(Boolean);
    
    return names.length ? names.join(', ') : 'Unassigned';
  };

  const handleSave = async (dataFromModal: WorkoutFormData) => { 
    // dataFromModal should be shaped by WorkoutModal to provide all necessary fields for ApiWorkout creation.
    // The WorkoutFormData type in WorkoutModal should define name, type, date, duration, notes, exercises as required.
    const { id, assignedAthletes, file, user_id, created_at, ...payloadForApi } = dataFromModal as ApiWorkout & { assignedAthletes?: string[], file?: File };

    try {
      setIsSaving(true);
      let workoutId = id;
      
      if (id && editingWorkout) { 
        // Update existing workout
        await updateWorkout({ id: id, workout: payloadForApi as Partial<ApiWorkout> });
      } else {
        // For new workouts, create and get the created workout
        const newWorkout = await createWorkout(payloadForApi as Omit<ApiWorkout, 'id' | 'user_id' | 'created_at'>);
        workoutId = newWorkout?.id;
      }
      
      // Then assign to athletes if there are any and we have a workout ID
      if (assignedAthletes && assignedAthletes.length > 0 && workoutId) {
        await api.athleteWorkouts.assign(workoutId, assignedAthletes);
      }
      
      // Close the modal
      setEditingWorkout(null);
      onClose();
      
      // Force refresh of workouts data
      await refetch();
      
      // Only refresh stats and assignments after the refetch is complete
      await refetchStats();
      
      // Refetch assignments only once after everything is done
      if (workoutIds.length > 0) {
        const { data } = await supabase
          .from('athlete_workouts')
          .select('*')
          .in('workout_id', workoutIds);
          
        if (data) {
          setAssignments(data);
        }
      }
    } catch (error) {
      console.error("Error saving workout or assigning to athletes:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Refresh stats when component mounts or when workoutIds change
  useEffect(() => {
    if (workoutIds.length > 0) {
      refetchStats();
    }
  }, [refetchStats]); // Only depend on refetchStats function

  // Log for debugging - remove or reduce frequency
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Workouts:', workouts?.length || 0);
      console.log('Coach Athletes:', coachAthletes?.length || 0);
      console.log('Assignments:', assignments?.length || 0);
    }
  }, [workouts?.length, coachAthletes?.length, assignments?.length]); // Only log when counts change

  return (
    <Box py={8}>
      <Heading mb={6}>Coach Workouts</Heading>
      <Button colorScheme="blue" mb={6} onClick={() => { setEditingWorkout(null); onOpen(); }}>
        Create Workout
      </Button>
      
      {/* Add a loading indicator when a workout is being saved */}
      {isSaving && (
        <Box 
          position="fixed" 
          top="0" 
          left="0" 
          right="0" 
          p={2} 
          bg="blue.500" 
          color="white" 
          textAlign="center"
          zIndex={9999}
        >
          <HStack justify="center" spacing={2}>
            <Spinner size="sm" />
            <Text fontWeight="medium">Saving workout...</Text>
          </HStack>
        </Box>
      )}
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {(isLoading || athletesLoading || assignmentsLoading) ? (
          <Text>Loading workouts and athletes...</Text>
        ) : !workouts || workouts.length === 0 ? (
          <Text>No workouts created yet.</Text>
        ) : (
          (workouts as ApiWorkout[]).map((workout) => { 
            const progress = getWorkoutProgress(workout);
            const athleteNames = getAthleteNames(workout);

            return (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                isCoach={true}
                progress={progress}
                assignedTo={athleteNames}
                statsLoading={statsLoading}
                onEdit={() => { setEditingWorkout(workout); onOpen(); }}
                onDelete={() => deleteWorkout(workout.id)}
              />
            );
          })
        )}
      </SimpleGrid>
      <WorkoutModal
        isOpen={isOpen}
        onClose={() => { setEditingWorkout(null); onClose(); }}
        initialWorkout={editingWorkout} // Pass ApiWorkout | null
        athletes={coachAthletes} 
        onSave={handleSave} // handleSave expects WorkoutFormData (imported from WorkoutModal)
      />
    </Box>
  );
} 