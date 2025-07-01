import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Progress,
  Grid,
  GridItem,
  Image,
  Icon,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { 
  FaUpload, 
  FaImage, 
  FaFileAlt, 
  FaTable, 
  FaFile, 
  FaTrash, 
  FaEye,
  FaDownload,
  FaPrint,
  FaFilePdf,
  FaFileWord,
  FaFileExcel
} from 'react-icons/fa';
import { MeetFile, MeetFileUpload, FILE_CATEGORIES, formatFileSize, truncateFileName, getFileCategory } from '../../types/meetFiles';
import { MeetFilesService } from '../../services/meetFilesService';
import { useAuth } from '../../contexts/AuthContext';

interface FileUploadSectionProps {
  meetId?: string;
  files: MeetFile[];
  onFilesChange: (files: MeetFile[]) => void;
  disabled?: boolean;
}

const FileIcon: React.FC<{ fileType: string; size?: number }> = ({ fileType, size = 16 }) => {
  if (fileType.startsWith('image/')) return <FaImage size={size} />;
  if (fileType === 'application/pdf') return <FaFilePdf size={size} />;
  if (fileType.includes('word')) return <FaFileWord size={size} />;
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FaFileExcel size={size} />;
  if (fileType.includes('text')) return <FaFileAlt size={size} />;
  return <FaFile size={size} />;
};

