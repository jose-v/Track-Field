import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Flex,
  Icon,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { IconType } from 'react-icons';
import { useScrollDirection } from '../../hooks/useScrollDirection';

export interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

export interface SettingsItem {
  id: string;
  label: string;
  icon: IconType;
  description?: string;
}

interface SettingsSidebarProps {
  sections: SettingsSection[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  sections,
  activeItem,
  onItemClick
}) => {
  const [mainSidebarWidth, setMainSidebarWidth] = useState(() => {
    // Check localStorage for the saved main sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    return savedSidebarState === 'true' ? 70 : 200;
  });

  const { isHeaderVisible } = useScrollDirection(15);

  // Listen for main sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      const newWidth = event.detail.width;
      setMainSidebarWidth(newWidth);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sectionTitleColor = useColorModeValue('gray.500', 'gray.400');
  const itemColor = useColorModeValue('gray.700', 'gray.300');
  const itemHoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeItemBg = useColorModeValue('blue.50', 'blue.900');
  const activeItemColor = useColorModeValue('blue.600', 'blue.200');
  const activeItemBorderColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Box
      w="280px"
      h={`calc(100vh - ${isHeaderVisible ? '58px' : '0px'})`}
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      position="fixed"
      left={`${mainSidebarWidth}px`}
      top={isHeaderVisible ? "58px" : "-22px"}
      overflowY="auto"
      pt={6}
      pb={6}
      px={4}
      display={{ base: 'none', lg: 'block' }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      zIndex={998} // Below main sidebar (1000) and SimplifiedNav (999) but above content
    >
      <VStack spacing={6} align="stretch">
        {sections.map((section, sectionIndex) => (
          <Box key={section.id}>
            {/* Section Title */}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color={sectionTitleColor}
              textTransform="uppercase"
              letterSpacing="wider"
              mb={3}
              px={3}
            >
              {section.title}
            </Text>
            
            {/* Section Items */}
            <VStack spacing={1} align="stretch">
              {section.items.map((item) => {
                const isActive = activeItem === item.id;
                
                return (
                  <Flex
                    key={item.id}
                    align="center"
                    p={3}
                    borderRadius="md"
                    cursor="pointer"
                    bg={isActive ? activeItemBg : 'transparent'}
                    color={isActive ? activeItemColor : itemColor}
                    borderLeft="3px solid"
                    borderLeftColor={isActive ? activeItemBorderColor : 'transparent'}
                    transition="all 0.2s"
                    _hover={{
                      bg: isActive ? activeItemBg : itemHoverBg,
                      color: isActive ? activeItemColor : itemColor,
                    }}
                    onClick={() => onItemClick(item.id)}
                  >
                    <Icon
                      as={item.icon}
                      fontSize="lg"
                      mr={3}
                      color={isActive ? activeItemColor : itemColor}
                    />
                    <Box flex="1">
                      <Text fontSize="sm" fontWeight={isActive ? 'semibold' : 'medium'}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text fontSize="xs" color={sectionTitleColor} mt={0.5}>
                          {item.description}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                );
              })}
            </VStack>
            
            {/* Divider between sections (except last) */}
            {sectionIndex < sections.length - 1 && (
              <Divider mt={4} borderColor={borderColor} />
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default SettingsSidebar; 