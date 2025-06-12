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
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Divider,
  Text,
  Badge,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';

interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: 'school' | 'club' | 'independent' | 'other';
  institution_name?: string;
  institution_type?: 'high_school' | 'middle_school' | 'college' | 'university' | 'club' | 'academy' | 'other';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  website?: string;
  established_year?: number;
  manager_title?: string;
}

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onUpdate: (updatedTeam: Team) => void;
}

interface TeamForm {
  name: string;
  description: string;
  team_type: 'school' | 'club' | 'independent' | 'other';
  institution_name: string;
  institution_type: 'high_school' | 'middle_school' | 'college' | 'university' | 'club' | 'academy' | 'other';
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  website: string;
  established_year: number | '';
  manager_title: string;
}

export function EditTeamModal({ isOpen, onClose, team, onUpdate }: EditTeamModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TeamForm>({
    name: '',
    description: '',
    team_type: 'school',
    institution_name: '',
    institution_type: 'high_school',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    website: '',
    established_year: '',
    manager_title: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Color mode values
  const modalBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    if (team && isOpen) {
      setFormData({
        name: team.name || '',
        description: team.description || '',
        team_type: team.team_type || 'school',
        institution_name: team.institution_name || '',
        institution_type: team.institution_type || 'high_school',
        address: team.address || '',
        city: team.city || '',
        state: team.state || '',
        zip_code: team.zip_code || '',
        phone: team.phone || '',
        website: team.website || '',
        established_year: team.established_year || '',
        manager_title: team.manager_title || '',
      });
      setErrors({});
    }
  }, [team, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Team name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Team name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.website && formData.website.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.website)) {
        newErrors.website = 'Website must be a valid URL (starting with http:// or https://)';
      }
    }

    if (formData.phone && formData.phone.trim()) {
      const phonePattern = /^\+?[\d\s\-\(\)\.]{10,}$/;
      if (!phonePattern.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (formData.zip_code && formData.zip_code.trim()) {
      const zipPattern = /^\d{5}(-\d{4})?$/;
      if (!zipPattern.test(formData.zip_code)) {
        newErrors.zip_code = 'Please enter a valid ZIP code (12345 or 12345-6789)';
      }
    }

    if (formData.established_year && formData.established_year !== '') {
      const currentYear = new Date().getFullYear();
      const year = Number(formData.established_year);
      if (year < 1800 || year > currentYear) {
        newErrors.established_year = `Year must be between 1800 and ${currentYear}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof TeamForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm() || !team) return;

    setLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        team_type: formData.team_type,
        institution_name: formData.institution_name.trim() || null,
        institution_type: formData.institution_type,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        phone: formData.phone.trim() || null,
        website: formData.website.trim() || null,
        established_year: formData.established_year ? Number(formData.established_year) : null,
        manager_title: formData.manager_title.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', team.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Team Updated',
        description: 'Team information has been successfully updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onUpdate(data);
      onClose();
    } catch (error: any) {
      console.error('Error updating team:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update team information.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!team) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={modalBg} maxH="90vh">
        <ModalHeader>
          <VStack spacing={2} align="start">
            <Text>Edit Team Information</Text>
            <HStack>
              <Badge colorScheme="blue" variant="subtle">
                {team.team_type.charAt(0).toUpperCase() + team.team_type.slice(1)}
              </Badge>
              <Text fontSize="sm" color={textColor}>
                Team ID: {team.id}
              </Text>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Team Information */}
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">Basic Information</Text>
              
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel>Team Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter team name"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.description}>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the team"
                  rows={3}
                />
                <FormErrorMessage>{errors.description}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Team Type</FormLabel>
                <Select
                  value={formData.team_type}
                  onChange={(e) => handleInputChange('team_type', e.target.value)}
                >
                  <option value="school">School</option>
                  <option value="club">Club</option>
                  <option value="independent">Independent</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>
            </VStack>

            <Divider />

            {/* Institution Information */}
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">Institution Information</Text>
              
              <Alert status="info" size="sm">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  Institution details help athletes and coaches identify your organization.
                </AlertDescription>
              </Alert>

              <FormControl>
                <FormLabel>Institution Name</FormLabel>
                <Input
                  value={formData.institution_name}
                  onChange={(e) => handleInputChange('institution_name', e.target.value)}
                  placeholder="e.g., Lincoln High School, Metro Track Club"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Institution Type</FormLabel>
                <Select
                  value={formData.institution_type}
                  onChange={(e) => handleInputChange('institution_type', e.target.value)}
                >
                  <option value="high_school">High School</option>
                  <option value="middle_school">Middle School</option>
                  <option value="college">College</option>
                  <option value="university">University</option>
                  <option value="club">Club</option>
                  <option value="academy">Academy</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Manager Title</FormLabel>
                <Input
                  value={formData.manager_title}
                  onChange={(e) => handleInputChange('manager_title', e.target.value)}
                  placeholder="e.g., Athletic Director, Head Coach, Club President"
                />
              </FormControl>

              <FormControl isInvalid={!!errors.established_year}>
                <FormLabel>Established Year</FormLabel>
                <NumberInput
                  value={formData.established_year}
                  onChange={(valueString) => handleInputChange('established_year', valueString)}
                  min={1800}
                  max={new Date().getFullYear()}
                >
                  <NumberInputField placeholder="e.g., 1985" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>{errors.established_year}</FormErrorMessage>
              </FormControl>
            </VStack>

            <Divider />

            {/* Contact Information */}
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">Contact Information</Text>

              <HStack spacing={4}>
                <FormControl flex={2}>
                  <FormLabel>Address</FormLabel>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street address"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl flex={2}>
                  <FormLabel>City</FormLabel>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel>State</FormLabel>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="State"
                  />
                </FormControl>
                <FormControl flex={1} isInvalid={!!errors.zip_code}>
                  <FormLabel>ZIP Code</FormLabel>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    placeholder="12345"
                  />
                  <FormErrorMessage>{errors.zip_code}</FormErrorMessage>
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl flex={1} isInvalid={!!errors.phone}>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                  <FormErrorMessage>{errors.phone}</FormErrorMessage>
                </FormControl>
                <FormControl flex={1} isInvalid={!!errors.website}>
                  <FormLabel>Website</FormLabel>
                  <Input
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                  <FormErrorMessage>{errors.website}</FormErrorMessage>
                </FormControl>
              </HStack>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose} isDisabled={loading}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={loading}
              loadingText="Updating..."
            >
              Update Team
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 