/**
 * Points Display Component
 * Shows an athlete's points total and level
 */

import React, { useEffect, useState } from 'react';
import { getAthletePoints, getAthleteLevel } from '../../services/gamificationService';
import { MOCK_POINTS_HISTORY } from './mock-data';

interface PointsDisplayProps {
  athleteId: string;
  useMockData?: boolean;
}

interface LevelState {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number | null;
  progress: number;
}

export function PointsDisplay({ athleteId, useMockData = true }: PointsDisplayProps) {
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState<LevelState>({
    level: 1,
    title: 'Beginner',
    currentPoints: 0,
    nextLevelPoints: 100,
    progress: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        if (useMockData) {
          // Use mock data for development
          const mockPoints = MOCK_POINTS_HISTORY.reduce((total, entry) => total + entry.points, 0);
          setPoints(mockPoints);
          
          // Calculate level from config/levels.ts
          const { calculateLevel } = require('../../config/levels');
          setLevel(calculateLevel(mockPoints));
        } else {
          // Use real data from service
          const totalPoints = await getAthletePoints(athleteId);
          setPoints(totalPoints);
          
          const levelInfo = await getAthleteLevel(athleteId);
          setLevel(levelInfo);
        }
      } catch (error) {
        console.error('Error loading points data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [athleteId, useMockData]);

  if (loading) {
    return <div>Loading points data...</div>;
  }

  const styles = {
    pointsDisplay: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },
    pointsContainer: {
      textAlign: 'center' as const,
    },
    pointsValue: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#007bff',
    },
    levelContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '10px',
    },
    progressContainer: {
      height: '10px',
      backgroundColor: '#e9ecef',
      borderRadius: '5px',
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#28a745',
      transition: 'width 0.5s ease',
      width: `${level.progress}%`,
    },
    levelText: {
      fontSize: '14px',
      color: '#6c757d',
      textAlign: 'center' as const,
    },
  };

  return (
    <div style={styles.pointsDisplay}>
      <div style={styles.pointsContainer}>
        <h3>Total Points</h3>
        <div style={styles.pointsValue}>{points}</div>
      </div>
      
      <div style={styles.levelContainer}>
        <h3>Level {level.level}: {level.title}</h3>
        <div style={styles.progressContainer}>
          <div style={styles.progressBar} />
        </div>
        <div style={styles.levelText}>
          {level.nextLevelPoints 
            ? `${level.currentPoints} / ${level.nextLevelPoints} points to next level`
            : 'Maximum level reached!'
          }
        </div>
      </div>
    </div>
  );
} 