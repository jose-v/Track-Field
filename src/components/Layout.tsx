import { Box, Flex, HStack, IconButton, Button, useColorModeValue, useDisclosure, Stack, Menu, MenuButton, MenuList, MenuItem, Avatar, Text, Badge, Tooltip } from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { FaHome, FaBell } from 'react-icons/fa'
import { PageContainer } from './PageContainer'
import { useState, useEffect } from 'react'

const Links = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Workouts', path: '/workouts' },
  { name: 'Team', path: '/team' },
  { name: 'Events', path: '/private-events' },
  { name: 'Profile', path: '/profile' },
]

function NavLink({ name, path }: { name: string; path: string }) {
  const location = useLocation()
  const isActive = location.pathname === path
  return (
    <Button
      as={RouterLink}
      to={path}
      variant={isActive ? 'solid' : 'ghost'}
      colorScheme={isActive ? 'blue' : undefined}
      size="sm"
    >
      {name}
    </Button>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
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
    const storedCount = localStorage.getItem('notificationCount')
    if (storedCount) {
      setNotificationCount(parseInt(storedCount, 10))
    } else {
      // Default to 3 notifications for demo
      const defaultCount = 3
      setNotificationCount(defaultCount)
      localStorage.setItem('notificationCount', defaultCount.toString())
    }
  }, [])
  
  // Handle viewing notifications
  const handleViewNotifications = () => {
    // Navigate to team page in a real app, you might open a dropdown instead
    window.location.href = '/team'
    // Clear notification count when viewed
    setNotificationCount(0)
    localStorage.setItem('notificationCount', '0')
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
          <PageContainer>
            <Flex h={16} alignItems="center" justifyContent="space-between">
              <IconButton
                size="md"
                icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
                aria-label="Open Menu"
                display={{ md: 'none' }}
                onClick={isOpen ? onClose : onOpen}
              />
              <HStack spacing={8} alignItems="center">
                <RouterLink to="/dashboard">
                  <Text fontWeight="bold" fontSize="xl" color="blue.500">Track & Field</Text>
                </RouterLink>
                <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
                  {Links.map((link) => (
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
                  <Tooltip label="Team post notifications" hasArrow>
                    <IconButton
                      icon={<FaBell />}
                      aria-label="Notifications"
                      colorScheme="blue"
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
                    <Avatar 
                      size="sm" 
                      name={fullName} 
                      src={avatarUrl || undefined}
                    />
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                    <MenuItem onClick={signOut}>Sign out</MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            </Flex>
            {isOpen ? (
              <Box pb={4} display={{ md: 'none' }}>
                <Stack as="nav" spacing={4}>
                  {Links.map((link) => (
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
          </PageContainer>
        </Box>
      )}
      <Box pt={user ? 20 : 0} w="full">
        <PageContainer py={6}>
          {children}
        </PageContainer>
      </Box>
    </Box>
  )
} 