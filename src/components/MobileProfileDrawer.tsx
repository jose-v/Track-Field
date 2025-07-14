import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  VStack,
  HStack,
  Text,
  Button,
  Flex,
  IconButton,
  Avatar,
  Badge,
  Divider,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { FaTimes, FaBell, FaUser, FaCog, FaCreditCard, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfileDisplay } from '../hooks/useProfileDisplay';
import { useUnreadNotificationCount } from '../hooks/useUnreadNotificationCount';
import { getProfilePathForRole, getNotificationsPathForRole } from '../utils/roleUtils';

interface MobileProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileProfileDrawer: React.FC<MobileProfileDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, displayName, initials } = useProfileDisplay();
  const { unreadCount } = useUnreadNotificationCount();

  // Drawer colors
  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');
  const drawerText = useColorModeValue('gray.700', 'gray.200');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Handle navigation and close drawer
  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  // Get role-specific paths
  const profilePath = getProfilePathForRole(profile?.role);
  const notificationsPath = getNotificationsPathForRole(profile?.role);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      motionPreset="slideInBottom"
      closeOnOverlayClick={true}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        top="auto"
        height="auto"
        maxHeight="75vh"
        minHeight="300px"
        borderRadius="16px 16px 0 0"
        bg={drawerBg}
        border={`1px solid ${drawerBorder}`}
        boxShadow="2xl"
        margin="0"
        maxWidth="100vw"
        width="100vw"
        display="flex"
        flexDirection="column"
      >
        <ModalBody p={0} display="flex" flexDirection="column" overflowY="auto">
          {/* Header with Close Button */}
          <Flex 
            justify="space-between" 
            align="center" 
            p={4} 
            borderBottom={`1px solid ${drawerBorder}`}
            flexShrink={0}
          >
            <Text fontSize="lg" fontWeight="bold" color={drawerText}>
              Profile
            </Text>
            
            <IconButton
              aria-label="Close profile menu"
              icon={<FaTimes />}
              size="md"
              variant="ghost"
              borderRadius="full"
              onClick={onClose}
              color={drawerText}
              _hover={{ bg: buttonHoverBg }}
              fontSize="16px"
            />
          </Flex>

          {/* User Info Section */}
          <VStack spacing={4} align="stretch" p={6} pb={4}>
            {/* User Avatar and Name */}
            <HStack spacing={4} align="center">
              <Avatar
                size="md"
                name={displayName || 'User'}
                src={profile?.avatar_url || undefined}
                bg="blue.500"
                color="white"
              >
                {!profile?.avatar_url && (initials || '?')}
              </Avatar>
              <VStack align="start" spacing={0}>
                <Text fontSize="lg" fontWeight="bold" color={drawerText}>
                  {displayName || user?.email || 'User'}
                </Text>
              </VStack>
            </HStack>

            <Divider />

            {/* Action Items */}
            <VStack spacing={2} align="stretch">
              {/* Notifications */}
              <Button
                leftIcon={<Icon as={FaBell} color="white" />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="50px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => handleNavigation(notificationsPath)}
                position="relative"
              >
                <HStack justify="space-between" w="full">
                  <Text>Notifications</Text>
                  {unreadCount > 0 && (
                    <Badge
                      colorScheme="red"
                      variant="solid"
                      fontSize="xs"
                      minW="20px"
                      h="20px"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </HStack>
              </Button>

              {/* My Profile */}
              <Button
                leftIcon={<Icon as={FaUser} color="white" />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="50px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => handleNavigation(profilePath)}
              >
                My Profile
              </Button>

              {/* Settings */}
              <Button
                leftIcon={<Icon as={FaCog} color="white" />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="50px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => handleNavigation('/settings')}
              >
                Settings
              </Button>

              {/* Account & Billing */}
              <Button
                leftIcon={<Icon as={FaCreditCard} color="white" />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="50px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={() => handleNavigation('/account')}
              >
                Account & Billing
              </Button>

              <Divider />

              {/* Sign Out */}
              <Button
                leftIcon={<Icon as={FaSignOutAlt} color="white" />}
                variant="ghost"
                size="lg"
                justifyContent="flex-start"
                h="50px"
                color={drawerText}
                _hover={{ bg: buttonHoverBg }}
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 