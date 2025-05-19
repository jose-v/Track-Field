import { useLocation } from 'react-router-dom';
import { NavLink } from './BaseLayout';
import { LuUsers, LuCalendarClock, LuClipboardList } from 'react-icons/lu';
import { BiLineChart } from 'react-icons/bi';
import { IoFitnessOutline } from 'react-icons/io5';
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
      icon: <BiLineChart />
    },
    {
      name: 'Athletes',
      path: '/coach/athletes',
      icon: <LuUsers />
    },
    {
      name: 'Workouts',
      path: '/coach/workouts',
      icon: <IoFitnessOutline />
    },
    {
      name: 'Schedule',
      path: '/coach/schedule',
      icon: <LuCalendarClock />
    },
    {
      name: 'Reports',
      path: '/coach/reports',
      icon: <LuClipboardList />
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