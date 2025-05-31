import { useEffect, useState } from 'react';
import {
  Button,
  Box,
  Text,
  VStack,
  useColorModeValue,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FaSync, FaTimes } from 'react-icons/fa';

export const PWARefreshButton = () => {
  const [isPWA, setIsPWA] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isHomePage, setIsHomePage] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('blue.200', 'blue.600');

  useEffect(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    // Check if we're on home page when we should be on dashboard
    const currentPath = window.location.pathname;
    const isOnHomePage = currentPath === '/' || currentPath === '/home';
    
    console.log('PWA Debug:', {
      isStandalone,
      currentPath,
      isOnHomePage,
      href: window.location.href
    });

    setIsPWA(isStandalone);
    setIsHomePage(isOnHomePage);
    
    // Show button if we're in PWA and on home page (should be dashboard)
    if (isStandalone && isOnHomePage) {
      setShowButton(true);
    }
  }, []);

  const handleRefresh = () => {
    console.log('PWA Refresh triggered');
    // Try to navigate to dashboard first
    window.location.href = '/dashboard';
    // If that doesn't work, force reload
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleGoToDashboard = () => {
    console.log('PWA Navigate to dashboard');
    window.location.href = '/dashboard';
  };

  const handleDismiss = () => {
    setShowButton(false);
    localStorage.setItem('pwa-refresh-dismissed', 'true');
  };

  // Don't show if not PWA or if dismissed
  if (!isPWA || !showButton || !isHomePage) {
    return null;
  }

  // Check if user dismissed it
  if (localStorage.getItem('pwa-refresh-dismissed') === 'true') {
    return null;
  }

  return (
    <Box
      position="fixed"
      top="4"
      right="4"
      zIndex={9999}
      bg={bgColor}
      border="2px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      boxShadow="lg"
      maxW="300px"
    >
      <VStack spacing={3} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Text fontSize="sm" fontWeight="bold" color="blue.600">
            PWA Navigation Issue
          </Text>
          <IconButton
            aria-label="Dismiss"
            icon={<FaTimes />}
            size="xs"
            variant="ghost"
            onClick={handleDismiss}
          />
        </Box>
        
        <Text fontSize="xs" color="gray.600">
          You're on the home page but should be on dashboard. Try these options:
        </Text>
        
        <VStack spacing={2} align="stretch">
          <Button
            leftIcon={<FaSync />}
            size="sm"
            colorScheme="blue"
            onClick={handleGoToDashboard}
          >
            Go to Dashboard
          </Button>
          
          <Button
            leftIcon={<FaSync />}
            size="sm"
            variant="outline"
            colorScheme="blue"
            onClick={handleRefresh}
          >
            Force Refresh
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}; 