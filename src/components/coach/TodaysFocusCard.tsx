import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  Badge,
  Button,
  useColorModeValue,
  Flex,
  Divider,
  Tag,
  useToast,
  Skeleton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FaCalendarDay, FaClipboardList, FaUsers, FaPlus, FaClock, FaTasks } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TodayTask {
  id: string;
  type: 'workout' | 'event' | 'planning' | 'review';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueTime?: string;
  athleteCount?: number;
  actionLink?: string;
  status: 'pending' | 'completed';
}

interface TodaysFocusCardProps {
  onTaskClick?: (task: TodayTask) => void;
}

const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({ onTaskClick }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);
  const [weekTasks, setWeekTasks] = useState<TodayTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const cardShadow = useColorModeValue('none', 'lg');
  const statLabelColor = useColorModeValue('gray.600', 'gray.300');
  const statNumberColor = useColorModeValue('gray.900', 'gray.100');
  const taskBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (user?.id) {
      fetchTodaysFocus();
    }
  }, [user?.id]);

  const fetchTodaysFocus = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const todayTasks: TodayTask[] = [];
      const weekTasks: TodayTask[] = [];

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      // 1. Get today's scheduled workouts
      const { data: todayWorkouts, error: workoutsError } = await supabase
        .from('athlete_workouts')
        .select(`
          id,
          workout_name,
          scheduled_date,
          completed_at,
          athlete_id,
          profiles!athlete_workouts_athlete_id_fkey(first_name, last_name)
        `)
        .eq('scheduled_date', today)
        .is('completed_at', null);

      if (workoutsError) throw workoutsError;

      // Group workouts by name/type for cleaner display
      const workoutGroups = new Map();
      (todayWorkouts || []).forEach(workout => {
        const key = workout.workout_name;
        if (!workoutGroups.has(key)) {
          workoutGroups.set(key, {
            name: workout.workout_name,
            athletes: [],
            ids: []
          });
        }
        const group = workoutGroups.get(key);
        group.athletes.push(`${workout.profiles?.first_name} ${workout.profiles?.last_name}`);
        group.ids.push(workout.id);
      });

      // Add today's workout tasks
      for (const [_, group] of workoutGroups) {
        todayTasks.push({
          id: `workout-${group.ids.join('-')}`,
          type: 'workout',
          title: `${group.name}`,
          description: `Assigned to ${group.athletes.length} athlete${group.athletes.length !== 1 ? 's' : ''}`,
          priority: 'high',
          dueTime: 'Today',
          athleteCount: group.athletes.length,
          actionLink: '/coach/workout-creator',
          status: 'pending'
        });
      }

      // 2. Get upcoming track meets/events for this week
      const { data: upcomingEvents, error: eventsError } = await supabase
        .from('track_meets')
        .select('id, name, meet_date, city, state')
        .eq('coach_id', user.id)
        .gte('meet_date', today)
        .lte('meet_date', nextWeek)
        .order('meet_date', { ascending: true });

      if (eventsError) throw eventsError;

      // Add event tasks
      (upcomingEvents || []).forEach(event => {
        const eventDate = new Date(event.meet_date);
        const isToday = event.meet_date === today;
        const isTomorrow = event.meet_date === tomorrow;
        
        const task: TodayTask = {
          id: `event-${event.id}`,
          type: 'event',
          title: event.name,
          description: `${event.city}, ${event.state}`,
          priority: isToday ? 'high' : isTomorrow ? 'medium' : 'low',
          dueTime: isToday ? 'Today' : isTomorrow ? 'Tomorrow' : eventDate.toLocaleDateString(),
          actionLink: `/coach/events/${event.id}`,
          status: 'pending'
        };

        if (isToday) {
          todayTasks.push(task);
        } else {
          weekTasks.push(task);
        }
      });

      // 3. Check for athletes needing workout planning (no workouts scheduled for next 3 days)
      const threeDaysAhead = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
      
      const { data: coachAthletes, error: athletesError } = await supabase
        .from('coach_athletes')
        .select(`
          athlete_id,
          profiles!coach_athletes_athlete_id_fkey(first_name, last_name)
        `)
        .eq('coach_id', user.id);

      if (athletesError) throw athletesError;

      if (coachAthletes && coachAthletes.length > 0) {
        const athleteIds = coachAthletes.map(ca => ca.athlete_id);
        
        const { data: futureWorkouts, error: futureError } = await supabase
          .from('athlete_workouts')
          .select('athlete_id')
          .in('athlete_id', athleteIds)
          .gte('scheduled_date', tomorrow)
          .lte('scheduled_date', threeDaysAhead);

        if (futureError) throw futureError;

        const athletesWithWorkouts = new Set((futureWorkouts || []).map(w => w.athlete_id));
        const athletesNeedingWorkouts = coachAthletes.filter(ca => !athletesWithWorkouts.has(ca.athlete_id));

        if (athletesNeedingWorkouts.length > 0) {
          weekTasks.push({
            id: 'planning-workouts',
            type: 'planning',
            title: 'Plan Upcoming Workouts',
            description: `${athletesNeedingWorkouts.length} athlete${athletesNeedingWorkouts.length !== 1 ? 's' : ''} need workouts scheduled`,
            priority: 'medium',
            athleteCount: athletesNeedingWorkouts.length,
            actionLink: '/coach/workouts/new',
            status: 'pending'
          });
        }
      }

      // 4. Check for completed workouts needing review (RPE analysis)
      const { data: completedWorkouts, error: completedError } = await supabase
        .from('athlete_workouts')
        .select(`
          id,
          workout_name,
          athlete_id,
          rpe_rating,
          completed_at,
          profiles!athlete_workouts_athlete_id_fkey(first_name, last_name)
        `)
        .not('completed_at', 'is', null)
        .gte('completed_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .not('rpe_rating', 'is', null);

      if (completedError) throw completedError;

      // Group high RPE workouts for review
      const highRPEWorkouts = (completedWorkouts || []).filter(w => w.rpe_rating >= 8);
      if (highRPEWorkouts.length > 0) {
        weekTasks.push({
          id: 'review-high-rpe',
          type: 'review',
          title: 'Review High RPE Workouts',
          description: `${highRPEWorkouts.length} workout${highRPEWorkouts.length !== 1 ? 's' : ''} reported RPE ≥ 8`,
          priority: 'medium',
          actionLink: '/coach/analytics',
          status: 'pending'
        });
      }

      // Sort tasks by priority and time
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      todayTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      weekTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      setTodayTasks(todayTasks);
      setWeekTasks(weekTasks);

    } catch (error) {
      console.error('Error fetching today\'s focus:', error);
      toast({
        title: 'Error fetching today\'s focus',
        description: 'Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  const getTaskIcon = (type: TodayTask['type']) => {
    switch (type) {
      case 'workout': return FaClipboardList;
      case 'event': return FaCalendarDay;
      case 'planning': return FaTasks;
      case 'review': return FaUsers;
      default: return FaClipboardList;
    }
  };

  const TaskList = ({ tasks, emptyMessage }: { tasks: TodayTask[], emptyMessage: string }) => (
    <>
      {tasks.length === 0 ? (
        <Box bg={taskBg} p={4} borderRadius="lg" textAlign="center">
          <Text fontSize="sm" color={statLabelColor}>
            {emptyMessage}
          </Text>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch">
          {tasks.map(task => (
            <Box
              key={task.id}
              p={3}
              bg={taskBg}
              borderRadius="md"
              cursor="pointer"
              onClick={() => onTaskClick?.(task)}
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
              transition="all 0.2s"
              border="1px solid"
              borderColor={`${getPriorityColor(task.priority)}.200`}
            >
              <HStack spacing={3} align="start">
                <Icon
                  as={getTaskIcon(task.type)}
                  color={`${getPriorityColor(task.priority)}.500`}
                  boxSize={4}
                  mt={1}
                />
                <VStack align="start" spacing={1} flex={1} minW={0}>
                  <HStack spacing={2} w="100%">
                    <Text fontSize="sm" fontWeight="bold" color={statNumberColor} noOfLines={1} flex={1}>
                      {task.title}
                    </Text>
                    <Badge
                      colorScheme={getPriorityColor(task.priority)}
                      variant="subtle"
                      fontSize="xs"
                    >
                      {task.priority}
                    </Badge>
                  </HStack>
                  
                  <Text fontSize="xs" color={statLabelColor} noOfLines={2}>
                    {task.description}
                  </Text>

                  <HStack spacing={2} mt={1}>
                    {task.dueTime && (
                      <Tag size="sm" variant="subtle" colorScheme="gray">
                        <Icon as={FaClock} boxSize={3} mr={1} />
                        {task.dueTime}
                      </Tag>
                    )}
                    {task.athleteCount && (
                      <Tag size="sm" variant="subtle" colorScheme="blue">
                        <Icon as={FaUsers} boxSize={3} mr={1} />
                        {task.athleteCount}
                      </Tag>
                    )}
                  </HStack>
                </VStack>
                {task.actionLink && (
                  <Button
                    as={RouterLink}
                    to={task.actionLink}
                    size="xs"
                    colorScheme={getPriorityColor(task.priority)}
                    variant="outline"
                  >
                    View
                  </Button>
                )}
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </>
  );

  if (isLoading) {
    return (
      <Box
        bg={cardBg}
        borderRadius="xl"
        p={6}
        border="1px solid"
        borderColor={borderColor}
        boxShadow={cardShadow}
      >
        <HStack spacing={3} mb={4}>
          <Icon as={FaCalendarDay} boxSize={6} color="purple.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              Today's Focus
            </Text>
            <Text fontSize="sm" color={subtitleColor}>
              Your schedule and priorities
            </Text>
          </VStack>
        </HStack>
        <VStack spacing={3}>
          <Skeleton height="60px" width="100%" />
          <Skeleton height="60px" width="100%" />
          <Skeleton height="60px" width="100%" />
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      p={6}
      border="1px solid"
      borderColor={borderColor}
      boxShadow={cardShadow}
    >
      <HStack spacing={3} mb={4} justify="space-between">
        <HStack spacing={3}>
          <Icon as={FaCalendarDay} boxSize={6} color="purple.500" />
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              Today's Focus
            </Text>
            <Text fontSize="sm" color={subtitleColor}>
              Your schedule and priorities
            </Text>
          </VStack>
        </HStack>
        <Button
          as={RouterLink}
          to="/coach/workout-creator"
          size="sm"
          colorScheme="purple"
          leftIcon={<Icon as={FaPlus} />}
        >
          Add Task
        </Button>
      </HStack>

      <Tabs variant="soft-rounded" colorScheme="purple">
        <TabList mb={4}>
          <Tab fontSize="sm">
            Today ({todayTasks.length})
          </Tab>
          <Tab fontSize="sm">
            This Week ({weekTasks.length})
          </Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel p={0}>
            <TaskList 
              tasks={todayTasks} 
              emptyMessage="🎉 No urgent tasks for today!" 
            />
          </TabPanel>
          <TabPanel p={0}>
            <TaskList 
              tasks={weekTasks} 
              emptyMessage="All caught up for the week!" 
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default TodaysFocusCard; 