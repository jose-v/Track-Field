import React, { useState, useEffect } from 'react';
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
  Textarea,
  VStack,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  Avatar,
  HStack,
  IconButton,
  Box
} from '@chakra-ui/react';
import { FaCamera, FaTrash } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: 'school' | 'club' | 'coach' | 'independent';
  logo_url?: string;
  institution_name?: string;
  institution_type?: string;
}

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onTeamUpdated?: () => void;
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  onClose,
  team,
  onTeamUpdated
}) => {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [teamType, setTeamType] = useState<'school' | 'club' | 'coach' | 'independent'>('coach');
  const [logoUrl, setLogoUrl] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  // Color mode values for better readability
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const modalBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Initialize form with team data when modal opens
  useEffect(() => {
    if (team && isOpen) {
      setTeamName(team.name || '');
      setDescription(team.description || '');
      setTeamType(team.team_type || 'coach');
      setLogoUrl(team.logo_url || '');
      setInstitutionName(team.institution_name || '');
      setInstitutionType(team.institution_type || '');
    }
  }, [team, isOpen]);

  const handleUpdateTeam = async () => {
    if (!teamName.trim() || !user?.id || !team?.id) return;

    setIsUpdating(true);
    try {
      const updateData: any = {
        name: teamName.trim(),
        description: description.trim() || null,
        team_type: teamType,
        logo_url: logoUrl.trim() || null,
      };

      // Add institution fields for school teams
      if (teamType === 'school') {
        updateData.institution_name = institutionName.trim() || null;
        updateData.institution_type = institutionType.trim() || null;
      } else {
        updateData.institution_name = null;
        updateData.institution_type = null;
      }

      const { error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', team.id);

      if (error) throw error;

      toast({
        title: 'Team Updated Successfully!',
        description: `${teamName} has been updated.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onTeamUpdated?.();
      handleClose();

    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: 'Error Updating Team',
        description: 'Failed to update the team. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setTeamName('');
    setDescription('');
    setTeamType('coach');
    setLogoUrl('');
    setInstitutionName('');
    setInstitutionType('');
    onClose();
  };

  const getTeamTypeDescription = (type: string) => {
    switch (type) {
      case 'coach':
        return 'A team you manage as a coach. You can add athletes and manage workouts.';
      case 'club':
        return 'An open club team that athletes can join using the invite code.';
      case 'school':
        return 'A school-affiliated team with institutional information.';
      case 'independent':
        return 'An independent team not affiliated with any institution.';
      default:
        return '';
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  if (!team) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg={modalBg} borderColor={borderColor}>
        <ModalHeader>Edit Team</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Team Logo Section */}
            <FormControl>
              <FormLabel>Team Logo</FormLabel>
              <HStack spacing={4}>
                <Avatar
                  size="lg"
                  name={teamName}
                  src={logoUrl}
                />
                <VStack spacing={2} align="start">
                  <Input
                    placeholder="Enter logo URL"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    size="sm"
                  />
                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      leftIcon={<FaCamera />}
                      variant="outline"
                      onClick={() => {
                        // Future: implement file upload
                        toast({
                          title: 'Coming Soon',
                          description: 'File upload will be available soon. For now, use a URL.',
                          status: 'info',
                          duration: 3000,
                        });
                      }}
                    >
                      Upload
                    </Button>
                    {logoUrl && (
                      <IconButton
                        size="xs"
                        icon={<FaTrash />}
                        colorScheme="red"
                        variant="outline"
                        aria-label="Remove logo"
                        onClick={handleRemoveLogo}
                      />
                    )}
                  </HStack>
                </VStack>
              </HStack>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Team Name</FormLabel>
              <Input
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={50}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="Optional team description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Team Type</FormLabel>
              <Select
                value={teamType}
                onChange={(e) => setTeamType(e.target.value as 'school' | 'club' | 'coach' | 'independent')}
              >
                <option value="coach">Coach Team</option>
                <option value="club">Club Team</option>
                <option value="school">School Team</option>
                <option value="independent">Independent Team</option>
              </Select>
              <Text fontSize="sm" color={textColor} mt={2}>
                {getTeamTypeDescription(teamType)}
              </Text>
            </FormControl>

            {/* Institution fields for school teams */}
            {teamType === 'school' && (
              <>
                <FormControl>
                  <FormLabel>Institution Name</FormLabel>
                  <Input
                    placeholder="Enter school/institution name"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    maxLength={100}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Institution Type</FormLabel>
                  <Select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                  >
                    <option value="">Select type</option>
                    <option value="elementary">Elementary School</option>
                    <option value="middle">Middle School</option>
                    <option value="high">High School</option>
                    <option value="college">College</option>
                    <option value="university">University</option>
                  </Select>
                </FormControl>
              </>
            )}

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1} flex="1">
                <Text fontSize="sm" fontWeight="bold">
                  Note:
                </Text>
                <Text fontSize="sm" color={textColor}>
                  Changes will be visible to all team members immediately.
                  The invite code will remain the same.
                </Text>
              </VStack>
            </Alert>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleUpdateTeam}
            isLoading={isUpdating}
            isDisabled={!teamName.trim()}
          >
            Update Team
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 