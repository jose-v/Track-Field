import React from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FaDownload, FaExpand, FaCompress, FaMobile } from 'react-icons/fa';
import { usePWA } from '../hooks/usePWA';

export const PWAInstallPrompt: React.FC = () => {
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });
  const {
    isInstallable,
    isFullscreen,
    canGoFullscreen,
    installPWA,
    toggleFullscreen,
  } = usePWA();

  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.700');

  // Don't show anything if neither feature is available
  if (!isInstallable && !canGoFullscreen) {
    return null;
  }

  // Don't show if user has closed it
  if (!isOpen) {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom={4}
      left={4}
      right={4}
      zIndex={1000}
      maxW="400px"
      mx="auto"
    >
      <Alert
        status="info"
        borderRadius="lg"
        bg={bgColor}
        borderColor={borderColor}
        borderWidth="1px"
        boxShadow="lg"
        p={4}
      >
        <AlertIcon as={FaMobile} />
        <Box flex="1">
          <AlertTitle fontSize="sm" mb={1}>
            Enhanced Mobile Experience
          </AlertTitle>
          <AlertDescription fontSize="xs" mb={3}>
            {isInstallable 
              ? "Install this app for a full-screen experience without browser chrome!"
              : "Enable fullscreen mode for a better mobile experience!"
            }
          </AlertDescription>
          
          <VStack spacing={2} align="stretch">
            {isInstallable && (
              <Button
                size="sm"
                colorScheme="blue"
                leftIcon={<Icon as={FaDownload} />}
                onClick={installPWA}
                fontSize="xs"
              >
                Install App
              </Button>
            )}
            
            {canGoFullscreen && (
              <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                leftIcon={<Icon as={isFullscreen ? FaCompress : FaExpand} />}
                onClick={toggleFullscreen}
                fontSize="xs"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Go Fullscreen'}
              </Button>
            )}
          </VStack>
        </Box>
        
        <CloseButton
          alignSelf="flex-start"
          position="relative"
          right={-1}
          top={-1}
          onClick={onClose}
          size="sm"
        />
      </Alert>
    </Box>
  );
};

export default PWAInstallPrompt; 