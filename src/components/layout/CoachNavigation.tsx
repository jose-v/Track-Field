import { useLocation } from 'react-router-dom';
import { NavLink } from './BaseLayout';
import { LuUsers, LuCalendarClock, LuClipboardList, LuBell } from 'react-icons/lu';
import { FaUserPlus, FaCog, FaWrench, FaUser } from 'react-icons/fa';
import { IoFitnessOutline } from 'react-icons/io5';
import { FaTachometerAlt, FaCalendarAlt } from 'react-icons/fa';
import { ReactNode } from 'react';

// Coach navigation links
export interface CoachNavConfig {
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

export function useCoachNavigation(): CoachNavConfig & { isCurrentPathActive: (path: string) => boolean } {
  const location = useLocation();
  
  // Function to check if a path is active
  const isCurrentPathActive = (path: string): boolean => {
    // Dashboard is active only when exact match
    if (path === '/coach/dashboard') {
      return location.pathname === '/coach/dashboard';
    }
    // For other paths, check if the current path starts with the link path (excluding dashboard)
    return location.pathname.startsWith(path);
  };
  
  // Coach navigation links
  const navLinks = [
    {
      name: 'Dashboard',
      path: '/coach/dashboard',
      icon: <FaTachometerAlt />
    },
    {
      name: 'Teams & Athletes',
      path: '/coach/athletes',
      icon: <LuUsers />
    },
    {
      name: 'Join Team',
      path: '/join-team',
      icon: <FaUserPlus />
    },
    {
      name: 'Training Plans',
      path: '/coach/training-plans',
      icon: <FaCalendarAlt />
    },
    {
      name: 'Workout Creator',
      path: '/coach/workout-creator-new',
      icon: <FaWrench />
    },
    {
      name: 'Calendar',
      path: '/coach/calendar',
      icon: <LuCalendarClock />
    },
    {
      name: 'Meets',
      path: '/coach/meets',
      icon: <LuCalendarClock />
    },
    {
      name: 'Reports',
      path: '/coach/stats',
      icon: <LuClipboardList />
    },
    {
      name: 'Settings',
      path: '/coach/settings',
      icon: <FaCog />
    },
    {
      name: 'Profile',
      path: '/coach/profile',
      icon: <FaUser />
    },
    {
      name: 'Notifications',
      path: '/coach/notifications',
      icon: <LuBell />
    }
  ];
  
  // Coach configuration
  const coachNavConfig: CoachNavConfig = {
    navLinks,
    dashboardPath: '/coach/dashboard',
    notificationsPath: '/coach/notifications',
    storageKey: 'coach_notification_count',
    shareTitle: 'Track & Field Coach Portal',
    shareDescription: 'Join me on the Track & Field Coach Portal to manage athletes and track progress!',
    roleBadge: {
      text: 'COACH',
      colorScheme: 'purple'
    },
    roleTitle: 'Coach'
  };
  
  return {
    ...coachNavConfig,
    isCurrentPathActive
  };
} 