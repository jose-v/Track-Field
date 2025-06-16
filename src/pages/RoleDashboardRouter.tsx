import { Spinner, Center, Text } from '@chakra-ui/react';
import { useProfile } from '../hooks/useProfile';
import { Dashboard as AthleteDashboardComponent } from './Dashboard'; // For non-redirected roles
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function RoleDashboardRouter() {
  const { profile, isLoading, error } = useProfile();
  const [isFixingRole, setIsFixingRole] = useState(false);

  // TEMPORARY: Add debugging to see what profile data we're getting
  useEffect(() => {
    if (profile) {
      console.log('🔍 RoleDashboardRouter - Profile data received:', {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        roleType: typeof profile.role,
        roleData: profile.roleData
      });
    }
  }, [profile]);

  // TEMPORARILY DISABLED: Auto-fix logic while debugging
  // useEffect(() => {
  //   const fixNullRole = async () => {
  //     if (profile && !profile.role && !isFixingRole) {
  //       console.log('🔧 Auto-fixing NULL role - determining correct role from existing data');
  //       setIsFixingRole(true);
        
  //       try {
  //         const { data: { user } } = await supabase.auth.getUser();
  //         if (user) {
  //           // Check existing role-specific data to determine correct role
  //           let detectedRole = 'athlete'; // Default fallback
            
  //           // Check if user has coach data
  //           const { data: coachData } = await supabase
  //             .from('coaches')
  //             .select('id')
  //             .eq('id', user.id)
  //             .single();
            
  //           if (coachData) {
  //             detectedRole = 'coach';
  //             console.log('🔍 Found existing coach data - setting role to coach');
  //           } else {
  //             // Check if user has athlete data
  //             const { data: athleteData } = await supabase
  //               .from('athletes')
  //               .select('id')
  //               .eq('id', user.id)
  //               .single();
              
  //             if (athleteData) {
  //               detectedRole = 'athlete';
  //               console.log('🔍 Found existing athlete data - setting role to athlete');
  //             } else {
  //               // Check if user has team manager data
  //               const { data: managerData } = await supabase
  //                 .from('team_members')
  //                 .select('id')
  //                 .eq('user_id', user.id)
  //                 .eq('role', 'manager')
  //                 .single();
                
  //               if (managerData) {
  //                 detectedRole = 'team_manager';
  //                 console.log('🔍 Found existing team manager data - setting role to team_manager');
  //               } else {
  //                 console.log('🔍 No existing role data found - defaulting to athlete');
  //               }
  //             }
  //           }
            
  //           // Update profile with detected role
  //           const { error: updateError } = await supabase
  //             .from('profiles')
  //             .update({ 
  //               role: detectedRole,
  //               updated_at: new Date().toISOString()
  //             })
  //             .eq('id', user.id);
            
  //           if (!updateError) {
  //             // Create missing role-specific profile entry if needed
  //             if (detectedRole === 'athlete') {
  //               await supabase
  //                 .from('athletes')
  //                 .upsert([{
  //                   id: user.id,
  //                   date_of_birth: null,
  //                   gender: null,
  //                   events: [],
  //                   team_id: null
  //                 }], { onConflict: 'id' });
  //             } else if (detectedRole === 'coach') {
  //               await supabase
  //                 .from('coaches')
  //                 .upsert([{
  //                   id: user.id,
  //                   specialties: [],
  //                   certifications: []
  //                 }], { onConflict: 'id' });
  //             }
              
  //             console.log(`✅ Auto-fixed NULL role to ${detectedRole}`);
  //             // Force page refresh to pick up new role
  //             window.location.reload();
  //           }
  //         }
  //       } catch (err) {
  //         console.error('❌ Failed to auto-fix NULL role:', err);
  //       } finally {
  //         setIsFixingRole(false);
  //       }
  //     }
  //   };

  //   fixNullRole();
  // }, [profile, isFixingRole]);

  if (isLoading || isFixingRole) {
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
    console.log('RoleDashboardRouter redirect: coach', profile.role, typeof profile.role);
    return <Navigate to="/coach/dashboard" replace />;
  } else if (profile.role === 'team_manager') {
    console.log('RoleDashboardRouter redirect: team_manager', profile.role, typeof profile.role);
    return <Navigate to="/team-manager/dashboard" replace />;
  } else if (profile.role === 'athlete') {
    console.log('RoleDashboardRouter redirect: athlete', profile.role, typeof profile.role);
    return <Navigate to="/athlete/dashboard" replace />;
  }

  // This should no longer happen with auto-fix, but keep as fallback
  if (!profile.role) {
    console.warn('🚨 NULL role detected after auto-fix attempt - this should not happen');
    return (
      <Center py={20}>
        <Text color="orange.500">Setting up your profile...</Text>
        <Spinner size="lg" color="blue.500" mt={4} />
      </Center>
    );
  }

  // Fallback for any other unhandled roles
  console.warn('RoleDashboardRouter: Unhandled role, refusing to redirect to athlete dashboard. Role:', profile?.role, typeof profile?.role);
  return (
    <Center py={20}>
      <Text color="red.500">Unhandled role: {String(profile?.role)}</Text>
    </Center>
  );
} 