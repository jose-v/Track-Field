import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  Text,
  Flex,
  HStack,
  VStack,
  IconButton,
  SimpleGrid,
  useColorModeValue
} from '@chakra-ui/react';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';

interface WorkoutInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  flowType?: string;
  category?: string;
  restBetween?: string;
  contacts?: string | number;
  direction?: string;
  movementInstructions?: string;
}

export const WorkoutInfoDrawer: React.FC<WorkoutInfoDrawerProps> = ({
  isOpen,
  onClose,
  flowType,
  category,
  restBetween,
  contacts,
  direction,
  movementInstructions
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const sectionBg = useColorModeValue('gray.50', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      motionPreset="slideInBottom"
      closeOnOverlayClick={true}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent 
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        top="auto"
        height="60vh"
        maxHeight="60vh"
        minHeight="350px"
        borderRadius="16px 16px 0 0"
        bg={bgColor}
        border={`1px solid ${borderColor}`}
        boxShadow="2xl"
        margin="0"
        maxWidth="100vw"
        width="100vw"
        display="flex"
        flexDirection="column"
      >
        <ModalBody p={0} h="100%" display="flex" flexDirection="column">
          {/* Header */}
          <Flex 
            justify="space-between" 
            align="center" 
            p={6} 
            borderBottom={`1px solid ${borderColor}`}
            flexShrink={0}
          >
            <HStack spacing={3}>
              <Box
                bg="linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%)"
                borderRadius="full"
                w="40px"
                h="40px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="md"
                color="white"
              >
                <FaInfoCircle size="20px" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                Exercise Info
              </Text>
            </HStack>
            
            {/* Close Button */}
            <IconButton
              aria-label="Close Exercise Info"
              icon={<FaTimes />}
              size="lg"
              variant="ghost"
              borderRadius="full"
              onClick={onClose}
              color={textColor}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              fontSize="18px"
            />
          </Flex>

          {/* Content Area */}
          <Box flex="1" overflow="auto" p={6}>
            <VStack spacing={6} align="stretch">
              {/* Primary Info Grid */}
              <Box bg={sectionBg} borderRadius="xl" p={4}>
                <SimpleGrid columns={3} spacing={4}>
                  {/* Flow Type */}
                  <VStack spacing={2} align="center">
                    <Text fontSize="xs" color={labelColor} fontWeight="medium" textAlign="center" textTransform="uppercase">
                      Flow Type
                    </Text>
                    <Text fontSize="md" color={textColor} textTransform="capitalize" textAlign="center" fontWeight="semibold">
                      {flowType || 'Sequential'}
                    </Text>
                  </VStack>

                  {/* Category */}
                  <VStack spacing={2} align="center">
                    <Text fontSize="xs" color={labelColor} fontWeight="medium" textAlign="center" textTransform="uppercase">
                      Category
                    </Text>
                    <Text fontSize="md" color={textColor} textTransform="capitalize" textAlign="center" fontWeight="semibold">
                      {category || 'Main'}
                    </Text>
                  </VStack>

                  {/* Rest Between */}
                  <VStack spacing={2} align="center">
                    <Text fontSize="xs" color={labelColor} fontWeight="medium" textAlign="center" textTransform="uppercase">
                      Rest Between
                    </Text>
                    <Text fontSize="md" color={textColor} textAlign="center" fontWeight="semibold">
                      {restBetween || 'None'}
                    </Text>
                  </VStack>
                </SimpleGrid>
              </Box>

              {/* Exercise Details Grid */}
              {(contacts || direction) && (
                <Box bg={sectionBg} borderRadius="xl" p={4}>
                  <SimpleGrid columns={2} spacing={4}>
                    {/* Contacts */}
                    {contacts && (
                      <VStack spacing={2} align="center">
                        <Text fontSize="xs" color={labelColor} fontWeight="medium" textAlign="center" textTransform="uppercase">
                          Contacts
                        </Text>
                        <Text fontSize="md" color={textColor} textAlign="center" fontWeight="semibold">
                          {contacts}
                        </Text>
                      </VStack>
                    )}

                    {/* Direction */}
                    {direction && (
                      <VStack spacing={2} align="center">
                        <Text fontSize="xs" color={labelColor} fontWeight="medium" textAlign="center" textTransform="uppercase">
                          Direction
                        </Text>
                        <Text fontSize="md" color={textColor} textTransform="capitalize" textAlign="center" fontWeight="semibold">
                          {direction}
                        </Text>
                      </VStack>
                    )}
                  </SimpleGrid>
                </Box>
              )}

              {/* Movement Instructions */}
              {movementInstructions && (
                <Box bg={sectionBg} borderRadius="xl" p={4}>
                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" color={labelColor} fontWeight="medium" textTransform="uppercase">
                      Movement Instructions
                    </Text>
                    <Text fontSize="md" color={textColor} lineHeight="1.6">
                      {movementInstructions}
                    </Text>
                  </VStack>
                </Box>
              )}
            </VStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 