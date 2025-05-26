import React from 'react';
import type { AthleteBadge } from '../../types/gamification';

interface BadgeCardProps {
  badge: AthleteBadge;
  onClick?: (badge: AthleteBadge) => void;
}

/**
 * Displays a single badge card with image, name, and date awarded
 * This is a simple component without hooks for easier testing
 */
export function BadgeCard({ badge, onClick }: BadgeCardProps) {
  // Format date for display
  const formattedDate = badge.awarded_at 
    ? new Date(badge.awarded_at).toLocaleDateString()
    : 'Unknown date';

  const handleClick = () => {
    if (onClick) {
      onClick(badge);
    }
  };

  return (
    <div 
      data-testid="badge-card"
      style={styles.badgeItem}
      onClick={handleClick}
    >
      {badge.badge?.icon_url ? (
        <img 
          src={badge.badge.icon_url} 
          alt={badge.badge?.name || 'Badge'} 
          style={styles.badgeIcon}
          data-testid="badge-icon"
        />
      ) : (
        <div 
          style={styles.badgePlaceholder}
          data-testid="badge-placeholder"
        >
          {badge.badge?.name?.charAt(0) || '?'}
        </div>
      )}
      <div 
        style={styles.badgeName}
        data-testid="badge-name"
      >
        {badge.badge?.name || 'Unknown Badge'}
      </div>
      {badge.badge?.description && (
        <div 
          style={styles.badgeDescription}
          data-testid="badge-description"
        >
          {badge.badge.description}
        </div>
      )}
      <div 
        style={styles.badgeDate}
        data-testid="badge-date"
      >
        {formattedDate}
      </div>
    </div>
  );
}

const styles = {
  badgeItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    transition: 'transform 0.2s',
    textAlign: 'center' as const,
    cursor: 'pointer',
    maxWidth: '150px',
    margin: '0 auto',
  },
  badgeIcon: {
    width: '64px',
    height: '64px',
    marginBottom: '10px',
  },
  badgePlaceholder: {
    width: '64px',
    height: '64px',
    backgroundColor: '#6c757d',
    color: 'white',
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: '24px',
    fontWeight: 'bold' as const,
    borderRadius: '50%',
    marginBottom: '10px',
  },
  badgeName: {
    fontWeight: 'bold' as const,
    marginBottom: '5px',
  },
  badgeDescription: {
    fontSize: '12px',
    color: '#6c757d',
    marginBottom: '5px',
  },
  badgeDate: {
    fontSize: '11px',
    color: '#adb5bd',
  }
}; 