import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PointsDisplay } from '../../features/gamification/PointsDisplay';
import React from 'react';

// Mock the necessary dependencies
vi.mock('../../features/gamification/mock-data', () => ({
  MOCK_POINTS_HISTORY: [
    { id: '1', athlete_id: 'test-123', points: 50, reason: 'First Login', timestamp: '2023-01-01' },
    { id: '2', athlete_id: 'test-123', points: 100, reason: 'Workout Completed', timestamp: '2023-01-02' },
  ]
}));

vi.mock('../../services/gamificationService', () => ({
  getAthletePoints: vi.fn(() => Promise.resolve(150)),
  getAthleteLevel: vi.fn(() => Promise.resolve(2))
}));

vi.mock('../../config/levels', () => ({
  calculateLevel: vi.fn((points) => ({
    level: 2,
    title: 'Rookie',
    currentPoints: points || 150,
    nextLevelPoints: 250,
    progress: 50
  }))
}));

describe('PointsDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders the points display component', () => {
    render(<PointsDisplay athleteId="test-123" useMockData={true} />);
    
    // Test that the component renders the basic structure
    expect(screen.getByText('Total Points')).toBeInTheDocument();
  });
}); 