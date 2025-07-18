import { useBreakpointValue, useMediaQuery } from '@chakra-ui/react';
import { MobileCalendar } from './MobileCalendar';
import { TrainingCalendarInner } from './TrainingCalendarInner';

interface TrainingCalendarProps {
  isCoach?: boolean;
  athleteId?: string;
  currentYear?: number;
  setCurrentYear?: (year: number) => void;
  navbarVisible?: boolean;
}

export const TrainingCalendar = (props: TrainingCalendarProps) => {
  const isMobileBreakpoint = useBreakpointValue({ base: true, lg: false });
  const [isMobileMediaQuery] = useMediaQuery("(max-width: 991px)");
  const isMobile = isMobileBreakpoint || isMobileMediaQuery;

  if (isMobile) {
    return <MobileCalendar {...props} />;
  }
  return <TrainingCalendarInner {...props} />;
};

export default TrainingCalendar; 