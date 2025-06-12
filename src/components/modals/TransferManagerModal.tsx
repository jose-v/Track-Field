import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Avatar,
  Box,
  useToast,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { searchPotentialManagers, transferManagerRole } from '../../services/institutionService';
import { ManagerTransferRequest } from '../../types/institution';

interface TransferManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentManagerId: string;
  institutionName: string;
}

export function TransferManagerModal({ 
  isOpen, 
  onClose, 
  currentManagerId, 
  institutionName 
}: TransferManagerModalProps) {
  const toast = useToast();
  const [step, setStep] = useState<'search' | 'confirm'>('search');
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [transferReason, setTransferReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Color mode values
  const modalBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSearchManager = async () => {
    if (!searchEmail.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!validateEmail(searchEmail)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      
      const managers = await searchPotentialManagers(searchEmail);
      
      if (managers.length === 0) {
        setErrors({ email: 'No team manager found with this email address' });
        return;
      }

      const manager = managers[0];
      
      if (manager.id === currentManagerId) {
        setErrors({ email: 'You cannot transfer management to yourself' });
        return;
      }

      setSelectedManager(manager);
      setStep('confirm');
    } catch (error) {
      console.error('Error searching for manager:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for manager',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedManager) return;

    try {
      setLoading(true);
      
      const transferRequest: ManagerTransferRequest = {
        old_manager_id: currentManagerId,
        new_manager_id: selectedManager.id,
        new_manager_email: selectedManager.email,
        transfer_reason: transferReason.trim() || undefined,
      };

      const success = await transferManagerRole(transferRequest);
      
      if (success) {
        toast({
          title: 'Transfer Successful',
          description: `Management has been transferred to ${selectedManager.first_name} ${selectedManager.last_name}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        handleClose();
        
        // Redirect to dashboard since user is no longer the manager
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        throw new Error('Transfer failed');
      }
    } catch (error) {
      console.error('Error transferring management:', error);
      toast({
        title: 'Transfer Failed',
        description: 'Failed to transfer management. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('search');
    setSearchEmail('');
    setSelectedManager(null);
    setTransferReason('');
    setErrors({});
    onClose();
  };

  const handleBack = () => {
    setStep('search');
    setSelectedManager(null);
    setErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={modalBg}>
        <ModalHeader>
          {step === 'search' ? 'Transfer Management' : 'Confirm Transfer'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {step === 'search' ? (
            <VStack spacing={6}>
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Important!</AlertTitle>
                  <AlertDescription>
                    Transferring management will remove your access to manage {institutionName}. 
                    This action cannot be undone.
                  </AlertDescription>
                </Box>
              </Alert>

              <FormControl isRequired isInvalid={!!errors.email}>
                <FormLabel>New Manager's Email</FormLabel>
                <Input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => {
                    setSearchEmail(e.target.value);
                    if (errors.email) setErrors({});
                  }}
                  placeholder="Enter the email of the new manager"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <Text fontSize="sm" color={textColor} textAlign="center">
                The new manager must already have a team manager account in the system.
              </Text>
            </VStack>
          ) : (
            <VStack spacing={6}>
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Confirm Transfer</AlertTitle>
                  <AlertDescription>
                    You are about to transfer management of {institutionName} to:
                  </AlertDescription>
                </Box>
              </Alert>

              {selectedManager && (
                <Box
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  borderColor={useColorModeValue("gray.200", "gray.600")}
                  width="100%"
                >
                  <HStack spacing={4}>
                    <Avatar
                      size="md"
                      src={selectedManager.avatar_url}
                      name={`${selectedManager.first_name} ${selectedManager.last_name}`}
                    />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">
                        {selectedManager.first_name} {selectedManager.last_name}
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                        {selectedManager.email}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              <Divider />

              <FormControl>
                <FormLabel>Reason for Transfer (Optional)</FormLabel>
                <Textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Briefly explain why you're transferring management..."
                  rows={3}
                />
              </FormControl>

              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Final Warning</AlertTitle>
                  <AlertDescription>
                    After confirming, you will lose all management privileges for {institutionName}. 
                    Only the new manager will be able to reverse this action.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          {step === 'search' ? (
            <>
              <Button variant="ghost" mr={3} onClick={handleClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSearchManager}
                isLoading={loading}
                loadingText="Searching..."
              >
                Search Manager
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" mr={3} onClick={handleBack}>
                Back
              </Button>
              <Button
                colorScheme="red"
                onClick={handleTransfer}
                isLoading={loading}
                loadingText="Transferring..."
              >
                Confirm Transfer
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 