import { Box, Flex, HStack, IconButton, Button, useColorModeValue, useDisclosure, Stack, Menu, MenuButton, MenuList, MenuItem, Avatar, Text } from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FaHome } from 'react-icons/fa'

const Links = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Workouts', path: '/workouts' },
  { name: 'Team', path: '/team' },
  { name: 'Events', path: '/events' },
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
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

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
              <Menu>
                <MenuButton as={Button} rounded="full" variant="link" cursor="pointer" minW={0}>
                  <Avatar size="sm" name={user.email} />
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                  <MenuItem onClick={signOut}>Sign out</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          </Flex>
          {isOpen ? (
            <Box pb={4} display={{ md: 'none' }} px={8}>
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