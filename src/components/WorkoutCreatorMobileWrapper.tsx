import React from 'react';
import { useBreakpointValue, useMediaQuery } from '@chakra-ui/react';
import { MobileWorkoutCreatorRestriction } from './MobileWorkoutCreatorRestriction';

interface WorkoutCreatorMobileWrapperProps {
  children: React.ReactNode;
}

export const WorkoutCreatorMobileWrapper: React.FC<WorkoutCreatorMobileWrapperProps> = ({ 
  children 
}) => {
  // Multiple mobile detection methods for reliability
  const isMobileBreakpoint = useBreakpointValue({ base: true, lg: false });
  const [isMobileMediaQuery] = useMediaQuery("(max-width: 991px)");
  
  // Use either method to detect mobile
  const isMobile = isMobileBreakpoint || isMobileMediaQuery;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Mobile Detection:', {
      isMobileBreakpoint,
      isMobileMediaQuery,
      isMobile,
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'unknown'
    });
  }

  // Show restriction page on mobile, otherwise show the workout creator
  if (isMobile) {
    return <MobileWorkoutCreatorRestriction />;
  }

  return <>{children}</>;
}; 