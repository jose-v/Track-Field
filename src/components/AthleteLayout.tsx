import { Box, Flex, HStack, IconButton, Button, useColorModeValue, useDisclosure, Stack, Menu, MenuButton, MenuList, MenuItem, Avatar, Text, Badge, Tooltip } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
// Athlete-relevant icons (can be adjusted)
import { FaHome, FaRunning, FaUserCircle, FaBell, FaChartLine, FaTrophy, FaCalendarAlt, FaUtensils, FaBed } from 'react-icons/fa'; 
import { useState, useEffect } from 'react';

// Links for the Athlete navigation
const AthleteLinks = [
  { name: 'Dashboard', path: '/athlete/dashboard', icon: <FaChartLine /> },
  { name: 'My Workouts', path: '/athlete/workouts', icon: <FaRunning /> },
  { name: 'Events', path: '/athlete/events', icon: <FaCalendarAlt /> },
  { name: 'Nutrition', path: '/athlete/nutrition', icon: <FaUtensils /> },
  { name: 'Sleep', path: '/athlete/sleep', icon: <FaBed /> },
  { name: 'Profile', path: '/athlete/profile', icon: <FaUserCircle /> },
];

// Reusable NavLink component (can be kept same as in CoachLayout or moved to a shared components folder)
function NavLink({ name, path, icon }: { name: string; path: string; icon: React.ReactNode | null }) {
  const location = useLocation();
  const isActive = location.pathname === path;
  
  const buttonProps: any = {
    as: RouterLink,
    to: path,
    variant: isActive ? 'solid' : 'ghost',
    colorScheme: isActive ? 'blue' : undefined,
    size: "sm",
  };
  
  if (icon) {
    buttonProps.leftIcon = icon;
  }
  
  return (
    <Button {...buttonProps}>
      {name}
    </Button>
  );
}

export function AthleteLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(); // Assuming useProfile provides necessary athlete details
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const [notificationCount, setNotificationCount] = useState(0);
  
  useEffect(() => {
    const storedCount = localStorage.getItem('athleteNotificationCount'); // Different localStorage key
    if (storedCount) {
      setNotificationCount(parseInt(storedCount, 10));
    } else {
      const defaultCount = 2; // Default notifications for athletes
      setNotificationCount(defaultCount);
      localStorage.setItem('athleteNotificationCount', defaultCount.toString());
    }
  }, []);
  
  const handleViewNotifications = () => {
    // Navigate to athlete events page
    window.location.href = '/athlete/events'; 
    setNotificationCount(0);
    localStorage.setItem('athleteNotificationCount', '0');
  };
  
  const fullName = profile ? 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
    (user?.email || '');
  
  const avatarUrl = profile?.avatar_url;

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}> 
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
            />
            <HStack spacing={8} alignItems="center">
              <RouterLink to="/athlete/dashboard"> {/* Link to athlete dashboard */}
                <HStack>
                  <Text fontWeight="bold" fontSize="xl" color="blue.500">Track & Field</Text>
                  <Badge colorScheme="green" fontSize="0.8em" ml={1}>ATHLETE</Badge>
                </HStack>
              </RouterLink>
              <HStack as="nav" spacing={4} display="flex">
                {AthleteLinks.map((link) => (
                  <NavLink key={link.name} name={link.name} path={link.path} icon={link.icon} />
                ))}
              </HStack>
            </HStack>
            <Flex alignItems="center" gap={4}>
              <IconButton
                as={RouterLink}
                to="/" // Link to public home page
                icon={<FaHome />}
                aria-label="Home"
                colorScheme="blue"
                variant="ghost"
                size="md"
              />
              
              <Box position="relative">
                <Tooltip label="Notifications" hasArrow>
                  <IconButton
                    icon={<FaBell />}
                    aria-label="Notifications"
                    colorScheme="blue" // Consistent color scheme
                    variant="ghost"
                    size="md"
                    onClick={handleViewNotifications}
                  />
                </Tooltip>
                
                {notificationCount > 0 && (
                  <Badge 
                    position="absolute" 
                    top="-5px" 
                    right="-5px" 
                    colorScheme="red" 
                    borderRadius="full" 
                    fontSize="0.8em"
                    minW="1.6em"
                    textAlign="center"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Box>
              
              <Menu>
                <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
                  <Avatar size="sm" name={fullName} src={avatarUrl} />
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/athlete/profile">My Profile</MenuItem>
                  {/* Add other athlete-specific menu items if needed */}
                  <MenuItem onClick={signOut}>Sign out</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </Flex>
          {isOpen ? (
            <Box pb={4} display={{ md: 'none' }} px={8}>
              <Stack as="nav" spacing={4}>
                {AthleteLinks.map((link) => (
                  <NavLink key={link.name} name={link.name} path={link.path} icon={link.icon} />
                ))}
                <Button
                  as={RouterLink}
                  to="/"
                  leftIcon={<FaHome />}
                  variant="ghost"
                  size="sm"
                  justifyContent="flex-start"
                >
                  Home
                </Button>
                
                <Button
                  leftIcon={<FaBell />}
                  onClick={handleViewNotifications}
                  variant="ghost"
                  size="sm"
                  justifyContent="flex-start"
                >
                  Notifications {notificationCount > 0 && `(${notificationCount})`}
                </Button>
              </Stack>
            </Box>
          ) : null}
        </Box>
      )}
      <Box pt={user ? 20 : 0} w="full" px={8}>
        {children}
      </Box>
    </Box>
  );
} 