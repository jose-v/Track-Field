/**
 * Mock ChatGPT API for local development
 * This file provides mock responses for the chatbot during local development
 * to avoid hitting the actual OpenAI API and incurring costs during testing.
 */

// Mock responses for specific intents
const MOCK_RESPONSES: Record<string, string[]> = {
  nextMeet: [
    "Your next meet is the Regional Championships on November 15th at Central Stadium. It starts at 9 AM. Would you like me to remind you the day before?",
    "You're scheduled for the County Finals on December 5th at Riverside Track. Coach wants everyone there by 7:30 AM for warm-ups.",
    "According to your schedule, you have the State Qualifiers coming up next weekend at Memorial Stadium. Your first event is at 11:15 AM."
  ],
  
  sleepData: [
    "You slept a total of 49.5 hours last week, averaging 7.1 hours per night. Your sleep quality was rated 'Good'. That's 30 minutes more per night than your monthly average.",
    "Last week you averaged 6.8 hours of sleep per night, which is below your target of 8 hours. Your deep sleep percentage was good at 22% of total sleep time.",
    "Your sleep tracking shows improvement! You got an average of 7.5 hours per night last week, with consistent bedtimes around 10:30 PM."
  ],
  
  recentPerformance: [
    "Your best recent time in the 100m was 11.3 seconds, which is 0.2 seconds faster than last month. You're making great progress!",
    "In your last three training sessions, your 400m splits have improved by 1.2 seconds on average. Keep up the good work!",
    "Looking at your performance data, you've increased your long jump distance by 18cm over the past six weeks. That puts you in the top 15% of improvement rates."
  ],
  
  general: [
    "I'm here to help with your training, performance, and schedule questions. What specific information do you need about your track and field activities?",
    "As your track and field assistant, I can provide insights on your training progress, upcoming events, and recovery metrics. What would you like to know?",
    "I don't have specific information about that yet. As your training progresses, I'll be able to provide more personalized insights."
  ]
};

/**
 * Get a random response from the given category
 */
const getRandomResponse = (category: string): string => {
  const responses = MOCK_RESPONSES[category] || MOCK_RESPONSES.general;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

/**
 * Mock function to determine the intent of a message
 */
export const mockAnalyzeIntent = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('next meet') || 
      lowerMessage.includes('schedule') || 
      lowerMessage.includes('upcoming') ||
      lowerMessage.includes('when is')) {
    return 'nextMeet';
  } 
  
  if (lowerMessage.includes('sleep') || 
      lowerMessage.includes('rest') || 
      lowerMessage.includes('recovery')) {
    return 'sleepData';
  } 
  
  if (lowerMessage.includes('performance') || 
      lowerMessage.includes('time') || 
      lowerMessage.includes('improvement') ||
      lowerMessage.includes('progress')) {
    return 'recentPerformance';
  }
  
  return 'general';
};

/**
 * Mock ChatGPT API call that returns appropriate responses based on message content
 */
export const mockChatGptResponse = async (prompt: string): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Determine intent and get appropriate response
  const intent = mockAnalyzeIntent(prompt);
  return getRandomResponse(intent);
};

export default {
  mockChatGptResponse,
  mockAnalyzeIntent
}; 