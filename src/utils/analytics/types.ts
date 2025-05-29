// Type definitions for analytics calculations

export interface TrainingLoadData {
  date: string;
  rpe: number;
  duration: number; // in minutes
  load: number; // calculated sRPE
  workoutType?: string;
}

export interface WellnessMetrics {
  date: string;
  fatigue: number; // 1-10 scale
  soreness: number; // 1-10 scale
  stress: number; // 1-10 scale
  motivation: number; // 1-10 scale
  overallFeeling: number; // 1-10 scale
  sleepQuality?: number; // 1-10 scale
  sleepDuration?: number; // hours
}

export interface PerformanceMetrics {
  athleteId: string;
  date: string;
  event: string;
  result: number;
  improvement?: number;
  personalBest?: boolean;
  conditions?: string;
  notes?: string;
}

export interface RiskAssessment {
  athleteId: string;
  date: string;
  acwr: number; // Acute:Chronic Workload Ratio
  atl: number; // Acute Training Load (7-day average)
  ctl: number; // Chronic Training Load (28-day average)
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  riskColor: 'green' | 'yellow' | 'orange' | 'red';
  recommendations: string[];
  wellnessScore?: number;
}

export interface RiskZone {
  min: number;
  max: number;
  level: 'low' | 'moderate' | 'high' | 'very-high';
  color: 'green' | 'yellow' | 'orange' | 'red';
  description: string;
  recommendations: string[];
}

export interface TrainingLoadTrend {
  date: string;
  atl: number;
  ctl: number;
  acwr: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
} 