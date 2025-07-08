import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  useColorModeValue,
  useToast,
  Card,
  CardBody,
  Badge,
  SimpleGrid,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Heading,
  Flex,
} from '@chakra-ui/react';
import { Calendar, Copy, MoreVertical, Power, PowerOff } from 'lucide-react';

interface WorkoutBlock {
  id: string;
  name: string;
  category: 'warmup' | 'main' | 'accessory' | 'conditioning' | 'cooldown' | 'custom';
  flow: 'sequential' | 'circuit' | 'superset' | 'emom' | 'amrap';
  exercises: any[];
  restBetweenExercises: number;
  rounds?: number;
  timeLimit?: number;
  description?: string;
}

interface WeeklyDaySelectorProps {
  currentDay: string;
  onDaySelect: (day: string) => void;
  dailyBlocks: Record<string, WorkoutBlock[]>;
  restDays: Record<string, boolean>;
  onToggleRestDay: (day: string) => void;
  onCopyDay: (fromDay: string, toDay: string) => void;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
];

const WeeklyDaySelector: React.FC<WeeklyDaySelectorProps> = ({
  currentDay,
  onDaySelect,
  dailyBlocks,
  restDays,
  onToggleRestDay,
  onCopyDay
}) => {
  const [copyFromDay, setCopyFromDay] = useState<string>('');
  const toast = useToast();

  // Theme colors
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getDayStatus = (day: string) => {
    if (restDays[day]) return 'rest';
    const blockCount = dailyBlocks[day]?.length || 0;
    if (blockCount === 0) return 'empty';
    return 'active';
  };

  const getDayBadgeColor = (day: string) => {
    const status = getDayStatus(day);
    switch (status) {
      case 'rest': return 'orange';
      case 'active': return 'green';
      case 'empty': return 'gray';
      default: return 'gray';
    }
  };

  const getDayBadgeText = (day: string) => {
    if (restDays[day]) return 'REST';
    const blockCount = dailyBlocks[day]?.length || 0;
    if (blockCount === 0) return 'EMPTY';
    return `${blockCount} BLOCK${blockCount !== 1 ? 'S' : ''}`;
  };

  const handleCopyFromTo = (fromDay: string, toDay: string) => {
    if (fromDay === toDay) {
      toast({
        title: 'Cannot copy to same day',
        status: 'warning',
        duration: 2000,
      });
      return;
    }
    
    onCopyDay(fromDay, toDay);
    setCopyFromDay('');
  };

  const getOtherDaysWithBlocks = (excludeDay: string) => {
    return DAYS_OF_WEEK.filter(day => 
      day.value !== excludeDay && 
      !restDays[day.value] && 
      (dailyBlocks[day.value]?.length || 0) > 0
    );
  };

  return (
    <Card variant="outline" bg={cardBg} borderColor={borderColor}>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Calendar size={24} color="var(--chakra-colors-blue-500)" />
              <Heading size="md" color={textColor}>Week Planning</Heading>
            </HStack>
            <Badge colorScheme="blue" variant="outline" px={3} py={1}>
              Currently: {DAYS_OF_WEEK.find(d => d.value === currentDay)?.label}
            </Badge>
          </HStack>

          {/* Day Selector Grid */}
          <SimpleGrid columns={{ base: 2, md: 4, lg: 7 }} spacing={3}>
            {DAYS_OF_WEEK.map((day) => {
              const isActive = currentDay === day.value;
              const isRest = restDays[day.value];
              const blockCount = dailyBlocks[day.value]?.length || 0;
              
              return (
                <Box key={day.value} position="relative">
                  <Button
                    variant={isActive ? 'solid' : 'outline'}
                    colorScheme={isActive ? 'blue' : 'gray'}
                    onClick={() => onDaySelect(day.value)}
                    width="100%"
                    height="auto"
                    flexDirection="column"
                    py={3}
                    opacity={isRest ? 0.7 : 1}
                    disabled={isRest}
                  >
                    <Text fontSize="sm" fontWeight="bold">
                      {day.short}
                    </Text>
                    <Badge
                      size="sm"
                      colorScheme={getDayBadgeColor(day.value)}
                      variant="solid"
                      mt={1}
                    >
                      {getDayBadgeText(day.value)}
                    </Badge>
                  </Button>

                  {/* Day Menu */}
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<MoreVertical size={12} />}
                      size="xs"
                      variant="ghost"
                      position="absolute"
                      top={1}
                      right={1}
                      minW="auto"
                      h="auto"
                      p={1}
                    />
                    <MenuList fontSize="sm">
                      <MenuItem
                        icon={isRest ? <Power size={14} /> : <PowerOff size={14} />}
                        onClick={() => onToggleRestDay(day.value)}
                      >
                        {isRest ? 'Mark as Training Day' : 'Mark as Rest Day'}
                      </MenuItem>
                      
                      {!isRest && getOtherDaysWithBlocks(day.value).length > 0 && (
                        <>
                          <Divider />
                          <Text px={3} py={1} fontSize="xs" color="gray.500" fontWeight="bold">
                            Copy blocks from:
                          </Text>
                          {getOtherDaysWithBlocks(day.value).map(otherDay => (
                            <MenuItem
                              key={otherDay.value}
                              icon={<Copy size={14} />}
                              onClick={() => handleCopyFromTo(otherDay.value, day.value)}
                            >
                              {otherDay.label} ({dailyBlocks[otherDay.value]?.length || 0} blocks)
                            </MenuItem>
                          ))}
                        </>
                      )}
                    </MenuList>
                  </Menu>
                </Box>
              );
            })}
          </SimpleGrid>

          {/* Current Day Info */}
          <Box>
            <Flex justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="medium" color={textColor}>
                {DAYS_OF_WEEK.find(d => d.value === currentDay)?.label} Workout
              </Text>
              {restDays[currentDay] && (
                <Badge colorScheme="orange" variant="solid">
                  Rest Day - No training blocks
                </Badge>
              )}
            </Flex>
            
            {!restDays[currentDay] && (
              <Text fontSize="sm" color={subtitleColor} mt={1}>
                {(dailyBlocks[currentDay]?.length || 0) === 0 
                  ? 'Add blocks to build your workout for this day'
                  : `${dailyBlocks[currentDay]?.length} training block(s) configured`
                }
              </Text>
            )}
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default WeeklyDaySelector; 