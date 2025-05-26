import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Box,
  Image,
  Flex,
  HStack,
  VStack,
  Text,
  useDisclosure,
  Slide,
  SlideFade,
} from '@chakra-ui/react';
import type { Badge } from '../../types/gamification';

interface GamificationNotificationProps {
  type: 'badge' | 'level' | 'points' | 'streak';
  title: string;
  message: string;
  iconUrl?: string;
  badgeCode?: string;
  points?: number;
  level?: number;
  isOpen: boolean;
  onClose: () => void;
  autoCloseAfter?: number; // in milliseconds, defaults to 5000 (5 seconds)
}

export function GamificationNotification({
  type,
  title,
  message,
  iconUrl,
  badgeCode,
  points,
  level,
  isOpen,
  onClose,
  autoCloseAfter = 5000
}: GamificationNotificationProps) {
  useEffect(() => {
    if (isOpen && autoCloseAfter > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseAfter);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen, onClose, autoCloseAfter]);

  // Determine icon based on notification type
  const getIcon = () => {
    if (iconUrl) {
      return iconUrl;
    }
    
    if (badgeCode) {
      return `/badges/${badgeCode}.svg`;
    }
    
    // Default icons based on type
    switch (type) {
      case 'badge':
        return '/badges/badge_default.svg';
      case 'level':
        return '/icons/level_up.svg';
      case 'points':
        return '/icons/points.svg';
      case 'streak':
        return '/icons/streak.svg';
      default:
        return '/icons/notification.svg';
    }
  };

  // Determine color scheme based on notification type
  const getColorScheme = () => {
    switch (type) {
      case 'badge':
        return 'purple';
      case 'level':
        return 'green';
      case 'points':
        return 'blue';
      case 'streak':
        return 'orange';
      default:
        return 'blue';
    }
  };

  if (!isOpen) return null;

  return (
    <SlideFade in={isOpen} offsetY="-20px">
      <Box
        position="fixed"
        top="20px"
        right="20px"
        zIndex={9999}
        maxW="sm"
        width="100%"
      >
        <Alert
          status="success"
          variant="solid"
          borderRadius="md"
          bg={`${getColorScheme()}.500`}
          color="white"
          boxShadow="lg"
          overflow="hidden"
          padding={0}
        >
          <Flex width="100%">
            <Box width="80px" height="80px" bg={`${getColorScheme()}.600`} display="flex" alignItems="center" justifyContent="center">
              <Image 
                src={getIcon()} 
                alt={title} 
                boxSize="60px" 
                objectFit="contain" 
                fallbackSrc="/icons/notification.svg"
              />
            </Box>
            
            <VStack 
              flex="1" 
              p={4} 
              alignItems="flex-start" 
              spacing={1}
              justifyContent="center"
            >
              <AlertTitle fontSize="lg" fontWeight="bold">
                {title}
              </AlertTitle>
              <AlertDescription fontSize="sm">
                {message}
              </AlertDescription>
            </VStack>
            
            <CloseButton 
              position="absolute" 
              right={2} 
              top={2} 
              color="white" 
              onClick={onClose} 
            />
          </Flex>
        </Alert>
      </Box>
    </SlideFade>
  );
}

// Hook for managing gamification notifications
export function useGamificationNotification() {
  const [notifications, setNotifications] = useState<{
    type: 'badge' | 'level' | 'points' | 'streak';
    title: string;
    message: string;
    iconUrl?: string;
    badgeCode?: string;
    points?: number;
    level?: number;
    id: string;
  }[]>([]);

  // Show a notification
  const showNotification = (notification: {
    type: 'badge' | 'level' | 'points' | 'streak';
    title: string;
    message: string;
    iconUrl?: string;
    badgeCode?: string;
    points?: number;
    level?: number;
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  // Close a notification by ID
  const closeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Show a badge notification
  const showBadgeNotification = (badge: Badge) => {
    return showNotification({
      type: 'badge',
      title: `New Badge: ${badge.name}`,
      message: badge.description,
      badgeCode: badge.code,
      iconUrl: badge.icon_url || undefined
    });
  };

  // Show a level up notification
  const showLevelUpNotification = (level: number, title: string) => {
    return showNotification({
      type: 'level',
      title: `Level Up! Level ${level}`,
      message: `You've reached ${title} status!`,
      level
    });
  };

  // Show a points notification
  const showPointsNotification = (points: number, reason: string) => {
    return showNotification({
      type: 'points',
      title: `+${points} Points`,
      message: reason,
      points
    });
  };

  // Show a streak notification
  const showStreakNotification = (days: number) => {
    return showNotification({
      type: 'streak',
      title: `${days}-Day Streak!`,
      message: `You've been active for ${days} days in a row!`
    });
  };

  // Render all active notifications
  const NotificationsContainer = () => {
    if (notifications.length === 0) return null;

    // Show only the most recent notification
    const notification = notifications[notifications.length - 1];

    return (
      <GamificationNotification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        iconUrl={notification.iconUrl}
        badgeCode={notification.badgeCode}
        points={notification.points}
        level={notification.level}
        isOpen={true}
        onClose={() => closeNotification(notification.id)}
      />
    );
  };

  return {
    showNotification,
    closeNotification,
    showBadgeNotification,
    showLevelUpNotification,
    showPointsNotification,
    showStreakNotification,
    NotificationsContainer
  };
} 