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
  titleColor?: string;
  subtitleColor?: string;
  hideButtons?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  isLoading = false,
  actionButton,
  titleColor,
  subtitleColor,
  hideButtons = false,
}) => {
  const { isHeaderVisible } = useScrollDirection(15);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  return (
    <>
      {/* Mobile Header Row - Fixed positioned with scroll animation */}
      <Box
        display="none"
      >
        <HStack spacing={3} align="center">
          <VStack spacing={0} align="start" w="100%">
            <Skeleton isLoaded={!isLoading} fadeDuration={1}>
              <Heading 
                as="h1" 
                size="md"
                mb={0}
                color={titleColor || useColorModeValue('gray.800', 'white')}
                lineHeight="1.2"
                fontWeight="semibold"
                textAlign="left"
              >
                {title}
              </Heading>
            </Skeleton>
            {subtitle && (
              <Skeleton isLoaded={!isLoading} fadeDuration={1}>
                <Text 
                  color={subtitleColor || useColorModeValue('gray.600', 'gray.200')}
                  fontSize="sm"
                  mt={0}
                  textAlign="left"
                >
                  {subtitle}
                </Text>
              </Skeleton>
            )}
          </VStack>
          
          {/* Optional Action Button */}
          {!hideButtons && actionButton}
          
          {/* AI Assistant Button */}
          {!hideButtons && (
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
          )}
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