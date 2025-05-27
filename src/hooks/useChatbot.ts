import { useState } from 'react';
import { useDisclosure } from '@chakra-ui/react';

interface UseChatbotOptions {
  initialPrompt?: string;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Hook for managing the chatbot throughout the application
 */
export const useChatbot = (options: UseChatbotOptions = {}) => {
  const { initialPrompt, onOpen: customOnOpen, onClose: customOnClose } = options;
  const [initialQuestion, setInitialQuestion] = useState<string | undefined>(initialPrompt);
  const { isOpen, onOpen: baseOnOpen, onClose: baseOnClose } = useDisclosure();
  
  // Enhanced open function that can take an optional prompt
  const openChatbot = (prompt?: string) => {
    if (prompt) {
      setInitialQuestion(prompt);
    } else if (initialPrompt && !initialQuestion) {
      // Set the initial prompt the first time if provided and not overridden
      setInitialQuestion(initialPrompt);
    }
    
    if (customOnOpen) {
      customOnOpen();
    }
    baseOnOpen();
  };
  
  // Enhanced close function with custom callback
  const closeChatbot = () => {
    if (customOnClose) {
      customOnClose();
    }
    baseOnClose();
  };
  
  // Function to pre-populate the chatbot with a question
  const askQuestion = (question: string) => {
    setInitialQuestion(question);
    openChatbot();
  };
  
  // Clear the initial question (typically called after it's been used)
  const clearInitialQuestion = () => {
    setInitialQuestion(undefined);
  };
  
  return {
    isOpen,
    openChatbot,
    closeChatbot,
    askQuestion,
    initialQuestion,
    clearInitialQuestion
  };
};

export default useChatbot; 