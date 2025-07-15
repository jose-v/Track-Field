import React, { useState } from 'react';
import { Box, Flex, Avatar, Text, useToast } from '@chakra-ui/react';
import SwipeToDelete from 'react-swipe-to-delete-component';
import { FaTrash, FaEnvelopeOpen } from 'react-icons/fa';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  avatar_url?: string;
}

const MobileNotifications: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('Ready to swipe');
  const toast = useToast();

  // Mock data for testing
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Workout Assigned',
      message: 'New training plan has been assigned for tomorrow',
      is_read: false,
      created_at: '2024-01-15T10:30:00Z',
      avatar_url: undefined,
    },
    {
      id: '2',
      title: 'Meet Reminder',
      message: 'Track meet this Saturday at 9:00 AM',
      is_read: true,
      created_at: '2024-01-14T15:45:00Z',
      avatar_url: undefined,
    },
  ];

  const handleDelete = (notificationId: string) => {
    setDebugInfo(`Deleted notification ${notificationId}`);
    toast({
      title: '🗑️ Would delete',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
  };

  const handleMarkAsRead = (notificationId: string) => {
    setDebugInfo(`Marked as read notification ${notificationId}`);
    toast({
      title: '📖 Would mark as read',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
  };

  const deleteBackground = (
    <Box
      w="100%"
      h="100%"
      bg="red.500"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="flex-end"
      pr={8}
    >
      <Box color="white" fontSize="4xl" mb={1}>
        <FaTrash />
      </Box>
      <Text color="white" fontWeight="bold" fontSize="lg">
        Delete
      </Text>
    </Box>
  );

  const markAsReadBackground = (
    <Box
      w="100%"
      h="100%"
      bg="blue.400"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="flex-start"
      pl={8}
    >
      <Box color="white" fontSize="4xl" mb={1}>
        <FaEnvelopeOpen />
      </Box>
      <Text color="white" fontWeight="bold" fontSize="lg">
        Read
      </Text>
    </Box>
  );

  return (
    <Box w="100%" minH="100vh">
      {/* Visual Debug Overlay */}
      <Box
        position="sticky"
        top="0"
        bg="yellow.100"
        p={2}
        borderBottom="2px solid"
        borderColor="yellow.300"
        zIndex={10}
      >
        <Text fontSize="sm" fontWeight="bold" color="black">
          DEBUG: {debugInfo}
        </Text>
      </Box>

      {mockNotifications.map((notification) => (
        <SwipeToDelete
          key={notification.id}
          onDelete={() => handleDelete(notification.id)}
          deleteSwipe={deleteBackground}
          onCancel={() => setDebugInfo(`Canceled swipe on ${notification.id}`)}
          deleteWidth={120}
          deleteHeight="auto"
          disabled={false}
          rightSwipe={!notification.is_read}
          rightSwipeItem={markAsReadBackground}
          onRightSwipe={() => handleMarkAsRead(notification.id)}
          rightSwipeWidth={120}
        >
          <Box
            bg="white"
            borderBottom="1px solid"
            borderColor="gray.200"
            onClick={() => setDebugInfo(`Clicked notification ${notification.id}`)}
          >
            <Flex
              align="center"
              p={4}
              minH="80px"
            >
              {/* Avatar */}
              <Avatar
                size="md"
                src={notification.avatar_url}
                name={notification.title}
                mr={3}
                flexShrink={0}
              />

              {/* Content */}
              <Box flex="1" minW="0">
                <Text
                  fontWeight={notification.is_read ? 'normal' : 'bold'}
                  fontSize="md"
                  color={notification.is_read ? 'gray.600' : 'black'}
                  noOfLines={1}
                  mb={1}
                >
                  {notification.title}
                </Text>
                <Text fontSize="sm" color="gray.500" noOfLines={1}>
                  {notification.message}
                </Text>
              </Box>

              {/* Read indicator */}
              {!notification.is_read && (
                <Box
                  w="8px"
                  h="8px"
                  bg="blue.500"
                  borderRadius="full"
                  ml={3}
                  flexShrink={0}
                />
              )}
            </Flex>
          </Box>
        </SwipeToDelete>
      ))}
    </Box>
  );
};

export default MobileNotifications;