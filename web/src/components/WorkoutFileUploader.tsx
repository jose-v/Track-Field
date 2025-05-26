import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  Icon,
  useColorModeValue,
  Flex,
  IconButton,
  Tooltip,
  Badge,
  Progress,
  useToast
} from '@chakra-ui/react';
import { FaUpload, FaFile, FaFilePdf, FaFileWord, FaFileAlt, FaTrash, FaCheck } from 'react-icons/fa';
import { supabase } from '../lib/supabase';

// Supported file types
const ACCEPTED_FILE_TYPES = [
  'application/pdf',                                                     // PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/msword',                                                  // DOC
  'text/plain'                                                           // TXT
];

// Icons for file types 
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'application/pdf':
      return FaFilePdf;
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return FaFileWord;
    case 'text/plain':
      return FaFileAlt;
    default:
      return FaFile;
  }
};

export interface UploadedFile {
  file: File;
  url?: string;
  uploadProgress: number;
  isUploaded: boolean;
  error?: string;
}

interface WorkoutFileUploaderProps {
  onFileProcessed?: (fileUrl: string, fileType: string, fileName: string) => void;
}

export function WorkoutFileUploader({ onFileProcessed }: WorkoutFileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const dropBgColor = useColorModeValue('gray.100', 'gray.700');
  const activeBgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const activeBorderColor = useColorModeValue('blue.400', 'blue.400');
  const textColor = useColorModeValue('gray.500', 'gray.300');
  const iconColor = useColorModeValue('gray.500', 'gray.300');

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle dropped files
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  }, []);

  // Handle file selection via file input
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  // Process the selected file
  const handleFile = useCallback((file: File) => {
    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, Word document, or text file.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setUploadedFile({
      file,
      uploadProgress: 0,
      isUploaded: false
    });

    // Start the upload process
    uploadFile(file);
  }, [toast]);

  // Upload file to Supabase storage
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Get user info for folder path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Create a unique file name
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `workouts/${user.id}/${fileName}`;
      
      // Try to use an existing bucket
      // For most Supabase projects, "avatars" or "storage" buckets exist by default
      const bucketName = 'storage'; // Changed from 'workout_files' to a bucket name that likely exists
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
        
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      // Log for debugging
      console.log('File uploaded successfully, public URL:', publicUrl);
        
      // Update file status
      setUploadedFile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          url: publicUrl,
          uploadProgress: 100,
          isUploaded: true,
        };
      });
      
      // Wait a moment before notifying parent to ensure state is updated
      setTimeout(() => {
        // Notify parent component
        if (onFileProcessed) {
          onFileProcessed(publicUrl, file.type, file.name);
        }
        
        toast({
          title: 'File uploaded successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }, 100);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      setUploadedFile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          error: error.message || 'Failed to upload file',
          uploadProgress: 0,
          isUploaded: false,
        };
      });
      
      toast({
        title: 'Upload failed',
        description: error.message === 'Bucket not found' ? 
          'Storage bucket not configured. Please contact administrator.' : 
          error.message || 'Failed to upload file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Remove uploaded file
  const handleRemoveFile = useCallback(() => {
    if (uploadedFile?.url) {
      // Extract file path from URL
      try {
        const url = new URL(uploadedFile.url);
        const pathSegments = url.pathname.split('/');
        const bucketName = 'storage'; // Use the same bucket name as in uploadFile
        const filePath = pathSegments.slice(pathSegments.indexOf(bucketName) + 1).join('/');
        
        // Delete file from storage
        supabase.storage
          .from(bucketName)
          .remove([filePath])
          .then(({ error }) => {
            if (error) {
              console.error('Error removing file from storage:', error);
            }
          });
      } catch (error) {
        console.error('Error parsing file URL:', error);
      }
    }
    
    setUploadedFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [uploadedFile]);

  // Trigger file input click
  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <VStack spacing={4} width="100%">
      <FormControl>
        <FormLabel fontWeight="medium">Upload Workout File</FormLabel>
        
        {!uploadedFile ? (
          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            borderWidth="2px"
            borderStyle="dashed"
            borderRadius="md"
            borderColor={dragActive ? activeBorderColor : borderColor}
            backgroundColor={dragActive ? activeBgColor : dropBgColor}
            p={6}
            textAlign="center"
            cursor="pointer"
            onClick={onButtonClick}
            transition="all 0.2s"
          >
            <VStack spacing={3}>
              <Icon as={FaUpload} boxSize={8} color="blue.500" />
              <Text fontWeight="medium">
                Drag & drop your workout file here, or click to browse
              </Text>
              <Text fontSize="sm" color={textColor}>
                Supported formats: PDF, Word (DOC, DOCX), Text
              </Text>
              <HStack spacing={2}>
                <Icon as={FaFilePdf} color="red.500" />
                <Icon as={FaFileWord} color="blue.500" />
                <Icon as={FaFileAlt} color={iconColor} />
              </HStack>
              
              <Input
                type="file"
                ref={inputRef}
                onChange={handleChange}
                accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                display="none"
              />
            </VStack>
          </Box>
        ) : (
          <Box
            borderWidth="1px"
            borderRadius="md"
            p={4}
            width="100%"
          >
            <VStack spacing={4} width="100%">
              {/* File info */}
              <HStack width="100%" justify="space-between">
                <HStack>
                  <Icon 
                    as={getFileIcon(uploadedFile.file.type)} 
                    boxSize={6} 
                    color={uploadedFile.isUploaded ? "green.500" : "blue.500"} 
                  />
                  <Box>
                    <Text fontWeight="medium" noOfLines={1} maxWidth="200px">
                      {uploadedFile.file.name}
                    </Text>
                    <Text fontSize="xs" color={textColor}>
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </Box>
                </HStack>
                
                <HStack>
                  {uploadedFile.isUploaded && (
                    <Badge colorScheme="green" display="flex" alignItems="center">
                      <Icon as={FaCheck} mr={1} boxSize={3} />
                      Uploaded
                    </Badge>
                  )}
                  <Tooltip label="Remove file">
                    <IconButton
                      icon={<FaTrash />}
                      aria-label="Remove file"
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={handleRemoveFile}
                    />
                  </Tooltip>
                </HStack>
              </HStack>
              
              {/* Upload progress */}
              {!uploadedFile.isUploaded && !uploadedFile.error && (
                <Box width="100%">
                  <Progress 
                    value={uploadedFile.uploadProgress} 
                    size="sm" 
                    colorScheme="blue" 
                    borderRadius="full" 
                    isIndeterminate={isUploading && uploadedFile.uploadProgress === 0}
                  />
                </Box>
              )}
              
              {/* Error message */}
              {uploadedFile.error && (
                <Text fontSize="sm" color="red.500">
                  {uploadedFile.error}
                </Text>
              )}
            </VStack>
          </Box>
        )}
      </FormControl>
      
      {/* Action buttons */}
      <HStack width="100%" justify="flex-end">
        {!uploadedFile && (
          <Button
            leftIcon={<FaUpload />}
            colorScheme="blue"
            onClick={onButtonClick}
          >
            Browse Files
          </Button>
        )}
        
        {uploadedFile && !uploadedFile.isUploaded && !uploadedFile.error && (
          <Button
            isLoading={isUploading}
            loadingText="Uploading..."
            colorScheme="blue"
            onClick={() => uploadFile(uploadedFile.file)}
          >
            Upload
          </Button>
        )}
      </HStack>
    </VStack>
  );
} 