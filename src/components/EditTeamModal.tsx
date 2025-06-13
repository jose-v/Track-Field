import React, { useState, useEffect, useRef } from 'react';
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
  Box,
  Progress
} from '@chakra-ui/react';
import { FaCamera, FaTrash, FaUpload } from 'react-icons/fa';
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    setIsUploading(false);
    setUploadProgress(0);
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

  const handleFileUpload = async (file: File) => {
    if (!file || !team?.id) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP).',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${team.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `team-logos/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('storage')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Get public URL
      const { data } = supabase.storage
        .from('storage')
        .getPublicUrl(filePath);

      setUploadProgress(75);

      // Update logo URL in state
      setLogoUrl(data.publicUrl);

      setUploadProgress(100);

      toast({
        title: 'Logo Uploaded Successfully!',
        description: 'Your team logo has been uploaded. Don\'t forget to save your changes.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload the logo. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
                <VStack spacing={2} align="start" flex="1">
                  <Input
                    placeholder="Enter logo URL"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    size="sm"
                    isDisabled={isUploading}
                  />
                  
                  {/* Upload Progress */}
                  {isUploading && (
                    <Box w="full">
                      <Progress value={uploadProgress} size="sm" colorScheme="blue" />
                      <Text fontSize="xs" color={textColor} mt={1}>
                        Uploading... {uploadProgress}%
                      </Text>
                    </Box>
                  )}
                  
                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      leftIcon={<FaUpload />}
                      variant="outline"
                      onClick={handleUploadClick}
                      isLoading={isUploading}
                      loadingText="Uploading..."
                    >
                      Upload File
                    </Button>
                    {logoUrl && (
                      <IconButton
                        size="xs"
                        icon={<FaTrash />}
                        colorScheme="red"
                        variant="outline"
                        aria-label="Remove logo"
                        onClick={handleRemoveLogo}
                        isDisabled={isUploading}
                      />
                    )}
                  </HStack>
                  
                  <Text fontSize="xs" color={textColor}>
                    Upload an image file (JPEG, PNG, GIF, WebP) up to 5MB
                  </Text>
                </VStack>
              </HStack>
              
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
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