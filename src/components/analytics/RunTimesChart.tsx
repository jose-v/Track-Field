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
  CardBody
} from '@chakra-ui/react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface RunTimesChartProps {
  analytics: any;
  dateRange: string;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
}

interface ChartDataPoint {
  date: Date;
  time: number;
  formattedTime?: string;
}

export const RunTimesChart: React.FC<RunTimesChartProps> = ({
  analytics,
  dateRange,
  selectedDate,
  setSelectedDate
}) => {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [tooltipData, setTooltipData] = useState<{ text: string; x: number; y: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textPrimary = useColorModeValue('gray.800', 'white');
  const bestTimesTextColor = useColorModeValue('gray.600', 'yellow.500');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');
  const noEventsColor = useColorModeValue('gray.500', 'gray.400');
  const chartBg = useColorModeValue('gray.50', 'gray.700');
  const chartTextColor = useColorModeValue('gray.600', 'gray.300');
  const chartSubtextColor = useColorModeValue('gray.500', 'gray.400');
  const gridLineColor = useColorModeValue('#E5E7EB', '#374151');
  const axisLabelColor = useColorModeValue('#6B7280', '#9CA3AF');
  const legendTextColor = useColorModeValue('gray.600', 'gray.300');
  const tooltipBg = useColorModeValue('gray.800', 'gray.200');
  const tooltipColor = useColorModeValue('white', 'black');

  // Helper function to get date range
  const getDateRange = () => {
    const today = new Date();
    const startDate = new Date();
    
    switch(dateRange) {
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'quarter':
        startDate.setDate(today.getDate() - 90);
        break;
      default:
        startDate.setDate(today.getDate() - 30);
    }
    
    return { startDate, endDate: today };
  };

  // Helper function to get legend date range
  const getLegendDateRange = () => {
    const { startDate, endDate } = getDateRange();
    const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  // Get available events and set default selected event - BEFORE safety check
  const chartData = analytics?.runTimes?.chartData || {};
  const availableEvents = Object.keys(chartData);
  const eventsWithData = availableEvents.filter(event => {
    const eventData = chartData[event];
    return eventData && eventData.length > 0;
  });

  // Set default selected event if not already set or if current selection is invalid
  React.useEffect(() => {
    if (eventsWithData.length > 0 && (selectedEvent === 'all' || !eventsWithData.includes(selectedEvent))) {
      setSelectedEvent(eventsWithData[0]);
    }
  }, [eventsWithData, selectedEvent]);

  // Safety check for analytics data - AFTER all hooks are called
  if (!analytics || !analytics.runTimes) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">No analytics data available</Text>
      </Box>
    );
  }

  return (
    <>
      <VStack spacing={8} align="stretch">
        <Box px={{ base: 0, md: 0 }}>
          <VStack spacing={6} align="flex-end">
            <Text fontSize="sm" pr="12px" color={bestTimesTextColor} fontWeight="medium">
              Best Training Times
            </Text>
            <HStack spacing={2} divider={<Box w="1px" h="40px" bg={dividerColor} />}>
              {(() => {
                // Find best times for different events
                const recentRuns = analytics.runTimes.recentRuns || [];
                const runsWithTime = recentRuns.filter(run => run.has_time_data);
                const eventBestTimes = {};
                
                // Group runs by event and find best time for each
                runsWithTime.forEach(run => {
                  const exerciseName = run.exercise_name.toLowerCase();
                  let eventKey = null;
                  
                  if (exerciseName.includes('100m') || exerciseName.includes('100 m') || exerciseName.includes('100 meter')) {
                    eventKey = '100m';
                  } else if (exerciseName.includes('200m') || exerciseName.includes('200 m') || exerciseName.includes('200 meter')) {
                    eventKey = '200m';
                  } else if (exerciseName.includes('400m') || exerciseName.includes('400 m') || exerciseName.includes('400 meter')) {
                    eventKey = '400m';
                  } else if (exerciseName.includes('800m') || exerciseName.includes('800 m') || exerciseName.includes('800 meter')) {
                    eventKey = '800m';
                  } else if (exerciseName.includes('1500m') || exerciseName.includes('1500 m') || exerciseName.includes('1500 meter')) {
                    eventKey = '1500m';
                  } else if (exerciseName.includes('5000m') || exerciseName.includes('5000 m') || exerciseName.includes('5000 meter') || exerciseName.includes('5k') || exerciseName.includes('5 km')) {
                    eventKey = '5000m';
                  }
                  
                  if (eventKey) {
                    const totalMs = ((run.time_minutes || 0) * 60 + (run.time_seconds || 0)) * 1000 + (run.time_hundredths || 0) * 10;
                    if (!eventBestTimes[eventKey] || totalMs < eventBestTimes[eventKey].totalMs) {
                      eventBestTimes[eventKey] = {
                        totalMs,
                        minutes: run.time_minutes || 0,
                        seconds: run.time_seconds || 0,
                        hundredths: run.time_hundredths || 0
                      };
                    }
                  }
                });
                
                // Get top 3 events or all available events
                const availableEvents = Object.keys(eventBestTimes).slice(0, 3);
                
                if (availableEvents.length === 0) {
                  return (
                                                        <VStack spacing={1} px={4}>
                                      <Text fontSize="xs" color={noEventsColor}>No Events</Text>
                                      <Text fontSize="sm" fontWeight="medium">N/A</Text>
                                    </VStack>
                  );
                }
                
                return availableEvents.map((event, index) => {
                  const bestTime = eventBestTimes[event];
                  const timeString = `${bestTime.minutes}:${bestTime.seconds.toString().padStart(2, '0')}.${bestTime.hundredths.toString().padStart(2, '0')}`;
                  
                  return (
                    <VStack key={index} spacing={1} px={4}>
                      <Text fontSize="xs" color={noEventsColor}>{event}</Text>
                      <Text fontSize="sm" fontWeight="medium">{timeString}</Text>
                    </VStack>
                  );
                });
              })()}
            </HStack>
          </VStack>
        </Box>

        {/* Chart Section */}
        <Box>
          {/* Runtime Performance Over Time Chart */}
          <Box maxW="1200px" mx="auto">
            <Text fontWeight="bold" mb={4}>Runtime Performance Over Time</Text>
            
            {/* Event Type Tabs */}
            <Box mb={4}>
              {(() => {
                const availableEvents = Object.keys(analytics.runTimes.chartData || {});
                const eventsWithData = availableEvents.filter(event => {
                  const eventData = analytics.runTimes.chartData[event];
                  return eventData && eventData.length > 0;
                });
                
                if (eventsWithData.length <= 1) {
                  return null; // Don't show tabs if there's only one event or no events
                }
                
                return (
                  <HStack spacing={2}>
                    {eventsWithData.map(event => (
                      <Button
                        key={event}
                        size="sm"
                        variant={selectedEvent === event ? 'solid' : 'outline'}
                        colorScheme="blue"
                        onClick={() => setSelectedEvent(event)}
                      >
                        {event}
                      </Button>
                    ))}
                  </HStack>
                );
              })()}
            </Box>
            
            {(() => {
              // Get chart variables
              const allDataPoints = Object.values(analytics.runTimes.chartData || {}).flat() as ChartDataPoint[];
              const { startDate, endDate } = getDateRange();
              let dataInRange = allDataPoints.filter((d: ChartDataPoint) => d.date.getTime() >= startDate.getTime() && d.date.getTime() <= endDate.getTime());
              
              // Filter by selected event
              const chartData = analytics.runTimes.chartData || {};
              const eventData = (chartData[selectedEvent] || []) as ChartDataPoint[];
              dataInRange = eventData.filter((d: ChartDataPoint) => d.date.getTime() >= startDate.getTime() && d.date.getTime() <= endDate.getTime());
              
              if (dataInRange.length === 0) {
                return (
                  <Box 
                    w="100%" 
                    h="240px" 
                    bg={chartBg}
                    borderRadius="lg"
                    px={1}
                    py={10}
                    position="relative"
                  >
                    <Box position="absolute" top="0" left="0" right="0" bottom="0" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
                      <VStack spacing={2}>
                        <Text fontSize="sm" color={chartTextColor} textAlign="center">
                          {`No ${selectedEvent} data available`}
                        </Text>
                        <Text fontSize="xs" color={chartSubtextColor} textAlign="center">
                          Complete running exercises with time data
                        </Text>
                      </VStack>
                    </Box>
                  </Box>
                );
              }
              
              const chartDataPoints = dataInRange as ChartDataPoint[];
              const allTimes = chartDataPoints.map((d: ChartDataPoint) => d.time);
              const globalMinTime = Math.min(...allTimes);
              const globalMaxTime = Math.max(...allTimes);
              
              let adjustedMinTime, adjustedMaxTime, globalTimeRange;
              if (globalMinTime === globalMaxTime) {
                adjustedMinTime = globalMinTime - 1;
                adjustedMaxTime = globalMaxTime + 1;
                globalTimeRange = 2;
              } else {
                // Add padding to ensure data stays within bounds
                // Always start a few seconds before the actual minimum time
                const timeRange = globalMaxTime - globalMinTime;
                const padding = Math.max(timeRange * 0.1, 2); // At least 2 seconds padding
                adjustedMinTime = globalMinTime - padding;
                adjustedMaxTime = globalMaxTime + padding;
                globalTimeRange = adjustedMaxTime - adjustedMinTime;
              }

              const minDate = startDate.getTime();
              const maxDate = endDate.getTime();
              const chartDateRange = maxDate - minDate;
              
              return (
                <Box position="relative">
                  <Box position="relative" ml="45px" mr="20px" mb="50px" w="calc(100% - 95px)">
                    <Box 
                      w="100%" 
                      h="340px" 
                      bg={chartBg}
                      borderRadius="lg"
                      px={1}
                      py={10}
                      position="relative"
                    >
                      <Box h="340px" position="relative" pt={2}>
                        <Box position="relative" ml="55px" mr="20px" mb="50px" w="calc(100% - 75px)">
                          <svg width="100%" height="340" viewBox="0 0 1000 340" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
                            {/* Grid lines */}
                            {Array.from({ length: 5 }, (_, i) => (
                              <line
                                key={`grid-${i}`}
                                x1="0"
                                y1={i * 68}
                                x2="1000"
                                y2={i * 68}
                                stroke={gridLineColor}
                                strokeWidth="2"
                                opacity="0.6"
                              />
                            ))}
                            
                            {/* Chart content */}
                            {(() => {
                              if (!analytics?.runTimes?.chartData) return null;
                              
                              const eventColors = {
                                '100m': '#EF4444',
                                '200m': '#F59E0B', 
                                '400m': '#10B981',
                                '800m': '#3B82F6',
                                '1500m': '#8B5CF6',
                                '5000m': '#EC4899'
                              };
                              
                              // Show only selected event data
                              const eventData = analytics.runTimes.chartData[selectedEvent] || [];
                              const filteredData = eventData.filter(point => 
                                point.date.getTime() >= minDate && point.date.getTime() <= maxDate
                              );
                              
                              if (filteredData.length === 0) return null;
                              
                              const color = eventColors[selectedEvent] || '#6B7280';
                              const sortedData = [...filteredData].sort((a, b) => a.date.getTime() - b.date.getTime());
                              
                              const points = sortedData.map((point) => {
                                const x = chartDateRange > 0 ? ((point.date.getTime() - minDate) / chartDateRange) * 1000 : 0;
                                const y = 340 - ((point.time - adjustedMinTime) / globalTimeRange) * 340;
                                return { x, y, point };
                              });
                              
                              if (points.length < 1) return null;
                              
                              const pathData = points.map((point, index) => {
                                if (index === 0) {
                                  return `M ${point.x},${point.y}`;
                                } else {
                                  return `L ${point.x},${point.y}`;
                                }
                              }).join(' ');
                              
                              const validPoints = points.filter(p => !isNaN(p.x) && !isNaN(p.y) && p.x >= 0 && p.x <= 1000 && p.y >= 0 && p.y <= 340);
                              
                              if (validPoints.length < 1) return null;
                              
                              return (
                                <g>
                                  {points.length >= 2 && (
                                    <path
                                      d={pathData}
                                      fill="none"
                                      stroke={color}
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeOpacity="0.8"
                                      vectorEffect="non-scaling-stroke"
                                    />
                                  )}
                                  {points.map((point, index) => {
                                    const timeString = point.point.formattedTime || `${Math.floor(point.point.time / 60)}:${(point.point.time % 60).toFixed(2).padStart(5, '0')}`;
                                    const dateString = point.point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                    const tooltipText = `${dateString}: ${timeString}`;
                                    
                                    return (
                                      <circle
                                        key={index}
                                        cx={point.x}
                                        cy={point.y}
                                        r="4"
                                        fill={color}
                                        fillOpacity="0.9"
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
                        <Box position="absolute" left="0" top="0" h="340px" w="70px">
                          {(() => {
                            return Array.from({ length: 5 }, (_, i) => {
                              const timeValue = adjustedMinTime + (i * globalTimeRange / 4);
                              const y = 340 - (i * (340 / 4));
                              return (
                                <Text
                                  key={`y-label-${i}`}
                                  position="absolute"
                                  left="0"
                                  top={`${y - 8}px`}
                                  fontSize="10px"
                                  color={axisLabelColor}
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
                        <Box position="absolute" left="105px" right="70px" bottom="-30px" h="30px">
                          {(() => {
                            const { startDate, endDate } = getDateRange();
                            
                            return Array.from({ length: 5 }, (_, i) => {
                              const date = new Date(startDate.getTime() + (i * (endDate.getTime() - startDate.getTime()) / 4));
                              const xPercent = (i / 4) * 100;
                              
                              return (
                                <Text
                                  key={`x-label-${i}`}
                                  position="absolute"
                                  left={`${xPercent}%`}
                                  bottom="0"
                                  fontSize="10px"
                                  color={axisLabelColor}
                                  textAlign={i === 4 ? "right" : i === 0 ? "left" : "center"}
                                  transform={i === 4 ? "translateX(-100%)" : i === 0 ? "translateX(0%)" : "translateX(-50%)"}
                                  maxW="80px"
                                  isTruncated
                                >
                                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </Text>
                              );
                            });
                          })()}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })()}
          </Box>
          
          {/* Legend */}
          <Box mt={4} maxW="1100px" mx="auto">
            <Text fontSize="sm" fontWeight="medium" mb={4}>Legend ({getLegendDateRange()})</Text>
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
              {Object.entries(chartData).map(([event, data]) => {
                if ((data as any[]).length === 0) return null;
                
                const getCategoryColor = (cat: string) => {
                  switch(cat) {
                    case '100m': return 'red';
                    case '200m': return 'orange';
                    case '400m': return 'green';
                    case '800m': return 'blue';
                    case '1500m': return 'purple';
                    case '5000m': return 'teal';
                    default: return 'gray';
                  }
                };
                
                return (
                  <HStack key={event} spacing={2}>
                    <Box 
                      w="12px" 
                      h="12px" 
                      borderRadius="full" 
                      bg={`${getCategoryColor(event)}.500`}
                    />
                    <Text fontSize="xs" color={legendTextColor}>
                      {event} ({(data as any[]).length} runs)
                    </Text>
                  </HStack>
                );
              })}
            </SimpleGrid>
          </Box>
        </Box>
      </VStack>
      
      {/* Custom Tooltip */}
      {tooltipData && (
        <Box
          position="fixed"
          left={`${tooltipData.x}px`}
          top={`${tooltipData.y}px`}
          bg={tooltipBg}
          color={tooltipColor}
          px={2}
          py={1}
          borderRadius="md"
          fontSize="sm"
          zIndex={1000}
          boxShadow="md"
          pointerEvents="none"
        >
          {tooltipData.text}
        </Box>
      )}
    </>
  );
}; 