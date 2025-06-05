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
    birth_date: undefined,
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
    
    // Check if profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error checking existing profile:', profileCheckError);
      throw profileCheckError;
    }
    
    // If profile doesn't exist, create it
    if (!existingProfile) {
      const profileData: Partial<Profile> = {
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: role || 'athlete', // Default to athlete if no role specified
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // Create role-specific entry based on the role
      const userRole = role || 'athlete';
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
    }

    return { error: null };
  } catch (error) {
    console.error('OAuth profile handling error:', error);
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