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
 * Coach Calendar Page
 * This page displays the training calendar specific to the coach view
 */
export function Calendar() {
  const { user } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const { navbarVisible } = useNavbarVisibility();

  // Use page header hook for mobile nav (no icon as requested)
  usePageHeader({
    title: 'Calendar',
    subtitle: 'Manage training schedules and team events'
  });
  
  return (
    <Box>
      <PageHeader
        title="Calendar"
        subtitle="Manage training schedules and team events"
        icon={FaCalendarAlt}
      />
      <CalendarYearNavBar
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
        topOffset={navbarVisible ? 0 : -66}
      />
      <TrainingCalendar 
        isCoach={true}
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
      />
    </Box>
  );
}

export default Calendar; 