import { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Flex, 
  Divider, 
  Icon, 
  Button,
  useColorModeValue,
  Tooltip,
  Avatar,
  Badge,
  HStack,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton,
  useBreakpointValue,
  Image
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaUsers, 
  FaVideo, 
  FaBook, 
  FaCalendarAlt, 
  FaBell, 
  FaUserAlt, 
  FaHome, 
  FaDumbbell, 
  FaChartBar, 
  FaRunning,
  FaShare,
  FaCog,
  FaSlidersH,
  FaWrench,
  FaSignOutAlt,
  FaTachometerAlt,
  FaClipboardList,
  FaUserPlus
} from 'react-icons/fa';
import { BsCalendarCheck, BsChatDots } from 'react-icons/bs';
import { MdLoop, MdRestaurantMenu, MdOutlineBedtime, MdOutlineReport, MdOutlineForum } from 'react-icons/md';
import { LuUsers, LuCalendarClock, LuClipboardList, LuBell } from 'react-icons/lu';
import { BiRun, BiCalendar, BiDish, BiMoon } from 'react-icons/bi';
import { HiUserGroup } from 'react-icons/hi';
import { IoFitnessOutline } from 'react-icons/io5';
import { HamburgerIcon } from '@chakra-ui/icons';
import { LuHouse, LuMessageSquare, LuBellRing, LuShare, LuMenu } from 'react-icons/lu';
import { useAuth } from '../contexts/AuthContext';
import { useProfileDisplay } from '../hooks/useProfileDisplay';
import { ThemeToggle } from './ThemeToggle';
import { useFeedback } from './FeedbackProvider';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { useCoachNavigation } from './layout/CoachNavigation';
import { useTeamManagerNavigation } from './layout/TeamManagerNavigation';
import { useAthleteNavigation } from './layout/AthleteNavigation';
import { useUnreadNotificationCount } from '../hooks/useUnreadNotificationCount';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: string;
  isMobile?: boolean;
}

interface SidebarProps {
  userType: 'coach' | 'athlete' | 'team_manager';
}

// Mobile-specific nav item component
const MobileNavItem = ({ icon, label, to, isActive, onClick, badge }: {
  icon: React.ElementType;
  label: string;
  to: string;
  isActive: boolean;
  onClick?: () => void;
  badge?: number;
}) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const color = useColorModeValue('gray.700', 'gray.300');

  // Handle touch events to prevent hover state persistence
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear any hover states by briefly blurring the element
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.blur();
    }, 50);
  };
  
  return (
    <Flex
      as={RouterLink}
      to={to}
      onClick={onClick}
      onTouchEnd={handleTouchEnd}
      align="center"
      p={4}
      borderRadius="lg"
      role="group"
      cursor="pointer"
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : color}
      fontWeight={isActive ? 'semibold' : 'medium'}
      transition="all 0.2s"
      justify="flex-start"
      _hover={{
        '@media (hover: hover)': {
          bg: hoverBg,
          color: activeColor,
        }
      }}
      _active={{
        bg: activeBg,
        color: activeColor,
      }}
      _focus={{
        boxShadow: 'none',
        outline: 'none',
        '@media (hover: hover)': {
          bg: hoverBg,
          color: activeColor,
        }
      }}
      _focusVisible={{
        boxShadow: 'none',
        outline: 'none',
        '@media (hover: hover)': {
          bg: hoverBg,
          color: activeColor,
        }
      }}
    >
      <Icon
        as={icon}
        fontSize="xl"
        color={isActive ? activeColor : color}
        mr={4}
      />
      <Flex justify="space-between" width="100%" align="center">
        <Text fontSize="md">{label}</Text>
        {badge && badge > 0 && (
          <Badge
            colorScheme="red"
            borderRadius="full"
            fontSize="xs"
            minW="18px"
            h="18px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {badge}
          </Badge>
        )}
      </Flex>
    </Flex>
  );
};

