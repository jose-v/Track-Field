/**
 * Badge List Component
 * Displays all badges earned by an athlete
 */

import React, { useEffect, useState } from 'react';
import { getAthleteBadges } from '../../services/gamificationService';
import { MOCK_ATHLETE_BADGES } from './mock-data';
import type { AthleteBadge } from '../../types/gamification';
import { BadgeDetailModal } from './BadgeDetailModal';

interface BadgeListProps {
  athleteId: string;
  useMockData?: boolean;
}

export function BadgeList({ athleteId, useMockData = true }: BadgeListProps) {
  const [badges, setBadges] = useState<AthleteBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<AthleteBadge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        if (useMockData) {
          // Use mock data for development
          setBadges(MOCK_ATHLETE_BADGES);
        } else {
          // Use real data from service
          const athleteBadges = await getAthleteBadges(athleteId);
          setBadges(athleteBadges);
        }
      } catch (error) {
        console.error('Error loading badges data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [athleteId, useMockData]);

  const handleBadgeClick = (badge: AthleteBadge) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return <div>Loading badges...</div>;
  }

  if (badges.length === 0) {
    return <div style={styles.noBadges}>No badges earned yet. Keep going!</div>;
  }

  // Group badges by category
  const badgesByCategory: Record<string, AthleteBadge[]> = badges.reduce((acc, badge) => {
    const category = badge.badge?.category || 'unknown';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(badge);
    return acc;
  }, {} as Record<string, AthleteBadge[]>);

  // Function to format category name
  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div style={styles.badgesContainer}>
      <h3>Earned Badges</h3>
      
      {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
        <div key={category} style={styles.categorySection}>
          <h4>{formatCategory(category)} Badges</h4>
          <div style={styles.badgesGrid}>
            {categoryBadges.map((badge) => (
              <div 
                key={badge.badge_id} 
                style={styles.badgeItem}
                onClick={() => handleBadgeClick(badge)}
              >
                {badge.badge?.icon_url ? (
                  <img 
                    src={badge.badge.icon_url} 
                    alt={badge.badge.name}
                    style={styles.badgeIcon}
                  />
                ) : (
                  <div style={styles.badgePlaceholder}>{badge.badge?.name.charAt(0)}</div>
                )}
                <div style={styles.badgeName}>{badge.badge?.name}</div>
                <div style={styles.badgeDescription}>{badge.badge?.description}</div>
                <div style={styles.badgeDate}>
                  {new Date(badge.awarded_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <BadgeDetailModal 
        badge={selectedBadge}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

const styles = {
  badgesContainer: {
    padding: '10px',
  },
  noBadges: {
    textAlign: 'center' as const,
    padding: '20px',
    color: '#6c757d',
  },
  categorySection: {
    marginBottom: '20px',
  },
  badgesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '15px',
    marginTop: '10px',
  },
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
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
    }
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