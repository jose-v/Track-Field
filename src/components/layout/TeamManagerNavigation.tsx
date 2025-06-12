import { useLocation } from 'react-router-dom';
import { NavLink } from './BaseLayout';
import { LuUsers, LuCalendarClock, LuClipboardList, LuBell, LuTrophy, LuShield } from 'react-icons/lu';
import { IoFitnessOutline } from 'react-icons/io5';
import { FaTachometerAlt, FaCalendarAlt, FaUserTie, FaUniversity } from 'react-icons/fa';
import { ReactNode } from 'react';

// Team Manager navigation links
export interface TeamManagerNavConfig {
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

export function useTeamManagerNavigation(): TeamManagerNavConfig & { isCurrentPathActive: (path: string) => boolean } {
  const location = useLocation();
  
  // Function to check if a path is active
  const isCurrentPathActive = (path: string): boolean => {
    // Dashboard is active only when exact match
    if (path === '/team-manager/dashboard') {
      return location.pathname === '/team-manager/dashboard';
    }
    // For other paths, check if the current path starts with the link path (excluding dashboard)
    return location.pathname.startsWith(path);
  };
  
  // Team Manager navigation links
  const navLinks = [
    {
      name: 'Dashboard',
      path: '/team-manager/dashboard',
      icon: <FaTachometerAlt />
    },
    {
      name: 'Institution Profile',
      path: '/team-manager/profile',
      icon: <FaUniversity />
    },
    {
      name: 'Teams',
      path: '/team-manager/teams',
      icon: <LuTrophy />
    },
    {
      name: 'Coaches',
      path: '/team-manager/coaches',
      icon: <FaUserTie />
    },
    {
      name: 'Athletes',
      path: '/team-manager/athletes',
      icon: <LuUsers />
    },
    {
      name: 'Training Plans',
      path: '/team-manager/training-plans',
      icon: <FaCalendarAlt />
    },
    {
      name: 'Workout Creator',
      path: '/team-manager/workout-creator',
      icon: <IoFitnessOutline />
    },
    {
      name: 'Calendar',
      path: '/team-manager/calendar',
      icon: <LuCalendarClock />
    },
    {
      name: 'Meets',
      path: '/team-manager/meets',
      icon: <LuCalendarClock />
    },
    {
      name: 'Reports',
      path: '/team-manager/stats',
      icon: <LuClipboardList />
    },
    {
      name: 'Admin',
      path: '/team-manager/admin',
      icon: <LuShield />
    },
    {
      name: 'Notifications',
      path: '/team-manager/notifications',
      icon: <LuBell />
    }
  ];
  
  // Team Manager configuration
  const teamManagerNavConfig: TeamManagerNavConfig = {
    navLinks,
    dashboardPath: '/team-manager/dashboard',
    notificationsPath: '/team-manager/notifications',
    storageKey: 'team_manager_notification_count',
    shareTitle: 'Track & Field Team Manager Portal',
    shareDescription: 'Join me on the Track & Field Team Manager Portal to manage teams and track organizational progress!',
    roleBadge: {
      text: 'MANAGER',
      colorScheme: 'orange'
    },
    roleTitle: 'Team Manager'
  };
  
  return {
    ...teamManagerNavConfig,
    isCurrentPathActive
  };
} 