import { Box, Flex, HStack, IconButton, Button, useColorModeValue, useDisclosure, Stack, Menu, MenuButton, MenuList, MenuItem, Avatar, Text, Badge, Tooltip } from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { FaHome, FaUserFriends, FaCalendarAlt, FaClipboardList, FaChartLine, FaBell } from 'react-icons/fa'
import { useState, useEffect } from 'react'

const CoachLinks = [
  { name: 'Dashboard', path: '/coach/dashboard', icon: <FaChartLine /> },
  { name: 'My Athletes', path: '/coach/athletes', icon: <FaUserFriends /> },
  { name: 'Workouts', path: '/coach/workouts', icon: <FaClipboardList /> },
  { name: 'Events', path: '/coach/events', icon: <FaCalendarAlt /> },
  { name: 'Profile', path: '/coach/profile', icon: null },
]

function NavLink({ name, path, icon }: { name: string; path: string; icon: React.ReactNode | null }) {
  const location = useLocation()
  const isActive = location.pathname === path
  
  // Create button props
  const buttonProps: any = {
    as: RouterLink,
    to: path,
    variant: isActive ? 'solid' : 'ghost',
    colorScheme: isActive ? 'blue' : undefined,
    size: "sm",
  }
  
  // Only add leftIcon if icon exists
  if (icon) {
    buttonProps.leftIcon = icon
  }
  
  return (
    <Button {...buttonProps}>
      {name}
    </Button>
  )
}

export function CoachLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  // State for notifications
  const [notificationCount, setNotificationCount] = useState(0)
  
  // Simulate getting new notifications (in a real app, this would come from a backend service)
  useEffect(() => {
    // Mock notifications for demo purposes
    const storedCount = localStorage.getItem('coachNotificationCount')
    if (storedCount) {
      setNotificationCount(parseInt(storedCount, 10))
    } else {
      // Default to 5 notifications for coaches (more than athletes)
      const defaultCount = 5
      setNotificationCount(defaultCount)
      localStorage.setItem('coachNotificationCount', defaultCount.toString())
    }
  }, [])
  
  // Handle viewing notifications
  const handleViewNotifications = () => {
    // Navigate to team page in a real app
    window.location.href = '/coach/athletes'
    // Clear notification count when viewed
    setNotificationCount(0)
    localStorage.setItem('coachNotificationCount', '0')
  }
  
  // Get full name for avatar or fallback to email if profile not loaded yet
  const fullName = profile ? 
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
    (user?.email || '')
  
  // Avatar URL from profile
  const avatarUrl = profile?.avatar_url

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
              <RouterLink to="/coach/dashboard">
                <HStack>
                  <Text fontWeight="bold" fontSize="xl" color="blue.500">Track & Field</Text>
                  <Badge colorScheme="purple" fontSize="0.8em" ml={1}>Coach</Badge>
                </HStack>
              </RouterLink>
              <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
                {CoachLinks.map((link) => (
                  <NavLink key={link.name} {...link} />
                ))}
              </HStack>
            </HStack>
            <Flex alignItems="center" gap={4}>
              <IconButton
                as={RouterLink}
                to="/"
                icon={<FaHome />}
                aria-label="Home"
                colorScheme="blue"
                variant="ghost"
                size="md"
              />
              
              {/* Notification Bell */}
              <Box position="relative">
                <Tooltip label="Athlete notifications" hasArrow>
                  <IconButton
                    icon={<FaBell />}
                    aria-label="Notifications"
                    colorScheme="purple"
                    variant="ghost"
                    size="md"
                    onClick={handleViewNotifications}
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
                <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
                  <Avatar size="sm" name={fullName} src={avatarUrl} />
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/coach/profile">Coach Profile</MenuItem>
                  <MenuItem as={RouterLink} to="/coach/athletes">My Athletes</MenuItem>
                  <MenuItem onClick={signOut}>Sign out</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </Flex>
          {isOpen ? (
            <Box pb={4} display={{ md: 'none' }} px={8}>
              <Stack as="nav" spacing={4}>
                {CoachLinks.map((link) => (
                  <NavLink key={link.name} {...link} />
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
                
                {/* Mobile Notifications Link */}
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
  )
} 