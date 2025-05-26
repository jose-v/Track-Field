import { useState, useEffect, useCallback } from 'react';

type FeedbackTrigger = 
  | 'first_success' 
  | 'periodic_usage' 
  | 'post_support' 
  | 'major_update';

interface FeedbackPromptConfig {
  // Show feedback prompt after initial success (onboarding, first transaction, etc.)
  promptAfterFirstSuccess?: boolean;
  // Show feedback prompt after N uses of the app
  promptAfterUsageCount?: number;
  // Show feedback after support ticket is closed or training
  promptAfterSupport?: boolean;
  // Show feedback after a major feature update
  promptAfterMajorUpdate?: boolean;
  // Maximum feedback prompts per quarter (3 months)
  maxPromptsPerQuarter?: number;
}

const defaultConfig: FeedbackPromptConfig = {
  promptAfterFirstSuccess: true,
  promptAfterUsageCount: 15, // Once every ~15 uses
  promptAfterSupport: true,
  promptAfterMajorUpdate: true,
  maxPromptsPerQuarter: 2, // Max 2 prompts per quarter
};

export const useFeedbackPrompt = (config: FeedbackPromptConfig = defaultConfig) => {
  const [shouldShowFeedback, setShouldShowFeedback] = useState(false);

  // Load state from localStorage
  useEffect(() => {
    const feedbackState = localStorage.getItem('feedbackState');
    if (feedbackState) {
      // We don't immediately set shouldShowFeedback here
      // We'll wait for a trigger to actually prompt
    }
  }, []);

  const saveFeedbackState = useCallback((state: any) => {
    localStorage.setItem('feedbackState', JSON.stringify(state));
  }, []);

  const getFeedbackState = useCallback(() => {
    const state = localStorage.getItem('feedbackState');
    if (!state) {
      // Initialize with default state
      const initialState = {
        lastPromptDate: null,
        promptsThisQuarter: 0,
        appUsageCount: 0,
        hasCompletedFirstSuccess: false,
        lastMajorUpdatePrompt: null,
        lastSupportPrompt: null,
      };
      saveFeedbackState(initialState);
      return initialState;
    }
    return JSON.parse(state);
  }, [saveFeedbackState]);

  const incrementUsageCount = useCallback(() => {
    const state = getFeedbackState();
    state.appUsageCount += 1;

    // Check if we should prompt based on usage count
    if (
      config.promptAfterUsageCount &&
      state.appUsageCount % config.promptAfterUsageCount === 0 &&
      canPromptBasedOnQuota()
    ) {
      setShouldShowFeedback(true);
    }

    saveFeedbackState(state);
  }, [config.promptAfterUsageCount, getFeedbackState, saveFeedbackState]);

  const canPromptBasedOnQuota = useCallback(() => {
    const state = getFeedbackState();
    
    // Check if we've reached our quarterly quota
    if (state.promptsThisQuarter >= (config.maxPromptsPerQuarter || defaultConfig.maxPromptsPerQuarter!)) {
      // Check if it's a new quarter
      const lastPromptDate = state.lastPromptDate ? new Date(state.lastPromptDate) : null;
      if (lastPromptDate) {
        const now = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        
        if (lastPromptDate < threeMonthsAgo) {
          // It's been more than 3 months, reset quota
          state.promptsThisQuarter = 0;
          saveFeedbackState(state);
          return true;
        }
        return false;
      }
    }
    
    return true;
  }, [config.maxPromptsPerQuarter, getFeedbackState, saveFeedbackState]);

  const triggerFeedback = useCallback((trigger: FeedbackTrigger) => {
    if (!canPromptBasedOnQuota()) {
      return false;
    }

    const state = getFeedbackState();
    
    switch(trigger) {
      case 'first_success':
        if (config.promptAfterFirstSuccess && !state.hasCompletedFirstSuccess) {
          state.hasCompletedFirstSuccess = true;
          setShouldShowFeedback(true);
        }
        break;
      case 'post_support':
        if (config.promptAfterSupport) {
          const now = new Date();
          state.lastSupportPrompt = now.toISOString();
          setShouldShowFeedback(true);
        }
        break;
      case 'major_update':
        if (config.promptAfterMajorUpdate) {
          const now = new Date();
          state.lastMajorUpdatePrompt = now.toISOString();
          setShouldShowFeedback(true);
        }
        break;
      case 'periodic_usage':
        // This is handled in incrementUsageCount
        break;
    }

    saveFeedbackState(state);
    return shouldShowFeedback;
  }, [
    canPromptBasedOnQuota,
    config.promptAfterFirstSuccess,
    config.promptAfterMajorUpdate,
    config.promptAfterSupport,
    getFeedbackState,
    saveFeedbackState,
    shouldShowFeedback
  ]);

  const recordFeedbackPrompt = useCallback(() => {
    const state = getFeedbackState();
    const now = new Date();
    
    state.lastPromptDate = now.toISOString();
    state.promptsThisQuarter += 1;
    
    saveFeedbackState(state);
  }, [getFeedbackState, saveFeedbackState]);

  const closeFeedbackPrompt = useCallback(() => {
    setShouldShowFeedback(false);
    recordFeedbackPrompt();
  }, [recordFeedbackPrompt]);

  return {
    shouldShowFeedback,
    triggerFeedback,
    closeFeedbackPrompt,
    incrementUsageCount
  };
};

export default useFeedbackPrompt; 