const NavItem = ({ icon, label, to, isActive, isCollapsed, badge, isMobile = false }: NavItemProps) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const badgeBorderColor = useColorModeValue('white', 'gray.800');
  const color = '#898989';
  
  if (isMobile) {
    return (
      <MobileNavItem 
        icon={icon}
        label={label}
        to={to}
        isActive={isActive}
      />
    );
  }
  
  return (
    <Tooltip label={isCollapsed ? label : ''} placement="right" hasArrow isDisabled={!isCollapsed}>
      <Flex
        as={RouterLink}
        to={to}
        align="center"
        p={3}
        ml={0}
        mr={0}
        borderRadius={0}
        role="group"
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : color}
        fontWeight={isActive ? 'bold' : 'normal'}
        transition="all 0.2s"
        justify={isCollapsed ? "center" : "flex-start"}
        _hover={{
          bg: hoverBg,
          color: activeColor,
        }}
        _active={{
          bg: activeBg,
          color: activeColor,
        }}
        _focus={{
          boxShadow: 'none',
          outline: 'none',
        }}
      >
        <Box position="relative">
          <Icon
            as={icon}
            fontSize="xl"
            color={isActive ? activeColor : color}
            mr={isCollapsed ? 0 : 3}
          />
          {/* Red dot indicator for collapsed sidebar with notifications */}
          {isCollapsed && badge && (
            <Box
              position="absolute"
              top="-2px"
              right="-2px"
              w="8px"
              h="8px"
              bg="red.500"
              borderRadius="full"
              border="2px solid"
              borderColor={badgeBorderColor}
            />
          )}
        </Box>
        {!isCollapsed && (
          <Flex justify="space-between" width="100%" align="center">
            <Text fontSize="sm">{label}</Text>
            {badge && (
              <Badge colorScheme="orange" borderRadius="full" px={2} py={0.5} fontSize="xs">
                {badge}
              </Badge>
            )}
          </Flex>
        )}
      </Flex>
    </Tooltip>
  );
};

