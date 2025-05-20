import { useState, useEffect } from 'react';

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
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
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