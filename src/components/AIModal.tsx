import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Button,
  useColorModeValue,
  Flex,
  Avatar,
  Textarea,
  SimpleGrid,
} from '@chakra-ui/react';
import { FaPaperPlane, FaUser, FaTimes } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { SparkleIcon } from './SparkleIcon';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai'; content: string }>>([]);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  const suggestionBg = useColorModeValue('gray.50', 'gray.700');
  const suggestionHoverBg = useColorModeValue('gray.100', 'gray.600');

  const suggestions = [
    "Analyze my recent workout performance",
    "Create a weekly training plan",
    "Review my nutrition goals",
    "Track my recovery metrics"
  ];

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, 
        { type: 'user', content: inputValue },
        { type: 'ai', content: `I'll help you with: ${inputValue}` }
      ]);
      setInputValue('');
    }
  };

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
        height="50vh"
        maxHeight="50vh"
        minHeight="300px"
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
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                borderRadius="full"
                w="40px"
                h="40px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="md"
                color="white"
              >
                <SparkleIcon boxSize="20px" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                AI Assistant
              </Text>
            </HStack>
            
            {/* Big X Close Button */}
            <IconButton
              aria-label="Close AI Assistant"
              icon={<FaTimes />}
              size="lg"
              variant="ghost"
              borderRadius="full"
              onClick={onClose}
              color={textColor}
              _hover={{ bg: suggestionHoverBg }}
              fontSize="18px"
            />
          </Flex>

          {/* Content Area - Takes remaining space */}
          <Box flex="1" overflow="hidden" display="flex" flexDirection="column">
            {/* Messages or Welcome Screen */}
            {messages.length === 0 ? (
              <VStack spacing={6} p={6} flex="1" justify="center">
                {/* Suggestions Grid */}
                <SimpleGrid columns={2} spacing={3} w="100%" maxW="600px">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="md"
                      h="auto"
                      p={4}
                      borderRadius="12px"
                      bg={suggestionBg}
                      borderColor={borderColor}
                      _hover={{ bg: suggestionHoverBg }}
                      onClick={() => setInputValue(suggestion)}
                      whiteSpace="normal"
                      textAlign="left"
                      fontSize="sm"
                      fontWeight="normal"
                      color={textColor}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </SimpleGrid>
              </VStack>
            ) : (
              <VStack spacing={4} p={4} flex="1" overflow="auto" align="stretch">
                {messages.map((message, index) => (
                  <HStack key={index} justify={message.type === 'user' ? 'flex-end' : 'flex-start'}>
                    {message.type === 'ai' && (
                      <Avatar size="sm" bg="purple.500" color="white" icon={<SparkleIcon boxSize="12px" />} />
                    )}
                    <Box
                      bg={message.type === 'user' ? 'blue.500' : 'gray.100'}
                      color={message.type === 'user' ? 'white' : textColor}
                      px={4}
                      py={2}
                      borderRadius="18px"
                      maxW="70%"
                    >
                      <Text fontSize="sm">{message.content}</Text>
                    </Box>
                    {message.type === 'user' && (
                      <Avatar size="sm" bg="blue.500" color="white" icon={<FaUser />} />
                    )}
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>

          {/* Input Area - Fixed at bottom */}
          <Box p={4} borderTop={`1px solid ${borderColor}`} flexShrink={0}>
            <HStack spacing={3}>
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your training..."
                resize="none"
                rows={1}
                borderRadius="24px"
                bg={suggestionBg}
                border={`1px solid ${borderColor}`}
                _focus={{ 
                  borderColor: 'purple.500',
                  boxShadow: '0 0 0 1px #805AD5'
                }}
                _placeholder={{ color: placeholderColor }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <IconButton
                aria-label="Send message"
                icon={<FaPaperPlane />}
                colorScheme="purple"
                borderRadius="full"
                onClick={handleSendMessage}
                isDisabled={!inputValue.trim()}
              />
            </HStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AIModal; 