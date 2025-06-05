import { createContext, useContext, useState } from 'react';
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
  profileImage?: string; // Base64 encoded profile image
  termsAccepted?: boolean; // Whether user accepted terms and conditions
  termsAcceptedAt?: string; // ISO timestamp of when terms were accepted
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
};

// Provider component
export function SignupProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupData>(initialSignupData);

  // New flow always has 4 steps: Method -> Role -> Account -> Personal
  const totalSteps = 4;

  // Update signup data
  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...data }));
  };

  // Reset signup data
  const resetSignupData = () => {
    setSignupData(initialSignupData);
    setCurrentStep(1);
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