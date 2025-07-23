import React, { useState } from 'react';
import {
  Box,
  IconButton,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { FaPlus, FaEllipsisH, FaSync, FaFilter, FaCog } from 'react-icons/fa';
import { SparkleIcon, AIModal } from './';

interface MobileBottomNavigationProps {
  onCreateWorkout?: () => void;
  onRefresh?: () => void;
  onFilters?: () => void;
  onSettings?: () => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  onCreateWorkout,
  onRefresh,
  onFilters,
  onSettings,
}) => {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const buttonSize = "48px"; // Standard size for all buttons

  return (
    <>
      {/* Bottom Navigation - Floating Circles */}
      <Box
        position="fixed"
        bottom="40px"
        left="0"
        right="0"
        px={4}
        zIndex={1000}
        display={{ base: "flex", lg: "none" }}
        justifyContent="space-between"
        alignItems="center"
        pointerEvents="none"
      >
        {/* Left Side - Plus, 3-dot menu, AI Assistant */}
        {/* TODO glass buttons */}
        <HStack spacing={3} pointerEvents="auto" display="none">
          {/* Create/Plus Button */}
          <Box position="relative">
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              backdropFilter="blur(15px)"
              borderRadius="full"
              zIndex={-1}
            />
            <IconButton
              aria-label="Create Workout"
              icon={<FaPlus />}
              size="md"
              w={buttonSize}
              h={buttonSize}
              variant="ghost"
              borderRadius="full"
              onClick={onCreateWorkout}
              color="white"
              border="none"
              boxShadow="lg"
              _hover={{ 
                transform: 'scale(1.05)',
                boxShadow: 'xl'
              }}
              transition="all 0.2s"
              _active={{
                transform: 'scale(0.95)'
              }}
            />
          </Box>

          {/* 3-Dot Contextual Menu */}
          <Box position="relative">
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              backdropFilter="blur(15px)"
              borderRadius="full"
              zIndex={-1}
            />
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="More options"
                icon={<FaEllipsisH />}
                size="md"
                w={buttonSize}
                h={buttonSize}
                variant="ghost"
                borderRadius="full"
                color="white"
                border="none"
                boxShadow="lg"
                _hover={{ 
                  transform: 'scale(1.05)',
                  boxShadow: 'xl'
                }}
                transition="all 0.2s"
                _active={{
                  transform: 'scale(0.95)'
                }}
              />
              <MenuList>
                <MenuItem icon={<FaSync />} onClick={onRefresh}>
                  Refresh Data
                </MenuItem>
                <MenuItem icon={<FaFilter />} onClick={onFilters}>
                  Filter Options
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<FaCog />} onClick={onSettings}>
                  Settings
                </MenuItem>
              </MenuList>
            </Menu>
          </Box>

          {/* AI Assistant Button */}
          <Box position="relative">
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              backdropFilter="blur(15px)"
              borderRadius="full"
              zIndex={-1}
            />
            <IconButton
              aria-label="AI Assistant"
              icon={<SparkleIcon boxSize={5} />}
              size="md"
              w={buttonSize}
              h={buttonSize}
              variant="ghost"
              borderRadius="full"
              onClick={() => setIsAIModalOpen(true)}
              color="white"
              border="none"
              boxShadow="lg"
              _hover={{ 
                transform: 'scale(1.05)',
                boxShadow: 'xl'
              }}
              transition="all 0.2s"
              _active={{
                transform: 'scale(0.95)'
              }}
            />
          </Box>
        </HStack>


      </Box>

      {/* AI Modal */}
      <AIModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />


    </>
  );
};

export default MobileBottomNavigation; 