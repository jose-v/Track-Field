import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  IconButton,
  useColorModeValue,
  Skeleton,
} from '@chakra-ui/react';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { SparkleIcon, AIModal } from './';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  actionButton?: React.ReactNode;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  isLoading = false,
  actionButton,
}) => {
  const { isHeaderVisible } = useScrollDirection(15);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  return (
    <>
      {/* Mobile Header Row - Fixed positioned with scroll animation */}
      <Box
        display={{ base: "block", lg: "none" }}
        position="fixed"
        top={isHeaderVisible ? "16px" : "-60px"}
        right="16px"
        zIndex={1001}
        bg="transparent"
        transition="top 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        transform="translateZ(0)"
      >
        <HStack spacing={3} align="center">
          <VStack spacing={0} align="end">
            <Skeleton isLoaded={!isLoading} fadeDuration={1}>
              <Heading 
                as="h1" 
                size="md"
                mb={0}
                color={useColorModeValue('gray.800', 'white')}
                lineHeight="1.2"
                fontWeight="semibold"
                textAlign="right"
              >
                {title}
              </Heading>
            </Skeleton>
            {subtitle && (
              <Skeleton isLoaded={!isLoading} fadeDuration={1}>
                <Text 
                  color={useColorModeValue('gray.600', 'gray.200')}
                  fontSize="sm"
                  mt={0}
                  textAlign="right"
                >
                  {subtitle}
                </Text>
              </Skeleton>
            )}
          </VStack>
          
          {/* Optional Action Button */}
          {actionButton}
          
          {/* AI Assistant Button */}
          <IconButton
            aria-label="AI Assistant"
            icon={<SparkleIcon boxSize={5} />}
            size="md"
            colorScheme="purple"
            variant="solid"
            borderRadius="full"
            onClick={() => setIsAIModalOpen(true)}
            boxShadow="lg"
            _hover={{ 
              transform: 'scale(1.05)',
              boxShadow: 'xl'
            }}
            transition="all 0.2s"
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            color="white"
            _active={{
              transform: 'scale(0.95)'
            }}
          />
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

export default MobileHeader; 