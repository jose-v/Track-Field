import React from 'react';
import { BaseLayout } from './layout/BaseLayout';
import { useCoachNavigation } from './layout/CoachNavigation';

export function CoachLayout({ children }: { children: React.ReactNode }) {
  // Get coach navigation configuration
  const coachNav = useCoachNavigation();
  
  return (
    <BaseLayout
      children={children}
      navLinks={coachNav.navLinks}
      roleTitle={coachNav.roleTitle}
      roleBadge={coachNav.roleBadge}
      dashboardPath={coachNav.dashboardPath}
      notificationsPath={coachNav.notificationsPath}
      storageKey={coachNav.storageKey}
      shareTitle={coachNav.shareTitle}
      shareDescription={coachNav.shareDescription}
      isCurrentPathActive={coachNav.isCurrentPathActive}
    />
  );
} 