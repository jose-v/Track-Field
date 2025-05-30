import { loadStripe } from '@stripe/stripe-js';

// Add your Stripe publishable key to your .env file as VITE_STRIPE_PUBLISHABLE_KEY
// Do NOT replace the placeholder below - use environment variables instead
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here';

// Initialize Stripe
export const stripePromise = loadStripe(stripePublishableKey);

// Stripe configuration
export const stripeConfig = {
  // Add other Stripe configuration options here
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#3182ce', // Blue theme to match your app
    },
  },
}; 