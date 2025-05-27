import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface FeedbackSubmission {
  rating: number;
  message: string;
  username: string;
  userType?: 'coach' | 'athlete';
  timestamp?: string;
}

export const submitFeedback = async (
  rating: number, 
  message: string, 
  username: string,
  userType: 'coach' | 'athlete' = 'athlete'
): Promise<void> => {
  // Create timestamp
  const timestamp = new Date().toISOString();
  
  // Create feedback submission object
  const feedback: FeedbackSubmission = {
    rating,
    message,
    username,
    userType,
    timestamp
  };
  
  // Submit to Supabase
  const { error } = await supabase
    .from('feedback')
    .insert([feedback]);
    
  if (error) {
    console.error('Error submitting feedback:', error);
    throw new Error('Failed to submit feedback');
  }
};

export const getFeedbackStats = async (): Promise<{ averageRating: number; totalSubmissions: number }> => {
  // Get feedback statistics
  const { data, error } = await supabase
    .from('feedback')
    .select('rating');
    
  if (error) {
    console.error('Error fetching feedback stats:', error);
    throw new Error('Failed to get feedback statistics');
  }
  
  if (!data || data.length === 0) {
    return { averageRating: 0, totalSubmissions: 0 };
  }
  
  const totalRating = data.reduce((sum, item) => sum + item.rating, 0);
  const averageRating = totalRating / data.length;
  
  return {
    averageRating,
    totalSubmissions: data.length
  };
};

export default {
  submitFeedback,
  getFeedbackStats
}; 