import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  Icon,
  HStack,
  Badge,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaUserCheck, FaEnvelope, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function CoachInvitation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [coachName, setCoachName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [invitationInfo, setInvitationInfo] = useState<any>(null);
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    const checkInvitationDetails = async () => {
      try {
        // Get token from URL params (Supabase sends this)
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (token && type === 'signup') {
          // This is a signup confirmation - verify the token
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });
          
          if (error) {
            console.error('Token verification error:', error);
          } else if (data.user?.user_metadata) {
            // Extract coach information from user metadata
            const metadata = data.user.user_metadata;
            setCoachName(metadata.coach_name || 'Your coach');
            setInvitationInfo({
              invitedByCoach: metadata.invited_by_coach,
              coachName: metadata.coach_name,
              requiresPasswordReset: metadata.requires_password_reset
            });
          }
        }
        
        // If user is already logged in, check for pending coach invitations
        if (user?.id) {
          const { data: pendingInvitations, error: inviteError } = await supabase
            .from('coach_athletes')
            .select(`
              id,
              coach_id,
              approval_status,
              created_at,
              profiles!coach_athletes_coach_id_fkey (
                first_name,
                last_name
              )
            `)
            .eq('athlete_id', user.id)
            .eq('approval_status', 'pending');
          
          if (!inviteError && pendingInvitations && pendingInvitations.length > 0) {
            const invitation = pendingInvitations[0];
            const profile = invitation.profiles as any;
            setCoachName(`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Your coach');
            setInvitationInfo({
              invitationId: invitation.id,
              coachId: invitation.coach_id,
              coachName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
              createdAt: invitation.created_at
            });
          }
        }
      } catch (error) {
        console.error('Error checking invitation details:', error);
      } finally {
        setLoading(false);
      }
    };

    checkInvitationDetails();
  }, [user, searchParams]);

  const handleAcceptInvitation = async () => {
    if (!user?.id || !invitationInfo?.invitationId) return;
    
    try {
      // Update the coach-athlete relationship to approved
      const { error } = await supabase
        .from('coach_athletes')
        .update({ approval_status: 'approved' })
        .eq('id', invitationInfo.invitationId);
      
      if (error) throw error;
      
      // Create a notification for the coach
      await supabase
        .from('notifications')
        .insert({
          user_id: invitationInfo.coachId,
          title: 'Athlete Accepted Invitation',
          message: `An athlete has accepted your coaching invitation and joined your team.`,
          type: 'athlete_approval',
          metadata: { athlete_id: user.id },
          created_at: new Date().toISOString(),
          is_read: false
        });
      
      // Navigate to athlete dashboard
      navigate('/athlete/dashboard');
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!user?.id || !invitationInfo?.invitationId) return;
    
    try {
      // Update the coach-athlete relationship to declined
      const { error } = await supabase
        .from('coach_athletes')
        .update({ approval_status: 'declined' })
        .eq('id', invitationInfo.invitationId);
      
      if (error) throw error;
      
      // Navigate to athlete dashboard
      navigate('/athlete/dashboard');
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor} py={8}>
        <Container maxW="md">
          <VStack spacing={8} textAlign="center">
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color={subtextColor}>Loading invitation details...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="md">
        <VStack spacing={8} textAlign="center">
          <Icon as={FaEnvelope} boxSize={16} color="blue.500" />
          
          <VStack spacing={2}>
            <Heading size="lg" color={textColor}>
              Coach Invitation
            </Heading>
            <Text color={subtextColor} fontSize="lg">
              {coachName} has invited you to join their team
            </Text>
          </VStack>
          
          {!user ? (
            // User not logged in - show signup/login options
            <Card bg={cardBg} shadow="xl" borderRadius="xl" w="full">
              <CardBody p={8}>
                <VStack spacing={6}>
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box textAlign="left">
                      <AlertTitle fontSize="sm">Account Required</AlertTitle>
                      <AlertDescription fontSize="sm">
                        You need to create an account or sign in to accept this coaching invitation.
                      </AlertDescription>
                    </Box>
                  </Alert>
                  
                  <VStack spacing={4} w="full">
                    <Button
                      leftIcon={<FaUserPlus />}
                      colorScheme="blue"
                      size="lg"
                      w="full"
                      onClick={() => navigate('/signup')}
                    >
                      Create Account
                    </Button>
                    
                    <Button
                      leftIcon={<FaSignInAlt />}
                      variant="outline"
                      colorScheme="blue"
                      size="lg"
                      w="full"
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </Button>
                  </VStack>
                  
                  <Text fontSize="sm" color={subtextColor} textAlign="center">
                    After signing up or logging in, you'll be able to accept or decline this invitation.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ) : invitationInfo ? (
            // User logged in and has pending invitation
            <Card bg={cardBg} shadow="xl" borderRadius="xl" w="full">
              <CardBody p={8}>
                <VStack spacing={6}>
                  <Alert status="success" borderRadius="md">
                    <AlertIcon />
                    <Box textAlign="left">
                      <AlertTitle fontSize="sm">Invitation Pending</AlertTitle>
                      <AlertDescription fontSize="sm">
                        {invitationInfo.coachName} would like to add you to their team as an athlete.
                      </AlertDescription>
                    </Box>
                  </Alert>
                  
                  <VStack spacing={2} textAlign="center">
                    <Text color={textColor} fontWeight="medium">
                      Coach: {invitationInfo.coachName}
                    </Text>
                    {invitationInfo.createdAt && (
                      <Text fontSize="sm" color={subtextColor}>
                        Invited on {new Date(invitationInfo.createdAt).toLocaleDateString()}
                      </Text>
                    )}
                  </VStack>
                  
                  <HStack spacing={4} w="full">
                    <Button
                      leftIcon={<FaUserCheck />}
                      colorScheme="green"
                      size="lg"
                      flex="1"
                      onClick={handleAcceptInvitation}
                    >
                      Accept
                    </Button>
                    
                    <Button
                      variant="outline"
                      colorScheme="red"
                      size="lg"
                      flex="1"
                      onClick={handleDeclineInvitation}
                    >
                      Decline
                    </Button>
                  </HStack>
                  
                  <Text fontSize="sm" color={subtextColor} textAlign="center">
                    By accepting, {invitationInfo.coachName} will be able to assign you workouts and track your progress.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            // User logged in but no pending invitations
            <Card bg={cardBg} shadow="xl" borderRadius="xl" w="full">
              <CardBody p={8}>
                <VStack spacing={6}>
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box textAlign="left">
                      <AlertTitle fontSize="sm">No Pending Invitations</AlertTitle>
                      <AlertDescription fontSize="sm">
                        You don't have any pending coach invitations at this time.
                      </AlertDescription>
                    </Box>
                  </Alert>
                  
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={() => navigate('/athlete/dashboard')}
                  >
                    Go to Dashboard
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
    </Box>
  );
} 