const Sidebar = ({ userType }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  
  // Mobile drawer state
  const { isOpen: isMobileDrawerOpen, onOpen: onMobileDrawerOpen, onClose: onMobileDrawerClose } = useDisclosure();

  // Enhanced mobile drawer close function to clear focus
  const handleMobileDrawerClose = () => {
    onMobileDrawerClose();
    // Clear any lingering focus by briefly focusing body and then removing focus
    setTimeout(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur();
      }
      document.body.focus();
      document.body.blur();
    }, 100);
  };
  
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile, displayName, initials } = useProfileDisplay();
  const { showFeedbackModal } = useFeedback();
  const { unreadCount } = useUnreadNotificationCount();
  
  // Get navigation configurations
  const coachNavigation = useCoachNavigation();
  const teamManagerNavigation = useTeamManagerNavigation();
  const athleteNavigation = useAthleteNavigation();
  
  // Color mode values for the sidebar (ALL useColorModeValue calls must be at top level)
  const sidebarBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const drawerBg = useColorModeValue('white', 'gray.900');
  
  // Color values for mobile hamburger trigger
  const hamburgerColor = useColorModeValue('gray.700', 'gray.300');
  const hamburgerHoverBg = useColorModeValue('gray.100', 'gray.700');
  const hamburgerHoverColor = useColorModeValue('blue.600', 'blue.300');
  const hamburgerActiveBg = useColorModeValue('gray.200', 'gray.600');
  
  // Color values for drawer content
  const drawerTextColor = useColorModeValue('gray.800', 'white');
  const drawerSectionColor = useColorModeValue('gray.500', 'gray.400');
  const drawerLinkColor = useColorModeValue('gray.700', 'gray.300');
  const drawerLinkHoverBg = useColorModeValue('gray.100', 'gray.700');
  const drawerLinkHoverColor = useColorModeValue('blue.600', 'blue.200');
  
  // Dispatch width change event whenever isCollapsed changes
  useEffect(() => {
    const width = isCollapsed ? 70 : 200;
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { width } }));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', newCollapsed.toString());
  };

  const getNavItems = () => {
    if (userType === 'athlete') {
      // Create a mapping of athlete navigation paths to their proper icons
      const athleteIconMap: { [key: string]: any } = {
        '/athlete/dashboard': FaTachometerAlt,
        '/athlete/workouts': FaDumbbell,
        '/athlete/workout-creator-new': FaWrench,
        '/join-team': FaUserPlus,
        '/athlete/meets': BsCalendarCheck,
        '/athlete/calendar': BiCalendar,
        '/athlete/nutrition': BiDish,
        '/athlete/sleep': BiMoon,
        '/athlete/notifications': FaBell,
        '/athlete/profile': FaUserAlt,
        '/athlete/settings': FaCog,
      };

      // Use the athlete navigation configuration from the hook
      return [
        { icon: FaHome, label: 'Home', to: '/', badge: undefined },
        ...athleteNavigation.navLinks.map(navItem => ({
          icon: athleteIconMap[navItem.path] || FaTachometerAlt,
          label: navItem.name,
          to: navItem.path,
          badge: navItem.path === '/athlete/notifications' && unreadCount > 0 ? unreadCount.toString() : undefined
        })),
        { icon: BsChatDots, label: 'Loop', to: '/loop', badge: undefined },
      ];
    } else if (userType === 'team_manager') {
      // Create a mapping of team manager navigation paths to their proper icons
      const teamManagerIconMap: { [key: string]: any } = {
        '/team-manager/dashboard': FaTachometerAlt,
        '/team-manager/teams': LuUsers,
        '/team-manager/coaches': FaUsers,
        '/team-manager/athletes': LuUsers,
        '/team-manager/training-plans': FaClipboardList,
        '/team-manager/workout-creator-new': FaCog,
        '/team-manager/calendar': FaCalendarAlt,
        '/team-manager/meets': BsCalendarCheck,
        '/team-manager/stats': FaChartBar,
        '/team-manager/admin': FaCog,
        '/team-manager/notifications': FaBell,
      };

      // Use the team manager navigation configuration from the hook
      return [
        { icon: FaHome, label: 'Home', to: '/', badge: undefined },
        ...teamManagerNavigation.navLinks.map(navItem => ({
          icon: teamManagerIconMap[navItem.path] || FaTachometerAlt,
          label: navItem.name,
          to: navItem.path,
          badge: navItem.path === '/team-manager/notifications' && unreadCount > 0 ? unreadCount.toString() : undefined
        })),
        { icon: BsChatDots, label: 'Loop', to: '/loop', badge: undefined },
      ];
    } else {
      // Create a mapping of coach navigation paths to their proper icons
      const coachIconMap: { [key: string]: any } = {
        '/coach/dashboard': FaTachometerAlt,
        '/coach/athletes': FaUsers,
        '/join-team': FaUserPlus,
        '/coach/training-plans': FaClipboardList,
        '/coach/workout-creator-new': FaWrench,
        '/coach/calendar': FaCalendarAlt,
        '/coach/meets': BsCalendarCheck,
        '/coach/stats': FaChartBar,
        '/coach/notifications': FaBell,
        '/coach/settings': FaCog,
      };

      // Use the coach navigation configuration from the hook
      return [
        { icon: FaHome, label: 'Home', to: '/', badge: undefined },
        ...coachNavigation.navLinks.map(navItem => ({
          icon: coachIconMap[navItem.path] || FaTachometerAlt,
          label: navItem.name,
          to: navItem.path,
          badge: navItem.path === '/coach/notifications' && unreadCount > 0 ? unreadCount.toString() : undefined
        })),
        { icon: BsChatDots, label: 'Loop', to: '/loop', badge: undefined },
      ];
    }
  };

  const navItems = getNavItems();
  
  // Use the optimized display helpers from the hook
  const userInitials = initials;
  const roleName = userType === 'athlete' ? 'Athlete' : userType === 'team_manager' ? 'Team Manager' : 'Coach';
  const fullName = displayName;

  // Mobile hamburger trigger (visible on mobile, hidden on desktop)
  const MobileHamburgerTrigger = () => {
    const { isHeaderVisible } = useScrollDirection(15);
    
    return (
      <IconButton
        aria-label="Open Menu"
        icon={<LuMenu size="20px" />}
        position="fixed"
        top={isHeaderVisible ? 4 : "-48px"}
        left={4}
        zIndex={1002}
        size="md"
        variant="ghost"
        display={{ base: 'flex', md: 'none' }}
        onClick={onMobileDrawerOpen}
        bg="transparent"
        boxShadow="none"
        borderRadius="md"
        color="gray.900"
        transition="top 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        transform="translateZ(0)"
        _hover={{
          bg: "transparent",
          color: "gray.900",
        }}
        _active={{
          bg: "transparent",
        }}
        _focus={{
          boxShadow: 'none',
          outline: 'none',
          bg: "transparent",
          color: "gray.900",
        }}
        _focusVisible={{
          boxShadow: 'none',
          outline: 'none',
          bg: "transparent",
          color: "gray.900",
        }}
      />
    );
  };

  // Mobile drawer content
  const MobileDrawerContent = () => {
    // Debug function to clear PWA cache
    const clearPWACache = async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const trackFieldCaches = cacheNames.filter(name => name.startsWith('track-field-'));
          
          for (const cacheName of trackFieldCaches) {
            await caches.delete(cacheName);
            console.log('Cleared cache:', cacheName);
          }
          
          // Also clear localStorage for good measure
          localStorage.removeItem('chakra-ui-color-mode');
          
          // Force reload
          window.location.reload();
        } catch (error) {
          console.error('Error clearing PWA cache:', error);
        }
      }
    };

    return (
      <Drawer
        isOpen={isMobileDrawerOpen}
        placement="left"
        onClose={handleMobileDrawerClose}
        size="full" // This makes it 100% width
        trapFocus={true}
        returnFocusOnClose={false}
        blockScrollOnMount={true}
        preserveScrollBarGap={false}
      >
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent
          maxW="67vw" // Gmail-style 2/3 screen width
          bg={drawerBg}
          boxShadow="2xl"
        >
          {/* Custom close button in header */}
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} pb={4}>
            <Flex align="center" justify="flex-start">
              <Image 
                src="/images/olympr-logo.png" 
                alt="Track & Field"
                h="36px"
                w="auto"
                objectFit="contain"
                onDoubleClick={clearPWACache} // Double-click logo to clear cache
                cursor="pointer"
              />
            </Flex>
          </DrawerHeader>

          <DrawerBody px={0} py={0}>
            <VStack spacing={0} align="stretch" height="100%">
              {/* User Profile Section */}
              <Box p={6} borderBottomWidth="1px" borderColor={borderColor}>
                <Flex align="center" gap={3}>
                  <Avatar 
                    size="md"
                    bg="blue.500" 
                    color="white"
                    name={userInitials}
                    src={profile?.avatar_url}
                  />
                  <VStack align="start" spacing={0} flex="1">
                    <Text fontWeight="semibold" fontSize="md" color={drawerTextColor}>
                      {fullName}
                    </Text>
                    <Badge colorScheme="blue" fontSize="xs" textTransform="uppercase">
                      {roleName}
                    </Badge>
                  </VStack>
                </Flex>
              </Box>

              {/* Main Navigation - Scrollable Content */}
              <Box flex="1" overflowY="auto">
                <VStack spacing={1} align="stretch" p={4}>
                  <Text 
                    fontSize="xs" 
                    fontWeight="bold" 
                    color={drawerSectionColor}
                    textTransform="uppercase" 
                    letterSpacing="wider"
                    mb={2}
                    px={4}
                  >
                    Main Menu
                  </Text>
                  
                  {navItems.map((item) => {
                    const isHome = item.to === '/';
                    // More robust active state logic
                    let isActive = false;
                    if (isHome) {
                      // Home is ONLY active when exactly on the root path
                      isActive = location.pathname === '/';
                    } else if (item.to === '/loop') {
                      // Loop route special handling
                      isActive = location.pathname === '/loop';
                    } else {
                      // For all other routes, check for exact match or starts with
                      isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                    }
                    
                    return (
                      <MobileNavItem
                        key={item.to}
                        icon={item.icon}
                        label={item.label}
                        to={item.to}
                        isActive={isActive}
                        onClick={handleMobileDrawerClose}
                      />
                    );
                  })}
                </VStack>

                {/* Quick Actions Section */}
                <Box px={4} mt={6}>
                  <Text 
                    fontSize="xs" 
                    fontWeight="bold" 
                    color={drawerSectionColor}
                    textTransform="uppercase" 
                    letterSpacing="wider"
                    mb={3}
                    px={4}
                  >
                    Quick Actions
                  </Text>
                  
                  <VStack spacing={1} align="stretch">
                    <MobileNavItem
                      icon={FaBell}
                      label="Notifications"
                      to={userType === 'athlete' ? '/athlete/notifications' : '/coach/notifications'}
                      isActive={location.pathname.includes('/notifications')}
                      onClick={handleMobileDrawerClose}
                      badge={unreadCount}
                    />
                    
                    <MobileNavItem
                      icon={FaUserAlt}
                      label="Profile"
                      to={userType === 'athlete' ? '/athlete/profile' : '/coach/profile'}
                      isActive={location.pathname.includes('/profile')}
                      onClick={handleMobileDrawerClose}
                    />
                  </VStack>
                </Box>

                {/* Settings Section */}
                <Box px={4} mt={6} pb={4}>
                  <Text 
                    fontSize="xs" 
                    fontWeight="bold" 
                    color={drawerSectionColor}
                    textTransform="uppercase" 
                    letterSpacing="wider"
                    mb={3}
                    px={4}
                  >
                    Settings
                  </Text>
                  
                  <VStack spacing={1} align="stretch">
                    <Button
                      leftIcon={<Icon as={LuMessageSquare} />}
                      variant="ghost"
                      justifyContent="flex-start"
                      p={4}
                      borderRadius="lg"
                      onClick={() => {
                        showFeedbackModal();
                        handleMobileDrawerClose();
                      }}
                      color={drawerLinkColor}
                      _hover={{
                        bg: drawerLinkHoverBg,
                        color: drawerLinkHoverColor,
                      }}
                      _focus={{
                        boxShadow: 'none',
                        outline: 'none',
                        bg: drawerLinkHoverBg,
                        color: drawerLinkHoverColor,
                      }}
                      _focusVisible={{
                        boxShadow: 'none',
                        outline: 'none',
                        bg: drawerLinkHoverBg,
                        color: drawerLinkHoverColor,
                      }}
                    >
                      <Text fontSize="md" ml={1}>Give Feedback</Text>
                    </Button>
                    
                    <Button
                      leftIcon={<Icon as={LuShare} />}
                      variant="ghost"
                      justifyContent="flex-start"
                      p={4}
                      borderRadius="lg"
                      onClick={() => {
                        // Share functionality
                        handleMobileDrawerClose();
                      }}
                      color={drawerLinkColor}
                      _hover={{
                        bg: drawerLinkHoverBg,
                        color: drawerLinkHoverColor,
                      }}
                      _focus={{
                        boxShadow: 'none',
                        outline: 'none',
                        bg: drawerLinkHoverBg,
                        color: drawerLinkHoverColor,
                      }}
                      _focusVisible={{
                        boxShadow: 'none',
                        outline: 'none',
                        bg: drawerLinkHoverBg,
                        color: drawerLinkHoverColor,
                      }}
                    >
                      <Text fontSize="md" ml={1}>Share App</Text>
                    </Button>
                  </VStack>
                </Box>
              </Box>

              {/* Bottom Actions - Fixed at bottom */}
              <Box p={4} borderTopWidth="1px" borderColor={borderColor}>
                <HStack justify="space-between" align="center">
                  <ThemeToggle size="md" />
                  <Button
                    leftIcon={<Icon as={FaSignOutAlt} />}
                    variant="ghost"
                    colorScheme="red"
                    size="sm"
                    onClick={() => {
                      signOut();
                      handleMobileDrawerClose();
                    }}
                    _focus={{
                      boxShadow: 'none',
                      outline: 'none',
                    }}
                    _focusVisible={{
                      boxShadow: 'none',
                      outline: 'none',
                    }}
                  >
                    Sign Out
                  </Button>
                </HStack>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  };

  return (
    <>
      {/* Mobile Hamburger Trigger */}
      <MobileHamburgerTrigger />
      
      {/* Mobile Drawer */}
      <MobileDrawerContent />
      
      {/* Desktop Sidebar */}
    <Box
      position="fixed"
      left={0}
      top={0}
      h="100vh"
      w={isCollapsed ? "70px" : "200px"}
      bg={sidebarBg}
      borderRight="1px"
      borderColor={borderColor}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex={1000}
      boxShadow="none"
      overflow="hidden"
        display={{ base: 'none', md: 'block' }} // Hide on mobile, show on desktop
    >
      <VStack spacing={0} align="stretch" h="100%">
        <Flex 
          direction="column" 
          align="center" 
          justify="center" 
          py={6}
          borderBottom="1px"
          borderColor={borderColor}
        >
          <Avatar 
            size={isCollapsed ? "sm" : "md"}
            bg="blue.500" 
            color="white"
            name={userInitials}
            src={profile?.avatar_url}
            mb={isCollapsed ? 0 : 2}
          />
          
          {!isCollapsed && (
            <Text fontSize="sm" fontWeight="bold" color="#898989" mt={2} textTransform="uppercase">{roleName}</Text>
          )}
        </Flex>
        
        <VStack spacing={1} align="stretch" py={4} flex="1">
          {navItems.map((item) => {
            const isHome = item.to === '/';
            // More robust active state logic  
            let isActive = false;
            if (isHome) {
              // Home is ONLY active when exactly on the root path
              isActive = location.pathname === '/';
            } else if (item.to === '/loop') {
              // Loop route special handling
              isActive = location.pathname === '/loop';
            } else {
              // For all other routes, check for exact match or starts with
              isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            }
            return (
              <NavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                isActive={isActive}
                isCollapsed={isCollapsed}
                badge={item.badge}
              />
            );
          })}
        </VStack>
        
        <Box p={4} borderTop="1px" borderColor={borderColor}>
          {isCollapsed ? (
            // Collapsed layout: Theme toggle above arrow
            <VStack spacing={3} w="100%" align="center">
              <Flex justify="center" align="center" w="100%">
                <ThemeToggle size="md" />
              </Flex>
              <Flex justify="center" align="center" w="100%">
                <Button 
                  size="sm"
                  variant="ghost"
                  minW="auto"
                  px={2}
                  justifyContent="center"
                  onClick={toggleSidebar}
                >
                  <Icon as={FaChevronRight} />
                </Button>
              </Flex>
            </VStack>
          ) : (
            // Expanded layout: Theme toggle next to hide menu button
            <HStack justify="space-between" w="100%">
              <Button 
                leftIcon={<Icon as={FaChevronLeft} />}
                size="sm"
                variant="ghost"
                flex="1"
                justifyContent="flex-start"
                onClick={toggleSidebar}
              >
                HIDE MENU
              </Button>
              <ThemeToggle size="sm" />
            </HStack>
          )}
        </Box>
      </VStack>
    </Box>
    </>
  );
};

export default Sidebar; 