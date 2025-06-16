import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// User role types
export type UserRole = 'athlete' | 'coach' | 'team_manager';

// Signup method types
export type SignupMethod = 'email' | 'google' | null;

// Shape of our signup data
export interface SignupData {
  signupMethod: SignupMethod;
  role: UserRole | null;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string; // Avatar URL from Supabase Storage
  termsAccepted?: boolean; // Whether user accepted terms and conditions
  termsAcceptedAt?: string; // ISO timestamp of when terms were accepted
  emailValid?: boolean; // Whether email format is valid and available
}

// The context type
interface SignupContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  signupData: SignupData;
  updateSignupData: (data: Partial<SignupData>) => void;
  totalSteps: number;
  resetSignupData: () => void;
}

// Create the context with undefined as default
const SignupContext = createContext<SignupContextType | undefined>(undefined);

// Initial state for signup data
const initialSignupData: SignupData = {
  signupMethod: null,
  role: null,
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  termsAccepted: false,
  termsAcceptedAt: undefined,
  emailValid: false,
};

// Local storage key
const SIGNUP_DATA_KEY = 'signup-data';
const SIGNUP_STEP_KEY = 'signup-step';

// Provider component
export function SignupProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupData>(initialSignupData);

  // New flow always has 4 steps: Method -> Role -> Account -> Personal
  const totalSteps = 4;

  // Load data from localStorage on initialization
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(SIGNUP_DATA_KEY);
      const savedStep = localStorage.getItem(SIGNUP_STEP_KEY);
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setSignupData(parsedData);
      }
      
      if (savedStep) {
        const step = parseInt(savedStep, 10);
        if (step >= 1 && step <= totalSteps) {
          setCurrentStep(step);
        }
      }
    } catch (error) {
      console.error('Error loading signup data from localStorage:', error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SIGNUP_DATA_KEY, JSON.stringify(signupData));
    } catch (error) {
      console.error('Error saving signup data to localStorage:', error);
    }
  }, [signupData]);

  // Save step to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SIGNUP_STEP_KEY, currentStep.toString());
    } catch (error) {
      console.error('Error saving signup step to localStorage:', error);
    }
  }, [currentStep]);

  // Update signup data
  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...data }));
  };

  // Reset signup data
  const resetSignupData = () => {
    setSignupData(initialSignupData);
    setCurrentStep(1);
    
    // Clear localStorage
    try {
      localStorage.removeItem(SIGNUP_DATA_KEY);
      localStorage.removeItem(SIGNUP_STEP_KEY);
    } catch (error) {
      console.error('Error clearing signup data from localStorage:', error);
    }
  };

  return (
    <SignupContext.Provider 
      value={{ 
        currentStep, 
        setCurrentStep, 
        signupData, 
        updateSignupData, 
        totalSteps,
        resetSignupData
      }}
    >
      {children}
    </SignupContext.Provider>
  );
}

// Custom hook to use the signup context
export function useSignup() {
  const context = useContext(SignupContext);
  if (context === undefined) {
    throw new Error('useSignup must be used within a SignupProvider');
  }
  return context;
} 