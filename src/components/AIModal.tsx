import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
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
  Divider,
  Textarea,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { FaPaperPlane, FaRobot, FaUser, FaStar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';

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
      content: "Hi! I'm your Track & Field AI assistant. I can help you with workout planning, technique tips, nutrition advice, and answer any questions about your training. What would you like to know?",
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
  const handleBarColor = useColorModeValue('gray.300', 'gray.600');

  // Role-based prompt suggestions
  const isCoach = profile?.role === 'coach';
  const promptSuggestions = isCoach ? [
    "How to design effective sprint workouts?",
    "Best practices for managing athlete training loads",
    "Creating periodized training plans",
    "Nutrition strategies for competition day"
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
    } else if (input.includes('injury') || input.includes('pain')) {
      return "I'm not a medical professional, but here are general tips: Rest if you feel pain, ice acute injuries, maintain flexibility, and always consult a sports medicine doctor for persistent issues. Prevention is key - proper warm-up and gradual training progression.";
    } else if (input.includes('technique') || input.includes('form')) {
      return isCoach
        ? "For technique coaching: Use video analysis, focus on one element at a time, provide clear kinesthetic cues, and use progressive drills. Key phases vary by event - start with fundamentals before adding complexity."
        : "Good technique is fundamental! Each event has specific technical requirements. For sprints: focus on arm drive and leg turnover. For distance: efficient stride and breathing. For field events: practice the technical phases repeatedly. Want specific tips for your event?";
    } else {
      return "That's a great question! Track and field training involves many aspects - technique, conditioning, mental preparation, and recovery. Feel free to ask about specific events, training methods, nutrition, or any other aspect of your athletic journey.";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
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
        height="35vh"
        maxHeight="350px"
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
        {/* Gmail-style Handle Bar */}
        <Box
          bg={bgColor}
          borderTopRadius="xl"
          py={3}
          px={4}
          borderBottom="1px solid"
          borderColor={borderColor}
          position="relative"
        >
          {/* Drag Handle */}
          <Box
            w="40px"
            h="4px"
            bg={handleBarColor}
            borderRadius="full"
            mx="auto"
            mb={3}
          />
          
          {/* Header Content */}
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Box
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                borderRadius="full"
                p={2}
                boxShadow="md"
              >
                <FaRobot size="16px" color="white" />
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="md" fontWeight="bold">
                  AI Training Assistant
                </Text>
                <Badge 
                  colorScheme="green" 
                  variant="solid" 
                  fontSize="xs"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                >
                  Online
                </Badge>
              </VStack>
            </HStack>
            
            {/* Close Button */}
            <IconButton
              aria-label="Close"
              icon={<Box as="span" fontSize="18px">×</Box>}
              variant="ghost"
              size="sm"
              borderRadius="full"
              onClick={onClose}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
            />
          </HStack>
        </Box>

        {/* Chat Area */}
        <ModalBody p={0} flex="1" display="flex" flexDirection="column">
          {/* Messages */}
          <Box 
            flex="1" 
            overflowY="auto" 
            px={4} 
            py={2}
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
            <VStack spacing={2} align="stretch">
              {messages.map((message) => (
                <Flex
                  key={message.id}
                  justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                >
                  <HStack
                    spacing={2}
                    maxW="85%"
                    flexDirection={message.sender === 'user' ? 'row-reverse' : 'row'}
                  >
                    <Avatar
                      size="xs"
                      bg={message.sender === 'user' ? messageBubbleUser : 'purple.500'}
                      icon={message.sender === 'user' ? <FaUser /> : <FaRobot />}
                    />
                    <Box
                      bg={message.sender === 'user' ? messageBubbleUser : messageBubbleAI}
                      color={message.sender === 'user' ? 'white' : useColorModeValue('gray.800', 'white')}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      borderTopLeftRadius={message.sender === 'user' ? 'lg' : 'sm'}
                      borderTopRightRadius={message.sender === 'user' ? 'sm' : 'lg'}
                      maxW="100%"
                      wordBreak="break-word"
                    >
                      <Text fontSize="xs" lineHeight="1.4">
                        {message.content}
                      </Text>
                      <Text 
                        fontSize="xx-small" 
                        opacity="0.7" 
                        mt={1}
                        textAlign={message.sender === 'user' ? 'right' : 'left'}
                      >
                        {formatTime(message.timestamp)}
                      </Text>
                    </Box>
                  </HStack>
                </Flex>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <Flex justify="flex-start">
                  <HStack spacing={2} maxW="85%">
                    <Avatar size="xs" bg="purple.500" icon={<FaRobot />} />
                    <Box
                      bg={messageBubbleAI}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      borderTopLeftRadius="sm"
                    >
                      <HStack spacing={1}>
                        {[0, 1, 2].map((dot) => (
                          <Box
                            key={dot}
                            w="4px"
                            h="4px"
                            bg="gray.400"
                            borderRadius="full"
                            animation={`pulse 1.4s ease-in-out ${dot * 0.2}s infinite`}
                          />
                        ))}
                      </HStack>
                    </Box>
                  </HStack>
                </Flex>
              )}
            </VStack>
          </Box>

          {/* Prompt Suggestions */}
          {messages.length <= 1 && (
            <Box px={4} py={2}>
              <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} mb={2}>
                Try asking:
              </Text>
              <SimpleGrid columns={1} spacing={1}>
                {promptSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    size="xs"
                    variant="ghost"
                    justifyContent="flex-start"
                    fontSize="xs"
                    h="auto"
                    py={1}
                    px={2}
                    color={useColorModeValue('blue.600', 'blue.300')}
                    _hover={{ bg: useColorModeValue('blue.50', 'blue.900') }}
                    onClick={() => handleSendMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* Input Area */}
          <Box p={3} borderTop="1px solid" borderColor={borderColor}>
            <HStack spacing={2}>
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me about training, nutrition, technique..."
                resize="none"
                minH="32px"
                maxH="60px"
                fontSize="sm"
                borderRadius="lg"
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
                size="sm"
                onClick={() => handleSendMessage()}
                isDisabled={!inputValue.trim() || isTyping}
                _hover={{ transform: 'scale(1.05)' }}
                transition="all 0.2s"
              />
            </HStack>
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