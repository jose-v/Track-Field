import React, { useState } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Badge,
  IconButton,
  Flex,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { FaCreditCard, FaPaypal } from 'react-icons/fa';
import AddPaymentMethodForm from './AddPaymentMethodForm';

interface PaymentMethod {
  id: string;
  type: 'credit' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string;
  isDefault: boolean;
}

const PaymentMethods: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'credit',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: '2',
      type: 'credit',
      last4: '1234',
      brand: 'Mastercard',
      expiryMonth: 8,
      expiryYear: 2026,
      isDefault: false,
    },
    {
      id: '3',
      type: 'paypal',
      email: 'john.doe@example.com',
      isDefault: false,
    },
  ]);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const handleDelete = (id: string) => {
    setPaymentMethods(methods => methods.filter(method => method.id !== id));
  };

  const getCardIcon = (brand: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  return (
    <>
      <Card bg={cardBg} shadow="sm">
        <CardHeader>
          <HStack justify="space-between" align="center">
            <Heading size="md">Payment Methods</Heading>
            <Button leftIcon={<AddIcon />} size="sm" colorScheme="blue" onClick={onOpen}>
              Add Payment Method
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {paymentMethods.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertDescription>
                  No payment methods added yet. Add one to continue with billing.
                </AlertDescription>
              </Alert>
            ) : (
              paymentMethods.map((method) => (
                <Box key={method.id} p={4} border="1px" borderColor={borderColor} borderRadius="md">
                  <Flex justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Box fontSize="xl">
                        {method.type === 'credit' ? (
                          <FaCreditCard />
                        ) : (
                          <FaPaypal color="#0070ba" />
                        )}
                      </Box>
                      <VStack align="start" spacing={0}>
                        {method.type === 'credit' ? (
                          <>
                            <Text fontWeight="semibold">
                              {method.brand} ending in {method.last4}
                            </Text>
                            <Text fontSize="sm" color={textColor}>
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text fontWeight="semibold">PayPal</Text>
                            <Text fontSize="sm" color={textColor}>
                              {method.email}
                            </Text>
                          </>
                        )}
                        {method.isDefault && (
                          <Badge colorScheme="green" size="sm">
                            Default
                          </Badge>
                        )}
                      </VStack>
                    </HStack>
                    <HStack spacing={2}>
                      {!method.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <IconButton
                        aria-label="Edit payment method"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                      />
                      <IconButton
                        aria-label="Delete payment method"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(method.id)}
                      />
                    </HStack>
                  </Flex>
                </Box>
              ))
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Add Payment Method Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Payment Method</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <AddPaymentMethodForm
              onSuccess={() => {
                // Add successful payment method logic here
                console.log('Payment method added successfully');
                onClose();
              }}
              onCancel={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PaymentMethods; 