const FileViewer: React.FC<{ file: MeetFile; isOpen: boolean; onClose: () => void }> = ({ 
  file, 
  isOpen, 
  onClose 
}) => {
  const [fileUrl, setFileUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      MeetFilesService.getFileUrl(file.file_path).then(({ data, error }) => {
        if (data) {
          setFileUrl(data);
        }
        setLoading(false);
      });
    }
  }, [isOpen, file]);

  const renderFileContent = () => {
    if (loading) return (
      <VStack spacing={4} py={8}>
        <Progress size="lg" isIndeterminate colorScheme="blue" w="200px" />
        <Text>Loading file...</Text>
      </VStack>
    );
    
    if (file.file_type.startsWith('image/')) {
      return (
        <Box w="100%" h="100%" display="flex" justifyContent="center" alignItems="center">
          <Image 
            src={fileUrl} 
            alt={file.file_name}
            maxW="90%"
            maxH="80vh"
            objectFit="contain"
            borderRadius="md"
            shadow="lg"
          />
        </Box>
      );
    }
    
    if (file.file_type === 'application/pdf') {
      return (
        <Box w="100%" h="85vh">
          <iframe
            src={`${fileUrl}#view=FitH`}
            width="100%"
            height="100%"
            style={{ border: 'none', borderRadius: '8px' }}
            title={file.file_name}
          />
        </Box>
      );
    }

    return (
      <VStack spacing={6} py={12}>
        <FileIcon fileType={file.file_type} size={96} />
        <Text fontSize="xl" fontWeight="bold">{file.file_name}</Text>
        <Text color="gray.500" fontSize="lg">Preview not available for this file type</Text>
        <Text color="gray.400" fontSize="sm">File size: {formatFileSize(file.file_size)}</Text>
        <Button 
          size="lg"
          colorScheme="blue"
          leftIcon={<FaDownload />}
          onClick={() => MeetFilesService.downloadFile(file.file_path, file.file_name)}
        >
          Download File
        </Button>
      </VStack>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent maxW="95vw" maxH="95vh" m={4}>
        <ModalHeader>
          <HStack spacing={2}>
            <FileIcon fileType={file.file_type} />
            <Text>{file.file_name}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} overflow="auto" display="flex" justifyContent="center" alignItems="center">
          {renderFileContent()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  meetId,
  files,
  onFilesChange,
  disabled = false
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MeetFile | null>(null);
  const { isOpen: isViewerOpen, onOpen: onViewerOpen, onClose: onViewerClose } = useDisclosure();

  // Color mode values
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const dragBgColor = useColorModeValue('blue.50', 'blue.900');
  const cardBg = useColorModeValue('white', 'gray.700');

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles || !meetId || !user?.id) return;

    setUploading(true);
    const uploadedFiles: MeetFile[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const { data, error } = await MeetFilesService.uploadFile(meetId, file, user.id);
        
        if (error) {
          toast({
            title: 'Upload Failed',
            description: `${file.name}: ${error}`,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        } else if (data) {
          uploadedFiles.push(data);
          toast({
            title: 'Upload Successful',
            description: `${file.name} uploaded successfully`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      }

      if (uploadedFiles.length > 0) {
        onFilesChange([...files, ...uploadedFiles]);
      }
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: 'An unexpected error occurred during upload',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  }, [meetId, user?.id, files, onFilesChange, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDeleteFile = async (fileId: string) => {
    const { error } = await MeetFilesService.deleteFile(fileId);
    if (error) {
      toast({
        title: 'Delete Failed',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      onFilesChange(files.filter(f => f.id !== fileId));
      toast({
        title: 'File Deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleViewFile = (file: MeetFile) => {
    setSelectedFile(file);
    onViewerOpen();
  };

  const groupedFiles = files.reduce((acc, file) => {
    if (!acc[file.category]) acc[file.category] = [];
    acc[file.category].push(file);
    return acc;
  }, {} as Record<string, MeetFile[]>);

  if (disabled && files.length === 0) {
    return null;
  }

  return (
    <VStack spacing={4} w="full">
      {/* Upload Area */}
      {!disabled && (
        <Box
          w="full"
          p={6}
          border="2px dashed"
          borderColor={dragActive ? 'blue.300' : borderColor}
          borderRadius="md"
          bg={dragActive ? dragBgColor : bgColor}
          textAlign="center"
          cursor="pointer"
          transition="all 0.2s"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <VStack spacing={3}>
            <Icon as={FaUpload} w={8} h={8} color="blue.500" />
            <Text fontWeight="medium">
              Click to upload or drag and drop files
            </Text>
            <Text fontSize="sm" color="gray.500">
              Images, PDFs, Documents, Spreadsheets (Max 10MB)
            </Text>
            {uploading && (
              <Box w="full" maxW="200px">
                <Progress size="sm" isIndeterminate colorScheme="blue" />
              </Box>
            )}
          </VStack>
          
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </Box>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <VStack spacing={4} w="full">
          {Object.entries(groupedFiles).map(([category, categoryFiles]) => (
            <Box key={category} w="full">
              <HStack spacing={2} mb={2}>
                <Icon 
                  as={category === 'image' ? FaImage : category === 'document' ? FaFileAlt : category === 'spreadsheet' ? FaTable : FaFile}
                  color={`${FILE_CATEGORIES[category]?.color}.500`}
                />
                <Text fontWeight="medium" fontSize="sm">
                  {FILE_CATEGORIES[category]?.name} ({categoryFiles.length})
                </Text>
              </HStack>
              
              <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={3}>
                {categoryFiles.map((file) => (
                  <GridItem key={file.id}>
                    <Box
                      p={3}
                      bg={cardBg}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={borderColor}
                      _hover={{ shadow: 'md' }}
                      transition="all 0.2s"
                    >
                      <HStack spacing={3}>
                        <FileIcon fileType={file.file_type} />
                        <VStack align="start" spacing={0} flex="1" minW="0">
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {truncateFileName(file.file_name, 30)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatFileSize(file.file_size)}
                          </Text>
                        </VStack>
                        
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="View file"
                            icon={<FaEye />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewFile(file)}
                          />
                          <IconButton
                            aria-label="Download file"
                            icon={<FaDownload />}
                            size="sm"
                            variant="ghost"
                            onClick={() => MeetFilesService.downloadFile(file.file_path, file.file_name)}
                          />
                          <IconButton
                            aria-label="Print file"
                            icon={<FaPrint />}
                            size="sm"
                            variant="ghost"
                            onClick={() => MeetFilesService.printFile(file.file_path)}
                          />
                          {!disabled && (
                            <IconButton
                              aria-label="Delete file"
                              icon={<FaTrash />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteFile(file.id)}
                            />
                          )}
                        </HStack>
                      </HStack>
                    </Box>
                  </GridItem>
                ))}
              </Grid>
            </Box>
          ))}
        </VStack>
      )}

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewer
          file={selectedFile}
          isOpen={isViewerOpen}
          onClose={() => {
            onViewerClose();
            setSelectedFile(null);
          }}
        />
      )}
    </VStack>
  );
}; 