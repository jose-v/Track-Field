import React from 'react';
import { useMediaQuery, Box } from '@chakra-ui/react';
import { MobileWorkoutCreatorRestriction } from './MobileWorkoutCreatorRestriction';

interface WorkoutCreatorMobileWrapperProps {
  children: React.ReactNode;
}

export const WorkoutCreatorMobileWrapper: React.FC<WorkoutCreatorMobileWrapperProps> = ({ 
  children 
}) => {
  const [isClient, setIsClient] = React.useState(false);
  const [isMobileMediaQuery] = useMediaQuery("(max-width: 991px)");
  
  // Ensure we're on the client side before showing any content
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return (
      <Box 
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="gray.900"
        display="flex" 
        alignItems="center"
        justifyContent="center"
      />
    );
  }
  
  // Use media query only after client-side hydration
  const isMobile = isMobileMediaQuery;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Mobile Detection:', {
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