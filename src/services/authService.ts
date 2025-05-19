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
  selectedAthletes?: string[];
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
        data: {
          role: data.role,
          first_name: data.firstName,
          last_name: data.lastName,
          full_name: `${data.firstName} ${data.lastName}`,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    const userId = authData.user.id;

    // 2. Create the base profile
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
          await createCoachProfile(userId, data.selectedAthletes);
          break;
        case 'team_manager':
          await createTeamManagerProfile(userId, data.selectedAthletes);
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
async function createCoachProfile(
  userId: string, 
  selectedAthletes?: string[]
): Promise<void> {
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

  // 2. If coach has selected athletes, create relationships
  if (selectedAthletes && selectedAthletes.length > 0) {
    try {
      // First verify athletes exist
      const { data: existingAthletes, error: athletesError } = await supabase
        .from('athletes')
        .select('id')
        .in('id', selectedAthletes);

      if (athletesError || !existingAthletes || existingAthletes.length === 0) {
        // Log the error but don't throw - this part is optional
        console.warn('No valid athletes found or error:', athletesError);
        return; // Exit early, since we have no valid athletes
      }

      // Only create relationships for existing athletes
      const validAthleteIds = existingAthletes.map(a => a.id);
      
      if (validAthleteIds.length > 0) {
        // Create coach-athlete relationships
        const relationshipData = validAthleteIds.map(athleteId => ({
          coach_id: userId,
          athlete_id: athleteId,
        }));

        const { error: relationError } = await supabase
          .from('coach_athletes')
          .insert(relationshipData);

        if (relationError) {
          // Log the error but don't throw - this part is optional
          console.warn('Error creating coach-athlete relationships:', relationError);
        }
      }
    } catch (error) {
      // Log the error but don't throw - athlete linking is optional
      console.error('Error linking athletes to coach:', error);
    }
  }
}

/**
 * Create a team manager profile
 */
async function createTeamManagerProfile(
  userId: string,
  selectedAthletes?: string[]
): Promise<void> {
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