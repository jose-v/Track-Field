import { Box } from '@chakra-ui/react';
import { TrainingCalendar } from '../../components/Calendar';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';
import { usePageHeader } from '../../hooks/usePageHeader';
import { FaCalendarAlt } from 'react-icons/fa';

/**
 * Athlete Calendar Page
 * This page displays the training calendar specific to the athlete view
 */
export function Calendar() {
  const { user } = useAuth();
  
  // Use page header hook
  usePageHeader({
    title: 'Calendar',
    subtitle: 'View your training schedule and upcoming events',
    icon: FaCalendarAlt
  });
  
  return (
    <Box>
      {/* Desktop Header */}
      <PageHeader
        title="Calendar"
        subtitle="View your training schedule and upcoming events"
        icon={FaCalendarAlt}
      />
      
      <TrainingCalendar 
        isCoach={false} 
        athleteId={user?.id} 
      />
    </Box>
  );
}

export default Calendar; 