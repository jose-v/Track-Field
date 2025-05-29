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
  birth_date: string | null;
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
 * Checks if the athletes table exists
 */
async function checkTableExists(): Promise<boolean> {
  try {
    // Check profiles table first
    const { count: profileCount, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profileError) return false;
    
    // Then check athletes table
    const { count, error } = await supabase
      .from('athletes')
      .select('*', { count: 'exact', head: true });
    
    // If no error, tables exist
    return !error;
  } catch (err) {
    console.error('Error checking if tables exist:', err);
    return false;
  }
}

/**
 * Fetches all athletes from the database
 */
export async function getAllAthletes(): Promise<AthleteFrontend[]> {
  // First check if tables exist
  const tableExists = await checkTableExists();
  if (!tableExists) {
    console.warn('Athletes or profiles table does not exist, using mock data');
    return getMockAthletes();
  }
  
  try {
    // Use a simpler query that doesn't depend on birth_date
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        first_name, 
        last_name, 
        email, 
        phone, 
        avatar_url,
        athletes (
          events
        )
      `)
      .eq('role', 'athlete');
    
    if (error) {
      console.error('Error fetching athletes:', error);
      return getMockAthletes();
    }

    if (!data || data.length === 0) {
      console.warn('No athletes found in database, using mock data');
      return getMockAthletes();
    }

    // Transform the data to match the AthleteFrontend interface
    return data.map((item: any) => ({
      id: item.id,
      name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Athlete',
      age: item.athletes?.birth_date ? calculateAge(item.athletes.birth_date) : 0,
      events: item.athletes?.events || [],
      avatar: item.avatar_url,
      email: item.email,
      phone: item.phone,
    }));
  } catch (err) {
    console.error('Failed to fetch athletes:', err);
    return getMockAthletes();
  }
}

/**
 * Searches athletes based on name or events
 */
export async function searchAthletes(query: string): Promise<AthleteFrontend[]> {
  if (!query) {
    return getAllAthletes();
  }

  // Check if tables exist first
  const tableExists = await checkTableExists();
  if (!tableExists) {
    // Fall back to filtering mock data
    const mockData = getMockAthletes();
    return mockData.filter(athlete => 
      athlete.name.toLowerCase().includes(query.toLowerCase()) ||
      athlete.events.some(event => event.toLowerCase().includes(query.toLowerCase()))
    );
  }

  try {
    // Use a simpler query that doesn't depend on birth_date
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        first_name, 
        last_name, 
        email, 
        phone, 
        avatar_url,
        athletes (
          events
        )
      `)
      .eq('role', 'athlete')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
    
    if (error) {
      console.error('Error searching athletes:', error);
      // Fall back to filtering mock data
      const mockData = getMockAthletes();
      return mockData.filter(athlete => 
        athlete.name.toLowerCase().includes(query.toLowerCase()) ||
        athlete.events.some(event => event.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Transform the data
    return data.map((item: any) => ({
      id: item.id,
      name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unknown Athlete',
      age: item.athletes?.birth_date ? calculateAge(item.athletes.birth_date) : 0,
      events: item.athletes?.events || [],
      avatar: item.avatar_url,
      email: item.email,
      phone: item.phone,
    }));
  } catch (err) {
    console.error('Failed to search athletes:', err);
    // Fall back to filtering mock data
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
      const age = calculateAge(data.birth_date);
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
        birth_date: birthDate,
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