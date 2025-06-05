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
  Input,
  VStack,
  Text,
  useToast,
  Box,
  Heading,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface AddAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddAthleteModal = ({ isOpen, onClose }: AddAthleteModalProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const queryClient = useQueryClient();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleReset = () => {
    setEmail('');
    setFormErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSendInvitation = async () => {
    if (!user?.id || !email.trim()) return;
    
    // Validate email
    if (!validateEmail(email.trim())) {
      setFormErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    try {
      setIsSending(true);
      setFormErrors({});
      
      const athleteEmail = email.trim().toLowerCase();
      
      // Get coach info for notification
      const { data: coachData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      const coachName = coachData 
        ? `${coachData.first_name || ''} ${coachData.last_name || ''}`.trim() 
        : 'Your coach';
      
      // First check if an athlete with this email already exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('email', athleteEmail)
        .single();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        throw profileCheckError;
      }
      
      let athleteId: string;
      let isNewUser = false;
      
      if (existingProfile) {
        // Athlete already exists
        athleteId = existingProfile.id;
        
        // Check if there's already a relationship (pending, approved, or declined)
        const { data: existingRelation, error: relationCheckError } = await supabase
          .from('coach_athletes')
          .select('approval_status')
          .eq('coach_id', user.id)
          .eq('athlete_id', athleteId)
          .single();
        
        if (relationCheckError && relationCheckError.code !== 'PGRST116') {
          throw relationCheckError;
        }
        
        if (existingRelation) {
          // Relationship already exists
          const status = existingRelation.approval_status;
          if (status === 'pending') {
            toast({
              title: 'Invitation Already Sent',
              description: `You already have a pending invitation to ${athleteEmail}. Please wait for them to respond.`,
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            return;
          } else if (status === 'approved') {
            toast({
              title: 'Athlete Already on Team',
              description: `${athleteEmail} is already on your team.`,
              status: 'info',
              duration: 5000,
              isClosable: true,
            });
            return;
          } else if (status === 'declined') {
            toast({
              title: 'Previous Invitation Declined',
              description: `${athleteEmail} previously declined your invitation. You cannot send another invitation at this time.`,
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
        }
        
        // Make sure they have athlete role
        if (existingProfile.role !== 'athlete') {
          await supabase
            .from('profiles')
            .update({ role: 'athlete' })
            .eq('id', athleteId);
        }
        
        // Check if athlete record exists, create if not
        const { data: athleteRecord, error: athleteCheckError } = await supabase
          .from('athletes')
          .select('id')
          .eq('id', athleteId)
          .single();
        
        if (athleteCheckError && athleteCheckError.code === 'PGRST116') {
          // Athlete record doesn't exist, create it
          await supabase
            .from('athletes')
            .insert({
              id: athleteId,
              events: []
            });
        }
      } else {
        // User doesn't exist - send Supabase invitation email
        isNewUser = true;
        
        // Use Supabase's built-in invitation system
        const redirectTo = `${window.location.origin}/coach-invitation`;
        
        try {
          // Try to send invitation using Supabase auth
          const { data: inviteData, error: inviteError } = await supabase.auth.signUp({
            email: athleteEmail,
            password: crypto.randomUUID(), // Random password they'll reset
            options: {
              emailRedirectTo: redirectTo,
              data: {
                role: 'athlete',
                invited_by_coach: user.id,
                coach_name: coachName,
                requires_password_reset: true
              }
            }
          });

          if (inviteError) {
            // If user already exists in auth but not in profiles, handle gracefully
            if (inviteError.message?.includes('already been registered')) {
              // Try to handle the case where user exists in auth but not in our profiles table
              console.warn('User exists in auth but not in profiles, handling manually');
              
              // Generate a new UUID for this case
              athleteId = crypto.randomUUID();
              
              // Create the profile first
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: athleteId,
                  email: athleteEmail,
                  role: 'athlete',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              
              if (profileError) throw profileError;
              
              // Create the athlete record
              const { error: athleteError } = await supabase
                .from('athletes')
                .insert({
                  id: athleteId,
                  events: []
                });
              
              if (athleteError) throw athleteError;
            } else {
              throw inviteError;
            }
          } else {
            // Successfully sent invitation
            athleteId = inviteData.user?.id || crypto.randomUUID();
            
            // The user will be automatically created in the profiles table by our database triggers
            // when they confirm their email, but we need to create the athlete record now
            
            // Wait a moment for potential triggers to run
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Create athlete record if it doesn't exist
            const { error: athleteError } = await supabase
              .from('athletes')
              .upsert({
                id: athleteId,
                events: []
              }, { 
                onConflict: 'id',
                ignoreDuplicates: true 
              });
            
            if (athleteError) {
              console.warn('Could not create athlete record immediately:', athleteError);
              // This is not critical - the record can be created later when they sign up
            }
          }
        } catch (inviteError) {
          console.error('Invitation error:', inviteError);
          throw new Error(`Failed to send invitation: ${inviteError.message}`);
        }
      }
      
      // Create coach-athlete relationship with pending status
      const { error: relationshipError } = await supabase
        .from('coach_athletes')
        .insert({
          coach_id: user.id,
          athlete_id: athleteId,
          created_at: new Date().toISOString(),
          requested_at: new Date().toISOString(),
          approval_status: 'pending'
        });
      
      if (relationshipError) throw relationshipError;
      
      // Create notification for the athlete (only if they exist)
      if (!isNewUser) {
        await supabase
          .from('notifications')
          .insert({
            user_id: athleteId,
            title: 'New Coach Request',
            message: `${coachName} wants to add you to their team.`,
            type: 'coach_request',
            metadata: { coach_id: user.id },
            created_at: new Date().toISOString(),
            is_read: false
          });
      }
      
      // Success message based on whether user exists or not
      const successMessage = isNewUser 
        ? `An invitation email has been sent to ${athleteEmail}. They will need to sign up and can then approve your coaching request.`
        : `An invitation has been sent to ${athleteEmail}. They will receive a notification and can approve or decline your request.`;
      
      toast({
        title: 'Invitation Sent Successfully',
        description: successMessage,
        status: 'success',
        duration: 6000,
        isClosable: true,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['coach-athletes', user.id] });
      
      // Close modal
      handleClose();
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error Sending Invitation',
        description: error instanceof Error ? error.message : 'Failed to send invitation. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Heading size="md" color="white">Invite Athlete to Your Team</Heading>
            <Text fontSize="sm" color="gray.300" fontWeight="normal">
              Enter the athlete's email address to send an invitation
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <VStack spacing={4}>
            
            <Alert status="info" borderRadius="md" bg="blue.900" borderColor="blue.600">
              <AlertIcon color="blue.300" />
              <Box>
                <AlertTitle fontSize="sm" color="white">Secure Invitation Process</AlertTitle>
                <AlertDescription fontSize="sm" color="gray.200">
                  For privacy and security, you can only invite athletes by email. 
                  They will receive an invitation and must approve your request before you can coach them.
                </AlertDescription>
              </Box>
            </Alert>
            
            <FormControl isRequired isInvalid={!!formErrors.email}>
              <FormLabel color="white">Athlete's Email Address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter athlete's email (e.g., athlete@example.com)"
                autoComplete="email"
                autoFocus
                bg="gray.700"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: "gray.400" }}
                _hover={{ borderColor: "gray.500" }}
                _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
              />
              {formErrors.email && <FormErrorMessage color="red.300">{formErrors.email}</FormErrorMessage>}
            </FormControl>
            
            <Box w="100%" p={4} bg="gray.700" borderRadius="md" borderColor="gray.600" borderWidth="1px">
              <Text fontSize="sm" color="white">
                <Text as="span" fontWeight="bold" color="white">What happens next:</Text>
                <br />
                1. If the athlete has an account, they receive a notification about your invitation
                <br />
                2. If they don't have an account, they receive an invitation email to sign up
                <br />
                3. They can view your profile and approve or decline your request
                <br />
                4. Once approved, they appear in your athlete roster and you can coach them
              </Text>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose} color="white" _hover={{ bg: "gray.700" }}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSendInvitation}
            isLoading={isSending}
            loadingText="Sending Invitation..."
            leftIcon={<FaEnvelope />}
            isDisabled={!email.trim()}
          >
            Send Invitation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddAthleteModal; 