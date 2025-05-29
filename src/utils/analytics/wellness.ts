// Wellness Analytics Utilities
// Process daily wellness surveys and calculate wellness scores

import { WellnessMetrics } from './types';

/**
 * Calculate overall wellness score from individual metrics
 * Uses weighted average based on research importance
 */
export function calculateWellnessScore(metrics: WellnessMetrics): number {
  const weights = {
    fatigue: 0.25,        // High impact on performance
    soreness: 0.20,       // Important for injury risk
    stress: 0.20,         // Affects recovery and performance
    motivation: 0.15,     // Psychological readiness
    overallFeeling: 0.20  // General wellbeing
  };
  
  // Invert fatigue and soreness (lower is better)
  const invertedFatigue = 11 - metrics.fatigue;
  const invertedSoreness = 11 - metrics.soreness;
  const invertedStress = 11 - metrics.stress;
  
  const weightedScore = 
    (invertedFatigue * weights.fatigue) +
    (invertedSoreness * weights.soreness) +
    (invertedStress * weights.stress) +
    (metrics.motivation * weights.motivation) +
    (metrics.overallFeeling * weights.overallFeeling);
  
  return Number(weightedScore.toFixed(1));
}

/**
 * Get wellness category based on score
 */
export function getWellnessCategory(score: number): {
  category: 'poor' | 'fair' | 'good' | 'excellent';
  color: string;
  description: string;
  recommendations: string[];
} {
  if (score < 4) {
    return {
      category: 'poor',
      color: '#FC8181',
      description: 'Poor wellness - High concern',
      recommendations: [
        'Consider rest day or very light activity',
        'Focus on sleep and nutrition',
        'Manage stress levels',
        'Consult with coach about training load'
      ]
    };
  } else if (score < 6) {
    return {
      category: 'fair',
      color: '#F6AD55',
      description: 'Fair wellness - Monitor closely',
      recommendations: [
        'Reduce training intensity',
        'Prioritize recovery strategies',
        'Ensure adequate sleep',
        'Consider stress management techniques'
      ]
    };
  } else if (score < 8) {
    return {
      category: 'good',
      color: '#68D391',
      description: 'Good wellness - Normal training',
      recommendations: [
        'Continue current training approach',
        'Maintain good recovery habits',
        'Monitor for any changes',
        'Keep up nutrition and hydration'
      ]
    };
  } else {
    return {
      category: 'excellent',
      color: '#4FD1C7',
      description: 'Excellent wellness - Optimal state',
      recommendations: [
        'Great condition for training',
        'Consider progressive overload',
        'Maintain current lifestyle habits',
        'Good time for challenging workouts'
      ]
    };
  }
}

/**
 * Calculate wellness trend over time
 */
export function calculateWellnessTrend(
  wellnessData: WellnessMetrics[],
  days: number = 7
): {
  trend: 'improving' | 'stable' | 'declining';
  changePercent: number;
  averageScore: number;
} {
  if (wellnessData.length < 2) {
    return { trend: 'stable', changePercent: 0, averageScore: 0 };
  }
  
  const sortedData = wellnessData
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-days);
  
  const scores = sortedData.map(data => calculateWellnessScore(data));
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  // Calculate trend using linear regression slope
  const n = scores.length;
  const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ...
  const sumY = scores.reduce((sum, score) => sum + score, 0);
  const sumXY = scores.reduce((sum, score, index) => sum + (index * score), 0);
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const changePercent = (slope / averageScore) * 100;
  
  let trend: 'improving' | 'stable' | 'declining';
  if (Math.abs(changePercent) < 2) {
    trend = 'stable';
  } else if (changePercent > 0) {
    trend = 'improving';
  } else {
    trend = 'declining';
  }
  
  return {
    trend,
    changePercent: Number(changePercent.toFixed(1)),
    averageScore: Number(averageScore.toFixed(1))
  };
}

/**
 * Identify wellness red flags
 */
export function identifyWellnessRedFlags(metrics: WellnessMetrics): string[] {
  const redFlags: string[] = [];
  
  if (metrics.fatigue >= 8) {
    redFlags.push('High fatigue levels detected');
  }
  
  if (metrics.soreness >= 8) {
    redFlags.push('Significant muscle soreness reported');
  }
  
  if (metrics.stress >= 8) {
    redFlags.push('High stress levels detected');
  }
  
  if (metrics.motivation <= 3) {
    redFlags.push('Very low motivation reported');
  }
  
  if (metrics.overallFeeling <= 3) {
    redFlags.push('Poor overall feeling reported');
  }
  
  if (metrics.sleepQuality && metrics.sleepQuality <= 4) {
    redFlags.push('Poor sleep quality reported');
  }
  
  if (metrics.sleepDuration && metrics.sleepDuration < 6) {
    redFlags.push('Insufficient sleep duration');
  }
  
  return redFlags;
}

/**
 * Generate wellness recommendations based on metrics
 */
export function generateWellnessRecommendations(metrics: WellnessMetrics): string[] {
  const recommendations: string[] = [];
  
  if (metrics.fatigue >= 7) {
    recommendations.push('Consider reducing training intensity or taking a rest day');
  }
  
  if (metrics.soreness >= 7) {
    recommendations.push('Focus on recovery strategies: stretching, massage, ice baths');
  }
  
  if (metrics.stress >= 7) {
    recommendations.push('Practice stress management: meditation, breathing exercises');
  }
  
  if (metrics.motivation <= 4) {
    recommendations.push('Consider lighter, more enjoyable training activities');
  }
  
  if (metrics.sleepQuality && metrics.sleepQuality <= 5) {
    recommendations.push('Improve sleep hygiene: consistent bedtime, cool room, no screens');
  }
  
  if (metrics.sleepDuration && metrics.sleepDuration < 7) {
    recommendations.push('Aim for 7-9 hours of sleep per night');
  }
  
  // Positive reinforcement
  if (calculateWellnessScore(metrics) >= 8) {
    recommendations.push('Excellent wellness state - great time for challenging training');
  }
  
  return recommendations;
}

/**
 * Validate wellness survey input
 */
export function validateWellnessMetrics(metrics: Partial<WellnessMetrics>): string[] {
  const errors: string[] = [];
  
  if (!metrics.date) errors.push('Date is required');
  
  const requiredFields = ['fatigue', 'soreness', 'stress', 'motivation', 'overallFeeling'];
  requiredFields.forEach(field => {
    const value = metrics[field as keyof WellnessMetrics] as number;
    if (!value || value < 1 || value > 10) {
      errors.push(`${field} must be between 1 and 10`);
    }
  });
  
  if (metrics.sleepDuration && (metrics.sleepDuration < 0 || metrics.sleepDuration > 24)) {
    errors.push('Sleep duration must be between 0 and 24 hours');
  }
  
  return errors;
} 