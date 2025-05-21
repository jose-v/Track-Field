import React, { useState, useEffect } from 'react';
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
  Badge,
  Tooltip,
  HStack,
  Button
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { LuBellRing, LuMessageCircleMore } from 'react-icons/lu';
import { useFeedback } from './FeedbackProvider';
import { ShareComponent } from './ShareComponent';

interface SimplifiedNavProps {
  roleTitle: string;
  roleBadge: {
    text: string;
    colorScheme: string;
  };
  notificationsPath: string;
  storageKey: string;
  shareTitle: string;
  shareDescription: string;
}

const SimplifiedNav: React.FC<SimplifiedNavProps> = ({
  roleTitle,
  roleBadge,
  notificationsPath,
  storageKey,
  shareTitle,
  shareDescription
}) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { showFeedbackModal } = useFeedback();
  
  // Background colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // State for notifications
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Icon styles
  const iconStyle = {
    color: useColorModeValue('gray.600', 'gray.400'),
    _hover: {
      color: 'blue.500',
    }
  };
  
  // Badge styles
  const badgeProps = {
    pos: 'absolute' as const,
    top: '-2px',
    right: '-2px',
    fontSize: 'xs',
    size: 'sm',
    colorScheme: 'red',
    borderRadius: 'full',
    variant: 'solid'
  };
  
  // Get notifications from localStorage
  useEffect(() => {
    if (user) {
      const storedCount = localStorage.getItem(storageKey);
      if (storedCount) {
        setNotificationCount(parseInt(storedCount, 10));
      } else {
        // Default notifications
        const defaultCount = 3;
        setNotificationCount(defaultCount);
        localStorage.setItem(storageKey, defaultCount.toString());
      }
    }
  }, [storageKey, user]);
  
  // Handle viewing notifications
  const handleViewNotifications = () => {
    window.location.href = notificationsPath;
    setNotificationCount(0);
    localStorage.setItem(storageKey, '0');
  };
  
  // Avatar details
  const avatarUrl = profile?.avatar_url;
  const fullName = profile ? 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
    (user?.email || '');
  
  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      position="fixed"
      w="calc(100% - 200px)"
      right="0"
      top="0"
      zIndex={10}
      py={3}
      px={6}
    >
      <Flex justify="space-between" align="center">
        {/* Left side - App title & role badge (removed) */}
        <Box />
        {/* Right side - action icons */}
        <Flex align="center" gap={4}>
          {/* Feedback Button */}
          <Tooltip label="Give Feedback" hasArrow>
            <IconButton
              icon={<LuMessageCircleMore size="20px" />}
              aria-label="Give Feedback"
              variant="ghost"
              size="sm"
              sx={iconStyle}
              onClick={showFeedbackModal}
            />
          </Tooltip>
          {/* Share Button */}
          <ShareComponent 
            title={shareTitle} 
            description={shareDescription} 
            iconStyle={iconStyle}
          />
          {/* Notification Bell */}
          <Box position="relative">
            <Tooltip label={`${roleTitle} notifications`} hasArrow>
              <IconButton
                icon={<LuBellRing size="20px" />}
                aria-label="Notifications"
                variant="ghost"
                size="sm"
                sx={iconStyle}
                onClick={handleViewNotifications}
              />
            </Tooltip>
            {/* Notification Badge */}
            {notificationCount > 0 && (
              <Badge {...badgeProps}>
                {notificationCount}
              </Badge>
            )}
          </Box>
          {/* User Menu */}
          <Menu>
            <MenuButton as={Button} rounded="full" variant="unstyled" cursor="pointer" minW={0}>
              <Avatar size="sm" name={fullName} src={avatarUrl} />
            </MenuButton>
            <MenuList>
              <MenuItem as={RouterLink} to="/profile">My Profile</MenuItem>
              <MenuItem as={RouterLink} to="/settings">Settings</MenuItem>
              <MenuItem onClick={showFeedbackModal}>Give Feedback</MenuItem>
              <MenuItem onClick={signOut}>Sign out</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
    </Box>
  );
};

export default SimplifiedNav; 