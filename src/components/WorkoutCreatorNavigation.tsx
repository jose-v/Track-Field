import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  useColorModeValue,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Tooltip,
  HStack,
  Button,
  Progress,
  VStack,
  Badge
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfileDisplay } from '../hooks/useProfileDisplay';
import { LuMessageSquare, LuMenu, LuBellRing } from 'react-icons/lu';
import { useFeedback } from './FeedbackProvider';
import { ShareComponent } from './ShareComponent';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { useUnreadNotificationCount } from '../hooks/useUnreadNotificationCount';

interface WorkoutCreatorNavigationProps {
  // Progress bar props
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: number;
    title: string;
    shortTitle: string;
    description: string;
  }>;
  onStepClick: (stepId: number) => void;
  sidebarWidth: number;
}

const WorkoutCreatorNavigation: React.FC<WorkoutCreatorNavigationProps> = ({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
  sidebarWidth
}) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile: displayProfile } = useProfileDisplay();
  const { showFeedbackModal } = useFeedback();
  const { isHeaderVisible } = useScrollDirection(15);

  // Theme-aware colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const menuTextColor = useColorModeValue('gray.700', 'gray.100');
  const menuItemHoverBg = useColorModeValue('blue.50', 'blue.700');
  const menuItemHoverColor = useColorModeValue('blue.500', 'blue.300');

  // State for notifications
  const { unreadCount } = useUnreadNotificationCount();
  
  // Handle viewing notifications
  const handleViewNotifications = () => {
    let notificationsPath = '/athlete/notifications'; // default
    
    if (displayProfile?.role === 'coach') {
      notificationsPath = '/coach/notifications';
    } else if (displayProfile?.role === 'team_manager') {
      notificationsPath = '/team-manager/notifications';
    }
    
    window.location.href = notificationsPath;
  };

  // Calculate progress percentage
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Icon styles
  const iconStyle = {
    color: useColorModeValue('gray.600', 'gray.400'),
    _hover: {
      color: 'blue.500',
    }
  };

  // Notification badge props
  const notificationBadgeProps = {
    position: 'absolute' as const,
    top: '-6px',
    right: '-6px',
    minWidth: '18px',
    height: '18px',
    borderRadius: 'full',
    bg: 'red.500',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid',
    borderColor: useColorModeValue('white', 'gray.800'),
  };

  // Only render on workout creator routes
  const isWorkoutCreatorRoute = location.pathname.includes('/workout-creator');
  
  if (!isWorkoutCreatorRoute) {
    return null;
  }

  return (
    <>
      {/* Simplified Navigation Bar - hides on scroll */}
      <Box
        position="fixed"
        top={isHeaderVisible ? "0" : "-64px"}
        left={`${sidebarWidth}px`}
        right="0"
        zIndex={1000}
        transition="top 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        transform="translateZ(0)"
        display={{ base: 'none', md: 'block' }}
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        py={3}
        px={6}
      >
        <Flex justify="space-between" align="center">
          {/* Left side - Empty for now */}
          <Box />
          
          {/* Right side - action icons and user menu */}
          <Flex align="center" gap={4}>
            {/* Feedback Button */}
            <Tooltip label="Give Feedback" hasArrow>
              <IconButton
                aria-label="Give Feedback"
                variant="ghost"
                size="sm"
                sx={{
                  ...iconStyle,
                  _focus: { boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
                  _active: { boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
                  _hover: { ...iconStyle._hover, boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
                }}
                onClick={showFeedbackModal}
                onFocus={e => e.preventDefault()}
              >
                <LuMessageSquare size="18px" />
              </IconButton>
            </Tooltip>
            
            {/* Share Button */}
            <ShareComponent 
              title="Track & Field Workout Creator"
              description="Create and manage workouts with our workout creator tool"
              iconStyle={{
                ...iconStyle,
                _focus: { boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
                _active: { boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
                _hover: { ...iconStyle._hover, boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
              }} 
            />
            
            {/* Notification Bell */}
            <Box position="relative">
              <Tooltip label="Notifications" hasArrow>
                <IconButton
                  aria-label="Notifications"
                  variant="ghost"
                  size="sm"
                  sx={{
                    ...iconStyle,
                    _focus: { boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
                    _active: { boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
                    _hover: { ...iconStyle._hover, boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
                  }}
                  onClick={handleViewNotifications}
                  onFocus={e => e.preventDefault()}
                >
                  <LuBellRing size="18px" />
                </IconButton>
              </Tooltip>
              
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <Badge {...notificationBadgeProps}>
                  {unreadCount}
                </Badge>
              )}
            </Box>
            
            {/* User Menu */}
            <Menu>
              <MenuButton
                as={Button}
                rounded="full"
                variant="unstyled"
                cursor="pointer"
                minW={0}
                border="none"
                borderWidth="0px"
                _focus={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' }}
                _hover={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' }}
                _active={{ boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' }}
              >
                <LuMenu size="18px" color="gray.600" />
              </MenuButton>
              <MenuList zIndex={9999}>
                <MenuItem as={RouterLink} 
                  to={
                    displayProfile?.role === 'coach' ? '/coach/profile' : 
                    displayProfile?.role === 'athlete' ? '/athlete/profile' : 
                    displayProfile?.role === 'team_manager' ? '/team-manager/profile' : '/profile'
                  }
                  color={menuTextColor}
                  _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                  _focus={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                >
                  My Profile
                </MenuItem>
                <MenuItem onClick={() => window.location.href = '/account'}
                  color={menuTextColor}
                  _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                  _focus={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                >
                  Account & Billing
                </MenuItem>
                <MenuItem as={RouterLink} 
                  to={
                    displayProfile?.role === 'coach' ? '/coach/settings' : 
                    displayProfile?.role === 'athlete' ? '/athlete/settings' : 
                    displayProfile?.role === 'team_manager' ? '/team-manager/settings' : '/settings'
                  }
                  color={menuTextColor}
                  _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                  _focus={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                >
                  Settings
                </MenuItem>
                <MenuItem onClick={showFeedbackModal}
                  color={menuTextColor}
                  _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                  _focus={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                >
                  Give Feedback
                </MenuItem>
                <MenuItem onClick={signOut}
                  color={menuTextColor}
                  _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                  _focus={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                >
                  Sign out
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>
      </Box>

      {/* Progress Bar - always sticky at top */}
      <Box
        position="fixed"
        top={isHeaderVisible ? "64px" : "0"}
        left={`${sidebarWidth}px`}
        right="0"
        zIndex={999}
        transition="top 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        transform="translateZ(0)"
        display={{ base: 'none', md: 'block' }}
        bg={bgColor}
        borderBottom="1px solid"
        borderBottomColor={borderColor}
      >
        <Progress 
          value={progressPercentage} 
          colorScheme="blue" 
          size="md" 
          borderRadius="0"
          height="8px"
        />
        
        {/* Step Labels */}
        <Box px={8} py={2}>
          <HStack justify="space-between" spacing={2}>
            {steps.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isAccessible = step.id <= currentStep;
              
              return (
                <Button
                  key={step.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => isAccessible && onStepClick(step.id)}
                  isDisabled={!isAccessible}
                  color={isCurrent ? 'blue.500' : isCompleted ? 'green.500' : 'gray.500'}
                  fontWeight={isCurrent ? 'bold' : 'normal'}
                  _hover={isAccessible ? { bg: 'blue.100' } : {}}
                  cursor={isAccessible ? 'pointer' : 'default'}
                  flex="1"
                  minW="0"
                >
                  <HStack spacing={1} minW="0">
                    <Text fontSize="xs">{step.id}</Text>
                    <Text fontSize="xs" isTruncated>{step.shortTitle}</Text>
                    {isCompleted && <Text fontSize="xs" color="green.500">✓</Text>}
                    {index < steps.length - 1 && (
                      <Text fontSize="xs" color="gray.400">→</Text>
                    )}
                  </HStack>
                </Button>
              );
            })}
          </HStack>
        </Box>
      </Box>
    </>
  );
};

export default WorkoutCreatorNavigation; 