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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
} from '@chakra-ui/react';
import { FaDownload, FaExpand, FaCompress, FaMobile, FaInfoCircle, FaApple, FaChrome } from 'react-icons/fa';
import { usePWA } from '../hooks/usePWA';

export const PWAInstallPrompt: React.FC = () => {
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });
  const {
    isInstallable,
    isFullscreen,
    canGoFullscreen,
    isHTTPS,
    hasServiceWorker,
    userAgent,
    installPWA,
    toggleFullscreen,
  } = usePWA();

  const bgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.700');

  // Show on mobile devices or if we have debugging info to display
  const shouldShow = canGoFullscreen || isInstallable || !isHTTPS || !hasServiceWorker;

  // Don't show if user has closed it and no critical issues
  if (!isOpen && isHTTPS && hasServiceWorker) {
    return null;
  }

  // Don't show anything if no relevant features and no issues
  if (!shouldShow) {
    return null;
  }

  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);

  return (
    <Box
      position="fixed"
      bottom={4}
      left={4}
      right={4}
      zIndex={1000}
      maxW="500px"
      mx="auto"
    >
      <Alert
        status={!isHTTPS || !hasServiceWorker ? "warning" : "info"}
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
            {!isHTTPS || !hasServiceWorker ? "Setup Required" : "Enhanced Mobile Experience"}
          </AlertTitle>
          
          <AlertDescription fontSize="xs" mb={3}>
            {!isHTTPS ? (
              "HTTPS required for PWA functionality on mobile devices."
            ) : !hasServiceWorker ? (
              "Service Workers not supported in this browser."
            ) : isInstallable ? (
              "Install this app for a full-screen experience without browser chrome!"
            ) : (
              "Get the best mobile experience with fullscreen mode!"
            )}
          </AlertDescription>
          
          {/* Action Buttons */}
          <VStack spacing={2} align="stretch" mb={3}>
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

          {/* Manual Install Instructions */}
          {!isInstallable && isHTTPS && hasServiceWorker && (
            <Accordion allowToggle size="sm">
              <AccordionItem border="none">
                <AccordionButton px={0} py={2} fontSize="xs">
                  <Box flex="1" textAlign="left">
                    <Icon as={FaInfoCircle} mr={2} />
                    Manual Install Instructions
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px={0} py={2} fontSize="xs">
                  {isIOS && (
                    <VStack align="start" spacing={1}>
                      <HStack>
                        <Icon as={FaApple} />
                        <Text fontWeight="bold">iOS Safari:</Text>
                      </HStack>
                      <Text>1. Tap the Share button (⬆️)</Text>
                      <Text>2. Scroll down and tap "Add to Home Screen"</Text>
                      <Text>3. Tap "Add" to install</Text>
                    </VStack>
                  )}
                  
                  {isAndroid && (
                    <VStack align="start" spacing={1}>
                      <HStack>
                        <Icon as={FaChrome} />
                        <Text fontWeight="bold">Android Chrome:</Text>
                      </HStack>
                      <Text>1. Tap the menu (⋮) in top right</Text>
                      <Text>2. Tap "Add to Home screen" or "Install app"</Text>
                      <Text>3. Tap "Install" to confirm</Text>
                    </VStack>
                  )}
                  
                  {!isIOS && !isAndroid && (
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">Browser Menu:</Text>
                      <Text>Look for "Add to Home Screen" or "Install App" option in your browser menu</Text>
                    </VStack>
                  )}
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}

          {/* Debug Info for Development */}
          {process.env.NODE_ENV === 'development' && (
            <Accordion allowToggle size="sm">
              <AccordionItem border="none">
                <AccordionButton px={0} py={2} fontSize="xs">
                  <Box flex="1" textAlign="left">
                    Debug Info
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel px={0} py={2} fontSize="xs">
                  <VStack align="start" spacing={1}>
                    <Text>HTTPS: <Code fontSize="xs">{isHTTPS ? '✅' : '❌'}</Code></Text>
                    <Text>Service Worker: <Code fontSize="xs">{hasServiceWorker ? '✅' : '❌'}</Code></Text>
                    <Text>Installable: <Code fontSize="xs">{isInstallable ? '✅' : '❌'}</Code></Text>
                    <Text>Fullscreen API: <Code fontSize="xs">{canGoFullscreen ? '✅' : '❌'}</Code></Text>
                    <Text>Browser: <Code fontSize="xs">{isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop'}</Code></Text>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}
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