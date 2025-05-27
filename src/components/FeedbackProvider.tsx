import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import FeedbackModal from './FeedbackModal';
import useFeedbackPrompt from '../hooks/useFeedbackPrompt';
import { submitFeedback } from '../services/feedbackService';

type FeedbackTrigger = 
  | 'first_success' 
  | 'periodic_usage' 
  | 'post_support' 
  | 'major_update';

interface FeedbackContextType {
  showFeedbackModal: () => void;
  hideFeedbackModal: () => void;
  triggerFeedback: (trigger: FeedbackTrigger) => boolean;
  recordAppUsage: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

interface FeedbackProviderProps {
  children: ReactNode;
  username?: string;
  userAvatar?: string;
  userType?: 'coach' | 'athlete';
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({
  children,
  username = 'Anonymous User',
  userAvatar = '',
  userType = 'athlete'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const {
    shouldShowFeedback,
    triggerFeedback,
    closeFeedbackPrompt,
    incrementUsageCount
  } = useFeedbackPrompt();
  
  // Effect to open modal when shouldShowFeedback changes
  React.useEffect(() => {
    if (shouldShowFeedback) {
      setIsModalOpen(true);
    }
  }, [shouldShowFeedback]);
  
  const showFeedbackModal = () => {
    setIsModalOpen(true);
  };
  
  const hideFeedbackModal = () => {
    setIsModalOpen(false);
    closeFeedbackPrompt();
  };
  
  const handleSubmitFeedback = async (
    rating: number,
    message: string,
    displayName: string
  ) => {
    await submitFeedback(rating, message, displayName, userType);
  };
  
  return (
    <FeedbackContext.Provider
      value={{
        showFeedbackModal,
        hideFeedbackModal,
        triggerFeedback,
        recordAppUsage: incrementUsageCount
      }}
    >
      {children}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={hideFeedbackModal}
        username={username}
        userAvatar={userAvatar}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export default FeedbackProvider; 