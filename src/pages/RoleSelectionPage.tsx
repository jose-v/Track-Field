import React, { useState } from 'react';
import { 
  Box, 
  SimpleGrid, 
  Heading, 
  Text, 
  VStack,  
  useColorModeValue,
  Button,
  Alert,
  AlertIcon,
  Center,
  Container,
  useToast
} from '@chakra-ui/react';
import { FaRunning, FaChalkboardTeacher, FaUsers } from 'react-icons/fa';
import { useProfile } from '../hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

type UserRole = 'athlete' | 'coach' | 'team_manager';

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  iconElement: ReactNode;
  isSelected: boolean;
  onClick: () => void;
}

function RoleCard({ role, title, description, iconElement, isSelected, onClick }: RoleCardProps) {
  const bgColor = useColorModeValue('white', 'gray.700');
  const selectedBorderColor = useColorModeValue('blue.500', 'blue.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const titleColor = useColorModeValue('gray.800', 'gray.100');
  const descriptionColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue(
    isSelected ? 'blue.500' : 'gray.500',
    isSelected ? 'blue.300' : 'gray.400'
  );
  
  return (
    <Box
      p={6}
      borderWidth={2}
      borderRadius="lg"
      borderColor={isSelected ? selectedBorderColor : 'transparent'}
      boxShadow={isSelected ? 'md' : 'base'}
      bg={bgColor}
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md", bg: hoverBg }}
      height="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
    >
      <VStack spacing={4} align="center">
        <Box fontSize={{ base: "2.5rem", md: "3rem" }} color={iconColor}>
          {iconElement}
        </Box>
        <Heading size="md" color={titleColor}>{title}</Heading>
        <Text 
          textAlign="center" 
          color={descriptionColor} 
          fontSize={{ base: "sm", md: "md" }}
        >
          {description}
        </Text>
      </VStack>
    </Box>
  );
}

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Dark mode adaptive colors
  const headingColor = useColorModeValue('gray.800', 'gray.100');
  const descriptionColor = useColorModeValue('gray.600', 'gray.300');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
  };
  
  const handleConfirmRole = async () => {
    if (!selectedRole || !profile) return;
    
    setIsUpdating(true);
    try {
      console.log('🔄 Starting role update for:', selectedRole);
      console.log('🔄 Current profile:', profile);
      
      // Use direct database update instead of complex updateProfile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      console.log('🔄 Updating role directly in database...');
      const { data: updatedProfile, error: roleUpdateError } = await supabase
        .from('profiles')
        .update({ 
          role: selectedRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (roleUpdateError) {
        console.error('❌ Direct role update failed:', roleUpdateError);
        throw new Error(`Failed to update role: ${roleUpdateError.message}`);
      }
      
      console.log('✅ Role updated successfully:', updatedProfile);
      
      // Create role-specific profile entry
      console.log('🔄 Creating role-specific profile...');
      switch (selectedRole) {
        case 'athlete':
          const { error: athleteError } = await supabase
            .from('athletes')
            .upsert([{
              id: user.id,
              birth_date: null,
              gender: null,
              events: [],
              team_id: null
            }], { onConflict: 'id' });
          if (athleteError) console.warn('Athlete profile creation warning:', athleteError);
          break;
          
        case 'coach':
          const { error: coachError } = await supabase
            .from('coaches')
            .upsert([{
              id: user.id,
              specialties: [],
              certifications: []
            }], { onConflict: 'id' });
          if (coachError) console.warn('Coach profile creation warning:', coachError);
          break;
          
        case 'team_manager':
          // Team managers use unified system - no additional table needed
          console.log('Team manager role set - no additional profile needed');
          break;
      }
      
      // Clear any cached profile data
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: 'Role Updated',
        description: `Your role has been set to ${selectedRole}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Add small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to the appropriate dashboard
      switch (selectedRole) {
        case 'athlete':
          navigate('/athlete/dashboard');
          break;
        case 'coach':
          navigate('/coach/dashboard');
          break;
        case 'team_manager':
          navigate('/team-manager/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Role update error:', error);
      toast({
        title: 'Error',
        description: `Failed to update your role: ${error.message}. Please try again.`,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="4xl">
        <Center>
          <VStack spacing={8} align="center" w="100%">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Role Selection Required</Text>
                <Text fontSize="sm">
                  Your profile was found but doesn't have a role assigned. Please select your role to continue.
                </Text>
              </Box>
            </Alert>
            
            <Box textAlign="center">
              <Heading size="lg" mb={4} color={headingColor}>
                What's your role?
              </Heading>
              <Text color={descriptionColor} fontSize="md">
                Select the role that best describes you to access the appropriate features
              </Text>
            </Box>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 6, md: 6 }} width="100%">
              <RoleCard
                role="athlete"
                title="Athlete"
                description="Track your workouts, view your progress, and connect with your coaches."
                iconElement={<FaRunning />}
                isSelected={selectedRole === 'athlete'}
                onClick={() => handleRoleSelection('athlete')}
              />
              
              <RoleCard
                role="coach"
                title="Coach"
                description="Create workouts, track athlete progress, and manage your team."
                iconElement={<FaChalkboardTeacher />}
                isSelected={selectedRole === 'coach'}
                onClick={() => handleRoleSelection('coach')}
              />
              
              <RoleCard
                role="team_manager"
                title="Team Manager"
                description="Oversee multiple coaches and athletes, manage events and team logistics."
                iconElement={<FaUsers />}
                isSelected={selectedRole === 'team_manager'}
                onClick={() => handleRoleSelection('team_manager')}
              />
            </SimpleGrid>
            
            <Button
              colorScheme="blue"
              size="lg"
              isDisabled={!selectedRole}
              isLoading={isUpdating}
              loadingText="Updating..."
              onClick={handleConfirmRole}
              px={8}
            >
              Continue as {selectedRole ? selectedRole.replace('_', ' ') : 'Selected Role'}
            </Button>
          </VStack>
        </Center>
      </Container>
    </Box>
  );
} 