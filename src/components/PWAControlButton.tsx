import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  VStack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { FaExpand, FaDownload, FaCompress } from 'react-icons/fa';
import { usePWA } from '../hooks/usePWA';
import { 
  navIconStyle
} from '../styles/navIconStyles';

// PWA Control Button Component
export const PWAControlButton = () => {
  const {
    isInstallable,
    isFullscreen,
    canGoFullscreen,
    isHTTPS,
    hasServiceWorker,
    installPWA,
    toggleFullscreen,
  } = usePWA();

  if (!isHTTPS || !hasServiceWorker) {
    return (
      <Tooltip label="PWA requires HTTPS" hasArrow>
        <IconButton
          icon={<FaDownload />}
          aria-label="PWA not available"
          variant="ghost"
          size="md"
          isDisabled
          sx={navIconStyle}
        />
      </Tooltip>
    );
  }

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={isFullscreen ? <FaCompress /> : <FaExpand />}
        aria-label="PWA Controls"
        variant="ghost"
        size="md"
        sx={navIconStyle}
      />
      <MenuList>
        {isInstallable && (
          <MenuItem onClick={installPWA} icon={<FaDownload />}>
            Install App
          </MenuItem>
        )}
        {canGoFullscreen && (
          <MenuItem onClick={toggleFullscreen} icon={isFullscreen ? <FaCompress /> : <FaExpand />}>
            {isFullscreen ? 'Exit Fullscreen' : 'Go Fullscreen'}
          </MenuItem>
        )}
        <MenuItem isDisabled>
          <VStack align="start" spacing={1} fontSize="xs">
            <Text>PWA Status:</Text>
            <Text color="green.500">✅ HTTPS: {isHTTPS ? 'Yes' : 'No'}</Text>
            <Text color="green.500">✅ Service Worker: {hasServiceWorker ? 'Yes' : 'No'}</Text>
            <Text color={isInstallable ? 'green.500' : 'gray.500'}>
              {isInstallable ? '✅' : '❌'} Installable: {isInstallable ? 'Yes' : 'No'}
            </Text>
            <Text color={canGoFullscreen ? 'green.500' : 'gray.500'}>
              {canGoFullscreen ? '✅' : '❌'} Fullscreen: {canGoFullscreen ? 'Yes' : 'No'}
            </Text>
          </VStack>
        </MenuItem>
      </MenuList>
    </Menu>
  );
}; 