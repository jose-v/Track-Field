import React from 'react';
import {
  Box,
  VStack,
  Text,
  Avatar,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface MobileNotificationsProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAsArchived: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  isProcessing: boolean;
  userProfiles: { [key: string]: any };
  activeFilter: 'unread' | 'read' | 'archived';
  setActiveFilter: (filter: 'unread' | 'read' | 'archived') => void;
  handleAthleteRequest?: (notificationId: string, athleteId: string, approved: boolean) => Promise<void>;
  handleCoachRequest?: (notificationId: string, coachId: string, accepted: boolean) => Promise<void>;
}

export const MobileNotifications: React.FC<MobileNotificationsProps> = ({
  notifications,
  onMarkAsRead,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');

  // Mock data for testing
  const mockNotifications = [
    {
      id: '1',
      title: 'Test Notification 1',
      message: 'This is a test notification message',
      created_at: new Date().toISOString(),
      is_read: false,
    },
    {
      id: '2', 
      title: 'Test Notification 2',
      message: 'Another test notification message',
      created_at: new Date().toISOString(),
      is_read: true,
    },
  ];

  const displayNotifications = notifications.length > 0 ? notifications : mockNotifications;

  return (
    <Box w="100%" bg={bgColor}>
      <Text p={4} fontSize="lg" fontWeight="bold" color={textColor}>
        Mobile Notifications ({displayNotifications.length})
      </Text>
      
      <VStack spacing={0} align="stretch">
        {displayNotifications.map((notification) => (
          <Box
            key={notification.id}
            p={4}
            borderBottom="1px"
            borderColor={borderColor}
            cursor="pointer"
            onClick={() => {
              console.log('Clicked notification:', notification.id);
              if (!notification.is_read) {
                onMarkAsRead(notification.id);
              }
            }}
            _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
          >
            <Flex align="center">
              <Avatar size="sm" mr={3} />
              <Box flex={1}>
                <Text
                  fontSize="md"
                  fontWeight={notification.is_read ? 'normal' : 'bold'}
                  color={textColor}
                  noOfLines={1}
                  mb={1}
                >
                  {notification.title}
                </Text>
                <Text fontSize="sm" color={subtitleColor} noOfLines={2}>
                  {notification.message}
                </Text>
              </Box>
              <Box>
                {!notification.is_read && (
                  <Box w={2} h={2} bg="blue.500" borderRadius="full" />
                )}
              </Box>
            </Flex>
          </Box>
        ))}
      </VStack>

      {displayNotifications.length === 0 && (
        <Box textAlign="center" py={12}>
          <Text color={subtitleColor}>No notifications</Text>
        </Box>
      )}
    </Box>
  );
};