import { Box } from '@chakra-ui/react';
import { TrainingCalendar } from '../../components/Calendar';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';

/**
 * Athlete Calendar Page
 * This page displays the training calendar specific to the athlete view
 */
export function Calendar() {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  return (
    <Box>
      <TrainingCalendar 
        isCoach={false} 
        athleteId={user?.id} 
      />
    </Box>
  );
}

export default Calendar; 