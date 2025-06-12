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
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { updateInstitutionalProfile } from '../../services/institutionService';
import { InstitutionalProfile, InstitutionFormData, INSTITUTION_TYPES, INSTITUTION_VALIDATION } from '../../types/institution';

interface EditInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: InstitutionalProfile;
  onUpdate: () => void;
}

export function EditInstitutionModal({ isOpen, onClose, profile, onUpdate }: EditInstitutionModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InstitutionFormData>({
    institution_name: '',
    institution_type: 'high_school',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    website: '',
    established_year: undefined,
    description: '',
    manager_title: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        institution_name: profile.institution_name || '',
        institution_type: profile.institution_type || 'high_school',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        phone: profile.phone || '',
        website: profile.website || '',
        established_year: profile.established_year || undefined,
        description: '',
        manager_title: profile.manager_title || 'Team Manager',
      });
      setErrors({});
    }
  }, [profile, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Institution name validation
    if (!formData.institution_name.trim()) {
      newErrors.institution_name = 'Institution name is required';
    } else if (formData.institution_name.length < INSTITUTION_VALIDATION.institution_name.minLength) {
      newErrors.institution_name = `Institution name must be at least ${INSTITUTION_VALIDATION.institution_name.minLength} characters`;
    } else if (formData.institution_name.length > INSTITUTION_VALIDATION.institution_name.maxLength) {
      newErrors.institution_name = `Institution name must be less than ${INSTITUTION_VALIDATION.institution_name.maxLength} characters`;
    }

    // Manager title validation
    if (!formData.manager_title.trim()) {
      newErrors.manager_title = 'Manager title is required';
    } else if (formData.manager_title.length < INSTITUTION_VALIDATION.manager_title.minLength) {
      newErrors.manager_title = `Manager title must be at least ${INSTITUTION_VALIDATION.manager_title.minLength} characters`;
    } else if (formData.manager_title.length > INSTITUTION_VALIDATION.manager_title.maxLength) {
      newErrors.manager_title = `Manager title must be less than ${INSTITUTION_VALIDATION.manager_title.maxLength} characters`;
    }

    // Website validation
    if (formData.website && !INSTITUTION_VALIDATION.website.pattern.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    // Established year validation
    if (formData.established_year) {
      if (formData.established_year < INSTITUTION_VALIDATION.established_year.min) {
        newErrors.established_year = `Year must be after ${INSTITUTION_VALIDATION.established_year.min}`;
      } else if (formData.established_year > INSTITUTION_VALIDATION.established_year.max) {
        newErrors.established_year = `Year cannot be in the future`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof InstitutionFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user?.id) return;

    try {
      setLoading(true);
      await updateInstitutionalProfile(user.id, formData);
      
      toast({
        title: 'Success',
        description: 'Institutional profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update institutional profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Institutional Profile</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            {/* Institution Name */}
            <FormControl isRequired isInvalid={!!errors.institution_name}>
              <FormLabel>Institution Name</FormLabel>
              <Input
                value={formData.institution_name}
                onChange={(e) => handleInputChange('institution_name', e.target.value)}
                placeholder="e.g., Lincoln High School"
              />
              <FormErrorMessage>{errors.institution_name}</FormErrorMessage>
            </FormControl>

            {/* Institution Type */}
            <FormControl isRequired>
              <FormLabel>Institution Type</FormLabel>
              <Select
                value={formData.institution_type}
                onChange={(e) => handleInputChange('institution_type', e.target.value as any)}
              >
                {INSTITUTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Manager Title */}
            <FormControl isRequired isInvalid={!!errors.manager_title}>
              <FormLabel>Your Title</FormLabel>
              <Input
                value={formData.manager_title}
                onChange={(e) => handleInputChange('manager_title', e.target.value)}
                placeholder="e.g., Athletic Director, Head Coach"
              />
              <FormErrorMessage>{errors.manager_title}</FormErrorMessage>
            </FormControl>

            {/* Contact Information */}
            <HStack spacing={4} width="100%">
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  type="tel"
                />
              </FormControl>

              <FormControl isInvalid={!!errors.website}>
                <FormLabel>Website</FormLabel>
                <Input
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.school.edu"
                  type="url"
                />
                <FormErrorMessage>{errors.website}</FormErrorMessage>
              </FormControl>
            </HStack>

            {/* Address */}
            <FormControl>
              <FormLabel>Address</FormLabel>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main Street"
              />
            </FormControl>

            {/* City, State, Zip */}
            <HStack spacing={4} width="100%">
              <FormControl>
                <FormLabel>City</FormLabel>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Springfield"
                />
              </FormControl>

              <FormControl>
                <FormLabel>State</FormLabel>
                <Input
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="IL"
                  maxLength={2}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Zip Code</FormLabel>
                <Input
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  placeholder="62701"
                />
              </FormControl>
            </HStack>

            {/* Established Year */}
            <FormControl isInvalid={!!errors.established_year}>
              <FormLabel>Established Year (Optional)</FormLabel>
              <NumberInput
                value={formData.established_year || ''}
                onChange={(_, valueAsNumber) => handleInputChange('established_year', isNaN(valueAsNumber) ? undefined : valueAsNumber)}
                min={INSTITUTION_VALIDATION.established_year.min}
                max={INSTITUTION_VALIDATION.established_year.max}
              >
                <NumberInputField placeholder="1950" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormErrorMessage>{errors.established_year}</FormErrorMessage>
            </FormControl>

            {/* Description */}
            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your institution..."
                rows={3}
              />
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Updating..."
          >
            Update Profile
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 