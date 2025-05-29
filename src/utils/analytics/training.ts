// Training Analytics Utilities
// Works with pre-calculated metrics from Supabase scheduled functions

import { TrainingLoadData } from './types';

/**
 * Calculate session RPE (Rate of Perceived Exertion) training load
 * This is calculated in real-time when athlete logs workout
 */
export function calculateSessionRPE(rpe: number, duration: number): number {
  if (rpe < 1 || rpe > 10 || duration < 0) {
    throw new Error('Invalid input: RPE must be 1-10, duration must be positive');
  }
  return rpe * duration;
}

/**
 * Calculate training monotony (for advanced analytics)
 * Monotony = Mean Training Load / Standard Deviation of Training Load
 */
export function calculateTrainingMonotony(loads: number[]): number {
  if (loads.length < 2) return 0;
  
  const mean = loads.reduce((sum, load) => sum + load, 0) / loads.length;
  const variance = loads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / loads.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev > 0 ? mean / stdDev : 0;
}

/**
 * Calculate training strain (Monotony × Total Load)
 */
export function calculateTrainingStrain(monotony: number, totalLoad: number): number {
  return monotony * totalLoad;
}

/**
 * Determine training load category
 */
export function getTrainingLoadCategory(load: number): {
  category: 'very-light' | 'light' | 'moderate' | 'hard' | 'very-hard';
  color: string;
  description: string;
} {
  if (load < 150) {
    return {
      category: 'very-light',
      color: '#E6FFFA',
      description: 'Very light training session'
    };
  } else if (load < 300) {
    return {
      category: 'light',
      color: '#B2F5EA',
      description: 'Light training session'
    };
  } else if (load < 450) {
    return {
      category: 'moderate',
      color: '#4FD1C7',
      description: 'Moderate training session'
    };
  } else if (load < 600) {
    return {
      category: 'hard',
      color: '#F6AD55',
      description: 'Hard training session'
    };
  } else {
    return {
      category: 'very-hard',
      color: '#FC8181',
      description: 'Very hard training session'
    };
  }
}

/**
 * Calculate weekly training distribution
 */
export function calculateWeeklyDistribution(loads: TrainingLoadData[]): {
  totalLoad: number;
  averageLoad: number;
  sessionCount: number;
  distribution: Record<string, number>;
} {
  const totalLoad = loads.reduce((sum, data) => sum + data.load, 0);
  const sessionCount = loads.length;
  const averageLoad = sessionCount > 0 ? totalLoad / sessionCount : 0;
  
  const distribution: Record<string, number> = {};
  loads.forEach(data => {
    const category = getTrainingLoadCategory(data.load).category;
    distribution[category] = (distribution[category] || 0) + 1;
  });
  
  return {
    totalLoad,
    averageLoad: Number(averageLoad.toFixed(1)),
    sessionCount,
    distribution
  };
}

/**
 * Validate RPE input with user-friendly messages
 */
export function validateRPE(rpe: number): { isValid: boolean; message?: string } {
  if (!rpe || rpe < 1 || rpe > 10) {
    return {
      isValid: false,
      message: 'RPE must be between 1 (very easy) and 10 (maximal effort)'
    };
  }
  return { isValid: true };
}

/**
 * Get RPE description for user guidance
 */
export function getRPEDescription(rpe: number): string {
  const descriptions: Record<number, string> = {
    1: 'Very Easy - Minimal effort',
    2: 'Easy - Light effort',
    3: 'Moderate - Some effort',
    4: 'Somewhat Hard - Noticeable effort',
    5: 'Hard - Strong effort',
    6: 'Very Hard - Heavy effort',
    7: 'Very Hard+ - Very heavy effort',
    8: 'Extremely Hard - Maximal sustainable effort',
    9: 'Extremely Hard+ - Near maximal effort',
    10: 'Maximal - Absolute maximum effort'
  };
  
  return descriptions[rpe] || 'Unknown';
} 