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
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfileDisplay } from '../hooks/useProfileDisplay';
import { LuBellRing, LuMessageSquare, LuMenu } from 'react-icons/lu';
import { useFeedback } from './FeedbackProvider';
import { ShareComponent } from './ShareComponent';
import { useScrollDirection } from '../hooks/useScrollDirection';

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
  isPublicPage: boolean;
  onOpen: () => void;
}

const SimplifiedNav: React.FC<SimplifiedNavProps> = ({
  roleTitle,
  roleBadge,
  notificationsPath,
  storageKey,
  shareTitle,
  shareDescription,
  isPublicPage,
  onOpen
}) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile: displayProfile, displayName, initials } = useProfileDisplay();
  const { showFeedbackModal } = useFeedback();
  const { isHeaderVisible } = useScrollDirection(15);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Check localStorage for the saved sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });
  
  // Background colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Menu styling to match public pages
  const menuTextColor = useColorModeValue('gray.700', 'gray.100');
  const menuItemHoverBg = useColorModeValue('blue.50', 'blue.700');
  const menuItemHoverColor = useColorModeValue('blue.500', 'blue.300');
  
  // State for notifications
  const [notificationCount, setNotificationCount] = useState(0);

  // Don't render on workout creator routes - those use the unified navigation
  const isWorkoutCreatorRoute = location.pathname.includes('/workout-creator');
  
  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setSidebarWidth(event.detail.width);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);
  
  // Icon styles - standardized for all 3 icons
  const iconStyle = {
    color: useColorModeValue('gray.600', 'gray.400'),
    _hover: {
      color: 'blue.500',
    },
    // Ensure consistent sizing and remove any borders
    width: '32px',
    height: '32px',
    borderRadius: 'md',
    _focus: { boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
    _active: { boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
  };
  
  // Badge styles
  const badgeProps = {
    pos: 'absolute' as const,
    top: '-2px',
    right: '-2px',
    fontSize: 'xs',
    colorScheme: 'red',
    variant: 'solid',
    minWidth: '18px',
    height: '18px',
    borderRadius: 'full',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    lineHeight: '1'
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
  
  // Avatar details - now using lightweight profile data
  const avatarUrl = displayProfile?.avatar_url;
  const fullName = displayProfile ? displayName : (user?.email || '');

  // Return null after all hooks are called
  if (isWorkoutCreatorRoute) {
    return null;
  }

  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      position="fixed"
      w={`calc(100% - ${sidebarWidth}px)`}
      right="0"
      top={isHeaderVisible ? "0" : "-80px"}
      zIndex={999}
      py={3}
      px={6}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      transform="translateZ(0)"
      display={{ base: 'none', md: 'block' }}
    >
      <Flex justify="space-between" align="center">
        {/* Left side - App title & role badge (removed) */}
        <Box />
        {/* Right side - action icons and user menu (no avatar for portals) */}
        <Flex align="center" gap={3}>
          {/* Feedback Button */}
          <Tooltip label="Give Feedback" hasArrow>
            <IconButton
              aria-label="Give Feedback"
              variant="ghost"
              size="sm"
              sx={iconStyle}
              onClick={showFeedbackModal}
              onFocus={e => e.preventDefault()}
            >
              <LuMessageSquare size="18px" />
            </IconButton>
          </Tooltip>
          {/* Share Button */}
          <ShareComponent 
            title={shareTitle} 
            description={shareDescription} 
            iconStyle={{
              ...iconStyle,
              variant: 'ghost',
              size: 'sm'
            }} 
          />
          {/* Notifications Button */}
          <Box position="relative">
            <Tooltip label="Notifications" hasArrow>
              <IconButton
                aria-label="Notifications"
                variant="ghost"
                size="sm"
                sx={iconStyle}
                onClick={handleViewNotifications}
                onFocus={e => e.preventDefault()}
              >
                <LuBellRing size="18px" />
              </IconButton>
            </Tooltip>
            {/* Notification Badge */}
            {notificationCount > 0 && (
              <Badge {...badgeProps}>
                {notificationCount}
              </Badge>
            )}
          </Box>
          {/* Only show avatar on public pages */}
          {isPublicPage && (
            <Avatar
              size="sm"
              name={user?.user_metadata?.full_name}
              src={user?.user_metadata?.avatar_url}
              ml={2}
              cursor="pointer"
              onClick={onOpen}
            />
          )}
          {/* Inline user menu for portals */}
          {!isPublicPage && (
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Open Menu"
                variant="ghost"
                size="sm"
                sx={iconStyle}
                icon={<LuMenu size="18px" />}
              />
              <MenuList zIndex={9999}>
                <MenuItem as={RouterLink} 
                  to={
                    displayProfile?.role === 'coach' ? '/coach/profile' : 
                    displayProfile?.role === 'athlete' ? '/athlete/profile' : 
                    displayProfile?.role === 'team_manager' ? '/team-manager/account' : '/profile'
                  }
                  color={menuTextColor}
                  _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                  _focus={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                >
                  My Profile
                </MenuItem>
                <MenuItem as={RouterLink} to="/account"
                  color={menuTextColor}
                  _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                  _focus={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                >
                  Account & Billing
                </MenuItem>
                <MenuItem as={RouterLink} to="/settings"
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
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default SimplifiedNav; 