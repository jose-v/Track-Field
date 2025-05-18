/**
 * Streak Tracker Component
 * Shows an athlete's current and longest activity streak
 */

import React, { useEffect, useState } from 'react';
import { updateActivityStreak } from '../../services/gamificationService';
import { MOCK_STREAK } from './mock-data';
import type { AthleteStreak } from '../../types/gamification';

interface StreakTrackerProps {
  athleteId: string;
  useMockData?: boolean;
  onUpdateStreak?: (streak: AthleteStreak) => void;
}

export function StreakTracker({ 
  athleteId, 
  useMockData = true,
  onUpdateStreak
}: StreakTrackerProps) {
  const [streak, setStreak] = useState<AthleteStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        if (useMockData) {
          // Use mock data for development
          setStreak(MOCK_STREAK);
        } else {
          // In a real app, we would fetch the current streak from the database
          // For now, we'll just trigger a streak update
          const updatedStreak = await updateActivityStreak(athleteId);
          setStreak(updatedStreak);
          
          if (updatedStreak && onUpdateStreak) {
            onUpdateStreak(updatedStreak);
          }
        }
      } catch (error) {
        console.error('Error loading streak data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [athleteId, useMockData, onUpdateStreak]);

  if (loading) {
    return <div>Loading streak data...</div>;
  }

  if (!streak) {
    return <div>No streak data available.</div>;
  }
  
  // Calculate streak health (based on last activity date)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  const isStreakHealthy = 
    streak.last_activity_date === today ||
    streak.last_activity_date === yesterday;

  const streakTipStyle = {
    ...styles.streakTip,
    backgroundColor: isStreakHealthy ? '#d4edda' : '#f8d7da',
    color: isStreakHealthy ? '#155724' : '#721c24',
  };

  return (
    <div style={styles.streakTracker}>
      <h3>Activity Streak</h3>
      
      <div style={styles.streakDisplay}>
        <div style={styles.streakFlame}>
          <div style={isStreakHealthy ? styles.flameActive : styles.flameInactive}>
            🔥
          </div>
          <div style={styles.currentStreak}>
            {streak.current_streak}
          </div>
          <div style={styles.streakLabel}>day{streak.current_streak !== 1 ? 's' : ''}</div>
        </div>
        
        <div style={styles.streakInfo}>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Longest Streak</div>
            <div style={styles.infoValue}>{streak.longest_streak} days</div>
          </div>
          
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Last Activity</div>
            <div style={styles.infoValue}>
              {streak.last_activity_date 
                ? new Date(streak.last_activity_date).toLocaleDateString() 
                : 'Never'}
            </div>
          </div>
        </div>
      </div>
      
      <div style={streakTipStyle}>
        {isStreakHealthy 
          ? 'Your streak is active! Keep it going by logging activity daily.'
          : 'Your streak needs attention! Log an activity today to continue your streak.'}
      </div>
    </div>
  );
}

const styles = {
  streakTracker: {
    padding: '10px',
  },
  streakDisplay: {
    display: 'flex',
    alignItems: 'center' as const,
    margin: '20px 0',
  },
  streakFlame: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    marginRight: '30px',
  },
  flameBase: {
    fontSize: '48px',
    marginBottom: '5px',
    transition: 'transform 0.3s, opacity 0.3s',
  },
  flameActive: {
    fontSize: '48px',
    marginBottom: '5px',
    transition: 'transform 0.3s, opacity 0.3s',
    opacity: 1,
    transform: 'scale(1.1)',
  },
  flameInactive: {
    fontSize: '48px',
    marginBottom: '5px',
    transition: 'transform 0.3s, opacity 0.3s',
    opacity: 0.3,
    transform: 'scale(0.9)',
  },
  currentStreak: {
    fontSize: '32px',
    fontWeight: 'bold' as const,
  },
  streakLabel: {
    fontSize: '14px',
    color: '#6c757d',
  },
  streakInfo: {
    flex: 1,
  },
  infoItem: {
    marginBottom: '10px',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#6c757d',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
  },
  streakTip: {
    marginTop: '15px',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '14px',
  },
}; 