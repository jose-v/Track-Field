import React from 'react';
import { BaseLayout } from './layout/BaseLayout';
import { useAthleteNavigation } from './layout/AthleteNavigation';

export function AthleteLayout({ children }: { children: React.ReactNode }) {
  // Get athlete navigation configuration
  const athleteNav = useAthleteNavigation();
  
  return (
    <BaseLayout
      children={children}
      navLinks={athleteNav.navLinks}
      roleTitle={athleteNav.roleTitle}
      roleBadge={athleteNav.roleBadge}
      dashboardPath={athleteNav.dashboardPath}
      notificationsPath={athleteNav.notificationsPath}
      storageKey={athleteNav.storageKey}
      shareTitle={athleteNav.shareTitle}
      shareDescription={athleteNav.shareDescription}
      isCurrentPathActive={athleteNav.isCurrentPathActive}
    />
  );
} 