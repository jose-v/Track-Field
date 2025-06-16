import { Spinner, Center, Text } from '@chakra-ui/react';
import { useProfile } from '../hooks/useProfile';
import { Dashboard as AthleteDashboardComponent } from './Dashboard'; // For non-redirected roles
import { Navigate } from 'react-router-dom';

export default function RoleDashboardRouter() {
  const { profile, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <Center py={20}>
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (error || !profile) {
    // Consider redirecting to login or an error page if profile load fails critically
    return (
      <Center py={20}>
        <Text color="red.500">Unable to load profile. Please try again later.</Text>
      </Center>
    );
  }

  if (profile.role === 'coach') {
    // Redirect coach to their specific dashboard path
    return <Navigate to="/coach/dashboard" replace />;
  } else if (profile.role === 'team_manager') {
    // Redirect team manager to their specific dashboard path
    return <Navigate to="/team-manager/dashboard" replace />;
  } else if (profile.role === 'athlete') {
    return <Navigate to="/athlete/dashboard" replace />;
  }

  // Handle null/undefined roles by redirecting to role selection
  if (!profile.role) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('RoleDashboardRouter: Profile has no role assigned, redirecting to role selection', profile?.role);
    }
    return <Navigate to="/role-selection" replace />;
  }

  // Fallback for any other unhandled roles
  console.warn('RoleDashboardRouter: Unhandled role, defaulting to AthleteDashboardComponent for /dashboard', profile?.role);
  return <AthleteDashboardComponent />;
} 