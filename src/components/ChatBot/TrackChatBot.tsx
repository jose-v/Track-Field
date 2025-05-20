import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  Input,
  VStack,
  Text,
  IconButton,
  useColorModeValue,
  Avatar,
  Spinner,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useToast,
} from '@chakra-ui/react';
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
import { 
  sendChatGPTPrompt, 
  createContextualPrompt,
  analyzeMessageIntent,
  fetchUserData
} from '../../services/chatbot.service';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface TrackChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
  onQuestionProcessed?: () => void;
}

const TrackChatBot: React.FC<TrackChatBotProps> = ({ 
  isOpen, 
  onClose, 
  initialQuestion,
  onQuestionProcessed
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialQuestionProcessedRef = useRef(false);
  const toast = useToast();
  const { userId, isLoggedIn } = useAuth();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const userBubbleBg = '#2B6CB0'; // Fixed blue color for user bubbles
  const botBubbleBg = useColorModeValue('gray.200', 'gray.600');
  const botTextColor = useColorModeValue('black', 'white');
  const userTextColor = 'white'; // Always white for user messages

  // Process initialQuestion if provided
  useEffect(() => {
    if (isOpen && initialQuestion && !initialQuestionProcessedRef.current) {
      setInput(initialQuestion);
      initialQuestionProcessedRef.current = true;
      // Use a small delay to ensure the UI is visible before processing
      setTimeout(() => {
        handleSendMessage(initialQuestion);
        if (onQuestionProcessed) {
          onQuestionProcessed();
        }
      }, 300);
    }
  }, [isOpen, initialQuestion, onQuestionProcessed]);

  // Reset the processed flag when drawer closes
  useEffect(() => {
    if (!isOpen) {
      initialQuestionProcessedRef.current = false;
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up welcome message based on authentication status
  useEffect(() => {
    // Use different welcome message based on login status
    const welcomeMessage = isLoggedIn 
      ? "Hi there! I'm your Track & Field assistant. Ask me about your schedule, performance, or training metrics."
      : "Hi there! I'm your Track & Field assistant. Please log in to access your personal training data and metrics.";
      
    setMessages([
      {
        text: welcomeMessage,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  }, [isLoggedIn]);

  // Process user message and get AI response
  const processMessage = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      // Extract intent from user message
      const intent = await analyzeMessageIntent(userMessage);
      
      // Fetch relevant user data based on intent
      const userData = await fetchUserData(intent, userId || '');
      
      // Create context-aware prompt for ChatGPT
      const prompt = await createContextualPrompt(userMessage, userData, intent);
      
      // Call ChatGPT API
      const response = await sendChatGPTPrompt(prompt);
      
      // Add bot response to messages
      setMessages(prev => [
        ...prev, 
        { 
          text: response, 
          sender: 'bot', 
          timestamp: new Date() 
        }
      ]);
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [
        ...prev, 
        { 
          text: "Sorry, I encountered an error processing your request. Please try again.", 
          sender: 'bot', 
          timestamp: new Date() 
        }
      ]);
      
      toast({
        title: 'Error',
        description: 'Could not get a response from the AI assistant.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleSendMessage to accept an optional messageText parameter
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      text: textToSend,
      sender: 'user' as const,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Only clear input field if we're using the current input
    if (!messageText) {
      setInput('');
    }
    
    // Process and get response
    await processMessage(textToSend);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          <Flex align="center">
            <FaRobot size="20px" />
            <Text ml={2}>Track & Field Assistant</Text>
          </Flex>
        </DrawerHeader>

        <DrawerBody p={0}>
          <Flex direction="column" h="100%">
            {/* Messages Container */}
            <VStack
              flex="1"
              p={4}
              overflowY="auto"
              spacing={4}
              align="stretch"
            >
              {messages.map((msg, index) => (
                <Flex
                  key={index}
                  justify={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                >
                  {msg.sender === 'bot' && (
                    <Avatar 
                      size="sm" 
                      mr={2} 
                      icon={<FaRobot size="60%" />} 
                      bg="blue.500" 
                    />
                  )}
                  <Box
                    maxW="80%"
                    p={3}
                    borderRadius="lg"
                    bg={msg.sender === 'user' ? userBubbleBg : botBubbleBg}
                    color={msg.sender === 'user' ? 'white' : botTextColor}
                  >
                    <Text color={msg.sender === 'user' ? 'white' : 'inherit'}>{msg.text}</Text>
                    <Text
                      fontSize="xs"
                      opacity={0.8}
                      textAlign="right"
                      mt={1}
                      color={msg.sender === 'user' ? 'white' : 'inherit'}
                    >
                      {msg.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </Box>
                  {msg.sender === 'user' && (
                    <Avatar 
                      size="sm" 
                      ml={2} 
                      icon={<FaUser size="60%" />} 
                      bg="gray.500" 
                    />
                  )}
                </Flex>
              ))}
              {isLoading && (
                <Flex justify="flex-start">
                  <Avatar 
                    size="sm" 
                    mr={2} 
                    icon={<FaRobot size="60%" />} 
                    bg="blue.500" 
                  />
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg={botBubbleBg}
                    color={botTextColor}
                  >
                    <Spinner size="sm" color="blue.500" mr={2} />
                    <Text as="span">Thinking...</Text>
                  </Box>
                </Flex>
              )}
              <div ref={messagesEndRef} />
            </VStack>

            {/* Input Area */}
            <Box p={4} borderTopWidth="1px" borderColor={borderColor}>
              <Flex>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your training, meets, or performance..."
                  bg={inputBg}
                  borderRadius="md"
                  mr={2}
                />
                <IconButton
                  colorScheme="blue"
                  aria-label="Send message"
                  icon={<FaPaperPlane />}
                  onClick={() => handleSendMessage()}
                  isDisabled={isLoading || !input.trim()}
                />
              </Flex>
            </Box>
          </Flex>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default TrackChatBot; 