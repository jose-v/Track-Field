import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Textarea,
  VStack,
  useToast,
  FormErrorMessage,
  HStack,
  Text,
  Icon,
  useColorModeValue
} from '@chakra-ui/react';
import { FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface EmailShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject: string;
  defaultBody: string;
}

export const EmailShareModal: React.FC<EmailShareModalProps> = React.memo(({
  isOpen,
  onClose,
  defaultSubject,
  defaultBody
}) => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Color mode values - optimized for better contrast in dark mode
  const bg = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('blue.500', 'blue.600');
  const footerBg = useColorModeValue('gray.50', 'gray.700');
  const labelColor = useColorModeValue('gray.700', 'gray.100');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputColor = useColorModeValue('gray.900', 'white');
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600');
  const inputHoverBorderColor = useColorModeValue('gray.300', 'gray.500');
  const inputFocusBorderColor = useColorModeValue('blue.500', 'blue.300');
  const placeholderColor = useColorModeValue('gray.400', 'gray.400');
  const readOnlyBg = useColorModeValue('gray.100', 'gray.600');
  const readOnlyColor = useColorModeValue('gray.600', 'gray.200');
  
  // Form state
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    subject: '',
    body: ''
  });
  
  const [errors, setErrors] = useState({
    to: '',
    subject: '',
    body: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Stable initial form data to prevent flickering
  const initialFormData = useMemo(() => ({
    from: user?.email || 'noreply@trackandfield.app',
    to: '',
    subject: defaultSubject,
    body: defaultBody
  }), [user?.email, defaultSubject, defaultBody]);

  // Initialize form data only when modal opens and content changes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({ to: '', subject: '', body: '' });
    }
  }, [isOpen, initialFormData]);

  // Memoized validation function
  const validateForm = useCallback(() => {
    const newErrors = { to: '', subject: '', body: '' };
    let isValid = true;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.to.trim()) {
      newErrors.to = 'Email address is required';
      isValid = false;
    } else if (!emailRegex.test(formData.to.trim())) {
      newErrors.to = 'Please enter a valid email address';
      isValid = false;
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
      isValid = false;
    }

    // Body validation
    if (!formData.body.trim()) {
      newErrors.body = 'Message body is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  // Memoized form submission handler
  const handleSend = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Try Supabase email function first
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: formData.to.trim(),
          subject: formData.subject.trim(),
          html: formData.body.replace(/\n/g, '<br>'),
          text: formData.body.trim()
        }
      });

      if (error) {
        console.warn('Supabase email function failed:', error);
        
        // Fallback to system email client
        const encodedSubject = encodeURIComponent(formData.subject.trim());
        const encodedBody = encodeURIComponent(formData.body.trim());
        const mailtoLink = `mailto:${formData.to.trim()}?subject=${encodedSubject}&body=${encodedBody}`;
        
        window.location.href = mailtoLink;
        
        toast({
          title: 'Email Client Opened',
          description: 'Your default email app has been opened with the meet information.',
          status: 'info',
          duration: 4000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Email Sent Successfully',
          description: `Meet information has been sent to ${formData.to}`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      }

      onClose();

    } catch (error) {
      console.error('Error sending email:', error);
      
      // Fallback to system email client on any error
      try {
        const encodedSubject = encodeURIComponent(formData.subject.trim());
        const encodedBody = encodeURIComponent(formData.body.trim());
        const mailtoLink = `mailto:${formData.to.trim()}?subject=${encodedSubject}&body=${encodedBody}`;
        
        window.location.href = mailtoLink;
        
        toast({
          title: 'Email Client Opened',
          description: 'Your default email app has been opened with the meet information.',
          status: 'info',
          duration: 4000,
          isClosable: true,
        });
        
        onClose();
      } catch (fallbackError) {
        toast({
          title: 'Email Failed',
          description: 'Failed to send email. Please try again or copy the information manually.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, onClose, toast]);

  // Memoized input change handler
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="xl" 
      scrollBehavior="inside"
      motionPreset="slideInBottom"
      closeOnOverlayClick={!isLoading}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent mx={4} bg={bg}>
        <ModalHeader
          bg={headerBg}
          color="white"
          borderTopRadius="md"
          py={4}
        >
          <HStack spacing={3}>
            <Icon as={FaEnvelope} boxSize={5} />
            <Text fontSize="lg" fontWeight="bold">Share Meet Information</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" size="lg" isDisabled={isLoading} />

        <ModalBody py={6}>
          <VStack spacing={5} align="stretch">
            {/* From Field (Read-only) */}
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold" color={labelColor}>
                From
              </FormLabel>
              <Input
                value={formData.from}
                isReadOnly
                bg={readOnlyBg}
                color={readOnlyColor}
                cursor="not-allowed"
                size="lg"
                borderColor={inputBorderColor}
              />
            </FormControl>

            {/* To Field */}
            <FormControl isInvalid={!!errors.to} isRequired>
              <FormLabel fontSize="sm" fontWeight="semibold" color={labelColor}>
                To
              </FormLabel>
              <Input
                type="email"
                placeholder="Enter recipient email address"
                value={formData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                size="lg"
                bg={inputBg}
                color={inputColor}
                borderColor={inputBorderColor}
                focusBorderColor={inputFocusBorderColor}
                _hover={{ borderColor: inputHoverBorderColor }}
                _placeholder={{ color: placeholderColor }}
                _focus={{ 
                  borderColor: inputFocusBorderColor,
                  boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                  bg: inputBg,
                  color: inputColor
                }}
              />
              <FormErrorMessage>{errors.to}</FormErrorMessage>
            </FormControl>

            {/* Subject Field */}
            <FormControl isInvalid={!!errors.subject} isRequired>
              <FormLabel fontSize="sm" fontWeight="semibold" color={labelColor}>
                Subject
              </FormLabel>
              <Input
                placeholder="Email subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                size="lg"
                bg={inputBg}
                color={inputColor}
                borderColor={inputBorderColor}
                focusBorderColor={inputFocusBorderColor}
                _hover={{ borderColor: inputHoverBorderColor }}
                _placeholder={{ color: placeholderColor }}
                _focus={{ 
                  borderColor: inputFocusBorderColor,
                  boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                  bg: inputBg,
                  color: inputColor
                }}
              />
              <FormErrorMessage>{errors.subject}</FormErrorMessage>
            </FormControl>

            {/* Body Field */}
            <FormControl isInvalid={!!errors.body} isRequired>
              <FormLabel fontSize="sm" fontWeight="semibold" color={labelColor}>
                Message
              </FormLabel>
              <Textarea
                placeholder="Email content"
                value={formData.body}
                onChange={(e) => handleInputChange('body', e.target.value)}
                rows={12}
                resize="vertical"
                fontSize="sm"
                lineHeight="1.5"
                bg={inputBg}
                color={inputColor}
                borderColor={inputBorderColor}
                focusBorderColor={inputFocusBorderColor}
                _hover={{ borderColor: inputHoverBorderColor }}
                _placeholder={{ color: placeholderColor }}
                _focus={{ 
                  borderColor: inputFocusBorderColor,
                  boxShadow: `0 0 0 1px ${inputFocusBorderColor}`,
                  bg: inputBg,
                  color: inputColor
                }}
              />
              <FormErrorMessage>{errors.body}</FormErrorMessage>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter bg={footerBg} borderBottomRadius="md">
          <HStack spacing={3}>
            <Button
              variant="outline"
              colorScheme="gray"
              onClick={onClose}
              size="lg"
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSend}
              isLoading={isLoading}
              loadingText="Sending..."
              leftIcon={<FaPaperPlane />}
              size="lg"
              shadow="md"
            >
              Send Email
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}); 