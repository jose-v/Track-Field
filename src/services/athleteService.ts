import { supabase } from '../lib/supabase';
import type { Athlete, Profile, AthleteWithProfile } from './dbSchema';
import { calculateAge } from '../utils/analytics/performance';

export interface AthleteFrontend {
  id: string;
  name: string;
  age: number;
  events: string[];
  avatar?: string;
  email?: string;
  phone?: string;
}

export interface AthleteProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_conditions: string | null;
  created_at: string;
  updated_at: string;
  age?: number;
}

/**
 * Checks if the athletes table exists - simplified version
 */
async function checkTableExists(): Promise<boolean> {
  try {
    // Simple check - just try to query one record
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'athlete')
      .limit(1);
    
    return !error;
  } catch (err) {
    console.error('Error checking if tables exist:', err);
    return false;
  }
}

/**
 * Fetches all athletes from the database - optimized version
 */
export async function getAllAthletes(): Promise<AthleteFrontend[]> {
  try {
    // Use a direct query without nested joins for better performance
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, avatar_url')
      .eq('role', 'athlete');
    
    if (profileError) {
      console.error('Error fetching athlete profiles:', profileError);
      // Only fallback if it's a table not found error
      if (profileError.code === '42P01') {
        console.warn('Profiles table does not exist, using mock data');
        return getMockAthletes();
      }
      throw profileError; // Let the calling component handle other errors
    }

    if (!profiles || profiles.length === 0) {
      console.warn('No athlete profiles found in database');
      return []; // Return empty array instead of mock data
    }

    // Get athlete-specific data in a separate query for better performance
    const athleteIds = profiles.map(p => p.id);
    const { data: athleteData, error: athleteError } = await supabase
      .from('athletes')
      .select('id, events, date_of_birth')
      .in('id', athleteIds);

    // If athlete table query fails, continue with just profile data
    if (athleteError) {
      console.warn('Error fetching athlete data, using profile data only:', athleteError);
    }

    // Transform the data to match the AthleteFrontend interface
    return profiles.map((profile: any) => {
      const athleteInfo = athleteData?.find(a => a.id === profile.id);
      return {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown Athlete',
        age: athleteInfo?.date_of_birth ? calculateAge(athleteInfo.date_of_birth) : 0,
        events: athleteInfo?.events || [],
        avatar: profile.avatar_url,
        email: profile.email,
        phone: profile.phone,
      };
    });
  } catch (err) {
    console.error('Failed to fetch athletes:', err);
    // Only use mock data as last resort
    return getMockAthletes();
  }
}

/**
 * Searches athletes based on name or events - optimized version
 */
