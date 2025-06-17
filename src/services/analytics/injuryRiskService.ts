// Injury Risk Service
// Handles data fetching for pre-calculated metrics from Supabase scheduled functions

import { supabase } from '../../lib/supabase';
import { TrainingLoadData, RiskAssessment } from '../../utils/analytics/types';

/**
 * Interface for pre-calculated daily metrics from scheduled functions
 */
export interface DailyMetrics {
  athlete_id: string;
  date: string;
  atl: number;  // Pre-calculated by scheduled function
  ctl: number;  // Pre-calculated by scheduled function
  daily_load: number;
  created_at: string;
}

/**
 * Fetch pre-calculated ATL/CTL metrics for an athlete
 * These are calculated by Supabase scheduled functions daily
 */
export async function fetchPreCalculatedMetrics(
  athleteId: string,
  days: number = 30
): Promise<DailyMetrics[]> {
  const { data, error } = await supabase
    .from('athlete_daily_metrics')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('date', { ascending: false })
    .limit(days);

  if (error) {
    console.error('Error fetching pre-calculated metrics:', error);
    throw new Error('Failed to fetch training metrics');
  }

  return data || [];
}

/**
 * Fetch recent training load entries for real-time calculations
 * Used when scheduled function hasn't run yet or for immediate feedback
 */
export async function fetchRecentTrainingLoads(
  athleteId: string,
  days: number = 7
): Promise<TrainingLoadData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('training_load_entries')
    .select('*')
    .eq('athlete_id', athleteId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching training loads:', error);
    throw new Error('Failed to fetch training load data');
  }

  return (data || []).map(entry => ({
    date: entry.date,
    rpe: entry.rpe,
    duration: entry.duration_minutes,
    load: entry.training_load,
    workoutType: entry.workout_type
  }));
}

/**
 * Save a new training load entry (triggers scheduled function recalculation)
 */
export async function saveTrainingLoadEntry(
  athleteId: string,
  workoutId: string,
  rpe: number,
  duration: number,
  workoutType?: string
): Promise<void> {
  const trainingLoad = rpe * duration;
  const date = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('training_load_entries')
    .insert({
      athlete_id: athleteId,
      workout_id: workoutId,
      date,
      rpe,
      duration_minutes: duration,
      training_load: trainingLoad,
      workout_type: workoutType || 'general'
    });

  if (error) {
    console.error('Error saving training load:', error);
    throw new Error('Failed to save training load');
  }

  // Trigger immediate recalculation for this athlete (optional)
  await triggerMetricsRecalculation(athleteId);
}

/**
 * Save risk assessment result
 */
export async function saveRiskAssessment(assessment: RiskAssessment): Promise<void> {
  const { error } = await supabase
    .from('injury_risk_assessments')
    .upsert({
      athlete_id: assessment.athleteId,
      assessment_date: assessment.date,
      acwr: assessment.acwr,
      atl: assessment.atl,
      ctl: assessment.ctl,
      risk_level: assessment.riskLevel,
      risk_color: assessment.riskColor,
      recommendations: assessment.recommendations,
      wellness_score: assessment.wellnessScore
    }, {
      onConflict: 'athlete_id,assessment_date'
    });

  if (error) {
    console.error('Error saving risk assessment:', error);
    throw new Error('Failed to save risk assessment');
  }
}

/**
 * Fetch historical risk assessments
 */
export async function fetchRiskHistory(
  athleteId: string,
  days: number = 30
): Promise<RiskAssessment[]> {
  const { data, error } = await supabase
    .from('injury_risk_assessments')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('assessment_date', { ascending: false })
    .limit(days);

  if (error) {
    console.error('Error fetching risk history:', error);
    throw new Error('Failed to fetch risk history');
  }

  return (data || []).map(record => ({
    athleteId: record.athlete_id,
    date: record.assessment_date,
    acwr: record.acwr,
    atl: record.atl,
    ctl: record.ctl,
    riskLevel: record.risk_level,
    riskColor: record.risk_color,
    recommendations: record.recommendations || [],
    wellnessScore: record.wellness_score
  }));
}

/**
 * Trigger immediate metrics recalculation for an athlete
 * Calls Supabase Edge Function to recalculate ATL/CTL
 */
export async function triggerMetricsRecalculation(athleteId: string): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('calculate-training-metrics', {
      body: { athleteId }
    });

    if (error) {
      console.warn('Metrics recalculation unavailable:', error.message || 'Edge function not accessible');
      // Don't throw - this is optional optimization
    } else {
      console.log('Metrics recalculation triggered successfully for athlete:', athleteId);
    }
  } catch (error) {
    console.warn('Metrics recalculation service temporarily unavailable:', error instanceof Error ? error.message : 'Network error');
    // Don't throw - this is optional optimization
  }
}

/**
 * Get current risk status for an athlete
 * Combines latest pre-calculated metrics with real-time data if needed
 */
export async function getCurrentRiskStatus(athleteId: string): Promise<{
  hasData: boolean;
  latestMetrics?: DailyMetrics;
  needsCalculation: boolean;
}> {
  const metrics = await fetchPreCalculatedMetrics(athleteId, 1);
  const latestMetrics = metrics[0];
  
  if (!latestMetrics) {
    return { hasData: false, needsCalculation: true };
  }

  // Check if metrics are from today
  const today = new Date().toISOString().split('T')[0];
  const needsCalculation = latestMetrics.date !== today;

  return {
    hasData: true,
    latestMetrics,
    needsCalculation
  };
}

/**
 * Batch fetch data for multiple athletes (coach view)
 */
export async function fetchTeamRiskOverview(athleteIds: string[]): Promise<{
  athleteId: string;
  latestRisk?: RiskAssessment;
  latestMetrics?: DailyMetrics;
}[]> {
  if (athleteIds.length === 0) return [];

  // Fetch latest metrics for all athletes
  const { data: metricsData, error: metricsError } = await supabase
    .from('athlete_daily_metrics')
    .select('*')
    .in('athlete_id', athleteIds)
    .order('date', { ascending: false });

  // Fetch latest risk assessments
  const { data: riskData, error: riskError } = await supabase
    .from('injury_risk_assessments')
    .select('*')
    .in('athlete_id', athleteIds)
    .order('assessment_date', { ascending: false });

  if (metricsError || riskError) {
    console.error('Error fetching team overview:', { metricsError, riskError });
    throw new Error('Failed to fetch team risk overview');
  }

  // Group by athlete and get latest for each
  const result = athleteIds.map(athleteId => {
    const latestMetrics = metricsData?.find(m => m.athlete_id === athleteId);
    const latestRiskData = riskData?.find(r => r.athlete_id === athleteId);
    
    const latestRisk = latestRiskData ? {
      athleteId: latestRiskData.athlete_id,
      date: latestRiskData.assessment_date,
      acwr: latestRiskData.acwr,
      atl: latestRiskData.atl,
      ctl: latestRiskData.ctl,
      riskLevel: latestRiskData.risk_level,
      riskColor: latestRiskData.risk_color,
      recommendations: latestRiskData.recommendations || [],
      wellnessScore: latestRiskData.wellness_score
    } : undefined;

    return {
      athleteId,
      latestRisk,
      latestMetrics
    };
  });

  return result;
} 