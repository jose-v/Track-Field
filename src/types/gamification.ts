/**
 * Gamification System Types
 * Contains all type definitions for the gamification system
 */

export interface PointsLedgerEntry {
  id: string;
  athlete_id: string;
  points: number;
  reason: string;
  created_at: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon_url: string | null;
  category: 'workout' | 'nutrition' | 'sleep' | 'streak' | 'points' | 'special';
}

export interface AthleteBadge {
  athlete_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge; // Joined from badges table
}

export interface AthleteStreak {
  athlete_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

export interface LeaderboardEntry {
  athlete_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  total_points: number;
  rank: number;
} 