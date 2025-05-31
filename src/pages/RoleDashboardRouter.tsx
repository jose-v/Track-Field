import { Spinner, Center, Text } from '@chakra-ui/react';
import { useProfile } from '../hooks/useProfile';
import { Dashboard as AthleteDashboardComponent } from './Dashboard'; // For non-redirected roles
import { Navigate } from 'react-router-dom';
import { PWADebugger } from '../utils/pwaDebug';

export default function RoleDashboardRouter() {
  const { profile, isLoading, error } = useProfile();

  PWADebugger.log('RoleDashboardRouter: Rendering', { 
    isLoading, 
    hasProfile: !!profile, 
    hasError: !!error,
    profileRole: profile?.role 
  });

  if (isLoading) {
    PWADebugger.log('RoleDashboardRouter: Profile loading');
    return (
      <Center py={20}>
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (error || !profile) {
    PWADebugger.log('RoleDashboardRouter: Profile error or missing', { error });
    // Consider redirecting to login or an error page if profile load fails critically
    return (
      <Center py={20}>
        <Text color="red.500">Unable to load profile. Please try again later.</Text>
      </Center>
    );
  }

  if (profile.role === 'coach' || profile.role === 'team_manager') {
    PWADebugger.log('RoleDashboardRouter: Redirecting to coach dashboard', { role: profile.role });
    // Redirect coach/team_manager to their specific dashboard path
    return <Navigate to="/coach/dashboard" replace />;
  } else if (profile.role === 'athlete') {
    PWADebugger.log('RoleDashboardRouter: Redirecting to athlete dashboard', { role: profile.role });
    return <Navigate to="/athlete/dashboard" replace />;
  }

  // Fallback for any other roles or if role is undefined (though profile should have a role)
  // This could be a generic dashboard or an error/message page.
  // For now, let's assume AthleteDashboardComponent can serve as a default if no specific role matches for redirection.
  PWADebugger.log('RoleDashboardRouter: Unhandled role, using fallback', { role: profile?.role });
  console.warn('RoleDashboardRouter: Unhandled role or no role, defaulting to AthleteDashboardComponent for /dashboard', profile?.role);
  return <AthleteDashboardComponent />;
} 