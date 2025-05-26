/**
 * Leaderboard Component
 * Shows the top athletes based on total points
 */

import React, { useEffect, useState } from 'react';
import { getLeaderboard, getTeamLeaderboard } from '../../services/gamificationService';
import { MOCK_LEADERBOARD } from './mock-data';
import type { LeaderboardEntry } from '../../types/gamification';
import { useProfile } from '../../hooks/useProfile';

interface LeaderboardProps {
  athleteId?: string; // Current athlete ID to highlight
  limit?: number;     // Number of athletes to show
  useMockData?: boolean;
}

export function Leaderboard({ 
  athleteId, 
  limit = 10, 
  useMockData = true 
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeamOnly, setShowTeamOnly] = useState(false);
  const { profile, isLoading: profileLoading } = useProfile();

  const toggleView = () => {
    setShowTeamOnly(!showTeamOnly);
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        if (useMockData) {
          // Use mock data for development
          // For team view, just filter the mock data to simulate team members
          if (showTeamOnly) {
            // Simulate team filtering by keeping only a subset of entries
            setLeaderboard(MOCK_LEADERBOARD.slice(0, 3));
          } else {
            setLeaderboard(MOCK_LEADERBOARD);
          }
        } else {
          // Use real data from service
          if (showTeamOnly && profile?.team) {
            const teamData = await getTeamLeaderboard(profile.team, limit);
            setLeaderboard(teamData);
          } else {
            const data = await getLeaderboard(limit);
            setLeaderboard(data);
          }
        }
      } catch (error) {
        console.error('Error loading leaderboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [limit, useMockData, showTeamOnly, profile?.team]);

  if (loading || profileLoading) {
    return <div>Loading leaderboard...</div>;
  }

  if (leaderboard.length === 0) {
    return (
      <div style={styles.leaderboard}>
        <div style={styles.header}>
          <h3>Points Leaderboard</h3>
          {profile?.team && (
            <div style={styles.toggleContainer}>
              <button 
                style={{
                  ...styles.toggleButton,
                  backgroundColor: !showTeamOnly ? '#4299e1' : 'transparent',
                  color: !showTeamOnly ? 'white' : '#4299e1'
                }}
                onClick={toggleView}
              >
                Global
              </button>
              <button 
                style={{
                  ...styles.toggleButton,
                  backgroundColor: showTeamOnly ? '#4299e1' : 'transparent',
                  color: showTeamOnly ? 'white' : '#4299e1'
                }}
                onClick={toggleView}
              >
                {profile.team}
              </button>
            </div>
          )}
        </div>
        <div style={styles.emptyState}>
          {showTeamOnly 
            ? `No leaderboard data available for team ${profile?.team}.`
            : 'No leaderboard data available.'}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.leaderboard}>
      <div style={styles.header}>
        <h3>Points Leaderboard</h3>
        {profile?.team && (
          <div style={styles.toggleContainer}>
            <button 
              style={{
                ...styles.toggleButton,
                backgroundColor: !showTeamOnly ? '#4299e1' : 'transparent',
                color: !showTeamOnly ? 'white' : '#4299e1'
              }}
              onClick={toggleView}
            >
              Global
            </button>
            <button 
              style={{
                ...styles.toggleButton,
                backgroundColor: showTeamOnly ? '#4299e1' : 'transparent',
                color: showTeamOnly ? 'white' : '#4299e1'
              }}
              onClick={toggleView}
            >
              {profile.team}
            </button>
          </div>
        )}
      </div>
      
      <div style={styles.leaderboardTable}>
        <div style={styles.leaderboardHeader}>
          <div style={styles.rank}>Rank</div>
          <div style={styles.athlete}>Athlete</div>
          <div style={styles.points}>Points</div>
        </div>
        
        {leaderboard.map((entry) => {
          const rowStyle = entry.athlete_id === athleteId
            ? { ...styles.leaderboardRow, ...styles.currentAthlete }
            : styles.leaderboardRow;
          
          return (
            <div 
              key={entry.athlete_id}
              style={rowStyle}
            >
              <div style={styles.rank}>
                {entry.rank <= 3 ? (
                  <span style={styles.trophy}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  `#${entry.rank}`
                )}
              </div>
              
              <div style={styles.athlete}>
                <div style={styles.avatar}>
                  {entry.avatar_url ? (
                    <img 
                      src={entry.avatar_url} 
                      alt={`${entry.first_name}'s avatar`}
                      style={styles.avatarImg}
                    />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {entry.first_name.charAt(0)}
                      {entry.last_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div style={styles.name}>
                  {entry.first_name} {entry.last_name}
                  {entry.athlete_id === athleteId && (
                    <span style={styles.youLabel}>(You)</span>
                  )}
                </div>
              </div>
              
              <div style={styles.points}>{entry.total_points}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  leaderboard: {
    padding: '10px',
  },
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '10px',
  },
  toggleContainer: {
    display: 'flex' as const,
    border: '1px solid #4299e1',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  toggleButton: {
    padding: '5px 10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    transition: 'background-color 0.2s',
  },
  emptyState: {
    padding: '20px',
    textAlign: 'center' as const,
    color: '#718096',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginTop: '10px',
  },
  leaderboardTable: {
    marginTop: '15px',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  leaderboardHeader: {
    display: 'flex',
    padding: '12px 15px',
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold' as const,
    borderBottom: '1px solid #dee2e6',
  },
  leaderboardRow: {
    display: 'flex',
    padding: '10px 15px',
    borderBottom: '1px solid #f1f1f1',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f8f9fa',
    },
  },
  currentAthlete: {
    backgroundColor: '#e8f4ff',
  },
  rank: {
    width: '60px',
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'bold' as const,
  },
  trophy: {
    fontSize: '20px',
  },
  athlete: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  avatar: {
    width: '32px',
    height: '32px',
    marginRight: '10px',
    borderRadius: '50%',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#6c757d',
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: '14px',
  },
  name: {
    display: 'flex',
    alignItems: 'center',
  },
  youLabel: {
    marginLeft: '5px',
    fontSize: '12px',
    color: '#6c757d',
    fontStyle: 'italic' as const,
  },
  points: {
    width: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    fontWeight: 'bold' as const,
    color: '#28a745',
  },
}; 