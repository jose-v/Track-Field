import { supabase } from '../lib/supabase';
import { getFallbackChatResponse } from './chatResponseUtils';

// Test database connection at startup
(async function testDatabaseConnection() {
  console.log('Testing database connection...');
  try {
    const { data, error } = await supabase.from('sleep_records').select('count').limit(1);
    if (error) {
      console.error('Database connection test failed (sleep_records):', error);
      // Try another table
      const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('count').limit(1);
      if (profilesError) {
        console.error('Database connection test failed (profiles):', profilesError);
        console.warn('Database connection may not be working properly');
      } else {
        console.log('Database connection successful (profiles table)');
      }
    } else {
      console.log('Database connection successful (sleep_records table)');
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
  }
})();

// Environment mode check - change to false to always use the real API
const useMockData = false; // Previously: import.meta.env.MODE === 'development';

// Types for user data
interface NextMeetData {
  date: string;
  name: string;
  location: string;
  startTime?: string;
}

interface SleepData {
  lastWeek: {
    total: number;
    average: number;
    quality: string;
    comparison?: string;
  };
}

interface PerformanceData {
  event: string;
  bestTime: string;
  improvement: string;
  notes?: string;
}

interface AthleteData {
  id: string;
  name: string;
  nextMeet?: NextMeetData;
}

type UserData = NextMeetData | SleepData | PerformanceData | AthleteData[] | null;

/**
 * Check if user is authenticated
 */
export const isUserAuthenticated = (): boolean => {
  // Simplified check - if we're on any authenticated route, we're authenticated
  const currentUrl = window.location.href;
  // Check for any authenticated route patterns
  if (
    currentUrl.includes('/coach/') || 
    currentUrl.includes('/athlete/') ||
    currentUrl.includes('/dashboard') ||
    currentUrl.includes('/notifications') ||
    currentUrl.includes('/workouts') ||
    currentUrl.includes('/meets') ||
    currentUrl.includes('/calendar') ||
    currentUrl.includes('/nutrition') ||
    currentUrl.includes('/sleep')
  ) {
    console.log('User is authenticated based on URL pattern');
    return true;
  }
  
  // Fallback to localStorage check
  const hasUserData = !!localStorage.getItem('user');
  console.log('Authentication check from localStorage:', hasUserData);
  
  // Check if we have the ATHLETE role in the document body
  const isAthleteRole = document.body.textContent?.includes('ATHLETE');
  if (isAthleteRole) {
    console.log('User is authenticated based on ATHLETE role in page');
    return true;
  }
  
  return hasUserData;
};

/**
 * Get current user's role
 */
export const getCurrentUserRole = (): string => {
  // Check URL first for fastest determination
  const currentUrl = window.location.href;
  if (currentUrl.includes('/coach/dashboard')) {
    console.log('User role determined from URL: coach');
    return 'coach';
  }
  
  if (currentUrl.includes('/athlete/dashboard')) {
    console.log('User role determined from URL: athlete');
    return 'athlete';
  }
  
  // Fallback to localStorage check
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('User role from localStorage:', user.role);
      return user.role || 'athlete';
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
  }
  
  console.log('No role information found, defaulting to athlete');
  return 'athlete';
};

/**
 * Get current user's ID
 */
export const getCurrentUserId = (): string | null => {
  console.log('Attempting to get current user ID');
  
  // Try from localStorage first
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('User ID from localStorage:', user.id || user.userId || null);
      return user.id || user.userId || null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
  }
  
  // Try to get from URL if it contains an ID pattern
  const currentUrl = window.location.href;
  const idMatch = currentUrl.match(/\/user\/([a-zA-Z0-9-]+)/);
  if (idMatch && idMatch[1]) {
    console.log('User ID from URL:', idMatch[1]);
    return idMatch[1];
  }
  
  // Try other methods like document data
  const profileSection = document.querySelector('[data-user-id]');
  if (profileSection) {
    const userId = profileSection.getAttribute('data-user-id');
    if (userId) {
      console.log('User ID from DOM:', userId);
      return userId;
    }
  }
  
  console.log('Could not determine user ID, returning null');
  return null;
};

