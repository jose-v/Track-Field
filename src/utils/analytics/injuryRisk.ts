// Injury Risk Analysis Calculations
// Based on Acute:Chronic Workload Ratio (ACWR) methodology

import { TrainingLoadData, RiskAssessment, RiskZone, TrainingLoadTrend } from './types';

/**
 * Risk zones based on ACWR research
 */
export const RISK_ZONES: RiskZone[] = [
  {
    min: 0,
    max: 0.8,
    level: 'low',
    color: 'green',
    description: 'Undertraining - Low injury risk but potential for detraining',
    recommendations: [
      'Consider gradually increasing training load',
      'Monitor for signs of detraining',
      'Ensure adequate training stimulus'
    ]
  },
  {
    min: 0.8,
    max: 1.3,
    level: 'low',
    color: 'green',
    description: 'Optimal training zone - Lowest injury risk',
    recommendations: [
      'Maintain current training approach',
      'Continue monitoring wellness metrics',
      'Good balance of training and recovery'
    ]
  },
  {
    min: 1.3,
    max: 1.5,
    level: 'moderate',
    color: 'yellow',
    description: 'Elevated risk - Monitor closely',
    recommendations: [
      'Monitor wellness metrics closely',
      'Consider reducing training intensity',
      'Prioritize recovery strategies',
      'Ensure adequate sleep and nutrition'
    ]
  },
  {
    min: 1.5,
    max: 2.0,
    level: 'high',
    color: 'orange',
    description: 'High injury risk - Immediate attention needed',
    recommendations: [
      'Reduce training load immediately',
      'Increase recovery time between sessions',
      'Consider rest day or active recovery',
      'Consult with sports medicine professional'
    ]
  },
  {
    min: 2.0,
    max: Infinity,
    level: 'very-high',
    color: 'red',
    description: 'Very high injury risk - Critical intervention required',
    recommendations: [
      'Immediate training load reduction required',
      'Extended recovery period recommended',
      'Medical evaluation advised',
      'Review training program with coach'
    ]
  }
];

/**
 * Calculate daily training load using session RPE method
 * Formula: sRPE = RPE × Duration (minutes)
 */
export function calculateDailyTrainingLoad(rpe: number, duration: number): number {
  if (rpe < 1 || rpe > 10 || duration < 0) {
    throw new Error('Invalid input: RPE must be 1-10, duration must be positive');
  }
  return rpe * duration;
}

/**
 * Calculate Acute Training Load (ATL) - 7-day rolling average
 */
export function calculateATL(trainingLoads: TrainingLoadData[]): number {
  if (trainingLoads.length === 0) return 0;
  
  // Sort by date and take last 7 days
  const sortedLoads = trainingLoads
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);
  
  const totalLoad = sortedLoads.reduce((sum, data) => sum + data.load, 0);
  return totalLoad / 7;
}

/**
 * Calculate Chronic Training Load (CTL) - 28-day rolling average
 */
export function calculateCTL(trainingLoads: TrainingLoadData[]): number {
  if (trainingLoads.length === 0) return 0;
  
  // Sort by date and take last 28 days
  const sortedLoads = trainingLoads
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-28);
  
  const totalLoad = sortedLoads.reduce((sum, data) => sum + data.load, 0);
  return totalLoad / Math.min(28, sortedLoads.length);
}

/**
 * Calculate Acute:Chronic Workload Ratio (ACWR)
 */
export function calculateACWR(atl: number, ctl: number): number {
  if (ctl === 0) return 0;
  return Number((atl / ctl).toFixed(2));
}

/**
 * Determine risk level based on ACWR value
 */
export function getRiskZone(acwr: number): RiskZone {
  return RISK_ZONES.find(zone => acwr >= zone.min && acwr < zone.max) || RISK_ZONES[0];
}

/**
 * Generate comprehensive risk assessment
 */
export function generateRiskAssessment(
  athleteId: string,
  trainingLoads: TrainingLoadData[],
  date: string = new Date().toISOString().split('T')[0]
): RiskAssessment {
  const atl = calculateATL(trainingLoads);
  const ctl = calculateCTL(trainingLoads);
  const acwr = calculateACWR(atl, ctl);
  const riskZone = getRiskZone(acwr);
  
  return {
    athleteId,
    date,
    acwr,
    atl: Number(atl.toFixed(1)),
    ctl: Number(ctl.toFixed(1)),
    riskLevel: riskZone.level,
    riskColor: riskZone.color,
    recommendations: riskZone.recommendations
  };
}

/**
 * Calculate training load trend over time
 */
export function calculateTrainingLoadTrend(
  trainingLoads: TrainingLoadData[],
  days: number = 30
): TrainingLoadTrend[] {
  const sortedLoads = trainingLoads
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const trends: TrainingLoadTrend[] = [];
  
  // Calculate trend for each day
  for (let i = 0; i < sortedLoads.length; i++) {
    const currentDate = sortedLoads[i].date;
    const loadsUpToDate = sortedLoads.slice(0, i + 1);
    
    const atl = calculateATL(loadsUpToDate);
    const ctl = calculateCTL(loadsUpToDate);
    const acwr = calculateACWR(atl, ctl);
    const riskZone = getRiskZone(acwr);
    
    trends.push({
      date: currentDate,
      atl: Number(atl.toFixed(1)),
      ctl: Number(ctl.toFixed(1)),
      acwr: Number(acwr.toFixed(2)),
      riskLevel: riskZone.level
    });
  }
  
  return trends.slice(-days);
}

/**
 * Validate training load data
 */
export function validateTrainingLoadData(data: Partial<TrainingLoadData>): string[] {
  const errors: string[] = [];
  
  if (!data.date) errors.push('Date is required');
  if (!data.rpe || data.rpe < 1 || data.rpe > 10) errors.push('RPE must be between 1 and 10');
  if (!data.duration || data.duration < 0) errors.push('Duration must be positive');
  
  return errors;
} 