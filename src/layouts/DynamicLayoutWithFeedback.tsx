import React from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { AthleteLayout } from '../components/AthleteLayout';
import { CoachLayout } from '../components/CoachLayout';
import { TeamManagerLayout } from '../components/TeamManagerLayout';
import { Layout as GeneralLayout } from '../components/Layout';
import { FeedbackProvider } from '../components/FeedbackProvider';
import { Spinner, Center } from '@chakra-ui/react';

interface DynamicLayoutWithFeedbackProps {
  children: React.ReactNode;
}

const DynamicLayoutWithFeedback: React.FC<DynamicLayoutWithFeedbackProps> = ({ children }) => {
  const { userRole, loading } = useUserRole();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

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