// Performance Analytics Utilities
// Handles sleep, recovery, and performance calculations

import { PerformanceMetrics } from './types';

/**
 * Sleep quality mapping between numeric values and text
 */
export const SLEEP_QUALITY_MAPPING = {
  1: 'poor',
  2: 'fair', 
  3: 'good',
  4: 'excellent'
} as const;

/**
 * Calculate sleep duration from start and end times
 * Handles sleep across midnight properly
 */
export function calculateSleepDuration(
  startTime: string, 
  endTime: string
): { hours: number; minutes: number; total: number } {
  if (!startTime || !endTime) {
    return { hours: 0, minutes: 0, total: 0 };
  }

  try {
    const start = new Date(`1970-01-01T${startTime}`);
    let end = new Date(`1970-01-01T${endTime}`);
    
    // If end time is earlier than start time, assume it's the next day
    if (end < start) {
      end = new Date(`1970-01-02T${endTime}`);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const totalHours = diffMs / (1000 * 60 * 60);
    
    return { 
      hours, 
      minutes, 
      total: Number(totalHours.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculating sleep duration:', error);
    return { hours: 0, minutes: 0, total: 0 };
  }
}

/**
 * Get sleep quality text from numeric value
 */
export function getSleepQualityText(qualityValue: number): string {
  return SLEEP_QUALITY_MAPPING[qualityValue as keyof typeof SLEEP_QUALITY_MAPPING] || 'unknown';
}

/**
 * Calculate sleep efficiency (time asleep / time in bed)
 */
export function calculateSleepEfficiency(
  timeAsleep: number, 
  timeInBed: number
): number {
  if (timeInBed === 0) return 0;
  return Number(((timeAsleep / timeInBed) * 100).toFixed(1));
}

/**
 * Analyze sleep quality trends over time
 */
export function analyzeSleepTrends(sleepRecords: Array<{
  date: string;
  duration: number;
  quality: number;
}>): {
  averageDuration: number;
  averageQuality: number;
  trend: 'improving' | 'stable' | 'declining';
  consistencyScore: number;
} {
  if (sleepRecords.length === 0) {
    return {
      averageDuration: 0,
      averageQuality: 0,
      trend: 'stable',
      consistencyScore: 0
    };
  }

  // Calculate averages
  const totalDuration = sleepRecords.reduce((sum, record) => sum + record.duration, 0);
  const totalQuality = sleepRecords.reduce((sum, record) => sum + record.quality, 0);
  const averageDuration = totalDuration / sleepRecords.length;
  const averageQuality = totalQuality / sleepRecords.length;

  // Calculate trend using linear regression on quality scores
  const n = sleepRecords.length;
  if (n < 2) {
    return {
      averageDuration: Number(averageDuration.toFixed(2)),
      averageQuality: Number(averageQuality.toFixed(1)),
      trend: 'stable',
      consistencyScore: 100
    };
  }

  const sumX = (n * (n - 1)) / 2;
  const sumY = sleepRecords.reduce((sum, record) => sum + record.quality, 0);
  const sumXY = sleepRecords.reduce((sum, record, index) => sum + (index * record.quality), 0);
  const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  let trend: 'improving' | 'stable' | 'declining';
  if (Math.abs(slope) < 0.1) {
    trend = 'stable';
  } else if (slope > 0) {
    trend = 'improving';
  } else {
    trend = 'declining';
  }

  // Calculate consistency score based on standard deviation
  const durationVariance = sleepRecords.reduce((sum, record) => 
    sum + Math.pow(record.duration - averageDuration, 2), 0) / n;
  const durationStdDev = Math.sqrt(durationVariance);
  const consistencyScore = Math.max(0, 100 - (durationStdDev * 10));

  return {
    averageDuration: Number(averageDuration.toFixed(2)),
    averageQuality: Number(averageQuality.toFixed(1)),
    trend,
    consistencyScore: Number(consistencyScore.toFixed(1))
  };
}

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  
  const birthDateObj = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = today.getMonth() - birthDateObj.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculate performance improvement percentage
 */
export function calculatePerformanceImprovement(
  currentTime: number,
  previousTime: number,
  eventType: 'time' | 'distance' | 'height'
): {
  improvement: number;
  isImprovement: boolean;
  description: string;
} {
  if (previousTime === 0) {
    return {
      improvement: 0,
      isImprovement: false,
      description: 'No previous record'
    };
  }

  let improvement: number;
  let isImprovement: boolean;

  if (eventType === 'time') {
    // For time-based events, lower is better
    improvement = ((previousTime - currentTime) / previousTime) * 100;
    isImprovement = currentTime < previousTime;
  } else {
    // For distance/height events, higher is better
    improvement = ((currentTime - previousTime) / previousTime) * 100;
    isImprovement = currentTime > previousTime;
  }

  const description = isImprovement 
    ? `${Math.abs(improvement).toFixed(1)}% improvement`
    : `${Math.abs(improvement).toFixed(1)}% decline`;

  return {
    improvement: Number(improvement.toFixed(2)),
    isImprovement,
    description
  };
}

/**
 * Format sleep duration for display
 */
export function formatSleepDuration(totalHours: number): string {
  if (!totalHours || totalHours === 0) return '0h 0m';
  
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours % 1) * 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Get sleep recommendations based on duration and quality
 */
export function getSleepRecommendations(
  averageDuration: number,
  averageQuality: number
): string[] {
  const recommendations: string[] = [];

  if (averageDuration < 7) {
    recommendations.push('Aim for 7-9 hours of sleep per night');
  }

  if (averageDuration > 9) {
    recommendations.push('Consider if you might be oversleeping - 7-9 hours is optimal');
  }

  if (averageQuality < 2.5) {
    recommendations.push('Focus on sleep hygiene: consistent bedtime, cool room, no screens before bed');
    recommendations.push('Consider consulting a healthcare provider about sleep quality');
  }

  if (averageQuality >= 3.5) {
    recommendations.push('Excellent sleep quality - keep up the good habits!');
  }

  return recommendations;
}

/**
 * Validate sleep record input
 */
export function validateSleepRecord(record: {
  startTime: string;
  endTime: string;
  quality: number;
  date: string;
}): string[] {
  const errors: string[] = [];

  if (!record.startTime) errors.push('Start time is required');
  if (!record.endTime) errors.push('End time is required');
  if (!record.date) errors.push('Date is required');
  
  if (record.quality < 1 || record.quality > 4) {
    errors.push('Sleep quality must be between 1 (poor) and 4 (excellent)');
  }

  if (record.startTime && record.endTime) {
    const duration = calculateSleepDuration(record.startTime, record.endTime);
    if (duration.total > 16) {
      errors.push('Sleep duration cannot exceed 16 hours');
    }
    if (duration.total < 0.5) {
      errors.push('Sleep duration must be at least 30 minutes');
    }
  }

  return errors;
} 