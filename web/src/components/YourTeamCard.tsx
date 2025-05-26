import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardBody,
  Heading,
  Text,
  Stack,
  Flex,
  HStack,
  Badge,
  Avatar,
  Button,
  IconButton,
  useColorModeValue,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Code,
  Box
} from '@chakra-ui/react';
import { FaUserPlus, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCoachAthletes } from '../hooks/useCoachAthletes';
import AddAthleteModal from './AddAthleteModal';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

const YourTeamCard = () => {
  const { user } = useAuth();
  const { data: athletes = [], isLoading: athletesLoading, refetch } = useCoachAthletes();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const athleteItemHoverBg = useColorModeValue('gray.50', 'gray.700');
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Alert dialog for delete confirmation
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const athleteToRemoveRef = useRef<any>(null);
  const [athleteToRemoveState, setAthleteToRemoveState] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [relationshipRecords, setRelationshipRecords] = useState<any[]>([]);
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  // Debug logging of current athletes
  useEffect(() => {
    console.log("Current athletes in YourTeamCard:", athletes);
  }, [athletes]);

  // Helper function to get Badge color based on completion rate
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'green';
    if (rate >= 60) return 'yellow';
    return 'red';
  };
  
  // Handle opening the delete confirmation dialog
  const handleOpenRemoveDialog = async (athlete: any) => {
    console.log("Opening remove dialog for athlete:", athlete);
    athleteToRemoveRef.current = athlete;
    setAthleteToRemoveState(athlete);
    setDeleteError(null);
    
    // Fetch ALL relationships for this athlete to understand what's in the database
    try {
      // First try to find the exact relationship for this coach and athlete
      const { data: exactMatches, error: exactError } = await supabase
        .from('coach_athletes')
        .select('*')
        .match({
          'athlete_id': athlete.id,
          'coach_id': user?.id
        });
        
      if (exactError) {
        console.error("Error fetching exact relationship record:", exactError);
        setRelationshipRecords([]);
      } else {
        console.log("Found exact relationship records:", exactMatches);
        
        if (!exactMatches || exactMatches.length === 0) {
          // If no exact match, look for any records with this athlete ID
          const { data: athleteRecords, error: athleteError } = await supabase
            .from('coach_athletes')
            .select('*')
            .eq('athlete_id', athlete.id);
            
          if (athleteError) {
            console.error("Error fetching athlete relationships:", athleteError);
            setRelationshipRecords([]);
          } else {
            console.log("Found athlete relationship records:", athleteRecords);
            setRelationshipRecords(athleteRecords || []);
          }
        } else {
          setRelationshipRecords(exactMatches || []);
        }
      }
    } catch (err) {
      console.error("Error in fetching relationships:", err);
      setRelationshipRecords([]);
    }
    
    setIsDeleteAlertOpen(true);
  };
  
  // Handle closing the delete confirmation dialog
  const handleCloseRemoveDialog = () => {
    setIsDeleteAlertOpen(false);
    athleteToRemoveRef.current = null;
    setAthleteToRemoveState(null);
    setDeleteError(null);
    setRelationshipRecords([]);
  };
  
  // Handle removing an athlete from the team
  const handleRemoveAthlete = async () => {
    const athleteToRemove = athleteToRemoveRef.current;
    if (!athleteToRemove?.id || !user?.id) {
      setDeleteError("Missing athlete or user information");
      return;
    }
    
    try {
      setIsRemoving(true);
      setDeleteError(null);
      
      // Target specific coach-athlete relationship by both IDs
      console.log(`Attempting to delete coach-athlete relationship for athlete ID: ${athleteToRemove.id} and coach ID: ${user.id}`);
      
      // First fetch the records to see what we're working with
      const { data: recordsToDelete, error: fetchError } = await supabase
        .from('coach_athletes')
        .select('*')
        .match({
          'athlete_id': athleteToRemove.id,
          'coach_id': user.id
        });
        
      if (fetchError) {
        console.error('Error fetching relationships to delete:', fetchError);
        setDeleteError(`Could not fetch relationships: ${fetchError.message}`);
        setIsRemoving(false);
        return;
      }
      
      console.log('Found relationships to delete:', recordsToDelete);
      
      if (!recordsToDelete || recordsToDelete.length === 0) {
        console.warn('No matching coach-athlete relationship found');
        setDeleteError('No matching coach-athlete relationship found to delete');
        setIsRemoving(false);
        return;
      }
      
      // Now perform the delete operation
      const { error } = await supabase
        .from('coach_athletes')
        .delete()
        .match({
          'athlete_id': athleteToRemove.id,
          'coach_id': user.id
        });
      
      if (error) {
        console.error('Error deleting coach-athlete relationship:', error);
        setDeleteError(`Delete failed: ${error.message}`);
        
        toast({
          title: 'Error',
          description: `Failed to remove athlete: ${error.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.log(`Successfully removed athlete ${athleteToRemove.id} from coach ${user.id}`);
        
        // Force refresh all athlete-related queries
        await Promise.all([
          refetch(),
          queryClient.invalidateQueries({ queryKey: ['coach-athletes'] }),
          queryClient.invalidateQueries({ queryKey: ['coach-athletes', user.id] }),
          queryClient.invalidateQueries({ queryKey: ['athletes'] }),
          queryClient.invalidateQueries({ queryKey: ['workouts'] })
        ]);
        
        // Success message
        toast({
          title: 'Athlete Removed',
          description: `${athleteToRemove.first_name} ${athleteToRemove.last_name} has been removed from your team`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Close the dialog
        handleCloseRemoveDialog();
      }
    } catch (error: any) {
      console.error('Error in handleRemoveAthlete:', error);
      setDeleteError(`Error: ${error.message}`);
      toast({
        title: 'Error',
        description: 'Failed to remove athlete from your team',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="md" borderRadius="xl">
        <CardBody>
          <Heading size="md" mb={4}>Your Team</Heading>
          {athletesLoading ? (
            <Text>Loading athletes...</Text>
          ) : athletes.length === 0 ? (
            <Text>No athletes assigned yet.</Text>
          ) : (
            <Stack spacing={4}>
              {athletes.map((athlete: any) => (
                <Flex 
                  key={athlete.id} 
                  align="center" 
                  justify="space-between" 
                  p={2} 
                  borderRadius="md" 
                  _hover={{ bg: athleteItemHoverBg }}
                >
                  <HStack>
                    <Avatar 
                      size="sm" 
                      src={athlete.avatar_url || athlete.avatar} 
                      name={athlete.first_name && athlete.last_name 
                        ? `${athlete.first_name} ${athlete.last_name}`
                        : athlete.name} 
                    />
                    <Text fontWeight="medium">
                      {athlete.first_name && athlete.last_name 
                        ? `${athlete.first_name} ${athlete.last_name}`
                        : athlete.name}
                    </Text>
                  </HStack>
                  <IconButton
                    aria-label="Remove athlete"
                    icon={<FaTrash />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleOpenRemoveDialog(athlete)}
                  />
                </Flex>
              ))}
            </Stack>
          )}
          <Button 
            leftIcon={<FaUserPlus />} 
            colorScheme="brand" 
            mt={4} 
            w="full" 
            borderRadius="md" 
            size="sm"
            onClick={onOpen}
          >
            Add Athlete
          </Button>
        </CardBody>
      </Card>

      {/* Add Athlete Modal */}
      <AddAthleteModal isOpen={isOpen} onClose={onClose} />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={handleCloseRemoveDialog}
        size="lg"
      >
        <AlertDialogOverlay>
          <AlertDialogContent minHeight="220px">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Athlete
            </AlertDialogHeader>

            <AlertDialogBody>
              <Stack spacing={4} minHeight="100px">
                <Text>
                  Are you sure you want to remove <strong>{athleteToRemoveRef.current?.first_name} {athleteToRemoveRef.current?.last_name}</strong> from your team? 
                  This action cannot be undone.
                </Text>
                {deleteError && (
                  <Text color="red">{deleteError}</Text>
                )}
              </Stack>
              {/* Action buttons styled as a footer */}
              <HStack width="100%" justifyContent="flex-end" pt={4} spacing={4}>
                <Button ref={cancelRef} onClick={handleCloseRemoveDialog}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleRemoveAthlete} 
                  isLoading={isRemoving}
                >
                  Remove
                </Button>
              </HStack>
            </AlertDialogBody>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default YourTeamCard; 