/**
 * Gamification Test Page
 * A simple page for testing and visualizing gamification components
 */

import React, { useState } from 'react';
import { 
  PointsDisplay, 
  BadgeList, 
  StreakTracker, 
  Leaderboard 
} from './index';
import { MOCK_ATHLETE_ID } from './mock-data';
import { resetAthleteGamification, awardPoints } from '../../services/gamificationService';

/**
 * Test utility page for visualizing gamification components
 * This is only used during development
 */
export function GamificationTestPage() {
  // Use mock athlete ID for testing
  const testAthleteId = MOCK_ATHLETE_ID;
  const [useMockData, setUseMockData] = useState(true);
  const [pointsAmount, setPointsAmount] = useState(10);
  const [pointsReason, setPointsReason] = useState('Test points');
  
  // Function to handle awarding test points
  const handleAwardPoints = async () => {
    if (useMockData) {
      alert('Switch to real data mode to award points');
      return;
    }
    
    try {
      const result = await awardPoints(testAthleteId, pointsAmount, pointsReason);
      if (result) {
        alert(`Successfully awarded ${pointsAmount} points`);
      } else {
        alert('Failed to award points');
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      alert('Error awarding points');
    }
  };
  
  // Function to reset gamification data
  const handleResetData = async () => {
    if (useMockData) {
      alert('Switch to real data mode to reset data');
      return;
    }
    
    if (window.confirm('Are you sure you want to reset all gamification data for this athlete?')) {
      try {
        const result = await resetAthleteGamification(testAthleteId);
        if (result) {
          alert('Successfully reset gamification data');
          // Refresh the page to see the changes
          window.location.reload();
        } else {
          alert('Failed to reset data');
        }
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('Error resetting data');
      }
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Gamification Components Test Page</h1>
      <p>This page is for testing and visualizing gamification components during development.</p>
      
      <div style={{ 
        margin: '20px 0', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px' 
      }}>
        <h3>Test Controls</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ marginRight: '10px' }}>
            <input 
              type="checkbox" 
              checked={useMockData} 
              onChange={() => setUseMockData(!useMockData)} 
            />
            Use mock data
          </label>
          <span style={{ color: '#6c757d', fontSize: '14px' }}>
            {useMockData 
              ? '(Using static mock data for development)' 
              : '(Using real data from the database)'
            }
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input 
            type="number" 
            value={pointsAmount} 
            onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
            min="1"
            style={{ width: '80px' }}
            disabled={useMockData}
          />
          <input 
            type="text" 
            value={pointsReason} 
            onChange={(e) => setPointsReason(e.target.value)}
            placeholder="Reason for points"
            style={{ flex: 1 }}
            disabled={useMockData}
          />
          <button 
            onClick={handleAwardPoints}
            disabled={useMockData}
            style={{ 
              padding: '8px 16px',
              backgroundColor: useMockData ? '#e9ecef' : '#007bff',
              color: useMockData ? '#6c757d' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: useMockData ? 'not-allowed' : 'pointer'
            }}
          >
            Award Points
          </button>
        </div>
        
        <button 
          onClick={handleResetData}
          disabled={useMockData}
          style={{ 
            padding: '8px 16px',
            backgroundColor: useMockData ? '#e9ecef' : '#dc3545',
            color: useMockData ? '#6c757d' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: useMockData ? 'not-allowed' : 'pointer'
          }}
        >
          Reset Gamification Data
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h2>Points Display</h2>
          <PointsDisplay athleteId={testAthleteId} useMockData={useMockData} />
        </div>
        
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h2>Streak Tracker</h2>
          <StreakTracker athleteId={testAthleteId} useMockData={useMockData} />
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h2>Badge List</h2>
        <BadgeList athleteId={testAthleteId} useMockData={useMockData} />
      </div>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h2>Leaderboard</h2>
        <Leaderboard athleteId={testAthleteId} useMockData={useMockData} />
      </div>
    </div>
  );
} 