import React, { useState } from 'react';
import { Box, Flex, Avatar, Text, useToast } from '@chakra-ui/react';
import { useSwipeable } from 'react-swipeable';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  avatar_url?: string;
}

const MobileNotifications: React.FC = () => {
  const [swipingNotificationId, setSwipingNotificationId] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [processingNotifications, setProcessingNotifications] = useState<Set<string>>(new Set());
  const [bigIcon, setBigIcon] = useState<boolean>(false);
  const toast = useToast();

  // Breakpoint from Ionic example
  const ANIMATION_BREAKPOINT = 70;

  // Mock data for testing
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Workout Assigned',
      message: 'New training plan has been assigned for tomorrow',
      is_read: false,
      created_at: '2024-01-15T10:30:00Z',
      avatar_url: undefined
    },
    {
      id: '2', 
      title: 'Meet Reminder',
      message: 'Track meet this Saturday at 9:00 AM',
      is_read: true,
      created_at: '2024-01-14T15:45:00Z',
      avatar_url: undefined
    }
  ];

  const handleSwipeRight = (notificationId: string) => {
    if (processingNotifications.has(notificationId)) {
      console.log('⏳ Already processing notification:', notificationId);
      return;
    }
    
    console.log('✅ WOULD mark as read:', notificationId);
    setProcessingNotifications(prev => new Set(prev).add(notificationId));
    
    // Simple feedback instead of database call
    toast({
      title: '📖 Would mark as read',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
    
    // Clear processing state after short delay
    setTimeout(() => {
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }, 500);
  };

  const handleSwipeLeft = (notificationId: string) => {
    if (processingNotifications.has(notificationId)) {
      console.log('⏳ Already processing notification:', notificationId);
      return;
    }
    
    console.log('✅ WOULD delete:', notificationId);
    setProcessingNotifications(prev => new Set(prev).add(notificationId));
    
    // Simple feedback instead of database call
    toast({
      title: '🗑️ Would delete',
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
    
    // Clear processing state after short delay
    setTimeout(() => {
      setProcessingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }, 500);
  };

  const getSwipeHandlers = (notificationId: string) => {
    return useSwipeable({
      onSwipedLeft: (eventData) => {
        console.log('✅ Swipe left ended with deltaX:', eventData.deltaX);
        
        // Only trigger action if past breakpoint (like Ionic example)
        if (Math.abs(eventData.deltaX) >= ANIMATION_BREAKPOINT && !processingNotifications.has(notificationId)) {
          console.log('🎯 Breakpoint reached! Triggering delete action');
          handleSwipeLeft(notificationId);
        } else {
          console.log('❌ Breakpoint not reached, no action');
        }
        
        // Reset visual state
        setSwipingNotificationId(null);
        setSwipeDirection(null);
        setBigIcon(false);
      },
      onSwipedRight: (eventData) => {
        console.log('✅ Swipe right ended with deltaX:', eventData.deltaX);
        
        // Only trigger action if past breakpoint (like Ionic example)
        if (Math.abs(eventData.deltaX) >= ANIMATION_BREAKPOINT && !processingNotifications.has(notificationId)) {
          console.log('🎯 Breakpoint reached! Triggering mark read action');
          handleSwipeRight(notificationId);
        } else {
          console.log('❌ Breakpoint not reached, no action');
        }
        
        // Reset visual state
        setSwipingNotificationId(null);
        setSwipeDirection(null);
        setBigIcon(false);
      },
      onSwiping: (eventData) => {
        console.log('🔄 Swiping deltaX:', eventData.deltaX, 'breakpoint:', ANIMATION_BREAKPOINT);
        
        // Visual feedback only (like Ionic onMove)
        if (Math.abs(eventData.deltaX) > 20) {
          setSwipingNotificationId(notificationId);
          setSwipeDirection(eventData.deltaX > 0 ? 'right' : 'left');
          
          // Big icon when past breakpoint (like Ionic example)
          setBigIcon(Math.abs(eventData.deltaX) >= ANIMATION_BREAKPOINT);
          
          console.log('📊 Visual state - bigIcon:', Math.abs(eventData.deltaX) >= ANIMATION_BREAKPOINT);
        }
      },
      onSwiped: () => {
        console.log('🛑 Swipe gesture ended');
        // Keep visual state until onSwipedLeft/Right handles it
      },
      trackMouse: true,
      trackTouch: true,
      delta: 20, // Low threshold for starting visual feedback
      preventScrollOnSwipe: true,
      swipeDuration: 1000,
      touchEventOptions: { passive: false },
      rotationAngle: 0,
    });
  };

  const handleNotificationClick = (notificationId: string) => {
    if (swipingNotificationId) return; // Prevent click during swipe
    console.log('Clicked notification:', notificationId);
  };

  return (
    <Box w="100%" minH="100vh">
      {mockNotifications.map((notification) => {
        const swipeHandlers = getSwipeHandlers(notification.id);
        const isCurrentlySwiping = swipingNotificationId === notification.id;
        
        return (
          <Box
            key={notification.id}
            {...swipeHandlers}
            position="relative"
            overflow="hidden"
          >
            {/* Background action indicators */}
            {isCurrentlySwiping && (
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                zIndex={0}
                bg={swipeDirection === 'right' ? 
                  (bigIcon ? 'blue.300' : 'blue.200') : 
                  (bigIcon ? 'red.300' : 'red.200')
                }
                display="flex"
                alignItems="center"
                justifyContent={swipeDirection === 'right' ? 'flex-start' : 'flex-end'}
                px={6}
              >
                <Text
                  color={swipeDirection === 'right' ? 'blue.800' : 'red.800'}
                  fontWeight="bold"
                  fontSize={bigIcon ? "xl" : "lg"}
                  transform={bigIcon ? "scale(1.2)" : "scale(1)"}
                  transition="all 0.2s ease"
                >
                  {swipeDirection === 'right' ? 
                    (bigIcon ? '📖 RELEASE TO MARK READ' : '📖 Keep Swiping...') : 
                    (bigIcon ? '🗑️ RELEASE TO DELETE' : '🗑️ Keep Swiping...')
                  }
                </Text>
              </Box>
            )}

            {/* Main notification content */}
            <Flex
              align="center"
              p={4}
              borderBottom="1px solid"
              borderColor="gray.200"
              minH="80px"
              position="relative"
              zIndex={1}
              bg="white"
              style={{
                transform: isCurrentlySwiping && swipeDirection ? 
                  `translateX(${swipeDirection === 'right' ? 
                    (bigIcon ? '100px' : '50px') : 
                    (bigIcon ? '-100px' : '-50px')
                  })` : 
                  'translateX(0)',
                transition: isCurrentlySwiping ? 'none' : 'transform 0.3s ease',
                opacity: isCurrentlySwiping ? (bigIcon ? 0.7 : 0.85) : 1,
                boxShadow: bigIcon ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
              }}
              onClick={() => handleNotificationClick(notification.id)}
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
                  fontWeight={notification.is_read ? "normal" : "bold"}
                  fontSize="md"
                  color={notification.is_read ? "gray.600" : "black"}
                  noOfLines={1}
                  mb={1}
                >
                  {notification.title}
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.500"
                  noOfLines={1}
                >
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
        );
      })}
    </Box>
  );
};

export default MobileNotifications;
