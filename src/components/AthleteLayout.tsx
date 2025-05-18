import { Box, Flex, HStack, IconButton, Button, useColorModeValue, useDisclosure, Stack, Menu, MenuButton, MenuList, MenuItem, Avatar, Text, Badge, Tooltip } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
// Updated to use Lucide icons via react-icons
import { BiRun, BiUser, BiCalendar, BiLineChart, BiDish, BiMoon, BiGroup } from 'react-icons/bi'; 
import { LuBellRing, LuHouse, LuMessageCircleMore, LuUpload } from 'react-icons/lu';
import { useState, useEffect } from 'react';
import { useFeedback } from './FeedbackProvider';
import { ShareComponent } from './ShareComponent';

// Simple clean icon style with complete removal of focus indicators
const cleanIconStyle = {
  bg: "transparent",
  border: "none",
  outline: "none",
  _hover: {
    bg: "transparent",
    border: "none",
    "& svg": { color: "#000000" }
  },
  _focus: {
    outline: "none",
    boxShadow: "none",
    border: "none",
    bg: "transparent",
  },
  _focusVisible: {
    outline: "none",
    boxShadow: "none",
    border: "none",
    bg: "transparent",
  },
  _active: {
    outline: "none",
    boxShadow: "none",
    border: "none",
    bg: "transparent",
  },
  transition: "all 0.2s ease-in",
  color: "#333333",
  mx: "18px",  // Increase margin for better spacing
  p: 0         // Remove padding to keep just the icon
};

// Links for the Athlete navigation with updated icons
const AthleteLinks = [
  { name: 'Dashboard', path: '/athlete/dashboard', icon: <BiLineChart /> },
  { name: 'My Workouts', path: '/athlete/workouts', icon: <BiRun /> },
  { name: 'Events', path: '/athlete/events', icon: <BiCalendar /> },
  { name: 'Calendar', path: '/athlete/calendar', icon: <BiCalendar /> },
  { name: 'Nutrition', path: '/athlete/nutrition', icon: <BiDish /> },
  { name: 'Sleep', path: '/athlete/sleep', icon: <BiMoon /> },
  { name: 'Profile', path: '/athlete/profile', icon: <BiUser /> },
];

// Reusable NavLink component (can be kept same as in CoachLayout or moved to a shared components folder)
function NavLink({ name, path, icon }: { name: string; path: string; icon: React.ReactNode | null }) {
  const location = useLocation();
  const isActive = location.pathname === path;
  
  const buttonProps: any = {
    as: RouterLink,
    to: path,
    variant: isActive ? 'solid' : 'ghost',
    colorScheme: isActive ? 'black' : undefined,
    bg: isActive ? 'black' : undefined,
    color: isActive ? 'white !important' : 'black',
    size: "sm",
    fontWeight: "medium",
    _hover: {
      bg: isActive ? 'black' : 'gray.100',
      color: isActive ? 'white !important' : 'black',
    },
    sx: isActive ? {
      '& svg': { color: 'white !important' }
    } : {}
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
  const { showFeedbackModal } = useFeedback(); // Access feedback hook
  
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
            <Flex alignItems="center" gap={0}> {/* Remove gap as we're using mx in the style */}
              <IconButton
                as={RouterLink}
                to="/" // Link to public home page
                icon={<LuHouse size="24px" color="#333333" />}
                aria-label="Home"
                variant="unstyled"
                sx={cleanIconStyle}
                minW="auto"
                h="auto"
                color="#333333 !important"
              />
              
              {/* Feedback Button */}
              <Tooltip label="Give Feedback" hasArrow>
                <IconButton
                  icon={<LuMessageCircleMore size="24px" color="#333333" />}
                  aria-label="Give Feedback"
                  variant="unstyled"
                  sx={cleanIconStyle}
                  minW="auto"
                  h="auto"
                  color="#333333 !important"
                  onClick={showFeedbackModal}
                />
              </Tooltip>
              
              {/* Share Button */}
              <ShareComponent 
                title="Track & Field App for Athletes" 
                description="Check out this awesome Track & Field app for athletes!" 
              />
              
              <Box position="relative" mx="18px"> {/* Match the new spacing */}
                <Tooltip label="Notifications" hasArrow>
                  <IconButton
                    icon={<LuBellRing size="24px" color="#333333" />}
                    aria-label="Notifications"
                    variant="unstyled"
                    sx={cleanIconStyle}
                    minW="auto"
                    h="auto"
                    mx="0"  /* Override mx from cleanIconStyle since Box has mx */
                    color="#333333 !important"
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
                  <MenuItem as={RouterLink} to="/athlete/calendar">My Calendar</MenuItem>
                  <MenuItem onClick={showFeedbackModal}>Give Feedback</MenuItem>
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
                  leftIcon={<LuHouse size="20px" />}
                  variant="unstyled"
                  sx={cleanIconStyle}
                  textAlign="left"
                  justifyContent="flex-start"
                >
                  Home
                </Button>
                
                <Button
                  leftIcon={<LuMessageCircleMore size="20px" />}
                  onClick={showFeedbackModal}
                  variant="unstyled"
                  sx={cleanIconStyle}
                  textAlign="left"
                  justifyContent="flex-start"
                >
                  Give Feedback
                </Button>
                
                <Button
                  leftIcon={<LuBellRing size="20px" />}
                  onClick={handleViewNotifications}
                  variant="unstyled"
                  sx={cleanIconStyle}
                  textAlign="left"
                  justifyContent="flex-start"
                >
                  Notifications {notificationCount > 0 && `(${notificationCount})`}
                </Button>
                
                <Button
                  leftIcon={<LuUpload size="20px" />}
                  onClick={() => document.querySelector<HTMLButtonElement>('button[aria-label="Share App"]')?.click()}
                  variant="unstyled"
                  sx={cleanIconStyle}
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
      <Box pt={user ? 20 : 0} w="full" px={8}>
        {children}
      </Box>
    </Box>
  );
} 