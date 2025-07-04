import React from 'react';
import { useProfile } from '../hooks/useProfile';
import { AthleteLayout } from '../components/AthleteLayout';
import { CoachLayout } from '../components/CoachLayout';
import { TeamManagerLayout } from '../components/TeamManagerLayout';
import { Layout as GeneralLayout } from '../components/Layout';
import { FeedbackProvider } from '../components/FeedbackProvider';

interface DynamicLayoutWithFeedbackProps {
  children: React.ReactNode;
}

const DynamicLayoutWithFeedback: React.FC<DynamicLayoutWithFeedbackProps> = ({ children }) => {
  const { profile, isLoading } = useProfile();

  // Don't show loading spinner here - let RoleDashboardRouter handle initial loading
  // This component just handles layout selection once profile is available
  const userRole = profile?.role;

  const LayoutComponent = () => {
    switch (userRole) {
      case 'athlete':
        return <AthleteLayout>{children}</AthleteLayout>;
      case 'coach':
        return <CoachLayout>{children}</CoachLayout>;
      case 'team_manager':
        return <TeamManagerLayout>{children}</TeamManagerLayout>;
      default:
        return <GeneralLayout>{children}</GeneralLayout>;
    }
  };

  return (
    <FeedbackProvider>
      <LayoutComponent />
    </FeedbackProvider>
  );
};

export default DynamicLayoutWithFeedback; 