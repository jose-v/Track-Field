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
import { FaPaperPlane, FaUser, FaStar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';

// Import SparkleIcon from index or define it locally
const SparkleIcon = ({ boxSize }: { boxSize?: number | string }) => (
  <Box
    as="svg"
    boxSize={boxSize || 4}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 0l1.09 3.09L16 2l-1.09 3.09L18 6l-3.09 1.09L16 10l-3.09-1.09L12 12l-1.09-3.09L8 10l1.09-3.09L6 6l3.09-1.09L8 2l3.09 1.09L12 0z" />
    <path d="M19.5 12.5l.5 1.5 1.5-.5-.5 1.5 1.5.5-1.5.5.5 1.5-1.5-.5-.5 1.5-.5-1.5-1.5.5.5-1.5-1.5-.5 1.5-.5-.5-1.5 1.5.5.5-1.5z" />
  </Box>
);

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const messageBubbleUser = useColorModeValue('blue.500', 'blue.400');
  const messageBubbleAI = useColorModeValue('gray.100', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');

  // Role-based prompt suggestions
  const isCoach = profile?.role === 'coach';
  const promptSuggestions = isCoach ? [
    "How to improve my 100m sprint time?",
    "What should I eat before training?",
    "How to prevent running injuries?",
    "Best warm-up exercises for track events"
  ] : [
    "How to improve my 100m sprint time?",
    "What should I eat before training?",
    "How to prevent running injuries?",
    "Best warm-up exercises for track events"
  ];

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(textToSend),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('workout') || input.includes('training')) {
      return isCoach 
        ? "For effective training plans, consider periodization: base building (70% aerobic), strength phase (60% aerobic, 30% strength), and competition phase (50% aerobic, 30% speed/power). Adjust volume and intensity based on athlete's experience and event specialization."
        : "For effective track and field training, I recommend a balanced approach: 70% easy runs, 20% tempo/threshold work, and 10% speed work. What specific event are you training for? I can provide more targeted advice.";
    } else if (input.includes('nutrition') || input.includes('diet')) {
      return isCoach
        ? "For athlete nutrition guidance: Pre-training (2-4hrs): carbs + moderate protein. Post-training (within 30min): 3:1 or 4:1 carb-to-protein ratio. Competition day: familiar foods, avoid high fiber/fat 3-4hrs before. Hydration is key throughout."
        : "Proper nutrition is crucial for performance! Focus on: 1) Carbs for energy (45-65% of calories), 2) Protein for recovery (1.2-2.0g per kg body weight), 3) Healthy fats (20-35% of calories). Stay hydrated and time your meals around training.";
    } else if (input.includes('injur') || input.includes('prevent')) {
      return "I'm not a medical professional, but here are general tips: Rest if you feel pain, ice acute injuries, maintain flexibility, and always consult a sports medicine doctor for persistent issues. Prevention is key - proper warm-up and gradual training progression.";
    } else if (input.includes('technique') || input.includes('form')) {
      return isCoach
        ? "For technique coaching: Use video analysis, focus on one element at a time, provide clear kinesthetic cues, and use progressive drills. Key phases vary by event - start with fundamentals before adding complexity."
        : "Good technique is fundamental! Each event has specific technical requirements. For sprints: focus on arm drive and leg turnover. For distance: efficient stride and breathing. For field events: practice the technical phases repeatedly. Want specific tips for your event?";
    } else {
      return "That's a great question! Track and field training involves many aspects - technique, conditioning, mental preparation, and recovery. Feel free to ask about specific events, training methods, nutrition, or any other aspect of your athletic journey.";
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="full"
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.300" />
      <ModalContent
        position="fixed"
        bottom="0"
        top="auto"
        height="33.33vh"
        borderTopRadius="xl"
        borderBottomRadius="0"
        bg={bgColor}
        boxShadow="2xl"
        border="1px solid"
        borderColor={borderColor}
        mx={0}
        my={0}
        maxW="100vw"
      >
        <ModalBody p={0} flex="1" display="flex" flexDirection="column">
          {/* Header with big title and close button */}
          <Flex
            justify="space-between"
            align="center"
            p={6}
            borderBottom="1px solid"
            borderColor={borderColor}
          >
            <VStack align="start" spacing={0}>
              <HStack spacing={3} align="center">
                <Box
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  borderRadius="full"
                  p={2}
                  boxShadow="md"
                  color="white"
                >
                  <SparkleIcon boxSize="20px" />
                </Box>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  How can I help you today?
                </Text>
              </HStack>
            </VStack>
            
            {/* Big X Close Button */}
            <IconButton
              aria-label="Close"
              icon={<Box as="span" fontSize="24px" fontWeight="bold">×</Box>}
              variant="ghost"
              size="lg"
              borderRadius="full"
              onClick={onClose}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              fontSize="24px"
            />
          </Flex>

          {/* Content Area */}
          <Box flex="1" display="flex" flexDirection="column">
            {/* Show suggestions when no conversation has started */}
            {messages.length <= 1 && (
              <Box p={6} flex="1">
                <VStack spacing={4} align="stretch">
                  {promptSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      size="lg"
                      variant="outline"
                      justifyContent="flex-start"
                      fontSize="md"
                      h="auto"
                      py={4}
                      px={4}
                      textAlign="left"
                      whiteSpace="normal"
                      color={useColorModeValue('gray.700', 'gray.200')}
                      borderColor={useColorModeValue('gray.300', 'gray.600')}
                      _hover={{ 
                        bg: useColorModeValue('gray.50', 'gray.700'),
                        borderColor: useColorModeValue('blue.300', 'blue.500')
                      }}
                      onClick={() => handleSendMessage(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Chat Messages - only show when there's a conversation */}
            {messages.length > 1 && (
              <Box 
                flex="1" 
                overflowY="auto" 
                p={4}
                css={{
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#CBD5E0',
                    borderRadius: '4px',
                  },
                }}
              >
                <VStack spacing={3} align="stretch">
                  {messages.slice(1).map((message) => (
                    <Flex
                      key={message.id}
                      justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                    >
                      <Box
                        bg={message.sender === 'user' ? messageBubbleUser : messageBubbleAI}
                        color="white"
                        px={4}
                        py={3}
                        borderRadius="xl"
                        maxW="80%"
                        wordBreak="break-word"
                      >
                        <Text fontSize="sm" lineHeight="1.5">
                          {message.content}
                        </Text>
                      </Box>
                    </Flex>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <Flex justify="flex-start">
                      <Box
                        bg={messageBubbleAI}
                        px={4}
                        py={3}
                        borderRadius="xl"
                      >
                        <HStack spacing={1}>
                          {[0, 1, 2].map((dot) => (
                            <Box
                              key={dot}
                              w="6px"
                              h="6px"
                              bg="gray.400"
                              borderRadius="full"
                              animation={`pulse 1.4s ease-in-out ${dot * 0.2}s infinite`}
                            />
                          ))}
                        </HStack>
                      </Box>
                    </Flex>
                  )}
                </VStack>
              </Box>
            )}

            {/* Input Area */}
            <Box p={4} borderTop="1px solid" borderColor={borderColor}>
              <HStack spacing={3}>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me about training, nutrition, technique..."
                  size="lg"
                  borderRadius="full"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #3182CE',
                  }}
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
                  colorScheme="blue"
                  borderRadius="full"
                  size="lg"
                  onClick={() => handleSendMessage()}
                  isDisabled={!inputValue.trim() || isTyping}
                  _hover={{ transform: 'scale(1.05)' }}
                  transition="all 0.2s"
                />
              </HStack>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
      
      {/* Pulse animation keyframes */}
      <style>
        {`
          @keyframes pulse {
            0%, 80%, 100% {
              opacity: 0.3;
              transform: scale(0.8);
            }
            40% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </Modal>
  );
};

export default AIModal; 