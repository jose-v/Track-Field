import { supabase } from '../lib/supabase';
import { mockChatGptResponse } from './mockChatApi';

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

type UserData = NextMeetData | SleepData | PerformanceData | null;

/**
 * Fetch user-specific data from the backend
 */
export const fetchUserData = async (dataType: string, userId: string): Promise<UserData> => {
  try {
    // In a real app, we would fetch this from the database
    // For now, return mock data as we don't have these endpoints yet
    return getMockData(dataType);
  } catch (error) {
    console.error(`Error fetching ${dataType} data:`, error);
    return getMockData(dataType);
  }
};

/**
 * Send prompt to ChatGPT API via Supabase Edge Function
 */
export const sendChatGPTPrompt = async (prompt: string): Promise<string> => {
  // Use mock responses only if explicitly configured to do so
  if (useMockData) {
    console.log('Using mock ChatGPT response');
    return mockChatGptResponse(prompt);
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
 * Create a formatted prompt with user context
 */
export const createContextualPrompt = (
  userMessage: string, 
  userData: UserData, 
  intent: string
): string => {
  let contextInfo = '';
  
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
  }
  
  // Return the full prompt with context
  return `
    You are a Track & Field assistant chatbot helping an athlete with their training and performance.
    You should respond in a supportive, motivational but factual tone.
    USER CONTEXT: ${contextInfo}
    USER QUERY: ${userMessage}
    Respond concisely and specifically to the user's query, using the context provided if relevant.
    Limit your response to 2-3 sentences maximum.
  `;
};

/**
 * Analyze the user's message to determine intent
 */
export const analyzeMessageIntent = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Check for schedule/meet related queries
  if (lowerMessage.includes('next meet') || 
      lowerMessage.includes('schedule') || 
      lowerMessage.includes('upcoming') ||
      lowerMessage.includes('competition') ||
      lowerMessage.includes('when is') ||
      lowerMessage.includes('calendar')) {
    return 'nextMeet';
  } 
  
  // Check for sleep/recovery related queries
  else if (lowerMessage.includes('sleep') || 
           lowerMessage.includes('rest') || 
           lowerMessage.includes('recovery') ||
           lowerMessage.includes('tired') ||
           lowerMessage.includes('fatigue') ||
           (lowerMessage.includes('how') && lowerMessage.includes('hours'))) {
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
    return 'recentPerformance';
  }
  
  // Default intent
  return 'general';
};

/**
 * Provide mock data for development purposes
 */
const getMockData = (dataType: string): UserData => {
  switch (dataType) {
    case 'nextMeet':
      return { 
        date: '2023-11-15', 
        name: 'Regional Championships', 
        location: 'Central Stadium',
        startTime: '9:00 AM'
      };
    case 'sleepData':
      return { 
        lastWeek: { 
          total: 49.5, 
          average: 7.1, 
          quality: 'Good',
          comparison: "That's 30 minutes more per night than your monthly average."
        } 
      };
    case 'recentPerformance':
      return { 
        event: '100m', 
        bestTime: '11.3s', 
        improvement: '0.2s',
        notes: 'This puts you in the top 10% of your age group.'
      };
    default:
      return null;
  }
}; 