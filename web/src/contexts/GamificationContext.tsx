import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { registerNotificationHandlers } from '../services/gamificationIntegration';
import { useGamificationNotification } from '../features/gamification/GamificationNotification';
import type { Badge } from '../types/gamification';

interface GamificationContextProps {
  showBadgeNotification: (badge: Badge) => string;
  showPointsNotification: (points: number, reason: string) => string;
  showLevelUpNotification: (level: number, title: string) => string;
  showStreakNotification: (days: number) => string;
}

// Create the context with default values
const GamificationContext = createContext<GamificationContextProps>({
  showBadgeNotification: () => '',
  showPointsNotification: () => '',
  showLevelUpNotification: () => '',
  showStreakNotification: () => '',
});

// Hook to use the gamification context
export const useGamification = () => useContext(GamificationContext);

// Provider component
export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const {
    showBadgeNotification,
    showPointsNotification,
    showLevelUpNotification,
    showStreakNotification,
    NotificationsContainer
  } = useGamificationNotification();

  // Register notification handlers with gamificationIntegration service
  useEffect(() => {
    if (user) {
      registerNotificationHandlers({
        onBadge: (badge: Badge) => {
          showBadgeNotification(badge);
        },
        onPoints: (points: number, reason: string) => {
          showPointsNotification(points, reason);
        },
        onLevelUp: (level: number, title: string) => {
          showLevelUpNotification(level, title);
        },
        onStreak: (days: number) => {
          showStreakNotification(days);
        }
      });
    }
  }, [user, showBadgeNotification, showPointsNotification, showLevelUpNotification, showStreakNotification]);

  const value = {
    showBadgeNotification,
    showPointsNotification,
    showLevelUpNotification,
    showStreakNotification
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
      <NotificationsContainer />
    </GamificationContext.Provider>
  );
}; 