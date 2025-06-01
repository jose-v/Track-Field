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
import { HamburgerIcon } from '@chakra-ui/icons';
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
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { showFeedbackModal } = useFeedback();
  const { isHeaderVisible } = useScrollDirection(10);
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
              <LuMessageCircleMore size="20px" />
            </IconButton>
          </Tooltip>
          {/* Share Button */}
          <ShareComponent 
            title={shareTitle} 
            description={shareDescription} 
            iconStyle={{
              ...iconStyle,
              _focus: { boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
              _active: { boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
              _hover: { ...iconStyle._hover, boxShadow: 'none', outline: 'none', border: 'none', borderWidth: '0px' },
            }} 
          />
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
                <HamburgerIcon boxSize={6} color="gray.600" />
              </MenuButton>
              <MenuList zIndex={9999}>
                <MenuItem as={RouterLink} 
                  to={profile?.role === 'coach' ? '/coach/profile' : profile?.role === 'athlete' ? '/athlete/profile' : '/profile'}
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