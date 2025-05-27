/**
 * Level System Configuration
 * Defines level thresholds and titles, plus a utility function to calculate level based on points
 */

export interface Level {
  level: number;
  min_points: number;
  max_points: number;
  title: string;
}

export const LEVELS: Level[] = [
  { level: 1, min_points: 0, max_points: 99, title: "Beginner" },
  { level: 2, min_points: 100, max_points: 249, title: "Rookie" },
  { level: 3, min_points: 250, max_points: 499, title: "Competitor" },
  { level: 4, min_points: 500, max_points: 999, title: "Elite" },
  { level: 5, min_points: 1000, max_points: 1999, title: "Champion" },
  { level: 6, min_points: 2000, max_points: 4999, title: "Master" },
  { level: 7, min_points: 5000, max_points: Infinity, title: "Legend" }
];

/**
 * Calculate level and progress information based on points
 */
export function calculateLevel(points: number): {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number | null;
  progress: number;
} {
  const level = LEVELS.find(l => points >= l.min_points && points <= l.max_points) || LEVELS[LEVELS.length - 1];
  const nextLevel = LEVELS.find(l => l.level === level.level + 1);
  
  return {
    level: level.level,
    title: level.title,
    currentPoints: points,
    nextLevelPoints: nextLevel ? nextLevel.min_points : null,
    progress: nextLevel ? (points - level.min_points) / (nextLevel.min_points - level.min_points) * 100 : 100
  };
} 