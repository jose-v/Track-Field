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
  HStack
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaUsers, FaVideo, FaBook, FaCalendarAlt, FaBell, FaUserAlt, FaHome, FaDumbbell, FaChartBar, FaRunning } from 'react-icons/fa';
import { BiLineChart } from 'react-icons/bi';
import { BsCalendarCheck } from 'react-icons/bs';
import { MdLoop, MdRestaurantMenu, MdOutlineBedtime, MdOutlineReport, MdOutlineForum } from 'react-icons/md';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { ThemeToggle } from './ThemeToggle';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: string;
}

const NavItem = ({ icon, label, to, isActive, isCollapsed, badge }: NavItemProps) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const color = '#898989';
  
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
        <Icon
          as={icon}
          fontSize="xl"
          color={isActive ? activeColor : color}
          mr={isCollapsed ? 0 : 3}
        />
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

interface SidebarProps {
  userType: 'athlete' | 'coach';
}

const Sidebar = ({ userType }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sidebarShadow = useColorModeValue('none', 'sm');
  
  useEffect(() => {
    // Save to localStorage whenever it changes
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    
    // Dispatch event with both width and isCollapsed
    window.dispatchEvent(new CustomEvent('sidebarToggle', { 
      detail: { isCollapsed, width: isCollapsed ? 70 : 200 } 
    }));
  }, [isCollapsed]);
  
  const navItems: Array<{
    icon: React.ElementType;
    label: string;
    to: string;
    badge?: string;
  }> = userType === 'coach' 
    ? [
        { icon: FaHome, label: 'HOME', to: '/' },
        { icon: BiLineChart, label: 'DASHBOARD', to: '/coach/dashboard' },
        { icon: FaUsers, label: 'ATHLETES', to: '/coach/athletes' },
        { icon: BsCalendarCheck, label: 'WORKOUTS', to: '/coach/workouts' },
        { icon: FaDumbbell, label: 'WORKOUT CREATOR', to: '/coach/workout-creator-demo', badge: 'BETA' },
        { icon: FaCalendarAlt, label: 'CALENDAR', to: '/coach/calendar' },
        { icon: FaChartBar, label: 'ANALYTICS', to: '/coach/analytics' },
        { icon: MdOutlineReport, label: 'REPORTS', to: '/coach/stats' },
        { icon: MdOutlineForum, label: 'LOOP', to: '/coach/loop' },
        { icon: FaBell, label: 'NOTIFICATIONS', to: '/coach/notifications' },
        { icon: FaUserAlt, label: 'PROFILE', to: '/coach/profile' },
      ]
    : [
        { icon: FaHome, label: 'HOME', to: '/' },
        { icon: BiLineChart, label: 'DASHBOARD', to: '/athlete/dashboard' },
        { icon: BsCalendarCheck, label: 'MY WORKOUTS', to: '/athlete/workouts' },
        { icon: FaDumbbell, label: 'WORKOUT CREATOR', to: '/athlete/workout-creator-demo', badge: 'BETA' },
        { icon: FaRunning, label: 'EVENTS', to: '/athlete/events' },
        { icon: FaCalendarAlt, label: 'CALENDAR', to: '/athlete/calendar' },
        { icon: MdRestaurantMenu, label: 'NUTRITION', to: '/athlete/nutrition' },
        { icon: MdOutlineBedtime, label: 'SLEEP', to: '/athlete/sleep' },
        { icon: FaChartBar, label: 'ANALYTICS', to: '/athlete/analytics' },
        { icon: MdOutlineForum, label: 'LOOP', to: '/athlete/loop' },
        { icon: FaBell, label: 'NOTIFICATIONS', to: '/athlete/notifications' },
        { icon: FaUserAlt, label: 'PROFILE', to: '/athlete/profile' },
      ];

  const getInitials = (name: string) => {
    if (name.includes('@')) {
      const [localPart] = name.split('@');
      return localPart[0]?.toUpperCase() || 'U';
    }
    
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
    return `${parts[0][0] || ''}${parts[parts.length-1][0] || ''}`.toUpperCase();
  };
  
  const userInitials = profile && profile.first_name ? 
    getInitials(`${profile.first_name} ${profile.last_name || ''}`) : 
    user?.email ? getInitials(user.email) : 'U';
  
  const getRoleLabel = (role?: string) => {
    if (!role) return '';
    if (role === 'athlete') return 'Athlete';
    if (role === 'coach') return 'Coach';
    if (role === 'team_manager') return 'Team Manager';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
  const roleName = getRoleLabel(profile?.role);

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      h="100vh"
      w={isCollapsed ? "70px" : "200px"}
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex={1000}
      boxShadow={sidebarShadow}
      overflow="hidden"
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
            const isActive = isHome
              ? location.pathname === '/'
              : location.pathname === item.to || (item.to !== '/loop' && location.pathname.startsWith(item.to));
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
                  onClick={() => setIsCollapsed(!isCollapsed)}
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
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                HIDE MENU
              </Button>
              <ThemeToggle size="sm" />
            </HStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default Sidebar; 