export async function searchAthletes(query: string): Promise<AthleteFrontend[]> {
  if (!query) {
    return getAllAthletes();
  }

  try {
    // Use direct query without nested joins for better performance
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone, avatar_url')
      .eq('role', 'athlete')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
    
    if (profileError) {
      console.error('Error searching athlete profiles:', profileError);
      // Only fallback to mock data for table not found errors
      if (profileError.code === '42P01') {
        const mockData = getMockAthletes();
        return mockData.filter(athlete => 
          athlete.name.toLowerCase().includes(query.toLowerCase()) ||
          athlete.events.some(event => event.toLowerCase().includes(query.toLowerCase()))
        );
      }
      throw profileError; // Let calling component handle other errors
    }

    if (!profiles || profiles.length === 0) {
      return []; // Return empty array instead of mock data
    }

    // Get athlete-specific data in a separate query
    const athleteIds = profiles.map(p => p.id);
    const { data: athleteData, error: athleteError } = await supabase
      .from('athletes')
      .select('id, events, date_of_birth')
      .in('id', athleteIds);

    // If athlete table query fails, continue with just profile data
    if (athleteError) {
      console.warn('Error fetching athlete data during search, using profile data only:', athleteError);
    }

    // Transform the data
    return profiles.map((profile: any) => {
      const athleteInfo = athleteData?.find(a => a.id === profile.id);
      return {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown Athlete',
        age: athleteInfo?.date_of_birth ? calculateAge(athleteInfo.date_of_birth) : 0,
        events: athleteInfo?.events || [],
        avatar: profile.avatar_url,
        email: profile.email,
        phone: profile.phone,
      };
    });
  } catch (err) {
    console.error('Failed to search athletes:', err);
    // Only use mock data as last resort
    const mockData = getMockAthletes();
    return mockData.filter(athlete => 
      athlete.name.toLowerCase().includes(query.toLowerCase()) ||
      athlete.events.some(event => event.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

/**
 * Get athlete profile by ID
 */
export async function getAthleteProfile(athleteId: string): Promise<AthleteProfile | null> {
  try {
    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('*')
      .eq('id', athleteId)
      .single();

    if (error) {
      console.error('Error fetching athlete profile:', error);
      return null;
    }

    if (data) {
      // Use centralized age calculation
      const age = calculateAge(data.date_of_birth);
      return { ...data, age };
    }

    return null;
  } catch (error) {
    console.error('Error in getAthleteProfile:', error);
    return null;
  }
}

/**
 * Fallback to mock data if database is not available
 */
export function getMockAthletes(): AthleteFrontend[] {
  return [
    { 
      id: '1', 
      name: 'John Smith', 
      age: 22,
      events: ['100m Sprint', '200m Sprint'],
      avatar: '/images/athlete-avatar.jpg',
    },
    { 
      id: '2', 
      name: 'Sarah Williams',
      age: 19,
      events: ['Long Jump', 'Triple Jump'],
      avatar: '/images/athlete-avatar3.jpg',
    },
    { 
      id: '3', 
      name: 'Mike Johnson',
      age: 24,
      events: ['400m Hurdles', '400m Sprint'],
      avatar: '/images/athlete-avatar2.jpg',
    },
    { 
      id: '4', 
      name: 'Emily Davis',
      age: 20,
      events: ['800m', '1500m'],
    },
    { 
      id: '5', 
      name: 'Robert Wilson',
      age: 21,
      events: ['Shot Put', 'Discus'],
    },
  ];
}

/**
 * Creates a new athlete in the database
 */
export async function createAthlete(
  firstName: string,
  lastName: string,
  birthDate: string,
  events: string[]
): Promise<AthleteFrontend | null> {
  try {
    // First check if tables exist
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.warn('Athletes or profiles table does not exist, creating mock athlete');
      return createMockAthlete(firstName, lastName, calculateAge(birthDate), events);
    }

    // First create a profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Create a UUID for the new athlete
    const athleteId = crypto.randomUUID();

    // Insert into profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: athleteId,
        first_name: firstName,
        last_name: lastName,
        role: 'athlete',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    // Then insert into athletes table
    const { data: athleteData, error: athleteError } = await supabase
      .from('athletes')
      .insert([{
        id: athleteId,
        date_of_birth: birthDate,
        events: events
      }])
      .select()
      .single();

    if (athleteError) throw athleteError;

    // Return the created athlete
    return {
      id: athleteId,
      name: `${firstName} ${lastName}`,
      age: calculateAge(birthDate),
      events: events,
      avatar: '',
    };
  } catch (err) {
    console.error('Failed to create athlete:', err);
    // Fall back to creating a mock athlete
    return createMockAthlete(firstName, lastName, calculateAge(birthDate), events);
  }
}

/**
 * Creates a new mock athlete for demo purposes
 */
export function createMockAthlete(
  firstName: string, 
  lastName: string, 
  age: number, 
  events: string[]
): AthleteFrontend {
  return {
    // Generate a random ID
    id: `mock-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: `${firstName} ${lastName}`,
    age,
    events,
    // Generate avatar initials for the new athlete
    avatar: '',
  };
} 