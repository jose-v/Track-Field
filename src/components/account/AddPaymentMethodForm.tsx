import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Alert,
  AlertIcon,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  useStripe,
  useElements,
  CardElement,
} from '@stripe/react-stripe-js';

interface AddPaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddPaymentMethodForm: React.FC<AddPaymentMethodFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: useColorModeValue('#2D3748', '#E2E8F0'),
        '::placeholder': {
          color: useColorModeValue('#A0AEC0', '#718096'),
        },
      },
    },
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setIsLoading(false);
      return;
    }

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        setError(stripeError.message || 'An error occurred');
        return;
      }

      // Here you would typically save the payment method to your backend
      console.log('Payment method created:', paymentMethod);
      
      // For now, just call onSuccess
      onSuccess();
    } catch (err) {
      setError('Failed to add payment method');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Box
          p={3}
          border="1px"
          borderColor={useColorModeValue('gray.200', 'gray.600')}
          borderRadius="md"
          w="100%"
        >
          <CardElement options={cardElementOptions} />
        </Box>

        <Box w="100%" display="flex" gap={3} justifyContent="flex-end">
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Adding..."
            disabled={!stripe}
          >
            Add Payment Method
          </Button>
        </Box>
      </VStack>
    </form>
  );
};

export default AddPaymentMethodForm; 