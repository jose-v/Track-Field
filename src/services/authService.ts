import { supabase } from '../lib/supabase';
import type { UserRole } from '../contexts/SignupContext';
import type { Profile, Athlete, Coach, TeamManager } from './dbSchema';

export interface SignupData {
  role: UserRole;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
}

/**
 * Sign up a new user and create their role-specific profile
 */
export async function signUp(data: SignupData): Promise<{ user: any; error: any }> {
  try {
    // 1. Create the auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-verified`,
        data: {
          role: data.role,
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`,
          terms_accepted: data.termsAccepted,
          terms_accepted_at: data.termsAcceptedAt,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    const userId = authData.user.id;

    // 2. Create the base profile with terms acceptance data
    const profileData: Partial<Profile> = {
      id: userId,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      role: data.role,
    };

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // 3. Create role-specific entry
      switch (data.role) {
        case 'athlete':
          await createAthleteProfile(userId);
          break;
        case 'coach':
          await createCoachProfile(userId);
          break;
        case 'team_manager':
          await createTeamManagerProfile(userId);
          break;
      }

      return { user: authData.user, error: null };
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      
      // If profile creation fails, we should clean up the auth user
      try {
        // Note: In production, you might want to use admin functions to delete the user
        console.warn('Auth user created but profile creation failed. Manual cleanup may be needed.');
      } catch (cleanupError) {
        console.error('Failed to clean up auth user after profile creation error:', cleanupError);
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { user: null, error };
  }
}

/**
 * Create an athlete profile
 */
async function createAthleteProfile(userId: string): Promise<void> {
  const athleteData: Partial<Athlete> = {
    id: userId,
    events: [],
  };

  const { error } = await supabase
    .from('athletes')
    .insert([athleteData]);

  if (error) throw error;
}

/**
 * Create a coach profile
 */
async function createCoachProfile(userId: string): Promise<void> {
  // 1. Insert into coaches table
  const coachData: Partial<Coach> = {
    id: userId,
    specialties: [],
    certifications: [],
    gender: undefined,
    date_of_birth: undefined,
    events: [],
  };

  const { error } = await supabase
    .from('coaches')
    .insert([coachData]);

  if (error) throw error;
}

/**
 * Create a team manager profile
 */
async function createTeamManagerProfile(userId: string): Promise<void> {
  // 1. Insert into team_managers table
  const managerData: Partial<TeamManager> = {
    id: userId,
  };

  const { error } = await supabase
    .from('team_managers')
    .insert([managerData]);

  if (error) throw error;

  // 2. Team managers might work with athletes directly or through teams
  // Additional logic can be added here based on requirements
}

/**
 * Sign in an existing user
 */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Sign in with magic link
 */
export async function signInWithMagicLink(email: string) {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      }
    });
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Magic link sign-in error:', error);
    return { error };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  return supabase.auth.getUser();
}

/**
 * Get the complete profile for the current user, including role-specific data
 */
export async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get base profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('Profile not found');

    // Get role-specific data
    let roleData = null;
    
    switch (profile.role) {
      case 'athlete':
        const { data: athleteData } = await supabase
          .from('athletes')
          .select('*')
          .eq('id', user.id)
          .single();
        roleData = athleteData;
        break;
      
      case 'coach':
        const { data: coachData } = await supabase
          .from('coaches')
          .select('*')
          .eq('id', user.id)
          .single();
        roleData = coachData;
        break;
      
      case 'team_manager':
        const { data: managerData } = await supabase
          .from('team_managers')
          .select('*')
          .eq('id', user.id)
          .single();
        roleData = managerData;
        break;
    }

    return { profile, roleData };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Handle Google OAuth user profile creation
 */
export async function handleOAuthUserProfile(user: any, role?: UserRole): Promise<{ error: any }> {
  try {
    console.log('🔍 handleOAuthUserProfile called with:', { user: user.id, email: user.email, role });
    
    const userId = user.id;
    const email = user.email;
    
    // Extract name from user metadata or identities
    let firstName = '';
    let lastName = '';
    let fullName = '';
    
    // Try to get name from user metadata first
    if (user.user_metadata?.full_name) {
      fullName = user.user_metadata.full_name;
      const nameParts = fullName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    } else if (user.user_metadata?.name) {
      fullName = user.user_metadata.name;
      const nameParts = fullName.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // If no name from metadata, try from identities (Google provider)
    if (!firstName && user.identities && user.identities.length > 0) {
      const googleIdentity = user.identities.find((identity: any) => identity.provider === 'google');
      if (googleIdentity?.identity_data) {
        firstName = googleIdentity.identity_data.given_name || '';
        lastName = googleIdentity.identity_data.family_name || '';
        fullName = googleIdentity.identity_data.full_name || `${firstName} ${lastName}`.trim();
      }
    }
    
    console.log('🔍 Extracted name data:', { firstName, lastName, fullName });
    
    // Check if profile already exists
    console.log('🔍 Checking if profile exists for user:', userId);
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('❌ Error checking existing profile:', profileCheckError);
      throw profileCheckError;
    }
    
    console.log('🔍 Existing profile check result:', { existingProfile, profileCheckError });
    
    // Check if we're in a signup context (no role provided means we're in signup flow)
    const isSignupContext = !role;
    console.log('🔍 Signup context detected:', isSignupContext);
    
    // If profile doesn't exist, create it using upsert to handle race conditions
    if (!existingProfile) {
      console.log('🔍 No existing profile found, creating new profile with upsert');
      
      const profileData: Partial<Profile> = {
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
      };
      
      // Only set role if we're not in signup context
      if (!isSignupContext) {
        profileData.role = role || 'athlete';
      }

      console.log('🔍 Profile data to upsert:', profileData);

      // Use upsert to handle race conditions and existing auth users without profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([profileData], { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (profileError) {
        console.error('❌ Profile creation error details:', profileError);
        throw profileError;
      }
      
      console.log('✅ Profile created/updated successfully');

      // Only create role-specific entry if we're not in signup context
      if (!isSignupContext) {
        console.log('🔍 Creating role-specific profile for role:', role);
        const userRole = role || 'athlete';
        
        // Check if role-specific profile already exists first
        let roleProfileExists = false;
        try {
          switch (userRole) {
            case 'athlete':
              const { data: athleteData } = await supabase
                .from('athletes')
                .select('id')
                .eq('id', userId)
                .single();
              roleProfileExists = !!athleteData;
              break;
            case 'coach':
              const { data: coachData } = await supabase
                .from('coaches')
                .select('id')
                .eq('id', userId)
                .single();
              roleProfileExists = !!coachData;
              break;
            case 'team_manager':
              const { data: managerData } = await supabase
                .from('team_managers')
                .select('id')
                .eq('id', userId)
                .single();
              roleProfileExists = !!managerData;
              break;
          }
        } catch (error) {
          // Ignore errors from checking role profiles - they likely don't exist
          console.log('🔍 Role profile check error (expected for new users):', error);
        }
        
        if (!roleProfileExists) {
          switch (userRole) {
            case 'athlete':
              await createAthleteProfile(userId);
              break;
            case 'coach':
              await createCoachProfile(userId);
              break;
            case 'team_manager':
              await createTeamManagerProfile(userId);
              break;
          }
          console.log('✅ Role-specific profile created');
        } else {
          console.log('🔍 Role-specific profile already exists, skipping creation');
        }
      } else {
        console.log('🔍 Skipping role-specific profile creation (signup context)');
      }
    } else {
      console.log('🔍 Profile already exists, skipping creation');
      
      // If profile exists but has no role and we're not in signup context, 
      // this might be a returning user who was deleted and needs role assignment
      if (!existingProfile.role && !isSignupContext) {
        console.log('🔍 Existing profile has no role, updating with provided role');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: role || 'athlete' })
          .eq('id', userId);
          
        if (updateError) {
          console.error('❌ Error updating profile role:', updateError);
        } else {
          console.log('✅ Profile role updated successfully');
        }
      }
    }

    console.log('✅ handleOAuthUserProfile completed successfully');
    return { error: null };
  } catch (error) {
    console.error('❌ OAuth profile handling error details:', error);
    return { error };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { error };
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Password update error:', error);
    return { error };
  }
}

/**
 * Check if email already exists in the system
 */
export async function checkEmailExists(email: string) {
  try {
    // Check in profiles table for existing email
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which means email doesn't exist (good)
      throw error;
    }
    
    // If data exists, email is taken
    const emailExists = !!data;
    
    return { emailExists, error: null };
  } catch (error) {
    console.error('Email check error:', error);
    return { emailExists: false, error };
  }
}

/**
 * Update Google OAuth user profile with role and personal information
 */
export async function updateOAuthUserProfile(user: any, profileData: {
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<{ error: any }> {
  try {
    const userId = user.id;
    
    // Update the base profile
    const updateData: Partial<Profile> = {
      role: profileData.role,
    };
    
    if (profileData.firstName) {
      updateData.first_name = profileData.firstName;
    }
    
    if (profileData.lastName) {
      updateData.last_name = profileData.lastName;
    }
    
    if (profileData.phone) {
      updateData.phone = profileData.phone;
    }
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    // Create role-specific entry if it doesn't exist
    switch (profileData.role) {
      case 'athlete':
        // Check if athlete profile exists
        const { data: athleteExists } = await supabase
          .from('athletes')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (!athleteExists) {
          await createAthleteProfile(userId);
        }
        break;
        
      case 'coach':
        // Check if coach profile exists
        const { data: coachExists } = await supabase
          .from('coaches')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (!coachExists) {
          await createCoachProfile(userId);
        }
        break;
        
      case 'team_manager':
        // Check if team manager profile exists
        const { data: tmExists } = await supabase
          .from('team_managers')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (!tmExists) {
          await createTeamManagerProfile(userId);
        }
        break;
    }

    return { error: null };
  } catch (error) {
    console.error('OAuth profile update error:', error);
    return { error };
  }
} 