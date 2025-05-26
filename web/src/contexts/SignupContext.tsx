import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// User role types
export type UserRole = 'athlete' | 'coach' | 'team_manager';

// Shape of our signup data
export interface SignupData {
  role: UserRole | null;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  selectedAthletes: string[]; // IDs of selected athletes for coaches/team managers
}

// The context type
interface SignupContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  signupData: SignupData;
  updateSignupData: (data: Partial<SignupData>) => void;
  totalSteps: number;
}

// Create the context with undefined as default
const SignupContext = createContext<SignupContextType | undefined>(undefined);

// Initial state for signup data
const initialSignupData: SignupData = {
  role: null,
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  selectedAthletes: [],
};

// Provider component
export function SignupProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupData>(initialSignupData);

  // Get total steps based on role (coaches and team managers have an extra step)
  const totalSteps = signupData.role === 'athlete' ? 3 : 4;

  // Update signup data
  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...data }));
  };

  return (
    <SignupContext.Provider 
      value={{ 
        currentStep, 
        setCurrentStep, 
        signupData, 
        updateSignupData, 
        totalSteps 
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