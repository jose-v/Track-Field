import React, { createContext, useContext, ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise, stripeConfig } from '../lib/stripe';

interface StripeContextType {
  // We can add stripe-related state and functions here later
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const value = {
    // Stripe context values will go here
  };

  return (
    <StripeContext.Provider value={value}>
      <Elements stripe={stripePromise} options={stripeConfig}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
};

export const useStripe = () => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}; 