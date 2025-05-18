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
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { FaBell, FaHome } from 'react-icons/fa'
import { useState, useEffect } from 'react'

const Navigation = () => {
  const { isOpen, onToggle } = useDisclosure()
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const location = useLocation()
  
  // Use more subtle colors for public navigation
  const bgColor = useColorModeValue('white', 'gray.900')
  const borderColor = useColorModeValue('gray.100', 'gray.800')
  const isPublicPage = !user && !location.pathname.startsWith('/dashboard')
  
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
    // For public navigation, direct to events page
    window.location.href = '/events'
    // Clear notification count when viewed
    setNotificationCount(0)
    localStorage.setItem('publicNotificationCount', '0')
  }

  // Get full name for avatar or fallback to email if profile not loaded yet
  const fullName = profile ? 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
    (user?.email || '')
  
  // Avatar URL from profile
  const avatarUrl = profile?.avatar_url
  
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Events', path: '/events' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ]

  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={1000}
      w="100%"
      boxShadow={isPublicPage ? "sm" : "none"}
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <RouterLink to="/">
            <Text fontWeight="bold" fontSize="xl" color={isPublicPage ? "gray.800" : "blue.500"}>
              Track & Field
            </Text>
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
            {user ? (
              <HStack spacing={4}>
                {/* Home Button */}
                <IconButton
                  as={RouterLink}
                  to="/dashboard"
                  icon={<FaHome />}
                  aria-label="Dashboard"
                  colorScheme="blue"
                  variant="ghost"
                  size="md"
                  _focus={{
                    boxShadow: "none",
                    outline: "none"
                  }}
                />
                
                {/* Notification Bell */}
                <Box position="relative">
                  <Tooltip label="Event notifications" hasArrow>
                    <IconButton
                      icon={<FaBell />}
                      aria-label="Notifications"
                      colorScheme="blue"
                      variant="ghost"
                      size="md"
                      onClick={handleViewNotifications}
                      _focus={{
                        boxShadow: "none",
                        outline: "none"
                      }}
                    />
                  </Tooltip>
                  
                  {/* Notification Badge */}
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
                  <MenuButton
                    as={Button}
                    rounded="full"
                    variant="link"
                    cursor="pointer"
                    minW={0}
                    _focus={{
                      boxShadow: "none",
                      outline: "none"
                    }}
                  >
                    <Avatar
                      size="sm"
                      name={fullName}
                      src={avatarUrl}
                    />
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to="/dashboard">
                      Dashboard
                    </MenuItem>
                    <MenuItem as={RouterLink} to="/profile">
                      Profile
                    </MenuItem>
                    <MenuItem onClick={signOut}>Sign Out</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            ) : (
              <>
                <Box
                  as={RouterLink}
                  to="/login"
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.700"
                  px={3}
                  py={2}
                  _hover={{
                    color: "blue.500",
                    textDecoration: "none"
                  }}
                  _focus={{
                    boxShadow: "none",
                    outline: "none"
                  }}
                >
                  Log In
                </Box>
                <Button 
                  as={RouterLink} 
                  to="/signup" 
                  colorScheme="blue"
                  fontSize="sm"
                  fontWeight="medium"
                  borderRadius="md"
                  bg={isPublicPage ? "blue.500" : "blue.500"}
                  _hover={{ bg: "blue.600" }}
                  _focus={{
                    boxShadow: "none",
                    outline: "none"
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </HStack>

          {/* Mobile menu button */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onToggle}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            variant="ghost"
            aria-label="Toggle Navigation"
            _focus={{
              boxShadow: "none",
              outline: "none"
            }}
          />
        </Flex>

        {/* Mobile Navigation */}
        {isOpen && (
          <Box display={{ base: 'block', md: 'none' }} pb={4}>
            <VStack spacing={4} align="stretch">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <RouterLink key={item.path} to={item.path}>
                    <Box
                      as="button"
                      w="full" 
                      textAlign="left"
                      fontSize="sm"
                      fontWeight={isActive ? "semibold" : "medium"}
                      color={isActive ? "blue.500" : "gray.700"}
                      borderLeft={isActive ? "2px solid" : "none"}
                      borderColor="blue.500"
                      borderRadius={0}
                      pl={isActive ? 4 : 6}
                      py={2}
                      bg="transparent"
                      _hover={{
                        color: "blue.500",
                        bg: "transparent"
                      }}
                      _active={{
                        bg: "transparent"
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
              {user ? (
                <>
                  <Button as={RouterLink} to="/dashboard" variant="ghost" w="full" justifyContent="flex-start" leftIcon={<FaHome />} _focus={{ boxShadow: "none", outline: "none" }}>
                    Dashboard
                  </Button>
                  
                  {/* Mobile Notifications Link */}
                  <Button
                    leftIcon={<FaBell />}
                    onClick={handleViewNotifications}
                    variant="ghost"
                    size="sm"
                    w="full"
                    justifyContent="flex-start"
                    _focus={{ boxShadow: "none", outline: "none" }}
                  >
                    Notifications {notificationCount > 0 && `(${notificationCount})`}
                  </Button>
                  
                  <Button as={RouterLink} to="/profile" variant="ghost" w="full" justifyContent="flex-start" _focus={{ boxShadow: "none", outline: "none" }}>
                    Profile
                  </Button>
                  <Button onClick={signOut} variant="ghost" w="full" justifyContent="flex-start" _focus={{ boxShadow: "none", outline: "none" }}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Box 
                    as={RouterLink} 
                    to="/login" 
                    w="full" 
                    pl={6}
                    py={2}
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.700"
                    _hover={{
                      color: "blue.500",
                      textDecoration: "none"
                    }}
                    _focus={{
                      boxShadow: "none",
                      outline: "none"
                    }}
                  >
                    Log In
                  </Box>
                  <Button 
                    as={RouterLink} 
                    to="/signup" 
                    colorScheme="blue" 
                    w="full"
                    fontSize="sm"
                    mt={2}
                    _focus={{
                      boxShadow: "none",
                      outline: "none"
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </VStack>
          </Box>
        )}
      </Container>
    </Box>
  )
}

export { Navigation } 