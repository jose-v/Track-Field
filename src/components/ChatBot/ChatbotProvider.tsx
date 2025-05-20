import React, { createContext, useContext, useState } from 'react';
import { IconButton, useDisclosure } from '@chakra-ui/react';
import { FaComment } from 'react-icons/fa';
import TrackChatBot from './TrackChatBot';

interface ChatbotContextType {
  openChatbot: (initialQuestion?: string) => void;
  closeChatbot: () => void;
  isOpen: boolean;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const useChatbotContext = (): ChatbotContextType => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbotContext must be used within a ChatbotProvider');
  }
  return context;
};

interface ChatbotProviderProps {
  children: React.ReactNode;
}

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [initialQuestion, setInitialQuestion] = useState<string | undefined>();
  
  const openChatbot = (question?: string) => {
    if (question) {
      setInitialQuestion(question);
    }
    onOpen();
  };
  
  const closeChatbot = () => {
    onClose();
  };
  
  const handleQuestionProcessed = () => {
    setInitialQuestion(undefined);
  };
  
  return (
    <ChatbotContext.Provider value={{ openChatbot, closeChatbot, isOpen }}>
      {children}
      
      {/* Floating Chat Button */}
      <IconButton
        icon={<FaComment />}
        aria-label="Open Chat"
        position="fixed"
        bottom="20px"
        right="20px"
        size="lg"
        colorScheme="blue"
        borderRadius="full"
        boxShadow="lg"
        onClick={() => openChatbot()}
        zIndex={100}
      />
      
      {/* Chatbot Component */}
      <TrackChatBot
        isOpen={isOpen}
        onClose={closeChatbot}
        initialQuestion={initialQuestion}
        onQuestionProcessed={handleQuestionProcessed}
      />
    </ChatbotContext.Provider>
  );
};

export default ChatbotProvider; 