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
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navigation = () => {
  const { isOpen, onToggle } = useDisclosure()
  const { user, signOut } = useAuth()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

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
    >
      <Box w="100%" px={8}>
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Logo */}
          <RouterLink to="/">
            <Text fontWeight="bold" fontSize="xl" color="blue.500">
              Track & Field
            </Text>
          </RouterLink>

          {/* Desktop Navigation */}
          <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => (
              <RouterLink key={item.path} to={item.path}>
                <Button variant="ghost">{item.label}</Button>
              </RouterLink>
            ))}
          </HStack>

          {/* Auth Buttons */}
          <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
            {user ? (
              <Menu>
                <MenuButton
                  as={Button}
                  rounded="full"
                  variant="link"
                  cursor="pointer"
                  minW={0}
                >
                  <Avatar
                    size="sm"
                    name={user.email}
                    bg="blue.500"
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
            ) : (
              <>
                <Button as={RouterLink} to="/login" variant="ghost">
                  Log In
                </Button>
                <Button as={RouterLink} to="/register" colorScheme="blue">
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
          />
        </Flex>

        {/* Mobile Navigation */}
        {isOpen && (
          <Box display={{ base: 'block', md: 'none' }} pb={4}>
            <VStack spacing={4} align="stretch">
              {navItems.map((item) => (
                <RouterLink key={item.path} to={item.path}>
                  <Button variant="ghost" w="full" justifyContent="flex-start">
                    {item.label}
                  </Button>
                </RouterLink>
              ))}
              {user ? (
                <>
                  <Button as={RouterLink} to="/dashboard" variant="ghost" w="full" justifyContent="flex-start">
                    Dashboard
                  </Button>
                  <Button as={RouterLink} to="/profile" variant="ghost" w="full" justifyContent="flex-start">
                    Profile
                  </Button>
                  <Button onClick={signOut} variant="ghost" w="full" justifyContent="flex-start">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button as={RouterLink} to="/login" variant="ghost" w="full" justifyContent="flex-start">
                    Log In
                  </Button>
                  <Button as={RouterLink} to="/register" colorScheme="blue" w="full">
                    Sign Up
                  </Button>
                </>
              )}
            </VStack>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export { Navigation } 