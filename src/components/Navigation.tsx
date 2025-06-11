import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useColorModeValue,
  useDisclosure,
  VStack,
  Avatar,
  Text,
  Badge,
  Tooltip,
  Spinner,
  Image,
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfileDisplay } from '../hooks/useProfileDisplay'
import { FaBell, FaHome, FaCommentDots, FaExpand, FaDownload, FaCompress, FaTachometerAlt } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import { useFeedback } from './FeedbackProvider'
import { ShareComponent } from './ShareComponent'
import { PWAControlButton } from './PWAControlButton'
import { useScrollDirection } from '../hooks/useScrollDirection'
import { 
  navIconStyle,
  homeIconStyle,
  dashboardIconStyle,
  feedbackIconStyle,
  bellIconStyle,
  navNotificationBadgeStyle
} from '../styles/navIconStyles'
import { getProfilePathForRole, getNotificationsPathForRole } from '../utils/roleUtils'

const Navigation = () => {
  const { isOpen, onToggle } = useDisclosure()
  const { user, signOut } = useAuth()
  const { profile: displayProfile, displayName, initials, isLoading: profileLoading } = useProfileDisplay()
  const location = useLocation()
  const { showFeedbackModal } = useFeedback()
  const { isHeaderVisible } = useScrollDirection(15)
  
  // Use more subtle colors for public navigation
  const isHome = location.pathname === '/'
  const isPublicPage = !location.pathname.startsWith('/dashboard') && 
                        !location.pathname.startsWith('/coach') && 
                        !location.pathname.startsWith('/athlete') &&
                        !location.pathname.startsWith('/profile') &&
                        !location.pathname.startsWith('/workouts') &&
                        !location.pathname.startsWith('/team')
  
  // For public pages overlay with translucency and blur
  const bgColor = isPublicPage ? 'rgba(255,255,255,0.6)' : useColorModeValue('white', 'gray.900')
  const borderColor = isPublicPage ? 'transparent' : useColorModeValue('gray.100', 'gray.800')
  
  // State for notifications
  const [notificationCount, setNotificationCount] = useState(0)
  
  // Simulate getting new notifications (in a real app, this would come from a backend service)
  useEffect(() => {
    if (user) {
      // Only show notifications for logged-in users
      const storedCount = localStorage.getItem('publicNotificationCount')
      if (storedCount) {
        setNotificationCount(parseInt(storedCount, 10))
      } else {
        // Default to 2 notifications for demo
        const defaultCount = 2
        setNotificationCount(defaultCount)
        localStorage.setItem('publicNotificationCount', defaultCount.toString())
      }
    }
  }, [user])
  
  // Handle viewing notifications
  const handleViewNotifications = () => {
    // Navigate to notifications based on user role
    if (displayProfile?.role === 'coach') {
      window.location.href = '/coach/notifications'
    } else if (displayProfile?.role === 'athlete') {
      window.location.href = '/athlete/notifications'
    } else {
      window.location.href = '/meets'
    }
    // Clear notification count when viewed
    setNotificationCount(0)
    localStorage.setItem('publicNotificationCount', '0')
  }

  // Get first name initial and last name initial for avatar
  const getInitials = (name: string) => {
    // If it's an email, take first letter of username  
    if (name.includes('@')) {
      const [localPart] = name.split('@');
      return localPart[0]?.toUpperCase() || 'U';
    }
    
    // Otherwise take first letter of each word (up to 2)
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U';
    return `${parts[0][0] || ''}${parts[parts.length-1][0] || ''}`.toUpperCase();
  };
  
  // Get user initials for avatar - now using lightweight profile display data
  const userInitials = displayProfile ? initials : (user?.email ? getInitials(user.email) : 'U');

  // Get full name for avatar or fallback to email if profile not loaded yet
  const fullName = displayProfile ? displayName : (user?.email?.split('@')[0] || 'User')
  
  // Avatar URL from lightweight profile
  const avatarUrl = displayProfile?.avatar_url
  
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Meets', path: '/meets' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ]

  const menuTextColor = useColorModeValue('gray.700', 'gray.100');
  const menuItemHoverBg = useColorModeValue('blue.50', 'blue.700');
  const menuItemHoverColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      position="fixed"
      top={isHeaderVisible ? 0 : "-64px"}
      left={0}
      w="100%"
      zIndex={1001}
      boxShadow={isPublicPage ? "sm" : "none"}
      transition="top 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      transform="translateZ(0)"
      // Backdrop blur for public pages
      sx={isPublicPage ? { backdropFilter: 'saturate(180%) blur(10px)' } : {}}
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <RouterLink to="/">
            <Image 
              src="/images/olympr-logo.png" 
              alt="Track & Field"
              h="40px"
              w="auto"
              objectFit="contain"
            />
          </RouterLink>

          {/* Desktop Navigation */}
          <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <RouterLink key={item.path} to={item.path}>
                  <Box
                    as="button"
                    fontSize="sm"
                    fontWeight={isActive ? "semibold" : "medium"}
                    color={isActive ? "blue.500" : isPublicPage ? "gray.700" : "gray.500"}
                    position="relative"
                    px={2}
                    py={2}
                    borderWidth="0px !important"
                    borderRadius="0"
                    bg="transparent"
                    _after={isActive ? {
                      content: '""',
                      position: "absolute",
                      bottom: "0",
                      left: "0",
                      width: "100%",
                      height: "2px",
                      bg: "blue.500",
                    } : {}}
                    _hover={{
                      color: "blue.500",
                      bg: "transparent",
                      borderWidth: "0px !important"
                    }}
                    _active={{
                      bg: "transparent",
                      borderWidth: "0px !important"
                    }}
                    _focus={{
                      boxShadow: "none",
                      borderWidth: "0px !important",
                      outline: "none"
                    }}
                  >
                    {item.label}
                  </Box>
                </RouterLink>
              );
            })}
          </HStack>

          {/* Auth Buttons */}
          <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
            {isPublicPage ? (
              user ? (
                <Menu>
                  <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
                    {profileLoading ? (
                      <Box p="2px" borderRadius="full" bg="gray.200">
                        <Spinner size="sm" thickness="2px" color="gray.400" />
                      </Box>
                    ) : avatarUrl ? (
                      <Avatar 
                        size="sm" 
                        src={avatarUrl}
                        bg="gray.200"
                      />
                    ) : (
                      <Flex
                        align="center"
                        justify="center"
                        borderRadius="full"
                        bg="gray.200"
                        color="gray.600"
                        fontWeight="bold"
                        fontSize="xs"
                        width="32px"
                        height="32px"
                      >
                        {userInitials}
                      </Flex>
                    )}
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to="/" color={menuTextColor} _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}>Home</MenuItem>
                    <MenuItem as={RouterLink} to="/dashboard" color={menuTextColor} _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}>Dashboard</MenuItem>
                    <MenuItem as={RouterLink} 
                      to={displayProfile?.role === 'coach' ? '/coach/profile' : displayProfile?.role === 'athlete' ? '/athlete/profile' : '/profile'}
                      color={menuTextColor}
                      _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                    >
                      Profile
                    </MenuItem>
                    <MenuItem onClick={showFeedbackModal} color={menuTextColor} _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}>Give Feedback</MenuItem>
                    <MenuItem onClick={signOut} color={menuTextColor} _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}>Sign out</MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <HStack spacing={4}>
                  <Button 
                    as={RouterLink} 
                    to="/login" 
                    size="sm" 
                    bg="purple.800"
                    color="white"
                    variant="solid"
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{
                      bg: "purple.900"
                    }}
                    _focus={{
                      boxShadow: "none",
                      outline: "none"
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    as={RouterLink} 
                    to="/signup" 
                    size="sm" 
                    colorScheme="blue" 
                    variant="solid"
                    fontSize="sm"
                    fontWeight="medium"
                    _focus={{
                      boxShadow: "none",
                      outline: "none"
                    }}
                  >
                    Sign Up
                  </Button>
                </HStack>
              )
            ) : (
              <HStack spacing={4}>
                {/* Home Button - Links to homepage */}
                <IconButton
                  as={RouterLink}
                  to="/"
                  icon={<FaHome />}
                  aria-label="Home"
                  variant="ghost"
                  size="md"
                  sx={homeIconStyle}
                />
                
                {/* Dashboard Button - Uses dashboard icon */}
                <IconButton
                  as={RouterLink}
                  to="/dashboard"
                  icon={<FaTachometerAlt />}
                  aria-label="Dashboard"
                  variant="ghost"
                  size="md"
                  sx={dashboardIconStyle}
                />
                
                {/* Feedback Button */}
                <Tooltip label="Give Feedback" hasArrow>
                  <IconButton
                    icon={<FaCommentDots />}
                    aria-label="Give Feedback"
                    variant="ghost"
                    size="md"
                    onClick={showFeedbackModal}
                    sx={feedbackIconStyle}
                  />
                </Tooltip>
                
                {/* Share Button */}
                <ShareComponent 
                  title="Track & Field App" 
                  description="Check out this awesome Track & Field app for coaches and athletes!" 
                  iconStyle={navIconStyle}
                />
                
                {/* PWA Controls Button */}
                <PWAControlButton />
                
                {/* Notification Bell */}
                <Box position="relative">
                  <Tooltip label="Notifications" hasArrow>
                    <IconButton
                      icon={<FaBell />}
                      aria-label="Notifications"
                      variant="ghost"
                      size="md"
                      onClick={handleViewNotifications}
                      sx={bellIconStyle}
                    />
                  </Tooltip>
                  
                  {/* Notification Badge */}
                  {notificationCount > 0 && (
                    <Badge 
                      {...navNotificationBadgeStyle}
                    >
                      {notificationCount}
                    </Badge>
                  )}
                </Box>
                
                {/* Avatar/Account */}
                <Menu>
                  <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
                    {profileLoading ? (
                      <Box p="2px" borderRadius="full" bg="gray.200">
                        <Spinner size="sm" thickness="2px" color="gray.400" />
                      </Box>
                    ) : avatarUrl ? (
                      <Avatar 
                        size="sm" 
                        src={avatarUrl}
                        bg="gray.200"
                      />
                    ) : (
                      <Flex
                        align="center"
                        justify="center"
                        borderRadius="full"
                        bg="gray.200"
                        color="gray.600"
                        fontWeight="bold"
                        fontSize="xs"
                        width="32px"
                        height="32px"
                      >
                        {userInitials}
                      </Flex>
                    )}
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to="/" color={menuTextColor} _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}>Home</MenuItem>
                    <MenuItem as={RouterLink} to="/dashboard" color={menuTextColor} _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}>Dashboard</MenuItem>
                    <MenuItem as={RouterLink} 
                      to={displayProfile?.role === 'coach' ? '/coach/profile' : displayProfile?.role === 'athlete' ? '/athlete/profile' : '/profile'}
                      color={menuTextColor}
                      _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}
                    >
                      Profile
                    </MenuItem>
                    <MenuItem onClick={showFeedbackModal} color={menuTextColor} _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}>Give Feedback</MenuItem>
                    <MenuItem onClick={signOut} color={menuTextColor} _hover={{ bg: menuItemHoverBg, color: menuItemHoverColor }}>Sign out</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            )}
          </HStack>

          {/* Mobile navigation toggle */}
          <IconButton
            aria-label={isOpen ? "Close Navigation" : "Open Navigation"}
            icon={
              <Box
                sx={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease-in-out',
                }}
              >
                {isOpen ? (
                  <CloseIcon boxSize="15px" />
                ) : (
                  <HamburgerIcon boxSize="20px" />
                )}
              </Box>
            }
            display={{ base: 'flex', md: 'none' }}
            variant="ghost"
            onClick={onToggle}
            fontSize="24px"
            sx={{
              ...navIconStyle,
              color: '#4A5568', // Darker gray (was #898989)
              fontSize: '24px', // 20% bigger than default (20px * 1.2 = 24px)
              transition: 'all 0.3s ease-in-out',
            }}
          />
        </Flex>

        {/* Mobile Navigation */}
        {isOpen && (
          <VStack
            display={{ base: "flex", md: "none" }}
            py={4}
            spacing={4}
            alignItems="flex-start"
          >
            {navItems.map((navItem) => (
              <Button 
                key={navItem.label} 
                as={RouterLink} 
                to={navItem.path}
                variant="ghost"
                size="sm"
                onClick={onToggle}
                w="100%"
                justifyContent="flex-start"
                color="gray.700"
                _hover={{ 
                  bg: "gray.100",
                  color: "blue.500"
                }}
              >
                {navItem.label}
              </Button>
            ))}
            
            {isPublicPage ? (
              user ? (
                <>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    as={RouterLink} 
                    to="/dashboard"
                    w="100%"
                    justifyContent="flex-start"
                    leftIcon={<FaTachometerAlt />}
                    color="gray.700"
                    _hover={{ 
                      bg: "gray.100",
                      color: "blue.500"
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                    as={RouterLink} 
                    to={displayProfile?.role === 'coach' ? '/coach/profile' : displayProfile?.role === 'athlete' ? '/athlete/profile' : '/profile'}
                    w="100%"
                    justifyContent="flex-start"
                    color="gray.700"
                    _hover={{ 
                      bg: "gray.100",
                      color: "blue.500"
                    }}
                  >
                    Profile
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={handleViewNotifications}
                    w="100%"
                    justifyContent="flex-start"
                    leftIcon={<FaBell />}
                    color="gray.700"
                    _hover={{ 
                      bg: "gray.100",
                      color: "blue.500"
                    }}
                  >
                    Notifications
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      signOut();
                      onToggle();
                    }}
                    w="100%"
                    justifyContent="flex-start"
                    color="red.600"
                    _hover={{ 
                      bg: "red.50",
                      color: "red.700"
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="solid"
                    size="sm"
                    onClick={onToggle}
                    as={RouterLink} 
                    to="/login"
                    w="100%"
                    justifyContent="center"
                    bg="yellow.400"
                    color="black"
                    _hover={{
                      bg: "yellow.500"
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    variant="solid"
                    size="sm"
                    onClick={onToggle}
                    as={RouterLink} 
                    to="/signup"
                    w="100%"
                    justifyContent="center"
                    bg="purple.600"
                    color="white"
                    _hover={{
                      bg: "purple.700"
                    }}
                  >
                    Join Now
                  </Button>
                </>
              )
            ) : (
              <>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  as={RouterLink} 
                  to="/"
                  w="100%"
                  justifyContent="flex-start"
                  leftIcon={<FaHome />}
                  color="gray.700"
                  _hover={{ 
                    bg: "gray.100",
                    color: "blue.500"
                  }}
                >
                  Home
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  as={RouterLink} 
                  to="/dashboard"
                  w="100%"
                  justifyContent="flex-start"
                  leftIcon={<FaTachometerAlt />}
                  color="gray.700"
                  _hover={{ 
                    bg: "gray.100",
                    color: "blue.500"
                  }}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  as={RouterLink} 
                  to={displayProfile?.role === 'coach' ? '/coach/profile' : displayProfile?.role === 'athlete' ? '/athlete/profile' : '/profile'}
                  w="100%"
                  justifyContent="flex-start"
                  color="gray.700"
                  _hover={{ 
                    bg: "gray.100",
                    color: "blue.500"
                  }}
                >
                  Profile
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleViewNotifications}
                  w="100%"
                  justifyContent="flex-start"
                  leftIcon={<FaBell />}
                  color="gray.700"
                  _hover={{ 
                    bg: "gray.100",
                    color: "blue.500"
                  }}
                >
                  Notifications
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    signOut();
                    onToggle();
                  }}
                  w="100%"
                  justifyContent="flex-start"
                  color="red.600"
                  _hover={{ 
                    bg: "red.50",
                    color: "red.700"
                  }}
                >
                  Sign Out
                </Button>
              </>
            )}
          </VStack>
        )}
      </Container>
    </Box>
  )
}

export default Navigation 