import React, { useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Image,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Progress,
  Icon,
  Center,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaUpload, FaImage, FaTrash } from 'react-icons/fa';
import { uploadInstitutionLogo } from '../../services/institutionService';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerId: string;
  currentLogoUrl?: string;
  onLogoUpdate: (newLogoUrl: string) => void;
}

export function LogoUploadModal({ 
  isOpen, 
  onClose, 
  managerId, 
  currentLogoUrl,
  onLogoUpdate 
}: LogoUploadModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Color mode values
  const modalBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.700');

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }
    
    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast({
        title: 'Invalid File',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const logoUrl = await uploadInstitutionLogo(managerId, selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (logoUrl) {
        onLogoUpdate(logoUrl);
        toast({
          title: 'Success',
          description: 'Institution logo updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        handleClose();
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload logo. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveLogo = async () => {
    // This would require implementing a remove logo function
    // For now, we'll just show a message
    toast({
      title: 'Feature Coming Soon',
      description: 'Logo removal will be available in a future update',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg={modalBg}>
        <ModalHeader>Institution Logo</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6}>
            {/* Current Logo */}
            {currentLogoUrl && !selectedFile && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2} color={textColor}>
                  Current Logo
                </Text>
                <Center
                  w="200px"
                  h="200px"
                  borderWidth={2}
                  borderStyle="dashed"
                  borderColor={borderColor}
                  borderRadius="md"
                  bg={bgColor}
                >
                  <Image
                    src={currentLogoUrl}
                    alt="Current institution logo"
                    maxW="180px"
                    maxH="180px"
                    objectFit="contain"
                  />
                </Center>
              </Box>
            )}

            {/* File Upload Area */}
            <Box width="100%">
              <Text fontSize="sm" fontWeight="medium" mb={2} color={textColor}>
                {selectedFile ? 'New Logo Preview' : 'Upload New Logo'}
              </Text>
              
              <Center
                w="100%"
                h="200px"
                borderWidth={2}
                borderStyle="dashed"
                borderColor={selectedFile ? "blue.300" : borderColor}
                borderRadius="md"
                bg={selectedFile ? useColorModeValue("blue.50", "blue.900") : bgColor}
                cursor="pointer"
                onClick={triggerFileSelect}
                _hover={{
                  borderColor: "blue.400",
                  bg: useColorModeValue("blue.50", "blue.900")
                }}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Logo preview"
                    maxW="180px"
                    maxH="180px"
                    objectFit="contain"
                  />
                ) : (
                  <VStack spacing={2}>
                    <Icon as={FaImage} boxSize={8} color={useColorModeValue("gray.400", "gray.500")} />
                    <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")} textAlign="center">
                      Click to select an image
                    </Text>
                    <Text fontSize="xs" color={useColorModeValue("gray.400", "gray.500")} textAlign="center">
                      JPEG, PNG, GIF, or WebP (max 5MB)
                    </Text>
                  </VStack>
                )}
              </Center>

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Box>

            {/* Upload Progress */}
            {uploading && (
              <Box width="100%">
                <Text fontSize="sm" mb={2}>Uploading logo...</Text>
                <Progress value={uploadProgress} colorScheme="blue" />
              </Box>
            )}

            {/* File Info */}
            {selectedFile && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontSize="sm">
                    <strong>Selected:</strong> {selectedFile.name}
                  </Text>
                  <Text fontSize="xs" color={textColor}>
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </Box>
              </Alert>
            )}

            {/* Actions for Current Logo */}
            {currentLogoUrl && !selectedFile && (
              <>
                <Divider />
                <HStack spacing={2} width="100%">
                  <Button
                    leftIcon={<Icon as={FaUpload} />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={triggerFileSelect}
                    flex={1}
                  >
                    Replace Logo
                  </Button>
                  <Button
                    leftIcon={<Icon as={FaTrash} />}
                    colorScheme="red"
                    variant="outline"
                    onClick={handleRemoveLogo}
                    flex={1}
                  >
                    Remove Logo
                  </Button>
                </HStack>
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          {selectedFile && (
            <Button
              colorScheme="blue"
              onClick={handleUpload}
              isLoading={uploading}
              loadingText="Uploading..."
              leftIcon={<Icon as={FaUpload} />}
            >
              Upload Logo
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 