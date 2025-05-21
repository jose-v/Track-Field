import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  // Add other user properties as needed
}

// Mock authentication hook for development purposes
// In a real application, this would connect to your authentication system
export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Mock login function
  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would make an API call to your auth endpoint
    setLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock successful login
    const user: AuthUser = {
      userId: 'user123',
      name: 'John Doe',
      email: email,
      role: 'athlete'
    };
    
    setCurrentUser(user);
    setLoading(false);
    
    // Store in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(user));
    
    return true;
  };
  
  // Mock logout function
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };
  
  // Check for existing logged in user on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      try {
        // First check Supabase session
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        
        if (session?.user) {
          console.log('Found active Supabase session:', session.user.id);
          
          // Get user profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileData) {
            const userData: AuthUser = {
              userId: session.user.id,
              name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
              email: session.user.email || '',
              role: profileData.role || 'athlete'
            };
            
            setCurrentUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('Set user from Supabase session:', userData);
          }
        } else {
          // Fallback to localStorage if no active session
          console.log('No active Supabase session, checking localStorage');
          const storedUser = localStorage.getItem('user');
          
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setCurrentUser(parsedUser);
            console.log('Set user from localStorage:', parsedUser);
          } else {
            console.log('No authentication data found');
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Derived information
  const isLoggedIn = !!currentUser;
  const userId = currentUser?.userId || null; // Return null when not logged in
  
  return {
    user: currentUser,
    userId,
    isLoggedIn,
    loading,
    login,
    logout
  };
};

export default useAuth; 