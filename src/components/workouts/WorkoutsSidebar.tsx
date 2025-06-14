import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Flex,
  Icon,
  useColorModeValue,
  Divider,
  Button,
  Badge,
  HStack
} from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { 
  FaCalendarAlt, 
  FaDumbbell, 
  FaRunning, 
  FaListUl, 
  FaFilter, 
  FaCog, 
  FaPlus,
  FaCalendarWeek,
  FaCalendarDay,
  FaClock,
  FaChartLine,
  FaBookOpen,
  FaHistory
} from 'react-icons/fa';
import { useScrollDirection } from '../../hooks/useScrollDirection';

export interface WorkoutsSection {
  id: string;
  title: string;
  items: WorkoutsItem[];
}

export interface WorkoutsItem {
  id: string;
  label: string;
  icon: IconType;
  description?: string;
  badge?: string | number;
  action?: () => void;
}

interface WorkoutsSidebarProps {
  sections: WorkoutsSection[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
  createWorkoutAction?: () => void;
  additionalActions?: {
    label: string;
    icon: IconType;
    action: () => void;
    colorScheme?: string;
    variant?: string;
  }[];
  workoutCounts?: {
    today: number;
    thisWeek: number;
    total: number;
    completed: number;
  };
}

const WorkoutsSidebar: React.FC<WorkoutsSidebarProps> = ({
  sections,
  activeItem,
  onItemClick,
  createWorkoutAction,
  additionalActions,
  workoutCounts
}) => {
  const [mainSidebarWidth, setMainSidebarWidth] = useState(() => {
    // Check localStorage for the saved main sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });

  const { isHeaderVisible } = useScrollDirection(15);

  // Listen for main sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      const newWidth = event.detail.width;
      setMainSidebarWidth(newWidth);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sectionTitleColor = useColorModeValue('gray.500', 'gray.400');
  const itemColor = useColorModeValue('gray.700', 'white');
  const itemHoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeItemBg = useColorModeValue('blue.50', 'blue.900');
  const activeItemColor = useColorModeValue('blue.600', 'white');
  const activeItemBorderColor = useColorModeValue('blue.500', 'blue.300');
  const createButtonBg = useColorModeValue('blue.500', 'blue.600');
  const createButtonHoverBg = useColorModeValue('blue.600', 'blue.500');

  return (
    <Box
      w="280px"
      h={`calc(100vh - ${isHeaderVisible ? '58px' : '0px'})`}
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      position="fixed"
      left={`${mainSidebarWidth}px`}
      top={isHeaderVisible ? "58px" : "-22px"}
      overflowY="auto"
      pt={6}
      pb={6}
      px={4}
      display={{ base: 'none', lg: 'block' }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex={998} // Below main sidebar (1000) and SimplifiedNav (999) but above content
    >
      <VStack spacing={4} align="stretch">
        {/* Create Workout Links */}
        {createWorkoutAction && (
          <VStack spacing={1} align="stretch">
            <Flex
              align="center"
              px={3}
              py={2}
              borderRadius="md"
              cursor="pointer"
              bg="transparent"
              color={itemColor}
              transition="all 0.2s"
              _hover={{
                bg: itemHoverBg,
                color: itemColor,
              }}
              onClick={createWorkoutAction}
            >
              <Icon
                as={FaPlus}
                fontSize="md"
                mr={3}
                color={itemColor}
              />
              <Text fontSize="sm" fontWeight="medium">
                Create Workout
              </Text>
            </Flex>
            
            {/* Additional Action Links */}
            {additionalActions && additionalActions.map((action, index) => (
              <Flex
                key={index}
                align="center"
                px={3}
                py={2}
                borderRadius="md"
                cursor="pointer"
                bg="transparent"
                color={itemColor}
                transition="all 0.2s"
                _hover={{
                  bg: itemHoverBg,
                  color: itemColor,
                }}
                onClick={action.action}
              >
                <Icon
                  as={action.icon}
                  fontSize="md"
                  mr={3}
                  color={itemColor}
                />
                <Text fontSize="sm" fontWeight="medium">
                  {action.label}
                </Text>
              </Flex>
            ))}
          </VStack>
        )}

        {/* Workout Stats Summary */}
        {workoutCounts && (
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color={sectionTitleColor}
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
              px={3}
            >
              Quick Stats
            </Text>
            <VStack spacing={1} align="stretch">
              <HStack justify="space-between" px={3} py={1.5} borderRadius="md" bg={itemHoverBg}>
                <Text fontSize="sm" color={itemColor}>Today</Text>
                <Badge colorScheme="blue" variant="subtle">{workoutCounts.today}</Badge>
              </HStack>
              <HStack justify="space-between" px={3} py={1.5} borderRadius="md" bg={itemHoverBg}>
                <Text fontSize="sm" color={itemColor}>This Week</Text>
                <Badge colorScheme="green" variant="subtle">{workoutCounts.thisWeek}</Badge>
              </HStack>
              <HStack justify="space-between" px={3} py={1.5} borderRadius="md" bg={itemHoverBg}>
                <Text fontSize="sm" color={itemColor}>Completed</Text>
                <Badge colorScheme="purple" variant="subtle">{workoutCounts.completed}</Badge>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Sections */}
        {sections.map((section, sectionIndex) => (
          <Box key={section.id}>
            {/* Section Title */}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color={sectionTitleColor}
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
              px={3}
            >
              {section.title}
            </Text>
            
            {/* Section Items */}
            <VStack spacing={0.5} align="stretch">
              {section.items.map((item) => {
                const isActive = activeItem === item.id;
                
                return (
                  <Flex
                    key={item.id}
                    align="center"
                    px={3}
                    py={2}
                    borderRadius="md"
                    cursor="pointer"
                    bg={isActive ? activeItemBg : 'transparent'}
                    color={isActive ? activeItemColor : itemColor}
                    borderLeft="3px solid"
                    borderLeftColor={isActive ? activeItemBorderColor : 'transparent'}
                    transition="all 0.2s"
                    _hover={{
                      bg: isActive ? activeItemBg : itemHoverBg,
                      color: isActive ? activeItemColor : itemColor,
                    }}
                    onClick={() => item.action ? item.action() : onItemClick(item.id)}
                  >
                    <Box flex="1">
                      <HStack justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight={isActive ? 'semibold' : 'medium'}>
                          {item.label}
                        </Text>
                        {item.badge && (
                          <Badge 
                            size="sm" 
                            colorScheme={isActive ? 'blue' : 'gray'} 
                            variant="subtle"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </HStack>
                      {item.description && (
                        <Text fontSize="xs" color={sectionTitleColor} mt={0.5}>
                          {item.description}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                );
              })}
            </VStack>
            
            {/* Divider between sections (except last) */}
            {sectionIndex < sections.length - 1 && (
              <Divider mt={3} borderColor={borderColor} />
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default WorkoutsSidebar; 