/**
 * Fetch user-specific data from the database
 */
export const fetchUserData = async (dataType: string, userId: string): Promise<UserData> => {
  try {
    // First check if user is authenticated
    if (!isUserAuthenticated()) {
      console.warn('Attempted to fetch data for unauthenticated user');
      return null;
    }
    
    // If userId is empty, try to get it
    let userIdToUse = userId;
    if (!userIdToUse || userIdToUse === '') {
      console.log('No userId provided, attempting to get current user ID');
      userIdToUse = getCurrentUserId() || '';
      
      if (!userIdToUse) {
        console.warn('Could not determine user ID');
        return null;
      }
    }
    
    console.log(`Fetching ${dataType} data for user ID: ${userIdToUse}`);
    
    // Get the current user's role
    const userRole = getCurrentUserRole();
    console.log(`User role: ${userRole}`);
    
    // Based on intent type, fetch appropriate data from database
    switch (dataType) {
      case 'nextMeet':
        console.log('Querying events table for next meet');
        const { data: meetData, error: meetError } = await supabase
          .from('events')
          .select('*')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(1)
          .single();
          
        if (meetError) {
          console.error('Error fetching meet data:', meetError);
          return null;
        }
        
        if (meetData) {
          return {
            date: meetData.date,
            name: meetData.name || meetData.title || 'Upcoming Meet',
            location: meetData.location || 'TBD',
            startTime: meetData.start_time || meetData.time || '9:00 AM'
          };
        }
        
        return null;
        
      case 'sleepData':
        console.log(`Attempting to fetch sleep data for user ID: ${userIdToUse}`);
        
        try {
          // Query sleep_records table
          const { data: sleepData, error: sleepError } = await supabase
            .from('sleep_records')
            .select('*')
            .eq('athlete_id', userIdToUse)
            .order('created_at', { ascending: false })
            .limit(7);
            
          if (sleepError) {
            console.error('Error fetching sleep data:', sleepError);
            return null;
          }
          
          // Transform sleep_records data
          if (sleepData && sleepData.length > 0) {
            console.log(`Found ${sleepData.length} sleep records`);
            
            // Calculate average sleep hours from records
            let totalHours = 0;
            let recordsWithHours = 0;
            
            sleepData.forEach(record => {
              let hours = 0;
              
              // Different ways sleep duration might be stored
              if (record.duration) {
                // Duration in minutes
                hours = record.duration / 60;
              } else if (record.hours) {
                // Direct hours field
                hours = record.hours;
              } else if (record.start_time && record.end_time) {
                // Calculate from start/end times
                try {
                  const startTime = new Date(`1970-01-01T${record.start_time}`);
                  const endTime = new Date(`1970-01-01T${record.end_time}`);
                  
                  // Handle sleep across midnight
                  let duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                  if (duration < 0) duration += 24;
                  
                  hours = duration;
                } catch (err) {
                  console.error('Error calculating sleep hours:', err);
                  return; // Skip this record
                }
              }
              
              if (hours > 0) {
                totalHours += hours;
                recordsWithHours++;
              }
            });
            
            if (recordsWithHours === 0) {
              console.log('No valid sleep records with hours found');
              return null;
            }
            
            const averageHours = totalHours / recordsWithHours;
            
            // Determine quality from most recent record
            const latestRecord = sleepData[0];
            const quality = latestRecord.quality || 
                          (latestRecord.rating ? 
                            (latestRecord.rating > 3 ? 'Good' : 'Fair') : 'Unknown');
            
            return {
              lastWeek: {
                total: Math.round(averageHours * 7 * 10) / 10, // Weekly total rounded to 1 decimal
                average: Math.round(averageHours * 10) / 10, // Average rounded to 1 decimal
                quality: quality,
                comparison: `Average: ${averageHours.toFixed(1)} hours per night.`
              }
            };
          }
          
          console.log('No sleep data found for this user');
          return null;
        } catch (error) {
          console.error('Error in sleep data retrieval:', error);
          return null;
        }
        
      case 'recentPerformance':
        // Get performance data from workouts table
        console.log('Querying workouts table for performance data');
        const { data: perfData, error: perfError } = await supabase
          .from('workouts')
          .select('*')
          .eq('athlete_id', userIdToUse)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (perfError) {
          console.error('Error fetching performance data:', perfError);
          return null;
        }
        
        if (perfData) {
          return {
            event: perfData.event_type || perfData.name || 'Unknown Event',
            bestTime: perfData.result || perfData.best_time || 'Not recorded',
            improvement: perfData.improvement || 'Not available',
            notes: perfData.notes || ''
          };
        }
        
        return null;
        
      case 'athleteInfo':
        // For coaches querying athlete data
        if (userRole === 'coach') {
          // Query coach's athletes through coach_athletes table
          console.log('Querying coach_athletes table for coach-athlete relationships');
          const { data: relationships, error: relationshipError } = await supabase
            .from('coach_athletes')
            .select(`
              athlete_id,
              profiles!athletes(first_name, last_name)
            `)
            .eq('coach_id', userIdToUse);
            
          if (relationshipError) {
            console.error('Error fetching coach athletes:', relationshipError);
            return null;
          }
          
          if (relationships && relationships.length > 0) {
            // Get upcoming meet for these athletes
            const { data: meetData } = await supabase
              .from('events')
              .select('*')
              .gte('date', new Date().toISOString())
              .order('date', { ascending: true })
              .limit(1)
              .single();
              
            // Map relationship data to athlete data format
            return relationships.map(rel => {
              const profile = rel.profiles || {};
              const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
              
              return {
                id: rel.athlete_id,
                name: fullName || 'Unknown Athlete',
                nextMeet: meetData ? {
                  name: meetData.name || meetData.title || 'Upcoming Meet',
                  date: meetData.date || 'TBD',
                  location: meetData.location || 'TBD',
                  startTime: meetData.start_time || meetData.time || 'TBD'
                } : undefined
              };
            });
          }
          
          console.log('No athlete relationships found for this coach');
          return null;
        }
        return null;
        
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${dataType} data:`, error);
    return null;
  }
};

/**
 * Get user role from userId
 */
export const getUserRole = async (userId: string): Promise<string> => {
  // First check if there's a logged-in user
  if (isUserAuthenticated()) {
    return getCurrentUserRole();
  }
  return 'athlete'; // Default to athlete for unauthenticated users
};

/**
 * Send prompt to ChatGPT API via Supabase Edge Function
 */
export const sendChatGPTPrompt = async (prompt: string): Promise<string> => {
  // Use fallback responses only if explicitly configured to do so
  if (useMockData) {
    console.log('Using fallback chat response');
    return getFallbackChatResponse(prompt);
  }

  try {
    // First, try using the Supabase Edge Function
    try {
      console.log('Calling Supabase Edge Function: chatgpt');
      const { data, error } = await supabase.functions.invoke('chatgpt', {
        body: {
          prompt,
          model: 'gpt-4',
          max_tokens: 150,
          temperature: 0.7,
        },
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Received response from Edge Function');
      return data.response;
    } catch (supabaseError) {
      console.error('Error using Supabase function, falling back to direct API:', supabaseError);
      
      // Fallback to direct OpenAI API (requires server with CORS handling)
      const response = await fetch('/api/chat/gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'gpt-4',
          max_tokens: 150,
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.response;
    }
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    
    // Provide a fallback response for development
    return "I'm sorry, I encountered an issue connecting to my AI services. Please try again later or contact support if the issue persists.";
  }
};

/**
 * Analyze the user's message to determine intent
 */
export const analyzeMessageIntent = async (message: string): Promise<string> => {
  const lowerMessage = message.toLowerCase();
  console.log('Analyzing message intent:', lowerMessage);
  
  // Direct match for Ataja's next meet
  if ((lowerMessage.includes('ataja') || 
       lowerMessage.includes('stephane') || 
       lowerMessage.includes('vazquez')) && 
      (lowerMessage.includes('next meet') || 
       lowerMessage.includes('when is') || 
       lowerMessage.includes('schedule'))) {
    console.log('DIRECT MATCH: Coach asking about Ataja\'s next meet');
    return 'athleteInfo';
  }
  
  // Check for coach asking about an athlete
  const athleteName = await extractAthleteName(message);
  if (athleteName && 
      (lowerMessage.includes('next meet') || 
       lowerMessage.includes('when is') ||
       lowerMessage.includes('schedule') ||
       lowerMessage.includes('competition') ||
       lowerMessage.includes('upcoming'))) {
    console.log('Identified as athleteInfo intent (general athlete query)');
    return 'athleteInfo';
  }
  
  // Check for schedule/meet related queries
  if (lowerMessage.includes('next meet') || 
      lowerMessage.includes('schedule') || 
      lowerMessage.includes('upcoming') ||
      lowerMessage.includes('competition') ||
      lowerMessage.includes('when is') ||
      lowerMessage.includes('calendar')) {
    console.log('Identified as nextMeet intent');
    return 'nextMeet';
  } 
  
  // Check for sleep/recovery related queries
  else if (lowerMessage.includes('sleep') || 
           lowerMessage.includes('rest') || 
           lowerMessage.includes('recovery') ||
           lowerMessage.includes('tired') ||
           lowerMessage.includes('fatigue') ||
           (lowerMessage.includes('how') && lowerMessage.includes('hours'))) {
    console.log('Identified as sleepData intent');
    return 'sleepData';
  } 
  
  // Check for performance related queries
  else if (lowerMessage.includes('performance') || 
           lowerMessage.includes('time') || 
           lowerMessage.includes('improvement') ||
           lowerMessage.includes('progress') ||
           lowerMessage.includes('how fast') ||
           lowerMessage.includes('personal best') ||
           lowerMessage.includes('pb') ||
           lowerMessage.includes('record')) {
    console.log('Identified as recentPerformance intent');
    return 'recentPerformance';
  }
  
  // Default intent
  console.log('No specific intent identified, using general');
  return 'general';
};

/**
 * Get athlete data for a specific athlete by name, verifying coach relationship
 */
const getAthleteData = async (athleteName: string): Promise<AthleteData | null> => {
  try {
    console.log(`Looking up data for athlete: ${athleteName}`);
    
    // First get the current user ID and role
    const currentUser = localStorage.getItem('user');
    let userId = null;
    
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        userId = user.userId;
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }
    
    if (!userId) {
      console.warn('No user ID available to verify coach-athlete relationship');
      return null;
    }
    
    // Query the database to check if the coach has an approved relationship with this athlete
    const { data, error } = await supabase
      .from('coach_athletes')
      .select(`
        athlete_id,
        athlete:athletes(name:profiles(first_name, last_name)),
        meets:events(
          name,
          date,
          location,
          start_time
        )
      `)
      .eq('coach_id', userId)
      .eq('approval_status', 'approved')
      .filter('athlete.name.first_name', 'ilike', `%${athleteName.split(' ')[0]}%`);
      
    if (error) {
      console.error('Error fetching athlete data:', error);
      return null;
    }
    
    // Check if the athlete was found under this coach
    if (data && data.length > 0) {
      const athlete = data[0];
      const athleteFullName = `${athlete.athlete.name.first_name || ''} ${athlete.athlete.name.last_name || ''}`.trim();
      console.log(`Found athlete ${athleteFullName} associated with this coach`);
      
      return {
        id: athlete.athlete_id,
        name: athleteFullName,
        nextMeet: athlete.meets && athlete.meets.length > 0 ? {
          name: athlete.meets[0].name,
          date: athlete.meets[0].date,
          location: athlete.meets[0].location,
          startTime: athlete.meets[0].start_time
        } : undefined
      };
    }
    
    console.warn(`No approved athlete found with name "${athleteName}" associated with this coach`);
    return null;
  } catch (error) {
    console.error('Error in getAthleteData:', error);
    return null;
  }
};

/**
 * Create a formatted prompt with user context
 */
export const createContextualPrompt = async (
  userMessage: string, 
  userData: UserData, 
  intent: string
): Promise<string> => {
  console.log(`Creating contextual prompt for intent: ${intent}`);
  
  // Regular handling for queries
  let contextInfo = '';
  const userRole = getCurrentUserRole();
  const isAuthenticated = isUserAuthenticated();
  
  // For coaches asking about their athletes
  if (userRole === 'coach' && isAuthenticated && intent === 'athleteInfo') {
    // Extract the athlete name from the message
    const athleteName = await extractAthleteName(userMessage);
    
    if (athleteName) {
      console.log(`Coach asking about athlete: ${athleteName}`);
      
      // Get athlete data
      const athleteData = await getAthleteData(athleteName);
      
      if (athleteData) {
        // Create context based on verified coach-athlete relationship
        contextInfo = `You are a coach. Your athlete "${athleteData.name}"`;
        
        if (athleteData.nextMeet) {
          contextInfo += ` has their next meet "${athleteData.nextMeet.name}" on ${athleteData.nextMeet.date} at ${athleteData.nextMeet.location}`;
          
          if (athleteData.nextMeet.startTime) {
            contextInfo += `, starting at ${athleteData.nextMeet.startTime}`;
          }
        } else {
          contextInfo += ` does not have any upcoming meets scheduled`;
        }
        
        console.log('Created coach-athlete prompt with verified relationship data');
          
        return `
          You are a Track & Field assistant chatbot helping a coach.
          You should respond in a professional, informative tone.
          USER ROLE: Coach
          ATHLETE CONTEXT: ${contextInfo}
          USER QUERY: ${userMessage}
          Respond concisely and specifically to the query about the athlete.
          Use only the information provided in the ATHLETE CONTEXT without adding any additional details.
        `;
      }
    }
  }
  
  // Regular user data handling for authenticated users
  if (userData) {
    if (intent === 'nextMeet' && 'name' in userData) {
      const meetData = userData as NextMeetData;
      contextInfo = `The user's next meet is ${meetData.name} on ${meetData.date} at ${meetData.location}. ${meetData.startTime ? `It starts at ${meetData.startTime}.` : ''}`;
    } else if (intent === 'sleepData' && 'lastWeek' in userData) {
      const sleepData = userData as SleepData;
      contextInfo = `The user slept a total of ${sleepData.lastWeek.total} hours last week, with an average of ${sleepData.lastWeek.average} hours per night. Sleep quality was rated as ${sleepData.lastWeek.quality}. ${sleepData.lastWeek.comparison || ''}`;
    } else if (intent === 'recentPerformance' && 'event' in userData) {
      const perfData = userData as PerformanceData;
      contextInfo = `The user's recent performance in the ${perfData.event} was ${perfData.bestTime}, which is an improvement of ${perfData.improvement}. ${perfData.notes || ''}`;
    }
  } else {
    contextInfo = "No data available for this query.";
  }
  
  // Return the full prompt with context
  return `
    You are a Track & Field assistant chatbot helping an ${userRole || 'athlete'} with their training and performance.
    You should respond in a supportive, factual tone.
    USER CONTEXT: ${contextInfo}
    USER QUERY: ${userMessage}
    Respond concisely and specifically to the user's query, using the context provided if relevant.
    If no data is available, explain that you don't have that information yet.
    Limit your response to 2-3 sentences maximum.
  `;
};

