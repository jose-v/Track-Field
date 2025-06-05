import { Box } from '@chakra-ui/react';
import { TrainingCalendar } from '../../components/Calendar';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Coach Calendar Page
 * This page displays the training calendar specific to the coach view
 */
export function Calendar() {
  const { user } = useAuth();
  
  return (
    <Box>
      <TrainingCalendar 
        isCoach={true}
      />
    </Box>
  );
}

export default Calendar; 