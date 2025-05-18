import { Box, Flex, HStack, IconButton, Button, useColorModeValue, useDisclosure, Stack, Menu, MenuButton, MenuList, MenuItem, Avatar, Text, Badge, Tooltip } from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { BiGroup, BiClipboard, BiCalendar, BiLineChart } from 'react-icons/bi'
import { LuBellRing, LuHouse, LuMessageCircleMore, LuUpload } from 'react-icons/lu'
import { useState, useEffect } from 'react'
import { useFeedback } from './FeedbackProvider'
import { ShareComponent } from './ShareComponent'

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

const CoachLinks = [
  { name: 'Dashboard', path: '/coach/dashboard', icon: <BiLineChart /> },
  { name: 'My Athletes', path: '/coach/athletes', icon: <BiGroup /> },
  { name: 'Workouts', path: '/coach/workouts', icon: <BiClipboard /> },
  { name: 'Events', path: '/coach/events', icon: <BiCalendar /> },
  { name: 'Calendar', path: '/coach/calendar', icon: <BiCalendar /> },
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
  const { showFeedbackModal } = useFeedback()
  
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
            <Flex alignItems="center" gap={0}> {/* Remove gap as we're using mx in the style */}
              <IconButton
                as={RouterLink}
                to="/"
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
                title="Track & Field App for Coaches" 
                description="Check out this awesome Track & Field app for coaches and athletes!" 
              />
              
              {/* Notification Bell */}
              <Box position="relative" mx="18px"> {/* Match the new spacing */}
                <Tooltip label="Athlete notifications" hasArrow>
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
                  <MenuItem as={RouterLink} to="/coach/calendar">My Calendar</MenuItem>
                  <MenuItem onClick={showFeedbackModal}>Give Feedback</MenuItem>
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
                  leftIcon={<LuHouse size="20px" />}
                  variant="unstyled"
                  sx={cleanIconStyle}
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
                  sx={cleanIconStyle}
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
                  sx={cleanIconStyle}
                  textAlign="left"
                  justifyContent="flex-start"
                >
                  Notifications {notificationCount > 0 && `(${notificationCount})`}
                </Button>
                
                {/* Mobile Share Link */}
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
  )
} 