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
  Box
} from '@chakra-ui/react';
import { FiUsers, FiCheck } from 'react-icons/fi';
import { joinTeamByInviteCode } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';

interface JoinTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const JoinTeamModal: React.FC<JoinTeamModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSubmit = async () => {
    if (!user || !userRole || !inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await joinTeamByInviteCode(
        inviteCode.trim().toUpperCase(),
        user.id,
        userRole
      );

      if (result.success && result.team) {
        setSuccess(`Successfully joined ${result.team.name}!`);
        setInviteCode('');
        
        // Wait a moment to show success message
        setTimeout(() => {
          onSuccess?.();
          onClose();
          setSuccess(null);
        }, 2000);
      } else {
        setError(result.error || 'Failed to join team');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Join team error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  const isValidCode = inviteCode.trim().length === 8;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
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
              <Icon as={FiUsers} boxSize={5} />
            </Box>
            <Text>Join a Team</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Enter the 8-character invite code to join a team as {userRole === 'team_manager' ? 'a team manager' : `an ${userRole}`}.
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

            <FormControl isInvalid={!!error && !success}>
              <FormLabel>Invite Code</FormLabel>
              <Input
                placeholder="Enter 8-character code"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                maxLength={8}
                textTransform="uppercase"
                letterSpacing="wider"
                fontSize="lg"
                fontWeight="bold"
                textAlign="center"
                isDisabled={isLoading || !!success}
              />
              {error && (
                <FormErrorMessage>{error}</FormErrorMessage>
              )}
            </FormControl>

            {userRole === 'team_manager' && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Note: Team managers cannot join teams using invite codes. You can only create and manage your own teams.
                </Text>
              </Alert>
            )}
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
              loadingText="Joining..."
              isDisabled={!isValidCode || userRole === 'team_manager' || !!success}
            >
              Join Team
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 