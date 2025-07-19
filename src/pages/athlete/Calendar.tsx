import { Box } from '@chakra-ui/react';
import { useState } from 'react';
import { TrainingCalendar } from '../../components/Calendar';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';
import { usePageHeader } from '../../hooks/usePageHeader';
import { FaCalendarAlt } from 'react-icons/fa';
import { useNavbarVisibility } from '../../components/SimplifiedNav';
import CalendarYearNavBar from '../../components/Calendar/CalendarYearNavBar';

/**
 * Athlete Calendar Page
 * This page displays the training calendar specific to the athlete view
 */
export function Calendar() {
  const { user } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { navbarVisible } = useNavbarVisibility();

  // Use page header hook
  usePageHeader({
    title: 'Calendar',
    subtitle: 'View your training schedule and upcoming events',
  });
  
  return (
    <Box>
      <PageHeader
        title="Calendar"
        subtitle="View your training schedule and upcoming events"
        icon={FaCalendarAlt}
      />
      <CalendarYearNavBar
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
        topOffset={navbarVisible ? 0 : -66}
      />
      <TrainingCalendar 
        isCoach={false} 
        athleteId={user?.id} 
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
      />
    </Box>
  );
}

export default Calendar; 