/**
 * Extract athlete name from a message
 */
export const extractAthleteName = async (message: string): Promise<string | null> => {
  const lowerMessage = message.toLowerCase();
  
  try {
    // If no exact match, query the database for all athlete names from profiles
    console.log('Querying profiles table for athlete names');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('role', 'athlete')  // Only get athlete profiles
      .limit(100);
      
    if (!profilesError && profiles && profiles.length > 0) {
      console.log(`Found ${profiles.length} athlete profiles`);
      
      // Check if any profile names are mentioned in the message
      for (const profile of profiles) {
        // Skip if missing name parts
        if (!profile.first_name && !profile.last_name) continue;
        
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim().toLowerCase();
        const nameParts = fullName.split(' ');
        
        // Check if any part of the profile's name is in the message
        for (const part of nameParts) {
          if (part.length > 3 && lowerMessage.includes(part)) {
            console.log(`Found athlete name match: ${fullName}`);
            return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          }
        }
      }
      
      console.log('No athlete name matches found in profiles');
    } else {
      console.log('Could not query profiles table, trying athletes table');
      
      // Try the athletes table as fallback
      const { data: athletes, error: athletesError } = await supabase
        .from('athletes')
        .select('first_name, last_name')
        .limit(100);
        
      if (!athletesError && athletes && athletes.length > 0) {
        console.log(`Found ${athletes.length} athletes in athletes table`);
        
        // Check if any athlete names are mentioned in the message
        for (const athlete of athletes) {
          // Skip if missing name parts
          if (!athlete.first_name && !athlete.last_name) continue;
          
          const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim().toLowerCase();
          const nameParts = fullName.split(' ');
          
          // Check if any part of the athlete's name is in the message
          for (const part of nameParts) {
            if (part.length > 3 && lowerMessage.includes(part)) {
              console.log(`Found athlete name match: ${fullName}`);
              return `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim();
            }
          }
        }
      } else {
        console.log('Could not query athletes table or it is empty');
      }
    }
    
    // Check if message is about "their" athlete or team member
    if ((lowerMessage.includes('my athlete') || 
         lowerMessage.includes('my team') || 
         lowerMessage.includes('team member')) && 
        getCurrentUserRole() === 'coach') {
      console.log('Coach asking about their athlete but no specific name found');
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('Error in extractAthleteName:', error);
    return null;
  }
};

/**
 * Fetch athlete data for coach queries, ensuring they're approved
 */
const fetchAthleteDataForCoach = async (coachId: string): Promise<AthleteData[] | null> => {
  try {
    // Query for approved coach-athlete relationships only
    const { data: relationships, error: relationshipError } = await supabase
      .from('coach_athletes')
      .select(`
        athlete_id,
        athlete:athletes(
          id,
          name:profiles(first_name, last_name)
        ),
        meets:events(
          name,
          date,
          location,
          start_time
        )
      `)
      .eq('coach_id', coachId)
      .eq('approval_status', 'approved');
    
    if (relationshipError) {
      console.error('Error fetching coach-athlete relationships:', relationshipError);
      throw relationshipError;
    }
    
    if (!relationships || relationships.length === 0) {
      console.log('No approved coach-athlete relationships found');
      return null;
    }
    
    return relationships.map(rel => ({
      id: rel.athlete_id,
      name: `${rel.athlete.name.first_name || ''} ${rel.athlete.name.last_name || ''}`.trim(),
      nextMeet: rel.meets.length > 0 ? {
        name: rel.meets[0].name,
        date: rel.meets[0].date,
        location: rel.meets[0].location,
        startTime: rel.meets[0].start_time
      } : undefined
    }));
  } catch (error) {
    console.error('Error fetching athlete data for coach:', error);
    return null;
  }
}; 