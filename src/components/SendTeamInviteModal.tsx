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
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  FormControl,
  FormLabel,
  FormErrorMessage,
  HStack,
  Icon,
  Box,
  Select,
  Textarea
} from '@chakra-ui/react';
import { FiMail, FiCheck, FiUsers } from 'react-icons/fi';
import { sendTeamInvitation } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';

interface SendTeamInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onSuccess?: () => void;
}

export const SendTeamInviteModal: React.FC<SendTeamInviteModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  onSuccess
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'athlete' | 'coach'>('athlete');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSubmit = async () => {
    if (!user || !email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await sendTeamInvitation(
        teamId,
        email.trim(),
        role,
        user.id
      );

      if (result.success) {
        setSuccess(`Invitation sent to ${email}!`);
        setEmail('');
        setMessage('');
        
        // Wait a moment to show success message
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.error || 'Failed to send invitation');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Send invitation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('athlete');
    setMessage('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  const isValidEmail = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent bg={bgColor} borderColor={borderColor} borderWidth="1px">
        <ModalHeader>
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="lg"
              bg={useColorModeValue('blue.50', 'blue.900')}
              color={useColorModeValue('blue.500', 'blue.300')}
            >
              <Icon as={FiMail} boxSize={5} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text>Send Team Invitation</Text>
              <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                {teamName}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Send an email invitation to join your team. They'll receive the team's invite code and can join immediately.
            </Text>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">{error}</Text>
              </Alert>
            )}

            {success && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <HStack>
                  <Icon as={FiCheck} />
                  <Text fontSize="sm">{success}</Text>
                </HStack>
              </Alert>
            )}

            <FormControl isInvalid={!!error && !success} isRequired>
              <FormLabel>Email Address</FormLabel>
              <Input
                type="email"
                placeholder="athlete@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                isDisabled={isLoading || !!success}
              />
              {error && (
                <FormErrorMessage>{error}</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Role</FormLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as 'athlete' | 'coach')}
                isDisabled={isLoading || !!success}
              >
                <option value="athlete">Athlete</option>
                <option value="coach">Coach</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Personal Message (Optional)</FormLabel>
              <Textarea
                placeholder="Hi! I'd like to invite you to join our team..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                isDisabled={isLoading || !!success}
                rows={3}
              />
            </FormControl>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                The invitation will include your team's invite code so they can join immediately.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose} isDisabled={isLoading}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isLoading}
              loadingText="Sending..."
              isDisabled={!isValidEmail || !!success}
              leftIcon={<FiMail />}
            >
              Send Invitation
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 