import React, { useState } from 'react';
import {
  HStack,
  VStack,
  Text,
  useColorModeValue,
  Tooltip,
  Box,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  Progress,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
  Portal,
} from '@chakra-ui/react';
import { 
  FaImage, 
  FaFileAlt, 
  FaFile, 
  FaEye,
  FaDownload,
  FaPrint,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaEllipsisV,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { MeetFile, truncateFileName, formatFileSize } from '../../types/meetFiles';
import { MeetFilesService } from '../../services/meetFilesService';
import { PinchZoomImage } from '../PinchZoomImage';

interface MeetFilesListProps {
  files: MeetFile[];
  maxDisplay?: number;
  showActions?: boolean;
}

const FileViewer: React.FC<{ file: MeetFile; isOpen: boolean; onClose: () => void }> = ({ 
  file, 
  isOpen, 
  onClose 
}) => {
  const [fileUrl, setFileUrl] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();

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

  const handleOpenPDFInNewTab = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const handleDownloadFile = async () => {
    const { error } = await MeetFilesService.downloadFile(file.file_path, file.file_name);
    if (error) {
      toast({
        title: 'Download Failed',
        description: error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderFileContent = () => {
    if (loading) return (
      <VStack spacing={4} py={8}>
        <Progress size="lg" isIndeterminate colorScheme="blue" w="200px" />
        <Text>Loading file...</Text>
      </VStack>
    );
    
    if (file.file_type.startsWith('image/')) {
      return (
        <PinchZoomImage
          src={fileUrl} 
          alt={file.file_name}
          fullScreen={true}
        />
      );
    }
    
    if (file.file_type === 'application/pdf') {
      if (isMobile) {
        // Mobile: Show alert with options to open in new tab or download
        return (
          <VStack spacing={6} py={12} px={4}>
            <FaFilePdf size={96} color="red.500" />
            <Text fontSize="xl" fontWeight="bold" textAlign="center">{file.file_name}</Text>
            
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Mobile PDF Viewer</AlertTitle>
                <AlertDescription>
                  For the best viewing experience on mobile, open the PDF in a new tab or download it.
                </AlertDescription>
              </Box>
            </Alert>
            
            <VStack spacing={4} w="100%">
              <Button 
                size="lg"
                colorScheme="blue"
                leftIcon={<FaExternalLinkAlt />}
                onClick={handleOpenPDFInNewTab}
                w="100%"
                maxW="300px"
              >
                Open in New Tab
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                colorScheme="blue"
                leftIcon={<FaDownload />}
                onClick={handleDownloadFile}
                w="100%"
                maxW="300px"
              >
                Download File
              </Button>
            </VStack>
          </VStack>
        );
      } else {
        // Desktop: Use iframe
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
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent 
        maxW="100vw" 
        maxH="100vh" 
        m={0} 
        borderRadius={0}
        bg={file.file_type.startsWith('image/') ? "black" : "white"}
      >
        {!file.file_type.startsWith('image/') && (
          <ModalHeader>
            <VStack spacing={1} align="start">
              <HStack spacing={2}>
                <FileIcon fileType={file.file_type} />
                <Text>{file.file_name}</Text>
              </HStack>
            </VStack>
          </ModalHeader>
        )}
        <ModalCloseButton 
          zIndex={10}
          color={file.file_type.startsWith('image/') ? "white" : "inherit"}
          bg={file.file_type.startsWith('image/') ? "blackAlpha.600" : "inherit"}
          _hover={{ 
            bg: file.file_type.startsWith('image/') ? "blackAlpha.800" : "gray.100" 
          }}
        />
        <ModalBody 
          p={file.file_type.startsWith('image/') ? 0 : 6} 
          overflow="auto" 
          display="flex" 
          justifyContent="center" 
          alignItems="center"
          w="100vw"
          h="100vh"
        >
          {renderFileContent()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const FileIcon: React.FC<{ fileType: string; size?: number }> = ({ fileType, size = 16 }) => {
  const iconColor = useColorModeValue('gray.600', 'gray.400');
  
  if (fileType.startsWith('image/')) return <FaImage size={size} color={iconColor} />;
  if (fileType === 'application/pdf') return <FaFilePdf size={size} color={iconColor} />;
  if (fileType.includes('word')) return <FaFileWord size={size} color={iconColor} />;
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FaFileExcel size={size} color={iconColor} />;
  if (fileType.includes('text')) return <FaFileAlt size={size} color={iconColor} />;
  return <FaFile size={size} color={iconColor} />;
};

const FileItem: React.FC<{ 
  file: MeetFile; 
  showActions?: boolean; 
  isCompact?: boolean;
  onViewFile?: (file: MeetFile) => void;
}> = ({ file, showActions = false, isCompact = false, onViewFile }) => {
  const toast = useToast();
  const textColor = useColorModeValue('gray.700', 'gray.300');

  const handleViewFile = () => {
    if (onViewFile) {
      onViewFile(file);
    }
  };

  const handleDownloadFile = async () => {
    const { error } = await MeetFilesService.downloadFile(file.file_path, file.file_name);
    if (error) {
      toast({
        title: 'Download Failed',
        description: error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePrintFile = async () => {
    const { error } = await MeetFilesService.printFile(file.file_path);
    if (error) {
      toast({
        title: 'Print Failed',
        description: error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <HStack 
      spacing={2} 
      p={isCompact ? 1 : 2} 
      borderRadius="md"
      cursor="pointer"
      _hover={{ 
        bg: useColorModeValue('gray.100', 'gray.600'),
        transform: 'translateY(-1px)',
        transition: 'all 0.2s'
      }}
      onClick={handleViewFile}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleViewFile();
        }
      }}
    >
      <FileIcon fileType={file.file_type} size={isCompact ? 14 : 16} />
      <Text 
        fontSize={isCompact ? "xs" : "sm"} 
        color={textColor}
        fontWeight="medium"
        noOfLines={1}
        flex="1"
      >
        {truncateFileName(file.file_name, isCompact ? 20 : 25)}
      </Text>
      
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<FaEllipsisV />}
          size="xs"
          variant="ghost"
          onClick={(e) => e.stopPropagation()}
        />
        <Portal>
          <MenuList onClick={(e) => e.stopPropagation()}>
            <MenuItem 
              icon={<FaEye />} 
              onClick={(e) => {
                e.stopPropagation();
                handleViewFile();
              }}
            >
              View
            </MenuItem>
            <MenuItem 
              icon={<FaDownload />} 
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadFile();
              }}
            >
              Download
            </MenuItem>
            <MenuItem 
              icon={<FaPrint />} 
              onClick={(e) => {
                e.stopPropagation();
                handlePrintFile();
              }}
            >
              Print
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </HStack>
  );
};

export const MeetFilesList: React.FC<MeetFilesListProps> = ({ 
  files, 
  maxDisplay = 3,
  showActions = false 
}) => {
  const [selectedFile, setSelectedFile] = React.useState<MeetFile | null>(null);
  const { isOpen: isViewerOpen, onOpen: onViewerOpen, onClose: onViewerClose } = useDisclosure();

  if (!files || files.length === 0) {
    return null;
  }

  const displayFiles = files.slice(0, maxDisplay);
  const remainingCount = Math.max(0, files.length - maxDisplay);

  const handleViewFile = (file: MeetFile) => {
    setSelectedFile(file);
    onViewerOpen();
  };

  return (
    <>
      <VStack spacing={1} align="start" w="full">
        {displayFiles.map((file) => (
          <FileItem 
            key={file.id} 
            file={file} 
            showActions={showActions}
            isCompact={!showActions}
            onViewFile={handleViewFile}
          />
        ))}
        
        {remainingCount > 0 && (
          <Text fontSize="xs" color="gray.500" fontStyle="italic">
            +{remainingCount} more file{remainingCount === 1 ? '' : 's'}
          </Text>
        )}
      </VStack>

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
    </>
  );
}; 