import { 
  Box, 
  Flex, 
  HStack, 
  IconButton, 
  Button, 
  useColorModeValue, 
  useDisclosure, 
  Stack, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  Avatar, 
  Text, 
  Badge, 
  Tooltip 
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { LuShare, LuBellRing, LuHouse, LuMessageCircleMore } from 'react-icons/lu';
import { useState, useEffect, ReactNode } from 'react';
import { useFeedback } from '../FeedbackProvider';
import { ShareComponent } from '../ShareComponent';
import {
  activeNavItemStyle,
  inactiveNavItemStyle,
  utilityIconStyle,
  navHeaderStyle,
  notificationBadgeProps
} from '../../styles/portalStyles';

// Type for navigation link
export interface NavLink {
  name: string;
  path: string;
  icon: ReactNode | null;
}

// Navigation link component
export function NavLink({ name, path, icon, isActive }: { 
  name: string; 
  path: string; 
  icon: ReactNode | null;
  isActive: boolean;
}) {
  // Apply styles based on active state
  const style = isActive ? activeNavItemStyle : inactiveNavItemStyle;
  
  // Create button props with style
  const buttonProps: any = {
    as: RouterLink,
    to: path,
    ...style,
    size: "sm",
    // Use primary variant for active buttons to ensure they use theme styles
    variant: isActive ? "primary" : "ghost",
  };
  
  // Only add leftIcon if icon exists
  if (icon) {
    buttonProps.leftIcon = icon;
  }
  
  return (
    <Button {...buttonProps}>
      {name}
    </Button>
  );
}

// Props for the BaseLayout
interface BaseLayoutProps {
  children: ReactNode;
  navLinks: NavLink[];
  roleTitle: string;
  roleBadge: {
    text: string;
    colorScheme: string;
  };
  dashboardPath: string;
  notificationsPath: string;
  storageKey: string;
  shareTitle: string;
  shareDescription: string;
  isCurrentPathActive: (path: string) => boolean;
}

export function BaseLayout({ 
  children, 
  navLinks, 
  roleTitle,
  roleBadge, 
  dashboardPath, 
  notificationsPath,
  storageKey,
  shareTitle,
  shareDescription,
  isCurrentPathActive
}: BaseLayoutProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { showFeedbackModal } = useFeedback();
  
  // Background colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const pageBgColor = useColorModeValue('gray.50', 'gray.900');
  
  // State for notifications
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Get notifications from localStorage
  useEffect(() => {
    const storedCount = localStorage.getItem(storageKey);
    if (storedCount) {
      setNotificationCount(parseInt(storedCount, 10));
    } else {
      // Default notifications
      const defaultCount = 3;
      setNotificationCount(defaultCount);
      localStorage.setItem(storageKey, defaultCount.toString());
    }
  }, [storageKey]);
  
  // Handle viewing notifications
  const handleViewNotifications = () => {
    window.location.href = notificationsPath;
    setNotificationCount(0);
    localStorage.setItem(storageKey, '0');
  };
  
  // Get full name for avatar or fallback to email if profile not loaded yet
  const fullName = profile ? 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
    (user?.email || '');
  
  // Avatar URL from profile
  const avatarUrl = profile?.avatar_url;

  return (
    <Box bg={pageBgColor}> 
      {user && (
        <Box
          bg={bgColor}
          borderBottom={1}
          borderStyle="solid"
          borderColor={borderColor}
          position="fixed"
          w="100%"
          zIndex={1}
        >
          <Flex h={16} alignItems="center" justifyContent="space-between" w="100%" px={8}>
            <IconButton
              size="md"
              icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
              aria-label="Open Menu"
              display={{ md: 'none' }}
              onClick={isOpen ? onClose : onOpen}
              sx={utilityIconStyle}
            />
            <HStack spacing={8} alignItems="center">
              <RouterLink to={dashboardPath}>
                <HStack>
                  <Text fontWeight="bold" fontSize="xl" color="blue.500">Track & Field</Text>
                  <Badge colorScheme={roleBadge.colorScheme} fontSize="0.8em" ml={1}>{roleBadge.text}</Badge>
                </HStack>
              </RouterLink>
              <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
                {navLinks.map((link) => (
                  <NavLink 
                    key={link.name} 
                    name={link.name} 
                    path={link.path} 
                    icon={link.icon} 
                    isActive={isCurrentPathActive(link.path)}
                  />
                ))}
              </HStack>
            </HStack>
            <Flex alignItems="center" gap={4}>
              <IconButton
                as={RouterLink}
                to="/"
                icon={<LuHouse size="24px" />}
                aria-label="Home"
                variant="unstyled"
                sx={utilityIconStyle}
                minW="auto" 
                h="auto"
              />
              
              {/* Feedback Button */}
              <Tooltip label="Give Feedback" hasArrow>
                <IconButton
                  icon={<LuMessageCircleMore size="24px" />}
                  aria-label="Give Feedback"
                  variant="unstyled"
                  sx={utilityIconStyle}
                  minW="auto"
                  h="auto"
                  onClick={showFeedbackModal}
                />
              </Tooltip>
              
              {/* Share Button */}
              <ShareComponent 
                title={shareTitle} 
                description={shareDescription} 
                iconStyle={utilityIconStyle}
              />
              
              {/* Notification Bell */}
              <Box position="relative">
                <Tooltip label={`${roleTitle} notifications`} hasArrow>
                  <IconButton
                    icon={<LuBellRing size="24px" />}
                    aria-label="Notifications"
                    variant="unstyled"
                    sx={utilityIconStyle}
                    minW="auto"
                    h="auto"
                    onClick={handleViewNotifications}
                  />
                </Tooltip>
                
                {/* Notification Badge */}
                {notificationCount > 0 && (
                  <Badge {...notificationBadgeProps}>
                    {notificationCount}
                  </Badge>
                )}
              </Box>
              
              <Menu>
                <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
                  <Avatar size="sm" name={fullName} src={avatarUrl} />
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to={`${dashboardPath.split('/').slice(0, -1).join('/')}/profile`}>{roleTitle} Profile</MenuItem>
                  <MenuItem as={RouterLink} to={`${dashboardPath.split('/').slice(0, -1).join('/')}/calendar`}>My Calendar</MenuItem>
                  <MenuItem onClick={showFeedbackModal}>Give Feedback</MenuItem>
                  <MenuItem onClick={signOut}>Sign out</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </Flex>
          {isOpen ? (
            <Box pb={4} display={{ md: 'none' }} px={8}>
              <Stack as="nav" spacing={4}>
                {navLinks.map((link) => (
                  <NavLink 
                    key={link.name} 
                    name={link.name} 
                    path={link.path} 
                    icon={link.icon} 
                    isActive={isCurrentPathActive(link.path)}
                  />
                ))}
                <Button
                  as={RouterLink}
                  to="/"
                  leftIcon={<LuHouse size="20px" />}
                  variant="unstyled"
                  sx={utilityIconStyle}
                  textAlign="left"
                  justifyContent="flex-start"
                >
                  Home
                </Button>
                
                {/* Mobile Feedback Link */}
                <Button
                  leftIcon={<LuMessageCircleMore size="20px" />}
                  onClick={showFeedbackModal}
                  variant="unstyled"
                  sx={utilityIconStyle}
                  textAlign="left"
                  justifyContent="flex-start"
                >
                  Give Feedback
                </Button>
                
                {/* Mobile Notifications Link */}
                <Button
                  leftIcon={<LuBellRing size="20px" />}
                  onClick={handleViewNotifications}
                  variant="unstyled"
                  sx={utilityIconStyle}
                  textAlign="left"
                  justifyContent="flex-start"
                >
                  Notifications {notificationCount > 0 && `(${notificationCount})`}
                </Button>
                
                {/* Mobile Share Link */}
                <Button
                  leftIcon={<LuShare size="20px" />}
                  onClick={() => document.querySelector<HTMLButtonElement>('button[aria-label="Share App"]')?.click()}
                  variant="unstyled"
                  sx={utilityIconStyle}
                  textAlign="left"
                  justifyContent="flex-start"
                >
                  Share App
                </Button>
              </Stack>
            </Box>
          ) : null}
        </Box>
      )}
      <Box pt={user ? 20 : 0} w="full" px={8} flex="1">
        {children}
      </Box>
    </Box>
  );
} 