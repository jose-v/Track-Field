import { UserRole } from '../contexts/SignupContext';

/**
 * Get the profile path for a given role
 */
export function getProfilePathForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case 'coach':
      return '/coach/profile';
    case 'athlete':
      return '/athlete/profile';
    case 'team_manager':
      return '/team-manager/profile';
    default:
      return '/profile';
  }
}

/**
 * Get the notifications path for a given role
 */
export function getNotificationsPathForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case 'coach':
      return '/coach/notifications';
    case 'athlete':
      return '/athlete/notifications';
    case 'team_manager':
      return '/team-manager/notifications';
    default:
      return '/notifications';
  }
}

/**
 * Get the dashboard path for a given role
 */
export function getDashboardPathForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case 'coach':
      return '/coach/dashboard';
    case 'athlete':
      return '/athlete/dashboard';
    case 'team_manager':
      return '/team-manager/dashboard';
    default:
      return '/dashboard';
  }
}

/**
 * Get the notification storage key for a given role
 */
export function getNotificationStorageKeyForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case 'coach':
      return 'coachNotificationCount';
    case 'athlete':
      return 'athleteNotificationCount';
    case 'team_manager':
      return 'teamManagerNotificationCount';
    default:
      return 'notificationCount';
  }
} 