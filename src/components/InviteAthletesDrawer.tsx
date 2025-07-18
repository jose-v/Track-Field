import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
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
  Card,
  CardBody,
  CardHeader,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useState } from 'react';
import { FaEnvelope, FaUserPlus, FaCheckCircle, FaBell } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface InviteAthletesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAthleteInvited?: () => void;
}

export const InviteAthletesDrawer = ({ isOpen, onClose, onAthleteInvited }: InviteAthletesDrawerProps) => {
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
      
      // Callback for parent component
      onAthleteInvited?.();
      
      // Close drawer
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
    <Drawer isOpen={isOpen} placement="right" onClose={handleClose} size="md">
      <DrawerOverlay />
      <DrawerContent bg="gray.800" color="white">
        <DrawerCloseButton color="white" />
        <DrawerHeader borderBottomWidth="1px" borderBottomColor="gray.700">
          <VStack align="start" spacing={1}>
            <HStack>
              <Icon as={FaUserPlus} color="blue.400" />
              <Heading size="md" color="white">Invite Athletes</Heading>
            </HStack>
            <Text fontSize="sm" color="gray.300" fontWeight="normal">
              Build your coaching team and invite athletes
            </Text>
          </VStack>
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={6} align="stretch">
            
            {/* How it Works Section */}
            <Card bg="gray.700" borderColor="gray.600">
              <CardHeader pb={2}>
                <HStack>
                  <Icon as={FaEnvelope} color="blue.400" />
                  <Heading size="sm" color="white">Secure Invitation Process</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <Text fontSize="sm" color="gray.300" lineHeight="tall">
                  For privacy and security, you can only invite athletes by email. 
                  They will receive an invitation and must approve your request before you can coach them.
                </Text>
              </CardBody>
            </Card>

            {/* Email Input Section */}
            <Box>
              <FormControl isRequired isInvalid={!!formErrors.email}>
                <FormLabel color="white" fontWeight="semibold">Athlete's Email Address</FormLabel>
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
                  size="lg"
                  _placeholder={{ color: "gray.400" }}
                  _hover={{ borderColor: "gray.500" }}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
                />
                {formErrors.email && <FormErrorMessage color="red.300">{formErrors.email}</FormErrorMessage>}
              </FormControl>
            </Box>
            
            {/* What Happens Next Section */}
            <Card bg="blue.900" borderColor="blue.600">
              <CardHeader pb={2}>
                <HStack>
                  <Icon as={FaCheckCircle} color="blue.400" />
                  <Heading size="sm" color="white">What Happens Next</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="start" spacing={2}>
                  <HStack align="start">
                    <Text color="blue.400" fontSize="lg" lineHeight="1.2">1.</Text>
                    <Text fontSize="sm" color="gray.200" lineHeight="tall">
                      If the athlete has an account, they receive a notification about your invitation
                    </Text>
                  </HStack>
                  <HStack align="start">
                    <Text color="blue.400" fontSize="lg" lineHeight="1.2">2.</Text>
                    <Text fontSize="sm" color="gray.200" lineHeight="tall">
                      If they don't have an account, they receive an invitation email to sign up
                    </Text>
                  </HStack>
                  <HStack align="start">
                    <Text color="blue.400" fontSize="lg" lineHeight="1.2">3.</Text>
                    <Text fontSize="sm" color="gray.200" lineHeight="tall">
                      They can view your profile and approve or decline your request
                    </Text>
                  </HStack>
                  <HStack align="start">
                    <Text color="blue.400" fontSize="lg" lineHeight="1.2">4.</Text>
                    <Text fontSize="sm" color="gray.200" lineHeight="tall">
                      Once approved, they appear in your athlete roster and you can coach them
                    </Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" borderTopColor="gray.700">
          <HStack spacing={3} w="100%">
            <Button 
              variant="ghost" 
              onClick={handleClose} 
              color="white" 
              _hover={{ bg: "gray.700" }}
              flex="1"
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSendInvitation}
              isLoading={isSending}
              loadingText="Sending..."
              leftIcon={<FaEnvelope />}
              isDisabled={!email.trim()}
              flex="2"
              size="lg"
            >
              Send Invitation
            </Button>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}; 