/**
 * Mock Data for Gamification Testing
 * Use this data for development and testing purposes
 */

import type { 
  PointsLedgerEntry, 
  AthleteBadge, 
  AthleteStreak,
  LeaderboardEntry 
} from '../../types/gamification';

// Mock athlete ID
export const MOCK_ATHLETE_ID = '123e4567-e89b-12d3-a456-426614174000';

// Mock points data
export const MOCK_POINTS_HISTORY: PointsLedgerEntry[] = [
  {
    id: '1',
    athlete_id: MOCK_ATHLETE_ID,
    points: 10,
    reason: 'Logged workout',
    created_at: '2023-07-01T10:30:00Z'
  },
  {
    id: '2',
    athlete_id: MOCK_ATHLETE_ID,
    points: 5,
    reason: 'Logged nutrition',
    created_at: '2023-07-02T09:15:00Z'
  },
  {
    id: '3',
    athlete_id: MOCK_ATHLETE_ID,
    points: 5,
    reason: 'Logged sleep',
    created_at: '2023-07-03T22:45:00Z'
  },
  {
    id: '4',
    athlete_id: MOCK_ATHLETE_ID,
    points: 10,
    reason: '3-day streak bonus',
    created_at: '2023-07-03T23:59:00Z'
  }
];

// Mock badges
export const MOCK_ATHLETE_BADGES: AthleteBadge[] = [
  {
    athlete_id: MOCK_ATHLETE_ID,
    badge_id: '1',
    awarded_at: '2023-07-01T10:35:00Z',
    badge: {
      id: '1',
      code: 'first_workout',
      name: 'First Workout',
      description: 'Completed your first workout',
      icon_url: '/badges/first_workout.svg',
      category: 'workout'
    }
  },
  {
    athlete_id: MOCK_ATHLETE_ID,
    badge_id: '2',
    awarded_at: '2023-07-02T09:20:00Z',
    badge: {
      id: '2',
      code: 'nutrition_novice',
      name: 'Nutrition Novice',
      description: 'Logged your first nutrition entry',
      icon_url: '/badges/nutrition_novice.svg',
      category: 'nutrition'
    }
  },
  {
    athlete_id: MOCK_ATHLETE_ID,
    badge_id: '3',
    awarded_at: '2023-07-03T22:50:00Z',
    badge: {
      id: '3',
      code: 'sleep_tracker',
      name: 'Sleep Tracker',
      description: 'Recorded your first sleep log',
      icon_url: '/badges/sleep_tracker.svg',
      category: 'sleep'
    }
  },
  {
    athlete_id: MOCK_ATHLETE_ID,
    badge_id: '4',
    awarded_at: '2023-07-03T23:59:30Z',
    badge: {
      id: '4',
      code: 'getting_started',
      name: 'Getting Started',
      description: '3-day activity streak',
      icon_url: '/badges/getting_started.svg',
      category: 'streak'
    }
  }
];

// Mock streak data
export const MOCK_STREAK: AthleteStreak = {
  athlete_id: MOCK_ATHLETE_ID,
  current_streak: 3,
  longest_streak: 3,
  last_activity_date: '2023-07-03',
  updated_at: '2023-07-03T23:59:45Z'
};

// Mock leaderboard
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    athlete_id: '9876543-abcd-1234-efgh-456789abcdef',
    first_name: 'Jane',
    last_name: 'Smith',
    avatar_url: '/avatars/jane.jpg',
    total_points: 145,
    rank: 1
  },
  {
    athlete_id: MOCK_ATHLETE_ID,
    first_name: 'John',
    last_name: 'Doe',
    avatar_url: '/avatars/john.jpg',
    total_points: 130,
    rank: 2
  },
  {
    athlete_id: '2468135-wxyz-5678-ijkl-987654321fed',
    first_name: 'Alex',
    last_name: 'Johnson',
    avatar_url: '/avatars/alex.jpg',
    total_points: 115,
    rank: 3
  },
  {
    athlete_id: '1357924-mnop-9012-qrst-567890fedcba',
    first_name: 'Taylor',
    last_name: 'Williams',
    avatar_url: '/avatars/taylor.jpg',
    total_points: 95,
    rank: 4
  },
  {
    athlete_id: '8642097-uvwx-3456-yzab-321098fedcba',
    first_name: 'Jordan',
    last_name: 'Brown',
    avatar_url: '/avatars/jordan.jpg',
    total_points: 80,
    rank: 5
  }
]; 