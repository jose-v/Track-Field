import { useLocation } from 'react-router-dom';
import { NavLink } from './BaseLayout';
import { BiRun, BiUser, BiCalendar, BiLineChart, BiDish, BiMoon } from 'react-icons/bi';
import { ReactNode } from 'react';

// Athlete navigation links
export interface AthleteNavConfig {
  navLinks: {
    name: string;
    path: string;
    icon: ReactNode | null;
  }[];
  dashboardPath: string;
  notificationsPath: string;
  storageKey: string;
  shareTitle: string;
  shareDescription: string;
  roleBadge: {
    text: string;
    colorScheme: string;
  };
  roleTitle: string;
}

export function useAthleteNavigation(): AthleteNavConfig & { isCurrentPathActive: (path: string) => boolean } {
  const location = useLocation();
  
  // Function to check if a path is active
  const isCurrentPathActive = (path: string): boolean => {
    // Dashboard is active only when exact match
    if (path === '/athlete/dashboard') {
      return location.pathname === '/athlete/dashboard';
    }
    // For other paths, check if the current path starts with the link path (excluding dashboard)
    return location.pathname.startsWith(path);
  };
  
  // Athlete navigation links
  const navLinks = [
    {
      name: 'Dashboard',
      path: '/athlete/dashboard',
      icon: <BiLineChart />
    },
    {
      name: 'My Workouts',
      path: '/athlete/workouts',
      icon: <BiRun />
    },
    {
      name: 'Events',
      path: '/athlete/events',
      icon: <BiCalendar />
    },
    {
      name: 'Calendar',
      path: '/athlete/calendar',
      icon: <BiCalendar />
    },
    {
      name: 'Nutrition',
      path: '/athlete/nutrition',
      icon: <BiDish />
    },
    {
      name: 'Sleep',
      path: '/athlete/sleep',
      icon: <BiMoon />
    },
    {
      name: 'Profile',
      path: '/athlete/profile',
      icon: <BiUser />
    }
  ];
  
  // Athlete configuration
  const athleteNavConfig: AthleteNavConfig = {
    navLinks,
    dashboardPath: '/athlete/dashboard',
    notificationsPath: '/athlete/notifications',
    storageKey: 'athlete_notification_count',
    shareTitle: 'Track & Field Athlete Portal',
    shareDescription: 'Join me on the Track & Field Athlete Portal to track your workouts and progress!',
    roleBadge: {
      text: 'ATHLETE',
      colorScheme: 'green'
    },
    roleTitle: 'Athlete'
  };
  
  return {
    ...athleteNavConfig,
    isCurrentPathActive
  };
} 