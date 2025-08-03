import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  useColorModeValue,
  SimpleGrid,
  Badge,
  Icon,
  Flex,
  Button,
  IconButton,
  Card,
  CardBody,
  Input,
  Divider
} from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';

interface RunTimesRepsAnalysisProps {
  analytics: any;
  dateRange: string;
}

export const RunTimesRepsAnalysis: React.FC<RunTimesRepsAnalysisProps> = ({
  analytics,
  dateRange
}) => {
  const [repAnalysisStartDate, setRepAnalysisStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [repAnalysisEndDate, setRepAnalysisEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [repAnalysisEventFilter, setRepAnalysisEventFilter] = useState<string>('all');
  const [repAnalysisTab, setRepAnalysisTab] = useState<'all' | 'set1' | 'set2' | 'set3'>('all');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [tooltipData, setTooltipData] = useState<{ text: string; x: number; y: number } | null>(null);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.800', 'white');

  return (
    <VStack spacing={8} align="stretch">
      {/* Content Above the Graph - Left Column Layout */}
      <Box px={{ base: 0, md: 0 }}>
        <HStack spacing={0} align="start">
          {/* Column 1 - Event, Date Picker, Stats */}
          <VStack spacing={6} align="stretch" flex="1">
            {/* Top Section - Filters/Inputs */}
            <VStack spacing={4} align="stretch">
              {/* Event Filter */}
              <VStack spacing={1} align="start">
                <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.600', 'gray.400')}>
                  Event
                </Text>
                <Select
                  size="sm"
                  value={repAnalysisEventFilter}
                  onChange={(e) => setRepAnalysisEventFilter(e.target.value)}
                  w="120px"
                  fontSize="xs"
                >
                  <option value="all">All Events</option>
                  <option value="100m">100m</option>
                  <option value="200m">200m</option>
                  <option value="400m">400m</option>
                  <option value="800m">800m</option>
                  <option value="1500m">1500m</option>
                  <option value="5000m">5000m</option>
                </Select>
              </VStack>
              
              {/* Date Range Filter */}
              <HStack spacing={4} align="start">
                <VStack spacing={1} align="start">
                  <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.600', 'gray.400')}>
                    From
                  </Text>
                  <input
                    type="date"
                    value={repAnalysisStartDate}
                    onChange={(e) => setRepAnalysisStartDate(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      color: 'inherit'
                    }}
                  />
                </VStack>
                <VStack spacing={1} align="start">
                  <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.600', 'gray.400')}>
                    To
                  </Text>
                  <input
                    type="date"
                    value={repAnalysisEndDate}
                    onChange={(e) => setRepAnalysisEndDate(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      backgroundColor: 'transparent',
                      color: 'inherit'
                    }}
                  />
                </VStack>
              </HStack>
            </VStack>
            
            {/* Middle Section - Stats Sub-header */}
            <Box>
              <Divider mb={4} />
              <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.600', 'gray.400')} mb={3}>
                Stats
              </Text>
              
              {/* Bottom Section - Three Summary Columns */}
              <SimpleGrid columns={3} spacing={4}>
                <Box 
                  p={3} 
                  textAlign="center"
                >
                  <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mb={1}>
                    Runs
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                    {(() => {
                      const allRuns = analytics.runTimes.allRuns || [];
                      const filteredRuns = allRuns.filter(run => {
                        // Date range filter
                        const runDate = new Date(run.created_at);
                        let dateFilter = true;
                        
                        if (repAnalysisStartDate) {
                          const [year, month, day] = repAnalysisStartDate.split('-').map(Number);
                          const startDate = new Date(year, month - 1, day);
                          startDate.setHours(0, 0, 0, 0);
                          const runDateOnly = new Date(runDate);
                          runDateOnly.setHours(0, 0, 0, 0);
                          dateFilter = dateFilter && runDateOnly.getTime() === startDate.getTime();
                        }
                        
                        if (repAnalysisEndDate && repAnalysisEndDate !== repAnalysisStartDate) {
                          const [year, month, day] = repAnalysisEndDate.split('-').map(Number);
                          const endDate = new Date(year, month - 1, day);
                          endDate.setHours(23, 59, 59, 999);
                          const runDateOnly = new Date(runDate);
                          runDateOnly.setHours(0, 0, 0, 0);
                          dateFilter = dateFilter && runDateOnly.getTime() === endDate.getTime();
                        }
                        
                        // Event filter
                        const exerciseName = run.exercise_name.toLowerCase();
                        let eventMatch = true;
                        
                        if (repAnalysisEventFilter !== 'all') {
                          if (repAnalysisEventFilter === '100m') {
                            eventMatch = exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter');
                          } else if (repAnalysisEventFilter === '200m') {
                            eventMatch = exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter');
                          } else if (repAnalysisEventFilter === '400m') {
                            eventMatch = exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter');
                          }
                        }
                        
                        return dateFilter && eventMatch;
                      });
                      
                      return filteredRuns.length;
                    })()}
                  </Text>
                </Box>
                
                <Box 
                  p={3} 
                  textAlign="center"
                >
                  <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mb={1}>
                    Best Time
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                    {(() => {
                      const allRuns = analytics.runTimes.allRuns || [];
                      const filteredRuns = allRuns.filter(run => {
                        // Date range filter
                        const runDate = new Date(run.created_at);
                        let dateFilter = true;
                        
                        if (repAnalysisStartDate) {
                          const [year, month, day] = repAnalysisStartDate.split('-').map(Number);
                          const startDate = new Date(year, month - 1, day);
                          startDate.setHours(0, 0, 0, 0);
                          const runDateOnly = new Date(runDate);
                          runDateOnly.setHours(0, 0, 0, 0);
                          dateFilter = dateFilter && runDateOnly.getTime() === startDate.getTime();
                        }
                        
                        if (repAnalysisEndDate && repAnalysisEndDate !== repAnalysisStartDate) {
                          const [year, month, day] = repAnalysisEndDate.split('-').map(Number);
                          const endDate = new Date(year, month - 1, day);
                          endDate.setHours(23, 59, 59, 999);
                          const runDateOnly = new Date(runDate);
                          runDateOnly.setHours(0, 0, 0, 0);
                          dateFilter = dateFilter && runDateOnly.getTime() === endDate.getTime();
                        }
                        
                        // Event filter
                        const exerciseName = run.exercise_name.toLowerCase();
                        let eventMatch = true;
                        
                        if (repAnalysisEventFilter !== 'all') {
                          if (repAnalysisEventFilter === '100m') {
                            eventMatch = exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter');
                          } else if (repAnalysisEventFilter === '200m') {
                            eventMatch = exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter');
                          } else if (repAnalysisEventFilter === '400m') {
                            eventMatch = exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter');
                          }
                        }
                        
                        return dateFilter && eventMatch;
                      });
                      
                      if (filteredRuns.length === 0) return 'N/A';
                      
                      const runTimes = filteredRuns.map(run => {
                        const totalSeconds = (run.time_minutes * 60) + run.time_seconds + (run.time_hundredths / 100);
                        return totalSeconds;
                      });
                      
                      const bestTime = Math.min(...runTimes);
                      const minutes = Math.floor(bestTime / 60);
                      const seconds = (bestTime % 60).toFixed(2);
                      return `${minutes}:${seconds.padStart(5, '0')}`;
                    })()}
                  </Text>
                </Box>
                
                <Box 
                  p={3} 
                  textAlign="center"
                >
                  <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mb={1}>
                    Avg Time
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                    {(() => {
                      const allRuns = analytics.runTimes.allRuns || [];
                      const filteredRuns = allRuns.filter(run => {
                        // Date range filter
                        const runDate = new Date(run.created_at);
                        let dateFilter = true;
                        
                        if (repAnalysisStartDate) {
                          const [year, month, day] = repAnalysisStartDate.split('-').map(Number);
                          const startDate = new Date(year, month - 1, day);
                          startDate.setHours(0, 0, 0, 0);
                          const runDateOnly = new Date(runDate);
                          runDateOnly.setHours(0, 0, 0, 0);
                          dateFilter = dateFilter && runDateOnly.getTime() === startDate.getTime();
                        }
                        
                        if (repAnalysisEndDate && repAnalysisEndDate !== repAnalysisStartDate) {
                          const [year, month, day] = repAnalysisEndDate.split('-').map(Number);
                          const endDate = new Date(year, month - 1, day);
                          endDate.setHours(23, 59, 59, 999);
                          const runDateOnly = new Date(runDate);
                          runDateOnly.setHours(0, 0, 0, 0);
                          dateFilter = dateFilter && runDateOnly.getTime() === endDate.getTime();
                        }
                        
                        // Event filter
                        const exerciseName = run.exercise_name.toLowerCase();
                        let eventMatch = true;
                        
                        if (repAnalysisEventFilter !== 'all') {
                          if (repAnalysisEventFilter === '100m') {
                            eventMatch = exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter');
                          } else if (repAnalysisEventFilter === '200m') {
                            eventMatch = exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter');
                          } else if (repAnalysisEventFilter === '400m') {
                            eventMatch = exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter');
                          }
                        }
                        
                        return dateFilter && eventMatch;
                      });
                      
                      if (filteredRuns.length === 0) return 'N/A';
                      
                      const runTimes = filteredRuns.map(run => {
                        const totalSeconds = (run.time_minutes * 60) + run.time_seconds + (run.time_hundredths / 100);
                        return totalSeconds;
                      });
                      
                      const avgTime = runTimes.reduce((sum, time) => sum + time, 0) / runTimes.length;
                      const minutes = Math.floor(avgTime / 60);
                      const seconds = (avgTime % 60).toFixed(2);
                      return `${minutes}:${seconds.padStart(5, '0')}`;
                    })()}
                  </Text>
                </Box>
              </SimpleGrid>
            </Box>
          </VStack>
          
          {/* Divider */}
          <Box w="1px" bg={useColorModeValue('gray.200', 'gray.600')} />
          
          {/* Column 2 - Calendar */}
          <Box 
            position="relative"
            p={4} 
            h="400px"
            flex="1"
            display="flex"
            flexDirection="column"
          >
            {/* Left divider */}
            <Box 
              position="absolute" 
              left="0" 
              top="0" 
              bottom="0" 
              w="1px" 
              bg={useColorModeValue('gray.200', 'gray.700')} 
              zIndex={1}
            />
            {/* Right divider */}
            <Box 
              position="absolute" 
              right="0" 
              top="0" 
              bottom="0" 
              w="1px" 
              bg={useColorModeValue('gray.200', 'gray.700')} 
              zIndex={1}
            />
            
            {/* Calendar */}
            <VStack spacing={3} flex="1">
              {/* Calendar Header */}
              <HStack justify="space-between" align="center" w="100%">
                <IconButton
                  size="sm"
                  icon={<Icon as={FaChevronLeft} />}
                  onClick={() => {
                    const newDate = new Date(calendarDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCalendarDate(newDate);
                  }}
                  variant="ghost"
                  colorScheme="gray"
                  aria-label="Previous month"
                />
                <Text fontSize="md" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
                  {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                </Text>
                <IconButton
                  size="sm"
                  icon={<Icon as={FaChevronRight} />}
                  onClick={() => {
                    const newDate = new Date(calendarDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCalendarDate(newDate);
                  }}
                  variant="ghost"
                  colorScheme="gray"
                  aria-label="Next month"
                />
              </HStack>
              
              {/* Weekday Headers */}
              <SimpleGrid columns={7} spacing={0} w="100%">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Box key={day} textAlign="center" py={2}>
                    <Text fontSize="xs" fontWeight="medium" color={useColorModeValue('gray.500', 'gray.400')}>
                      {day}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
              
              {/* Calendar Days */}
              <SimpleGrid columns={7} spacing={4} w="100%" flex="1">
                {(() => {
                  const year = calendarDate.getFullYear();
                  const month = calendarDate.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const startWeekday = firstDay.getDay();
                  const daysInMonth = lastDay.getDate();
                  const today = new Date();
                  
                  // Get workout dates and types for the current month
                  const workoutDates = new Map(); // date -> workout types
                  
                  // Check all recent runs (not just multi-rep workouts) - calendar should show all data regardless of top date range
                  const allRuns = analytics.runTimes.allRuns || [];
                  
                  allRuns.forEach(run => {
                    const runDate = new Date(run.created_at);
                    const dateKey = runDate.toISOString().split('T')[0];
                    
                    if (runDate.getFullYear() === year && runDate.getMonth() === month) {
                      const exerciseName = run.exercise_name.toLowerCase();
                      let workoutType = 'other';
                      
                      if (exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter')) {
                        workoutType = 'sprint';
                      } else if (exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter')) {
                        workoutType = '400m';
                      } else if (exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter') || 
                               exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter')) {
                        workoutType = 'midDistance';
                      } else if (exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || 
                               exerciseName.includes('5k') || exerciseName.includes('5 km') || exerciseName.includes('10000m') || 
                               exerciseName.includes('10000 m') || exerciseName.includes('10000 meter') || exerciseName.includes('10k')) {
                        workoutType = 'longDistance';
                      }
                      
                      if (!workoutDates.has(dateKey)) {
                        workoutDates.set(dateKey, new Set());
                      }
                      workoutDates.get(dateKey).add(workoutType);
                    }
                  });
                  
                  const days = [];
                  
                  // Add empty cells for padding
                  for (let i = 0; i < startWeekday; i++) {
                    days.push(<Box key={`empty-${i}`} />);
                  }
                  
                  // Add days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const dateKey = date.toISOString().split('T')[0];
                    const isToday = date.toDateString() === today.toDateString();
                    const isSelected = repAnalysisStartDate === dateKey;
                    const hasWorkouts = workoutDates.has(dateKey);
                    const workoutTypes = workoutDates.get(dateKey) || new Set();
                    
                    days.push(
                      <Box
                        key={day}
                        textAlign="center"
                        py={2}
                        position="relative"
                        cursor="pointer"
                        onClick={() => {
                          setRepAnalysisStartDate(dateKey);
                          setRepAnalysisEndDate(dateKey);
                        }}
                        bg={isSelected ? useColorModeValue('blue.100', 'blue.900') : 'transparent'}
                        borderRadius="md"
                        _hover={{
                          bg: useColorModeValue('gray.100', 'gray.700')
                        }}
                      >
                        <Text
                          fontSize="sm"
                          fontWeight={isToday ? 'bold' : 'normal'}
                          color={isToday ? useColorModeValue('blue.600', 'blue.400') : useColorModeValue('gray.800', 'white')}
                        >
                          {day}
                        </Text>
                        
                        {/* Workout indicators */}
                        {hasWorkouts && (
                          <HStack spacing={1} justify="center" mt={1}>
                            {workoutTypes.has('sprint') && (
                              <Box w="2" h="2" bg="red.400" borderRadius="full" />
                            )}
                            {workoutTypes.has('400m') && (
                              <Box w="2" h="2" bg="orange.400" borderRadius="full" />
                            )}
                            {workoutTypes.has('midDistance') && (
                              <Box w="2" h="2" bg="yellow.400" borderRadius="full" />
                            )}
                            {workoutTypes.has('longDistance') && (
                              <Box w="2" h="2" bg="green.400" borderRadius="full" />
                            )}
                            {workoutTypes.has('other') && (
                              <Box w="2" h="2" bg="gray.400" borderRadius="full" />
                            )}
                          </HStack>
                        )}
                      </Box>
                    );
                  }
                  
                  return days;
                })()}
              </SimpleGrid>
            </VStack>
          </Box>
          
          {/* Divider */}
          <Box w="1px" bg={useColorModeValue('gray.200', 'gray.600')} />
          
          {/* Column 3 - Calendar Tags */}
          <Box 
            p={8} 
            h="400px"
            flex="1"
            display="flex"
            flexDirection="column"
            alignItems="start"
            justifyContent="start"
          >
            <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('gray.700', 'white')} mb={3}>
              Calendar Tags
            </Text>
            <VStack spacing={2} align="start" w="100%">
              {/* 100m Tag */}
              <HStack spacing={2}>
                <Box 
                  w="12px" 
                  h="12px" 
                  borderRadius="full" 
                  border="2px solid" 
                  borderColor="red.500"
                  bg="transparent"
                />
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                  100m
                </Text>
              </HStack>
              
              {/* 200m Tag */}
              <HStack spacing={2}>
                <Box 
                  w="12px" 
                  h="12px" 
                  borderRadius="full" 
                  border="2px solid" 
                  borderColor="orange.500"
                  bg="transparent"
                />
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                  200m
                </Text>
              </HStack>
              
              {/* 400m Tag */}
              <HStack spacing={2}>
                <Box 
                  w="12px" 
                  h="12px" 
                  borderRadius="full" 
                  border="2px solid" 
                  borderColor="green.500"
                  bg="transparent"
                />
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                  400m
                </Text>
              </HStack>
              
              {/* Today Tag */}
              <HStack spacing={2}>
                <Box 
                  w="12px" 
                  h="12px" 
                  borderRadius="full" 
                  bg="blue.500"
                />
                <Text fontSize="xs" color={useColorModeValue('gray.600', 'gray.300')}>
                  Today
                </Text>
              </HStack>
            </VStack>
          </Box>
        </HStack>
      </Box>
      
      {/* Main Chart Section */}
      <Box>
        <Text fontWeight="bold" mb={3} px={{ base: 4, md: 0 }}>Rep Progression Analysis</Text>
        
        {/* Tabbed Interface */}
        <Box mb={4} px={{ base: 4, md: 0 }}>
          {(() => {
            // Get all runs for the selected date range to calculate set counts
            const allRuns = analytics.runTimes.allRuns || [];
            
            // Apply the same filters as the main logic
            const filteredRunsForTabs = allRuns.filter(run => {
              // Date range filter
              const runDate = new Date(run.created_at);
              let dateFilter = true;
              
              if (repAnalysisStartDate) {
                const [year, month, day] = repAnalysisStartDate.split('-').map(Number);
                const startDate = new Date(year, month - 1, day);
                startDate.setHours(0, 0, 0, 0);
                const runDateOnly = new Date(runDate);
                runDateOnly.setHours(0, 0, 0, 0);
                dateFilter = dateFilter && (runDateOnly.getTime() === startDate.getTime());
              }
              
              if (repAnalysisEndDate && repAnalysisEndDate !== repAnalysisStartDate) {
                const endDate = new Date(repAnalysisEndDate);
                endDate.setHours(23, 59, 59, 999);
                dateFilter = dateFilter && (runDate <= endDate);
              }
              
              // Event type filter
              const exerciseName = run.exercise_name.toLowerCase();
              let eventMatch = true;
              
              if (repAnalysisEventFilter !== 'all') {
                if (repAnalysisEventFilter === '100m') {
                  eventMatch = exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter');
                } else if (repAnalysisEventFilter === '200m') {
                  eventMatch = exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter');
                } else if (repAnalysisEventFilter === '400m') {
                  eventMatch = exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter');
                }
              }
              
              return dateFilter && eventMatch;
            });
            
            // Parse set information for tab calculation
            const parsedRunsForTabs = filteredRunsForTabs.map(run => {
              let setNumber = 1;
              if (run.notes) {
                const setRepMatch = run.notes.match(/Set (\d+), Rep (\d+)/);
                if (setRepMatch) {
                  setNumber = parseInt(setRepMatch[1]);
                }
              }
              return { setNumber };
            });
            
            // Calculate set counts
            const set1Count = parsedRunsForTabs.filter(r => r.setNumber === 1).length;
            const set2Count = parsedRunsForTabs.filter(r => r.setNumber === 2).length;
            const set3Count = parsedRunsForTabs.filter(r => r.setNumber === 3).length;
            
            return (
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant={repAnalysisTab === 'all' ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onClick={() => setRepAnalysisTab('all')}
                >
                  All Runs
                </Button>
                {set1Count > 0 && (
                  <Button
                    size="sm"
                    variant={repAnalysisTab === 'set1' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onClick={() => setRepAnalysisTab('set1')}
                  >
                    Set 1
                  </Button>
                )}
                {set2Count > 0 && (
                  <Button
                    size="sm"
                    variant={repAnalysisTab === 'set2' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onClick={() => setRepAnalysisTab('set2')}
                  >
                    Set 2
                  </Button>
                )}
                {set3Count > 0 && (
                  <Button
                    size="sm"
                    variant={repAnalysisTab === 'set3' ? 'solid' : 'outline'}
                    colorScheme="blue"
                    onClick={() => setRepAnalysisTab('set3')}
                  >
                    Set 3
                  </Button>
                )}
              </HStack>
            );
          })()}
        </Box>
        
        {/* Graph Area - This will be replaced with the exact working implementation */}
        <Box>
          {(() => {
            // Get all runs for the selected date range
            const allRuns = analytics.runTimes.allRuns || [];
            
            // Apply filters
            console.log('Filtering runs with dates:', repAnalysisStartDate, repAnalysisEndDate);
            console.log('Total runs to filter:', allRuns.length);
            console.log('All runs data:', allRuns.map(run => ({
              id: run.id,
              exercise_name: run.exercise_name,
              created_at: run.created_at,
              time_minutes: run.time_minutes,
              time_seconds: run.time_seconds,
              time_hundredths: run.time_hundredths,
              has_time_data: run.has_time_data,
              date: new Date(run.created_at).toLocaleDateString()
            })));
            const filteredRuns = allRuns.filter(run => {
              // Date range filter - reps tab is independent of top date range selector
              const runDate = new Date(run.created_at);
              const runDateOnly = new Date(runDate);
              runDateOnly.setHours(0, 0, 0, 0);
              let dateFilter = true;
              
              // Only apply date filtering if specific dates are selected (from calendar)
              if (repAnalysisStartDate && repAnalysisEndDate) {
                const [startYear, startMonth, startDay] = repAnalysisStartDate.split('-').map(Number);
                const [endYear, endMonth, endDay] = repAnalysisEndDate.split('-').map(Number);
                
                const startDate = new Date(startYear, startMonth - 1, startDay);
                startDate.setHours(0, 0, 0, 0);
                
                const endDate = new Date(endYear, endMonth - 1, endDay);
                endDate.setHours(23, 59, 59, 999);
                
                dateFilter = runDateOnly >= startDate && runDateOnly <= endDate;
                
                console.log('Reps tab date filtering:', {
                  runDate: runDateOnly.toISOString(),
                  startDate: startDate.toISOString(),
                  endDate: endDate.toISOString(),
                  dateFilter,
                  exerciseName: run.exercise_name,
                  repAnalysisStartDate,
                  repAnalysisEndDate
                });
              } else {
                // If no specific dates selected in reps tab calendar, show no data (empty graphs)
                // But since we auto-select today's date, this should rarely happen
                dateFilter = false;
                console.log('No date filter applied - showing no data for:', run.exercise_name, 'dateFilter:', dateFilter, 'date:', runDateOnly.toLocaleDateString());
              }
              
              // Event type filter
              const exerciseName = run.exercise_name.toLowerCase();
              let eventMatch = true;
              
              console.log('Event filter check:', { exerciseName, repAnalysisEventFilter });
              
              if (repAnalysisEventFilter !== 'all') {
                if (repAnalysisEventFilter === '100m') {
                  eventMatch = exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter');
                } else if (repAnalysisEventFilter === '200m') {
                  eventMatch = exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter');
                } else if (repAnalysisEventFilter === '400m') {
                  eventMatch = exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter');
                } else if (repAnalysisEventFilter === '800m') {
                  eventMatch = exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter');
                } else if (repAnalysisEventFilter === '1500m') {
                  eventMatch = exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter');
                } else if (repAnalysisEventFilter === '5000m') {
                  eventMatch = exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km');
                }
              }
              
              const finalResult = dateFilter && eventMatch;
              console.log('Final filter result for', run.exercise_name, ':', { dateFilter, eventMatch, finalResult });
              return finalResult;
            });
            
            console.log('Filtered runs count:', filteredRuns.length);
            console.log('Runs filtered out by date:', allRuns.filter(run => {
              const runDate = new Date(run.created_at);
              const runDateOnly = new Date(runDate);
              runDateOnly.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(23, 59, 59, 999);
              return runDateOnly > today;
            }).map(run => ({
              exercise_name: run.exercise_name,
              created_at: run.created_at,
              date: new Date(run.created_at).toLocaleDateString()
            })));
            
            if (filteredRuns.length === 0) {
              return (
                <VStack spacing={4}>
                  <Card bg={cardBg} borderColor={borderColor} boxShadow="none">
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontWeight="bold" fontSize="sm">
                            No Exercise Data
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {repAnalysisStartDate ? new Date(repAnalysisStartDate).toLocaleDateString() : 'No date selected'}
                          </Text>
                        </HStack>
                        
                        <HStack spacing={6} mb={4}>
                          <VStack spacing={1}>
                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                              Total Runs
                            </Text>
                            <Text fontSize="sm" fontWeight="medium">
                              0
                            </Text>
                          </VStack>
                          <VStack spacing={1}>
                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                              Best Time
                            </Text>
                            <Text fontSize="sm" fontWeight="medium">
                              N/A
                            </Text>
                          </VStack>
                          <VStack spacing={1}>
                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                              Avg Time
                            </Text>
                            <Text fontSize="sm" fontWeight="medium">
                              N/A
                            </Text>
                          </VStack>
                        </HStack>
                        
                        {/* Run Times Chart */}
                        <Box>
                          <Text fontSize="xs" fontWeight="medium" mb={2}>Run Times:</Text>
                          <Box bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg" px={1} py={10} position="relative">
                            <Box h="300px" position="relative" pt={2}>
                              <Box position="relative" ml="80px" mr="20px" mb="50px" w="calc(100% - 100px)">
                                <svg width="100%" height="240" viewBox="0 0 1000 240" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                  {/* Grid lines */}
                                  {Array.from({ length: 5 }, (_, i) => {
                                    const y = 240 - (i * (240 / 4));
                                    return (
                                      <g key={`y-${i}`}>
                                        <line
                                          x1="0"
                                          y1={y}
                                          x2="1000"
                                          y2={y}
                                          stroke={useColorModeValue('#F3F4F6', '#374151')}
                                          strokeWidth="1"
                                          opacity={0.3}
                                        />
                                      </g>
                                    );
                                  })}
                                  
                                  {/* Empty state message centered in chart */}
                                  <g>
                                    <text x="500" y="120" textAnchor="middle" fill={useColorModeValue('#6B7280', '#9CA3AF')} fontSize="14" fontFamily="system-ui">
                                      {repAnalysisStartDate ? `No runtime data for ${new Date(repAnalysisStartDate).toLocaleDateString()}` : 'No runtime data available'}
                                    </text>
                                    <text x="500" y="140" textAnchor="middle" fill={useColorModeValue('#9CA3AF', '#6B7280')} fontSize="12" fontFamily="system-ui">
                                      {repAnalysisStartDate ? 'Try selecting a different date' : 'Complete running exercises with time data'}
                                    </text>
                                  </g>
                                </svg>
                              </Box>
                              
                              {/* Y-axis labels positioned outside chart */}
                              <Box position="absolute" left="0" top="0" h="240px" w="70px">
                                {Array.from({ length: 5 }, (_, i) => {
                                  const y = 240 - (i * (240 / 4));
                                  return (
                                    <Text
                                      key={`y-label-${i}`}
                                      position="absolute"
                                      left="0"
                                      top={`${y - 8}px`}
                                      fontSize="10px"
                                      color={useColorModeValue('#6B7280', '#9CA3AF')}
                                      textAlign="right"
                                      w="70px"
                                      pr="10px"
                                    >
                                      {i === 0 ? '22.0s' : i === 1 ? '23.5s' : i === 2 ? '25.0s' : i === 3 ? '26.5s' : '28.0s'}
                                    </Text>
                                  );
                                })}
                              </Box>
                              
                              {/* X-axis labels positioned outside chart */}
                              <Box position="absolute" left="80px" right="20px" bottom="-30px" h="30px">
                                {Array.from({ length: 5 }, (_, i) => {
                                  let x;
                                  if (i === 0) {
                                    x = "0%";
                                  } else if (i === 4) {
                                    x = "100%";
                                  } else {
                                    x = `${(i / 4) * 100}%`;
                                  }
                                  
                                  return (
                                    <Text
                                      key={`x-label-${i}`}
                                      position="absolute"
                                      left={x}
                                      bottom="0"
                                      fontSize="10px"
                                      color={useColorModeValue('#6B7280', '#9CA3AF')}
                                      textAlign={i === 4 ? "right" : i === 0 ? "left" : "center"}
                                      transform={i === 4 ? "translateX(-100%)" : i === 0 ? "translateX(0%)" : "translateX(-50%)"}
                                      maxW="80px"
                                      isTruncated
                                    >
                                      {i === 0 ? 'Jul 1' : i === 1 ? 'Jul 8' : i === 2 ? 'Jul 15' : i === 3 ? 'Jul 22' : 'Jul 29'}
                                    </Text>
                                  );
                                })}
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              );
            }
            
            // Parse set/rep information and group runs
            const parsedRuns = filteredRuns.map(run => {
              const totalSeconds = (run.time_minutes || 0) * 60 + (run.time_seconds || 0) + (run.time_hundredths || 0) / 100;
              const formattedTime = `${run.time_minutes || 0}:${(run.time_seconds || 0).toString().padStart(2, '0')}.${(run.time_hundredths || 0).toString().padStart(2, '0')}`;
              
              // Parse set and rep from notes
              let setNumber = 1;
              let repNumber = 1;
              if (run.notes) {
                console.log('Parsing notes:', run.notes);
                const setRepMatch = run.notes.match(/Set (\d+), Rep (\d+)/);
                if (setRepMatch) {
                  setNumber = parseInt(setRepMatch[1]);
                  repNumber = parseInt(setRepMatch[2]);
                  console.log('Parsed set/rep:', { setNumber, repNumber, notes: run.notes });
                } else {
                  console.log('No set/rep match found in notes:', run.notes);
                }
              } else {
                console.log('No notes field for run:', run.id);
              }
              
              return {
                id: run.id,
                exerciseName: run.exercise_name,
                time: totalSeconds,
                formattedTime,
                created_at: run.created_at,
                notes: run.notes,
                setNumber,
                repNumber
              };
            });
            
            // Remove duplicates based on set/rep combination
            const uniqueRuns = [];
            const seen = new Set();
            
            parsedRuns.forEach(run => {
              const key = `${run.setNumber}-${run.repNumber}`;
              if (!seen.has(key)) {
                seen.add(key);
                uniqueRuns.push(run);
              } else {
                console.log('Duplicate found and removed:', { setNumber: run.setNumber, repNumber: run.repNumber, id: run.id, exerciseName: run.exerciseName });
              }
            });
            
            // Check for 100m sprint data specifically
            const sprint100mRuns = parsedRuns.filter(run => run.exerciseName.toLowerCase().includes('100m'));
            console.log('100m sprint runs found:', sprint100mRuns.length);
            if (sprint100mRuns.length > 0) {
              console.log('100m sprint runs:', sprint100mRuns.map(run => ({
                id: run.id,
                exerciseName: run.exerciseName,
                setNumber: run.setNumber,
                repNumber: run.repNumber,
                time: run.time,
                notes: run.notes,
                created_at: run.created_at,
                date: new Date(run.created_at).toLocaleDateString()
              })));
            }
            
            console.log('After removing duplicates:', {
              originalCount: parsedRuns.length,
              uniqueCount: uniqueRuns.length,
              duplicatesRemoved: parsedRuns.length - uniqueRuns.length
            });
            
            console.log('Parsed runs:', parsedRuns.map(r => ({
              id: r.id,
              exerciseName: r.exerciseName,
              setNumber: r.setNumber,
              repNumber: r.repNumber,
              time: r.time,
              notes: r.notes,
              created_at: r.created_at,
              date: new Date(r.created_at).toLocaleDateString()
            })));
            
            // Filter runs based on selected tab
            let filteredByTab = uniqueRuns;
            if (repAnalysisTab === 'set1') {
              filteredByTab = uniqueRuns.filter(run => run.setNumber === 1);
            } else if (repAnalysisTab === 'set2') {
              filteredByTab = uniqueRuns.filter(run => run.setNumber === 2);
            } else if (repAnalysisTab === 'set3') {
              filteredByTab = uniqueRuns.filter(run => run.setNumber === 3);
            }
            
            console.log('Tab filtering:', {
              selectedTab: repAnalysisTab,
              totalParsedRuns: parsedRuns.length,
              filteredByTabCount: filteredByTab.length,
              set1Count: parsedRuns.filter(r => r.setNumber === 1).length,
              set2Count: parsedRuns.filter(r => r.setNumber === 2).length,
              set3Count: parsedRuns.filter(r => r.setNumber === 3).length
            });
            
            // Group runs by exercise name
            const runsByExercise = {};
            
            console.log('Final filtered runs for display:', filteredByTab.map(run => ({
              id: run.id,
              exerciseName: run.exerciseName,
              setNumber: run.setNumber,
              repNumber: run.repNumber,
              time: run.time,
              notes: run.notes,
              created_at: run.created_at,
              date: new Date(run.created_at).toLocaleDateString()
            })));
            
            filteredByTab.forEach(run => {
              const exerciseName = run.exerciseName;
              if (!runsByExercise[exerciseName]) {
                runsByExercise[exerciseName] = [];
              }
              runsByExercise[exerciseName].push(run);
            });
            
            return (
              <VStack spacing={4}>
                {Object.entries(runsByExercise).map(([exerciseName, runs], index) => {
                  const runsArray = runs as any[];
                  
                  // Sort runs by rep number for proper ordering
                  const sortedRuns = runsArray.sort((a, b) => a.repNumber - b.repNumber);
                  
                  const bestTime = Math.min(...sortedRuns.map(r => r.time));
                  const avgTime = sortedRuns.reduce((sum, r) => sum + r.time, 0) / sortedRuns.length;
                  const bestTimeFormatted = `${Math.floor(bestTime / 60)}:${(bestTime % 60).toFixed(2).padStart(5, '0')}`;
                  const avgTimeFormatted = `${Math.floor(avgTime / 60)}:${(avgTime % 60).toFixed(2).padStart(5, '0')}`;
                  
                  return (
                    <Card key={index} bg={cardBg} borderColor={borderColor} boxShadow="none">
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="sm">
                              {exerciseName}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {new Date(runsArray[0].created_at).toLocaleDateString()}
                            </Text>
                          </HStack>
                          
                          <HStack spacing={6} mb={4}>
                            <VStack spacing={1}>
                              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                {repAnalysisTab === 'all' ? 'Total Runs' : 'Runs'}
                              </Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {sortedRuns.length}
                              </Text>
                            </VStack>
                            <VStack spacing={1}>
                              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                Best Time
                              </Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {bestTimeFormatted}
                              </Text>
                            </VStack>
                            <VStack spacing={1}>
                              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                                Avg Time
                              </Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {avgTimeFormatted}
                              </Text>
                            </VStack>
                          </HStack>
                          
                          {/* Run Times Chart */}
                          <Box>
                            <Text fontSize="xs" fontWeight="medium" mb={2}>Run Times:</Text>
                            <Box bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg" px={1} py={10} position="relative">
                              <Box h="300px" position="relative" pt={2}>
                                <Box position="relative" ml="80px" mr="20px" mb="50px" w="calc(100% - 100px)">
                                  <svg width="100%" height="240" viewBox="0 0 1000 240" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                                    {/* Grid lines */}
                                    {Array.from({ length: 5 }, (_, i) => (
                                      <line
                                        key={`grid-${i}`}
                                        x1="0"
                                        y1={i * 48}
                                        x2="1000"
                                        y2={i * 48}
                                        stroke={useColorModeValue('#E5E7EB', '#374151')}
                                        strokeWidth="1"
                                        opacity="0.3"
                                      />
                                    ))}
                                    
                                    {/* Run times line */}
                                    {(() => {
                                      const times = sortedRuns.map(r => r.time);
                                      const minTime = Math.min(...times);
                                      const maxTime = Math.max(...times);
                                      const timeRange = maxTime - minTime;
                                      
                                      // Handle single data point case
                                      if (timeRange === 0) {
                                        // For single data point, create a small range for visualization
                                        const adjustedMinTime = minTime - 1;
                                        const adjustedMaxTime = maxTime + 1;
                                        const adjustedTimeRange = adjustedMaxTime - adjustedMinTime;
                                        
                                        const point = {
                                          x: 500, // Center of chart
                                          y: 120, // Center of chart
                                          run: sortedRuns[0]
                                        };
                                        
                                        return (
                                          <g>
                                            {/* Single point */}
                                            <circle
                                              cx={point.x}
                                              cy={point.y}
                                              r="6"
                                              fill="#10B981"
                                              stroke="white"
                                              strokeWidth="2"
                                              style={{ cursor: 'pointer' }}
                                              vectorEffect="non-scaling-stroke"
                                              onMouseEnter={(e) => {
                                                setTooltipData({
                                                  text: `${point.run.formattedTime}`,
                                                  x: e.clientX + 10,
                                                  y: e.clientY - 30
                                                });
                                              }}
                                              onMouseLeave={() => setTooltipData(null)}
                                            />
                                          </g>
                                        );
                                      }
                                      
                                      const points = sortedRuns.map((run, index) => {
                                        const x = (index / (sortedRuns.length - 1)) * 900 + 50;
                                        const y = 240 - ((run.time - minTime) / timeRange) * 200;
                                        return { x, y, run };
                                      });
                                      
                                      const pathData = points.map((point, index) => {
                                        if (index === 0) return `M ${point.x},${point.y}`;
                                        return `L ${point.x},${point.y}`;
                                      }).join(' ');
                                      
                                      return (
                                        <g>
                                          {/* Average line */}
                                          <line
                                            x1="50"
                                            y1={240 - ((avgTime - minTime) / timeRange) * 200}
                                            x2="950"
                                            y2={240 - ((avgTime - minTime) / timeRange) * 200}
                                            stroke="#6B7280"
                                            strokeWidth="1"
                                            strokeDasharray="5,5"
                                            opacity="0.6"
                                          />
                                          <path
                                            d={pathData}
                                            fill="none"
                                            stroke="#10B981"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeOpacity="0.8"
                                          />
                                          {points.map((point, index) => {
                                            const timeString = point.run.formattedTime;
                                            const repInfo = `Rep ${point.run.repNumber}${point.run.setNumber > 1 ? ` (Set ${point.run.setNumber})` : ''}`;
                                            const tooltipText = `${repInfo}: ${timeString}`;
                                            
                                            return (
                                              <circle
                                                key={index}
                                                cx={point.x}
                                                cy={point.y}
                                                r="4"
                                                fill={point.run.time === bestTime ? "#10B981" : "#6B7280"}
                                                stroke="white"
                                                strokeWidth="1"
                                                style={{ cursor: 'pointer' }}
                                                vectorEffect="non-scaling-stroke"
                                                onMouseEnter={(e) => {
                                                  setTooltipData({
                                                    text: tooltipText,
                                                    x: e.clientX + 10,
                                                    y: e.clientY - 30
                                                  });
                                                }}
                                                onMouseLeave={() => {
                                                  setTooltipData(null);
                                                }}
                                              />
                                            );
                                          })}
                                        </g>
                                      );
                                    })()}
                                  </svg>
                                </Box>
                                
                                {/* Y-axis labels positioned outside chart */}
                                <Box position="absolute" left="0" top="0" h="240px" w="70px">
                                  {(() => {
                                    const times = sortedRuns.map(r => r.time);
                                    const minTime = Math.min(...times);
                                    const maxTime = Math.max(...times);
                                    const timeRange = maxTime - minTime;
                                    
                                    return Array.from({ length: 5 }, (_, i) => {
                                      const timeValue = minTime + (i * timeRange / 4);
                                      const y = 240 - (i * (240 / 4));
                                      return (
                                        <Text
                                          key={`y-label-${i}`}
                                          position="absolute"
                                          left="0"
                                          top={`${y - 8}px`}
                                          fontSize="10px"
                                          color={useColorModeValue('#6B7280', '#9CA3AF')}
                                          textAlign="right"
                                          w="70px"
                                          pr="10px"
                                        >
                                          {timeValue.toFixed(1)}s
                                        </Text>
                                      );
                                    });
                                  })()}
                                </Box>
                                
                                {/* X-axis labels positioned outside chart */}
                                <Box position="absolute" left="130px" right="70px" bottom="-30px" h="30px">
                                  {sortedRuns.map((run, index) => {
                                    // Use the exact same mathematical formula as the data points
                                    // Data points: (index / (sortedRuns.length - 1)) * 900 + 50
                                    // Labels: (index / (sortedRuns.length - 1)) * 100
                                    const xPercent = (index / (sortedRuns.length - 1)) * 100;
                                    
                                    // For "All Runs" tab, show sequential numbers with color coding
                                    if (repAnalysisTab === 'all') {
                                      const runNumber = index + 1;
                                      
                                      // Color coding based on run number (every 7 runs = new color)
                                      let textColor = '#6B7280'; // default gray
                                      if (runNumber <= 7) {
                                        textColor = '#3B82F6'; // blue for runs 1-7
                                      } else if (runNumber <= 14) {
                                        textColor = '#10B981'; // green for runs 8-14
                                      } else if (runNumber <= 21) {
                                        textColor = '#F59E0B'; // orange for runs 15-21
                                      } else if (runNumber <= 28) {
                                        textColor = '#8B5CF6'; // purple for runs 22-28
                                      } else if (runNumber <= 35) {
                                        textColor = '#EF4444'; // red for runs 29-35
                                      } else if (runNumber <= 42) {
                                        textColor = '#06B6D4'; // cyan for runs 36-42
                                      } else {
                                        textColor = '#F97316'; // amber for runs 43+
                                      }
                                      
                                      return (
                                        <Text
                                          key={`x-label-${index}`}
                                          position="absolute"
                                          left={`${xPercent}%`}
                                          bottom="0"
                                          fontSize="10px"
                                          color={textColor}
                                          fontWeight="medium"
                                          textAlign="center"
                                          transform="translateX(-50%)"
                                          maxW="40px"
                                          isTruncated
                                        >
                                          {runNumber}
                                        </Text>
                                      );
                                    } else {
                                      // For individual set tabs, show "Run X"
                                      return (
                                        <Text
                                          key={`x-label-${index}`}
                                          position="absolute"
                                          left={`${xPercent}%`}
                                          bottom="0"
                                          fontSize="10px"
                                          color={useColorModeValue('#6B7280', '#9CA3AF')}
                                          textAlign="center"
                                          transform="translateX(-50%)"
                                          maxW="40px"
                                          isTruncated
                                        >
                                          Run {index + 1}
                                        </Text>
                                      );
                                    }
                                  })}
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </VStack>
            );
          })()}
        </Box>
      </Box>
      
      {/* Tooltip */}
      {tooltipData && (
        <Box
          position="fixed"
          left={`${tooltipData.x}px`}
          top={`${tooltipData.y}px`}
          bg={useColorModeValue('gray.800', 'gray.200')}
          color={useColorModeValue('white', 'gray.800')}
          px={2}
          py={1}
          borderRadius="md"
          fontSize="sm"
          zIndex={1000}
          pointerEvents="none"
        >
          {tooltipData.text}
        </Box>
      )}
    </VStack>
  );
}; 