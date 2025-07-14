import React, { useState, useMemo } from 'react';
import {
  Box,
  Text,
  Grid,
  GridItem,
  HStack,
  VStack,
  Button,
  IconButton,
  useColorModeValue,
  Badge,
  Flex,
  Tooltip,
  Card,
  CardBody
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';

interface DateTimePickerProps {
  selectedDates: string[];
  selectedStartTime?: string;
  selectedEndTime?: string;
  isMultiSelect?: boolean;
  onDateSelect: (dates: string[]) => void;
  onTimeSelect?: (startTime: string, endTime?: string) => void;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDates,
  selectedStartTime,
  selectedEndTime,
  isMultiSelect = false,
  onDateSelect,
  onTimeSelect
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAM, setIsAM] = useState(true);
  const [startHour, setStartHour] = useState(12);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(1);
  const [endMinute, setEndMinute] = useState(0);

  // Color mode values moved to top level to fix Hooks rule violations
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('blue.500', 'blue.600');
  const selectedBg = useColorModeValue('blue.100', 'blue.700');
  const selectedColor = useColorModeValue('blue.600', 'blue.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedTextColor = useColorModeValue('gray.400', 'gray.500');
  const timeBg = useColorModeValue('gray.50', 'gray.700');
  const timeSelectedBg = useColorModeValue('blue.500', 'blue.600');
  const timeSelectedColor = useColorModeValue('white', 'white');
  // Add missing color values to fix remaining hooks violations
  const inRangeBg = useColorModeValue('blue.50', 'blue.900');
  const inRangeColor = useColorModeValue('blue.600', 'blue.200');
  const inRangeHoverBg = useColorModeValue('blue.100', 'blue.800');
  const timeHoverBg = useColorModeValue('gray.50', 'gray.600');

  // Helper functions
  const formatDate = (date: Date): string => {
    // Use local timezone instead of UTC to prevent date shifting
    // This ensures that a date selected in the UI matches what gets saved
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateSelected = (date: string): boolean => {
    if (!isMultiSelect) {
      return selectedDates.includes(date);
    }
    
    // For multi-select (weekly workouts), highlight range between start and end
    if (selectedDates.length >= 2) {
      const sortedDates = [...selectedDates].sort();
      const startDate = new Date(sortedDates[0]);
      const endDate = new Date(sortedDates[sortedDates.length - 1]);
      const currentDate = new Date(date);
      
      return currentDate >= startDate && currentDate <= endDate;
    }
    
    return selectedDates.includes(date);
  };

  const isDateInRange = (date: string): boolean => {
    if (!isMultiSelect || selectedDates.length < 2) return false;
    
    const sortedDates = [...selectedDates].sort();
    const startDate = new Date(sortedDates[0]);
    const endDate = new Date(sortedDates[sortedDates.length - 1]);
    const currentDate = new Date(date);
    
    return currentDate > startDate && currentDate < endDate;
  };

  // Memoize expensive calendar calculations
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const date = new Date(year, month - 1, day);
      days.push({
        day,
        date: formatDate(date),
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      days.push({
        day,
        date: formatDate(date),
        isCurrentMonth: true,
        isToday
      });
    }

    // Next month days to fill the grid
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        day,
        date: formatDate(date),
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  }, [currentDate]);

  // Memoize time slots generation
  const timeSlots = useMemo(() => {
    const slots = [];
    
    // Generate all 12 hours with 30-minute increments
    // Start with 12:00, 12:30
    slots.push('12:00');
    slots.push('12:30');
    
    // Then 1:00 through 11:30
    for (let hour = 1; hour <= 11; hour++) {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    
    return slots;
  }, []);

  const handleDateClick = (date: string) => {
    if (isMultiSelect) {
      if (selectedDates.length === 0) {
        // First date selection
        onDateSelect([date]);
      } else if (selectedDates.length === 1) {
        // If clicking the same date, deselect it
        if (selectedDates[0] === date) {
          onDateSelect([]);
        } else {
          // Second date selection - create range
          const sortedDates = [selectedDates[0], date].sort();
          onDateSelect(sortedDates);
        }
      } else {
        // Reset and start new selection with clicked date
        onDateSelect([date]);
      }
    } else {
      // For single select, toggle the date
      if (selectedDates.includes(date)) {
        onDateSelect([]);
      } else {
        onDateSelect([date]);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleTimeSelection = (timeSlot: string) => {
    if (onTimeSelect) {
      const period = isAM ? 'AM' : 'PM';
      const fullTime = `${timeSlot} ${period}`;
      
      // If clicking the same time that's already selected as start, clear it
      if (selectedStartTime === fullTime) {
        onTimeSelect('', selectedEndTime || '');
        return;
      }
      
      // If clicking the same time that's already selected as end, clear it
      if (selectedEndTime === fullTime) {
        onTimeSelect(selectedStartTime || '', '');
        return;
      }
      
      // If no start time is selected, this becomes the start time
      if (!selectedStartTime) {
        onTimeSelect(fullTime, '');
      }
      // If start time is selected but no end time, this becomes the end time
      else if (!selectedEndTime) {
        onTimeSelect(selectedStartTime, fullTime);
      }
      // If both are selected, clear both and set this as new start time
      else {
        onTimeSelect(fullTime, '');
      }
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <Flex 
      direction={{ base: "column", lg: "row" }} 
      align="flex-start"
      gap={{ base: 4, lg: 4 }}
      w="100%"
      justify="space-between"
    >
      {/* Date Selection Card */}
      <Card 
        variant="outline" 
        shadow="none" 
        bg={bgColor} 
        borderColor={borderColor} 
        h="520px" 
        w="100%"
        flex="1"
        minW="0"
        maxW={{ base: "100%", lg: "none" }}
      >
        <CardBody p={{ base: 4, lg: 6 }} display="flex" flexDirection="column">
          <VStack spacing={4} align="stretch" w="100%" flex="1" minW="0">
            {/* Month Navigation */}
            <HStack justify="center" align="center" spacing={4}>
              <IconButton
                aria-label="Previous month"
                icon={<ChevronUpIcon />}
                size="sm"
                variant="ghost"
                onClick={() => navigateMonth('prev')}
              />
              <Text fontWeight="bold" minW="160px" textAlign="center" fontSize={{ base: "sm", lg: "md" }}>
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <IconButton
                aria-label="Next month"
                icon={<ChevronDownIcon />}
                size="sm"
                variant="ghost"
                onClick={() => navigateMonth('next')}
              />
            </HStack>

            {/* Week Days Header */}
            <Grid templateColumns="repeat(7, 1fr)" gap={1} w="100%">
              {weekDays.map(day => (
                <GridItem key={day} p={1} textAlign="center">
                  <Text fontSize="xs" fontWeight="bold" color={mutedTextColor}>
                    {day}
                  </Text>
                </GridItem>
              ))}
            </Grid>

            {/* Calendar Grid */}
            <Grid templateColumns="repeat(7, 1fr)" gap={1} w="100%">
              {daysInMonth.map((dayObj, index) => {
                const isSelected = isDateSelected(dayObj.date);
                const isInRange = isDateInRange(dayObj.date);
                const isRangeStart = selectedDates.length >= 2 && dayObj.date === selectedDates.sort()[0];
                const isRangeEnd = selectedDates.length >= 2 && dayObj.date === selectedDates.sort()[selectedDates.length - 1];
                
                return (
                  <GridItem key={index}>
                    <Button
                      size="sm"
                      variant={isSelected ? "solid" : "ghost"}
                      colorScheme={isSelected ? "blue" : undefined}
                      w="100%"
                      h={{ base: "32px", lg: "40px" }}
                      fontSize={{ base: "xs", lg: "sm" }}
                      opacity={dayObj.isCurrentMonth ? 1 : 0.5}
                      bg={
                        isSelected 
                          ? selectedBg 
                          : isInRange 
                            ? inRangeBg
                            : undefined
                      }
                      color={
                        isSelected 
                          ? selectedColor 
                          : isInRange 
                            ? inRangeColor
                            : dayObj.isCurrentMonth ? textColor : mutedTextColor
                      }
                      onClick={() => handleDateClick(dayObj.date)}
                      position="relative"
                      borderRadius={
                        isInRange && !isSelected
                          ? "0"
                          : isRangeStart && isMultiSelect
                            ? "md 0 0 md"
                            : isRangeEnd && isMultiSelect
                              ? "0 md md 0"
                              : "md"
                      }
                      _hover={{
                        bg: isSelected ? selectedBg : isInRange ? inRangeHoverBg : timeHoverBg
                      }}
                    >
                      {dayObj.day}
                      {dayObj.isToday && (
                        <Box
                          position="absolute"
                          bottom="2px"
                          left="50%"
                          transform="translateX(-50%)"
                          w="4px"
                          h="4px"
                          bg="orange.400"
                          borderRadius="full"
                        />
                      )}
                    </Button>
                  </GridItem>
                );
              })}
            </Grid>
          </VStack>

          {/* Date Selection Footer */}
          <Box 
            mx={{ base: -4, lg: -6 }}
            mb={{ base: -4, lg: -6 }}
            mt={4} 
            p={{ base: 4, lg: 6 }}
            pt={4}
            bg={bgColor}
            borderTop="1px solid"
            borderColor={borderColor}
            w="auto"
          >
            {selectedDates.length > 0 ? (
              <>
                <Text fontSize="sm" color={textColor} fontWeight="semibold">
                  Selected Dates ({selectedDates.length}):
                </Text>
                <Text fontSize="xs" color={mutedTextColor} mt={1} noOfLines={2}>
                  {selectedDates.map(date => {
                    // Parse date string manually to avoid timezone conversion
                    const [year, month, day] = date.split('-');
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
                  }).join(' ')}
                </Text>
              </>
            ) : (
              <Text fontSize="sm" color={mutedTextColor}>
                No dates selected
              </Text>
            )}
          </Box>
        </CardBody>
      </Card>

      {/* Time Selection Card */}
      <Card 
        variant="outline" 
        shadow="none" 
        bg={bgColor} 
        borderColor={borderColor} 
        h="520px" 
        w="100%"
        flex="1"
        minW="0"
        maxW={{ base: "100%", lg: "none" }}
      >
        <CardBody p={{ base: 4, lg: 6 }} display="flex" flexDirection="column">
          <VStack spacing={4} align="stretch" w="100%" flex="1" minW="0">
            {/* AM/PM Toggle */}
            <HStack justify="center" spacing={4}>
              <IconButton
                aria-label="Previous period"
                icon={<ChevronLeftIcon />}
                size="sm"
                variant="ghost"
                onClick={() => setIsAM(!isAM)}
              />
              <Text fontWeight="bold" fontSize="lg" minW="40px" textAlign="center">
                {isAM ? 'AM' : 'PM'}
              </Text>
              <IconButton
                aria-label="Next period"
                icon={<ChevronRightIcon />}
                size="sm"
                variant="ghost"
                onClick={() => setIsAM(!isAM)}
              />
            </HStack>

            {/* Time Grid */}
            <Grid templateColumns={{ base: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={2} w="100%">
              {timeSlots.map((timeSlot, index) => {
                const fullTimeAM = `${timeSlot} AM`;
                const fullTimePM = `${timeSlot} PM`;
                const currentFullTime = `${timeSlot} ${isAM ? 'AM' : 'PM'}`;
                const isStartSelected = selectedStartTime === currentFullTime;
                const isEndSelected = selectedEndTime === currentFullTime;
                const isSelected = isStartSelected || isEndSelected;
                
                return (
                  <GridItem key={index}>
                    <Button
                      size="sm"
                      variant={isSelected ? "solid" : "outline"}
                      colorScheme={isStartSelected ? "blue" : isEndSelected ? "green" : "gray"}
                      w="100%"
                      fontSize={{ base: "xs", lg: "sm" }}
                      onClick={() => handleTimeSelection(timeSlot)}
                      _hover={{
                        bg: isSelected ? undefined : timeBg
                      }}
                    >
                      {timeSlot}
                    </Button>
                  </GridItem>
                );
              })}
            </Grid>
          </VStack>

          {/* Time Selection Footer */}
          <Box 
            mx={{ base: -4, lg: -6 }}
            mb={{ base: -4, lg: -6 }}
            mt={4} 
            p={{ base: 4, lg: 6 }}
            pt={4}
            bg={bgColor}
            borderTop="1px solid"
            borderColor={borderColor}
            w="auto"
          >
            {(selectedStartTime || selectedEndTime) ? (
              <>
                <Text fontSize="sm" color={textColor} fontWeight="semibold" mb={1}>
                  Selected Time:
                </Text>
                <VStack spacing={1} align="start">
                  {selectedStartTime && (
                    <Text fontSize="xs" color={mutedTextColor}>
                      Start: {selectedStartTime}
                    </Text>
                  )}
                  {selectedEndTime && (
                    <Text fontSize="xs" color={mutedTextColor}>
                      End: {selectedEndTime}
                    </Text>
                  )}
                </VStack>
              </>
            ) : (
              <Text fontSize="sm" color={mutedTextColor}>
                No time selected
              </Text>
            )}
          </Box>
        </CardBody>
      </Card>
    </Flex>
  );
}; 